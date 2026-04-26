"use strict";

/* =========================================================
   TWOVANDALS — full script.js
   Safe DOM init, snow, eggs, main audio player, click sound,
   track list with visualizer, scroll spy, lazy SoundCloud,
   upload via Supabase, likes/delete, loader animations.
   ========================================================= */

(() => {
  // -------------------------
  // config
  // -------------------------
  const SUPABASE_URL = "https://qqffjsnlsbzhzhlvbexb.supabase.co";
  const SUPABASE_ANON_KEY = "YOUR_ANON_KEY"; // <-- замени на свой anon key

  const DEFAULT_PLAYLIST = [
    "ybuocfiewu.mp3",
    "track2.mp3",
    "track3.mp3"
  ];

  const ALLOWED_AUDIO_EXTENSIONS = /\.(mp3|wav)$/i;
  const REDUCED_MOTION = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  // -------------------------
  // helpers
  // -------------------------
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function isAudioFile(name = "") {
    return ALLOWED_AUDIO_EXTENSIONS.test(name);
  }

  function setText(el, value) {
    if (el) el.textContent = value;
  }

  function setHTML(el, value) {
    if (el) el.innerHTML = value;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function debounce(fn, delay = 150) {
    let timeoutId = null;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  async function safePlay(mediaEl) {
    if (!mediaEl) return false;
    try {
      const playPromise = mediaEl.play();
      if (playPromise && typeof playPromise.then === "function") {
        await playPromise;
      }
      return true;
    } catch {
      return false;
    }
  }

  function openExternal(url) {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function createStatusMessage(el, message, type = "info") {
    if (!el) return;
    el.textContent = message;
    el.dataset.state = type;
  }

  function getStoredLikeMap() {
    try {
      return JSON.parse(localStorage.getItem("tv_likes_map") || "{}");
    } catch {
      return {};
    }
  }

  function setStoredLike(filename) {
    try {
      const map = getStoredLikeMap();
      map[filename] = true;
      localStorage.setItem("tv_likes_map", JSON.stringify(map));
    } catch {
      // no-op
    }
  }

  function hasStoredLike(filename) {
    try {
      const map = getStoredLikeMap();
      return Boolean(map[filename]);
    } catch {
      return false;
    }
  }

  // -------------------------
  // Supabase singleton
  // -------------------------
  let supabaseClientPromise = null;

  async function getSupabase() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === "YOUR_ANON_KEY") {
      return null;
    }

    if (!supabaseClientPromise) {
      supabaseClientPromise = import("https://esm.sh/@supabase/supabase-js")
        .then(({ createClient }) =>
          createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        )
        .catch(() => null);
    }

    return supabaseClientPromise;
  }

  // -------------------------
  // global state for track cards
  // -------------------------
  const mediaNodeMap = new WeakMap(); // audioEl -> { audioCtx, analyser, source, animId, canvas, ctx }

  // -------------------------
  // boot
  // -------------------------
  window.addEventListener("load", initWindowLoad);
  document.addEventListener("DOMContentLoaded", initApp);

  function initWindowLoad() {
    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";
  }

  function initApp() {
    initAnimatedLoader();
    initSnow();
    initEasterEggs();
    initMainAudioPlayer();
    initClickSound();
    initScrollSpy();
    initSoundCloudLazyLoad();
    initUploadArea();
  }

  // -------------------------
  // loader animation
  // -------------------------
  function initAnimatedLoader() {
    const loader = document.getElementById("loader-screen");
    const text = document.getElementById("loader-text");
    if (!loader || !text) return;

    const final = "TwoVANDALS";
    let index = Math.max(1, text.textContent.length || 1);

    const interval = setInterval(() => {
      if (index < final.length) {
        text.textContent += final[index];
        index += 1;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          loader.classList.add("hidden");
        }, 500);
      }
    }, 150);
  }

  // -------------------------
  // snow effect
  // -------------------------
  function initSnow() {
    const snowCanvas = document.getElementById("snow-canvas");
    if (!snowCanvas || REDUCED_MOTION) return;

    const snowCtx = snowCanvas.getContext("2d");
    if (!snowCtx) return;

    let snowflakes = [];
    let animationId = null;
    const flakesCount = 100;

    function resizeCanvas() {
      snowCanvas.width = window.innerWidth;
      snowCanvas.height = window.innerHeight;
    }

    function createSnowflake() {
      return {
        x: Math.random() * snowCanvas.width,
        y: Math.random() * -snowCanvas.height,
        radius: Math.random() * 2 + 1,
        speedY: Math.random() * 1 + 0.5,
        driftX: (Math.random() - 0.5) * 0.35,
        alpha: Math.random() * 0.5 + 0.3
      };
    }

    function resetSnowflake(i) {
      snowflakes[i] = createSnowflake();
    }

    function renderSnow() {
      snowCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);

      snowflakes.forEach((flake, i) => {
        flake.y += flake.speedY;
        flake.x += flake.driftX;

        if (
          flake.y > snowCanvas.height + 10 ||
          flake.x < -20 ||
          flake.x > snowCanvas.width + 20
        ) {
          resetSnowflake(i);
        }

        snowCtx.beginPath();
        snowCtx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        snowCtx.fillStyle = `rgba(255,255,255,${flake.alpha})`;
        snowCtx.fill();
      });

      animationId = window.requestAnimationFrame(renderSnow);
    }

    function start() {
      if (!animationId) renderSnow();
    }

    function stop() {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }

    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });

    resizeCanvas();
    snowflakes = Array.from({ length: flakesCount }, createSnowflake);
    start();
  }

  // -------------------------
  // easter eggs
  // -------------------------
  function initEasterEggs() {
    const eggs = $$(".egg");
    if (!eggs.length) return;

    eggs.forEach((egg) => {
      egg.addEventListener("click", (e) => {
        e.preventDefault();

        if (!egg.classList.contains("found")) {
          egg.classList.add("found");
        }

        const total = document.querySelectorAll(".egg").length;
        const found = document.querySelectorAll(".egg.found").length;

        if (found === total && !document.getElementById("secret-section")) {
          const section = document.createElement("section");
          section.id = "secret-section";
          section.innerHTML = `
            <h2>You unlocked the core.</h2>
            <p>This is only the beginning.</p>
          `;
          document.body.appendChild(section);
        }

        const href = egg.getAttribute("href");
        if (href) openExternal(href);
      });
    });
  }

  // -------------------------
  // main audio player
  // -------------------------
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

    if (!audio || !playPauseBtn) return;

    const playlist = [...DEFAULT_PLAYLIST];
    let currentIndex = 0;

    function setPlayButtonState(isPlaying) {
      playPauseBtn.textContent = isPlaying
        ? "⏸ Playing Trashwave Set"
        : "▶ Listen to a curated Trashwave set";
    }

    async function loadTrack(index, autoplay = true) {
      if (!playlist.length) return;

      if (index < 0) index = playlist.length - 1;
      if (index >= playlist.length) index = 0;

      currentIndex = index;
      audio.src = playlist[currentIndex];
      if (trackTitle) {
        trackTitle.textContent = `Track ${currentIndex + 1}`;
      }

      audio.load();

      if (autoplay) {
        const ok = await safePlay(audio);
        setPlayButtonState(ok && !audio.paused);
      } else {
        setPlayButtonState(false);
      }
    }

    playPauseBtn.addEventListener("click", async () => {
      if (audio.paused) {
        const ok = await safePlay(audio);
        setPlayButtonState(ok && !audio.paused);
      } else {
        audio.pause();
        setPlayButtonState(false);
      }
    });

    volumeSlider?.addEventListener("input", () => {
      audio.volume = clamp(Number(volumeSlider.value), 0, 1);
    });

    audio.addEventListener("loadedmetadata", () => {
      if (seekBar) seekBar.max = Math.floor(audio.duration || 0);
      setText(durationEl, formatTime(audio.duration));
    });

    audio.addEventListener("timeupdate", () => {
      if (seekBar && !seekBar.matches(":active")) {
        seekBar.value = String(Math.floor(audio.currentTime || 0));
      }
      setText(currentTimeEl, formatTime(audio.currentTime));
    });

    seekBar?.addEventListener("input", () => {
      audio.currentTime = Number(seekBar.value || 0);
    });

    toggleBtn?.addEventListener("click", () => {
      if (!audioPlayer) return;
      const isCollapsed = audioPlayer.classList.toggle("collapsed");
      toggleBtn.textContent = isCollapsed ? "▲" : "▼";

      if (!isCollapsed) {
        setTimeout(() => {
          audioPlayer.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
      }
    });

    prevBtn?.addEventListener("click", () => loadTrack(currentIndex - 1, true));
    nextBtn?.addEventListener("click", () => loadTrack(currentIndex + 1, true));

    audio.addEventListener("ended", () => {
      loadTrack(currentIndex + 1, true);
    });

    audio.addEventListener("play", () => setPlayButtonState(true));
    audio.addEventListener("pause", () => setPlayButtonState(false));

    loadTrack(currentIndex, false);
  }

  // -------------------------
  // click sound
  // -------------------------
  function initClickSound() {
    const clickAudio = document.getElementById("clickSound");
    if (!clickAudio) return;

    document.addEventListener("click", (e) => {
      const isButton = e.target.closest("button, .pixel-btn, .egg, a");
      if (!isButton) return;

      try {
        clickAudio.currentTime = 0;
        clickAudio.play().catch(() => {});
      } catch {
        // no-op
      }
    });
  }

  // -------------------------
  // public track list API
  // usage: window.loadTracks(fileList)
  // -------------------------
  window.loadTracks = async function loadTracks(fileList = []) {
    const listContainer = document.getElementById("trackList");
    const template = document.getElementById("audio-template");

    if (!listContainer || !template) return;

    listContainer.innerHTML = "";

    for (const file of fileList) {
      const name = file?.name || "Unknown";
      if (!isAudioFile(name)) continue;

      const clone = template.content.cloneNode(true);

      const audio = clone.querySelector("audio");
      const canvas = clone.querySelector(".visualizer");
      const title = clone.querySelector(".track-title");
      const playBtn = clone.querySelector(".play-btn");
      const seek = clone.querySelector(".seek-bar");
      const volume = clone.querySelector(".volume-bar");
      const currentTimeEl = clone.querySelector(".current-time");
      const durationEl = clone.querySelector(".duration");
      const deleteBtn = clone.querySelector(".delete-btn");
      const likeBtn = clone.querySelector(".like-btn");
      const likeCount = clone.querySelector(".like-count");

      if (!audio) continue;

      const publicUrl = file.url || file.publicUrl || "";
      audio.src = publicUrl;
      audio.preload = "metadata";

      if (title) {
        title.textContent = name.replace(/\.[^/.]+$/, "");
      }

      if (volume) {
        audio.volume = clamp(Number(volume.value || 1), 0, 1);
      }

      initTrackCardVisualizer(audio, canvas);

      playBtn?.addEventListener("click", async () => {
        if (audio.paused) {
          document.querySelectorAll("audio").forEach((a) => {
            if (a !== audio) a.pause();
          });

          const ok = await safePlay(audio);
          if (!ok) {
            playBtn.textContent = "▶";
          }
        } else {
          audio.pause();
        }
      });

      audio.addEventListener("play", () => {
        if (playBtn) playBtn.textContent = "⏸";
        startTrackCardVisualizer(audio);
      });

      audio.addEventListener("pause", () => {
        if (playBtn) playBtn.textContent = "▶";
        stopTrackCardVisualizer(audio);
      });

      audio.addEventListener("ended", () => {
        if (playBtn) playBtn.textContent = "▶";
        stopTrackCardVisualizer(audio);
      });

      audio.addEventListener("loadedmetadata", () => {
        if (Number.isFinite(audio.duration)) {
          if (seek) seek.max = String(Math.floor(audio.duration));
          setText(durationEl, formatTime(audio.duration));
        }
      });

      audio.addEventListener("timeupdate", () => {
        if (seek && !seek.matches(":active")) {
          seek.value = String(Math.floor(audio.currentTime || 0));
        }
        setText(currentTimeEl, formatTime(audio.currentTime));
      });

      seek?.addEventListener("input", () => {
        audio.currentTime = Number(seek.value || 0);
      });

      volume?.addEventListener("input", () => {
        audio.volume = clamp(Number(volume.value || 1), 0, 1);
      });

      deleteBtn?.addEventListener("click", async () => {
        const supabase = await getSupabase();
        if (!supabase) {
          alert("❌ Supabase is not configured.");
          return;
        }

        const confirmDelete = confirm(`Delete track "${name}"?`);
        if (!confirmDelete) return;

        const { error } = await supabase.storage.from("tracks").remove([name]);

        if (error) {
          alert(`❌ Error deleting track: ${error.message}`);
        } else {
          alert(`🗑️ Deleted: ${name}`);
          if (typeof window.listTracks === "function") {
            await window.listTracks();
          }
        }
      });

      if (likeBtn && likeCount) {
        const alreadyLiked = hasStoredLike(name);
        if (alreadyLiked) likeBtn.classList.add("liked");

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
        } else {
          likeCount.textContent = "0";
        }

        likeBtn.addEventListener("click", async () => {
          if (hasStoredLike(name)) return;

          const supabaseInner = await getSupabase();
          if (!supabaseInner) {
            alert("❌ Supabase is not configured.");
            return;
          }

          const { data, error } = await supabaseInner.rpc("increment_like", {
            filename_input: name
          });

          if (!error) {
            likeCount.textContent = String(data?.likes ?? Number(likeCount.textContent || 0) + 1);
            setStoredLike(name);
            likeBtn.classList.add("liked");
          }
        });
      }

      listContainer.appendChild(clone);
    }
  };

  function initTrackCardVisualizer(audio, canvas) {
    if (!audio || !canvas) return;

    const visualizerCtx = canvas.getContext("2d");
    if (!visualizerCtx) return;

    mediaNodeMap.set(audio, {
      audioCtx: null,
      analyser: null,
      source: null,
      animId: null,
      canvas,
      ctx: visualizerCtx
    });
  }

  async function ensureTrackCardAudioGraph(audio) {
    const node = mediaNodeMap.get(audio);
    if (!node) return null;

    if (node.audioCtx && node.analyser && node.source) {
      if (node.audioCtx.state === "suspended") {
        await node.audioCtx.resume().catch(() => {});
      }
      return node;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;

      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;

      const source = audioCtx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);

      node.audioCtx = audioCtx;
      node.analyser = analyser;
      node.source = source;

      if (audioCtx.state === "suspended") {
        await audioCtx.resume().catch(() => {});
      }

      return node;
    } catch {
      return null;
    }
  }

  async function startTrackCardVisualizer(audio) {
    const node = await ensureTrackCardAudioGraph(audio);
    if (!node || !node.analyser || !node.ctx || !node.canvas) return;

    if (node.animId) cancelAnimationFrame(node.animId);

    const { analyser, ctx, canvas } = node;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const drawBars = () => {
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        ctx.fillStyle = `rgb(${barHeight + 50},50,50)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }

      node.animId = requestAnimationFrame(drawBars);
    };

    drawBars();
  }

  function stopTrackCardVisualizer(audio) {
    const node = mediaNodeMap.get(audio);
    if (!node) return;

    if (node.animId) {
      cancelAnimationFrame(node.animId);
      node.animId = null;
    }

    if (node.ctx && node.canvas) {
      node.ctx.clearRect(0, 0, node.canvas.width, node.canvas.height);
    }
  }

  // -------------------------
  // scroll spy
  // -------------------------
  function initScrollSpy() {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll("nav a");
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

    const firstVisible = [...sections].find((sec) => sec.getBoundingClientRect().top >= 0);
    if (firstVisible) {
      const id = firstVisible.getAttribute("id");
      const link = document.querySelector(`nav a[href="#${id}"]`);
      navLinks.forEach((a) => a.classList.remove("active"));
      if (link) link.classList.add("active");
    }
  }

  // -------------------------
  // lazy SoundCloud iframe
  // -------------------------
  function initSoundCloudLazyLoad() {
    const scSection = document.getElementById("music");
    const scIframe = document.getElementById("scPlayer");
    if (!scSection || !scIframe) return;

    const scObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && scIframe.dataset.src) {
          scIframe.src = scIframe.dataset.src;
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    scObserver.observe(scSection);
  }

  // -------------------------
  // upload area
  // -------------------------
  function initUploadArea() {
    const dropZone = document.getElementById("upload-area");
    const fileInput = document.getElementById("fileInput");
    const uploadStatus = document.getElementById("uploadStatus");
    const uploadBtn = document.getElementById("uploadBtn");

    if (!dropZone || !fileInput || !uploadStatus || !uploadBtn) return;

    async function handleFile(file) {
      if (!file || !isAudioFile(file.name)) {
        createStatusMessage(uploadStatus, "❌ Only .mp3 or .wav allowed.", "error");
        return;
      }

      const supabase = await getSupabase();
      if (!supabase) {
        createStatusMessage(uploadStatus, "❌ Supabase is not configured.", "error");
        return;
      }

      createStatusMessage(uploadStatus, "⏳ Uploading...", "info");

      const { error } = await supabase.storage.from("tracks").upload(file.name, file, {
        cacheControl: "3600",
        upsert: false
      });

      if (error) {
        createStatusMessage(uploadStatus, `❌ Error: ${error.message}`, "error");
      } else {
        createStatusMessage(uploadStatus, `✅ Uploaded: ${file.name}`, "success");
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
      if (file) handleFile(file);
      else createStatusMessage(uploadStatus, "❗ Choose a file first.", "info");
    });
  }

  // -------------------------
  // optional helper: list tracks from Supabase
  // if you don't already have window.listTracks, this one will work.
  // -------------------------
  if (typeof window.listTracks !== "function") {
    window.listTracks = async function listTracks() {
      const supabase = await getSupabase();
      if (!supabase) return;

      const { data, error } = await supabase.storage.from("tracks").list("", {
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "asc" }
      });

      if (error || !Array.isArray(data)) return;

      const fileList = data
        .filter((file) => isAudioFile(file.name))
        .map((file) => {
          const { data: publicData } = supabase.storage.from("tracks").getPublicUrl(file.name);
          return {
            name: file.name,
            publicUrl: publicData?.publicUrl || ""
          };
        });

      await window.loadTracks(fileList);
    };
  }
})();
