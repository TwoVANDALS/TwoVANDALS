document.addEventListener('DOMContentLoaded', () => {
  // Glitch Hover
  document.querySelectorAll('.btn, nav a').forEach(el => {
    el.addEventListener('mouseenter', () => el.style.transform = 'skewX(-5deg)');
    el.addEventListener('mouseleave', () => el.style.transform = 'none');
  });

  // Loader
  const loader = document.getElementById("loader");
  if (loader) setTimeout(() => loader.style.display = "none", 2500);

  // Discord Particle Effect
  const trigger = document.getElementById('discordTrigger');
  if (trigger) {
    trigger.addEventListener('click', () => {
      const rect = trigger.getBoundingClientRect();
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
        p.animate([
          { transform: 'translate(0, 0)', opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 }
        ], { duration: 800, easing: 'ease-out' }).onfinish = () => p.remove();
      }

      setTimeout(() => {
        window.open('https://discord.gg/CyzsWeQCZ8', '_blank');
      }, 700);
    });
  }
});
