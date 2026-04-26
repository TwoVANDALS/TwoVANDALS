/* =========================================================
   TwoVANDALS — MAIN SCRIPT
   ========================================================= */

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ==============================
     0. GLOBAL HELPERS
     ============================== */

  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function flashMessage(message, type = "info") {
    let box = document.getElementById("tv-status-toast");
    if (!box) {
      box = document.createElement("div");
      box.id = "tv-status-toast";
      box.style.cssText = `
        position:fixed;right:16px;bottom:90px;z-index:99999;
        padding:10px 14px;background:#000;border:1px solid #444;color:#fff;
        font-family:VT323,monospace;font-size:20px;letter-spacing:.06em;
        box-shadow:0 0 18px rgba(0,0,0,.5);
        opacity:0;transform:translateY(8px);
        transition:opacity .2s ease, transform .2s ease;
      `;
      document.body.appendChild(box);
    }
    box.textContent = message;
    box.style.borderColor =
      type === "success"
        ? "#0f0"
        : type === "error"
        ? "#f44"
        : type === "accent"
        ? "#0ff"
        : "#666";
    box.style.opacity = "1";
    box.style.transform = "translateY(0)";
    clearTimeout(box._timer);
    box._timer = setTimeout(() => {
      box.style.opacity = "0";
      box.style.transform = "translateY(8px)";
    }, 1800);
  }

  function debounce(fn, delay = 120) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }

  /* ==============================
     1. LOADER (TEXT "TwoVANDALS")
     ============================== */

  function initLoader() {
    const loader = document.getElementById("loader-screen");
    const text = document.getElementById("loader-text");
    if (!loader || !text) return;

    const final = "TwoVANDALS";
    let index = 1;

    const timer = setInterval(() => {
      if (index < final.length) {
        text.textContent += final[index];
        index++;
      } else {
        clearInterval(timer);
        setTimeout(() => {
          loader.classList.add("hidden");
        }, 500);
      }
    }, 150);
  }

  /* ==============================
     2. CANVAS SNOW
     ============================== */

  function initSnow() {
    const canvas = document.getElementById("snow-canvas");
    if (!canvas) return;
    if (prefersReducedMotion()) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let snowflakes = [];
    let animationId = null;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createSnowflake() {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        radius: Math.random() * 2 + 1,
        speed: Math.random() * 1 + 0.5,
        alpha: Math.random() * 0.5 + 0.3
      };
    }

    function update() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      snowflakes.forEach((flake, i) => {
        flake.y += flake.speed;
        if (flake.y > canvas.height) {
          snowflakes[i] = createSnowflake();
        }
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${flake.alpha})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(update);
    }

    function start() {
      if (animationId == null) {
        update();
      }
    }

    function stop() {
      if (animationId != null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }

    resize();
    snowflakes = Array.from({ length: 100 }, createSnowflake);
    start();

    window.addEventListener("resize", () => {
      resize();
      snowflakes = Array.from({ length: 100 }, createSnowflake);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });
  }

  /* ==============================
     3. NAV ACTIVE (SCROLL SPY)
     ============================== */

  function initScrollSpy() {
    const sections = $$("section[id]");
    const navLinks = $$("nav a");
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("id");
          const link = document.querySelector(`nav a[href="#${id}"]`);
          if (entry.isIntersecting) {
            navLinks.forEach((a) => a.classList.remove("active"));
            if (link) link.classList.add("active");
          }
        });
      },
      {
        rootMargin: "-30% 0px -60% 0px",
        threshold: 0.1
      }
    );

    sections.forEach((section) => observer.observe(section));

    const firstVisible = sections.find(
      (sec) => sec.getBoundingClientRect().top >= 0
    );
    if (firstVisible) {
      const id = firstVisible.getAttribute("id");
      const link = document.querySelector(`nav a[href="#${id}"]`);
      navLinks.forEach((a) => a.classList.remove("active"));
      if (link) link.classList.add("active");
    }
  }

  /* ==============================
     4. EASTER EGGS + PROGRESS
     ============================== */

  function initEasterEggs() {
    const eggs = $$(".egg");
    if (!eggs.length) return;

    eggs.forEach((egg) => {
      egg.addEventListener("click", (e) => {
        e.preventDefault();
        if (!egg.classList.contains("found")) {
          egg.classList.add("found");

          // Secret section once all found
          const foundCount = $$(".egg.found").length;
          if (foundCount === eggs.length && !document.getElementById("secret-section")) {
            const section = document.createElement("section");
            section.id = "secret-section";
            section.innerHTML = `
              <h2>Core unlocked</h2>
              <p>Trashwave is a glitch in the archive. Welcome inside.</p>
            `;
            document.body.insertBefore(
              section,
              document.querySelector("footer")
            );
            flashMessage("CORE UNLOCKED", "accent");
          }
        }
        if (egg.href) {
          window.open(egg.href, "_blank", "noopener,noreferrer");
        }
      });
    });

    // Progress badge
    let badge = document.getElementById("egg-progress");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "egg-progress";
      badge.style.cssText = `
        position:fixed;left:14px;bottom:86px;z-index:9998;
        padding:6px 10px;background:rgba(0,0,0,.85);color:#fff;
        border:1px solid #333;font-family:VT323,monospace;font-size:18px;
        letter-spacing:.08em;
      `;
      document.body.appendChild(badge);
    }

    const update = () => {
      const found = $$(".egg.found").length;
      badge.textContent = `ARTIFACTS ${found}/${eggs.length}`;
      badge.style.borderColor = found === eggs.length ? "#0f0" : "#333";
      badge.style.color = found === eggs.length ? "#0f0" : "#fff";
    };

    update();
    eggs.forEach((egg) =>
      egg.addEventListener("click", () => setTimeout(update, 0))
    );
  }

  /* ==============================
     5. CLICK SOUND
     ============================== */

  function initClickSound() {
    const clickAudio = document.getElementById("clickSound");
    if (!clickAudio) return;

    document.addEventListener("click", (e) => {
      const isButton = e.target.closest(
        "button, .pixel-btn, .egg, a, .like-btn"
      );
      if (isButton) {
        clickAudio.currentTime = 0;
        clickAudio.play().catch(() => {});
      }
    });
  }

  /* ==============================
     6. MAIN AUDIO PLAYER (PLAYLIST)
     ============================== */

  function initGlobalPlayer() {
    const audio = document.getElementById("bgTrack");
    const playPauseBtn = document.getElementById("playPauseBtn");
    const volumeSlider = document.getElementById("volumeSlider");
    const seekBar = document.getElementById("seekBar");
    const currentTimeEl = document.getElementById("currentTime");
    const durationEl = document.getElementById("duration");
    const toggleBtn = document.getElementById("togglePlayer");
    const audioPlayer = document.getElementById("audioPlayer");
    const prevBtn = document.getElementById("prevTrackBtn");
    const nextBtn = document.getElementById("nextTrackBtn");
    const trackTitle = document.getElementById("trackTitle");

    if (
      !audio ||
      !playPauseBtn ||
      !volumeSlider ||
      !seekBar ||
      !currentTimeEl ||
      !durationEl ||
      !toggleBtn ||
      !audioPlayer ||
      !prevBtn ||
      !nextBtn ||
      !trackTitle
    ) {
      return;
    }

    const playlist = [
      "ybuocfiewu.mp3",
      "track2.mp3",
      "track3.mp3"
    ];
    let currentIndex = 0;

    function loadTrack(index) {
      if (index < 0) index = playlist.length - 1;
      if (index >= playlist.length) index = 0;
      currentIndex = index;
      audio.src = playlist[currentIndex];
      trackTitle.textContent = `Track ${currentIndex + 1}`;
      audio.load();
      audio
        .play()
        .then(() => {
          playPauseBtn.textContent = "⏸ Playing Trashwave Set";
        })
        .catch(() => {
          // autoplay blocked, leave in paused state
          playPauseBtn.textContent =
            "▶ Listen to a curated Trashwave set";
        });
    }

    playPauseBtn.addEventListener("click", () => {
      if (audio.paused) {
        audio
          .play()
          .then(() => {
            playPauseBtn.textContent = "⏸ Playing Trashwave Set";
          })
          .catch(() => {});
      } else {
        audio.pause();
        playPauseBtn.textContent =
          "▶ Listen to a curated Trashwave set";
      }
    });

    volumeSlider.addEventListener("input", () => {
      audio.volume = volumeSlider.value;
    });

    audio.addEventListener("loadedmetadata", () => {
      seekBar.max = Math.floor(audio.duration) || 0;
      durationEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
      seekBar.value = audio.currentTime;
      currentTimeEl.textContent = formatTime(audio.currentTime);
    });

    seekBar.addEventListener("input", () => {
      audio.currentTime = seekBar.value;
    });

    toggleBtn.addEventListener("click", () => {
      const isCollapsed = audioPlayer.classList.toggle("collapsed");
      toggleBtn.textContent = isCollapsed ? "▲" : "▼";
      if (!isCollapsed) {
        setTimeout(() => {
          audioPlayer.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        }, 200);
      }
    });

    prevBtn.addEventListener("click", () => {
      loadTrack(currentIndex - 1);
    });

    nextBtn.addEventListener("click", () => {
      loadTrack(currentIndex + 1);
    });

    audio.addEventListener("ended", () => {
      loadTrack(currentIndex + 1);
    });

    // init
    loadTrack(currentIndex);
  }

  /* ==============================
     7. MANIFEST GLITCH
     ============================== */

  function initManifestGlitch() {
    const lines = $$("#manifest [data-glitch], #manifest p");
    if (!lines.length) return;

    const glitchChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/=+*-_";
    let audioCtx = null;

    function blip(freq = 220, duration = 0.06, type = "square", gainValue = 0.015) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        if (!audioCtx) audioCtx = new AC();
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
      } catch {
        // ignore
      }
    }

    function scrambleText(el) {
      if (el.dataset.animating === "1") return;
      el.dataset.animating = "1";

      const original = el.dataset.originalText || el.textContent.trim();
      el.dataset.originalText = original;

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
            return glitchChars[Math.floor(Math.random() * glitchChars.length)];
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
      line.dataset.originalText = line.textContent.trim();

      line.addEventListener("mouseenter", () => {
        scrambleText(line);
        blip(160 + i * 35, 0.05, i % 2 ? "triangle" : "square", 0.01);
      });

      line.addEventListener("click", () => {
        scrambleText(line);
        blip(110 + i * 55, 0.09, "sawtooth", 0.018);
        document.body.style.filter = "contrast(1.08) saturate(1.1)";
        setTimeout(() => {
          document.body.style.filter = "";
        }, 120);
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Shift") return;
      lines.forEach((line, i) => {
        setTimeout(() => scrambleText(line), i * 40);
      });
    });
  }

  /* ==============================
     8. PATTERN LAB / SEQUENCER
     ============================== */

  function initSequencer() {
    const drumGridEl = document.getElementById("drumGrid");
    const synthGridEl = document.getElementById("synthGrid");
    if (!drumGridEl || !synthGridEl) return;

    const bpmSlider = document.getElementById("seqBpm");
    const bpmValue = document.getElementById("seqBpmValue");
    const playBtn = document.getElementById("seqPlayBtn");
    const stopBtn = document.getElementById("seqStopBtn");
    const randomBtn = document.getElementById("seqRandomBtn");
    const clearBtn = document.getElementById("seqClearBtn");
    const shareBtn = document.getElementById("seqShareBtn");

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
    let masterGain = null;
    let analyser = null;
    let playing = false;
    let stepIndex = 0;
    let timer = null;
    let bpm = Number(bpmSlider?.value || 118);

    const drumState = drumRows.map(() => Array(steps).fill(false));
    const noteState = noteRows.map(() => Array(steps).fill(false));

    function ensureAudio() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      if (!audioCtx) {
        audioCtx = new AC();
        masterGain = audioCtx.createGain();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        masterGain.gain.value = 0.32;
        masterGain.connect(analyser);
        analyser.connect(audioCtx.destination);
      }
      if (audioCtx.state === "suspended") audioCtx.resume();
      return true;
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
      const bufferSize = audioCtx.sampleRate * 0.12;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 1200;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.16, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

      noise.connect(filter).connect(gain).connect(masterGain);
      noise.start(time);
      noise.stop(time + 0.12);
    }

    function playHat(time) {
      const bufferSize = audioCtx.sampleRate * 0.04;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 5000;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

      noise.connect(filter).connect(gain).connect(masterGain);
      noise.start(time);
      noise.stop(time + 0.04);
    }

    function playSynth(freq, time, duration = 0.22) {
      const osc = audioCtx.createOscillator();
      const sub = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

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

    function buildGrid(container, rows, state, groupName) {
      container.innerHTML = "";
      rows.forEach((rowName, rowIndex) => {
        const row = document.createElement("div");
        row.className = "row";
        for (let step = 0; step < steps; step++) {
          const cell = document.createElement("button");
          cell.type = "button";
          cell.className = "cell";
          cell.dataset.group = groupName;
          cell.dataset.row = String(rowIndex);
          cell.dataset.step = String(step);
          cell.setAttribute(
            "aria-label",
            `${groupName} ${rowName} step ${step + 1}`
          );
          if (state[rowIndex][step]) cell.classList.add("active");
          cell.addEventListener("click", () => {
            state[rowIndex][step] = !state[rowIndex][step];
            cell.classList.toggle("active", state[rowIndex][step]);
          });
          row.appendChild(cell);
        }
        container.appendChild(row);
      });
    }

    function clearPlayingMarks() {
      $$(".cell.playing").forEach((c) => c.classList.remove("playing"));
    }

    function markStep(step) {
      clearPlayingMarks();
      $$(`.cell[data-step="${step}"]`).forEach((c) =>
        c.classList.add("playing")
      );
    }

    function encodePattern() {
      const drum = drumState
        .flat()
        .map((v) => (v ? "1" : "0"))
        .join("");
      const synth = noteState
        .flat()
        .map((v) => (v ? "1" : "0"))
        .join("");
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
      const now = audioCtx.currentTime;
      triggerStep(stepIndex, now + 0.01);
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
      clearPlayingMarks();
      flashMessage("SEQUENCER OFF");
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
      $$(".cell[data-group='drum']").forEach((cell) => {
        const r = Number(cell.dataset.row);
        const s = Number(cell.dataset.step);
        cell.classList.toggle("active", drumState[r][s]);
      });

      $$(".cell[data-group='synth']").forEach((cell) => {
        const r = Number(cell.dataset.row);
        const s = Number(cell.dataset.step);
        cell.classList.toggle("active", noteState[r][s]);
      });
    }

    function applyPatternFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const pattern = params.get("pattern");
      if (pattern) decodePattern(pattern);
    }

    // init
    applyPatternFromUrl();
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
      const url = window.location.href;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          flashMessage("LINK COPIED", "success");
        } else {
          throw new Error("clipboard unsupported");
        }
      } catch {
        flashMessage("COPY FAILED", "error");
      }
    });

    drumGridEl.addEventListener("click", debounce(syncUrl, 120));
    synthGridEl.addEventListener("click", debounce(syncUrl, 120));
  }

  /* ==============================
     9. SOUNDLAB (DRONE / NOISE / PULSE)
     ============================== */

  function initSoundLab() {
    const initBtn = document.getElementById("soundLabInit");
    const droneSlider = document.getElementById("ambienceDrone");
    const noiseSlider = document.getElementById("ambienceNoise");
    const pulseSlider = document.getElementById("ambiencePulse");

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
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      return buffer;
    }

    function boot() {
      if (ready) return true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;

      audioCtx = new AC();

      // Drone
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

      // Noise
      noiseSource = audioCtx.createBufferSource();
      noiseSource.buffer = createNoiseBuffer(audioCtx, 3);
      noiseSource.loop = true;
      noiseGain = audioCtx.createGain();
      const noiseFilter = audioCtx.createBiquadFilter();
      noiseFilter.type = "highpass";
      noiseFilter.frequency.value = 2800;
      noiseGain.gain.value = 0;
      noiseSource.connect(noiseFilter).connect(noiseGain).connect(audioCtx.destination);

      // Pulse
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
      const now = audioCtx.currentTime;
      droneGain.gain.setTargetAtTime(
        Number(droneSlider.value) / 500,
        now,
        0.08
      );
      noiseGain.gain.setTargetAtTime(
        Number(noiseSlider.value) / 900,
        now,
        0.08
      );
      pulseGain.gain.setTargetAtTime(
        Number(pulseSlider.value) / 800,
        now,
        0.08
      );
    }

    initBtn.addEventListener("click", async () => {
      const ok = boot();
      if (!ok) {
        flashMessage("WEB AUDIO NOT SUPPORTED", "error");
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

  /* ==============================
     10. TRACK ANATOMY
     ============================== */

  function initTrackAnatomy() {
    const audio = document.getElementById("anatomyTrack");
    const playBtn = document.getElementById("anatomyPlay");
    const lowpass = document.getElementById("anatomyLowpass");
    const drive = document.getElementById("anatomyDrive");
    const now = document.getElementById("anatomyNow");
    const seekMarkers = $$("[data-seek-anatomy]");

    if (!audio || !playBtn || !lowpass || !drive) return;

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
        curve[i] = ((3 + k) * x * 20 * deg) /
          (Math.PI + k * Math.abs(x));
      }
      return curve;
    }

    async function ensureGraph() {
      if (graphReady) {
        if (audioCtx.state === "suspended") await audioCtx.resume();
        return true;
      }

      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;

      audioCtx = new AC();
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
        audio.play().catch(() => {});
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
      if (now) now.textContent = formatTime(audio.currentTime);
    });

    audio.addEventListener("play", () => {
      playBtn.textContent = "PAUSE TRACK";
    });

    audio.addEventListener("pause", () => {
      playBtn.textContent = "PLAY TRACK";
    });
  }

  /* ==============================
     11. LAZY LOAD SOUNDCLOUD PLAYER
     ============================== */

  function initSoundCloudLazy() {
    const section = document.getElementById("music");
    const iframe = document.getElementById("scPlayer");
    if (!section || !iframe) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && iframe.dataset.src) {
            iframe.src = iframe.dataset.src;
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(section);
  }

  /* ==============================
     DOM READY
     ============================== */

document.addEventListener("DOMContentLoaded", () => {
  initLoader();
  initSnow();
  initScrollSpy();
  initEasterEggs();
  initClickSound();
  initGlobalPlayer();
  initManifestGlitch();
  initSequencer();
  initSoundLab();
  initTrackAnatomy();
  initSoundCloudLazy();
  initSpectrum3D();
});
})();
/* ==============================
   12. 3D SPECTRUM VISUALIZER
   ============================== */
function initSpectrum3D() {
  const mount = document.getElementById("spectrum3d-canvas");
  const audio = document.getElementById("bgTrack");

  if (!mount || !audio) return;
  if (!window.THREE) {
    console.warn("THREE is not loaded");
    return;
  }

  const THREE = window.THREE;
  const OrbitControls = window.OrbitControls;

  let renderer;
  let scene;
  let camera;
  let controls;
  let analyser;
  let audioCtx;
  let sourceNode;
  let dataArray;
  let bars = [];
  let animationId = null;
  let connected = false;

  const BAR_COUNT = 96;
  const RADIUS = 10;
  const BAR_WIDTH = 0.22;
  const BAR_DEPTH = 0.22;
  const BASE_HEIGHT = 0.25;

  function createAudioGraph() {
    if (connected) return true;

    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;

    audioCtx = new AC();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;

    sourceNode = audioCtx.createMediaElementSource(audio);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);

    dataArray = new Uint8Array(analyser.frequencyBinCount);
    connected = true;
    return true;
  }

  function initScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x020202, 18, 38);

    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 520;

    camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 8, 18);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);

    if (OrbitControls) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.minDistance = 10;
      controls.maxDistance = 28;
      controls.maxPolarAngle = Math.PI * 0.48;
    }

    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambient);

    const pointA = new THREE.PointLight(0x00ff99, 2.2, 40, 2);
    pointA.position.set(0, 10, 10);
    scene.add(pointA);

    const pointB = new THREE.PointLight(0x00eaff, 1.8, 40, 2);
    pointB.position.set(0, 4, -12);
    scene.add(pointB);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(11, 64),
      new THREE.MeshBasicMaterial({
        color: 0x07110b,
        transparent: true,
        opacity: 0.75
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    scene.add(floor);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(9.6, 10.2, 128),
      new THREE.MeshBasicMaterial({
        color: 0x00ffaa,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.2, 1),
      new THREE.MeshStandardMaterial({
        color: 0x99ffee,
        emissive: 0x00ff99,
        emissiveIntensity: 0.35,
        roughness: 0.35,
        metalness: 0.15
      })
    );
    core.name = "core";
    core.position.y = 1.4;
    scene.add(core);

    const barGeometry = new THREE.BoxGeometry(BAR_WIDTH, 1, BAR_DEPTH);

    for (let i = 0; i < BAR_COUNT; i++) {
      const angle = (i / BAR_COUNT) * Math.PI * 2;
      const x = Math.cos(angle) * RADIUS;
      const z = Math.sin(angle) * RADIUS;

      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(`hsl(${140 + (i / BAR_COUNT) * 60}, 100%, 50%)`),
        emissive: new THREE.Color(`hsl(${140 + (i / BAR_COUNT) * 60}, 100%, 28%)`),
        emissiveIntensity: 0.28,
        roughness: 0.45,
        metalness: 0.08
      });

      const bar = new THREE.Mesh(barGeometry, material);
      bar.position.set(x, BASE_HEIGHT / 2, z);
      bar.lookAt(0, BASE_HEIGHT / 2, 0);
      bar.userData.angle = angle;
      bar.userData.index = i;
      scene.add(bar);
      bars.push(bar);
    }
  }

  function updateSpectrum() {
    if (!analyser || !dataArray) return;

    analyser.getByteFrequencyData(dataArray);

    const core = scene.getObjectByName("core");
    let energySum = 0;

    for (let i = 0; i < BAR_COUNT; i++) {
      const dataIndex = Math.floor((i / BAR_COUNT) * dataArray.length);
      const value = dataArray[dataIndex] || 0;
      const normalized = value / 255;
      energySum += normalized;

      const bar = bars[i];
      const h = BASE_HEIGHT + normalized * 8.5;

      bar.scale.y += (h - bar.scale.y) * 0.22;
      bar.position.y += ((h / 2) - bar.position.y) * 0.22;

      const pulseRadius = RADIUS + normalized * 1.3;
      bar.position.x = Math.cos(bar.userData.angle) * pulseRadius;
      bar.position.z = Math.sin(bar.userData.angle) * pulseRadius;

      const hue = 135 + normalized * 70 + i * 0.15;
      bar.material.color.setHSL((hue % 360) / 360, 1, 0.5);
      bar.material.emissive.setHSL((hue % 360) / 360, 1, 0.24 + normalized * 0.2);
      bar.material.emissiveIntensity = 0.22 + normalized * 0.9;
    }

    const avg = energySum / BAR_COUNT;

    if (core) {
      core.rotation.x += 0.004 + avg * 0.03;
      core.rotation.y += 0.006 + avg * 0.04;
      const s = 1 + avg * 0.45;
      core.scale.setScalar(s);
      core.material.emissiveIntensity = 0.25 + avg * 1.15;
    }

    scene.rotation.y += 0.0018 + avg * 0.005;
  }

  function animate() {
    updateSpectrum();
    controls?.update();
    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  }

  function onResize() {
    if (!renderer || !camera) return;
    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 520;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function startVisualizer() {
    if (!connected) {
      const ok = createAudioGraph();
      if (!ok) return;
    }

    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }

    if (!animationId) animate();
  }

  function stopVisualizer() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  initScene();
  onResize();
  window.addEventListener("resize", onResize);

  audio.addEventListener("play", startVisualizer);
  audio.addEventListener("pause", () => {
    // оставляем сцену живой ещё чуть-чуть, но без обязательной остановки
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopVisualizer();
    else if (!audio.paused) startVisualizer();
  });

  // first user gesture fallback
  document.addEventListener(
    "click",
    () => {
      if (!connected && !audio.paused) startVisualizer();
    },
    { once: false }
  );
}
/* =========================================================
   TWOVANDALS SECRET GLITCH / BLEED EASTER EGG
   Добавить в конец текущего JS
   ========================================================= */

(() => {
  "use strict";

  const state = {
    eggsFoundClicks: 0,
    keySequenceProgress: 0,
    keySequenceStartedAt: 0,
    heroDoubleClicked: false,
    triggered: false
  };

  const REQUIRED_KEYS = ["KeyT", "KeyV", "KeyD"];
  const KEY_TIMEOUT = 4000;

  function initTwoVandalsSecretBanner() {
    const banner = document.getElementById("tv-easter-banner");
    const title = document.getElementById("tv-easter-title");
    if (!banner || !title) return;

    bindEggProgressWatcher();
    bindKeySequenceWatcher();
    bindFinalDoubleClickWatcher();
  }

  function bindEggProgressWatcher() {
    document.addEventListener("click", (e) => {
      const egg = e.target.closest(".egg");
      if (!egg) return;

      if (state.eggsFoundClicks < 3) {
        state.eggsFoundClicks += 1;
      }
    });
  }

  function bindKeySequenceWatcher() {
    document.addEventListener("keydown", (e) => {
      if (state.triggered) return;
      if (state.eggsFoundClicks < 3) return;

      const now = Date.now();

      if (!state.keySequenceStartedAt || now - state.keySequenceStartedAt > KEY_TIMEOUT) {
        state.keySequenceProgress = 0;
        state.keySequenceStartedAt = now;
      }

      const expected = REQUIRED_KEYS[state.keySequenceProgress];

      if (e.code === expected) {
        state.keySequenceProgress += 1;

        if (state.keySequenceProgress === REQUIRED_KEYS.length) {
          state.keySequenceStartedAt = now;
          pulsePageHint();
        }
      } else {
        state.keySequenceProgress = e.code === REQUIRED_KEYS[0] ? 1 : 0;
        state.keySequenceStartedAt = now;
      }
    });
  }

  function bindFinalDoubleClickWatcher() {
    const candidates = [
      document.querySelector(".logo"),
      document.querySelector(".brand"),
      document.querySelector(".hero"),
      document.querySelector("header h1"),
      document.querySelector("nav"),
      document.body
    ].filter(Boolean);

    candidates.forEach((el) => {
      el.addEventListener("dblclick", () => {
        if (state.triggered) return;
        if (state.eggsFoundClicks < 3) return;
        if (state.keySequenceProgress < REQUIRED_KEYS.length) return;
        if (Date.now() - state.keySequenceStartedAt > KEY_TIMEOUT) return;

        state.heroDoubleClicked = true;
        revealTwoVandalsBanner();
      });
    });
  }

  function pulsePageHint() {
    document.documentElement.style.transition = "filter 120ms ease";
    document.documentElement.style.filter = "contrast(1.12) brightness(1.05)";
    setTimeout(() => {
      document.documentElement.style.filter = "";
    }, 120);
  }

  function revealTwoVandalsBanner() {
    if (state.triggered) return;

    const banner = document.getElementById("tv-easter-banner");
    const title = document.getElementById("tv-easter-title");
    if (!banner || !title) return;

    state.triggered = true;

    banner.classList.add("active", "flash");
    document.body.classList.add("tv-secret-awakened");

    playFabricTearSound().catch(() => {});
    launchMicroGlitches(title);
    launchScreenFlicker();

    setTimeout(() => banner.classList.remove("flash"), 260);
  }

  async function playFabricTearSound() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    const duration = 0.55;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const burst = Math.random() * 2 - 1;
      const grain = Math.sin(i * 0.018) * 0.15;
      const rasp = Math.sin(i * 0.09) * 0.07;
      data[i] = burst * (1 - t * 0.55) + grain + rasp;
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(1450, now);
    bandpass.Q.setValueAtTime(0.9, now);

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(500, now);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(5200, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.9, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(ctx.destination);

    source.start(now);
    source.stop(now + duration + 0.02);

    source.onended = () => {
      setTimeout(() => ctx.close().catch(() => {}), 80);
    };
  }

  function launchMicroGlitches(title) {
    let bursts = 0;

    const interval = setInterval(() => {
      bursts += 1;

      title.style.transform = `
        translate(${rand(-4, 4)}px, ${rand(-2, 2)}px)
        skewX(${rand(-8, 8)}deg)
      `;

      title.style.filter = `
        contrast(${1 + Math.random() * 0.45})
        saturate(${1 + Math.random() * 0.35})
        blur(${Math.random() * 0.8}px)
      `;

      if (bursts > 14) {
        clearInterval(interval);
        title.style.transform = "";
        title.style.filter = "";
      }
    }, 70);
  }

  function launchScreenFlicker() {
    let count = 0;
    const flicker = setInterval(() => {
      count += 1;
      document.body.style.filter =
        count % 2
          ? "contrast(1.18) saturate(1.08) brightness(1.02)"
          : "contrast(0.96) brightness(0.98)";
      if (count > 7) {
        clearInterval(flicker);
        document.body.style.filter = "";
      }
    }, 45);
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  document.addEventListener("DOMContentLoaded", initTwoVandalsSecretBanner);
})();
