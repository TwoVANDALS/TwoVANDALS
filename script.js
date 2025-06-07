// Simple glitch effect on hover (extendable)
document.querySelectorAll('.btn, nav a').forEach(el => {
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'skewX(-5deg)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'none';
  });
});