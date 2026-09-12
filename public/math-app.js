/* =========================================================================
   Amazing World of Maths - Interactive Engine
   Graphing Engine, Math Rendering, Roots Master Tables & Quizzes
   ========================================================================= */

(function() {
  'use strict';

  /* =========================================================================
     1. UNIVERSAL GRAPHING & CHALKBOARD DRAWING ENGINE
     ========================================================================= */
  let graphCounter = 0;

  /**
   * Safe, comprehensive mathematical function compiler.
   * Parses natural math syntax like '3x + 7', 'y = -2x + 6', 'x^2 - 4', 'sin(x)', '2(x-3)'
   * and extracts mathematical characteristics (slope, intercepts, vertex, roots).
   */
  function compileMathFunction(rawInput) {
    let s = (rawInput || '3*x + 7').toString().trim();
    // Strip equation prefixes like 'y =' or 'f(x) ='
    s = s.replace(/^(?:y|f\s*\(\s*x\s*\))\s*=\s*/i, '').trim();
    const cleanDisplay = s || '3*x + 7';

    // Normalize mathematical operators & unicode
    s = s.replace(/×/g, '*').replace(/÷/g, '/');
    s = s.replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4');
    s = s.replace(/π/g, 'Math.PI').replace(/\bpi\b/gi, 'Math.PI');
    s = s.replace(/√\s*\(([^)]+)\)/g, 'Math.sqrt($1)');
    s = s.replace(/√\s*([a-zA-Z0-9.]+)/g, 'Math.sqrt($1)');
    s = s.replace(/\|([^|]+)\|/g, 'Math.abs($1)');

    // Map common mathematical functions to Math.*
    const mathFuncs = ['sin', 'cos', 'tan', 'sqrt', 'cbrt', 'abs', 'log', 'exp', 'asin', 'acos', 'atan', 'floor', 'ceil', 'round'];
    mathFuncs.forEach(fn => {
      const regexParen = new RegExp('(?<!Math\\.)\\b' + fn + '\\s*\\(', 'gi');
      s = s.replace(regexParen, 'Math.' + fn + '(');
      const regexNoParen = new RegExp('(?<!Math\\.)\\b' + fn + '\\s+([a-zA-Z0-9_.]+)', 'gi');
      s = s.replace(regexNoParen, 'Math.' + fn + '($1)');
    });

    // Handle implicit multiplication (e.g. 2x, 3(x+1), )x, 4Math.sin)
    s = s.replace(/(\d+)\s*([xX])/g, '$1*$2');
    s = s.replace(/(\d+)\s*(Math\.[a-zA-Z]+)/g, '$1*$2');
    s = s.replace(/(\d+)\s*\(/g, '$1*(');
    s = s.replace(/\)\s*\(/g, ')*(');
    s = s.replace(/\)\s*([xX])/g, ')*$1');
    s = s.replace(/([xX])\s*\(/g, '$1*(');
    s = s.replace(/\)\s*(\d+)/g, ')*$1');
    s = s.replace(/\^/g, '**');
    s = s.replace(/\bX\b/g, 'x');

    let evalFn;
    try {
      evalFn = new Function('x', '"use strict"; return (' + s + ');');
      const test0 = evalFn(0);
      const test1 = evalFn(1);
      if (typeof test0 !== 'number' && typeof test1 !== 'number') {
        throw new Error('Expression did not produce numeric output');
      }
    } catch (err) {
      console.warn('Could not compile mathematical expression:', rawInput, err);
      evalFn = (x) => 3 * x + 7;
      s = '3*x + 7';
    }

    // Mathematical Analysis
    let isLinear = false;
    let slope = 0;
    let intercept = 0;
    let isQuadratic = false;
    let quadA = 0, quadB = 0, quadC = 0;
    const detectedPoints = [];
    let suggestedXRange = [-6, 6];
    let suggestedYRange = [-8, 16];

    try {
      const y0 = evalFn(0);
      const y1 = evalFn(1);
      const y2 = evalFn(2);
      const yNeg1 = evalFn(-1);

      if (isFinite(y0) && isFinite(y1) && isFinite(y2) && isFinite(yNeg1)) {
        const diff1 = y1 - y0;
        const diff2 = y2 - y1;

        // Linear check: constant first difference
        if (Math.abs(diff1 - diff2) < 1e-4) {
          isLinear = true;
          slope = Math.round(diff1 * 1000) / 1000;
          intercept = Math.round(y0 * 1000) / 1000;
          detectedPoints.push({ x: 0, y: intercept, label: `y-int (0, ${intercept})`, color: '#FBBF24' });

          if (slope !== 0) {
            const rootX = Math.round((-intercept / slope) * 100) / 100;
            detectedPoints.push({ x: rootX, y: 0, label: `x-int (${rootX}, 0)`, color: '#F87171' });
            const spanX = Math.max(Math.abs(rootX), 5) * 1.4;
            suggestedXRange = [-Math.round(spanX), Math.round(spanX)];
            const spanY = Math.max(Math.abs(intercept), 8) * 1.3;
            suggestedYRange = [-Math.round(spanY * 0.5), Math.round(spanY * 1.3)];
          }
        } else {
          // Quadratic check: f(x) = ax² + bx + c
          const a = (y1 + yNeg1 - 2 * y0) / 2;
          const b = (y1 - yNeg1) / 2;
          const c = y0;
          const test2 = a * 4 + b * 2 + c;

          if (Math.abs(y2 - test2) < 1e-4 && Math.abs(a) > 1e-4) {
            isQuadratic = true;
            quadA = Math.round(a * 1000) / 1000;
            quadB = Math.round(b * 1000) / 1000;
            quadC = Math.round(c * 1000) / 1000;

            const vx = -b / (2 * a);
            const vy = evalFn(vx);
            detectedPoints.push({
              x: Math.round(vx * 100) / 100,
              y: Math.round(vy * 100) / 100,
              label: `Vertex (${vx.toFixed(1)}, ${vy.toFixed(1)})`,
              color: '#FBBF24'
            });

            const disc = b * b - 4 * a * c;
            if (disc >= 0) {
              const r1 = (-b - Math.sqrt(disc)) / (2 * a);
              const r2 = (-b + Math.sqrt(disc)) / (2 * a);
              detectedPoints.push({ x: Math.round(r1 * 100) / 100, y: 0, label: `Root (${r1.toFixed(1)}, 0)`, color: '#F87171' });
              if (Math.abs(r1 - r2) > 0.05) {
                detectedPoints.push({ x: Math.round(r2 * 100) / 100, y: 0, label: `Root (${r2.toFixed(1)}, 0)`, color: '#F87171' });
              }
            }

            const spanX = Math.max(Math.abs(vx) + 4, 6);
            suggestedXRange = [Math.floor(vx - spanX), Math.ceil(vx + spanX)];
            if (a > 0) {
              suggestedYRange = [Math.floor(vy - 3), Math.ceil(vy + 18)];
            } else {
              suggestedYRange = [Math.floor(vy - 18), Math.ceil(vy + 3)];
            }
          }
        }
      }
    } catch (analysisErr) {
      console.warn('Curve analysis warning:', analysisErr);
    }

    return {
      rawInput: cleanDisplay,
      jsExpr: s,
      evalFn,
      isLinear,
      slope,
      intercept,
      isQuadratic,
      quadA,
      quadB,
      quadC,
      detectedPoints,
      suggestedXRange,
      suggestedYRange
    };
  }

  function renderInteractiveChalkboardGraph(container, config) {
    if (!container) return;

    // Compile formula to ensure robust evaluation across all equations
    const rawFn = config?.fn || config?.latex || '3*x + 7';
    const compiled = compileMathFunction(rawFn);

    const title = config?.title || `Chalkboard Graph: y = ${compiled.rawInput}`;
    const latex = config?.latex || `y = ${compiled.rawInput}`;
    let xRange = config?.xRange || compiled.suggestedXRange || [-6, 6];
    let yRange = config?.yRange || compiled.suggestedYRange || [-8, 16];
    let points = config?.points && config.points.length > 0 ? config.points : compiled.detectedPoints;

    let currentXRange = [...xRange];
    let currentYRange = [...yRange];
    let currentSlope = (config?.slope !== undefined && config?.slope !== null) ? Number(config.slope) : compiled.slope;
    let currentIntercept = (config?.intercept !== undefined && config?.intercept !== null) ? Number(config.intercept) : compiled.intercept;
    let currentQuadA = compiled.quadA || 1;
    let currentQuadC = compiled.quadC || 0;
    let isLinear = compiled.isLinear;
    let isQuadratic = compiled.isQuadratic;

    // Active live evaluation function (updates dynamically when sliders move)
    let currentEvalFn = compiled.evalFn;

    let showCrosshair = false;
    let crosshairMathX = 0;
    let crosshairMathY = 0;

    // Unique internal ID for child elements, PRESERVING container.id intact
    const instId = 'chalk_graph_' + (++graphCounter) + '_' + Math.floor(Math.random() * 10000);

    // Render HTML card inside mount
    container.innerHTML = `
      <div class="chalk-graph-card">
        <div class="chalk-graph-header">
          <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
            <span>📈</span>
            <strong style="color:#FEF08A; font-family:var(--font-display); font-size:0.95rem;">${escapeHtml(title)}</strong>
            <span style="font-size:0.75rem; background:#2A483B; color:#A7F3D0; padding:2px 8px; border-radius:4px; font-family:var(--font-mono); font-weight:700;">
              ${escapeHtml(latex)}
            </span>
          </div>
          <div class="chalk-btn-group">
            <button class="chalk-btn" id="btnZoomIn_${instId}" title="Zoom In">🔍 +</button>
            <button class="chalk-btn" id="btnZoomOut_${instId}" title="Zoom Out">🔍 −</button>
            <button class="chalk-btn" id="btnReset_${instId}" title="Reset View">↺ Reset</button>
            <button class="chalk-btn" id="btnSliders_${instId}" title="Toggle Real-time Parameter Sliders">🎚️ Sliders</button>
          </div>
        </div>

        <div class="chalk-graph-canvas-wrap" id="wrap_${instId}">
          <canvas class="chalk-graph-canvas" id="canvas_${instId}"></canvas>
          <div class="chalk-graph-tooltip" id="tooltip_${instId}"></div>
        </div>

        <div class="chalk-graph-points-pills" id="pills_${instId}">
          ${generatePillsHtml()}
        </div>

        <div id="sliderDrawer_${instId}" style="display:none; padding:0.75rem 1rem; background:#182F24; border-top:1px solid #274737; font-size:0.82rem; font-family:var(--font-mono); color:#E2E8F0;">
          ${generateSlidersHtml()}
        </div>
      </div>
    `;

    function generatePillsHtml() {
      if (isLinear) {
        return `
          <span class="chalk-point-tag">📍 y-intercept: (0, ${currentIntercept})</span>
          <span class="chalk-point-tag">📐 Slope m = ${currentSlope} (Rise ${currentSlope} / Run 1)</span>
          <span class="chalk-point-tag">📍 x-intercept: (${currentSlope !== 0 ? (-currentIntercept / currentSlope).toFixed(2) : 'none'}, 0)</span>
        `;
      } else if (isQuadratic) {
        const vx = compiled.quadB !== 0 ? -(compiled.quadB / (2 * currentQuadA)).toFixed(1) : 0;
        return `
          <span class="chalk-point-tag">📍 Vertex: (${vx}, ${currentEvalFn(Number(vx)).toFixed(1)})</span>
          <span class="chalk-point-tag">📐 Stretch a = ${currentQuadA}</span>
          <span class="chalk-point-tag">📍 Vertical Shift c = ${currentQuadC}</span>
        `;
      } else {
        return `
          <span class="chalk-point-tag">📍 Formula: y = ${escapeHtml(compiled.rawInput)}</span>
          <span class="chalk-point-tag">📐 Hover on curve to track coordinates</span>
        `;
      }
    }

    function generateSlidersHtml() {
      if (isLinear) {
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; flex-wrap:wrap; gap:0.5rem;">
            <label>Slope (m): <strong id="valSlope_${instId}" style="color:#FEF08A; font-size:0.95rem;">${currentSlope}</strong> <span style="color:#94A3B8; font-size:0.75rem;">(Rotates line tilt)</span></label>
            <input type="range" id="sliderSlope_${instId}" min="-8" max="8" step="0.5" value="${currentSlope}" style="width:160px; accent-color:#F59E0B; cursor:pointer;">
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <label>y-Intercept (c): <strong id="valInt_${instId}" style="color:#FEF08A; font-size:0.95rem;">${currentIntercept}</strong> <span style="color:#94A3B8; font-size:0.75rem;">(Shifts line vertically)</span></label>
            <input type="range" id="sliderInt_${instId}" min="-20" max="20" step="1" value="${currentIntercept}" style="width:160px; accent-color:#F59E0B; cursor:pointer;">
          </div>
        `;
      } else if (isQuadratic) {
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; flex-wrap:wrap; gap:0.5rem;">
            <label>Parabola Stretch (a): <strong id="valQuadA_${instId}" style="color:#FEF08A; font-size:0.95rem;">${currentQuadA}</strong> <span style="color:#94A3B8; font-size:0.75rem;">(Curves / flips parabola)</span></label>
            <input type="range" id="sliderQuadA_${instId}" min="-4" max="4" step="0.5" value="${currentQuadA}" style="width:160px; accent-color:#F59E0B; cursor:pointer;">
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <label>Vertical Shift (c): <strong id="valQuadC_${instId}" style="color:#FEF08A; font-size:0.95rem;">${currentQuadC}</strong> <span style="color:#94A3B8; font-size:0.75rem;">(Shifts vertex vertically)</span></label>
            <input type="range" id="sliderQuadC_${instId}" min="-15" max="15" step="1" value="${currentQuadC}" style="width:160px; accent-color:#F59E0B; cursor:pointer;">
          </div>
        `;
      } else {
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <label>Vertical Shift (c): <strong id="valShift_${instId}" style="color:#FEF08A; font-size:0.95rem;">0</strong> <span style="color:#94A3B8; font-size:0.75rem;">(Translates curve up/down)</span></label>
            <input type="range" id="sliderShift_${instId}" min="-10" max="10" step="0.5" value="0" style="width:160px; accent-color:#F59E0B; cursor:pointer;">
          </div>
        `;
      }
    }

    const canvas = document.getElementById(`canvas_${instId}`);
    const wrap = document.getElementById(`wrap_${instId}`);
    const tooltip = document.getElementById(`tooltip_${instId}`);
    const ctx = canvas.getContext('2d');

    function draw() {
      if (!wrap || !canvas) return;
      const width = wrap.clientWidth || 320;
      const height = 290;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.resetTransform ? ctx.resetTransform() : ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const xMin = currentXRange[0];
      const xMax = currentXRange[1];
      const yMin = currentYRange[0];
      const yMax = currentYRange[1];

      function toScreenX(x) {
        return ((x - xMin) / (xMax - xMin)) * width;
      }
      function toScreenY(y) {
        return height - ((y - yMin) / (yMax - yMin)) * height;
      }

      // 1. Chalkboard Background
      ctx.fillStyle = '#14281F';
      ctx.fillRect(0, 0, width, height);

      // 2. Grid lines
      ctx.strokeStyle = '#203D2F';
      ctx.lineWidth = 1;

      const xSpan = xMax - xMin;
      const xStep = xSpan > 25 ? 5 : (xSpan > 12 ? 2 : 1);
      const firstX = Math.ceil(xMin / xStep) * xStep;

      for (let x = firstX; x <= xMax; x += xStep) {
        const sx = toScreenX(x);
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
        ctx.stroke();

        if (x !== 0) {
          ctx.fillStyle = '#64748B';
          ctx.font = '10px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          const zeroY = toScreenY(0);
          const textY = Math.min(Math.max(zeroY + 14, 12), height - 6);
          ctx.fillText(x.toString(), sx, textY);
        }
      }

      const ySpan = yMax - yMin;
      const yStep = ySpan > 25 ? 5 : (ySpan > 12 ? 2 : 1);
      const firstY = Math.ceil(yMin / yStep) * yStep;

      for (let y = firstY; y <= yMax; y += yStep) {
        const sy = toScreenY(y);
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);
        ctx.stroke();

        if (y !== 0) {
          ctx.fillStyle = '#64748B';
          ctx.font = '10px JetBrains Mono, monospace';
          ctx.textAlign = 'right';
          const zeroX = toScreenX(0);
          const textX = Math.min(Math.max(zeroX - 6, 20), width - 6);
          ctx.fillText(y.toString(), textX, sy + 3);
        }
      }

      // 3. Coordinate Axes
      const originX = toScreenX(0);
      const originY = toScreenY(0);

      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2;

      // X Axis
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(width, originY);
      ctx.stroke();

      // X Arrow
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.moveTo(width, originY);
      ctx.lineTo(width - 8, originY - 4);
      ctx.lineTo(width - 8, originY + 4);
      ctx.fill();

      // Y Axis
      ctx.beginPath();
      ctx.moveTo(originX, height);
      ctx.lineTo(originX, 0);
      ctx.stroke();

      // Y Arrow
      ctx.beginPath();
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX - 4, 8);
      ctx.lineTo(originX + 4, 8);
      ctx.fill();

      // Origin text
      ctx.fillStyle = '#CBD5E1';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText('0', originX - 6, originY + 14);

      // Axis labels
      ctx.fillStyle = '#FDE68A';
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText('X', width - 12, originY - 8);
      ctx.textAlign = 'left';
      ctx.fillText('Y', originX + 8, 14);

      // 4. Slope Triangle (Rise / Run) for Linear
      if (isLinear) {
        const p1x = 0;
        const p1y = currentIntercept;
        const p2x = 1;
        const p2y = currentSlope * 1 + currentIntercept;

        const sp1x = toScreenX(p1x);
        const sp1y = toScreenY(p1y);
        const sp2x = toScreenX(p2x);
        const sp2y = toScreenY(p2y);

        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sp1x, sp1y);
        ctx.lineTo(sp2x, sp1y);
        ctx.stroke();

        ctx.strokeStyle = '#F472B6';
        ctx.beginPath();
        ctx.moveTo(sp2x, sp1y);
        ctx.lineTo(sp2x, sp2y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillStyle = '#38BDF8';
        ctx.textAlign = 'center';
        ctx.fillText('Run = 1', (sp1x + sp2x) / 2, sp1y + 12);

        ctx.fillStyle = '#F472B6';
        ctx.textAlign = 'left';
        ctx.fillText(`Rise = ${currentSlope}`, sp2x + 6, (sp1y + sp2y) / 2);
      }

      // 5. Curve Plotting with Discontinuity Protection
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
      ctx.shadowBlur = 6;

      ctx.beginPath();
      const numPoints = 320;
      let started = false;
      let prevMathY = null;

      for (let i = 0; i <= numPoints; i++) {
        const mathX = xMin + (i / numPoints) * (xMax - xMin);
        let mathY;
        try {
          mathY = currentEvalFn(mathX);
        } catch (e) {
          mathY = NaN;
        }

        if (isNaN(mathY) || !isFinite(mathY)) {
          started = false;
          prevMathY = null;
          continue;
        }

        // Asymptote jump protection (e.g. 1/x or tan(x))
        if (prevMathY !== null && Math.abs(mathY - prevMathY) > (yMax - yMin) * 0.9 && (mathY * prevMathY < 0)) {
          started = false;
        }
        prevMathY = mathY;

        const sx = toScreenX(mathX);
        const sy = toScreenY(mathY);

        if (sy >= -200 && sy <= height + 200) {
          if (!started) {
            ctx.moveTo(sx, sy);
            started = true;
          } else {
            ctx.lineTo(sx, sy);
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 6. Highlight Key Points (Intercepts, Vertex, Roots)
      const keyPoints = [];
      if (isLinear) {
        keyPoints.push({ x: 0, y: currentIntercept, label: `(0, ${currentIntercept})`, color: '#FBBF24' });
        if (currentSlope !== 0) {
          const rootX = -currentIntercept / currentSlope;
          keyPoints.push({ x: rootX, y: 0, label: `(${rootX.toFixed(2)}, 0)`, color: '#F87171' });
        }
      } else if (isQuadratic) {
        const vx = compiled.quadB !== 0 ? -compiled.quadB / (2 * currentQuadA) : 0;
        const vy = currentEvalFn(vx);
        keyPoints.push({ x: vx, y: vy, label: `Vertex (${vx.toFixed(1)}, ${vy.toFixed(1)})`, color: '#FBBF24' });
      } else if (Array.isArray(points) && points.length > 0) {
        points.forEach(pt => keyPoints.push({ x: pt.x, y: pt.y, label: pt.label || `(${pt.x}, ${pt.y})`, color: '#FBBF24' }));
      }

      keyPoints.forEach(pt => {
        const sx = toScreenX(pt.x);
        const sy = toScreenY(pt.y);

        if (sx >= 0 && sx <= width && sy >= 0 && sy <= height) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.beginPath();
          ctx.arc(sx, sy, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 10px JetBrains Mono, monospace';
          ctx.textAlign = pt.x < 0 ? 'right' : 'left';
          ctx.fillText(pt.label, sx + (pt.x < 0 ? -8 : 8), sy - 6);
        }
      });

      // 7. Interactive Crosshair Tracking
      if (showCrosshair) {
        const cx = toScreenX(crosshairMathX);
        const cy = toScreenY(crosshairMathY);

        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = '#FDE68A';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(width, cy);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Mouse Tracking
    wrap.addEventListener('mousemove', (e) => {
      const rect = wrap.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const mathX = currentXRange[0] + (mx / rect.width) * (currentXRange[1] - currentXRange[0]);
      let mathY;
      try {
        mathY = currentEvalFn(mathX);
      } catch (err) {
        mathY = 0;
      }

      showCrosshair = true;
      crosshairMathX = mathX;
      crosshairMathY = mathY;
      draw();

      tooltip.style.display = 'block';
      tooltip.innerHTML = `x: <strong>${mathX.toFixed(2)}</strong>, y: <strong>${isFinite(mathY) ? mathY.toFixed(2) : 'undef'}</strong>`;
      const tipX = Math.min(mx + 12, rect.width - 120);
      const tipY = Math.max(e.clientY - rect.top - 34, 8);
      tooltip.style.left = `${tipX}px`;
      tooltip.style.top = `${tipY}px`;
    });

    wrap.addEventListener('mouseleave', () => {
      showCrosshair = false;
      tooltip.style.display = 'none';
      draw();
    });

    // Touch Support
    wrap.addEventListener('touchmove', (e) => {
      if (!e.touches[0]) return;
      const rect = wrap.getBoundingClientRect();
      const mx = e.touches[0].clientX - rect.left;
      const mathX = currentXRange[0] + (mx / rect.width) * (currentXRange[1] - currentXRange[0]);
      let mathY;
      try {
        mathY = currentEvalFn(mathX);
      } catch (err) {
        mathY = 0;
      }

      showCrosshair = true;
      crosshairMathX = mathX;
      crosshairMathY = mathY;
      draw();

      tooltip.style.display = 'block';
      tooltip.innerHTML = `x: <strong>${mathX.toFixed(2)}</strong>, y: <strong>${isFinite(mathY) ? mathY.toFixed(2) : 'undef'}</strong>`;
      tooltip.style.left = `${Math.min(mx + 8, rect.width - 110)}px`;
      tooltip.style.top = `12px`;
    }, { passive: true });

    wrap.addEventListener('touchend', () => {
      showCrosshair = false;
      tooltip.style.display = 'none';
      draw();
    });

    // Controls: Zoom and Reset
    document.getElementById(`btnZoomIn_${instId}`).onclick = () => {
      const cx = (currentXRange[0] + currentXRange[1]) / 2;
      const cy = (currentYRange[0] + currentYRange[1]) / 2;
      const hx = (currentXRange[1] - currentXRange[0]) * 0.4;
      const hy = (currentYRange[1] - currentYRange[0]) * 0.4;
      currentXRange = [cx - hx, cx + hx];
      currentYRange = [cy - hy, cy + hy];
      draw();
    };

    document.getElementById(`btnZoomOut_${instId}`).onclick = () => {
      const cx = (currentXRange[0] + currentXRange[1]) / 2;
      const cy = (currentYRange[0] + currentYRange[1]) / 2;
      const hx = (currentXRange[1] - currentXRange[0]) * 0.65;
      const hy = (currentYRange[1] - currentYRange[0]) * 0.65;
      currentXRange = [cx - hx, cx + hx];
      currentYRange = [cy - hy, cy + hy];
      draw();
    };

    document.getElementById(`btnReset_${instId}`).onclick = () => {
      currentXRange = [...xRange];
      currentYRange = [...yRange];
      draw();
    };

    // Sliders drawer toggle
    const sliderDrawer = document.getElementById(`sliderDrawer_${instId}`);
    document.getElementById(`btnSliders_${instId}`).onclick = () => {
      sliderDrawer.style.display = sliderDrawer.style.display === 'none' ? 'block' : 'none';
    };

    // Slider inputs wiring
    const pills = document.getElementById(`pills_${instId}`);

    if (isLinear) {
      const sSlope = document.getElementById(`sliderSlope_${instId}`);
      const sInt = document.getElementById(`sliderInt_${instId}`);
      const vSlope = document.getElementById(`valSlope_${instId}`);
      const vInt = document.getElementById(`valInt_${instId}`);

      sSlope.oninput = () => {
        currentSlope = Number(sSlope.value);
        vSlope.textContent = currentSlope;
        currentEvalFn = (x) => currentSlope * x + currentIntercept;
        updatePills();
        draw();
      };

      sInt.oninput = () => {
        currentIntercept = Number(sInt.value);
        vInt.textContent = currentIntercept;
        currentEvalFn = (x) => currentSlope * x + currentIntercept;
        updatePills();
        draw();
      };
    } else if (isQuadratic) {
      const sQuadA = document.getElementById(`sliderQuadA_${instId}`);
      const sQuadC = document.getElementById(`sliderQuadC_${instId}`);
      const vQuadA = document.getElementById(`valQuadA_${instId}`);
      const vQuadC = document.getElementById(`valQuadC_${instId}`);

      sQuadA.oninput = () => {
        currentQuadA = Number(sQuadA.value);
        vQuadA.textContent = currentQuadA;
        currentEvalFn = (x) => currentQuadA * x * x + (compiled.quadB || 0) * x + currentQuadC;
        updatePills();
        draw();
      };

      sQuadC.oninput = () => {
        currentQuadC = Number(sQuadC.value);
        vQuadC.textContent = currentQuadC;
        currentEvalFn = (x) => currentQuadA * x * x + (compiled.quadB || 0) * x + currentQuadC;
        updatePills();
        draw();
      };
    } else {
      const sShift = document.getElementById(`sliderShift_${instId}`);
      const vShift = document.getElementById(`valShift_${instId}`);
      if (sShift && vShift) {
        sShift.oninput = () => {
          const shift = Number(sShift.value);
          vShift.textContent = shift;
          currentEvalFn = (x) => compiled.evalFn(x) + shift;
          draw();
        };
      }
    }

    function updatePills() {
      if (pills) pills.innerHTML = generatePillsHtml();
    }

    setTimeout(draw, 50);
    window.addEventListener('resize', draw);
  }

  // Standalone function grapher panel controls
  window.toggleGrapherPanel = function() {
    const panel = document.getElementById('grapherPanel');
    const btn = document.getElementById('toggleGrapherBtn');
    if (!panel) return;
    if (panel.style.display === 'none' || panel.style.display === '') {
      panel.style.display = 'block';
      if (btn) btn.innerHTML = '<span>▲ Close Grapher</span>';
      window.plotCustomGraphFromInput();
    } else {
      panel.style.display = 'none';
      if (btn) btn.innerHTML = '<span>▼ Open Grapher</span>';
    }
  };

  window.plotCustomGraphFromInput = function() {
    const input = document.getElementById('customGraphFnInput');
    const fnStr = input ? input.value.trim() : '3*x + 7';
    const mount = document.getElementById('standaloneGraphMount');
    if (!mount) {
      console.warn('standaloneGraphMount element not found');
      return;
    }

    const compiled = compileMathFunction(fnStr);
    renderInteractiveChalkboardGraph(mount, {
      title: `Chalkboard Graph: y = ${compiled.rawInput}`,
      fn: compiled.jsExpr,
      latex: `y = ${compiled.rawInput}`,
      xRange: compiled.suggestedXRange,
      yRange: compiled.suggestedYRange,
      slope: compiled.slope,
      intercept: compiled.intercept,
      points: compiled.detectedPoints
    });
  };

  window.loadGraphPreset = function(fnStr) {
    const input = document.getElementById('customGraphFnInput');
    if (input) input.value = fnStr;
    window.plotCustomGraphFromInput();
  };

  /* =========================================================================
     2. LATEX & MARKDOWN FORMATTING WITH GRAPH MOUNTING
     ========================================================================= */
  function renderMathFallback(code, isBlock) {
    let clean = code
      .replace(/\\mathbf\{([^}]+)\}/g, '<b>$1</b>')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="math-fallback-fraction"><span class="math-fallback-num">$1</span><span class="math-fallback-den">$2</span></span>')
      .replace(/\\sqrt\[3\]\{([^}]+)\}/g, '∛($1)')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\times/g, '×')
      .replace(/\\cdot/g, '·')
      .replace(/\\pm/g, '±')
      .replace(/\\le/g, '≤')
      .replace(/\\ge/g, '≥')
      .replace(/\\ne/g, '≠')
      .replace(/\\approx/g, '≈')
      .replace(/\\rightarrow/g, '→')
      .replace(/\\implies/g, '⟹')
      .replace(/\\Delta/g, 'Δ');

    if (isBlock) {
      return `<div class="katex-display"><span class="math-fallback" style="font-family:var(--font-mono); font-weight:700; color:#1E3A8A; font-size:1.1em;">${clean}</span></div>`;
    } else {
      return `<span class="math-fallback" style="font-family:var(--font-mono); font-weight:600; color:#1E3A8A;">${clean}</span>`;
    }
  }

  function renderFormula(code, isBlock) {
    if (window.katex && typeof window.katex.renderToString === 'function') {
      try {
        return window.katex.renderToString(code.trim(), {
          displayMode: isBlock,
          throwOnError: false
        });
      } catch (e) {
        return renderMathFallback(code, isBlock);
      }
    }
    return renderMathFallback(code, isBlock);
  }

  window.formatMathText = function(rawText) {
    let text = rawText || '';

    // 1. Extract ```graph blocks
    const graphs = [];
    text = text.replace(/```graph\s*([\s\S]*?)```/gi, (match, jsonStr) => {
      const id = 'chalk_graph_msg_' + (++graphCounter) + '_' + Math.floor(Math.random() * 1000);
      let parsed = null;
      try {
        parsed = JSON.parse(jsonStr.trim());
      } catch (e) {
        console.warn('Invalid graph JSON block:', e);
      }
      if (parsed) {
        graphs.push({ id, config: parsed });
        return `\n\n<div class="chalk-graph-mount-point" id="${id}" data-graph="${encodeURIComponent(JSON.stringify(parsed))}"></div>\n\n`;
      }
      return match;
    });

    // 2. Auto-generate graph block if response specifically discusses y = 3x + 7 or plotting a line
    if (graphs.length === 0 && (text.includes('y = 3x + 7') || text.includes('3x + 7') || text.includes('Graph of Linear Equation') || (text.includes('slope') && text.includes('intercept') && text.includes('y =')))) {
      const id = 'chalk_graph_msg_' + (++graphCounter);
      const autoConfig = {
        title: "Chalkboard Graph: y = 3x + 7",
        fn: "3*x + 7",
        latex: "y = 3x + 7",
        xRange: [-6, 6],
        yRange: [-5, 16],
        slope: 3,
        intercept: 7,
        points: [
          { x: 0, y: 7, label: "y-intercept (0, 7)" },
          { x: -2.333, y: 0, label: "x-intercept (-7/3, 0)" }
        ]
      };
      text += `\n\n<div class="chalk-graph-mount-point" id="${id}" data-graph="${encodeURIComponent(JSON.stringify(autoConfig))}"></div>\n\n`;
    }

    // 3. Extract display LaTeX $$...$$ and \[...\]
    const displayMath = [];
    text = text.replace(/(\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$)/g, (match) => {
      const token = `%%MATH_DISP_${displayMath.length}%%`;
      let content = '';
      if (match.startsWith('\\[') && match.endsWith('\\]')) {
        content = match.slice(2, -2);
      } else {
        content = match.slice(2, -2);
      }
      displayMath.push(content.trim());
      return token;
    });

    // 4. Extract inline LaTeX $...$ and \(...\)
    const inlineMath = [];
    text = text.replace(/(\\\([\s\S]*?\\\)|\$([^\$\n\r]+?)\$)/g, (match, p1, p2) => {
      const token = `%%MATH_INL_${inlineMath.length}%%`;
      let content = '';
      if (match.startsWith('\\(') && match.endsWith('\\)')) {
        content = match.slice(2, -2);
      } else {
        content = p2 || match.slice(1, -1);
      }
      inlineMath.push(content.trim());
      return token;
    });

    // 5. Parse Markdown
    let html = '';
    if (window.marked && typeof window.marked.parse === 'function') {
      html = window.marked.parse(text, { breaks: true, gfm: true });
    } else {
      let esc = escapeHtml(text);
      esc = esc.replace(/^### (.*$)/gim, '<h3>$1</h3>');
      esc = esc.replace(/^## (.*$)/gim, '<h2>$1</h2>');
      esc = esc.replace(/^# (.*$)/gim, '<h1>$1</h1>');
      esc = esc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      esc = esc.replace(/\*(.*?)\*/g, '<em>$1</em>');
      esc = esc.replace(/`([^`]+)`/g, '<code>$1</code>');
      esc = esc.replace(/^\s*[-*•]\s+(.*)$/gim, '<li>$1</li>');
      esc = esc.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
      esc = esc.replace(/\n\n/g, '</p><p>');
      esc = esc.replace(/\n/g, '<br>');
      html = `<p>${esc}</p>`;
    }

    // 6. Restore display math
    displayMath.forEach((mathCode, idx) => {
      const rendered = renderFormula(mathCode, true);
      html = html.replace(`%%MATH_DISP_${idx}%%`, rendered);
    });

    // 7. Restore inline math
    inlineMath.forEach((mathCode, idx) => {
      const rendered = renderFormula(mathCode, false);
      html = html.replace(`%%MATH_INL_${idx}%%`, rendered);
    });

    return html;
  };

  // Chat message appender with mount trigger
  window.appendMessage = function(role, rawContent) {
    const chatThread = document.getElementById('chatThread');
    if (!chatThread) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${role === 'user' ? 'user' : 'model'}`;

    const senderName = role === 'user' ? 'You' : '🎓 Professor Chalk • AI Tutor';
    const formattedBubble = role === 'user' 
      ? `<p>${escapeHtml(rawContent).replace(/\n/g, '<br>')}</p>` 
      : window.formatMathText(rawContent);

    msgDiv.innerHTML = `
      <div class="msg-sender-name">
        <span>${role === 'user' ? '✎' : '🎓'}</span> ${senderName}
      </div>
      <div class="msg-bubble">
        ${formattedBubble}
      </div>
    `;

    chatThread.appendChild(msgDiv);
    chatThread.scrollTop = chatThread.scrollHeight;

    // Render interactive graphs mounted in this bubble
    msgDiv.querySelectorAll('.chalk-graph-mount-point').forEach(mount => {
      try {
        const rawData = mount.getAttribute('data-graph');
        if (rawData) {
          const config = JSON.parse(decodeURIComponent(rawData));
          renderInteractiveChalkboardGraph(mount, config);
        }
      } catch (err) {
        console.error("Failed to mount chalkboard graph:", err);
      }
    });

    // Render mathematical expressions within message
    if (window.renderAllMath) {
      window.renderAllMath(msgDiv);
    }

    return msgDiv;
  };

  /* =========================================================================
     3. MASTER REFERENCE TABLES (SQUARES 1-30, CUBES 1-20)
     ========================================================================= */
  const SQUARES_DATA = [
    { n: 1, val: 1, unit: 1, prime: "1", note: "Smallest square; unit digit 1" },
    { n: 2, val: 4, unit: 4, prime: "2²", note: "Even square" },
    { n: 3, val: 9, unit: 9, prime: "3²", note: "Ends in 9" },
    { n: 4, val: 16, unit: 6, prime: "2⁴", note: "Even square ends in 6" },
    { n: 5, val: 25, unit: 5, prime: "5²", note: "Always ends in 25" },
    { n: 6, val: 36, unit: 6, prime: "2² × 3²", note: "Ends in 6" },
    { n: 7, val: 49, unit: 9, prime: "7²", note: "Ends in 9" },
    { n: 8, val: 64, unit: 4, prime: "2⁶", note: "Square of 8 AND cube of 4" },
    { n: 9, val: 81, unit: 1, prime: "3⁴", note: "Ends in 1" },
    { n: 10, val: 100, unit: 0, prime: "2² × 5²", note: "Ends in even count of zeroes" },
    { n: 11, val: 121, unit: 1, prime: "11²", note: "Palindromic number 121" },
    { n: 12, val: 144, unit: 4, prime: "2⁴ × 3²", note: "One gross (12 dozen)" },
    { n: 13, val: 169, unit: 9, prime: "13²", note: "Reverse of 14² (169 ↔ 196)" },
    { n: 14, val: 196, unit: 6, prime: "2² × 7²", note: "Reverse of 13² (196 ↔ 169)" },
    { n: 15, val: 225, unit: 5, prime: "3² × 5²", note: "Shortcut: 1 × 2 = 2 → 225" },
    { n: 16, val: 256, unit: 6, prime: "2⁸", note: "Power of two (2⁸)" },
    { n: 17, val: 289, unit: 9, prime: "17²", note: "Prime squared" },
    { n: 18, val: 324, unit: 4, prime: "2² × 3⁴", note: "Ends in 4" },
    { n: 19, val: 361, unit: 1, prime: "19²", note: "(20 − 1)² = 400 − 40 + 1" },
    { n: 20, val: 400, unit: 0, prime: "2⁴ × 5²", note: "20² = 400" },
    { n: 21, val: 441, unit: 1, prime: "3² × 7²", note: "(20 + 1)² = 400 + 40 + 1" },
    { n: 22, val: 484, unit: 4, prime: "2² × 11²", note: "Palindromic number 484" },
    { n: 23, val: 529, unit: 9, prime: "23²", note: "Prime squared" },
    { n: 24, val: 576, unit: 6, prime: "2⁶ × 3²", note: "Key NCERT square" },
    { n: 25, val: 625, unit: 5, prime: "5⁴", note: "Shortcut: 2 × 3 = 6 → 625" },
    { n: 26, val: 676, unit: 6, prime: "2² × 13²", note: "Palindromic 676" },
    { n: 27, val: 729, unit: 9, prime: "3⁶", note: "Square of 27 AND cube of 9 (9³=729)" },
    { n: 28, val: 784, unit: 4, prime: "2⁴ × 7²", note: "Ends in 4" },
    { n: 29, val: 841, unit: 1, prime: "29²", note: "(30 − 1)² = 900 − 60 + 1" },
    { n: 30, val: 900, unit: 0, prime: "2² × 3² × 5²", note: "30² = 900" }
  ];

  const CUBES_DATA = [
    { n: 1, val: 1, unit: 1, prime: "1", note: "1 ends in 1" },
    { n: 2, val: 8, unit: 8, prime: "2³", note: "2 ends in 8 (2+8=10)" },
    { n: 3, val: 27, unit: 7, prime: "3³", note: "3 ends in 7 (3+7=10)" },
    { n: 4, val: 64, unit: 4, prime: "2⁶", note: "4 ends in 4; square of 8" },
    { n: 5, val: 125, unit: 5, prime: "5³", note: "5 ends in 5" },
    { n: 6, val: 216, unit: 6, prime: "2³ × 3³", note: "6 ends in 6" },
    { n: 7, val: 343, unit: 3, prime: "7³", note: "7 ends in 3 (7+3=10)" },
    { n: 8, val: 512, unit: 2, prime: "2⁹", note: "8 ends in 2 (8+2=10)" },
    { n: 9, val: 729, unit: 9, prime: "3⁶", note: "9 ends in 9; 27² = 729" },
    { n: 10, val: 1000, unit: 0, prime: "2³ × 5³", note: "Ends in 3 zeroes" },
    { n: 11, val: 1331, unit: 1, prime: "11³", note: "Palindromic 1331" },
    { n: 12, val: 1728, unit: 8, prime: "2⁶ × 3³", note: "Hardy-Ramanujan number minus 1" },
    { n: 13, val: 2197, unit: 7, prime: "13³", note: "Ends in 7" },
    { n: 14, val: 2744, unit: 4, prime: "2³ × 7³", note: "Ends in 4" },
    { n: 15, val: 3375, unit: 5, prime: "3³ × 5³", note: "Ends in 5" },
    { n: 16, val: 4096, unit: 6, prime: "2¹²", note: "2¹² = 64² = 4096" },
    { n: 17, val: 4913, unit: 3, prime: "17³", note: "Ends in 3 (17 → 3)" },
    { n: 18, val: 5832, unit: 2, prime: "2³ × 3⁶", note: "Ends in 2 (18 → 2)" },
    { n: 19, val: 6859, unit: 9, prime: "19³", note: "Ends in 9" },
    { n: 20, val: 8000, unit: 0, prime: "2⁶ × 5³", note: "Ends in 000" }
  ];

  window.initRootsMasterTables = function() {
    const sqBody = document.getElementById('squaresTableBody');
    const cbBody = document.getElementById('cubesTableBody');

    if (sqBody) {
      sqBody.innerHTML = SQUARES_DATA.map(item => `
        <tr data-n="${item.n}" data-val="${item.val}" data-unit="${item.unit}">
          <td><strong>${item.n}</strong></td>
          <td style="font-weight:700; color:#B45309;">${item.val}</td>
          <td style="color:#059669; font-weight:700;">√${item.val} = ${item.n}</td>
          <td><span class="unit-digit-badge">${item.unit}</span></td>
          <td style="font-family:var(--font-mono); color:#475569;">${item.prime}</td>
          <td style="font-size:0.84rem; color:#64748B;">${item.note}</td>
        </tr>
      `).join('');
    }

    if (cbBody) {
      cbBody.innerHTML = CUBES_DATA.map(item => `
        <tr data-n="${item.n}" data-val="${item.val}" data-unit="${item.unit}">
          <td><strong>${item.n}</strong></td>
          <td style="font-weight:700; color:#1D4ED8;">${item.val}</td>
          <td style="color:#059669; font-weight:700;">∛${item.val} = ${item.n}</td>
          <td><span class="unit-digit-badge" style="background:#DBEAFE; color:#1E40AF;">${item.unit}</span></td>
          <td style="font-family:var(--font-mono); color:#475569;">${item.prime}</td>
          <td style="font-size:0.84rem; color:#64748B;">${item.note}</td>
        </tr>
      `).join('');
    }
  };

  window.switchRootsTableTab = function(tab, btn) {
    document.querySelectorAll('.roots-master-tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const vSq = document.getElementById('tableSquaresView');
    const vCb = document.getElementById('tableCubesView');
    const vFp = document.getElementById('tableFingerprintsView');

    if (vSq) vSq.style.display = tab === 'squares' ? 'block' : 'none';
    if (vCb) vCb.style.display = tab === 'cubes' ? 'block' : 'none';
    if (vFp) vFp.style.display = tab === 'fingerprints' ? 'block' : 'none';
  };

  window.filterRootsTable = function(query) {
    const q = (query || '').trim().toLowerCase();
    const rows = document.querySelectorAll('.roots-table tbody tr');
    rows.forEach(r => {
      const text = r.textContent.toLowerCase();
      r.style.display = text.includes(q) ? '' : 'none';
    });
  };

  /* =========================================================================
     4. NUMBER & ROOT INSPECTOR
     ========================================================================= */
  window.quickInspect = function(val) {
    const input = document.getElementById('inspectorNumberInput');
    if (input) input.value = val;
    window.inspectNumber(val);
  };

  window.inspectNumber = function(customVal) {
    const input = document.getElementById('inspectorNumberInput');
    const num = customVal || (input ? parseInt(input.value, 10) : 5041);
    if (!num || num <= 0 || isNaN(num)) return;

    const resultsGrid = document.getElementById('inspectorResultsGrid');
    if (!resultsGrid) return;

    let temp = num;
    const factors = [];
    for (let d = 2; d * d <= temp; d++) {
      while (temp % d === 0) {
        factors.push(d);
        temp /= d;
      }
    }
    if (temp > 1) factors.push(temp);

    const counts = {};
    factors.forEach(f => { counts[f] = (counts[f] || 0) + 1; });

    let isSquare = true;
    let sqrtVal = 1;
    let squarePairsStr = [];
    for (let f in counts) {
      if (counts[f] % 2 !== 0) isSquare = false;
      const pairs = Math.floor(counts[f] / 2);
      sqrtVal *= Math.pow(Number(f), pairs);
      for (let p = 0; p < pairs; p++) {
        squarePairsStr.push(`(${f} × ${f})`);
      }
    }

    let isCube = true;
    let cbrtVal = 1;
    let cubeTripletsStr = [];
    for (let f in counts) {
      if (counts[f] % 3 !== 0) isCube = false;
      const triplets = Math.floor(counts[f] / 3);
      cbrtVal *= Math.pow(Number(f), triplets);
      for (let t = 0; t < triplets; t++) {
        cubeTripletsStr.push(`(${f} × ${f} × ${f})`);
      }
    }

    const unitDigit = num % 10;
    const forbiddenEndings = [2, 3, 7, 8];
    const isForbidden = forbiddenEndings.includes(unitDigit);

    resultsGrid.innerHTML = `
      <div class="inspector-result-card" style="border-color:${isSquare ? '#10B981' : '#F59E0B'};">
        <div style="font-size:0.78rem; font-family:var(--font-mono); color:#64748B; text-transform:uppercase;">Square Analysis</div>
        <div style="font-size:1.15rem; font-weight:700; color:${isSquare ? '#065F46' : '#1E293B'}; margin:0.3rem 0;">
          ${isSquare ? `✓ Perfect Square: √${num} = ${sqrtVal}` : `Not a perfect square (√${num} ≈ ${Math.sqrt(num).toFixed(3)})`}
        </div>
        <div style="font-size:0.85rem; color:#475569;">
          ${isSquare 
            ? `<strong>Factor Pairs:</strong> ${squarePairsStr.join(' × ')} = ${sqrtVal}`
            : (isForbidden ? `<span style="color:#DC2626; font-weight:600;">Forbidden unit digit (${unitDigit})! Cannot be a square.</span>` : `Unpaired prime factors present.`)}
        </div>
      </div>

      <div class="inspector-result-card" style="border-color:${isCube ? '#3B82F6' : '#CBD5E1'};">
        <div style="font-size:0.78rem; font-family:var(--font-mono); color:#64748B; text-transform:uppercase;">Cube Analysis</div>
        <div style="font-size:1.15rem; font-weight:700; color:${isCube ? '#1E40AF' : '#1E293B'}; margin:0.3rem 0;">
          ${isCube ? `✓ Perfect Cube: ∛${num} = ${cbrtVal}` : `Not a perfect cube (∛${num} ≈ ${Math.cbrt(num).toFixed(3)})`}
        </div>
        <div style="font-size:0.85rem; color:#475569;">
          ${isCube ? `<strong>Factor Triplets:</strong> ${cubeTripletsStr.join(' × ')} = ${cbrtVal}` : `Prime factors do not group into triplets.`}
        </div>
      </div>

      <div class="inspector-result-card">
        <div style="font-size:0.78rem; font-family:var(--font-mono); color:#64748B; text-transform:uppercase;">Prime Factorization</div>
        <div style="font-family:var(--font-mono); font-size:1rem; font-weight:700; color:#B45309; margin:0.3rem 0;">
          ${num} = ${factors.length > 0 ? factors.join(' × ') : num}
        </div>
        <div style="font-size:0.82rem; color:#64748B;">
          Distinct prime bases: ${Object.keys(counts).join(', ')}
        </div>
      </div>

      <div class="inspector-result-card">
        <div style="font-size:0.78rem; font-family:var(--font-mono); color:#64748B; text-transform:uppercase;">Unit Digit Fingerprint</div>
        <div style="font-size:1rem; font-weight:700; color:#1E293B; margin:0.3rem 0;">
          Ends in: <span style="color:#D97706; font-size:1.2rem; font-weight:700;">${unitDigit}</span>
        </div>
        <div style="font-size:0.82rem; color:#64748B;">
          ${unitDigit === 0 ? 'Ends in 0 (must have even count for squares)' : (unitDigit === 5 ? 'Ends in 5 (root must end in 5)' : (isForbidden ? 'Ends in 2, 3, 7, or 8 (strictly forbidden for squares)' : 'Allowed square ending'))}
        </div>
      </div>
    `;
  };

  /* =========================================================================
     5. SPEED FLASHCARD TABLE DRILL
     ========================================================================= */
  const DRILL_DECK = [
    { q: "What is 14²?", a: "196", hint: "Hint: Reverse of 13² (169 ↔ 196)" },
    { q: "What is 15²?", a: "225", hint: "Hint: 1 × 2 = 2 → ends in 25" },
    { q: "What is 16²?", a: "256", hint: "Hint: 2⁸ (standard computer byte)" },
    { q: "What is 17²?", a: "289", hint: "Hint: Ends in 9 (7 × 7 = 49)" },
    { q: "What is 18²?", a: "324", hint: "Hint: Ends in 4 (8 × 8 = 64)" },
    { q: "What is 19²?", a: "361", hint: "Hint: (20 − 1)² = 400 − 40 + 1" },
    { q: "What is 21²?", a: "441", hint: "Hint: (20 + 1)² = 400 + 40 + 1" },
    { q: "What is 24²?", a: "576", hint: "Hint: Key Class 8 benchmark" },
    { q: "What is 25²?", a: "625", hint: "Hint: 2 × 3 = 6 → 625" },
    { q: "What is 26²?", a: "676", hint: "Hint: Palindromic square 676" },
    { q: "What is 27²?", a: "729", hint: "Hint: Also equal to 9³ = 729!" },
    { q: "What is 7³?", a: "343", hint: "Hint: 7 ends in 3 (7+3=10)" },
    { q: "What is 8³?", a: "512", hint: "Hint: 8 ends in 2 (2⁹)" },
    { q: "What is 9³?", a: "729", hint: "Hint: 9 ends in 9; 27² = 729" },
    { q: "What is 11³?", a: "1331", hint: "Hint: Beautiful palindromic cube" },
    { q: "What is 12³?", a: "1728", hint: "Hint: Hardy-Ramanujan number minus 1" },
    { q: "What is √5041?", a: "71", hint: "Hint: 70² = 4900, ends in 1" },
    { q: "What is ∛17576?", a: "26", hint: "Hint: Group 17 → 2, group 576 ends in 6" }
  ];

  let currentDrillIdx = 0;
  let drillStreak = 0;
  let drillCardFlipped = false;

  window.renderDrillCard = function() {
    const card = DRILL_DECK[currentDrillIdx % DRILL_DECK.length];
    const qEl = document.getElementById('drillCardQuestion');
    const hEl = document.getElementById('drillCardHint');
    const aEl = document.getElementById('drillCardAnswer');
    const sEl = document.getElementById('drillStreakDisplay');

    if (qEl) qEl.textContent = card.q;
    if (hEl) hEl.textContent = '(Click card or tap to reveal answer)';
    if (aEl) {
      aEl.textContent = card.a + ' (' + card.hint + ')';
      aEl.style.display = 'none';
    }
    if (sEl) sEl.textContent = drillStreak;
    drillCardFlipped = false;
  };

  window.flipDrillCard = function() {
    const aEl = document.getElementById('drillCardAnswer');
    const hEl = document.getElementById('drillCardHint');
    if (!aEl) return;
    if (!drillCardFlipped) {
      aEl.style.display = 'block';
      if (hEl) hEl.textContent = 'Revealed! Did you know it?';
      drillCardFlipped = true;
    } else {
      aEl.style.display = 'none';
      if (hEl) hEl.textContent = '(Click card to reveal)';
      drillCardFlipped = false;
    }
  };

  window.nextDrillCard = function() {
    currentDrillIdx = (currentDrillIdx + 1) % DRILL_DECK.length;
    window.renderDrillCard();
  };

  window.submitDrillScore = function(knewIt) {
    if (knewIt) {
      drillStreak++;
    } else {
      drillStreak = 0;
    }
    window.nextDrillCard();
  };

  /* =========================================================================
     6. EXPANDED QUIZ BANK & ENGINE
     ========================================================================= */
  window.QUIZ_BANK = {
    divisibility: [
      {
        q: "What is the fast divisibility rule to check if 7,812 is divisible by 4 without doing long division?",
        opts: [
          "Check if the sum of all digits is divisible by 4",
          "Check if the last two digits (12) form a number divisible by 4",
          "Check if the units digit (2) is even",
          "Subtract the even place digits from the odd place digits"
        ],
        ans: 1,
        exp: "A number is divisible by 4 if and only if its last two digits form a multiple of 4. Since 12 ÷ 4 = 3, 7,812 is divisible by 4!"
      },
      {
        q: "For a number to be divisible by 6, which two conditions must BOTH be satisfied simultaneously?",
        opts: [
          "Must end in 6 and sum of digits must be 6",
          "Must be divisible by 2 (even) AND divisible by 3 (digit sum divisible by 3)",
          "Must be divisible by 3 and divisible by 4",
          "Must end in 0, 2, 4, 6, or 8 only"
        ],
        ans: 1,
        exp: "Because 6 = 2 × 3 (co-prime factors), any number divisible by 6 must be an even number whose sum of digits is a multiple of 3."
      },
      {
        q: "Why is 2,915 divisible by 11 using the alternating sum rule?",
        opts: [
          "Sum of all digits (2+9+1+5 = 17) is divisible by 11",
          "Last two digits (15) are divisible by 11",
          "(5 + 9) − (1 + 2) = 14 − 3 = 11, which is a multiple of 11",
          "It ends in a 5"
        ],
        ans: 2,
        exp: "Rule for 11: (Sum of digits at odd places from right) − (Sum of digits at even places) must be 0 or a multiple of 11. Here: (5 + 9) − (1 + 2) = 14 − 3 = 11!"
      },
      {
        q: "If a number is divisible by 9, what can you conclude about its sum of digits?",
        opts: [
          "The sum of its digits must be a multiple of 9",
          "The sum of its digits must be equal to 9",
          "The last digit must be 9",
          "The sum of its digits must be an even number"
        ],
        ans: 0,
        exp: "Any integer is congruent to the sum of its digits modulo 9. If the digit sum is divisible by 9, the original number is divisible by 9."
      },
      {
        q: "Which test checks divisibility by 8?",
        opts: [
          "Last digit is 8",
          "Last two digits are divisible by 8",
          "The number formed by the last three digits must be divisible by 8",
          "Sum of digits is divisible by 8"
        ],
        ans: 2,
        exp: "Because 1000 = 8 × 125, the thousands place and above are always divisible by 8. So only the last 3 digits determine divisibility by 8!"
      }
    ],
    algebra: [
      {
        q: "Expand (3x + 4)². Which identity applies and what is the result?",
        opts: [
          "9x² + 16 (using (a+b)² = a² + b²)",
          "9x² + 24x + 16 (using (a+b)² = a² + 2ab + b²)",
          "6x² + 24x + 8",
          "9x² + 12x + 16"
        ],
        ans: 1,
        exp: "(a + b)² = a² + 2ab + b². Here a = 3x and b = 4. So a² = 9x², 2ab = 2(3x)(4) = 24x, and b² = 16. Total = 9x² + 24x + 16!"
      },
      {
        q: "Calculate 98² mentally using standard Class 8 algebraic identities:",
        opts: [
          "(100 − 2)² = 10,000 − 400 + 4 = 9,604",
          "(90 + 8)² = 8,100 + 720 + 64 = 8,884",
          "(100 − 2)² = 10,000 − 4 = 9,996",
          "98 × 100 − 98 × 2 = 9,600"
        ],
        ans: 0,
        exp: "Using (a − b)² = a² − 2ab + b² with a = 100 and b = 2: 100² − 2(100)(2) + 2² = 10,000 − 400 + 4 = 9,604!"
      },
      {
        q: "Evaluate 105 × 95 in your head without doing vertical multiplication:",
        opts: [
          "(100 + 5)(100 − 5) = 100² − 5² = 10,000 − 25 = 9,975",
          "(100 + 5) × 95 = 9,500 + 475 = 9,975",
          "(100)² − 5 = 9,995",
          "100 × 90 + 5 × 5 = 9,025"
        ],
        ans: 0,
        exp: "Identity 3: (a + b)(a − b) = a² − b². Here 105 = 100 + 5 and 95 = 100 − 5. So 100² − 5² = 10,000 − 25 = 9,975!"
      },
      {
        q: "Using Property 4: (x + a)(x + b) = x² + (a + b)x + ab, what is (x + 3)(x − 5)?",
        opts: [
          "x² − 15",
          "x² − 2x − 15",
          "x² + 2x − 15",
          "x² − 8x − 15"
        ],
        ans: 1,
        exp: "Here a = 3 and b = −5. The middle coefficient is a + b = 3 + (−5) = −2. The constant is a × b = 3 × (−5) = −15. Result: x² − 2x − 15."
      },
      {
        q: "What is the common student misconception when expanding (x + y)²?",
        opts: [
          "Forgetting the middle term 2xy and writing x² + y²",
          "Writing 2x + 2y",
          "Multiplying x and y first",
          "Assuming x and y must be positive"
        ],
        ans: 0,
        exp: "The 'Freshman's Dream' error is writing (x + y)² = x² + y². Geometrically, this ignores the two corner rectangles each of area x × y!"
      }
    ],
    triangles: [
      {
        q: "Why is AAA (Angle-Angle-Angle) NOT a valid congruence criterion for triangles?",
        opts: [
          "Angles cannot be measured accurately",
          "AAA triangles have the same shape but can have completely different sizes (similarity, not congruence)",
          "The sum of angles in a triangle is only 180°",
          "It only works for equilateral triangles"
        ],
        ans: 1,
        exp: "Equal corresponding angles ensure that triangles are SIMILAR (same proportions), but not necessarily CONGRUENT (same size). A tiny 30-60-90 triangle is not congruent to a billboard-sized 30-60-90 triangle!"
      },
      {
        q: "Under the SAS (Side-Angle-Side) criterion, where must the angle be located?",
        opts: [
          "Anywhere in the triangle",
          "Must be the INCLUDED angle between the two known sides",
          "Opposite to the longer side",
          "Must be an acute angle"
        ],
        ans: 1,
        exp: "For SAS congruence, the angle MUST be strictly between (included by) the two known sides. SSA (Side-Side-Angle) is ambiguous and not a congruence criterion."
      },
      {
        q: "What does the RHS congruence criterion stand for?",
        opts: [
          "Right angle, Hypotenuse, and any one Side",
          "Ratio, Height, and Side",
          "Right side, Horizontal, and Slope",
          "Radius, Height, and Surface"
        ],
        ans: 0,
        exp: "RHS stands for Right angle (90°), Hypotenuse (longest side opposite 90°), and one Side. If these match in two right triangles, they are congruent by Pythagorean theorem."
      },
      {
        q: "If △ABC ≅ △PQR, which corresponding part is correct by CPCTC?",
        opts: [
          "AB = QR",
          "∠B = ∠Q and AC = PR",
          "∠A = ∠R",
          "BC = PQ"
        ],
        ans: 1,
        exp: "Corresponding Parts of Congruent Triangles are Congruent (CPCTC). The order of letters matters: A↔P, B↔Q, C↔R. Thus ∠B = ∠Q and AC = PR!"
      },
      {
        q: "Which of the following sets of triangle conditions is GUARANTEED to produce congruence?",
        opts: [
          "SSA (Side-Side-Angle)",
          "AAA (Angle-Angle-Angle)",
          "ASA (Angle-Side-Angle with included side)",
          "ASS (Angle-Side-Side)"
        ],
        ans: 2,
        exp: "ASA guarantees unique triangle shape and size because fixing two angles and the included distance locks all vertices in place."
      }
    ],
    squares: [
      {
        q: "Which digits can NEVER appear as the units digit of a perfect square in base 10?",
        opts: [
          "0, 1, 4, 9",
          "2, 3, 7, 8",
          "5, 6",
          "1, 5, 9"
        ],
        ans: 1,
        exp: "Single-digit squares are: 0, 1, 4, 9, 16, 25, 36, 49, 64, 81. Their units digits are only 0, 1, 4, 5, 6, or 9. Numbers ending in 2, 3, 7, or 8 can NEVER be perfect squares!"
      },
      {
        q: "What is the square root of 5,041 found via the Class 8 Long Division method?",
        opts: [
          "69",
          "71",
          "79",
          "81"
        ],
        ans: 1,
        exp: "Pairing 50 41: nearest square to 50 is 7² = 49 (rem 1). Bring down 41 → 141. Double 7 gives 14. 141 × 1 = 141. Remainder = 0. Therefore √5041 = 71!"
      },
      {
        q: "The sum of the first 'n' consecutive odd natural numbers (1 + 3 + 5 + ... + (2n - 1)) is always equal to:",
        opts: [
          "2n + 1",
          "n²",
          "n(n + 1)",
          "n³"
        ],
        ans: 1,
        exp: "1 = 1², 1 + 3 = 4 = 2², 1 + 3 + 5 = 9 = 3², 1 + 3 + 5 + 7 = 16 = 4². The sum of the first n odd numbers is always exactly n²!"
      },
      {
        q: "Why is 225 a perfect square under prime factorization?",
        opts: [
          "225 = 3 × 3 × 5 × 5 = (3 × 5)² = 15² (all prime exponents are even)",
          "225 ends in 25",
          "2 + 2 + 5 = 9",
          "It is divisible by 5"
        ],
        ans: 0,
        exp: "In prime factorization, an integer is a square if and only if EVERY prime factor appears in pairs (even exponents): 3² × 5² = (3 × 5)² = 15²!"
      },
      {
        q: "Without calculating, what will be the units digit of 87²?",
        opts: [
          "7",
          "9",
          "3",
          "1"
        ],
        ans: 1,
        exp: "Because 7 × 7 = 49, the square of any number ending in 7 will always end in 9!"
      }
    ],
    cubes: [
      {
        q: "What is the cube root of 17,576 using the 3-second NCERT Estimation Method?",
        opts: [
          "24",
          "26",
          "36",
          "16"
        ],
        ans: 1,
        exp: "Split into two groups: 17 and 576. The group 576 ends in 6, so units digit is 6. The group 17 lies between 2³=8 and 3³=27, so tens digit is 2. Result = 26!"
      },
      {
        q: "What is the Ramanujan-Hardy number (1729) minus 1, and what is its cube root?",
        opts: [
          "1728, and its cube root is 12",
          "1728, and its cube root is 14",
          "1730, and its cube root is 13",
          "1700, and its cube root is 11"
        ],
        ans: 0,
        exp: "1729 − 1 = 1728. Since 12³ = 1728, ∛1728 = 12!"
      },
      {
        q: "In base 10, which pairs of cube unit digits follow the 10's complement rule?",
        opts: [
          "1 and 9",
          "2 ↔ 8 (2+8=10) and 3 ↔ 7 (3+7=10)",
          "4 and 6",
          "5 and 0"
        ],
        ans: 1,
        exp: "Numbers ending in 2 have cubes ending in 8 (and vice versa: 2 ↔ 8). Numbers ending in 3 have cubes ending in 7 (and vice versa: 3 ↔ 7). Both sum to 10!"
      },
      {
        q: "How many prime factors of the SAME kind must group together to form a perfect cube?",
        opts: [
          "Pairs of 2",
          "Triplets of 3",
          "Groups of 4",
          "Any odd number"
        ],
        ans: 1,
        exp: "Because (p^k)³ = p^(3k), cubing triples all exponents. Thus, taking a cube root requires grouping prime factors into TRIPLETS of 3!"
      },
      {
        q: "What is the cube of (−5)?",
        opts: [
          "−125",
          "+125",
          "−25",
          "+25"
        ],
        ans: 0,
        exp: "(−5)³ = (−5) × (−5) × (−5) = (+25) × (−5) = −125. An odd power of a negative number is always negative!"
      }
    ],
    tables_drill: [
      {
        q: "Speed Test: What is 19²?",
        opts: ["341", "361", "381", "391"],
        ans: 1,
        exp: "19² = (20 − 1)² = 400 − 40 + 1 = 361!"
      },
      {
        q: "Speed Test: What is 24²?",
        opts: ["526", "576", "626", "476"],
        ans: 1,
        exp: "24² = 576. (Notice: 24² + 7² = 576 + 49 = 625 = 25² Pythagorean triplet!)"
      },
      {
        q: "Speed Test: What is 14²?",
        opts: ["169", "184", "196", "216"],
        ans: 2,
        exp: "14² = 196. Remember the reflection trick: 13² = 169 ↔ 14² = 196!"
      },
      {
        q: "Speed Test: What is 8³?",
        opts: ["256", "512", "1024", "484"],
        ans: 1,
        exp: "8³ = (2³)³ = 2⁹ = 512!"
      },
      {
        q: "Speed Test: What is 25²?",
        opts: ["525", "625", "725", "675"],
        ans: 1,
        exp: "25² = 625. Shortcut for numbers ending in 5: 2 × 3 = 6, followed by 25 = 625!"
      }
    ],
    olympiad: [
      {
        q: "What is the remainder when 2²⁰²⁴ is divided by 3?",
        opts: [
          "0",
          "1",
          "2",
          "Cannot be determined without calculator"
        ],
        ans: 1,
        exp: "Notice 2 ≡ −1 (mod 3). Therefore, 2²⁰²⁴ ≡ (−1)²⁰²⁴ (mod 3). Since 2024 is an even power, (−1)²⁰²⁴ = +1. The remainder is 1!"
      },
      {
        q: "How many zero digits are at the end of 25! (25 factorial)?",
        opts: [
          "4",
          "5",
          "6",
          "8"
        ],
        ans: 2,
        exp: "Using Legendre's formula for factor of 5: ⌊25/5⌋ + ⌊25/25⌋ = 5 + 1 = 6 trailing zeros!"
      },
      {
        q: "If x + 1/x = 5, what is the exact value of x² + 1/x²?",
        opts: [
          "25",
          "23",
          "27",
          "21"
        ],
        ans: 1,
        exp: "Square both sides: (x + 1/x)² = 5² => x² + 2(x)(1/x) + 1/x² = 25 => x² + 2 + 1/x² = 25 => x² + 1/x² = 23!"
      },
      {
        q: "A clock strikes 6 times in 5 seconds. How many seconds will it take to strike 12 times?",
        opts: [
          "10 seconds",
          "11 seconds",
          "12 seconds",
          "9.5 seconds"
        ],
        ans: 1,
        exp: "6 strikes have 5 intervals between them, taking 5 seconds (1 second per interval). 12 strikes have 11 intervals, taking 11 × 1 = 11 seconds!"
      },
      {
        q: "If a² − b² = 19 where a and b are positive integers, what is the value of 'a'?",
        opts: [
          "9",
          "10",
          "19",
          "11"
        ],
        ans: 1,
        exp: "Identity 3: (a − b)(a + b) = 19. Since 19 is prime, its only integer factors are 1 and 19. So a − b = 1 and a + b = 19. Adding both equations gives 2a = 20 => a = 10 (and b = 9: 100 − 81 = 19 ✓)!"
      }
    ],
    linear: [
      {
        q: "Solve the linear equation: 5x − 7 = 2x + 8. What is the value of x?",
        opts: ["3", "5", "1", "15"],
        ans: 1,
        exp: "Transpose 2x to LHS and −7 to RHS: 5x − 2x = 8 + 7 => 3x = 15 => x = 5!"
      },
      {
        q: "In the rational equation (x + 1)/(2x + 3) = 3/8, what is the value of x after cross-multiplication?",
        opts: ["x = 0.5", "x = 1/2", "x = 0.5", "x = 0.5 or 1/2"],
        ans: 3,
        exp: "Cross-multiply: 8(x + 1) = 3(2x + 3) => 8x + 8 = 6x + 9 => 8x − 6x = 9 − 8 => 2x = 1 => x = 1/2 (0.5)!"
      },
      {
        q: "Two numbers are in the ratio 5 : 3. If they differ by 18, what are the numbers?",
        opts: ["45 and 27", "50 and 32", "30 and 12", "60 and 36"],
        ans: 0,
        exp: "Let numbers be 5x and 3x. Their difference: 5x − 3x = 18 => 2x = 18 => x = 9. The numbers are 5(9) = 45 and 3(9) = 27!"
      },
      {
        q: "A sum of ₹800 is in the form of ₹10 and ₹20 currency notes. If the total number of notes is 50, how many ₹20 notes are there?",
        opts: ["20 notes", "30 notes", "25 notes", "35 notes"],
        ans: 1,
        exp: "Let number of ₹20 notes be x. Then ₹10 notes = 50 − x. Total value: 20x + 10(50 − x) = 800 => 20x + 500 − 10x = 800 => 10x = 300 => x = 30!"
      },
      {
        q: "What is the slope (m) and y-intercept of the line 4x − 2y = 10?",
        opts: [
          "Slope = 2, y-intercept = −5",
          "Slope = 4, y-intercept = 10",
          "Slope = −2, y-intercept = 5",
          "Slope = 1/2, y-intercept = −5"
        ],
        ans: 0,
        exp: "Rewrite in slope-intercept form y = mx + c: −2y = −4x + 10 => y = 2x − 5. Hence slope m = 2 and y-intercept is (0, −5)!"
      }
    ],
    exponents: [
      {
        q: "What is the value of (3/4)⁻³ expressed as a positive fraction?",
        opts: ["64/27", "27/64", "−27/64", "9/16"],
        ans: 0,
        exp: "Negative exponent rule: (a/b)⁻ᵐ = (b/a)ᵐ. Therefore (3/4)⁻³ = (4/3)³ = 64/27!"
      },
      {
        q: "Simplify: 2²⁰ − 2¹⁹. What is the exact value?",
        opts: ["2¹ = 2", "2¹⁹", "0", "2³⁹"],
        ans: 1,
        exp: "Pull out the common power: 2²⁰ − 2¹⁹ = 2¹⁹(2¹ − 1) = 2¹⁹(1) = 2¹⁹!"
      },
      {
        q: "What is 0.000035 expressed in standard scientific notation?",
        opts: ["3.5 × 10⁻⁵", "35 × 10⁻⁶", "3.5 × 10⁵", "0.35 × 10⁻⁴"],
        ans: 0,
        exp: "In standard scientific form k × 10ⁿ, 1 ≤ k < 10. Shifting the decimal point 5 places to the right gives 3.5 × 10⁻⁵!"
      },
      {
        q: "Simplify: (5⁻¹ × 2⁻¹) ÷ 6⁻¹. What is the result?",
        opts: ["3/5", "5/3", "1/60", "60"],
        ans: 0,
        exp: "(5⁻¹ × 2⁻¹) = (1/5 × 1/2) = 1/10. Then (1/10) ÷ (1/6) = (1/10) × 6 = 6/10 = 3/5!"
      },
      {
        q: "If 3²ˣ⁺¹ ÷ 9 = 27, what is the value of x?",
        opts: ["x = 1", "x = 2", "x = 3", "x = 0"],
        ans: 1,
        exp: "Write all terms as powers of 3: 3²ˣ⁺¹ ÷ 3² = 3³ => 3²ˣ⁺¹⁻² = 3³ => 2x − 1 = 3 => 2x = 4 => x = 2!"
      }
    ],
    quadrilaterals: [
      {
        q: "What is the sum of exterior angles of any convex 12-sided dodecagon?",
        opts: ["1800°", "360°", "720°", "180°"],
        ans: 1,
        exp: "The sum of the exterior angles of ANY convex polygon is ALWAYS strictly 360°, regardless of the number of sides!"
      },
      {
        q: "Each interior angle of a regular polygon is 144°. How many sides does it have?",
        opts: ["8 sides", "10 sides (Decagon)", "12 sides", "15 sides"],
        ans: 1,
        exp: "Exterior angle shortcut: Exterior angle = 180° − 144° = 36°. Number of sides n = 360° ÷ 36° = 10 sides!"
      },
      {
        q: "In a parallelogram ABCD, if ∠A = 70°, what are the values of ∠B, ∠C, and ∠D?",
        opts: [
          "∠B = 110°, ∠C = 70°, ∠D = 110°",
          "∠B = 70°, ∠C = 110°, ∠D = 110°",
          "All angles are 90°",
          "∠B = 120°, ∠C = 60°, ∠D = 120°"
        ],
        ans: 0,
        exp: "Adjacent angles are supplementary: ∠B = 180° − 70° = 110°. Opposite angles are equal: ∠C = ∠A = 70°, ∠D = ∠B = 110°!"
      },
      {
        q: "The diagonals of a rhombus are 16 cm and 12 cm. What is the length of each side?",
        opts: ["10 cm", "14 cm", "20 cm", "8 cm"],
        ans: 0,
        exp: "Diagonals of a rhombus bisect each other at 90°. Half-diagonals are 8 cm and 6 cm. By Pythagoras: side² = 8² + 6² = 64 + 36 = 100 => side = √100 = 10 cm!"
      },
      {
        q: "How many total diagonals does an octagon (8 sides) have?",
        opts: ["20 diagonals", "16 diagonals", "24 diagonals", "28 diagonals"],
        ans: 0,
        exp: "Diagonal formula: n(n − 3)/2 = 8(8 − 3)/2 = 8(5)/2 = 40/2 = 20 diagonals!"
      }
    ],
    financial: [
      {
        q: "An item marked at ₹840 is sold for ₹714. What is the discount percentage?",
        opts: ["15%", "12%", "18%", "20%"],
        ans: 0,
        exp: "Discount = 840 − 714 = ₹126. Discount % = (126 / 840) × 100 = 15% (calculated on Marked Price)!"
      },
      {
        q: "If a shopkeeper offers successive discounts of 20% and 10%, what is the single equivalent net discount?",
        opts: ["30%", "28%", "25%", "22%"],
        ans: 1,
        exp: "Net discount = d₁ + d₂ − (d₁ × d₂)/100 = 20 + 10 − (200/100) = 30 − 2 = 28%!"
      },
      {
        q: "What is the Compound Interest on ₹10,000 for 2 years at 10% per annum compounded annually?",
        opts: ["₹2,000", "₹2,100", "₹1,210", "₹2,200"],
        ans: 1,
        exp: "A = P(1 + R/100)ⁿ = 10000(1 + 0.10)² = 10000 × 1.21 = ₹12,100. CI = 12100 − 10000 = ₹2,100!"
      },
      {
        q: "When compound interest is compounded half-yearly for 1.5 years at 10% per annum, what are the rate (r) and conversion periods (n)?",
        opts: [
          "Rate = 5%, Periods n = 3",
          "Rate = 10%, Periods n = 1.5",
          "Rate = 5%, Periods n = 2",
          "Rate = 20%, Periods n = 3"
        ],
        ans: 0,
        exp: "Half-yearly rule: Halve the annual rate (10% ÷ 2 = 5%) and double the time periods (1.5 years × 2 = 3 half-years)!"
      },
      {
        q: "A television was bought for ₹13,500 including 8% GST. What was the price before GST was added?",
        opts: ["₹12,500", "₹12,420", "₹12,000", "₹12,800"],
        ans: 0,
        exp: "Price with GST = Original × 1.08 = 13500 => Original Price = 13500 ÷ 1.08 = ₹12,500!"
      }
    ],
    mensuration: [
      {
        q: "The parallel sides of a trapezium are 12 cm and 8 cm, and the distance between them is 6 cm. What is its area?",
        opts: ["60 cm²", "120 cm²", "48 cm²", "72 cm²"],
        ans: 0,
        exp: "Trapezium Area = 1/2 × (a + b) × h = 1/2 × (12 + 8) × 6 = 1/2 × 20 × 6 = 60 cm²!"
      },
      {
        q: "What is the Total Surface Area (TSA) of a cube whose side is 5 cm?",
        opts: ["150 cm²", "100 cm²", "125 cm²", "75 cm²"],
        ans: 0,
        exp: "TSA of cube = 6a² = 6 × (5)² = 6 × 25 = 150 cm² (Lateral Surface Area is 4a² = 100 cm²)!"
      },
      {
        q: "A cylindrical container has radius 7 cm and height 10 cm. What is its Volume (use π = 22/7)?",
        opts: ["1,540 cm³", "440 cm³", "770 cm³", "3,080 cm³"],
        ans: 0,
        exp: "Volume = πr²h = (22/7) × 7 × 7 × 10 = 22 × 7 × 10 = 1,540 cm³!"
      },
      {
        q: "How many litres of water can a cuboidal reservoir of dimensions 6 m × 5 m × 4 m hold?",
        opts: ["120,000 Litres", "12,000 Litres", "1,200 Litres", "120 Litres"],
        ans: 0,
        exp: "Volume = 6 × 5 × 4 = 120 m³. Since 1 m³ = 1,000 Litres, Capacity = 120 × 1,000 = 120,000 Litres!"
      },
      {
        q: "The area of a rhombus is 240 cm² and one diagonal is 16 cm. What is the length of the other diagonal?",
        opts: ["30 cm", "15 cm", "20 cm", "25 cm"],
        ans: 0,
        exp: "Area of Rhombus = 1/2 × d₁ × d₂ => 240 = 1/2 × 16 × d₂ => 240 = 8 × d₂ => d₂ = 30 cm!"
      }
    ],
    probability: [
      {
        q: "If a standard 6-sided die is rolled once, what is the probability of getting a prime number?",
        opts: ["1/2 (50%)", "1/3", "2/3", "1/6"],
        ans: 0,
        exp: "Possible outcomes: {1, 2, 3, 4, 5, 6} (total 6). Prime outcomes are {2, 3, 5} (3 primes). Probability = 3/6 = 1/2!"
      },
      {
        q: "In a pie chart, what central angle represents a component that accounts for 35% of the total?",
        opts: ["126°", "105°", "135°", "70°"],
        ans: 0,
        exp: "Shortcut: Multiply percentage by 3.6°: 35 × 3.6° = 126°!"
      },
      {
        q: "If two coins are tossed simultaneously, what is the probability of getting at least one Head?",
        opts: ["3/4 (75%)", "1/2 (50%)", "1/4 (25%)", "1 (100%)"],
        ans: 0,
        exp: "Sample space: {HH, HT, TH, TT} (total 4). At least one Head: {HH, HT, TH} (3 outcomes). P = 3/4 = 75%!"
      },
      {
        q: "From a well-shuffled pack of 52 cards, what is the probability of drawing a Queen?",
        opts: ["1/13", "1/52", "1/4", "4/13"],
        ans: 0,
        exp: "There are 4 Queens in a 52-card deck. P = 4/52 = 1/13!"
      },
      {
        q: "If the probability of it raining tomorrow is 0.38, what is the probability that it will NOT rain?",
        opts: ["0.62", "0.72", "0.38", "1.38"],
        ans: 0,
        exp: "Complementary rule: P(not E) = 1 − P(E) = 1 − 0.38 = 0.62 (62%)!"
      }
    ]
  };

  // Alias roots for backward compatibility
  window.QUIZ_BANK.roots = window.QUIZ_BANK.squares;

  let currentQuizCat = 'divisibility';
  let currentQuizIndex = 0;
  let currentQuizScore = 0;
  let currentQuizAnswered = false;

  window.selectQuizCategory = function(cat, btnEl) {
    currentQuizCat = cat;
    currentQuizIndex = 0;
    currentQuizScore = 0;
    currentQuizAnswered = false;

    document.querySelectorAll('.quiz-tab-button').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    window.renderQuizQuestion();
  };

  window.renderQuizQuestion = function() {
    const qBox = document.getElementById('quizQuestionBox');
    const scoreDisp = document.getElementById('quizScoreDisplay');
    const totalDisp = document.getElementById('quizTotalQuestionsDisplay');
    const pBar = document.getElementById('quizProgressBar');

    if (!qBox) return;

    const questions = window.QUIZ_BANK[currentQuizCat] || window.QUIZ_BANK.divisibility;
    if (scoreDisp) scoreDisp.textContent = currentQuizScore;
    if (totalDisp) totalDisp.textContent = questions.length;

    const pct = ((currentQuizIndex) / questions.length) * 100;
    if (pBar) pBar.style.width = `${Math.max(pct, 12)}%`;

    if (currentQuizIndex >= questions.length) {
      if (pBar) pBar.style.width = '100%';
      const finalPercent = Math.round((currentQuizScore / questions.length) * 100);
      let feedback = '';
      if (finalPercent === 100) feedback = "🌟 Flawless Mastery! You nailed every question like a maths olympiad champion!";
      else if (finalPercent >= 80) feedback = "🎉 Excellent Work! You have rock-solid conceptual understanding!";
      else if (finalPercent >= 60) feedback = "👍 Good Effort! Review the explanations to cement the trickiest rules.";
      else feedback = "📚 Great practice run! Tap 'Ask Professor Chalk' below to go over any of these concepts step-by-step.";

      qBox.innerHTML = `
        <div style="text-align:center; padding:1.5rem 0.5rem;">
          <div style="font-size:3.5rem; margin-bottom:0.5rem;">🏆</div>
          <h3 style="font-family:var(--font-display); font-size:1.8rem; color:var(--ink); margin-bottom:0.5rem;">
            Quiz Completed!
          </h3>
          <p style="font-size:1.1rem; color:#065F46; font-weight:700; font-family:var(--font-mono); margin-bottom:0.75rem;">
            Your Score: ${currentQuizScore} / ${questions.length} (${finalPercent}%)
          </p>
          <p style="max-width:540px; margin:0 auto 1.5rem; font-size:0.95rem; color:#475569; line-height:1.5;">
            ${feedback}
          </p>
          <div style="display:flex; justify-content:center; gap:0.75rem; flex-wrap:wrap;">
            <button class="btn-primary" onclick="resetCurrentQuiz()" style="background:#059669; border-color:#047857;">
              ↺ Retake This Quiz
            </button>
            <button class="btn-primary" onclick="askProfessorAboutQuizScore()" style="background:#2563EB; border-color:#1D4ED8;">
              💬 Discuss Mistakes with Professor Chalk
            </button>
          </div>
        </div>
      `;
      return;
    }

    currentQuizAnswered = false;
    const qData = questions[currentQuizIndex];
    const letters = ['A', 'B', 'C', 'D'];

    let optionsHtml = '';
    qData.opts.forEach((opt, idx) => {
      optionsHtml += `
        <button class="quiz-option-btn" onclick="handleQuizAnswer(${idx})" id="qOptBtn_${idx}">
          <span class="quiz-opt-letter">${letters[idx]}</span>
          <span>${escapeHtml(opt)}</span>
        </button>
      `;
    });

    qBox.innerHTML = `
      <div class="quiz-q-header">
        <span>QUESTION ${currentQuizIndex + 1} OF ${questions.length}</span>
        <span>Category: ${currentQuizCat.toUpperCase()}</span>
      </div>
      <div class="quiz-q-title">
        ${escapeHtml(qData.q)}
      </div>
      <div class="quiz-options-grid" id="qOptionsGrid">
        ${optionsHtml}
      </div>
      <div id="qExplanationArea"></div>
    `;
  };

  window.handleQuizAnswer = function(selectedIdx) {
    if (currentQuizAnswered) return;
    currentQuizAnswered = true;

    const questions = window.QUIZ_BANK[currentQuizCat];
    const qData = questions[currentQuizIndex];
    const correctIdx = qData.ans;
    const isCorrect = selectedIdx === correctIdx;

    if (isCorrect) currentQuizScore++;
    const scoreDisp = document.getElementById('quizScoreDisplay');
    if (scoreDisp) scoreDisp.textContent = currentQuizScore;

    for (let i = 0; i < qData.opts.length; i++) {
      const btn = document.getElementById(`qOptBtn_${i}`);
      if (!btn) continue;
      btn.disabled = true;
      if (i === correctIdx) {
        btn.classList.add('correct');
      } else if (i === selectedIdx && !isCorrect) {
        btn.classList.add('wrong');
      }
    }

    const expArea = document.getElementById('qExplanationArea');
    if (expArea) {
      expArea.innerHTML = `
        <div class="quiz-explanation-box" style="border-color:${isCorrect ? '#86EFAC' : '#FCA5A5'}; background:${isCorrect ? '#F0FDF4' : '#FEF2F2'};">
          <div style="font-weight:700; color:${isCorrect ? '#166534' : '#991B1B'}; margin-bottom:0.35rem; display:flex; align-items:center; gap:0.4rem;">
            <span>${isCorrect ? '✓ Correct! Awesome Job!' : '✗ Not quite right!'}</span>
          </div>
          <div style="font-size:0.9rem; color:#1F2937; line-height:1.5; margin-bottom:0.85rem;">
            ${qData.exp}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <button class="btn-small" onclick="askProfessorAboutQuestion()" style="background:#EFF6FF; border-color:#93C5FD; color:#1D4ED8;">
              💬 Ask Professor Chalk to explain deeper
            </button>
            <button class="btn-primary" onclick="nextQuizQuestion()" style="background:#059669; border-color:#047857; padding:0.45rem 1rem; font-size:0.92rem;">
              ${currentQuizIndex + 1 >= questions.length ? 'See Final Score ➔' : 'Next Question ➔'}
            </button>
          </div>
        </div>
      `;
    }
  };

  window.nextQuizQuestion = function() {
    currentQuizIndex++;
    window.renderQuizQuestion();
  };

  window.resetCurrentQuiz = function() {
    currentQuizIndex = 0;
    currentQuizScore = 0;
    currentQuizAnswered = false;
    window.renderQuizQuestion();
  };

  window.askProfessorAboutQuestion = function() {
    const questions = window.QUIZ_BANK[currentQuizCat];
    const qData = questions[Math.min(currentQuizIndex, questions.length - 1)];
    const query = `Can you explain the maths behind this question in detail: "${qData.q}"? The solution notes say: "${qData.exp}"`;
    if (window.askQuickPrompt) window.askQuickPrompt(query);
  };

  window.askProfessorAboutQuizScore = function() {
    const questions = window.QUIZ_BANK[currentQuizCat];
    const query = `I just took the Class 8 "${currentQuizCat.toUpperCase()}" quiz and scored ${currentQuizScore} out of ${questions.length}. Can you give me a quick high-yield revision checklist of the most important concepts to master for this topic?`;
    if (window.askQuickPrompt) window.askQuickPrompt(query);
  };

  /* =========================================================================
     6B. INTERACTIVE TOPIC TOOLS (TOPICS 5 - 10)
     ========================================================================= */

  // Topic 5: Linear Equations Solver & Graphing bridge
  window.solveLiveLinear = function() {
    const inA = document.getElementById('linearA');
    const inB = document.getElementById('linearB');
    const inC = document.getElementById('linearC');
    const out = document.getElementById('linearSolutionOutput');
    if (!out) return;
    const a = inA ? parseFloat(inA.value) || 1 : 1;
    const b = inB ? parseFloat(inB.value) || 0 : 0;
    const c = inC ? parseFloat(inC.value) || 0 : 0;

    const diff = c - b;
    let html = `Equation: <span style="color:#6EE7B7; font-weight:700;">${a}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)} = ${c}</span><br>`;
    html += `Step 1 (Transpose ${b}): ${a}x = ${c} ${b >= 0 ? '− ' + b : '+ ' + Math.abs(b)} = ${diff}<br>`;
    if (a === 0) {
      if (diff === 0) {
        html += `Step 2: 0x = 0 &rarr; <span style="color:#FDE047; font-weight:700;">Infinitely Many Solutions (Identity)</span>`;
      } else {
        html += `Step 2: 0x = ${diff} &rarr; <span style="color:#F87171; font-weight:700;">No Solution (Inconsistent)</span>`;
      }
    } else {
      const xVal = diff / a;
      const formattedX = Number.isInteger(xVal) ? xVal : xVal.toFixed(3).replace(/\.?0+$/, '');
      html += `Step 2 (Divide by ${a}): x = ${diff} ÷ ${a} = <span style="color:#FDE047; font-weight:700; font-size:1.1rem;">${formattedX}</span><br>`;
      html += `Check: ${a}(${formattedX}) ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)} = ${(a * xVal + b).toFixed(2)} ≈ ${c} ✓ (Scale Balanced!)`;
    }
    out.innerHTML = html;
  };

  window.plotEquationFromLinear = function() {
    const inA = document.getElementById('linearA');
    const inB = document.getElementById('linearB');
    const a = inA ? inA.value : '3';
    const b = inB ? inB.value : '7';
    const sign = Number(b) >= 0 ? '+' : '-';
    const expr = `${a}*x ${sign} ${Math.abs(Number(b))}`;
    
    const graphInput = document.getElementById('customGraphFnInput');
    if (graphInput) graphInput.value = expr;
    
    const panel = document.getElementById('grapherPanel');
    if (panel && (panel.style.display === 'none' || panel.style.display === '')) {
      window.toggleGrapherPanel();
    } else if (window.plotCustomGraphFromInput) {
      window.plotCustomGraphFromInput();
    }
    
    const mount = document.getElementById('grapherPanel') || document.getElementById('standaloneGraphMount');
    if (mount) mount.scrollIntoView({ behavior: 'smooth' });
  };

  // Topic 6: Exponents & Powers Sandbox
  window.updateExponentTool = function() {
    const inBase = document.getElementById('expBaseInput');
    const inPower = document.getElementById('expPowerInput');
    const lblBase = document.getElementById('expBaseLabel');
    const lblPower = document.getElementById('expPowerLabel');
    const out = document.getElementById('exponentToolOutput');
    if (!out) return;

    const a = inBase ? parseInt(inBase.value, 10) : 2;
    const n = inPower ? parseInt(inPower.value, 10) : 8;
    if (lblBase) lblBase.textContent = a;
    if (lblPower) lblPower.textContent = n;

    const val = Math.pow(a, n);
    const sci = val.toExponential(2);
    let expansion = '';
    if (n > 0 && n <= 10) {
      expansion = Array(n).fill(a).join(' × ');
    } else if (n === 0) {
      expansion = 'Any non-zero base to power 0 equals 1 (a⁰ = 1)';
    } else if (n < 0 && n >= -6) {
      expansion = `1 / (${Array(-n).fill(a).join(' × ')}) = 1 / ${Math.pow(a, -n)}`;
    } else {
      expansion = `Calculated via logarithmic scaling: ${a}^${n}`;
    }

    out.innerHTML = `
      Expression: <span style="color:#A5B4FC; font-weight:700; font-size:1.1rem;">${a}<sup>${n}</sup></span><br>
      Value: <span style="color:#38BDF8; font-weight:700; font-size:1.15rem;">${val >= 1000000 || (val > 0 && val < 0.001) ? sci : val}</span><br>
      Scientific Notation: <span style="color:#FDE047; font-weight:700;">${sci}</span><br>
      Expansion: ${expansion}
    `;
  };

  // Topic 7: Polygon Geometry Inspector
  window.setPolygonSides = function(n) {
    const input = document.getElementById('polygonSidesInput');
    if (input) {
      input.value = n;
      window.updatePolygonInspector();
    }
  };

  window.updatePolygonInspector = function() {
    const input = document.getElementById('polygonSidesInput');
    const label = document.getElementById('polygonSidesLabel');
    const out = document.getElementById('polygonStatsOutput');
    const svg = document.getElementById('polygonSvg');
    if (!input) return;

    const n = parseInt(input.value, 10) || 6;
    const names = {
      3: "Triangle", 4: "Quadrilateral (Square)", 5: "Pentagon", 6: "Hexagon",
      7: "Heptagon", 8: "Octagon", 9: "Nonagon", 10: "Decagon", 11: "Hendecagon", 12: "Dodecagon"
    };
    const name = names[n] || `${n}-gon`;
    if (label) label.textContent = `${n} (${name})`;

    const intSum = (n - 2) * 180;
    const intEach = (intSum / n).toFixed(1).replace(/\.0$/, '');
    const extEach = (360 / n).toFixed(1).replace(/\.0$/, '');
    const diagCount = (n * (n - 3)) / 2;

    if (out) {
      out.innerHTML = `
        Polygon: <strong>${name} (n = ${n})</strong><br>
        Interior Sum: (${n}−2)×180° = <strong>${intSum}°</strong><br>
        Each Interior Angle: ${intSum}° ÷ ${n} = <strong style="color:#BE123C; font-size:1.05rem;">${intEach}°</strong><br>
        Each Exterior Angle: 360° ÷ ${n} = <strong style="color:#059669; font-size:1.05rem;">${extEach}°</strong><br>
        Total Diagonals: ${n}(${n}−3)/2 = <strong>${diagCount}</strong>
      `;
    }

    if (svg) {
      const r = 55;
      const pts = [];
      for (let i = 0; i < n; i++) {
        const theta = (2 * Math.PI * i / n) - (Math.PI / 2);
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      const ptsStr = pts.join(' ');
      svg.innerHTML = `
        <polygon points="${ptsStr}" fill="#FFE4E6" stroke="#E11D48" stroke-width="2.5" stroke-linejoin="round" />
        ${pts.map(p => {
          const [px, py] = p.split(',');
          return `<circle cx="${px}" cy="${py}" r="4" fill="#9F1239" />`;
        }).join('')}
      `;
    }
  };

  // Topic 8: Compound Interest Snowball
  window.updateInterestTool = function() {
    const inP = document.getElementById('ciPInput');
    const inR = document.getElementById('ciRInput');
    const inT = document.getElementById('ciTInput');
    const lblP = document.getElementById('ciPLabel');
    const lblR = document.getElementById('ciRLabel');
    const lblT = document.getElementById('ciTLabel');
    const out = document.getElementById('interestToolOutput');
    if (!out) return;

    const P = inP ? parseFloat(inP.value) : 10000;
    const R = inR ? parseFloat(inR.value) : 10;
    const T = inT ? parseFloat(inT.value) : 3;

    if (lblP) lblP.textContent = `₹${P.toLocaleString()}`;
    if (lblR) lblR.textContent = `${R}%`;
    if (lblT) lblT.textContent = `${T} Years`;

    const SI = (P * R * T) / 100;
    const SIAmount = P + SI;

    const CIAmountAnnual = P * Math.pow(1 + R / 100, T);
    const CIAnnual = CIAmountAnnual - P;

    const CIAmountHalf = P * Math.pow(1 + (R / 2) / 100, T * 2);
    const CIHalf = CIAmountHalf - P;

    const diff = CIAnnual - SI;

    out.innerHTML = `
      Simple Interest: Amount = <strong>₹${Math.round(SIAmount).toLocaleString()}</strong> (Interest = ₹${Math.round(SI).toLocaleString()})<br>
      Compound Interest (Annual): Amount = <strong style="color:#5EEAD4; font-size:1.05rem;">₹${Math.round(CIAmountAnnual).toLocaleString()}</strong> (Interest = ₹${Math.round(CIAnnual).toLocaleString()})<br>
      Compounded Half-Yearly: Amount = <strong style="color:#2DD4BF;">₹${CIAmountHalf.toFixed(2)}</strong> (Interest = ₹${CIHalf.toFixed(2)})<br>
      <span style="color:#FEF08A; font-weight:700;">Snowball Bonus: Compounding yields +₹${Math.round(diff).toLocaleString()} more than Simple Interest!</span>
    `;
  };

  // Topic 9: 3D Solids Geometry & Capacity
  let currentSolidShape = 'cylinder';
  window.selectSolidShape = function(shape) {
    currentSolidShape = shape;
    const btnCyl = document.getElementById('solidBtnCylinder');
    const btnCub = document.getElementById('solidBtnCuboid');
    const btnCube = document.getElementById('solidBtnCube');
    const lbl1 = document.getElementById('solidDim1Label');
    const lbl2 = document.getElementById('solidDim2Label');
    const dim3Cont = document.getElementById('solidDim3Container');

    [btnCyl, btnCub, btnCube].forEach(b => {
      if (b) {
        b.style.background = '';
        b.style.color = '';
        b.style.borderColor = '';
      }
    });

    const activeStyle = (btn) => {
      if (!btn) return;
      btn.style.background = '#FEF3C7';
      btn.style.color = '#92400E';
      btn.style.borderColor = '#F59E0B';
    };

    if (shape === 'cylinder') {
      activeStyle(btnCyl);
      if (lbl1) lbl1.textContent = '7 cm';
      if (lbl2) lbl2.textContent = '10 cm';
      if (dim3Cont) dim3Cont.style.display = 'none';
    } else if (shape === 'cuboid') {
      activeStyle(btnCub);
      if (lbl1) lbl1.textContent = '12 cm';
      if (lbl2) lbl2.textContent = '8 cm';
      if (dim3Cont) dim3Cont.style.display = 'block';
    } else if (shape === 'cube') {
      activeStyle(btnCube);
      if (lbl1) lbl1.textContent = '6 cm';
      if (lbl2) lbl2.textContent = '(same for all sides)';
      if (dim3Cont) dim3Cont.style.display = 'none';
    }
    window.updateSolidCalculator();
  };

  window.updateSolidCalculator = function() {
    const d1In = document.getElementById('solidDim1');
    const d2In = document.getElementById('solidDim2');
    const d3In = document.getElementById('solidDim3');
    const out = document.getElementById('solidOutput');
    if (!out) return;

    const d1 = d1In ? parseFloat(d1In.value) || 7 : 7;
    const d2 = d2In ? parseFloat(d2In.value) || 10 : 10;
    const d3 = d3In ? parseFloat(d3In.value) || 5 : 5;

    let title = '', csa = 0, tsa = 0, vol = 0;
    if (currentSolidShape === 'cylinder') {
      title = `Cylinder (r = ${d1} cm, h = ${d2} cm)`;
      csa = 2 * Math.PI * d1 * d2;
      tsa = 2 * Math.PI * d1 * (d1 + d2);
      vol = Math.PI * d1 * d1 * d2;
    } else if (currentSolidShape === 'cuboid') {
      title = `Cuboid (l = ${d1} cm, h = ${d2} cm, b = ${d3} cm)`;
      csa = 2 * d2 * (d1 + d3);
      tsa = 2 * (d1 * d3 + d3 * d2 + d2 * d1);
      vol = d1 * d3 * d2;
    } else {
      title = `Cube (side a = ${d1} cm)`;
      csa = 4 * d1 * d1;
      tsa = 6 * d1 * d1;
      vol = d1 * d1 * d1;
    }

    const capacityL = vol / 1000;
    out.innerHTML = `
      Shape: <strong>${title}</strong><br>
      Lateral / Curved Surface Area: <strong>${csa.toFixed(2)} cm²</strong><br>
      Total Surface Area (TSA): <strong style="color:#FDE68A;">${tsa.toFixed(2)} cm²</strong><br>
      Volume: <strong style="color:#FDE68A; font-size:1.05rem;">${vol.toFixed(2)} cm³</strong><br>
      <span style="color:#BBF7D0; font-weight:700;">Liquid Capacity: ${capacityL.toFixed(3)} Litres (${Math.round(vol)} mL)</span>
    `;
  };

  // Topic 10: Monte Carlo Probability Simulator
  window.runProbabilitySim = function(mode) {
    const out = document.getElementById('probabilitySimOutput');
    const barA = document.getElementById('simBarA');
    const barB = document.getElementById('simBarB');
    const cntA = document.getElementById('simCountA');
    const cntB = document.getElementById('simCountB');
    const pctA = document.getElementById('simPercentA');
    const pctB = document.getElementById('simPercentB');
    if (!out) return;

    if (mode === 'coin10' || mode === 'coin100') {
      const total = mode === 'coin10' ? 10 : 100;
      let heads = 0;
      for (let i = 0; i < total; i++) {
        if (Math.random() < 0.5) heads++;
      }
      const tails = total - heads;
      const pHeads = ((heads / total) * 100).toFixed(1);
      const pTails = ((tails / total) * 100).toFixed(1);

      if (cntA) cntA.textContent = heads;
      if (cntB) cntB.textContent = tails;
      if (pctA) pctA.textContent = `${pHeads}%`;
      if (pctB) pctB.textContent = `${pTails}%`;
      if (barA) barA.style.width = `${pHeads}%`;
      if (barB) barB.style.width = `${pTails}%`;
    } else {
      const total = mode === 'dice60' ? 60 : 600;
      const counts = [0, 0, 0, 0, 0, 0];
      for (let i = 0; i < total; i++) {
        const face = Math.floor(Math.random() * 6);
        counts[face]++;
      }
      out.innerHTML = `
        Experiment: <strong>${total} Dice Rolls</strong><br>
        Frequencies: ⚀: ${counts[0]} (${(counts[0]/total*100).toFixed(1)}%) &bull; ⚁: ${counts[1]} (${(counts[1]/total*100).toFixed(1)}%) &bull; ⚂: ${counts[2]} (${(counts[2]/total*100).toFixed(1)}%)<br>
        ⚃: ${counts[3]} (${(counts[3]/total*100).toFixed(1)}%) &bull; ⚄: ${counts[4]} (${(counts[4]/total*100).toFixed(1)}%) &bull; ⚅: ${counts[5]} (${(counts[5]/total*100).toFixed(1)}%)<br>
        Theoretical Expected: <strong>16.7% per face (1 in 6)</strong><br>
        <button class="btn-small" onclick="runProbabilitySim('coin100')" style="margin-top:6px; background:#0284C7; color:#FFF; border:none; cursor:pointer;">Reset to Coin Flips</button>
      `;
    }
  };

  /* =========================================================================
     7. INITIALIZATION ON DOM READY
     ========================================================================= */
  function initAll() {
    if (window.initRootsMasterTables) window.initRootsMasterTables();
    if (window.renderDrillCard) window.renderDrillCard();
    if (window.inspectNumber) window.inspectNumber(5041);
    if (window.renderQuizQuestion) window.renderQuizQuestion();

    // Initialize newly expanded interactive tools
    if (window.solveLiveLinear) window.solveLiveLinear();
    if (window.updateExponentTool) window.updateExponentTool();
    if (window.updatePolygonInspector) window.updatePolygonInspector();
    if (window.updateInterestTool) window.updateInterestTool();
    if (window.updateSolidCalculator) window.updateSolidCalculator();

    // Auto-plot initial function grapher
    const mount = document.getElementById('standaloneGraphMount');
    if (mount) {
      renderInteractiveChalkboardGraph(mount, {
        title: "Chalkboard Graph: y = 3x + 7",
        fn: "3*x + 7",
        latex: "y = 3x + 7",
        xRange: [-6, 6],
        yRange: [-5, 16],
        slope: 3,
        intercept: 7,
        points: [
          { x: 0, y: 7, label: "y-intercept (0, 7)" },
          { x: -2.333, y: 0, label: "x-intercept (-7/3, 0)" }
        ]
      });
    }

    // Mathematical notation sweep across entire document
    if (window.renderAllMath) {
      window.renderAllMath(document.body);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

})();
