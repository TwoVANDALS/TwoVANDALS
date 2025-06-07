document.addEventListener('DOMContentLoaded', () => {
  // Glitch loader
  const loader = document.getElementById("loader");
  if (loader) setTimeout(() => loader.style.display = "none", 2500);

  // Discord click explosion
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

  // Mouse pixel trail
  document.addEventListener('mousemove', e => {
    const p = document.createElement('div');
    p.classList.add('pixel-trail');
    p.style.left = `${e.clientX}px`;
    p.style.top = `${e.clientY}px`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 800);
  });
});
