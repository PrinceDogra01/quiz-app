/*
  Space Cadet Quiz – Interactions & Effects
  - Canvas starfield renderer (parallax layers)
  - Form validation + launch animation
  - Optional background ambience toggle (graceful fallback)
*/

(function () {
  "use strict";

  const canvas = document.getElementById("starfield");
  const ctx = canvas.getContext("2d", { alpha: true });
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  let stars = [];
  let width = 0;
  let height = 0;
  const layers = [
    { speed: 0.02, countFactor: 0.25, size: [0.6, 1.1], color: "rgba(255,255,255,0.75)" },
    { speed: 0.05, countFactor: 0.45, size: [0.8, 1.6], color: "rgba(185,240,255,0.85)" },
    { speed: 0.09, countFactor: 0.30, size: [1.0, 2.2], color: "rgba(94,231,255,0.95)" }
  ];

  function resizeCanvas() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    generateStars();
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function generateStars() {
    const area = width * height;
    stars = [];
    layers.forEach((layer, i) => {
      const count = Math.max(40, Math.floor(area / 9000 * layer.countFactor));
      for (let s = 0; s < count; s++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: i, // layer index
          r: rand(layer.size[0], layer.size[1]),
          twinkle: Math.random() * Math.PI * 2,
        });
      }
    });
  }

  let lastTime = 0;
  function tick(ts) {
    const dt = Math.min(32, ts - lastTime) || 16; // clamp delta
    lastTime = ts;

    ctx.clearRect(0, 0, width, height);

    // draw stars by layer
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const layer = layers[s.z];
      // motion downward (towards bottom-right a bit)
      s.y += layer.speed * dt * 0.6;
      s.x += layer.speed * dt * 0.15;
      if (s.y > height + 2) s.y = -2;
      if (s.x > width + 2) s.x = -2;

      const tw = (Math.sin(s.twinkle + ts * 0.002) + 1) * 0.5; // 0..1
      const baseAlpha = 0.4 + 0.6 * tw;

      ctx.beginPath();
      ctx.fillStyle = layer.color.replace(/0\.[0-9]+\)/, baseAlpha.toFixed(2) + ")");
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  // Resize handling
  const ro = new ResizeObserver(resizeCanvas);
  ro.observe(canvas);
  resizeCanvas();
  requestAnimationFrame(tick);

  // Form interactions
  const form = document.getElementById("loginForm");
  const startBtn = document.getElementById("startBtn");

  function validateForm() {
    if (!form) return false;
    const name = form.elements.namedItem("name");
    const email = form.elements.namedItem("email");
    const age = form.elements.namedItem("age");
    const gender = form.elements.namedItem("gender");
    const nameOk = name && name.value && String(name.value).trim().length >= 2;
    const emailVal = email && String(email.value).trim();
    const emailOk = !!(emailVal && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal));
    const ageVal = age && Number(age.value);
    const ageOk = Number.isFinite(ageVal) && ageVal >= 1 && ageVal <= 120;
    const genderOk = gender && gender.value && gender.value !== "";
    return !!(nameOk && emailOk && ageOk && genderOk);
  }

  function addTempError(el) {
    if (!el) return;
    el.style.borderColor = "rgba(255, 107, 107, 0.75)";
    el.style.boxShadow = "0 0 0 4px rgba(255, 107, 107, 0.15)";
    setTimeout(() => {
      el.style.borderColor = "";
      el.style.boxShadow = "";
    }, 800);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm()) {
      addTempError(form.querySelector("#playerName"));
      addTempError(form.querySelector("#playerEmail"));
      addTempError(form.querySelector("#playerAge"));
      addTempError(form.querySelector("#playerGender"));
      return;
    }

    // Launch sequence
    document.body.classList.add("launching");
    startBtn.disabled = true;

    // small delay, then warp pulse
    setTimeout(() => {
      document.body.classList.add("warp");
    }, 400);

    // After animation, hand off to quiz flow
    setTimeout(() => {
      try {
        if (typeof goToGreeting === "function") {
          goToGreeting();
        }
      } finally {
        document.body.classList.remove("warp", "launching");
        startBtn.disabled = false;
      }
    }, 1200);
  });

  // (Music controls removed per user request)
})();


