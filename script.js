const opening = document.getElementById('opening');
const openBtn = document.getElementById('openInvitation');
const site = document.getElementById('site');
const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');
const venueSpinner = document.getElementById('venueSpinner');

const wishForm = document.getElementById('wishForm');
const wishesEl = document.getElementById('wishes');
const nameEl = document.getElementById('guestName');
const wishEl = document.getElementById('guestWish');
const wishSubmit = document.getElementById('wishSubmit');
const wishStatus = document.getElementById('wishStatus');
const wishPrev = document.getElementById('wishPrev');
const wishNext = document.getElementById('wishNext');
const wishDots = document.getElementById('wishDots');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.body.classList.add('locked');
window.scrollTo(0, 0);

/* =============================
   MUSIC
   Drop your own song at assets/song.mp3
   ============================= */
let musicAvailable = true;
bgMusic.volume = 0;
const MUSIC_TARGET_VOLUME = 0.46;
let musicFadeRaf = null;

function setMusicUI(playing) {
  musicToggle.classList.toggle('is-playing', playing);
  musicToggle.setAttribute('aria-label', playing ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى');
  musicToggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
}

function fadeMusicTo(target, duration = 900, onDone) {
  if (musicFadeRaf) cancelAnimationFrame(musicFadeRaf);
  const startVolume = bgMusic.volume;
  const startedAt = performance.now();

  function step(now) {
    const t = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    bgMusic.volume = Math.max(0, Math.min(1, startVolume + (target - startVolume) * eased));
    if (t < 1) musicFadeRaf = requestAnimationFrame(step);
    else {
      musicFadeRaf = null;
      if (onDone) onDone();
    }
  }
  musicFadeRaf = requestAnimationFrame(step);
}

async function playMusic() {
  if (!musicAvailable) return;
  try {
    if (bgMusic.paused) bgMusic.volume = 0;
    await bgMusic.play();
    setMusicUI(true);
    fadeMusicTo(MUSIC_TARGET_VOLUME, 1200);
  } catch (_) {
    setMusicUI(false);
  }
}

function pauseMusic() {
  fadeMusicTo(0, 360, () => {
    bgMusic.pause();
    setMusicUI(false);
  });
}

bgMusic.addEventListener('error', () => {
  musicAvailable = false;
  setMusicUI(false);
  musicToggle.hidden = true;
});

musicToggle.addEventListener('click', async () => {
  pauseAutoScroll(2200);
  if (!musicAvailable) return;
  if (bgMusic.paused) await playMusic();
  else pauseMusic();
});

/* =============================
   OPENING
   Full-screen image splits up/down, then disappears.
   ============================= */
openBtn.addEventListener('click', () => {
  if (opening.classList.contains('is-opening')) return;

  site.setAttribute('aria-hidden', 'false');
  musicToggle.hidden = false;
  playMusic();
  opening.classList.add('is-opening');

  window.setTimeout(() => {
    opening.classList.add('is-hidden');
    document.body.classList.remove('locked');
    window.scrollTo(0, 0);
    revealVisible();

    if (!prefersReducedMotion) {
      window.setTimeout(startAutoScroll, 1050);
    }
  }, 1360);
});

/* =============================
   REVEAL SECTIONS
   ============================= */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('in-view');
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

function revealVisible() {
  document.querySelectorAll('.reveal').forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < innerHeight * 0.94) el.classList.add('in-view');
  });
}

/* =============================
   SCROLL-LINKED 360° VENUE ORNAMENT
   ============================= */
let decorTicking = false;
function updateScrollDecoration() {
  if (venueSpinner) {
    const rotation = (window.scrollY * 0.23) % 360;
    venueSpinner.style.transform = `rotate(${rotation}deg)`;
  }


  decorTicking = false;
}
window.addEventListener('scroll', () => {
  if (!decorTicking) {
    decorTicking = true;
    requestAnimationFrame(updateScrollDecoration);
  }
}, { passive: true });

/* =============================
   LOOPING AUTO-SCROLL
   Down slowly -> short hold -> smooth return to top -> repeat forever.
   Manual touch/wheel pauses it temporarily, then it resumes by itself.
   ============================= */
let autoStarted = false;
let autoRunning = false;
let autoRaf = null;
let lastFrame = null;
let phase = 'down';
let holdUntil = 0;
let pauseUntil = 0;
let returnStartY = 0;
let returnStartAt = 0;
let returnDuration = 2500;

const AUTO_SCROLL_SPEED_DESKTOP = 38; // px/sec
const AUTO_SCROLL_SPEED_MOBILE = 30;  // px/sec
const BOTTOM_HOLD_MS = 900;
const TOP_HOLD_MS = 750;
const MANUAL_PAUSE_MS = 3200;

function startAutoScroll() {
  if (prefersReducedMotion) return;
  autoStarted = true;
  if (autoRunning) return;
  autoRunning = true;
  lastFrame = null;
  autoRaf = requestAnimationFrame(autoScrollStep);
}

function pauseAutoScroll(duration = MANUAL_PAUSE_MS) {
  if (!autoStarted) return;
  pauseUntil = Math.max(pauseUntil, performance.now() + duration);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function autoScrollStep(timestamp) {
  if (!autoRunning) return;
  if (lastFrame === null) lastFrame = timestamp;
  const dt = Math.min((timestamp - lastFrame) / 1000, 0.05);
  lastFrame = timestamp;

  if (timestamp < pauseUntil) {
    autoRaf = requestAnimationFrame(autoScrollStep);
    return;
  }

  const doc = document.documentElement;
  const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);

  if (phase === 'down') {
    if (window.scrollY >= maxScroll - 2) {
      phase = 'hold-bottom';
      holdUntil = timestamp + BOTTOM_HOLD_MS;
    } else {
      const speed = window.innerWidth <= 700 ? AUTO_SCROLL_SPEED_MOBILE : AUTO_SCROLL_SPEED_DESKTOP;
      window.scrollBy(0, Math.min(speed * dt, maxScroll - window.scrollY));
    }
  } else if (phase === 'hold-bottom') {
    if (timestamp >= holdUntil) {
      phase = 'return-top';
      returnStartY = window.scrollY;
      returnStartAt = timestamp;
      returnDuration = Math.min(3600, Math.max(2200, returnStartY * 0.55));
    }
  } else if (phase === 'return-top') {
    const t = Math.min(1, (timestamp - returnStartAt) / returnDuration);
    const eased = easeInOutCubic(t);
    window.scrollTo(0, returnStartY * (1 - eased));
    if (t >= 1) {
      window.scrollTo(0, 0);
      phase = 'hold-top';
      holdUntil = timestamp + TOP_HOLD_MS;
    }
  } else if (phase === 'hold-top') {
    if (timestamp >= holdUntil) phase = 'down';
  }

  autoRaf = requestAnimationFrame(autoScrollStep);
}

function userInteracted(event) {
  if (opening && !opening.classList.contains('is-hidden')) return;
  pauseAutoScroll(MANUAL_PAUSE_MS);
  // After any manual interaction, resume the normal downward auto-scroll
  // from the user's current position once the short pause finishes.
  phase = 'down';
}

window.addEventListener('wheel', userInteracted, { passive: true });
window.addEventListener('touchstart', userInteracted, { passive: true });
window.addEventListener('pointerdown', userInteracted, { passive: true });
window.addEventListener('keydown', (event) => {
  if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)) userInteracted(event);
});

[nameEl, wishEl].forEach((field) => {
  field.addEventListener('focus', () => pauseAutoScroll(9000));
  field.addEventListener('blur', () => pauseAutoScroll(2200));
});

/* =============================
   GUEST BOOK — Neon + Vercel API
   ============================= */
let sharedWishes = [];
let activeWishIndex = 0;
let wishSliderTimer = null;
const WISH_SLIDE_MS = 4800;

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;' })[char]);
}

function formatWishDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ar-EG', { day:'numeric', month:'short' });
}

function setWishStatus(message = '', type = '') {
  wishStatus.textContent = message;
  wishStatus.className = `wish-status${type ? ` is-${type}` : ''}`;
}

function stopWishSlider() {
  if (wishSliderTimer) clearInterval(wishSliderTimer);
  wishSliderTimer = null;
}

function startWishSlider() {
  stopWishSlider();
  if (sharedWishes.length <= 1 || prefersReducedMotion) return;
  wishSliderTimer = setInterval(() => showWish(activeWishIndex + 1), WISH_SLIDE_MS);
}

function showWish(index) {
  if (!sharedWishes.length) return;
  activeWishIndex = (index + sharedWishes.length) % sharedWishes.length;
  const cards = [...wishesEl.querySelectorAll('.wish')];
  cards.forEach((card, i) => {
    card.classList.toggle('is-active', i === activeWishIndex);
    card.classList.toggle('is-before', i < activeWishIndex);
  });
  [...wishDots.children].forEach((dot, i) => dot.classList.toggle('is-active', i === activeWishIndex));
}

function renderWishes(items) {
  sharedWishes = Array.isArray(items) ? items : [];
  activeWishIndex = Math.min(activeWishIndex, Math.max(0, sharedWishes.length - 1));
  if (!sharedWishes.length) {
    wishesEl.innerHTML = '<div class="empty-wishes">لسه مفيش تهاني… خلي تهنئتك أول واحدة 🤍</div>';
    wishDots.innerHTML = '';
    stopWishSlider();
    return;
  }
  wishesEl.innerHTML = sharedWishes.map((item, i) => `
    <article class="wish${i === activeWishIndex ? ' is-active' : ''}" data-index="${i}">
      <div class="wish__head"><strong>${escapeHTML(item.name)}</strong><time>${formatWishDate(item.created_at)}</time></div>
      <p>${escapeHTML(item.message)}</p>
    </article>`).join('');
  wishDots.innerHTML = sharedWishes.map((_, i) => `<button class="wish-dot${i === activeWishIndex ? ' is-active' : ''}" type="button" data-index="${i}" tabindex="-1"></button>`).join('');
  startWishSlider();
}

async function loadWishes() {
  wishesEl.innerHTML = '<div class="wishes-loading">بنحمّل تهاني الناس… 🤍</div>';
  try {
    const response = await fetch('/api/wishes', { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw new Error('load failed');
    const data = await response.json();
    renderWishes(data.wishes || []);
  } catch (error) {
    wishesEl.innerHTML = '<div class="empty-wishes">التهاني هتظهر هنا بعد ربط Neon ورفع الموقع على Vercel 🤍</div>';
    wishDots.innerHTML = '';
  }
}

wishPrev.addEventListener('click', () => { pauseAutoScroll(3500); showWish(activeWishIndex - 1); startWishSlider(); });
wishNext.addEventListener('click', () => { pauseAutoScroll(3500); showWish(activeWishIndex + 1); startWishSlider(); });
wishDots.addEventListener('click', (event) => {
  const dot = event.target.closest('.wish-dot');
  if (!dot) return;
  showWish(Number(dot.dataset.index));
  startWishSlider();
});

wishForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  pauseAutoScroll(8000);
  const name = nameEl.value.trim();
  const message = wishEl.value.trim();
  if (!name || !message) return;

  wishSubmit.disabled = true;
  wishSubmit.textContent = 'بنحفظ تهنئتك…';
  setWishStatus('');
  try {
    const response = await fetch('/api/wishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ name, message })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'save failed');
    wishForm.reset();
    setWishStatus('اتحفظت تهنئتك وهتظهر لكل الناس ❤️', 'success');
    await loadWishes();
    activeWishIndex = 0;
    showWish(0);
  } catch (error) {
    setWishStatus('حصلت مشكلة في الحفظ. جرّب تاني بعد ما تتأكد من ربط Neon.', 'error');
  } finally {
    wishSubmit.disabled = false;
    wishSubmit.textContent = 'احفظ التهنئة';
  }
});

loadWishes();
updateScrollDecoration();

/* =============================
   CONTEXT-AWARE FALLING HEARTS — V15
   Light sections  => burgundy/red hearts
   Dark sections   => warm white hearts
   ============================= */
const heartRain = document.getElementById('heartRain');
let heartTimer = null;
let currentHeartTone = 'dark';

function getHeartTone() {
  const x = Math.max(1, Math.min(window.innerWidth - 1, window.innerWidth * 0.5));
  const y = Math.max(1, Math.min(window.innerHeight - 1, window.innerHeight * 0.44));
  const probe = document.elementFromPoint(x, y);
  if (probe?.closest?.('.story, .quote, .guestbook')) return 'light';
  if (probe?.closest?.('.invitation-section, .details, .footer')) return 'dark';
  return currentHeartTone || 'dark';
}

function updateHeartZone() {
  currentHeartTone = getHeartTone();
  document.body.classList.add('hearts-active');
  document.body.classList.toggle('hearts-on-light', currentHeartTone === 'light');
  document.body.classList.toggle('hearts-on-dark', currentHeartTone === 'dark');
}

function spawnHeart() {
  if (!heartRain || prefersReducedMotion || document.hidden || !document.body.classList.contains('hearts-active')) return;

  const heart = document.createElement('span');
  const outline = Math.random() > 0.50;
  heart.className = `falling-heart${outline ? ' is-outline' : ''}`;
  heart.textContent = outline ? '♡' : '♥';

  const size = 12 + Math.random() * 14;
  const duration = 7.4 + Math.random() * 4.2;
  const drift = -72 + Math.random() * 144;
  const spin = -240 + Math.random() * 480;
  const opacity = 0.52 + Math.random() * 0.31;

  heart.style.left = `${2 + Math.random() * 96}%`;
  heart.style.fontSize = `${size}px`;
  heart.style.setProperty('--heart-size', `${size}px`);
  heart.style.setProperty('--heart-duration', `${duration}s`);
  heart.style.setProperty('--heart-drift', `${drift}px`);
  heart.style.setProperty('--heart-spin', `${spin}deg`);
  heart.style.setProperty('--heart-opacity', opacity.toFixed(2));
  heartRain.appendChild(heart);

  window.setTimeout(() => heart.remove(), (duration + 0.9) * 1000);
}

function startHeartRain() {
  if (prefersReducedMotion || heartTimer) return;
  updateHeartZone();
  for (let i = 0; i < 7; i++) window.setTimeout(spawnHeart, i * 210);
  heartTimer = window.setInterval(spawnHeart, 390);
}

let heartZoneRaf = 0;
function scheduleHeartZoneUpdate() {
  if (heartZoneRaf) return;
  heartZoneRaf = requestAnimationFrame(() => {
    heartZoneRaf = 0;
    updateHeartZone();
  });
}

window.addEventListener('scroll', scheduleHeartZoneUpdate, { passive: true });
window.addEventListener('resize', scheduleHeartZoneUpdate);

// Begin after the invitation opens, then keep running across all sections.
openBtn.addEventListener('click', () => {
  window.setTimeout(() => {
    document.body.classList.add('hearts-active');
    updateHeartZone();
    startHeartRain();
  }, 760);
}, { once: true });
