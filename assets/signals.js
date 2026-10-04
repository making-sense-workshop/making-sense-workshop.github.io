// Hero sensor streams: each channel starts as raw noise on the left and
// resolves into a clean, labeled signal on the right.
(() => {
  const scope = document.querySelector(".scope");
  if (!scope) return;

  const SVG_NS = "http://www.w3.org/2000/svg";
  const TAU = Math.PI * 2;
  const PX_PER_SECOND = 170; // horizontal scale of signal time
  const SPEED = 0.3; // signal seconds per real second
  const STEP = 1; // px between samples
  const TOP = 10; // headroom so the first channel label isn't clipped

  const frac = (x) => x - Math.floor(x);
  const gauss = (p, mu, sigma) => Math.exp(-((p - mu) ** 2) / (2 * sigma * sigma));
  const smooth = (a, b, x) => {
    const s = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return s * s * (3 - 2 * s);
  };

  // Deterministic value noise, so the noise travels with the signal instead of flickering.
  const hash = (i, seed) => {
    let h = Math.imul(i ^ seed, 0x27d4eb2d);
    h ^= h >>> 15;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    return ((h >>> 0) / 4294967295) * 2 - 1;
  };
  const noise = (u, seed) => {
    const i = Math.floor(u);
    const s = smooth(0, 1, u - i);
    return hash(i, seed) * (1 - s) + hash(i + 1, seed) * s;
  };

  // Each signal returns roughly -1..1 for time u in seconds.
  const channels = [
    {
      label: "PPG",
      color: "--ppg",
      signal: (u) => {
        const p = frac(u * 1.2);
        return 1.7 * (gauss(p, 0.18, 0.07) + 0.42 * gauss(p, 0.45, 0.07)) - 0.7 + 0.06 * Math.sin(u * 1.3);
      },
    },
    {
      label: "ECG",
      color: "--ecg",
      signal: (u) => {
        const p = frac(u * 1.05);
        return (
          0.12 * gauss(p, 0.12, 0.025) -
          0.15 * gauss(p, 0.212, 0.01) +
          1.05 * gauss(p, 0.235, 0.012) -
          0.3 * gauss(p, 0.258, 0.011) +
          0.26 * gauss(p, 0.47, 0.045) -
          0.2
        );
      },
    },
    {
      label: "EEG",
      color: "--eeg",
      signal: (u) =>
        (0.5 * Math.sin(TAU * 9.5 * u) + 0.3 * Math.sin(TAU * 5.7 * u + 1.3) + 0.18 * Math.sin(TAU * 17 * u + 0.4)) *
          (0.65 + 0.35 * Math.sin(TAU * 0.4 * u)) +
        0.2 * noise(u * 14, 7),
    },
    {
      label: "Accelerometer",
      color: "--acc",
      signal: (u) =>
        0.42 * Math.sin(TAU * 1.8 * u) + 0.2 * Math.sin(TAU * 3.6 * u + 0.6) + 0.7 * gauss(frac(u * 1.8), 0.08, 0.025) - 0.2,
    },
    {
      label: "Microphone",
      color: "--mic",
      signal: (u) => {
        const envelope = Math.max(0, Math.sin(TAU * 1.6 * u)) ** 1.5 * (0.55 + 0.45 * Math.sin(TAU * 0.23 * u + 2));
        return envelope * (0.8 * Math.sin(TAU * 22 * u) + 0.2 * Math.sin(TAU * 35 * u));
      },
    },
    {
      label: "Pressure",
      color: "--touch",
      signal: (u) => {
        const p = frac(u * 0.42);
        const grasp = smooth(0.05, 0.12, p) * (1 - smooth(0.35, 0.42, p)) + 0.6 * smooth(0.55, 0.6, p) * (1 - smooth(0.78, 0.86, p));
        return -0.7 + 1.5 * grasp * (0.92 + 0.08 * Math.sin(TAU * 7 * u));
      },
    },
  ];

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const toggle = document.querySelector(".scope-toggle");

  let svg;
  let paths = [];
  let width = 0;
  let rowHeight = 0;
  let t = 3;
  let paused = false;
  let visible = true;
  let frame = 0;
  let last = 0;

  function el(name, attrs) {
    const node = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  }

  function build() {
    width = Math.round(scope.clientWidth);
    if (!width) return;
    rowHeight = width < 640 ? 34 : 46;
    const height = TOP + rowHeight * channels.length;

    // Align labels with the right edge of the page's content column.
    const column = document.querySelector(".hero .wrap");
    const gutter = parseFloat(getComputedStyle(column).paddingRight) || 16;
    const labelX = column.getBoundingClientRect().right - scope.getBoundingClientRect().left - gutter;

    svg = el("svg", { viewBox: `0 0 ${width} ${height}`, width, height, "aria-hidden": "true", focusable: "false" });
    const defs = el("defs", {});
    svg.appendChild(defs);
    paths = [];

    channels.forEach((channel, i) => {
      const id = `trace-${i}`;
      const gradient = el("linearGradient", { id, gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: width, y2: 0 });
      [
        [0, "--trace-idle"],
        [0.3, "--trace-idle"],
        [0.62, channel.color],
        [1, channel.color],
      ].forEach(([offset, token]) => {
        gradient.appendChild(el("stop", { offset, style: `stop-color: var(${token})` }));
      });
      defs.appendChild(gradient);

      const center = TOP + rowHeight * (i + 0.5);
      svg.appendChild(el("line", { class: "baseline", x1: 0, x2: width, y1: center, y2: center }));
      const path = el("path", { class: "trace", stroke: `url(#${id})` });
      svg.appendChild(path);
      paths.push(path);

      const label = el("text", {
        class: "channel-label",
        x: labelX,
        y: center - rowHeight * 0.3,
        "text-anchor": "end",
        style: `fill: var(${channel.color})`,
      });
      label.textContent = channel.label;
      svg.appendChild(label);
    });

    scope.replaceChildren(svg);
    draw();
  }

  function draw() {
    // Move the signal in whole-sample steps. Each frame is then an exact shift of
    // the last one, so the noisy part scrolls instead of shimmering in place.
    const sampleTime = STEP / PX_PER_SECOND;
    const tq = Math.round(t / sampleTime) * sampleTime;
    const amplitude = rowHeight * 0.34;
    channels.forEach((channel, i) => {
      const center = TOP + rowHeight * (i + 0.5);
      let d = "";
      for (let x = 0; x <= width; x += STEP) {
        const u = tq + x / PX_PER_SECOND;
        const rawness = 1 - smooth(0.22, 0.6, x / width);
        const jitter = 0.75 * (noise(u * 22, i * 131 + 1) + 0.5 * noise(u * 57, i * 131 + 2));
        const value = Math.max(-1.25, Math.min(1.25, channel.signal(u) + jitter * rawness));
        d += `${x === 0 ? "M" : "L"}${x.toFixed(1)} ${(center - value * amplitude).toFixed(1)}`;
      }
      paths[i].setAttribute("d", d);
    });
  }

  function shouldRun() {
    return !reducedMotion.matches && !paused && visible;
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt * SPEED;
    draw();
    frame = requestAnimationFrame(tick);
  }

  function update() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (toggle) toggle.hidden = reducedMotion.matches;
    if (shouldRun() && svg) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      paused = !paused;
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.textContent = paused ? "Play signals" : "Pause signals";
      update();
    });
  }

  reducedMotion.addEventListener("change", update);

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    update();
  }).observe(scope);

  let lastWidth = 0;
  new ResizeObserver(() => {
    const current = Math.round(scope.clientWidth);
    if (current === lastWidth) return;
    lastWidth = current;
    build();
    update();
  }).observe(scope);
})();
