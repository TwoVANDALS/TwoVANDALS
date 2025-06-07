window.addEventListener("load", () => {
  document.getElementById("loader").style.display = "none";
});

// ❄️ SNOW EFFECT
const snowCanvas = document.getElementById('snow-canvas');
const ctx = snowCanvas.getContext('2d');
let snowflakes = [];

function resizeCanvas() {
  snowCanvas.width = window.innerWidth;
  snowCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function createSnowflake() {
  return {
    x: Math.random() * snowCanvas.width,
    y: 0,
    radius: Math.random() * 2 + 1,
    speed: Math.random() * 1 + 0.5,
    alpha: Math.random() * 0.5 + 0.3
  };
}

function updateSnow() {
  ctx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
  snowflakes.forEach((flake, i) => {
    flake.y += flake.speed;
    flake.alpha -= 0.0005;
    if (flake.alpha <= 0 || flake.y > snowCanvas.height) {
      snowflakes[i] = createSnowflake();
    }
    ctx.beginPath();
    ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${flake.alpha})`;
    ctx.fill();
  });
  requestAnimationFrame(updateSnow);
}
for (let i = 0; i < 100; i++) snowflakes.push(createSnowflake());
updateSnow();

// 👾 EASTER EGGS
document.querySelectorAll('.egg').forEach(egg => {
  egg.addEventListener('click', (e) => {
    e.preventDefault();
    if (!egg.classList.contains('found')) {
      egg.classList.add('found');
      if (document.querySelectorAll('.egg.found').length === document.querySelectorAll('.egg').length) {
        const section = document.createElement('section');
        section.id = "secret-section";
        section.innerHTML = "<h2>You unlocked the core.</h2><p>This is only the beginning.</p>";
        document.body.appendChild(section);
      }
    }
    if (egg.href) window.open(egg.href, '_blank');
  });
});

// 🎧 AUDIO PLAYER (no duplication)
document.addEventListener("DOMContentLoaded", () => {
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

  // 🔊 Плейлист
  const playlist = [
    "ybuocfiewu.mp3", // замените на актуальные пути или Supabase URLs
    "track2.mp3",
    "track3.mp3"
  ];
  let currentIndex = 0;

  function formatTime(sec) {
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function loadTrack(index) {
    if (index < 0) index = playlist.length - 1;
    if (index >= playlist.length) index = 0;
    currentIndex = index;
    audio.src = playlist[currentIndex];
    trackTitle.textContent = `Track ${currentIndex + 1}`;
    audio.load();
    audio.play();
    playPauseBtn.textContent = "⏸ Playing Trashwave Set";
  }

  playPauseBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
      playPauseBtn.textContent = "⏸ Playing Trashwave Set";
    } else {
      audio.pause();
      playPauseBtn.textContent = "▶ Listen to a curated Trashwave set";
    }
  });

  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
  });

  audio.addEventListener("loadedmetadata", () => {
    seekBar.max = Math.floor(audio.duration);
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
        audioPlayer.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
    }
  });

  // 🔁 Кнопки переключения треков
  prevBtn.addEventListener("click", () => {
    loadTrack(currentIndex - 1);
  });

  nextBtn.addEventListener("click", () => {
    loadTrack(currentIndex + 1);
  });

  // 🔄 Автопереход на следующий трек
  audio.addEventListener("ended", () => {
    loadTrack(currentIndex + 1);
  });

  // 🟢 Инициализация
  loadTrack(currentIndex);
});

const clickAudio = document.getElementById("clickSound");

document.addEventListener("click", e => {
  const isButton = e.target.closest("button, .pixel-btn, .egg, a");
  if (isButton) {
    clickAudio.currentTime = 0;
    clickAudio.play().catch(() => {});
  }
});

async function loadTracks(fileList) {
  const listContainer = document.getElementById("trackList");
  const template = document.getElementById("audio-template");

  listContainer.innerHTML = "";

  for (const file of fileList) {
    const name = file.name || "Unknown";
    if (!name.match(/\.(mp3|wav)$/i)) continue;

    const clone = template.content.cloneNode(true);
    const audio = clone.querySelector("audio");
    const title = clone.querySelector(".track-title");
    const playBtn = clone.querySelector(".play-btn");
    const seek = clone.querySelector(".seek-bar");
    const volume = clone.querySelector(".volume-bar");
    const currentTimeEl = clone.querySelector(".current-time");
    const durationEl = clone.querySelector(".duration");

    title.textContent = name.replace(/\.[^/.]+$/, "");
    audio.src = file.url || file.publicUrl;

    let isPlaying = false;

    const formatTime = (s) => {
      const m = Math.floor(s / 60);
      const ss = Math.floor(s % 60).toString().padStart(2, "0");
      return `${m}:${ss}`;
    };

    playBtn.addEventListener("click", () => {
      if (audio.paused) {
        document.querySelectorAll("audio").forEach(a => {
          if (a !== audio) a.pause();
        });
        audio.play();
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("play", () => {
      isPlaying = true;
      playBtn.textContent = "⏸";
    });

    audio.addEventListener("pause", () => {
      isPlaying = false;
      playBtn.textContent = "▶";
    });

    audio.addEventListener("loadedmetadata", () => {
      if (isFinite(audio.duration)) {
        seek.max = Math.floor(audio.duration);
        durationEl.textContent = formatTime(audio.duration);
      } else {
        audio.currentTime = 1e101;
        audio.ontimeupdate = () => {
          audio.ontimeupdate = null;
          audio.currentTime = 0;
          seek.max = Math.floor(audio.duration);
          durationEl.textContent = formatTime(audio.duration);
        };
      }
    });

    audio.addEventListener("timeupdate", () => {
      seek.value = audio.currentTime;
      currentTimeEl.textContent = formatTime(audio.currentTime);
    });

    seek.addEventListener("input", () => {
      audio.currentTime = seek.value;
    });

    volume.addEventListener("input", () => {
      audio.volume = volume.value;
    });

    listContainer.appendChild(clone);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader-screen");
  const text = document.getElementById("loader-text");
  const final = "TwoVANDALS";
  let index = 1;

  const interval = setInterval(() => {
    if (index < final.length) {
      text.textContent += final[index];
      index++;
    } else {
      clearInterval(interval);
      setTimeout(() => {
        loader.classList.add("hidden");
      }, 500);
    }
  }, 150);
});

window.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll("nav a");

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const id = entry.target.getAttribute("id");
        const link = document.querySelector(`nav a[href="#${id}"]`);
        if (entry.isIntersecting) {
          navLinks.forEach(a => a.classList.remove("active"));
          if (link) link.classList.add("active");
        }
      });
    },
    {
      rootMargin: "-40% 0px -55% 0px",
      threshold: 0.1
    }
  );

  sections.forEach(section => observer.observe(section));
});

// 🎵 Lazy load SoundCloud iframe
const scSection = document.getElementById("music");
const scIframe = document.getElementById("scPlayer");

const scObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && scIframe.dataset.src) {
      scIframe.src = scIframe.dataset.src;
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.25 });

if (scSection) scObserver.observe(scSection);
