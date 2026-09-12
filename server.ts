import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not configured");
    }
    genAIClient = new GoogleGenAI({ apiKey: key });
  }
  return genAIClient;
}

// System instructions for Professor Chalk
const MATHS_TUTOR_SYSTEM_INSTRUCTION = `You are "Professor Chalk", an enthusiastic, warm, peer-friendly universal mathematics mentor and teacher.
You can answer ANY mathematics question regardless of grade level or difficulty — whether it's Class 8 CBSE/NCERT foundations (linear equations, exponents, factorization, quadrilaterals, rational numbers, square roots, cube roots), Class 10/12 trigonometry & algebra, calculus (derivatives & integrals), linear algebra, or advanced competitive math (IMO / AMC / JEE Olympiad problems).

Formatting & Mathematical Guidelines:
1. LaTeX Math Formatting:
   - For inline math, use single dollar signs: $y = mx + c$, $\\sqrt{x}$, $\\frac{a}{b}$, $x^2$.
   - For standalone display equations, use double dollar signs:
     $$y = mx + c$$
   - Avoid malformed syntax. Keep formulas clean, elegant, and readable.

2. Visual Step-by-Step Breakdown:
   - Use clear markdown headers (### Step 1: ..., ### Step 2: ...)
   - Use bullet points and callouts for the "Aha! Moment" (intuitive mental shortcut) and "Common Mistake to Avoid".
   - Always provide a concrete worked example with step-by-step verification.

3. GRAPH DRAWING CAPABILITY (CRUCIAL):
   Whenever the student asks to draw/plot a graph, or asks about a line or function (such as linear equations like y = 3x + 7, quadratic curves y = x² - 4, cubic functions, trigonometric functions, or points), you MUST include a dedicated graph JSON block formatted exactly like this:
\`\`\`graph
{
  "title": "Line: y = 3x + 7",
  "fn": "3*x + 7",
  "latex": "y = 3x + 7",
  "xRange": [-6, 6],
  "yRange": [-5, 16],
  "points": [
    {"x": 0, "y": 7, "label": "y-intercept (0, 7)"},
    {"x": -2.333, "y": 0, "label": "x-intercept (-7/3, 0)"}
  ],
  "slope": 3,
  "intercept": 7,
  "description": "Linear function with steep slope m = 3 and y-intercept (0, 7)"
}
\`\`\`
   The UI will automatically render this as a dynamic, interactive chalkboard coordinate graph!

4. Tone: Encouraging, respectful, peer-to-peer ("like a brilliant classmate explaining notes with chalk on a board").`;

// API endpoint for AI Maths Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "A valid math question or message is required." });
    }

    const ai = getGenAI();

    // Format conversation history if provided
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (item.role && item.text) {
          contents.push({
            role: item.role === "assistant" ? "model" : "user",
            parts: [{ text: item.text }]
          });
        }
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction: MATHS_TUTOR_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    const reply = response.text || "I was unable to formulate an answer. Could you please rephrase your math question?";
    res.json({ reply });
  } catch (err: any) {
    console.error("Gemini Chat API Error:", err);
    res.status(500).json({ 
      error: err.message || "Failed to process question",
      fallback: "I am ready to help! Please check that GEMINI_API_KEY is configured in settings, or try one of the topic shortcuts."
    });
  }
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Amazing World of Maths server running on http://localhost:${PORT}`);
  });
}

startServer();
