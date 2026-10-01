/*
 * RippleGrid — self-contained WebGL animated grid background.
 * Vanilla-JS port of the React/ogl "RippleGrid" component (react-bits).
 * No dependencies, no build step. Works as a classic <script defer>.
 *
 * Usage:
 *   <div class="hero-bg" data-ripple-grid
 *        data-grid-color="#d26519" data-grid-size="6" ...></div>
 *   <script src="assets/ripple-grid.js" defer></script>
 * Every [data-ripple-grid] element is auto-mounted on load. You can also call
 * RippleGrid.mount(element, optionsObject) manually; it returns { destroy }.
 */
(function () {
  'use strict';

  var VERT = [
    'attribute vec2 position;',
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = position * 0.5 + 0.5;',
    '  gl_Position = vec4(position, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG = 'precision highp float;\n' +
'uniform float iTime;\n' +
'uniform vec2 iResolution;\n' +
'uniform bool enableRainbow;\n' +
'uniform vec3 gridColor;\n' +
'uniform float rippleIntensity;\n' +
'uniform float gridSize;\n' +
'uniform float gridThickness;\n' +
'uniform float fadeDistance;\n' +
'uniform float vignetteStrength;\n' +
'uniform float glowIntensity;\n' +
'uniform float opacity;\n' +
'uniform float gridRotation;\n' +
'uniform bool mouseInteraction;\n' +
'uniform vec2 mousePosition;\n' +
'uniform float mouseInfluence;\n' +
'uniform float mouseInteractionRadius;\n' +
'uniform bool lightMode;\n' +
'varying vec2 vUv;\n' +
'\n' +
'float pi = 3.141592;\n' +
'\n' +
'mat2 rotate(float angle) {\n' +
'    float s = sin(angle);\n' +
'    float c = cos(angle);\n' +
'    return mat2(c, -s, s, c);\n' +
'}\n' +
'\n' +
'void main() {\n' +
'    vec2 uv = vUv * 2.0 - 1.0;\n' +
'    uv.x *= iResolution.x / iResolution.y;\n' +
'\n' +
'    if (gridRotation != 0.0) {\n' +
'        uv = rotate(gridRotation * pi / 180.0) * uv;\n' +
'    }\n' +
'\n' +
'    float dist = length(uv);\n' +
'    float func = sin(pi * (iTime - dist));\n' +
'    vec2 rippleUv = uv + uv * func * rippleIntensity;\n' +
'\n' +
'    if (mouseInteraction && mouseInfluence > 0.0) {\n' +
'        vec2 mouseUv = (mousePosition * 2.0 - 1.0);\n' +
'        mouseUv.x *= iResolution.x / iResolution.y;\n' +
'        float mouseDist = length(uv - mouseUv);\n' +
'        float influence = mouseInfluence * exp(-mouseDist * mouseDist / (mouseInteractionRadius * mouseInteractionRadius));\n' +
'        float mouseWave = sin(pi * (iTime * 2.0 - mouseDist * 3.0)) * influence;\n' +
'        rippleUv += normalize(uv - mouseUv) * mouseWave * rippleIntensity * 0.3;\n' +
'    }\n' +
'\n' +
'    vec2 a = sin(gridSize * 0.5 * pi * rippleUv - pi / 2.0);\n' +
'    vec2 b = abs(a);\n' +
'\n' +
'    float aaWidth = 0.5;\n' +
'    vec2 smoothB = vec2(\n' +
'        smoothstep(0.0, aaWidth, b.x),\n' +
'        smoothstep(0.0, aaWidth, b.y)\n' +
'    );\n' +
'\n' +
'    vec3 color = vec3(0.0);\n' +
'    color += exp(-gridThickness * smoothB.x * (0.8 + 0.5 * sin(pi * iTime)));\n' +
'    color += exp(-gridThickness * smoothB.y);\n' +
'    color += 0.5 * exp(-(gridThickness / 4.0) * sin(smoothB.x));\n' +
'    color += 0.5 * exp(-(gridThickness / 3.0) * smoothB.y);\n' +
'\n' +
'    if (glowIntensity > 0.0) {\n' +
'        color += glowIntensity * exp(-gridThickness * 0.5 * smoothB.x);\n' +
'        color += glowIntensity * exp(-gridThickness * 0.5 * smoothB.y);\n' +
'    }\n' +
'\n' +
'    float ddd = exp(-2.0 * clamp(pow(dist, fadeDistance), 0.0, 1.0));\n' +
'\n' +
'    vec2 vignetteCoords = vUv - 0.5;\n' +
'    float vignetteDistance = length(vignetteCoords);\n' +
'    float vignette = 1.0 - pow(vignetteDistance * 2.0, vignetteStrength);\n' +
'    vignette = clamp(vignette, 0.0, 1.0);\n' +
'\n' +
'    vec3 t;\n' +
'    if (enableRainbow) {\n' +
'        t = vec3(\n' +
'            uv.x * 0.5 + 0.5 * sin(iTime),\n' +
'            uv.y * 0.5 + 0.5 * cos(iTime),\n' +
'            pow(cos(iTime), 4.0)\n' +
'        ) + 0.5;\n' +
'    } else {\n' +
'        t = gridColor;\n' +
'    }\n' +
'\n' +
'    float finalFade = ddd * vignette;\n' +
'    float alpha = length(color) * finalFade * opacity;\n' +
'    vec3 effect = color * t * finalFade * opacity;\n' +
'    if (lightMode) {\n' +
'        float peak = max(effect.r, max(effect.g, effect.b));\n' +
'        vec3 chroma = pow(clamp(effect / max(peak, 0.0001), 0.0, 1.0), vec3(1.2));\n' +
'        gl_FragColor = vec4(mix(vec3(1.0), chroma, clamp(alpha * 0.94, 0.0, 0.94)), 1.0);\n' +
'    } else {\n' +
'        gl_FragColor = vec4(effect, alpha);\n' +
'    }\n' +
'}';

  var DEFAULTS = {
    enableRainbow: false,
    gridColor: '#ffffff',
    rippleIntensity: 0.05,
    gridSize: 10.0,
    gridThickness: 15.0,
    fadeDistance: 1.5,
    vignetteStrength: 2.0,
    glowIntensity: 0.1,
    opacity: 1.0,
    gridRotation: 0,
    mouseInteraction: true,
    mouseInteractionRadius: 1,
    lightMode: false
  };

  function hexToRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m
      ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
      : [1, 1, 1];
  }

  function compileShader(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('RippleGrid: shader compile failed —', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function mount(container, options) {
    if (!container) return null;
    var opts = {};
    for (var k in DEFAULTS) { if (DEFAULTS.hasOwnProperty(k)) opts[k] = DEFAULTS[k]; }
    if (options) { for (var o in options) { if (options.hasOwnProperty(o)) opts[o] = options[o]; } }

    var canvas = document.createElement('canvas');
    canvas.className = 'ripple-grid-canvas';
    canvas.setAttribute('aria-hidden', 'true');

    var attrs = { alpha: true, premultipliedAlpha: false, antialias: true };
    var gl = canvas.getContext('webgl', attrs) ||
             canvas.getContext('experimental-webgl', attrs);
    if (!gl) return null; // No WebGL: leave the element empty, page background shows.

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    container.appendChild(canvas);

    var vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
    var fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { container.removeChild(canvas); return null; }

    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('RippleGrid: program link failed —', gl.getProgramInfoLog(program));
      container.removeChild(canvas);
      return null;
    }
    gl.useProgram(program);

    // Fullscreen triangle (matches ogl's Triangle geometry).
    var posLoc = gl.getAttribLocation(program, 'position');
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['iTime', 'iResolution', 'enableRainbow', 'gridColor', 'rippleIntensity',
     'gridSize', 'gridThickness', 'fadeDistance', 'vignetteStrength',
     'glowIntensity', 'opacity', 'gridRotation', 'mouseInteraction',
     'mousePosition', 'mouseInfluence', 'mouseInteractionRadius', 'lightMode'
    ].forEach(function (name) { U[name] = gl.getUniformLocation(program, name); });

    var rgb = hexToRgb(opts.gridColor);
    gl.uniform1i(U.enableRainbow, opts.enableRainbow ? 1 : 0);
    gl.uniform3f(U.gridColor, rgb[0], rgb[1], rgb[2]);
    gl.uniform1f(U.rippleIntensity, opts.rippleIntensity);
    gl.uniform1f(U.gridSize, opts.gridSize);
    gl.uniform1f(U.gridThickness, opts.gridThickness);
    gl.uniform1f(U.fadeDistance, opts.fadeDistance);
    gl.uniform1f(U.vignetteStrength, opts.vignetteStrength);
    gl.uniform1f(U.glowIntensity, opts.glowIntensity);
    gl.uniform1f(U.opacity, opts.opacity);
    gl.uniform1f(U.gridRotation, opts.gridRotation);
    gl.uniform1i(U.mouseInteraction, opts.mouseInteraction ? 1 : 0);
    gl.uniform1f(U.mouseInteractionRadius, opts.mouseInteractionRadius);
    gl.uniform1i(U.lightMode, opts.lightMode ? 1 : 0);

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      var w = container.clientWidth || 1;
      var h = container.clientHeight || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.iResolution, w, h);
    }

    // Smoothed mouse, tracked on window so the canvas can stay
    // pointer-events:none and let clicks reach the hero buttons.
    var mouse = { x: 0.5, y: 0.5 };
    var target = { x: 0.5, y: 0.5 };
    var influence = 0;
    var influenceSmoothed = 0;
    function onMove(e) {
      var r = container.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var x = (e.clientX - r.left) / r.width;
      var y = 1.0 - (e.clientY - r.top) / r.height;
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        target.x = x; target.y = y; influence = 1.0;
      } else {
        influence = 0.0;
      }
    }

    var reduceMotion = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var raf = null, running = false, t0 = performance.now(), pausedAt = 0;

    function draw(timeMs) {
      gl.uniform1f(U.iTime, (timeMs - t0) * 0.001);
      mouse.x += (target.x - mouse.x) * 0.1;
      mouse.y += (target.y - mouse.y) * 0.1;
      influenceSmoothed += (influence - influenceSmoothed) * 0.05;
      gl.uniform2f(U.mousePosition, mouse.x, mouse.y);
      gl.uniform1f(U.mouseInfluence, influenceSmoothed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function frame(now) {
      draw(now);
      raf = requestAnimationFrame(frame);
    }

    function startLoop() {
      if (running || reduceMotion) return;
      running = true;
      if (pausedAt) { t0 += performance.now() - pausedAt; pausedAt = 0; }
      raf = requestAnimationFrame(frame);
    }
    function stopLoop() {
      if (!running) return;
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      pausedAt = performance.now();
    }

    resize();
    draw(performance.now()); // paint an immediate first frame (no blank flash)

    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { resize(); if (!running) draw(performance.now()); });
      ro.observe(container);
    } else {
      window.addEventListener('resize', resize);
    }

    if (opts.mouseInteraction && !reduceMotion) {
      window.addEventListener('mousemove', onMove, { passive: true });
    }

    function onscreen() {
      var r = container.getBoundingClientRect();
      return r.bottom > 0 && r.top < (window.innerHeight || document.documentElement.clientHeight);
    }
    function onVisibility() {
      if (document.visibilityState === 'hidden') stopLoop();
      else if (onscreen()) startLoop();
    }

    var io = null;
    if (reduceMotion) {
      // Honor reduced-motion: single static frame already drawn above.
    } else if (window.IntersectionObserver) {
      io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting && document.visibilityState !== 'hidden') startLoop();
          else stopLoop();
        }
      }, { threshold: 0 });
      io.observe(container);
    } else {
      startLoop();
    }
    document.addEventListener('visibilitychange', onVisibility);

    return {
      resize: resize,
      destroy: function () {
        stopLoop();
        if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
        if (io) io.disconnect();
        window.removeEventListener('mousemove', onMove);
        document.removeEventListener('visibilitychange', onVisibility);
        var lose = gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
  }

  function num(v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; }

  function optionsFromAttrs(el) {
    var d = el.dataset, o = {};
    if (d.gridColor != null) o.gridColor = d.gridColor;
    if (d.enableRainbow != null) o.enableRainbow = d.enableRainbow === 'true';
    if (d.rippleIntensity != null) o.rippleIntensity = num(d.rippleIntensity, DEFAULTS.rippleIntensity);
    if (d.gridSize != null) o.gridSize = num(d.gridSize, DEFAULTS.gridSize);
    if (d.gridThickness != null) o.gridThickness = num(d.gridThickness, DEFAULTS.gridThickness);
    if (d.fadeDistance != null) o.fadeDistance = num(d.fadeDistance, DEFAULTS.fadeDistance);
    if (d.vignetteStrength != null) o.vignetteStrength = num(d.vignetteStrength, DEFAULTS.vignetteStrength);
    if (d.glowIntensity != null) o.glowIntensity = num(d.glowIntensity, DEFAULTS.glowIntensity);
    if (d.opacity != null) o.opacity = num(d.opacity, DEFAULTS.opacity);
    if (d.gridRotation != null) o.gridRotation = num(d.gridRotation, DEFAULTS.gridRotation);
    if (d.mouseInteraction != null) o.mouseInteraction = d.mouseInteraction === 'true';
    if (d.mouseInteractionRadius != null) o.mouseInteractionRadius = num(d.mouseInteractionRadius, DEFAULTS.mouseInteractionRadius);
    if (d.lightMode != null) o.lightMode = d.lightMode === 'true';
    return o;
  }

  function autoMount() {
    var els = document.querySelectorAll('[data-ripple-grid]');
    for (var i = 0; i < els.length; i++) { mount(els[i], optionsFromAttrs(els[i])); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    autoMount();
  }

  window.RippleGrid = { mount: mount };
})();
