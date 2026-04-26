(() => {
  "use strict";

  // =========================
  // CONFIG
  // =========================
  const SUPABASE_URL = "https://qqffjsnlsbzhzhlvbexb.supabase.co";
  const SUPABASE_ANON_KEY = "YOUR_ANON_KEY"; // <-- замените на ваш anon key
  const TRACKS_BUCKET = "tracks";

  const MAIN_PLAYLIST = [
    "ybuocfiewu.mp3",
    "track2.mp3",
    "track3.mp3"
  ];

  let supabaseClientPromise = null;

  // =========================
  // HELPERS
  // =========================
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  async function safePlay(media) {
    if (!media) return false;
    try {
      const result = media.play();
      if (result && typeof result.then === "function") {
        await result;
      }
      return true;
    } catch {
      return false;
    }
  }

  function supportsReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isValidAudioFilename(name = "") {
    return /\.(mp3|wav)$/i.test(name);
  }

  async function getSupabase() {
    if (window.supabase) return window.supabase;
    if (supabaseClientPromise) return supabaseClientPromise;

    supabaseClientPromise = import("https://esm.sh/@supabase/supabase-js")
      .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY))
      .catch((err) => {
        console.error("Supabase init error:", err);
        return null;
      });

    return supabaseClientPromise;
  }

  // =========================
  // LOADER
  // =========================
  function initLoaders() {
    window.addEventListener("load", () => {
      const loader = document.getElementById("loader");
      if (loader) loader.style.display = "none";
    });

    const loaderScreen = document.getElementById("loader-screen");
    const loaderText = document.getElementById("loader-text");

    if (!loaderScreen || !loaderText) return;

    const finalText = "TwoVANDALS";
    let index = 1;
    loaderText.textContent = finalText[0] || "";

    const interval = setInterval(() => {
      if (index < finalText.length) {
        loaderText.textContent += finalText[index];
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          loaderScreen.classList.add("hidden");
        }, 500);
      }
    }, 150);
  }

  // =========================
  // SNOW EFFECT
  // =========================
  function initSnow() {
    const snowCanvas = document.getElementById("snow-canvas");
    if (!snowCanvas) return;

    const snowCtx = snowCanvas.getContext("2d");
    if (!snowCtx) return;

    if (supportsReducedMotion()) return;

    let animationId = null;
    let snowflakes = [];

    function resizeCanvas() {
      snowCanvas.width = window.innerWidth;
      snowCanvas.height = window.innerHeight;
    }

    function createSnowflake() {
      return {
        x: Math.random() * snowCanvas.width,
        y: Math.random() * -snowCanvas.height,
        radius: Math.random() * 2 + 1,
        speed: Math.random() * 1 + 0.5,
        drift: (Math.random() - 0.5) * 0.35,
        alpha: Math.random() * 0.5 + 0.3
      };
    }

    function drawSnow() {
      snowCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);

      snowflakes.forEach((flake, i) => {
        flake.y += flake.speed;
        flake.x += flake.drift;

        if (flake.y > snowCanvas.height || flake.x < -10 || flake.x > snowCanvas.width + 10) {
          snowflakes[i] = createSnowflake();
        }

        snowCtx.beginPath();
        snowCtx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        snowCtx.fillStyle = `rgba(255,255,255,${flake.alpha})`;
        snowCtx.fill();
      });

      animationId = requestAnimationFrame(drawSnow);
    }

    function startSnow() {
      if (animationId == null) {
        drawSnow();
      }
    }

    function stopSnow() {
      if (animationId != null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }

    resizeCanvas();
    snowflakes = Array.from({ length: 100 }, createSnowflake);
    startSnow();

    window.addEventListener("resize", resizeCanvas);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopSnow();
      else startSnow();
    });
  }

  // =========================
  // EASTER EGGS
  // =========================
  function initEasterEggs() {
    const eggs = $$(".egg");
    if (!eggs.length) return;

    eggs.forEach((egg) => {
      egg.addEventListener("click", (e) => {
        e.preventDefault();

        if (!egg.classList.contains("found")) {
          egg.classList.add("found");

          const total = $$(".egg").length;
          const found = $$(".egg.found").length;

          if (total > 0 && found === total && !document.getElementById("secret-section")) {
            const section = document.createElement("section");
            section.id = "secret-section";
            section.innerHTML = "<h2>You unlocked the core.</h2><p>This is only the beginning.</p>";
            document.body.appendChild(section);
          }
        }

        const href = egg.getAttribute("href");
        if (href) {
          window.open(href, "_blank", "noopener,noreferrer");
        }
      });
    });
  }

  // =========================
  // MAIN AUDIO PLAYER
  // =========================
  function initMainAudioPlayer() {
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

    let currentIndex = 0;

    function setPlayButtonState(isPlaying) {
      playPauseBtn.textContent = isPlaying
        ? "⏸ Playing Trashwave Set"
        : "▶ Listen to a curated Trashwave set";
    }

    async function loadTrack(index, autoplay = true) {
      if (!MAIN_PLAYLIST.length) return;

      if (index < 0) index = MAIN_PLAYLIST.length - 1;
      if (index >= MAIN_PLAYLIST.length) index = 0;

      currentIndex = index;
      audio.src = MAIN_PLAYLIST[currentIndex];
      trackTitle.textContent = `Track ${currentIndex + 1}`;
      audio.load();

      if (autoplay) {
        const started = await safePlay(audio);
        setPlayButtonState(started);
      } else {
        setPlayButtonState(false);
      }
    }

    playPauseBtn.addEventListener("click", async () => {
      if (audio.paused) {
        const started = await safePlay(audio);
        setPlayButtonState(started);
      } else {
        audio.pause();
        setPlayButtonState(false);
      }
    });

    volumeSlider.addEventListener("input", () => {
      audio.volume = Number(volumeSlider.value);
    });

    audio.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(audio.duration)) {
        seekBar.max = Math.floor(audio.duration);
        durationEl.textContent = formatTime(audio.duration);
      }
    });

    audio.addEventListener("timeupdate", () => {
      seekBar.value = String(audio.currentTime || 0);
      currentTimeEl.textContent = formatTime(audio.currentTime);
    });

    seekBar.addEventListener("input", () => {
      audio.currentTime = Number(seekBar.value);
    });

    toggleBtn.addEventListener("click", () => {
      const isCollapsed = audioPlayer.classList.toggle("collapsed");
      toggleBtn.textContent = isCollapsed ? "▲" : "▼";

      if (!isCollapsed) {
        setTimeout(() => {
          audioPlayer.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
      }
    });

    prevBtn.addEventListener("click", () => {
      loadTrack(currentIndex - 1, true);
    });

    nextBtn.addEventListener("click", () => {
      loadTrack(currentIndex + 1, true);
    });

    audio.addEventListener("ended", () => {
      loadTrack(currentIndex + 1, true);
    });

    audio.addEventListener("pause", () => {
      setPlayButtonState(false);
    });

    audio.addEventListener("play", () => {
      setPlayButtonState(true);
    });

    audio.volume = Number(volumeSlider.value || 1);
    loadTrack(currentIndex, false);
  }

  // =========================
  // CLICK SOUND
  // =========================
  function initClickSound() {
    const clickAudio = document.getElementById("clickSound");
    if (!clickAudio) return;

    document.addEventListener("click", (e) => {
      const isButton = e.target.closest("button, .pixel-btn, .egg, a");
      if (!isButton) return;

      clickAudio.currentTime = 0;
      clickAudio.play().catch(() => {});
    });
  }

  // =========================
  // TRACK LIST / VISUALIZER
  // =========================
  async function loadTracks(fileList = []) {
    const listContainer = document.getElementById("trackList");
    const template = document.getElementById("audio-template");

    if (!listContainer || !template) return;

    listContainer.innerHTML = "";

    for (const file of fileList) {
      const name = file?.name || "Unknown";
      if (!isValidAudioFilename(name)) continue;

      const clone = template.content.cloneNode(true);
      const audio = $("audio", clone);
      const canvas = $(".visualizer", clone);
      const title = $(".track-title", clone);
      const playBtn = $(".play-btn", clone);
      const seek = $(".seek-bar", clone);
      const volume = $(".volume-bar", clone);
      const currentTimeEl = $(".current-time", clone);
      const durationEl = $(".duration", clone);
      const deleteBtn = $(".delete-btn", clone);
      const likeBtn = $(".like-btn", clone);
      const likeCount = $(".like-count", clone);

      if (
        !audio ||
        !canvas ||
        !title ||
        !playBtn ||
        !seek ||
        !volume ||
        !currentTimeEl ||
        !durationEl
      ) {
        continue;
      }

      const vizCtx = canvas.getContext("2d");
      let audioCtx = null;
      let analyser = null;
      let source = null;
      let animationId = null;

      function stopVisualizer() {
        if (animationId != null) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
        if (vizCtx) {
          vizCtx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      function drawBars() {
        if (!analyser || !vizCtx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        analyser.getByteFrequencyData(dataArray);
        vizCtx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i] / 2;
          vizCtx.fillStyle = `rgb(${Math.min(barHeight + 50, 255)},50,50)`;
          vizCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }

        animationId = requestAnimationFrame(drawBars);
      }

      async function ensureAudioGraph() {
        if (!audioCtx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtx) return false;

          audioCtx = new AudioCtx();
          analyser = audioCtx.createAnalyser();
          source = audioCtx.createMediaElementSource(audio);

          source.connect(analyser);
          analyser.connect(audioCtx.destination);
          analyser.fftSize = 256;
        }

        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }

        return true;
      }

      title.textContent = name.replace(/\.[^/.]+$/, "");
      audio.src = file.url || file.publicUrl || "";
      audio.preload = "metadata";

      if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
          const confirmDelete = confirm(`Delete track "${name}"?`);
          if (!confirmDelete) return;

          const supabase = await getSupabase();
          if (!supabase) {
            alert("❌ Supabase is not initialized.");
            return;
          }

          const { error } = await supabase.storage.from(TRACKS_BUCKET).remove([name]);

          if (error) {
            alert("❌ Error deleting track: " + error.message);
          } else {
            alert(`🗑️ Deleted: ${name}`);
            if (typeof window.listTracks === "function") {
              await window.listTracks();
            }
          }
        });
      }

      if (likeBtn && likeCount) {
        const likeKey = `liked_${name}`;
        const hasLiked = (() => {
          try {
            return localStorage.getItem(likeKey);
          } catch {
            return null;
          }
        })();

        if (hasLiked) {
          likeBtn.classList.add("liked");
        }

        const supabase = await getSupabase();
        if (supabase) {
          supabase
            .from("likes")
            .select("likes")
            .eq("filename", name)
            .single()
            .then(({ data }) => {
              likeCount.textContent = String(data?.likes || 0);
            })
            .catch(() => {
              likeCount.textContent = "0";
            });

          likeBtn.addEventListener("click", async () => {
            try {
              if (localStorage.getItem(likeKey)) return;
            } catch {
              // ignore localStorage errors
            }

            const { data, error } = await supabase.rpc("increment_like", {
              filename_input: name
            });

            if (!error) {
              likeCount.textContent = String(data?.likes ?? Number(likeCount.textContent || 0) + 1);
              try {
                localStorage.setItem(likeKey, "1");
              } catch {
                // ignore localStorage errors
              }
              likeBtn.classList.add("liked");
            }
          });
        }
      }

      playBtn.addEventListener("click", async () => {
        if (audio.paused) {
          $$("audio").forEach((a) => {
            if (a !== audio) a.pause();
          });

          const graphReady = await ensureAudioGraph();
          const started = await safePlay(audio);

          if (graphReady && started && !supportsReducedMotion()) {
            stopVisualizer();
            drawBars();
          }
        } else {
          audio.pause();
        }
      });

      audio.addEventListener("play", () => {
        playBtn.textContent = "⏸";
      });

      audio.addEventListener("pause", () => {
        playBtn.textContent = "▶";
        stopVisualizer();
      });

      audio.addEventListener("ended", () => {
        playBtn.textContent = "▶";
        stopVisualizer();
      });

      audio.addEventListener("loadedmetadata", () => {
        if (Number.isFinite(audio.duration)) {
          seek.max = String(Math.floor(audio.duration));
          durationEl.textContent = formatTime(audio.duration);
        }
      });

      audio.addEventListener("timeupdate", () => {
        seek.value = String(audio.currentTime || 0);
        currentTimeEl.textContent = formatTime(audio.currentTime);
      });

      seek.addEventListener("input", () => {
        audio.currentTime = Number(seek.value);
      });

      volume.addEventListener("input", () => {
        audio.volume = Number(volume.value);
      });

      listContainer.appendChild(clone);
    }
  }

  // expose if needed elsewhere
  window.loadTracks = loadTracks;

  // =========================
  // NAV HIGHLIGHT / SCROLLSPY
  // =========================
  function initScrollSpy() {
    const sections = $$("section[id]");
    const navLinks = $$("nav a");

    if (!sections.length || !navLinks.length) return;
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const id = entry.target.getAttribute("id");
          const link = document.querySelector(`nav a[href="#${id}"]`);
          navLinks.forEach((a) => a.classList.remove("active"));
          if (link) link.classList.add("active");
        });
      },
      {
        rootMargin: "-30% 0px -60% 0px",
        threshold: 0.1
      }
    );

    sections.forEach((section) => observer.observe(section));

    const firstVisible = sections.find((sec) => sec.getBoundingClientRect().top >= 0) || sections[0];
    if (firstVisible) {
      const id = firstVisible.getAttribute("id");
      const link = document.querySelector(`nav a[href="#${id}"]`);
      navLinks.forEach((a) => a.classList.remove("active"));
      if (link) link.classList.add("active");
    }
  }

  // =========================
  // SOUNDCLOUD LAZY LOAD
  // =========================
  function initSoundCloudLazyLoad() {
    const scSection = document.getElementById("music");
    const scIframe = document.getElementById("scPlayer");

    if (!scSection || !scIframe) return;
    if (!("IntersectionObserver" in window)) {
      if (scIframe.dataset.src) scIframe.src = scIframe.dataset.src;
      return;
    }

    const scObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && scIframe.dataset.src) {
            scIframe.src = scIframe.dataset.src;
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    scObserver.observe(scSection);
  }

  // =========================
  // UPLOAD
  // =========================
  function initUpload() {
    const dropZone = document.getElementById("upload-area");
    const fileInput = document.getElementById("fileInput");
    const uploadStatus = document.getElementById("uploadStatus");
    const uploadBtn = document.getElementById("uploadBtn");

    if (!dropZone || !fileInput || !uploadStatus || !uploadBtn) return;

    async function handleFile(file) {
      if (!file || !isValidAudioFilename(file.name)) {
        uploadStatus.textContent = "❌ Only .mp3 or .wav allowed.";
        return;
      }

      const supabase = await getSupabase();
      if (!supabase) {
        uploadStatus.textContent = "❌ Supabase is not initialized.";
        return;
      }

      const { error } = await supabase.storage.from(TRACKS_BUCKET).upload(file.name, file, {
        cacheControl: "3600",
        upsert: false
      });

      if (error) {
        uploadStatus.textContent = `❌ Error: ${error.message}`;
      } else {
        uploadStatus.textContent = `✅ Uploaded: ${file.name}`;
        if (typeof window.listTracks === "function") {
          await window.listTracks();
        }
      }
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
      if (file) {
        handleFile(file);
      } else {
        uploadStatus.textContent = "❗ Choose a file first.";
      }
    });
  }

  // =========================
  // BOOT
  // =========================
  document.addEventListener("DOMContentLoaded", () => {
    initLoaders();
    initSnow();
    initEasterEggs();
    initMainAudioPlayer();
    initClickSound();
    initScrollSpy();
    initSoundCloudLazyLoad();
    initUpload();
  });
})();

/* =========================================================
   TWOVANDALS — INTERACTIVE MODULE PACK
   Добавить в конец текущего JS
   ========================================================= */

(() => {
  "use strict";

  // -------------------------
  // helpers
  // -------------------------
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const safeFormatTime = window.formatTime || function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  async function safeCopy(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    try {
      const input = document.createElement("textarea");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      return true;
    } catch {
      return false;
    }
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
        box-shadow:0 0 18px rgba(0,0,0,.5);opacity:0;transform:translateY(8px);
        transition:opacity .2s ease, transform .2s ease;
      `;
      document.body.appendChild(box);
    }
    box.textContent = message;
    box.style.borderColor =
      type === "success" ? "#0f0" :
      type === "error" ? "#f44" :
      type === "accent" ? "#0ff" : "#666";
    box.style.opacity = "1";
    box.style.transform = "translateY(0)";
    clearTimeout(box._timer);
    box._timer = setTimeout(() => {
      box.style.opacity = "0";
      box.style.transform = "translateY(8px)";
    }, 1800);
  }

  function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
  }

  function debounce(fn, delay = 120) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }

  // -------------------------
  // init all
  // -------------------------
  document.addEventListener("DOMContentLoaded", () => {
    initInteractiveManifest();
    initSequencer();
    initSoundLab();
    initTrackAnatomy();
    initEasterProgress();
  });

  // =========================================================
  // 1. INTERACTIVE MANIFEST
  // HTML expected:
  // <section class="manifest" id="manifest">
  //   <div class="manifest-lines">
  //     <p data-glitch>text...</p>
  //   </div>
  // </section>
  // =========================================================
  function initInteractiveManifest() {
    const lines = $$(".manifest [data-glitch], .manifest p");
    if (!lines.length) return;

    const glitchChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/=+*-_";
    let audioCtx = null;

    function blip(freq = 220, duration = 0.06, type = "square", gainValue = 0.015) {
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

  // =========================================================
  // 2. STEP SEQUENCER
  // HTML expected:
  // <section id="lab">
  //   <div class="grid-wrapper">
  //     <div class="grid-labels"></div>
  //     <div id="drumGrid"></div>
  //   </div>
  //   <div class="grid-wrapper">
  //     <div class="note-labels"></div>
  //     <div id="synthGrid"></div>
  //   </div>
  //   <div class="sequencer-actions">
  //     <button id="seqPlayBtn">PLAY PATTERN</button>
  //     <button id="seqStopBtn">STOP</button>
  //     <button id="seqRandomBtn">RANDOM</button>
  //     <button id="seqClearBtn">CLEAR</button>
  //     <button id="seqShareBtn">COPY LINK</button>
  //   </div>
  //   <label>BPM <input id="seqBpm" type="range" min="70" max="170" value="118"></label>
  //   <span id="seqBpmValue">118</span>
  // </section>
  // =========================================================
  function initSequencer() {
    const drumGridEl = document.getElementById("drumGrid");
    const synthGridEl = document.getElementById("synthGrid");
    if (!drumGridEl || !synthGridEl) return;

    const drumLabelsEl = $(".grid-labels");
    const noteLabelsEl = $(".note-labels");
    const playBtn = document.getElementById("seqPlayBtn");
    const stopBtn = document.getElementById("seqStopBtn");
    const randomBtn = document.getElementById("seqRandomBtn");
    const clearBtn = document.getElementById("seqClearBtn");
    const shareBtn = document.getElementById("seqShareBtn");
    const bpmSlider = document.getElementById("seqBpm");
    const bpmValue = document.getElementById("seqBpmValue");

    const steps = 16;
    const drumRows = ["kick", "snare", "hat"];
    const noteRows = ["C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4"];
    const noteFreq = {
      C5: 523.25, B4: 493.88, A4: 440.0, G4: 392.0,
      F4: 349.23, E4: 329.63, D4: 293.66, C4: 261.63
    };

    let audioCtx = null;
    let masterGain = null;
    let analyser = null;
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
      const bufferSize = audioCtx.sampleRate * 0.04;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
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

    function buildLabels() {
      if (drumLabelsEl) {
        drumLabelsEl.innerHTML = drumRows.map(r => `<div>${r}</div>`).join("");
      }
      if (noteLabelsEl) {
        noteLabelsEl.innerHTML = noteRows.map(r => `<div>${r}</div>`).join("");
      }
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
          cell.setAttribute("aria-label", `${groupName} ${rowName} step ${step + 1}`);

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
      $$(".cell.playing").forEach(c => c.classList.remove("playing"));
    }

    function markStep(step) {
      clearPlayingMarks();
      $$(`.cell[data-step="${step}"]`).forEach(c => c.classList.add("playing"));
    }

    function encodePattern() {
      const drum = drumState.flat().map(v => (v ? "1" : "0")).join("");
      const synth = noteState.flat().map(v => (v ? "1" : "0")).join("");
      return `${drum}.${synth}.${bpm}`;
    }

    function decodePattern(serialized) {
      if (!serialized) return;
      const [drumBits, synthBits, bpmBits] = serialized.split(".");
      if (bpmBits) {
        bpm = clamp(Number(bpmBits) || 118, 70, 170);
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
      drumState.forEach(row => row.fill(false));
      noteState.forEach(row => row.fill(false));
      renderGridState();
      syncUrl();
      flashMessage("PATTERN CLEARED");
    }

    function renderGridState() {
      $$(".cell[data-group='drum']").forEach(cell => {
        const r = Number(cell.dataset.row);
        const s = Number(cell.dataset.step);
        cell.classList.toggle("active", drumState[r][s]);
      });

      $$(".cell[data-group='synth']").forEach(cell => {
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

    buildLabels();
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
      const ok = await safeCopy(window.location.href);
      flashMessage(ok ? "LINK COPIED" : "COPY FAILED", ok ? "success" : "error");
    });

    drumGridEl.addEventListener("click", debounce(syncUrl, 120));
    synthGridEl.addEventListener("click", debounce(syncUrl, 120));
  }

  // =========================================================
  // 3. SOUND LAB / ATMOSPHERE MIXER
  // HTML expected:
  // <section id="soundlab">
  //   <input id="ambienceDrone" type="range" min="0" max="100" value="0">
  //   <input id="ambienceNoise" type="range" min="0" max="100" value="0">
  //   <input id="ambiencePulse" type="range" min="0" max="100" value="0">
  //   <button id="soundLabInit">ACTIVATE SOUNDLAB</button>
  // </section>
  // =========================================================
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
        flashMessage("WEB AUDIO NOT SUPPORTED", "error");
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
  // 4. TRACK ANATOMY
  // HTML expected:
  // <section id="track-anatomy">
  //   <audio id="anatomyTrack" src="..."></audio>
  //   <button id="anatomyPlay">PLAY / PAUSE</button>
  //   <button data-seek-anatomy="0">INTRO</button>
  //   <button data-seek-anatomy="35">DROP</button>
  //   <button data-seek-anatomy="70">BREAK</button>
  //   <input id="anatomyLowpass" type="range" min="200" max="12000" value="12000">
  //   <input id="anatomyDrive" type="range" min="0" max="100" value="0">
  //   <span id="anatomyNow">0:00</span>
  // </section>
  // =========================================================
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
        await audio.play().catch(() => {});
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
      if (now) now.textContent = safeFormatTime(audio.currentTime);
    });

    audio.addEventListener("play", () => {
      playBtn.textContent = "PAUSE TRACK";
    });

    audio.addEventListener("pause", () => {
      playBtn.textContent = "PLAY TRACK";
    });
  }

  // =========================================================
  // 5. EASTER EGG COUNTER
  // uses existing .egg and .egg.found
  // =========================================================
  function initEasterProgress() {
    const eggs = $$(".egg");
    if (!eggs.length) return;

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
    eggs.forEach(egg => egg.addEventListener("click", () => setTimeout(update, 0)));
  }
})();
