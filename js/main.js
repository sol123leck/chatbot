/* ============================================
   SHADOW STUDIO — MAIN JS
   Three.js hero + interactions
   ============================================ */

// ─── THREE.JS HERO CANVAS ───────────────────
(function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
  camera.position.z = 30;

  // ── Particle field ──
  const particleCount = 1800;
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];
  const spread = 60;

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3]     = (Math.random() - .5) * spread;
    positions[i * 3 + 1] = (Math.random() - .5) * spread;
    positions[i * 3 + 2] = (Math.random() - .5) * spread;
    velocities.push({
      x: (Math.random() - .5) * .008,
      y: (Math.random() - .5) * .008,
      z: (Math.random() - .5) * .003,
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    size: .15,
    color: 0x9d5fff,
    transparent: true,
    opacity: .6,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  // ── Floating wireframe shapes ──
  const shapes = [];
  const shapeGeometries = [
    new THREE.IcosahedronGeometry(1.5, 0),
    new THREE.OctahedronGeometry(1.8, 0),
    new THREE.TetrahedronGeometry(1.6, 0),
    new THREE.IcosahedronGeometry(1.2, 0),
    new THREE.OctahedronGeometry(1.1, 0),
  ];

  const wireMats = [
    new THREE.MeshBasicMaterial({ color: 0x7c3aed, wireframe: true, opacity: .25, transparent: true }),
    new THREE.MeshBasicMaterial({ color: 0x0ea5e9, wireframe: true, opacity: .2,  transparent: true }),
    new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, opacity: .18, transparent: true }),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, opacity: .2,  transparent: true }),
    new THREE.MeshBasicMaterial({ color: 0x6d28d9, wireframe: true, opacity: .15, transparent: true }),
  ];

  const shapePositions = [
    [-18, 10, -8], [14, -8, -12], [-8, -14, -5], [20, 12, -15], [-15, -5, -10]
  ];

  shapeGeometries.forEach((g, i) => {
    const mesh = new THREE.Mesh(g, wireMats[i]);
    mesh.position.set(...shapePositions[i]);
    mesh.userData = {
      rotSpeed: { x: .003 + Math.random()*.004, y: .004 + Math.random()*.004, z: .002 },
      floatOffset: Math.random() * Math.PI * 2,
      floatSpeed: .3 + Math.random() * .3,
      baseY: shapePositions[i][1],
    };
    scene.add(mesh);
    shapes.push(mesh);
  });

  // ── Mouse parallax ──
  let mouse = { x: 0, y: 0 };
  let targetMouse = { x: 0, y: 0 };

  window.addEventListener('mousemove', e => {
    targetMouse.x = (e.clientX / window.innerWidth  - .5) * 2;
    targetMouse.y = (e.clientY / window.innerHeight - .5) * 2;
  });

  // ── Resize ──
  window.addEventListener('resize', () => {
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // ── Animate ──
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Smooth mouse follow
    mouse.x += (targetMouse.x - mouse.x) * .04;
    mouse.y += (targetMouse.y - mouse.y) * .04;
    camera.position.x = mouse.x * 3;
    camera.position.y = -mouse.y * 2;

    // Animate particles
    const pos = geo.attributes.position;
    for (let i = 0; i < particleCount; i++) {
      pos.array[i * 3]     += velocities[i].x;
      pos.array[i * 3 + 1] += velocities[i].y;
      pos.array[i * 3 + 2] += velocities[i].z;

      // Wrap around
      if (Math.abs(pos.array[i * 3])     > spread / 2) velocities[i].x *= -1;
      if (Math.abs(pos.array[i * 3 + 1]) > spread / 2) velocities[i].y *= -1;
      if (Math.abs(pos.array[i * 3 + 2]) > spread / 2) velocities[i].z *= -1;
    }
    pos.needsUpdate = true;

    // Rotate & float shapes
    shapes.forEach(s => {
      s.rotation.x += s.userData.rotSpeed.x;
      s.rotation.y += s.userData.rotSpeed.y;
      s.rotation.z += s.userData.rotSpeed.z;
      s.position.y = s.userData.baseY + Math.sin(elapsed * s.userData.floatSpeed + s.userData.floatOffset) * 1.5;
    });

    particles.rotation.y += .0003;

    renderer.render(scene, camera);
  }

  animate();
})();

// ─── NAV SCROLL EFFECT ───────────────────────
(function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile burger (basic toggle for nav links)
  const burger = document.getElementById('navBurger');
  const links  = nav.querySelector('.nav__links');
  const cta    = nav.querySelector('.nav__cta');

  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = links.style.display === 'flex';
      links.style.cssText = open ? '' : 'display:flex;flex-direction:column;position:absolute;top:100%;left:0;right:0;background:rgba(7,7,15,.97);padding:1.5rem 2rem;gap:1rem;border-bottom:1px solid rgba(255,255,255,.07)';
      if (cta) cta.style.display = open ? '' : 'none';
    });
  }
})();

// ─── PORTFOLIO FILTER ───────────────────────
(function initPortfolioFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const items      = document.querySelectorAll('.portfolio-item');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      filterBtns.forEach(b => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');

      items.forEach(item => {
        const show = filter === 'all' || item.dataset.category === filter;
        item.classList.toggle('portfolio-item--hidden', !show);
      });
    });
  });
})();

// ─── STATS COUNTER ──────────────────────────
(function initCounters() {
  const nums = document.querySelectorAll('.stat-item__number');
  if (!nums.length) return;

  const countUp = (el, target, duration = 1800) => {
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      el.textContent = Math.floor(progress * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        countUp(el, parseInt(el.dataset.target, 10));
        io.unobserve(el);
      }
    });
  }, { threshold: .5 });

  nums.forEach(n => io.observe(n));
})();

// ─── SCROLL REVEAL ──────────────────────────
(function initReveal() {
  const els = document.querySelectorAll(
    '.service-card, .portfolio-item, .process-step, .audience-card, .stat-item, .section__header'
  );

  els.forEach((el, i) => {
    el.classList.add('reveal');
    if (i % 3 === 1) el.classList.add('reveal-delay-1');
    if (i % 3 === 2) el.classList.add('reveal-delay-2');
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: .12 });

  els.forEach(el => io.observe(el));
})();

// ─── CONTACT FORM ───────────────────────────
(function initForm() {
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    // Simulate submission (wire to backend / Netlify / Formspree as needed)
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Envoi en cours…';
    btn.disabled = true;

    setTimeout(() => {
      form.reset();
      btn.style.display = 'none';
      success.classList.add('visible');
    }, 1200);
  });
})();

// ─── SMOOTH ANCHOR SCROLL ───────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
