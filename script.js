document.addEventListener("DOMContentLoaded", () => {
  initLoader();
  initNavigation();
  initReveal();
  initGlitchText();
  initCursorLight();
  initAshCanvas();
  initTiltCards();
  initFormMock();
});

function initLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;

  window.addEventListener("load", () => {
    setTimeout(() => {
      loader.classList.add("is-hidden");
    }, 900);
  });
}

function initNavigation() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("siteNav");
  const links = nav ? [...nav.querySelectorAll("a")] : [];

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
    });

    links.forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
      });
    });
  }

  const sections = [...document.querySelectorAll("main section[id]")];
  if (!sections.length || !links.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach(link => {
          const active = link.getAttribute("href") === `#${id}`;
          link.classList.toggle("is-active", active);
        });
      });
    },
    {
      rootMargin: "-30% 0px -55% 0px",
      threshold: 0.1
    }
  );

  sections.forEach(section => observer.observe(section));
}

function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14
    }
  );

  items.forEach(item => observer.observe(item));
}

function initGlitchText() {
  const glitchNodes = document.querySelectorAll("[data-glitch]");
  if (!glitchNodes.length) return;

  const chars = "█▓▒░<>/\\\\|!?#$%&*+";
  glitchNodes.forEach(node => {
    const original = node.textContent;

    node.addEventListener("mouseenter", () => {
      if (node.dataset.animating === "1") return;
      node.dataset.animating = "1";

      let frame = 0;
      const max = 14;

      const animate = () => {
        const progress = frame / max;
        const revealCount = Math.floor(original.length * progress);

        node.textContent = original
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < revealCount) return original[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");

        frame += 1;

        if (frame <= max) {
          requestAnimationFrame(animate);
        } else {
          node.textContent = original;
          node.dataset.animating = "0";
        }
      };

      animate();
    });
  });
}

function initCursorLight() {
  const light = document.getElementById("cursorLight");
  if (!light) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;

  window.addEventListener("mousemove", e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animate() {
    currentX += (mouseX - currentX) * 0.08;
    currentY += (mouseY - currentY) * 0.08;
    light.style.left = `${currentX}px`;
    light.style.top = `${currentY}px`;
    requestAnimationFrame(animate);
  }

  animate();
}

function initAshCanvas() {
  const canvas = document.getElementById("ashCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let particles = [];
  let w = 0;
  let h = 0;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;

    particles = Array.from({ length: Math.max(70, Math.floor(w / 18)) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.6 + 0.4,
      s: Math.random() * 0.4 + 0.08,
      drift: (Math.random() - 0.5) * 0.18,
      a: Math.random() * 0.26 + 0.04
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.y += p.s;
      p.x += p.drift;

      if (p.y > h + 4) {
        p.y = -5;
        p.x = Math.random() * w;
      }

      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${p.a})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener("resize", resize);
}

function initTiltCards() {
  const cards = document.querySelectorAll(".tilt-card");
  if (!cards.length) return;

  cards.forEach(card => {
    card.addEventListener("mousemove", e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      const rx = ((y - cy) / cy) * -4;
      const ry = ((x - cx) / cx) * 4;

      card.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

function initFormMock() {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  if (!form || !status) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    status.textContent = "Сигнал принят. Он уже дрожит где-то внутри шума.";
    form.reset();
  });
}
