// 🎧 Audio-reactive glitch engine
const audio = document.getElementById("bgTrack");
const glitchCanvas = document.getElementById("glitch-canvas");
const gCtx = glitchCanvas.getContext("2d");

function resizeGlitchCanvas() {
  glitchCanvas.width = window.innerWidth;
  glitchCanvas.height = window.innerHeight;
}
resizeGlitchCanvas();
window.addEventListener("resize", resizeGlitchCanvas);

// 👾 Create random glitch blocks
let glitchData = [];
for (let i = 0; i < 30; i++) {
  glitchData.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    w: 20 + Math.random() * 60,
    h: 5 + Math.random() * 15,
    dx: Math.random() * 2 - 1,
    dy: Math.random() * 1 - 0.5,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`
  });
}

function drawGlitches() {
  gCtx.clearRect(0, 0, glitchCanvas.width, glitchCanvas.height);
  glitchData.forEach(g => {
    gCtx.fillStyle = g.color;
    gCtx.fillRect(g.x, g.y, g.w, g.h);
    g.x += g.dx;
    g.y += g.dy;

    if (g.x > window.innerWidth || g.x < 0 || g.y > window.innerHeight || g.y < 0) {
      g.x = Math.random() * window.innerWidth;
      g.y = Math.random() * window.innerHeight;
    }
  });
  requestAnimationFrame(drawGlitches);
}
drawGlitches();

// 🎛 Sync glitch effect to audio
function audioGlitchLoop() {
  if (!audio.paused) {
    const t = audio.currentTime;
    document.body.style.filter = `contrast(${1 + Math.sin(t) * 0.5}) hue-rotate(${t * 20}deg)`;
    glitchCanvas.style.opacity = 0.4 + Math.sin(t * 2) * 0.4;
  } else {
    document.body.style.filter = '';
    glitchCanvas.style.opacity = 0.2;
  }
  requestAnimationFrame(audioGlitchLoop);
}
document.addEventListener("DOMContentLoaded", audioGlitchLoop);
