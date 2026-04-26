"use strict";

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  let manualTheme = null;
  const docEl = document.documentElement;

  function safeFormatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  async function safeCopy(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    return false;
  }

  async function safePlay(media) {
    if (!media) return false;
    try {
      const result = media.play();
      if (result?.then) await result;
      return true;
    } catch {
      return false;
    }
  }

  function flashMessage(message, type = "info") {
    let box = $("#tv-status-toast");
    if (!box) return;

    box.textContent = message;
    box.style.borderColor =
      type === "success"
        ? "rgba(116,246,255,.35)"
        : type === "error"
        ? "rgba(255,80,100,.35)"
        : type === "accent"
        ? "rgba(215,179,116,.35)"
        : "rgba(255,255,255,.12)";

    box.style.opacity = "1";
    box.style.transform = "translateY(0)";
    clearTimeout(box._timer);
    box._timer = setTimeout(() => {
      box.style.opacity = "0";
      box.style.transform = "translateY(8px)";
    }, 1900);
  }

  // -------------------------
  // theme
  // -------------------------
  function applyTheme(theme) {
    docEl.setAttribute("data-theme", theme);

    if (theme === "light") {
      document.body.style.background = `
        radial-gradient(circle at 20% 20%, rgba(116,246,255,.07), transparent 28%),
        radial-gradient(circle at 80% 15%, rgba(214,110,255,.08), transparent 25%),
        radial-gradient(circle at 50% 80%, rgba(215,179,116,.07), transparent 35%),
        linear-gradient(180deg, #f7f3ed 0%, #efebe2 16%, #ece7dd 45%, #e7e3db 100%)
      `;
      document.body.style.color = "#191714";
    } else {
      document.body.style.background = `
        radial-gradient(circle at 20% 20%, rgba(116,246,255,.07), transparent 28%),
        radial-gradient(circle at 80% 15%, rgba(214,110,255,.08), transparent 25%),
        radial-gradient(circle at 50% 80%, rgba(215,179,116,.07), transparent 35%),
        linear-gradient(180deg, #050608 0%, #06080c 16%, #090c11 45%, #040507 100%)
      `;
      document.body.style.color = "";
    }
  }

  function setInitialTheme() {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }

  function initThemeToggle() {
    const themeToggle = $("#themeToggle");
    setInitialTheme();

    themeToggle?.addEventListener("click", () => {
      const current = docEl.getAttribute("data-theme") || "dark";
      manualTheme = current === "dark" ? "light" : "dark";
      applyTheme(manualTheme);
    });
  }

  // -------------------------
  // loader
  // -------------------------
  function initLoader() {
    const loader = $("#loader-screen");
    const text = $("#loader-text");
    const final = "TwoVANDALS";
    let index = 1;

    if (text) text.textContent = final[0];

    const interval = setInterval(() => {
      if (!text) return;
      if (index < final.length) {
        text.textContent += final[index];
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => loader?.classList.add("hidden"), 700);
      }
    }, 140);
  }

  // -------------------------
  // reveal
  // -------------------------
  function initReveal() {
    const items = $$(".reveal");
    if (!items.length) return;

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    items.forEach((el) => revealObserver.observe(el));
  }

  // -------------------------
  // scrollspy
  // -------------------------
  function initScrollSpy() {
    const sections = $$("main section[id]");
    const navLinks = $$(".nav a");
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("id");
          const link = document.querySelector(`.nav a[href="#${id}"]`);
          if (entry.isIntersecting) {
            navLinks.forEach((a) => a.classList.remove("active"));
            link?.classList.add("active");
          }
        });
      },
      {
        rootMargin: "-28% 0px -54% 0px",
        threshold: 0.08
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  // -------------------------
  // cursor glow
  // -------------------------
  function initCursorGlow() {
    const cursorGlow = $("#cursorGlow");
    if (!cursorGlow) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    window.addEventListener("pointermove", (e) => {
      cursorGlow.style.left = `${e.clientX}px`;
      cursorGlow.style.top = `${e.clientY}px`;
    });

    $$("a, button, .manifest-lines p, .seq-cell").forEach((el) => {
      el.addEventListener("mouseenter", () => cursorGlow.classList.add("active"));
      el.addEventListener("mouseleave", () => cursorGlow.classList.remove("active"));
    });
  }

  // -------------------------
  // snow
  // -------------------------
  function initSnow() {
    const snowCanvas = $("#snow-canvas");
    if (!snowCanvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = snowCanvas.getContext("2d");
    if (!ctx) return;

    let flakes = [];
    let animationId = null;

    function resizeCanvas() {
      snowCanvas.width = window.innerWidth;
      snowCanvas.height = window.innerHeight;
    }

    function createSnowflake() {
      return {
        x: Math.random() * snowCanvas.width,
        y: Math.random() * -snowCanvas.height,
        radius: Math.random() * 2.4 + 0.7,
        speedY: Math.random() * 0.9 + 0.35,
        speedX: (Math.random() - 0.5) * 0.35,
        alpha: Math.random() * 0.45 + 0.18
      };
    }

    function resetFlakes() {
      flakes = Array.from({ length: 120 }, createSnowflake);
    }

    function render() {
      ctx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);

      flakes.forEach((flake, i) => {
        flake.y += flake.speedY;
        flake.x += flake.speedX + Math.sin(flake.y * 0.01) * 0.2;

        if (
          flake.y > snowCanvas.height + 20 ||
          flake.x < -20 ||
          flake.x > snowCanvas.width + 20
        ) {
          flakes[i] = createSnowflake();
          flakes[i].y = -20;
        }

        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${flake.alpha})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    }

    resizeCanvas();
    resetFlakes();
    render();

    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        render();
      }
    });
  }

  // -------------------------
  // click sound
  // -------------------------
  function initClickSound() {
    const clickAudio = $("#clickSound");

    document.addEventListener("click", (e) => {
      const interactive = e.target.closest("button, a, .egg");
      if (!interactive || !clickAudio) return;
      try {
        clickAudio.currentTime = 0;
        clickAudio.play().catch(() => {});
      } catch {}
    });
  }

  // -------------------------
  // manifest glitch
  // -------------------------
  function initInteractiveManifest() {
    const lines = $$(".manifest-lines [data-glitch], .manifest-lines p");
    if (!lines.length) return;

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/=+*-_";
    let audioCtx = null;

    function blip(freq = 220, duration = 0.06, type = "square", gainValue = 0.012) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtx) audioCtx = new AudioCtx();
        if (audioCtx.state === "suspended") audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = gainValue;

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;
        gain.gain.setValueAtTime(gainValue, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.start(now);
        osc.stop(now + duration);
      } catch {}
    }

    function scramble(el) {
      if (el.dataset.animating === "1") return;
      el.dataset.animating = "1";

      const original = el.dataset.original || el.textContent.trim();
      el.dataset.original = original;

      let frame = 0;
      const totalFrames = 12;

      const tick = () => {
        const progress = frame / totalFrames;
        const revealCount = Math.floor(original.length * progress);

        el.textContent = original
          .split("")
          .map((ch, i) => {
            if (ch === " ") return " ";
            if (i < revealCount) return original[i];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");

        frame++;
        if (frame <= totalFrames) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = original;
          el.dataset.animating = "0";
        }
      };

      tick();
    }

    lines.forEach((line, i) => {
      line.dataset.original = line.textContent.trim();

      line.addEventListener("mouseenter", () => {
        scramble(line);
        blip(150 + i * 30, 0.05, i % 2 ? "triangle" : "square");
      });

      line.addEventListener("click", () => {
        scramble(line);
        blip(110 + i * 50, 0.08, "sawtooth", 0.017);
      });
    });
  }

  // -------------------------
  // sequencer
  // -------------------------
  function initSequencer() {
    const drumGridEl = $("#drumGrid");
    const synthGridEl = $("#synthGrid");
    if (!drumGridEl || !synthGridEl) return;

    const playBtn = $("#seqPlayBtn");
    const stopBtn = $("#seqStopBtn");
    const randomBtn = $("#seqRandomBtn");
    const clearBtn = $("#seqClearBtn");
    const shareBtn = $("#seqShareBtn");
    const bpmSlider = $("#seqBpm");
    const bpmValue = $("#seqBpmValue");

    const steps = 16;
    const drumRows = ["kick", "snare", "hat"];
    const noteRows = ["C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4"];
    const noteFreq = {
      C5: 523.25,
      B4: 493.88,
      A4: 440.0,
      G4: 392.0,
      F4: 349.23,
      E4: 329.63,
      D4: 293.66,
      C4: 261.63
    };

    let audioCtx = null;
    let master = null;
    let stepIndex = 0;
    let playing = false;
    let timer = null;
    let bpm = Number(bpmSlider?.value || 118);

    const drumState = drumRows.map(() => Array(steps).fill(false));
    const noteState = noteRows.map(() => Array(steps).fill(false));

    function ensureAudio() {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      if (!audioCtx) {
        audioCtx = new AudioCtx();
        master = audioCtx.createGain();
        master.gain.value = 0.28;
        master.connect(audioCtx.destination);
      }
      if (audioCtx.state === "suspended") audioCtx.resume();
      return true;
    }

    function playKick(time) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(44, time + 0.12);
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.13);
      osc.connect(gain).connect(master);
      osc.start(time);
      osc.stop(time + 0.14);
    }

    function playSnare(time) {
      const bufferSize = audioCtx.sampleRate * 0.12;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

      const noise = audioCtx.createBufferSource();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();

      noise.buffer = buffer;
      filter.type = "highpass";
      filter.frequency.value = 1200;
      gain.gain.setValueAtTime(0.14, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

      noise.connect(filter).connect(gain).connect(master);
      noise.start(time);
      noise.stop(time + 0.12);
    }

    function playHat(time) {
      const bufferSize = audioCtx.sampleRate * 0.04;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

      const noise = audioCtx.createBufferSource();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();

      noise.buffer = buffer;
      filter.type = "highpass";
      filter.frequency.value = 5000;
      gain.gain.setValueAtTime(0.07, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

      noise.connect(filter).connect(gain).connect(master);
      noise.start(time);
      noise.stop(time + 0.04);
    }

    function playSynth(freq, time, duration = 0.24) {
      const osc = audioCtx.createOscillator();
      const sub = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();

      osc.type = "sawtooth";
      sub.type = "triangle";
      osc.frequency.value = freq;
      sub.frequency.value = freq / 2;
      filter.type = "lowpass";
      filter.frequency.value = 1400;
      filter.Q.value = 2.2;

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.08, time + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      sub.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      osc.start(time);
      sub.start(time);
      osc.stop(time + duration);
      sub.stop(time + duration);
    }

    function buildGrid(container, rows, state, group) {
      container.innerHTML = "";

      rows.forEach((rowName, rowIndex) => {
        const row = document.createElement("div");
        row.className = "cell-row";

        for (let step = 0; step < steps; step++) {
          const cell = document.createElement("button");
          cell.type = "button";
          cell.className = "seq-cell";
          cell.dataset.group = group;
          cell.dataset.row = String(rowIndex);
          cell.dataset.step = String(step);
          cell.setAttribute("aria-label", `${group} ${rowName} step ${step + 1}`);

          if (state[rowIndex][step]) cell.classList.add("active");

          cell.addEventListener("click", () => {
            state[rowIndex][step] = !state[rowIndex][step];
            cell.classList.toggle("active", state[rowIndex][step]);
            syncUrl();
          });

          row.appendChild(cell);
        }

        container.appendChild(row);
      });
    }

    function clearPlayingState() {
      $$(".seq-cell.playing").forEach((cell) => cell.classList.remove("playing"));
    }

    function markStep(step) {
      clearPlayingState();
      $$(`.seq-cell[data-step="${step}"]`).forEach((cell) => cell.classList.add("playing"));
    }

    function encodePattern() {
      const drum = drumState.flat().map((v) => (v ? "1" : "0")).join("");
      const synth = noteState.flat().map((v) => (v ? "1" : "0")).join("");
      return `${drum}.${synth}.${bpm}`;
    }

    function decodePattern(serialized) {
      if (!serialized) return;
      const [drumBits, synthBits, bpmBits] = serialized.split(".");

      if (bpmBits) {
        bpm = Math.min(Math.max(Number(bpmBits) || 118, 70), 170);
        if (bpmSlider) bpmSlider.value = String(bpm);
        if (bpmValue) bpmValue.textContent = String(bpm);
      }

      if (drumBits?.length === drumRows.length * steps) {
        let i = 0;
        for (let r = 0; r < drumRows.length; r++) {
          for (let s = 0; s < steps; s++) drumState[r][s] = drumBits[i++] === "1";
        }
      }

      if (synthBits?.length === noteRows.length * steps) {
        let i = 0;
        for (let r = 0; r < noteRows.length; r++) {
          for (let s = 0; s < steps; s++) noteState[r][s] = synthBits[i++] === "1";
        }
      }
    }

    function syncUrl() {
      const url = new URL(window.location.href);
      url.searchParams.set("pattern", encodePattern());
      history.replaceState({}, "", url);
    }

    function triggerStep(step, time) {
      markStep(step);

      if (drumState[0][step]) playKick(time);
      if (drumState[1][step]) playSnare(time);
      if (drumState[2][step]) playHat(time);

      noteRows.forEach((note, rowIndex) => {
        if (noteState[rowIndex][step]) playSynth(noteFreq[note], time);
      });
    }

    function tick() {
      if (!audioCtx) return;
      triggerStep(stepIndex, audioCtx.currentTime + 0.01);
      stepIndex = (stepIndex + 1) % steps;
    }

    function startSequencer() {
      if (playing) return;
      if (!ensureAudio()) return;

      const intervalMs = (60 / bpm / 4) * 1000;
      playing = true;
      tick();
      timer = setInterval(tick, intervalMs);
      flashMessage("SEQUENCER ON", "success");
    }

    function stopSequencer() {
      playing = false;
      clearInterval(timer);
      timer = null;
      stepIndex = 0;
      clearPlayingState();
      flashMessage("SEQUENCER STOPPED");
    }

    function randomizePattern() {
      drumState.forEach((row, r) => {
        row.forEach((_, s) => {
          const chance = r === 2 ? 0.38 : 0.24;
          drumState[r][s] = Math.random() < chance;
        });
      });

      noteState.forEach((row, r) => {
        row.forEach((_, s) => {
          const chance = r < 2 ? 0.08 : 0.14;
          noteState[r][s] = Math.random() < chance;
        });
      });

      renderGridState();
      syncUrl();
      flashMessage("RANDOM PATTERN", "accent");
    }

    function clearPattern() {
      drumState.forEach((row) => row.fill(false));
      noteState.forEach((row) => row.fill(false));
      renderGridState();
      syncUrl();
      flashMessage("PATTERN CLEARED");
    }

    function renderGridState() {
      $$(".seq-cell[data-group='drum']").forEach((cell) => {
        const r = Number(cell.dataset.row);
        const s = Number(cell.dataset.step);
        cell.classList.toggle("active", drumState[r][s]);
      });

      $$(".seq-cell[data-group='synth']").forEach((cell) => {
        const r = Number(cell.dataset.row);
        const s = Number(cell.dataset.step);
        cell.classList.toggle("active", noteState[r][s]);
      });
    }

    const params = new URLSearchParams(window.location.search);
    decodePattern(params.get("pattern"));

    buildGrid(drumGridEl, drumRows, drumState, "drum");
    buildGrid(synthGridEl, noteRows, noteState, "synth");
    renderGridState();

    if (bpmValue) bpmValue.textContent = String(bpm);

    bpmSlider?.addEventListener("input", () => {
      bpm = Number(bpmSlider.value);
      if (bpmValue) bpmValue.textContent = String(bpm);
      syncUrl();

      if (playing) {
        stopSequencer();
        startSequencer();
      }
    });

    playBtn?.addEventListener("click", startSequencer);
    stopBtn?.addEventListener("click", stopSequencer);
    randomBtn?.addEventListener("click", randomizePattern);
    clearBtn?.addEventListener("click", clearPattern);

    shareBtn?.addEventListener("click", async () => {
      syncUrl();
      const ok = await safeCopy(window.location.href);
      flashMessage(ok ? "LINK COPIED" : "COPY FAILED", ok ? "success" : "error");
    });
  }

  // -------------------------
  // soundlab
  // -------------------------
  function initSoundLab() {
    const initBtn = $("#soundLabInit");
    const droneSlider = $("#ambienceDrone");
    const noiseSlider = $("#ambienceNoise");
    const pulseSlider = $("#ambiencePulse");
    if (!initBtn || !droneSlider || !noiseSlider || !pulseSlider) return;

    let audioCtx = null;
    let droneOsc = null;
    let droneSub = null;
    let droneGain = null;
    let noiseSource = null;
    let noiseGain = null;
    let pulseOsc = null;
    let pulseGain = null;
    let lfo = null;
    let lfoGain = null;
    let ready = false;

    function createNoiseBuffer(ctx, seconds = 2) {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      return buffer;
    }

    function boot() {
      if (ready) return true;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;

      audioCtx = new AudioCtx();

      droneOsc = audioCtx.createOscillator();
      droneSub = audioCtx.createOscillator();
      droneGain = audioCtx.createGain();
      const droneFilter = audioCtx.createBiquadFilter();

      droneOsc.type = "sawtooth";
      droneSub.type = "triangle";
      droneOsc.frequency.value = 55;
      droneSub.frequency.value = 27.5;
      droneFilter.type = "lowpass";
      droneFilter.frequency.value = 320;
      droneGain.gain.value = 0;

      droneOsc.connect(droneFilter);
      droneSub.connect(droneFilter);
      droneFilter.connect(droneGain).connect(audioCtx.destination);

      noiseSource = audioCtx.createBufferSource();
      noiseSource.buffer = createNoiseBuffer(audioCtx, 3);
      noiseSource.loop = true;
      noiseGain = audioCtx.createGain();
      const noiseFilter = audioCtx.createBiquadFilter();
      noiseFilter.type = "highpass";
      noiseFilter.frequency.value = 2800;
      noiseGain.gain.value = 0;
      noiseSource.connect(noiseFilter).connect(noiseGain).connect(audioCtx.destination);

      pulseOsc = audioCtx.createOscillator();
      pulseGain = audioCtx.createGain();
      pulseOsc.type = "square";
      pulseOsc.frequency.value = 110;
      pulseGain.gain.value = 0;

      lfo = audioCtx.createOscillator();
      lfoGain = audioCtx.createGain();
      lfo.type = "sine";
      lfo.frequency.value = 2.2;
      lfoGain.gain.value = 0.018;
      lfo.connect(lfoGain).connect(pulseGain.gain);

      pulseOsc.connect(pulseGain).connect(audioCtx.destination);

      droneOsc.start();
      droneSub.start();
      noiseSource.start();
      pulseOsc.start();
      lfo.start();

      ready = true;
      return true;
    }

    function applyValues() {
      if (!ready) return;
      droneGain.gain.setTargetAtTime(Number(droneSlider.value) / 500, audioCtx.currentTime, 0.08);
      noiseGain.gain.setTargetAtTime(Number(noiseSlider.value) / 900, audioCtx.currentTime, 0.08);
      pulseGain.gain.setTargetAtTime(Number(pulseSlider.value) / 800, audioCtx.currentTime, 0.08);
    }

    initBtn.addEventListener("click", async () => {
      const ok = boot();
      if (!ok) {
        flashMessage("WEB AUDIO OFFLINE", "error");
        return;
      }
      if (audioCtx.state === "suspended") await audioCtx.resume();
      applyValues();
      flashMessage("SOUNDLAB ACTIVE", "success");
    });

    [droneSlider, noiseSlider, pulseSlider].forEach((slider) => {
      slider.addEventListener("input", applyValues);
    });
  }

  // -------------------------
  // track anatomy
  // -------------------------
  function initTrackAnatomy() {
    const audio = $("#anatomyTrack");
    const playBtn = $("#anatomyPlay");
    const lowpass = $("#anatomyLowpass");
    const drive = $("#anatomyDrive");
    const now = $("#anatomyNow");
    const seekMarkers = $$("[data-seek-anatomy]");

    if (!audio || !playBtn || !lowpass || !drive) return;

    let audioCtx = null;
    let source = null;
    let filter = null;
    let distortion = null;
    let outputGain = null;
    let ready = false;

    function makeDistortionCurve(amount = 20) {
      const k = typeof amount === "number" ? amount : 0;
      const n = 44100;
      const curve = new Float32Array(n);
      const deg = Math.PI / 180;

      for (let i = 0; i < n; i++) {
        const x = (i * 2) / n - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
      return curve;
    }

    async function ensureGraph() {
      if (ready) {
        if (audioCtx.state === "suspended") await audioCtx.resume();
        return true;
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;

      audioCtx = new AudioCtx();
      source = audioCtx.createMediaElementSource(audio);
      filter = audioCtx.createBiquadFilter();
      distortion = audioCtx.createWaveShaper();
      outputGain = audioCtx.createGain();

      filter.type = "lowpass";
      filter.frequency.value = Number(lowpass.value || 12000);
      distortion.curve = makeDistortionCurve(Number(drive.value || 0));
      distortion.oversample = "4x";
      outputGain.gain.value = 0.95;

      source.connect(filter);
      filter.connect(distortion);
      distortion.connect(outputGain);
      outputGain.connect(audioCtx.destination);

      if (audioCtx.state === "suspended") await audioCtx.resume();

      ready = true;
      return true;
    }

    playBtn.addEventListener("click", async () => {
      const ok = await ensureGraph();
      if (!ok) {
        flashMessage("TRACK ANATOMY OFFLINE", "error");
        return;
      }

      if (audio.paused) {
        const started = await safePlay(audio);
        if (!started) flashMessage("PLAY BLOCKED", "error");
      } else {
        audio.pause();
      }
    });

    lowpass.addEventListener("input", () => {
      if (filter) filter.frequency.value = Number(lowpass.value);
    });

    drive.addEventListener("input", () => {
      if (distortion) distortion.curve = makeDistortionCurve(Number(drive.value));
    });

    seekMarkers.forEach((btn) => {
      btn.addEventListener("click", () => {
        audio.currentTime = Number(btn.dataset.seekAnatomy || 0);
      });
    });

    audio.addEventListener("timeupdate", () => {
      if (now) now.textContent = safeFormatTime(audio.currentTime);
    });

    audio.addEventListener("play", () => {
      playBtn.textContent = "Pause Track";
    });

    audio.addEventListener("pause", () => {
      playBtn.textContent = "Play Track";
    });
  }

  // -------------------------
  // main player
  // -------------------------
  function initMainAudioPlayer() {
    const audio = $("#bgTrack");
    const playPauseBtn = $("#playPauseBtn");
    const volumeSlider = $("#volumeSlider");
    const seekBar = $("#seekBar");
    const currentTimeEl = $("#currentTime");
    const durationEl = $("#duration");
    const toggleBtn = $("#togglePlayer");
    const audioPlayer = $("#audioPlayer");
    const prevBtn = $("#prevTrackBtn");
    const nextBtn = $("#nextTrackBtn");
    const trackTitle = $("#trackTitle");

    if (!audio || !playPauseBtn) return;

    const playlist = ["ybuocfiewu.mp3", "track2.mp3", "track3.mp3"];
    let currentIndex = 0;

    function setState(isPlaying) {
      playPauseBtn.textContent = isPlaying ? "Pause" : "Listen";
    }

    async function loadTrack(index, autoplay = false) {
      if (index < 0) index = playlist.length - 1;
      if (index >= playlist.length) index = 0;

      currentIndex = index;
      audio.src = playlist[currentIndex];
      if (trackTitle) trackTitle.textContent = `Track ${currentIndex + 1}`;
      audio.load();

      if (autoplay) {
        const ok = await safePlay(audio);
        setState(ok && !audio.paused);
      } else {
        setState(false);
      }
    }

    playPauseBtn.addEventListener("click", async () => {
      if (audio.paused) {
        const ok = await safePlay(audio);
        setState(ok && !audio.paused);
      } else {
        audio.pause();
        setState(false);
      }
    });

    prevBtn?.addEventListener("click", () => loadTrack(currentIndex - 1, true));
    nextBtn?.addEventListener("click", () => loadTrack(currentIndex + 1, true));

    volumeSlider?.addEventListener("input", () => {
      audio.volume = Math.min(Math.max(Number(volumeSlider.value), 0), 1);
    });

    audio.addEventListener("loadedmetadata", () => {
      if (seekBar) seekBar.max = Math.floor(audio.duration || 0);
      if (durationEl) durationEl.textContent = safeFormatTime(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
      if (seekBar && !seekBar.matches(":active")) {
        seekBar.value = String(Math.floor(audio.currentTime || 0));
      }
      if (currentTimeEl) currentTimeEl.textContent = safeFormatTime(audio.currentTime);
    });

    seekBar?.addEventListener("input", () => {
      audio.currentTime = Number(seekBar.value || 0);
    });

    toggleBtn?.addEventListener("click", () => {
      if (!audioPlayer) return;
      const collapsed = audioPlayer.classList.toggle("collapsed");
      toggleBtn.textContent = collapsed ? "+" : "−";
      if (!collapsed) {
        setTimeout(() => {
          audioPlayer.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
      }
    });

    audio.addEventListener("play", () => setState(true));
    audio.addEventListener("pause", () => setState(false));
    audio.addEventListener("ended", () => loadTrack(currentIndex + 1, true));

    loadTrack(currentIndex, false);
  }

  // -------------------------
  // easter eggs
  // -------------------------
  function initEasterEggs() {
    const eggs = $$(".egg");
    if (!eggs.length) return;

    const badge = $("#egg-progress");
    const update = () => {
      const found = $$(".egg.found").length;
      if (badge) badge.textContent = `Artifacts ${found}/${eggs.length}`;
    };

    eggs.forEach((egg) => {
      egg.addEventListener("click", (e) => {
        if (egg.tagName === "A") e.preventDefault();

        if (!egg.classList.contains("found")) {
          egg.classList.add("found");
        }

        const found = $$(".egg.found").length;
        if (found === eggs.length && !$("#secret-section")) {
          const section = document.createElement("section");
          section.id = "secret-section";
          section.innerHTML = `
            <div class="secret-box">
              <h2>You unlocked the core.</h2>
              <p>This is only the beginning.</p>
            </div>
          `;
          document.body.appendChild(section);
          flashMessage("CORE UNLOCKED", "success");
        }

        if (egg.tagName === "A" && egg.getAttribute("href")) {
          window.location.href = egg.getAttribute("href");
        }

        update();
      });
    });

    update();
  }

  // -------------------------
  // optional track template support
  // -------------------------
  function initTemplateTrackCards() {
    const template = $("#audio-template");
    if (!template) return;
    window.loadTracks = async function loadTracks(fileList = []) {
      const mount = $("#trackList");
      if (!mount) return;
      mount.innerHTML = "";

      fileList.forEach((file) => {
        const clone = template.content.cloneNode(true);
        const audio = $("audio", clone);
        const title = $(".track-title", clone);
        const playBtn = $(".play-btn", clone);
        const seek = $(".seek-bar", clone);
        const volume = $(".volume-bar", clone);
        const currentTimeEl = $(".current-time", clone);
        const durationEl = $(".duration", clone);

        if (!audio) return;
        audio.src = file.url || file.publicUrl || "";
        if (title) title.textContent = (file.name || "Track").replace(/\.[^/.]+$/, "");

        playBtn?.addEventListener("click", async () => {
          if (audio.paused) {
            document.querySelectorAll("audio").forEach((a) => {
              if (a !== audio) a.pause();
            });
            const ok = await safePlay(audio);
            playBtn.textContent = ok ? "Pause" : "Play";
          } else {
            audio.pause();
          }
        });

        audio.addEventListener("play", () => {
          if (playBtn) playBtn.textContent = "Pause";
        });

        audio.addEventListener("pause", () => {
          if (playBtn) playBtn.textContent = "Play";
        });

        audio.addEventListener("loadedmetadata", () => {
          if (seek) seek.max = String(Math.floor(audio.duration || 0));
          if (durationEl) durationEl.textContent = safeFormatTime(audio.duration);
        });

        audio.addEventListener("timeupdate", () => {
          if (seek && !seek.matches(":active")) {
            seek.value = String(Math.floor(audio.currentTime || 0));
          }
          if (currentTimeEl) currentTimeEl.textContent = safeFormatTime(audio.currentTime);
        });

        seek?.addEventListener("input", () => {
          audio.currentTime = Number(seek.value || 0);
        });

        volume?.addEventListener("input", () => {
          audio.volume = Math.min(Math.max(Number(volume.value), 0), 1);
        });

        mount.appendChild(clone);
      });
    };
  }

  // -------------------------
  // boot
  // -------------------------
  document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initLoader();
    initReveal();
    initScrollSpy();
    initCursorGlow();
    initSnow();
    initClickSound();
    initInteractiveManifest();
    initSequencer();
    initSoundLab();
    initTrackAnatomy();
    initMainAudioPlayer();
    initEasterEggs();
    initTemplateTrackCards();
  });
})();
