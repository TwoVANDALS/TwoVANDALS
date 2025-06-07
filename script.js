window.addEventListener("load", () => {
  document.getElementById("loader").style.display = "none";
});

// AUDIO
document.addEventListener("DOMContentLoaded", () => {
  const bgTrack = document.getElementById("bgTrack");
  const playBtn = document.getElementById("playPauseBtn");
  const volumeSlider = document.getElementById("volumeSlider");

  bgTrack.volume = 0.5;

  playBtn.addEventListener("click", () => {
    if (bgTrack.paused) {
      bgTrack.play();
      playBtn.textContent = "⏸ Pause Trashwave Set";
    } else {
      bgTrack.pause();
      playBtn.textContent = "▶ Listen to a curated Trashwave set";
    }
  });

  volumeSlider.addEventListener("input", e => {
    bgTrack.volume = parseFloat(e.target.value);
  });
});

// SNOW EFFECT
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

// EASTER EGGS
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
    window.open(egg.href, '_blank');
  });
});

function unlockSecret() {
  const section = document.createElement('section');
  section.id = "secret-section";
  section.innerHTML = "<h2>You unlocked the core.</h2><p>This is only the beginning.</p>";
  document.body.appendChild(section);
  section.style.display = "block";
}
