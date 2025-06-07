// Hover Glitch FX
document.querySelectorAll('.btn, nav a').forEach(el => {
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'skewX(-5deg)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'none';
  });
});

// Loader
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    setTimeout(() => {
      loader.style.display = "none";
    }, 2500);
  }
});

// Discord Explosion Trigger
document.getElementById('discordTrigger').addEventListener('click', () => {
  const origin = document.getElementById('discordTrigger');
  const rect = origin.getBoundingClientRect();

  for (let i = 0; i < 50; i++) {
    const p = document.createElement('div');
    p.style.position = 'fixed';
    p.style.width = '6px';
    p.style.height = '6px';
    p.style.background = 'lime';
    p.style.left = rect.left + rect.width / 2 + 'px';
    p.style.top = rect.top + rect.height / 2 + 'px';
    p.style.zIndex = 10000;
    document.body.appendChild(p);

    const dx = (Math.random() - 0.5) * 400;
    const dy = (Math.random() - 0.5) * 400;
    const anim = p.animate([
      { transform: 'translate(0, 0)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 }
    ], {
      duration: 800,
      easing: 'ease-out'
    });
    anim.onfinish = () => p.remove();
  }

  setTimeout(() => {
    window.open('https://discord.gg/CyzsWeQCZ8', '_blank');
  }, 700);
});
