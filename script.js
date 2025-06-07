document.addEventListener("DOMContentLoaded", () => {
  // PARTICLE EXPLOSION ON CLICK
  const canvas = document.getElementById("particle-canvas");
  const ctx = canvas.getContext("2d");
  resizeCanvas();

  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);

  document.body.addEventListener("click", (e) => {
    if (e.target.closest('a, button, nav')) return;
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        alpha: 1,
        size: 4 + Math.random() * 4
      });
    }
  });

  function updateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.alpha > 0);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.02;
      ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(updateParticles);
  }
  updateParticles();
});
