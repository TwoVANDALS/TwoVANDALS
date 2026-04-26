(() => {
  "use strict";

  // =========================================================
  // UTILITIES
  // =========================================================
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const state = {
    theme: null,
    revealObserver: null,
    navObserver: null,
    loaderDone: false,
    pointer: {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    }
  };

  function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
  }

  function debounce(fn, delay = 120) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

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
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
      return true;
    } catch {
      return false;
    }
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function hasTouch() {
    return window.matchMedia("(hover: none)").matches;
  }

  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);

    if (theme === "light") {
      document.body.style.background =
        "radial-gradient(circle at 20% 20%, rgba(116,246,255,.07), transparent 28%), radial-gradient(circle at 80% 15%, rgba(214,110,255,.08), transparent 25%), radial-gradient(circle at 50% 80%, rgba(215,179,116,.07), transparent 35%), linear-gradient(180deg, #f7f3ed 0%, #efebe2 16%, #ece7dd 45%, #e7e3db 100%)";
      document.body.style.color = "#191714";
    } else {
      document.body.style.background =
        "radial-gradient(circle at 20% 20%, rgba(116,246,255,.07), transparent 28%), radial-gradient(circle at 80% 15%, rgba(214,110,255,.08), transparent 25%), radial-gradient(circle at 50% 80%, rgba(215,179,116,.07), transparent 35%), linear-gradient(180deg, #050608 0%, #06080c 16%, #090c11 45%, #040507 100%)";
      document.body.style.color = "";
    }
  }

  function initTheme() {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");

    const themeToggle = $("#themeToggle");
    if (!themeToggle) return;

    themeToggle.addEventListener("click", () => {
      setTheme(state.theme === "dark" ? "light" : "dark");
      flashMessage(state.theme === "dark" ? "DARK MODE" : "LIGHT MODE", "accent");
    });
  }

  function flashMessage(message, type = "info") {
    let box = $("#tv-status-toast");
    if (!box) {
      box = document.createElement("div");
      box.id = "tv-status-toast";
      document.body.appendChild(box);
    }

    box.textContent = message;
    box.style.borderColor =
      type === "success" ? "rgba(116,246,255,.35)" :
      type === "error" ? "rgba(255,80,100,.35)" :
      type === "accent" ? "rgba(215,179,116,.35)" :
      "rgba(255,255,255,.12)";

    box.style.opacity = "1";
    box.style.transform = "translateY(0)";

    clearTimeout(box._timer);
    box._timer = setTimeout(() => {
      box.style.opacity = "0";
      box.style.transform = "translateY(8px)";
    }, 1800);
  }

  function softScrollTo(target) {
    const el = typeof target === "string" ? $(target) : target;
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  }

  // =========================================================
  // LOADER
  // =========================================================
  function initLoader() {
    const loader = $("#loader-screen");
    const text = $("#loader-text");
    if (!loader || !text) return;

    const final = "TwoVANDALS";
    let index = 1;
    text.textContent = final[0];

    const interval = setInterval(() => {
      if (index < final.length) {
        text.textContent += final[index];
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          loader.classList.add("hidden");
          state.loaderDone = true;
        }, 700);
      }
    }, 140);

    window.addEventListener("load", () => {
      if (!state.loaderDone) {
        setTimeout(() => {
          loader.classList.add("hidden");
          state.loaderDone = true;
        }, 1200);
      }
    }, { once: true });
  }

  // =========================================================
  // REVEAL / SCROLLSPY
  // =========================================================
  function initReveal() {
    const items = $$(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion()) {
      items.forEach(item => item.classList.add("is-visible"));
      return;
    }

    state.revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => entry.target.classList.add("is-visible"));
          state.revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    items.forEach(item => state.revealObserver.observe(item));
  }

  function initScrollSpy() {
    const sections = $$("main section[id]");
    const navLinks = $$(".nav a");
    if (!sections.length || !navLinks.length) return;

    state.navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.getAttribute("id");
        const link = $(`.nav a[href="#${id}"]`);
        if (entry.isIntersecting) {
          navLinks.forEach(a => a.classList.remove("active"));
          link?.classList.add("active");
        }
      });
    }, {
      rootMargin: "-28% 0px -54% 0px",
      threshold: 0.08
    });

    sections.forEach(section => state.navObserver.observe(section));

    navLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href?.startsWith("#")) return;
        const target = $(href);
        if (!target) return;
        e.preventDefault();
        softScrollTo(target);
      });
    });
  }

  // =========================================================
  // CURSOR GLOW
  // =========================================================
  function initCursorGlow() {
    const glow = $("#cursorGlow");
    if (!glow || hasTouch() || prefersReducedMotion()) {
      if (glow) glow.style.display = "none";
      return;
    }

    window.addEventListener("pointermove", (e) => {
      state.pointer.x = e.clientX;
      state.pointer.y = e.clientY;
      glow.style.left = `${e.clientX}px`;
      glow.style.top = `${e.clientY}px`;
    });

    const interactiveSelectors = "a, button, .manifest-lines p, .seq-cell, .marker-btn, .ghost-btn, .btn";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(interactiveSelectors)) glow.classList.add("active");
      else glow.classList.remove("active");
    });
  }

  // =========================================================
  // SNOW EFFECT
  // =========================================================
  function initSnow() {
    const canvas = $("#snow-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (prefersReducedMotion()) return;

    let flakes = [];
    let animationId = null;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createSnowflake() {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        radius: Math.random() * 2.4 + 0.7,
        speedY: Math.random() * 0.95 + 0.35,
        speedX: (Math.random() - 0.5) * 0.35,
        alpha: Math.random() * 0.45 + 0.18
      };
    }

    function resetFlakes() {
      flakes = Array.from({ length: 120 }, createSnowflake);
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      flakes.forEach((flake, i) => {
        flake.y += flake.speedY;
        flake.x += flake.speedX + Math.sin(flake.y * 0.012) * 0.18;

        if (
          flake.y > canvas.height + 20 ||
          flake.x < -20 ||
          flake.x > canvas.width + 20
        ) {
          flakes[i] = createSnowflake();
          flakes[i].y = -20;
        }

        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${flake.alpha})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    }

    resizeCanvas();
    resetFlakes();
    draw();

    window.addEventListener("resize", resizeCanvas);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (animationId) cancelAnimationFrame(animationId);
      } else {
        draw();
      }
    });
  }

  // =========================================================
  // CLICK SOUND
  // =========================================================
  function initClickSound() {
    const clickAudio = $("#clickSound");
    if (!clickAudio) return;

    document.addEventListener("click", (e) => {
      const target = e.target.closest("button, a, .egg");
      if (!target) return;
      try {
        clickAudio.currentTime = 0;
        clickAudio.play().catch(() => {});
      } catch {}
    });
  }

  // =========================================================
  // MANIFEST GLITCH
  // =========================================================
  function initInteractiveManifest() {
    const lines = $$(".manifest-lines [data-glitch], .manifest-lines p");
    if (!lines.length) return;

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/\\|[]{}+=-_*";
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
        if (frame <= totalFrames) requestAnimationFrame(tick);
        else {
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
        if (!prefersReducedMotion()) {
          blip(150 + i * 30, 0.05, i % 2 ? "triangle" : "square");
        }
      });

      line.addEventListener("click", () => {
        scramble(line);
        blip(110 + i * 50, 0.08, "sawtooth", 0.017);
      });
    });
  }

  // =========================================================
  // MAIN PLAYER
  // =========================================================
  function initMainPlayer() {
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

    if (
      !audio || !playPauseBtn || !volumeSlider || !seekBar ||
      !currentTimeEl || !durationEl || !toggleBtn || !audioPlayer ||
      !prevBtn || !nextBtn || !trackTitle
    ) {
      return;
    }

    const playlist = [
      "ybuocfiewu.mp3",
      "track2.mp3",
      "track3.mp3"
    ];

    let currentIndex = 0;

    async function safePlayMedia(media) {
      try {
        await media.play();
        return true;
      } catch {
        return false;
      }
    }

    function setButtonState() {
      playPauseBtn.textContent = audio.paused
        ? "Listen"
        : "Pause";
    }

    async function loadTrack(index, autoplay = false) {
      if (index < 0) index = playlist.length - 1;
      if (index >= playlist.length) index = 0;
      currentIndex = index;

      audio.src = playlist[currentIndex];
      audio.load();
      trackTitle.textContent = `Track ${currentIndex + 1}`;

      if (autoplay) {
        const ok = await safePlayMedia(audio);
        if (!ok) flashMessage("AUTOPLAY BLOCKED", "error");
      }

      setButtonState();
    }

    playPauseBtn.addEventListener("click", async () => {
      if (audio.paused) {
        const ok = await safePlayMedia(audio);
        if (!ok) {
          flashMessage("PRESS PLAY AGAIN", "error");
          return;
        }
      } else {
        audio.pause();
      }
      setButtonState();
    });

    volumeSlider.addEventListener("input", () => {
      audio.volume = Number(volumeSlider.value);
    });

    audio.addEventListener("loadedmetadata", () => {
      seekBar.max = String(Math.floor(audio.duration || 0));
      durationEl.textContent = safeFormatTime(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
      seekBar.value = String(audio.currentTime || 0);
      currentTimeEl.textContent = safeFormatTime(audio.currentTime);
    });

    seekBar.addEventListener("input", () => {
      audio.currentTime = Number(seekBar.value);
    });

    toggleBtn.addEventListener("click", () => {
      const collapsed = audioPlayer.classList.toggle("collapsed");
      toggleBtn.textContent = collapsed ? "♫" : "—";
      if (!collapsed) {
        setTimeout(() => {
          audioPlayer.scrollIntoView({
            behavior: prefersReducedMotion() ? "auto" : "smooth",
            block: "center"
          });
        }, 200);
      }
    });

    prevBtn.addEventListener("click", () => loadTrack(currentIndex - 1, true));
    nextBtn.addEventListener("click", () => loadTrack(currentIndex + 1, true));
    audio.addEventListener("ended", () => loadTrack(currentIndex + 1, true));
    audio.addEventListener("play", setButtonState);
    audio.addEventListener("pause", setButtonState);

    audio.volume = Number(volumeSlider.value || 0.6);
    loadTrack(currentIndex, false);
  }

  // =========================================================
  // SEQUENCER
  // =========================================================
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

    if (!playBtn || !stopBtn || !randomBtn || !clearBtn || !shareBtn || !bpmSlider || !bpmValue) return;

    const steps = 16;
    const drumRows = ["kick", "snare", "hat"];
    const noteRows = ["C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4"];
    const noteFreq = {
      C5: 523.25, B4: 493.88, A4: 440.0, G4: 392.0,
      F4: 349.23, E4: 329.63, D4: 293.66, C4: 261.63
    };

    let audioCtx = null;
    let masterGain = null;
    let stepIndex = 0;
    let playing = false;
    let timer = null;
    let bpm = Number(bpmSlider.value || 118);

    const drumState = drumRows.map(() => Array(steps).fill(false));
    const noteState = noteRows.map(() => Array(steps).fill(false));

    function ensureAudio() {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;

      if (!audioCtx) {
        audioCtx = new AudioCtx();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.32;
        masterGain.connect(audioCtx.destination);
      }

      if (audioCtx.state === "suspended") audioCtx.resume();
      return true;
    }

    function createCell(row, step, group, active) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "seq-cell";
      if (active) btn.classList.add("active");
      btn.dataset.row = String(row);
      btn.dataset.step = String(step);
      btn.dataset.group = group;
      btn.setAttribute("aria-label", `${group} row ${row + 1} step ${step + 1}`);
      return btn;
    }

    function buildGrid(container, rows, stateArr, group) {
      container.innerHTML = "";

      rows.forEach((_, rowIndex) => {
        const row = document.createElement("div");
        row.className = "cell-row";

        for (let step = 0; step < steps; step++) {
          const cell = createCell(rowIndex, step, group, stateArr[rowIndex][step]);
          cell.addEventListener("click", () => {
            stateArr[rowIndex][step] = !stateArr[rowIndex][step];
            cell.classList.toggle("active", stateArr[rowIndex][step]);
            syncUrl();
          });
          row.appendChild(cell);
        }

        container.appendChild(row);
      });
    }

    function clearPlayingMarks() {
      $$(".seq-cell.playing").forEach(c => c.classList.remove("playing"));
    }

    function markStep(step) {
      clearPlayingMarks();
      $$(`.seq-cell[data-step="${step}"]`).forEach(c => c.classList.add("playing"));
    }

    function playKick(time) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);

      gain.gain.setValueAtTime(0.28, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);

      osc.connect(gain).connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.15);
    }

    function playSnare(time) {
      const length = audioCtx.sampleRate * 0.12;
      const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = audioCtx.createBufferSource();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();

      noise.buffer = buffer;
      filter.type = "highpass";
      filter.frequency.value = 1200;

      gain.gain.setValueAtTime(0.16, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

      noise.connect(filter).connect(gain).connect(masterGain);
      noise.start(time);
      noise.stop(time + 0.12);
    }

    function playHat(time) {
      const length = audioCtx.sampleRate * 0.04;
      const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = audioCtx.createBufferSource();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();

      noise.buffer = buffer;
      filter.type = "highpass";
      filter.frequency.value = 5000;

      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

      noise.connect(filter).connect(gain).connect(masterGain);
      noise.start(time);
      noise.stop(time + 0.04);
    }

    function playSynth(freq, time, duration = 0.22) {
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
      gain.connect(masterGain);

      osc.start(time);
      sub.start(time);
      osc.stop(time + duration);
      sub.stop(time + duration);
    }

    function triggerStep(step, time) {
      markStep(step);

      if (drumState[0][step]) playKick(time);
      if (drumState[1][step]) playSnare(time);
      if (drumState[2][step]) playHat(time);

      noteRows.forEach((note, rowIndex) => {
        if (noteState[rowIndex][step]) {
          playSynth(noteFreq[note], time, 0.24);
        }
      });
    }

    function tick() {
      if (!audioCtx) return;
      triggerStep(stepIndex, audioCtx.currentTime + 0.01);
      stepIndex = (stepIndex + 1) % steps;
    }

    function startSequencer() {
      if (playing) return;
      if (!ensureAudio()) {
        flashMessage("AUDIO NOT AVAILABLE", "error");
        return;
      }

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
      clearPlayingMarks();
      flashMessage("SEQUENCER STOPPED");
    }

    function randomizePattern() {
      drumState.forEach((row, r) => {
        row.forEach((_, s) => {
          const chance = r === 2 ? 0.38 : 0.24;
          row[s] = Math.random() < chance;
        });
      });

      noteState.forEach((row, r) => {
        row.forEach((_, s) => {
          const chance = r < 2 ? 0.08 : 0.14;
          row[s] = Math.random() < chance;
        });
      });

      renderGridState();
      syncUrl();
      flashMessage("RANDOM PATTERN", "accent");
    }

    function clearPattern() {
      drumState.forEach(row => row.fill(false));
      noteState.forEach(row => row.fill(false));
      renderGridState();
      syncUrl();
      flashMessage("PATTERN CLEARED");
    }

    function renderGridState() {
      $$(".seq-cell[data-group='drum']").forEach(cell => {
        const r = Number(cell.dataset.row);
        const s = Number(cell.dataset.step);
        cell.classList.toggle("active", drumState[r][s]);
      });

      $$(".seq-cell[data-group='synth']").forEach(cell => {
        const r = Number(cell.dataset.row);
        const s = Number(cell.dataset.step);
        cell.classList.toggle("active", noteState[r][s]);
      });
    }

    function encodePattern() {
      const drum = drumState.flat().map(v => v ? "1" : "0").join("");
      const synth = noteState.flat().map(v => v ? "1" : "0").join("");
      return `${drum}.${synth}.${bpm}`;
    }

    function decodePattern(serialized) {
      if (!serialized) return;

      const [drumBits, synthBits, bpmBits] = serialized.split(".");

      if (bpmBits) {
        bpm = clamp(Number(bpmBits) || 118, 70, 170);
        bpmSlider.value = String(bpm);
        bpmValue.textContent = String(bpm);
      }

      if (drumBits && drumBits.length === drumRows.length * steps) {
        let i = 0;
        for (let r = 0; r < drumRows.length; r++) {
          for (let s = 0; s < steps; s++) {
            drumState[r][s] = drumBits[i++] === "1";
          }
        }
      }

      if (synthBits && synthBits.length === noteRows.length * steps) {
        let i = 0;
        for (let r = 0; r < noteRows.length; r++) {
          for (let s = 0; s < steps; s++) {
            noteState[r][s] = synthBits[i++] === "1";
          }
        }
      }
    }

    function syncUrl() {
      const url = new URL(window.location.href);
      url.searchParams.set("pattern", encodePattern());
      history.replaceState({}, "", url);
    }

    function readUrlPattern() {
      const params = new URLSearchParams(window.location.search);
      const pattern = params.get("pattern");
      if (pattern) decodePattern(pattern);
    }

    readUrlPattern();
    buildGrid(drumGridEl, drumRows, drumState, "drum");
    buildGrid(synthGridEl, noteRows, noteState, "synth");
    renderGridState();
    bpmValue.textContent = String(bpm);

    bpmSlider.addEventListener("input", () => {
      bpm = Number(bpmSlider.value);
      bpmValue.textContent = String(bpm);
      syncUrl();

      if (playing) {
        stopSequencer();
        startSequencer();
      }
    });

    playBtn.addEventListener("click", startSequencer);
    stopBtn.addEventListener("click", stopSequencer);
    randomBtn.addEventListener("click", randomizePattern);
    clearBtn.addEventListener("click", clearPattern);

    shareBtn.addEventListener("click", async () => {
      syncUrl();
      const ok = await safeCopy(window.location.href);
      flashMessage(ok ? "LINK COPIED" : "COPY FAILED", ok ? "success" : "error");
    });
  }

  // =========================================================
  // SOUNDLAB
  // =========================================================
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

    function createNoiseBuffer(ctx, seconds = 2.5) {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      return buffer;
    }

    function boot() {
      if (ready) return true;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;

      audioCtx = new AudioCtx();

      // drone
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

      // noise
      noiseSource = audioCtx.createBufferSource();
      noiseSource.buffer = createNoiseBuffer(audioCtx, 3);
      noiseSource.loop = true;

      noiseGain = audioCtx.createGain();
      const noiseFilter = audioCtx.createBiquadFilter();
      noiseFilter.type = "highpass";
      noiseFilter.frequency.value = 2800;
      noiseGain.gain.value = 0;

      noiseSource.connect(noiseFilter).connect(noiseGain).connect(audioCtx.destination);

      // pulse
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
        flashMessage("SOUNDLAB OFFLINE", "error");
        return;
      }
      if (audioCtx.state === "suspended") await audioCtx.resume();
      applyValues();
      flashMessage("SOUNDLAB ACTIVE", "success");
    });

    [droneSlider, noiseSlider, pulseSlider].forEach(slider => {
      slider.addEventListener("input", applyValues);
    });
  }

  // =========================================================
  // TRACK ANATOMY
  // =========================================================
  function initTrackAnatomy() {
    const audio = $("#anatomyTrack");
    const playBtn = $("#anatomyPlay");
    const lowpass = $("#anatomyLowpass");
    const drive = $("#anatomyDrive");
    const now = $("#anatomyNow");
    const seekMarkers = $$("[data-seek-anatomy]");

    if (!audio || !playBtn || !lowpass || !drive || !now) return;

    let audioCtx = null;
    let source = null;
    let filter = null;
    let distortion = null;
    let outputGain = null;
    let graphReady = false;

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
      if (graphReady) {
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
      graphReady = true;
      return true;
    }

    playBtn.addEventListener("click", async () => {
      const ok = await ensureGraph();
      if (!ok) {
        flashMessage("TRACK ANATOMY OFFLINE", "error");
        return;
      }

      if (audio.paused) {
        try {
          await audio.play();
        } catch {
          flashMessage("PLAYBACK BLOCKED", "error");
        }
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

    seekMarkers.forEach(btn => {
      btn.addEventListener("click", () => {
        audio.currentTime = Number(btn.dataset.seekAnatomy || 0);
      });
    });

    audio.addEventListener("timeupdate", () => {
      now.textContent = safeFormatTime(audio.currentTime);
    });

    audio.addEventListener("play", () => {
      playBtn.textContent = "Pause Track";
    });

    audio.addEventListener("pause", () => {
      playBtn.textContent = "Play Track";
    });
  }

  // =========================================================
  // EASTER EGGS
  // =========================================================
  function initEasterEggs() {
    const eggs = $$(".egg");
    if (!eggs.length) return;

    eggs.forEach(egg => {
      egg.addEventListener("click", (e) => {
        if (egg.tagName === "A" && egg.getAttribute("href")?.startsWith("#")) {
          e.preventDefault();
          const href = egg.getAttribute("href");
          const target = $(href);
          if (target) softScrollTo(target);
        }

        if (!egg.classList.contains("found")) {
          egg.classList.add("found");
          updateEggProgress();

          const found = $$(".egg.found").length;
          if (found === eggs.length && !$("#secret-section")) {
            const section = document.createElement("section");
            section.id = "secret-section";
            section.innerHTML = `
              <div class="secret-box">
                <h2>You unlocked the core.</h2>
                <p>
                  This hidden layer rewards anyone who stayed long enough to notice the small things.
                  The next version can turn this zone into a private archive, hidden track hub, or invitation-only collector room.
                </p>
              </div>
            `;
            document.body.appendChild(section);
            flashMessage("CORE UNLOCKED", "success");
          }
        }
      });
    });
  }

  function updateEggProgress() {
    const eggs = $$(".egg");
    if (!eggs.length) return;

    let badge = $("#egg-progress");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "egg-progress";
      document.body.appendChild(badge);
    }

    const found = $$(".egg.found").length;
    badge.textContent = `ARTIFACTS ${found}/${eggs.length}`;
    badge.style.borderColor = found === eggs.length
      ? "rgba(116,246,255,.35)"
      : "rgba(255,255,255,.12)";
    badge.style.color = found === eggs.length ? "#74f6ff" : "#fff";
  }

  // =========================================================
  // OPTIONAL TRACK LIST SUPPORT
  // =========================================================
  async function loadTracks(fileList = []) {
    const listContainer = $("#trackList");
    const template = $("#audio-template");
    if (!listContainer || !template) return;

    listContainer.innerHTML = "";

    for (const file of fileList) {
      const name = file?.name || "Unknown";
      if (!/\.(mp3|wav)$/i.test(name)) continue;

      const clone = template.content.cloneNode(true);
      const audio = clone.querySelector("audio");
      const canvas = clone.querySelector(".visualizer");
      const vizCtx = canvas?.getContext("2d");
      const title = clone.querySelector(".track-title");
      const playBtn = clone.querySelector(".play-btn");
      const seek = clone.querySelector(".seek-bar");
      const volume = clone.querySelector(".volume-bar");
      const currentTimeEl = clone.querySelector(".current-time");
      const durationEl = clone.querySelector(".duration");
      const deleteBtn = clone.querySelector(".delete-btn");
      const likeBtn = clone.querySelector(".like-btn");
      const likeCount = clone.querySelector(".like-count");

      if (!audio || !canvas || !vizCtx || !title || !playBtn || !seek || !volume || !currentTimeEl || !durationEl) {
        continue;
      }

      title.textContent = name.replace(/\.[^/.]+$/, "");
      audio.src = file.url || file.publicUrl || "";
      audio.crossOrigin = "anonymous";

      let audioCtx = null;
      let analyser = null;
      let source = null;
      let animationId = null;
      let graphReady = false;

      function drawBars() {
        if (!analyser || !vizCtx || !canvas) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        vizCtx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.1;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i] / 2;
          vizCtx.fillStyle = `rgba(${Math.min(255, barHeight + 70)}, ${Math.min(255, 120 + barHeight / 4)}, 90, .85)`;
          vizCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }

        animationId = requestAnimationFrame(drawBars);
      }

      async function ensureGraph() {
        if (graphReady) {
          if (audioCtx.state === "suspended") await audioCtx.resume();
          return true;
        }

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return false;

        audioCtx = new AudioCtx();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;

        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        if (audioCtx.state === "suspended") await audioCtx.resume();
        graphReady = true;
        return true;
      }

      playBtn.addEventListener("click", async () => {
        if (audio.paused) {
          const ok = await ensureGraph();
          if (!ok) {
            flashMessage("VISUALIZER OFFLINE", "error");
            return;
          }

          document.querySelectorAll("audio").forEach(a => {
            if (a !== audio) a.pause();
          });

          try {
            await audio.play();
          } catch {
            flashMessage("PLAYBACK BLOCKED", "error");
          }
        } else {
          audio.pause();
        }
      });

      audio.addEventListener("play", () => {
        playBtn.textContent = "⏸";
        if (animationId) cancelAnimationFrame(animationId);
        drawBars();
      });

      audio.addEventListener("pause", () => {
        playBtn.textContent = "▶";
        if (animationId) cancelAnimationFrame(animationId);
        vizCtx.clearRect(0, 0, canvas.width, canvas.height);
      });

      audio.addEventListener("ended", () => {
        if (animationId) cancelAnimationFrame(animationId);
        vizCtx.clearRect(0, 0, canvas.width, canvas.height);
      });

      audio.addEventListener("loadedmetadata", () => {
        if (Number.isFinite(audio.duration)) {
          seek.max = String(Math.floor(audio.duration));
          durationEl.textContent = safeFormatTime(audio.duration);
        }
      });

      audio.addEventListener("timeupdate", () => {
        seek.value = String(audio.currentTime || 0);
        currentTimeEl.textContent = safeFormatTime(audio.currentTime);
      });

      seek.addEventListener("input", () => {
        audio.currentTime = Number(seek.value);
      });

      volume.addEventListener("input", () => {
        audio.volume = Number(volume.value);
      });

      if (likeBtn && likeCount) {
        likeBtn.addEventListener("click", () => {
          const current = Number(likeCount.textContent || "0");
          likeCount.textContent = String(current + 1);
          likeBtn.classList.add("liked");
        });
      }

      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          const wrapper = deleteBtn.closest("article, .panel");
          wrapper?.remove();
          flashMessage(`DELETED ${name.toUpperCase()}`, "accent");
        });
      }

      listContainer.appendChild(clone);
    }
  }

  window.loadTracks = loadTracks;

  // =========================================================
  // SAFE DRAG & DROP HOOKS
  // =========================================================
  function initUploadArea() {
    const dropZone = $("#upload-area");
    const fileInput = $("#fileInput");
    const uploadStatus = $("#uploadStatus");
    const uploadBtn = $("#uploadBtn");

    if (!dropZone || !fileInput || !uploadBtn || !uploadStatus) return;

    function handleFile(file) {
      if (!file) return;
      if (!/\.(mp3|wav)$/i.test(file.name)) {
        uploadStatus.textContent = "❌ Only .mp3 or .wav allowed.";
        return;
      }
      uploadStatus.textContent = `✅ Ready: ${file.name}`;
      flashMessage("FILE READY", "success");
    }

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragging");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("dragging");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragging");
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    });

    uploadBtn.addEventListener("click", () => {
      const file = fileInput.files?.[0];
      if (file) handleFile(file);
      else uploadStatus.textContent = "❗ Choose a file first.";
    });
  }

  // =========================================================
  // SECRET NAV / INTERNAL LINKS
  // =========================================================
  function initHashLinks() {
    document.addEventListener("click", (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const target = $(href);
      if (!target) return;

      e.preventDefault();
      softScrollTo(target);
    });
  }

  // =========================================================
  // INIT
  // =========================================================
  function init() {
    initTheme();
    initLoader();
    initReveal();
    initScrollSpy();
    initCursorGlow();
    initSnow();
    initClickSound();
    initInteractiveManifest();
    initMainPlayer();
    initSequencer();
    initSoundLab();
    initTrackAnatomy();
    initEasterEggs();
    updateEggProgress();
    initUploadArea();
    initHashLinks();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
