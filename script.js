document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  if (loader) setTimeout(() => loader.remove(), 2500);

  const canvas = document.getElementById("matrix-canvas");
  const ctx = canvas.getContext("2d");
  let animationEnabled = true;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const cols = Math.floor(window.innerWidth / 20);
  const drops = Array(cols).fill(1);

  function drawMatrix() {
    if (!animationEnabled) return;
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111";
    ctx.font = "15px monospace";
    for (let i = 0; i < drops.length; i++) {
      const char = String.fromCharCode(0x30A0 + Math.random() * 96);
      ctx.fillText(char, i * 20, drops[i] * 20);
      if (drops[i] * 20 > canvas.height || Math.random() > 0.95) drops[i] = 0;
      drops[i]++;
    }
    requestAnimationFrame(drawMatrix);
  }
  drawMatrix();

  document.getElementById("toggleAnimation").addEventListener("change", e => {
    animationEnabled = !e.target.checked;
    if (animationEnabled) drawMatrix();
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  // Mouse trail (soft glow)
  document.addEventListener('mousemove', e => {
    const p = document.createElement('div');
    p.className = 'pixel-trail';
    p.style.left = `${e.clientX}px`;
    p.style.top = `${e.clientY}px`;
    p.style.position = 'fixed';
    p.style.width = '20px';
    p.style.height = '20px';
    p.style.borderRadius = '50%';
    p.style.background = 'white';
    p.style.filter = 'blur(6px)';
    p.style.opacity = '0.4';
    p.style.pointerEvents = 'none';
    p.style.zIndex = '9999';
    p.style.animation = 'pixel-fade 0.7s forwards ease-out';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 700);
  });

  // Sound Player Controls
  const bgTrack = document.getElementById("bgTrack");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const volumeControl = document.getElementById("volumeControl");
  let isPlaying = false;

  playPauseBtn.addEventListener("click", () => {
    if (isPlaying) {
      bgTrack.pause();
      playPauseBtn.textContent = "▶ LISTEN TO A CURATED TRASHWAVE SET";
    } else {
      bgTrack.play().catch(() => {});
      playPauseBtn.textContent = "⏸ STOP TRASHWAVE SET";
    }
    isPlaying = !isPlaying;
  });

  volumeControl.addEventListener("input", () => {
    bgTrack.volume = volumeControl.value;
  });
});
