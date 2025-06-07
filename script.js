window.addEventListener("load", () => {
  document.getElementById("loader").style.display = "none";
});

// 🎧 AUDIO PLAYER CONTROLS (fixed player)
document.addEventListener("DOMContentLoaded", () => {
  const player = document.getElementById('player');
  const playBtn = document.getElementById('playBtn');
  const seek = document.getElementById('seek');
  const current = document.getElementById('current');
  const duration = document.getElementById('duration');
  const volume = document.getElementById('volume');

  function formatTime(t) {
    const min = Math.floor(t / 60);
    const sec = Math.floor(t % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }

  playBtn.addEventListener('click', () => {
    if (player.paused) {
      player.play();
      playBtn.textContent = '⏸';
    } else {
      player.pause();
      playBtn.textContent = '▶';
    }
  });

  player.addEventListener('loadedmetadata', () => {
    seek.max = player.duration;
    duration.textContent = formatTime(player.duration);
  });

  player.addEventListener('timeupdate', () => {
    seek.value = player.currentTime;
    current.textContent = formatTime(player.currentTime);
  });

  seek.addEventListener('input', () => {
    player.currentTime = seek.value;
  });

  volume.addEventListener('input', () => {
    player.volume = volume.value;
  });
});

// ❄️ SNOW / PARTICLE EFFECT
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

// 🥚 EASTER EGGS
const eggs = document.querySelectorAll('.egg');
let found = 0;
eggs.forEach(egg => {
  egg.addEventListener('click', (e) => {
    e.preventDefault();
    if (!egg.classList.contains('found')) {
      egg.classList.add('found');
      found++;
      if (found === eggs.length) {
        unlockSecret();
      }
    }
    if (egg.href) window.open(egg.href, '_blank');
  });
});

function unlockSecret() {
  const section = document.createElement('section');
  section.id = "secret-section";
  section.innerHTML = "<h2>You unlocked the core.</h2><p>This is only the beginning.</p>";
  document.body.appendChild(section);
  section.style.display = "block";
}
