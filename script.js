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

const clickAudio = document.getElementById("clickSound");

document.addEventListener("click", e => {
  const isButton = e.target.closest("button, .pixel-btn, .egg, a");
  if (isButton) {
    clickAudio.currentTime = 0;
    clickAudio.play().catch(() => {});
  }
});
