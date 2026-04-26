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
