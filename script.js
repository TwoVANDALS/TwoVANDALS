document.addEventListener('DOMContentLoaded', () => {
  // Loader
  const loader = document.getElementById("loader");
  if (loader) setTimeout(() => loader.style.display = "none", 2000);

  // Pixel trail
  document.addEventListener('mousemove', e => {
    const p = document.createElement('div');
    p.classList.add('pixel-trail');
    p.style.left = `${e.clientX}px`;
    p.style.top = `${e.clientY}px`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 800);
  });

  // Discord explosion
  const trigger = document.getElementById('discordTrigger');
  if (trigger) {
    trigger.addEventListener('click', () => {
      const rect = trigger.getBoundingClientRect();
      for (let i = 0; i < 30; i++) {
        const el = document.createElement('div');
        el.style.position = 'fixed';
        el.style.width = '6px';
        el.style.height = '6px';
        el.style.background = 'white';
        el.style.left = `${rect.left + rect.width / 2}px`;
        el.style.top = `${rect.top + rect.height / 2}px`;
        el.style.zIndex = 9999;
        document.body.appendChild(el);

        const dx = (Math.random() - 0.5) * 300;
        const dy = (Math.random() - 0.5) * 300;
        el.animate([
          { transform: 'translate(0, 0)', opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 }
        ], { duration: 1000, easing: 'ease-out' }).onfinish = () => el.remove();
      }
      setTimeout(() => {
        window.open('https://discord.gg/CyzsWeQCZ8', '_blank');
      }, 600);
    });
  }
});
