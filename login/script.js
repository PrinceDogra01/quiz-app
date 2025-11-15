/* Particle background + interactions */
(function() {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  let particles = [];
  const PARTICLE_COUNT = Math.min(110, Math.floor((width * height) / 16000));
  const MOUSE_RADIUS = 120;

  const mouse = { x: -9999, y: -9999 };

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function createParticle() {
    const speed = rand(0.2, 0.7);
    return {
      x: rand(0, width),
      y: rand(0, height),
      vx: rand(-speed, speed),
      vy: rand(-speed, speed),
      r: rand(1.2, 2.2),
      a: rand(0.15, 0.45)
    };
  }

  function init() {
    particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    init();
  }

  function update() {
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;

      // Wrap around
      if (p.x < -10) p.x = width + 10; else if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10; else if (p.y > height + 10) p.y = -10;

      // Mouse repulsion
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist2 = dx*dx + dy*dy;
      const r2 = MOUSE_RADIUS * MOUSE_RADIUS;
      if (dist2 < r2) {
        const force = (r2 - dist2) / r2;
        const angle = Math.atan2(dy, dx);
        p.vx += Math.cos(angle) * force * 0.08;
        p.vy += Math.sin(angle) * force * 0.08;
      }

      // gentle noise
      p.vx *= 0.995; p.vy *= 0.995;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // backdrop gradient glow
    const g = ctx.createRadialGradient(width*0.7, height*0.2, 0, width*0.7, height*0.2, Math.max(width, height)*0.8);
    g.addColorStop(0, 'rgba(110,168,254,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    // draw particles
    ctx.globalCompositeOperation = 'lighter';
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(125, 211, 252, ${p.a})`;
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // draw lines between nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i], p2 = particles[j];
        const dx = p1.x - p2.x; const dy = p1.y - p2.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < 110*110) {
          const alpha = 1 - d2 / (110*110);
          ctx.strokeStyle = `rgba(96, 165, 250, ${alpha * 0.12})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  init();
  loop();
})();

/* Form interactions */
(function() {
  const form = document.getElementById('login-form');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const statusEl = document.getElementById('form-status');
  const button = document.getElementById('login-btn');

  // Simple parallax tilt on card
  const card = document.querySelector('.auth-card');
  let rafId = null;
  function handleMove(e) {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0..1
    const y = (e.clientY - rect.top) / rect.height;
    const rx = (y - 0.5) * 6; // tilt
    const ry = (0.5 - x) * 6;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
  }
  function resetTilt() { card.style.transform = 'perspective(900px) rotateX(0) rotateY(0)'; }
  card.addEventListener('mousemove', handleMove);
  card.addEventListener('mouseleave', resetTilt);

  function setStatus(msg, ok = true) {
    statusEl.textContent = msg;
    statusEl.className = ok ? 'sr-only' : '';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('');

    const data = {
      email: email.value.trim(),
      password: password.value
    };

    if (!data.email || !data.password) {
      setStatus('Please enter email and password', false);
      return;
    }

    button.disabled = true;
    button.style.filter = 'brightness(0.95)';

    // fake request
    await new Promise(r => setTimeout(r, 900));

    // demo success
    setStatus('Logged in successfully');
    button.disabled = false;
    button.style.filter = '';

    // subtle success animation
    button.animate([
      { transform: 'translateY(0)' },
      { transform: 'translateY(-2px)' },
      { transform: 'translateY(0)' }
    ], { duration: 300, easing: 'ease-out' });
  });
})();
