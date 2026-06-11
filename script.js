/* ─────────────────────────────────────────────
   script.js — sky canvas, interactions, easter eggs
───────────────────────────────────────────── */

// ═══════════════════════════════════════════
// 1. SKY CANVAS — animated clouds & contrails
// ═══════════════════════════════════════════
const canvas  = document.getElementById('skyCanvas');
const ctx     = canvas.getContext('2d');
let W, H;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// ── Gradient sky background ──────────────────
function drawSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   '#c8e6f5');
  grad.addColorStop(0.5, '#eaf4fb');
  grad.addColorStop(1,   '#f5fbff');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// ── Clouds ────────────────────────────────────
class Cloud {
  constructor() { this.reset(true); }

  reset(initial = false) {
    this.x      = initial ? Math.random() * W : -320;
    this.y      = Math.random() * H * 0.55 + 20;
    this.speed  = 0.12 + Math.random() * 0.18;
    this.scale  = 0.5 + Math.random() * 0.9;
    this.alpha  = 0.25 + Math.random() * 0.30;
    this.puffs  = this._buildPuffs();
  }

  _buildPuffs() {
    const n = 3 + Math.floor(Math.random() * 4);
    return Array.from({ length: n }, (_, i) => ({
      ox: i * 38 * this.scale,
      oy: (Math.random() - 0.5) * 18 * this.scale,
      r:  (22 + Math.random() * 22) * this.scale,
    }));
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle   = '#ffffff';
    ctx.shadowColor = 'rgba(123,191,221,0.25)';
    ctx.shadowBlur  = 18;
    this.puffs.forEach(p => {
      ctx.beginPath();
      ctx.arc(this.x + p.ox, this.y + p.oy, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  update() {
    this.x += this.speed;
    const maxX = W + 400;
    if (this.x > maxX) this.reset();
  }
}

// ── Contrails ─────────────────────────────────
class Contrail {
  constructor() { this.reset(true); }

  reset(initial = false) {
    // Start off-screen left, or randomly if initial
    this.startX  = initial ? Math.random() * W : -60;
    this.startY  = Math.random() * H * 0.5 + 10;

    // Slight angle — mostly horizontal, gently sloped
    const angle  = (Math.random() - 0.5) * 0.18;
    this.dx      = Math.cos(angle);
    this.dy      = Math.sin(angle);

    this.speed   = 0.6 + Math.random() * 0.8;
    this.maxLen  = W * (0.4 + Math.random() * 0.55);
    this.drawn   = initial ? Math.random() * this.maxLen : 0;
    this.width   = 1.5 + Math.random() * 2;
    this.alpha   = 0.18 + Math.random() * 0.22;
    this.done    = false;
    this.fade    = 0;       // fade-out phase counter
  }

  draw() {
    if (this.drawn <= 0) return;
    const tail  = Math.max(0, this.drawn - this.maxLen * 0.7);
    const ex    = this.startX + this.dx * this.drawn;
    const ey    = this.startY + this.dy * this.drawn;
    const tx    = this.startX + this.dx * tail;
    const ty    = this.startY + this.dy * tail;

    const grad  = ctx.createLinearGradient(tx, ty, ex, ey);
    const a     = this.alpha * (1 - this.fade / 180);
    grad.addColorStop(0,   `rgba(255,255,255,0)`);
    grad.addColorStop(0.3, `rgba(255,255,255,${a * 0.5})`);
    grad.addColorStop(1,   `rgba(255,255,255,${a})`);

    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth   = this.width;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.restore();
  }

  update() {
    if (!this.done) {
      this.drawn += this.speed;
      if (this.drawn >= this.maxLen) this.done = true;
    } else {
      this.fade++;
      if (this.fade > 180) this.reset();
    }
    // Also reset if contrail's head left the canvas
    const hx = this.startX + this.dx * this.drawn;
    if (hx > W + 80) { this.reset(); }
  }
}

// ── Initialise objects ─────────────────────────
const clouds   = Array.from({ length: 7  }, () => new Cloud());
const contrails = Array.from({ length: 5 }, () => new Contrail());

// ── Animation loop ─────────────────────────────
function animate() {
  ctx.clearRect(0, 0, W, H);
  drawSky();
  clouds.forEach(c   => { c.update(); c.draw(); });
  contrails.forEach(c => { c.update(); c.draw(); });
  requestAnimationFrame(animate);
}
animate();


// ═══════════════════════════════════════════
// 2. PHOTO STRIP — smooth infinite scroll
// ═══════════════════════════════════════════
(function () {
  const track = document.getElementById('stripTrack');
  if (!track) return;

  // Duplicate items so the loop is seamless
  const origItems = Array.from(track.children);
  origItems.forEach(item => track.appendChild(item.cloneNode(true)));

  const speed   = 0.55;   // px per frame
  let   pos     = 0;
  let   paused  = false;
  const halfW   = () => track.scrollWidth / 2;

  track.addEventListener('mouseenter', () => paused = true);
  track.addEventListener('mouseleave', () => paused = false);

  function tickStrip() {
    if (!paused) {
      pos -= speed;
      if (Math.abs(pos) >= halfW()) pos = 0;   // seamless reset
      track.style.setProperty('--strip-x', pos + 'px');
    }
    requestAnimationFrame(tickStrip);
  }
  requestAnimationFrame(tickStrip);
}());


// ═══════════════════════════════════════════
// LIGHTBOX
// ═══════════════════════════════════════════
(function () {
  const lb        = document.getElementById('lightbox');
  const lbImg     = document.getElementById('lbImg');
  const lbCaption = document.getElementById('lbCaption');
  const lbClose   = document.getElementById('lbClose');
  const lbPrev    = document.getElementById('lbPrev');
  const lbNext    = document.getElementById('lbNext');
  if (!lb) return;

  // Collect unique originals (first half of the duplicated strip)
  let items = [];
  let current = 0;

  function buildItems() {
    const all = document.querySelectorAll('.strip-item img');
    const half = Math.floor(all.length / 2);   // skip clones
    items = Array.from(all).slice(0, half);
  }

  function open(index) {
    current = ((index % items.length) + items.length) % items.length;
    const img = items[current];
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCaption.textContent = img.closest('.strip-item').querySelector('.strip-caption').textContent;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Attach click to strip items (works on originals + clones)
  document.getElementById('stripTrack').addEventListener('click', e => {
    const item = e.target.closest('.strip-item');
    if (!item) return;
    buildItems();
    // find which original this corresponds to
    const allItems = document.querySelectorAll('.strip-item img');
    const half = Math.floor(allItems.length / 2);
    const clickedImg = item.querySelector('img');
    const allArr = Array.from(allItems);
    let idx = allArr.indexOf(clickedImg);
    if (idx >= half) idx -= half;   // map clone back to original
    open(idx);
  });

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', () => open(current - 1));
  lbNext.addEventListener('click', () => open(current + 1));

  // Click backdrop to close
  lb.addEventListener('click', e => { if (e.target === lb) close(); });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'ArrowRight') open(current + 1);
    if (e.key === 'ArrowLeft')  open(current - 1);
    if (e.key === 'Escape')     close();
  });
}());



// ═══════════════════════════════════════════
// UPDATES CAROUSEL
// ═══════════════════════════════════════════
(function () {
  const track   = document.getElementById('updatesTrack');
  const prevBtn = document.getElementById('updatesPrev');
  const nextBtn = document.getElementById('updatesNext');
  const dots    = document.querySelectorAll('.carousel-dot');
  if (!track || !prevBtn || !nextBtn) return;

  const pages = track.querySelectorAll('.updates-carousel-page').length;
  let current = 0;

  function go(n) {
    current = Math.max(0, Math.min(n, pages - 1));
    track.style.transform = `translateX(-${current * 100}%)`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === pages - 1;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  prevBtn.addEventListener('click', () => go(current - 1));
  nextBtn.addEventListener('click', () => go(current + 1));
  go(0);
}());

// ═══════════════════════════════════════════
// 2. NAVBAR scroll behaviour
// ═══════════════════════════════════════════
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});


// ═══════════════════════════════════════════
// 3. SCROLL-IN ANIMATIONS (Intersection Observer)
// ═══════════════════════════════════════════
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el    = entry.target;
      const delay = el.dataset.delay ? parseInt(el.dataset.delay) : 0;
      setTimeout(() => el.classList.add('visible'), delay);
      observer.unobserve(el);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.card, .timeline-item, .update-card').forEach(el => observer.observe(el));


// ═══════════════════════════════════════════
// 4b. TIMELINE TOGGLE
// ═══════════════════════════════════════════
const timelineEl     = document.getElementById('timeline');
const timelineToggle = document.getElementById('timelineToggle');
const timelineClose  = document.getElementById('timelineClose');

function showTimeline() {
  timelineEl.classList.remove('hidden');
  timelineToggle.classList.add('hidden');
}
function hideTimeline() {
  timelineEl.classList.add('hidden');
  timelineToggle.classList.remove('hidden');
}

if (timelineToggle) timelineToggle.addEventListener('click', showTimeline);
if (timelineClose)  timelineClose.addEventListener('click', hideTimeline);


// ═══════════════════════════════════════════
// 4. JOURNEY MAP (Leaflet)
// ═══════════════════════════════════════════
if (document.getElementById('journeyMap') && typeof L !== 'undefined') {

const map = L.map('journeyMap', {
  zoomControl: true,
  scrollWheelZoom: false,
});

// Soft, desaturated tile layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19,
}).addTo(map);

// Custom contrail-style marker
function makeMarker(active, current) {
  if (current) {
    return L.divIcon({
      className: 'marker-current',
      html: `<div class="marker-pulse"></div>`,
      iconAnchor: [10, 10],
    });
  }
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${active ? 14 : 10}px;
      height:${active ? 14 : 10}px;
      border-radius:50%;
      background:${active ? '#4a9abe' : '#7bbfdd'};
      border:2px solid #ffffff;
      box-shadow:0 0 0 3px rgba(74,154,190,0.25);
    "></div>`,
    iconAnchor: [active ? 7 : 5, active ? 7 : 5],
  });
}

// Place markers and connect them with a polyline
const timelineItems = document.querySelectorAll('.timeline-item');
const coords = [];

timelineItems.forEach((item, i) => {
  const lat    = parseFloat(item.dataset.lat);
  const lng    = parseFloat(item.dataset.lng);
  const zoom   = parseInt(item.dataset.zoom);
  const active  = item.classList.contains('active');
  const current = i === timelineItems.length - 1;

  coords.push([lat, lng]);

  const marker = L.marker([lat, lng], { icon: makeMarker(active, current) }).addTo(map);
  const titleEl = item.querySelector('h4');
  if (titleEl) marker.bindTooltip(titleEl.textContent, { direction: 'top', offset: [0, -8] });

  // Click timeline → fly map
  item.addEventListener('click', () => {
    timelineItems.forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    map.flyTo([lat, lng], zoom, { duration: 1.4 });
  });

  // Click marker → highlight timeline
  marker.on('click', () => {
    timelineItems.forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
});

// Deduplicate coords for the polyline (avoid zero-length segments)
const uniqueCoords = coords.filter((c, i) =>
  i === 0 || c[0] !== coords[i-1][0] || c[1] !== coords[i-1][1]
);

L.polyline(uniqueCoords, {
  color: '#7bbfdd',
  weight: 1.5,
  opacity: 0.6,
  dashArray: '6, 8',
}).addTo(map);

// Initial view — Europe/Atlantic to show the journey arc
map.setView([50, 0], 3);

} // end journeyMap guard


// ═══════════════════════════════════════════
// 5. EASTER EGG — type "contrail"
// ═══════════════════════════════════════════

// Create overlay element
const eggEl = document.createElement('div');
eggEl.id = 'easterEgg';
eggEl.innerHTML = `
  <div class="egg-content">
    <div style="font-size:3rem;margin-bottom:0.8rem">✈️</div>
    <h2>You found it.</h2>
    <p>
      The word "contrail" is short for condensation trail. These distinct white lines
      have a larger contribution to global warming than you might think — but they may
      also hold a key to reducing aviation's climate footprint. Thanks for looking up!
    </p>
    <button class="egg-close" id="eggClose">Back to Earth</button>
  </div>
`;
document.body.appendChild(eggEl);

document.getElementById('eggClose').addEventListener('click', () => {
  eggEl.classList.remove('show');
  typedWord = '';
});

const TARGET = 'contrail';
let typedWord = '';

document.addEventListener('keydown', (e) => {
  // ignore if user is in an input
  if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;

  typedWord += e.key.toLowerCase();
  if (typedWord.length > TARGET.length) {
    typedWord = typedWord.slice(typedWord.length - TARGET.length);
  }
  if (typedWord === TARGET) {
    eggEl.classList.add('show');
    typedWord = '';
  }
});


// ═══════════════════════════════════════════
// 10. SENSOR LEGEND — click to open photo in lightbox
// ═══════════════════════════════════════════
(function () {
  document.querySelectorAll('.sensor-item[data-sensor-img]').forEach(item => {
    item.addEventListener('click', () => {
      const lb        = document.getElementById('lightbox');
      const lbImg     = document.getElementById('lbImg');
      const lbCaption = document.getElementById('lbCaption');
      const lbPrev    = document.getElementById('lbPrev');
      const lbNext    = document.getElementById('lbNext');
      // Hide prev/next — single image mode
      lbPrev.style.display = 'none';
      lbNext.style.display = 'none';
      lbImg.src = item.dataset.sensorImg;
      lbImg.alt = item.dataset.sensorCaption;
      lbCaption.textContent = item.dataset.sensorCaption;
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  // Restore prev/next when lightbox closes
  document.getElementById('lbClose').addEventListener('click', () => {
    document.getElementById('lbPrev').style.display = '';
    document.getElementById('lbNext').style.display = '';
  }, { capture: true });
  document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target === document.getElementById('lightbox')) {
      document.getElementById('lbPrev').style.display = '';
      document.getElementById('lbNext').style.display = '';
    }
  }, { capture: true });
}());

// ═══════════════════════════════════════════
(function () {
  const btn = document.getElementById('igTrigger');
  if (!btn) return;

  const igEgg = document.createElement('div');
  igEgg.id = 'igEgg';
  igEgg.innerHTML = `
    <div class="egg-content">
      <div style="font-size:3rem;margin-bottom:0.8rem">📵</div>
      <h2>Nice try.</h2>
      <p>This is a research website, not a window into my personal life.<br>My concert photos and travel shots are strictly classified. 😏</p>
      <button class="egg-close" id="igEggClose">Understood, carry on</button>
    </div>
  `;
  document.body.appendChild(igEgg);

  btn.addEventListener('click', () => igEgg.classList.add('show'));
  document.getElementById('igEggClose').addEventListener('click', () => igEgg.classList.remove('show'));
  igEgg.addEventListener('click', e => { if (e.target === igEgg) igEgg.classList.remove('show'); });
}());

// ═══════════════════════════════════════════
console.log(
  '%c✈  Hello, curious one.  ',
  'background:#4a9abe;color:#fff;font-size:14px;padding:6px 14px;border-radius:4px;font-family:monospace'
);
console.log(
  '%cYou\'re looking at the source of a site about contrails.\nTry typing "contrail" on the page — or keep digging here. 👀',
  'color:#3d5566;font-size:12px;line-height:1.7'
);


// ═══════════════════════════════════════════
// 7. EASTER EGG — Konami code
// ═══════════════════════════════════════════
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown',
                'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let konamiIdx = 0;

document.addEventListener('keydown', (e) => {
  if (KONAMI.includes(e.key)) e.preventDefault();
  if (e.key === KONAMI[konamiIdx]) {
    konamiIdx++;
    if (konamiIdx === KONAMI.length) {
      konamiIdx = 0;
      // Rain contrails on the canvas for 5 seconds
      const extras = Array.from({ length: 20 }, () => {
        const c = new Contrail();
        c.startX = Math.random() * W;
        c.speed  = 2 + Math.random() * 3;
        c.alpha  = 0.5;
        c.width  = 2 + Math.random() * 3;
        return c;
      });
      contrails.push(...extras);
      setTimeout(() => extras.forEach(c => {
        const idx = contrails.indexOf(c);
        if (idx > -1) contrails.splice(idx, 1);
      }), 5000);
      console.log('%c🎮 Konami activated. Clear skies ahead.', 'color:#4a9abe;font-size:13px');
    }
  } else {
    konamiIdx = 0;
  }
});


// ═══════════════════════════════════════════
// 8. EASTER EGG — plane flies the journey path
// ═══════════════════════════════════════════
(function () {
  const trigger = document.getElementById('tracingTrigger');
  if (!trigger) return;

  let flying = false;

  trigger.addEventListener('click', () => {
    if (flying) return;
    flying = true;

    // Collect the timeline coords in order
    const items = Array.from(document.querySelectorAll('.timeline-item'));
    const coords = items.map(el => ({
      lat:  parseFloat(el.dataset.lat),
      lng:  parseFloat(el.dataset.lng),
      zoom: parseInt(el.dataset.zoom),
    }));

    // Deduplicate consecutive identical coords
    const stops = coords.filter((c, i) =>
      i === 0 || c.lat !== coords[i-1].lat || c.lng !== coords[i-1].lng
    );

    // Create a Leaflet divIcon plane marker at the first stop
    const planeIcon = L.divIcon({
      className: '',
      html: `<div style="
        font-size: 1.6rem;
        line-height: 1;
        filter: drop-shadow(0 1px 4px rgba(0,0,0,0.4));
        transform-origin: center;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
      ">✈️</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    const planeMarker = L.marker([stops[0].lat, stops[0].lng], {
      icon: planeIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    // Fly through each stop in sequence
    let i = 0;
    const FLY_DURATION = 2200; // ms per leg — matches setTimeout below

    function animateLeg(fromLat, fromLng, toLat, toLng, duration, onDone) {
      const start = performance.now();
      function step(now) {
        const t = Math.min((now - start) / duration, 1);
        // ease in-out
        const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const lat = fromLat + (toLat - fromLat) * e;
        const lng = fromLng + (toLng - fromLng) * e;
        planeMarker.setLatLng([lat, lng]);
        // rotate to face direction of travel
        const angle = Math.atan2(toLng - fromLng, toLat - fromLat) * (180 / Math.PI) - 45;
        const el = planeMarker.getElement();
        if (el) {
          const inner = el.querySelector('div');
          if (inner) inner.style.transform = `rotate(${angle}deg)`;
        }
        if (t < 1) requestAnimationFrame(step);
        else onDone();
      }
      requestAnimationFrame(step);
    }

    function flyToNext() {
      if (i >= stops.length) {
        setTimeout(() => {
          map.removeLayer(planeMarker);
          flying = false;
        }, 1200);
        return;
      }

      const stop = stops[i];

      // Highlight the matching timeline item
      items.forEach(el => el.classList.remove('active'));
      const match = items.find(el =>
        parseFloat(el.dataset.lat) === stop.lat &&
        parseFloat(el.dataset.lng) === stop.lng
      );
      if (match) {
        match.classList.add('active');
        match.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Pan map smoothly
      map.flyTo([stop.lat, stop.lng], Math.min(stop.zoom, 6), { duration: FLY_DURATION / 1000 });

      // Animate plane smoothly along the leg
      if (i > 0) {
        const prev = stops[i - 1];
        animateLeg(prev.lat, prev.lng, stop.lat, stop.lng, FLY_DURATION, () => {});
      } else {
        planeMarker.setLatLng([stop.lat, stop.lng]);
      }

      i++;
      setTimeout(flyToNext, FLY_DURATION);
    }

    // Make sure the journey section map is visible, then start
    document.getElementById('journey').scrollIntoView({ behavior: 'smooth' });
    setTimeout(flyToNext, 800);
  });
}());
