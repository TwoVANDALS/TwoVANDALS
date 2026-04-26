(() => {
  "use strict";

  // =========================================================
  // CONFIG
  // =========================================================
  const SUPABASE_URL = "https://qqffjsnlsbzhzhlvbexb.supabase.co";
  const SUPABASE_ANON_KEY = "YOUR_ANON_KEY"; // <-- replace
  const TRACKS_BUCKET = "tracks";

  const MAIN_PLAYLIST = [
    "ybuocfiewu.mp3",
    "track2.mp3",
    "track3.mp3"
  ];

  let supabaseClientPromise = null;

  // =========================================================
  // HELPERS
  // =========================================================
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

  function notify(message, type = "info") {
    let toast = document.getElementById("site-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "site-toast";
      toast.style.cssText = `
        position: fixed;
        right: 16px;
        bottom: 84px;
        z-index: 100000;
        background: rgba(0,0,0,.92);
        color: #fff;
        border: 1px solid #444;
        padding: 10px 14px;
        font-family: VT323, monospace;
        font-size: 20px;
        letter-spacing: .06em;
        box-shadow: 0 8px 30px rgba(0,0,0,.35);
        opacity: 0;
        transform: translateY(8px);
        transition: opacity .2s ease, transform .2s ease, border-color .2s ease;
        pointer-events: none;
      `;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.borderColor =
      type === "success" ? "#00ff99" :
      type === "error" ? "#ff4d6d" :
      type === "accent" ? "#00e5ff" :
      "#444";

    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
    }, 1800);
  }

  // =========================================================
  // LOADER
  // =========================================================
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
        setTimeout(() => loaderScreen.classList.add("hidden"), 500);
      }
    }, 150);
  }

  // =========================================================
  // SNOW
  // =========================================================
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
        alpha: Math.random() * 0.45 + 0.25
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
      if (animationId == null) drawSnow();
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

  // =========================================================
  // EASTER EGGS
  // =========================================================
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

          if (found === total && !document.getElementById("secret-section")) {
            const section = document.createElement("section");
            section.id = "secret-section";
            section.innerHTML = `
              <h2>You unlocked the core.</h2>
              <p>This is only the beginning.</p>
            `;
            document.body.appendChild(section);
            notify("ALL ARTIFACTS FOUND", "success");
          }
        }

        const href = egg.getAttribute("href");
        if (href) {
          window.open(href, "_blank", "noopener,noreferrer");
        }
      });
    });
  }

  function initEasterProgress() {
    const eggs = $$(".egg");
    if (!eggs.length) return;

    let badge = document.getElementById("egg-progress");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "egg-progress";
      badge.style.cssText = `
        position: fixed;
        left: 14px;
        bottom: 84px;
        z-index: 9998;
        padding: 6px 10px;
        background: rgba(0,0,0,.85);
        color: #fff;
        border: 1px solid #333;
        font-family: VT323, monospace;
        font-size: 18px;
        letter-spacing: .08em;
      `;
      document.body.appendChild(badge);
    }

    const update = () => {
      const found = $$(".egg.found").length;
      badge.textContent = `ARTIFACTS ${found}/${eggs.length}`;
      badge.style.borderColor = found === eggs.length ? "#00ff99" : "#333";
      badge.style.color = found === eggs.length ? "#00ff99" : "#fff";
    };

    update();
    eggs.forEach((egg) => egg.addEventListener("click", () => setTimeout(update, 0)));
  }

  // =========================================================
  // MAIN AUDIO PLAYER
  // =========================================================
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
      !audio || !playPauseBtn || !volumeSlider || !seekBar || !currentTimeEl ||
      !durationEl || !toggleBtn || !audioPlayer || !prevBtn || !nextBtn || !trackTitle
    ) return;

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

    prevBtn.addEventListener("click", () => loadTrack(currentIndex - 1, true));
    nextBtn.addEventListener("click", () => loadTrack(currentIndex + 1, true));
    audio.addEventListener("ended", () => loadTrack(currentIndex + 1, true));
    audio.addEventListener("pause", () => setPlayButtonState(false));
    audio.addEventListener("play", () => setPlayButtonState(true));

    audio.volume = Number(volumeSlider.value || 1);
    loadTrack(currentIndex, false);
  }

  // =========================================================
  // CLICK SOUND
  // =========================================================
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

  // =========================================================
  // SPECTRUM VISUALIZER HELPERS
  // =========================================================
  function createSpectrumVisualizer(audio, canvas) {
    if (!audio || !canvas) return null;

    const vizCtx = canvas.getContext("2d");
    if (!vizCtx) return null;

    let audioCtx = null;
    let analyser = null;
    let source = null;
    let animationId = null;
    let dataArray = null;
    let gradient = null;

    function getLogicalWidth() {
      return Math.max(280, Math.floor(canvas.clientWidth || 600));
    }

    function getLogicalHeight() {
      return Math.max(60, Math.floor(canvas.clientHeight || 90));
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = getLogicalWidth();
      const height = getLogicalHeight();

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      vizCtx.setTransform(1, 0, 0, 1, 0, 0);
      vizCtx.scale(dpr, dpr);

      gradient = vizCtx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "#00ff99");
      gradient.addColorStop(0.45, "#00d9ff");
      gradient.addColorStop(1, "#ffffff");
    }

    async function ensureGraph() {
      if (!audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return false;

        audioCtx = new AudioCtx();
        analyser = audioCtx.createAnalyser();

        // Each MediaElementAudioSourceNode is created from one specific HTMLMediaElement.
        source = audioCtx.createMediaElementSource(audio);

        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.82;
        analyser.minDecibels = -92;
        analyser.maxDecibels = -18;

        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        dataArray = new Uint8Array(analyser.frequencyBinCount);
      }

      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      return true;
    }

    function clear() {
      const width = getLogicalWidth();
      const height = getLogicalHeight();
      vizCtx.clearRect(0, 0, width, height);

      // faint idle frame
      vizCtx.fillStyle = "rgba(255,255,255,0.02)";
      vizCtx.fillRect(0, 0, width, height);
    }

    function stop() {
      if (animationId != null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      clear();
    }

    function draw() {
      if (!analyser || !dataArray) return;

      const width = getLogicalWidth();
      const height = getLogicalHeight();

      analyser.getByteFrequencyData(dataArray);
      vizCtx.clearRect(0, 0, width, height);

      const bg = vizCtx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "rgba(10,10,10,0.08)");
      bg.addColorStop(1, "rgba(0,0,0,0.32)");
      vizCtx.fillStyle = bg;
      vizCtx.fillRect(0, 0, width, height);

      // horizontal guide lines
      vizCtx.strokeStyle = "rgba(255,255,255,0.05)";
      vizCtx.lineWidth = 1;
      for (let y = 0; y < height; y += 18) {
        vizCtx.beginPath();
        vizCtx.moveTo(0, y);
        vizCtx.lineTo(width, y);
        vizCtx.stroke();
      }

      const visibleBars = 56;
      const step = Math.max(1, Math.floor(dataArray.length / visibleBars));
      const gap = 3;
      const barWidth = (width - (visibleBars - 1) * gap) / visibleBars;

      let x = 0;

      for (let i = 0; i < visibleBars; i++) {
        const raw = dataArray[i * step] || 0;
        const weight = 1.16 - (i / visibleBars) * 0.42;
        const scaled = Math.min(255, raw * weight);
        const barHeight = Math.max(2, (scaled / 255) * height);

        vizCtx.fillStyle = gradient;
        vizCtx.fillRect(x, height - barHeight, barWidth, barHeight);

        vizCtx.fillStyle = "rgba(255,255,255,0.82)";
        vizCtx.fillRect(x, height - barHeight, barWidth, 2);

        x += barWidth + gap;
      }

      animationId = requestAnimationFrame(draw);
    }

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else if (!audio.paused) draw();
    });

    resize();
    clear();

    return {
      ensureGraph,
      start: async () => {
        const ok = await ensureGraph();
        if (!ok) return false;
        stop();
        draw();
        return true;
      },
      stop,
      destroy: () => {
        stop();
        window.removeEventListener("resize", onResize);
      }
    };
  }

  // =========================================================
  // TRACK LIST + SPECTRUM ANALYZER
  // =========================================================
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
        !audio || !canvas || !title || !playBtn || !seek ||
        !volume || !currentTimeEl || !durationEl
      ) {
        continue;
      }

      const spectrum = createSpectrumVisualizer(audio, canvas);

      title.textContent = name.replace(/\.[^/.]+$/, "");
      audio.src = file.url || file.publicUrl || "";
      audio.preload = "metadata";

      // delete
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

      // likes
      if (likeBtn && likeCount) {
        const likeKey = `liked_${name}`;
        let hasLiked = false;

        try {
          hasLiked = !!localStorage.getItem(likeKey);
        } catch {}

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
            } catch {}

            const { data, error } = await supabase.rpc("increment_like", {
              filename_input: name
            });

            if (!error) {
              likeCount.textContent = String(data?.likes ?? Number(likeCount.textContent || 0) + 1);
              try {
                localStorage.setItem(likeKey, "1");
              } catch {}
              likeBtn.classList.add("liked");
              notify("TRACK LIKED", "accent");
            }
          });
        }
      }

      // play/pause
      playBtn.addEventListener("click", async () => {
        if (audio.paused) {
          $$("audio").forEach((a) => {
            if (a !== audio) a.pause();
          });

          const started = await safePlay(audio);
          if (started) {
            await spectrum?.start();
          }
        } else {
          audio.pause();
        }
      });

      audio.addEventListener("play", async () => {
        playBtn.textContent = "⏸";
        await spectrum?.start();
      });

      audio.addEventListener("pause", () => {
        playBtn.textContent = "▶";
        spectrum?.stop();
      });

      audio.addEventListener("ended", () => {
        playBtn.textContent = "▶";
        spectrum?.stop();
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

  window.loadTracks = loadTracks;

  // =========================================================
  // SCROLLSPY
  // =========================================================
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

  // =========================================================
  // SOUNDCLOUD LAZY LOAD
  // =========================================================
  function initSoundCloudLazyLoad() {
    const scSection = document.getElementById("music");
    const scIframe = document.getElementById("scPlayer");

    if (!scSection || !scIframe) return;

    if (!("IntersectionObserver" in window)) {
      if (scIframe.dataset.src) scIframe.src = scIframe.dataset.src;
      return;
    }

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

  // =========================================================
  // UPLOAD
  // =========================================================
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
        notify(`UPLOADED: ${file.name}`, "success");
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
      else uploadStatus.textContent = "❗ Choose a file first.";
    });
  }

  // =========================================================
  // BOOT
  // =========================================================
  document.addEventListener("DOMContentLoaded", () => {
    initLoaders();
    initSnow();
    initEasterEggs();
    initEasterProgress();
    initMainAudioPlayer();
    initClickSound();
    initScrollSpy();
    initSoundCloudLazyLoad();
    initUpload();
  });
})();
