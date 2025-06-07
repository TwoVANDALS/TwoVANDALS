// Glitch hover
document.querySelectorAll('.btn, nav a').forEach(el => {
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'skewX(-5deg)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'none';
  });
});

// Glitch loader logic
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    setTimeout(() => {
      loader.style.display = "none";
    }, 2500);
  }
});

// 🧨 Discord Particle Explosion
document.getElementById('discord-trigger').addEventListener('click', () => {
  const particles = [];
  const count = 30;
  const origin = document.getElementById('discord-trigger');
  const rect = origin.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    particle.style.position = 'fixed';
    particle.style.left = rect.left + rect.width / 2 + 'px';
    particle.style.top = rect.top + rect.height / 2 + 'px';
    particle.style.width = '5px';
    particle.style.height = '5px';
    particle.style.background = '#0f0';
    particle.style.opacity = 1;
    particle.style.zIndex = 9999;
    document.body.appendChild(particle);
    particles.push(particle);

    const dx = (Math.random() - 0.5) * 200;
    const dy = (Math.random() - 0.5) * 200;

    particle.animate([
      { transform: 'translate(0, 0)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 }
    ], {
      duration: 1000,
      easing: 'ease-out'
    });

    setTimeout(() => particle.remove(), 1000);
  }

  setTimeout(() => {
    window.open('https://discord.gg/CyzsWeQCZ8', '_blank');
  }, 800);
});
