// 🔊 AUDIO PLAYER
document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("bgTrack");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const volumeSlider = document.getElementById("volumeSlider");
  const seekBar = document.getElementById("seekBar");
  const currentTimeEl = document.getElementById("currentTime");
  const durationEl = document.getElementById("duration");
  const toggleBtn = document.getElementById("togglePlayer");
  const audioPlayer = document.getElementById("audioPlayer");

  function formatTime(sec) {
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
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
    audioPlayer.classList.toggle("collapsed");
    toggleBtn.textContent = audioPlayer.classList.contains("collapsed") ? "▲" : "▼";
  });
});

// ❄️ SNOW CANVAS
const snowCanvas = document.getElementById("snow-canvas");
const ctx = snowCanvas.getContext("2d");
let snowflakes = [];

function resizeCanvas() {
  snowCanvas.width = window.innerWidth;
  snowCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
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

// 👁 CURSOR TRAIL
const cursorTrail = document.getElementById("cursor-trail");
document.addEventListener("mousemove", (e) => {
  cursorTrail.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
});
