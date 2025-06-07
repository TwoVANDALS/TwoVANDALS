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
