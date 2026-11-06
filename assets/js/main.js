/* =========================================================
   CIQU CONSTRUCTION — interactions
   GSAP + ScrollTrigger + Lenis (with a graceful no-library fallback)
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const html = document.documentElement;
  const body = document.body;
  const IMG = 'assets/img/';
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const animate = hasGSAP && !reduced;
  if (!animate) html.classList.add('no-anim');

  /* =======================================================
     DATA — every project gallery from the client site
     ======================================================= */
  const range = n => Array.from({ length: n }, (_, i) => i + 1);
  const PROJECTS = [
    { key: 'saratoga', name: 'Saratoga Bamboo House', files: range(9).map(i => `gallery/saratago-bamboo-house/${i}_ciqu_construction_califonia_luxry.webp`) },
    { key: 'bridge', name: 'Bridge House', files: range(3).map(i => `gallery/bridge-house/${i}-ciqu_construction_califonia_luxry.webp`) },
    { key: 'woodside-adu', name: 'Woodside ADU', files: range(17).map(i => `gallery/phillips-adu/${i}.webp`) },
    { key: 'palo-alto-remodel', name: 'Palo Alto Remodel', files: range(9).map(i => `gallery/palo-alto-remodel/${i}_ciqu_construction_luxury_home_building.webp`) },
    { key: 'atherton', name: 'Atherton Contemporary', files: range(10).map(i => `gallery/atherton-contemporary/${i}.webp`) },
    { key: 'woodside-historic', name: 'Woodside Historic', files: range(15).map(i => `gallery/woodside-historic/${i}.webp`) },
    { key: 'woodside-tuscan', name: 'Woodside Tuscan', files: range(9).map(i => `gallery/woodside-tuscan/${i}.webp`) },
    { key: 'portola-valley', name: 'Portola Valley 1', files: range(3).map(i => `gallery/portola-valley/${i}.webp`) },
    { key: 'portola-valley-2', name: 'Portola Valley 2', files: range(6).map(i => `gallery/portola-valley-2/${i}.webp`) },
    { key: 'beverly-hills', name: 'Beverly Hills', files: range(4).map(i => `gallery/beverly-hills/${i}.webp`) },
    { key: 'palo-alto', name: 'Palo Alto', files: range(3).map(i => `gallery/palo-alto/${i}.webp`) }
  ];
  const INTERIOR_LABELS = ['kitchen', 'bathroom', 'kitchen', 'bedroom', 'living room', 'dining', 'study', 'exterior',
    'primary bathroom', 'living room', 'dining room', 'aerial pool', 'exterior', 'stair detail', 'kitchen counter', 'pool', 'tub', 'bedroom', 'dining'];
  const INTERIORS = INTERIOR_LABELS.map((label, i) => ({ src: `${IMG}full-service/${i + 1}.webp`, cap: label }));

  const toItems = p => p.files.map((f, i) => ({ src: IMG + f, thumb: IMG + 'thumbs/' + f, cap: p.name, key: p.key, n: i + 1 }));
  // "All" interleaves the projects so the first screen of photos shows variety
  const ALL = (() => {
    const lists = PROJECTS.map(toItems), out = [];
    for (let i = 0; lists.some(l => l[i]); i++) lists.forEach(l => { if (l[i]) out.push(l[i]); });
    return out;
  })();

  /* =======================================================
     SMOOTH SCROLL
     ======================================================= */
  let lenis = null;
  if (animate && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  const scrollToTarget = (target, immediate) => {
    const el = typeof target === 'string' ? (target === '#top' ? 0 : $(target)) : target;
    if (el === null) return;
    if (lenis) lenis.scrollTo(el, { offset: el === 0 ? 0 : -70, duration: immediate ? 0 : 1.6, immediate: !!immediate });
    else if (el === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else el.scrollIntoView({ behavior: 'smooth' });
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2 && id !== '#') return;
    e.preventDefault();
    closeMenu();
    if (a.dataset.subject) { const sel = $('#f-type'); if (sel) sel.value = a.dataset.subject; }
    scrollToTarget(id === '#' ? '#top' : id);
  }));

  /* =======================================================
     TEXT SPLITTING
     ======================================================= */
  const splitWords = el => {
    const walk = node => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.textContent = part;
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n);
      });
    };
    walk(el);
    return $$('.w > span', el);
  };

  /* =======================================================
     BUILD DYNAMIC CONTENT
     ======================================================= */
  // interiors reel — two rows travelling in opposite directions
  const reelA = $('.reel__row--a'), reelB = $('.reel__row--b');
  if (reelA && reelB) {
    const card = (it, i) => `<figure class="reel__item" data-cursor="view" data-reel="${i}"><img src="${it.src}" alt="CIQU interior — ${it.cap}" loading="lazy" decoding="async"><span>${it.cap}</span></figure>`;
    const a = INTERIORS.slice(0, 10), b = INTERIORS.slice(10);
    reelA.innerHTML = a.map((it, i) => card(it, i)).join('') + a.slice(0, 3).map((it, i) => card(it, i)).join('');
    reelB.innerHTML = b.map((it, i) => card(it, i + 10)).join('') + b.slice(0, 4).map((it, i) => card(it, i + 10)).join('');
    $$('.reel__item').forEach(el => el.addEventListener('click', () => openLB(INTERIORS, +el.dataset.reel)));
  }

  // gallery with filters + load more
  const grid = $('.ggrid'), filters = $('.filters'), moreWrap = $('.gallery__more');
  const PAGE = 13;
  let gList = ALL, gShown = 0;
  const renderGallery = (list, reset) => {
    if (reset) { grid.innerHTML = ''; gShown = 0; gList = list; }
    const next = gList.slice(gShown, gShown + PAGE);
    grid.insertAdjacentHTML('beforeend', next.map((it, i) =>
      `<figure class="gitem2 is-new" data-cursor="view" data-g="${gShown + i}" style="animation-delay:${(i % PAGE) * 45}ms"><img src="${it.thumb || it.src}" alt="${it.cap} — photo ${it.n}" loading="lazy" decoding="async"><figcaption>${it.cap} · ${String(it.n).padStart(2, '0')}</figcaption></figure>`).join(''));
    gShown += next.length;
    moreWrap.hidden = gShown >= gList.length;
    if (hasGSAP) ScrollTrigger.refresh();
  };
  if (grid && filters) {
    filters.innerHTML = `<button class="is-on" data-f="all">All<sup>${ALL.length}</sup></button>` +
      PROJECTS.map(p => `<button data-f="${p.key}">${p.name}<sup>${p.files.length}</sup></button>`).join('');
    filters.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      $$('button', filters).forEach(x => x.classList.toggle('is-on', x === b));
      const p = PROJECTS.find(x => x.key === b.dataset.f);
      renderGallery(p ? toItems(p) : ALL, true);
    });
    grid.addEventListener('click', e => { const f = e.target.closest('.gitem2'); if (f) openLB(gList, +f.dataset.g); });
    $('button', moreWrap).addEventListener('click', () => renderGallery(gList, false));
    renderGallery(ALL, true);
  }

  // anything with data-open opens that project's photos
  $$('[data-open]').forEach(el => el.addEventListener('click', e => {
    if (e.target.closest('a')) return;
    const p = PROJECTS.find(x => x.key === el.dataset.open);
    if (p) openLB(toItems(p), 0);
  }));
  $$('.pcard[data-open]').forEach(el => el.setAttribute('data-cursor', 'view'));

  /* =======================================================
     LIGHTBOX
     ======================================================= */
  const lb = $('.lb'), lbImg = $('.lb__fig img'), lbCap = $('.lb__cap'), lbNum = $('.lb__num');
  let lbList = [], lbIdx = 0;
  function showLB(i) {
    lbIdx = (i + lbList.length) % lbList.length;
    const it = lbList[lbIdx];
    lbImg.classList.remove('is-ready');
    const pre = new Image();
    pre.onload = pre.onerror = () => { lbImg.src = it.src; lbImg.alt = it.cap; requestAnimationFrame(() => lbImg.classList.add('is-ready')); };
    pre.src = it.src;
    lbCap.textContent = it.cap;
    lbNum.textContent = `${String(lbIdx + 1).padStart(2, '0')} / ${String(lbList.length).padStart(2, '0')}`;
    [1, -1].forEach(d => { const n = lbList[(lbIdx + d + lbList.length) % lbList.length]; if (n) new Image().src = n.src; });
  }
  function openLB(list, i) {
    if (!lb || !list.length) return;
    lbList = list; showLB(i || 0);
    lb.classList.add('is-open');
    if (lenis) lenis.stop(); else body.style.overflow = 'hidden';
  }
  function closeLB() {
    lb.classList.remove('is-open');
    if (lenis) lenis.start(); else body.style.overflow = '';
  }
  if (lb) {
    $('.lb__close', lb).addEventListener('click', closeLB);
    $('.lb__prev', lb).addEventListener('click', () => showLB(lbIdx - 1));
    $('.lb__next', lb).addEventListener('click', () => showLB(lbIdx + 1));
    lb.addEventListener('click', e => { if (e.target === lb) closeLB(); });
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLB();
      if (e.key === 'ArrowLeft') showLB(lbIdx - 1);
      if (e.key === 'ArrowRight') showLB(lbIdx + 1);
    });
    let sx = null;
    lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) showLB(lbIdx + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }

  /* =======================================================
     HEADER + MENU
     ======================================================= */
  const header = $('.header'), burger = $('.burger');
  function closeMenu() {
    if (!body.classList.contains('menu-open')) return;
    body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start();
  }
  burger.addEventListener('click', () => {
    const open = body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(open));
    $('.menu').setAttribute('aria-hidden', String(!open));
    if (lenis) open ? lenis.stop() : lenis.start();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  let lastY = 0;
  const totop = $('.totop');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-solid', y > 80);
    header.classList.toggle('is-hidden', y > 500 && y > lastY + 2 && !body.classList.contains('menu-open'));
    if (y < lastY - 2) header.classList.remove('is-hidden');
    lastY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    totop.classList.toggle('is-on', y > innerHeight);
    totop.style.setProperty('--p', max > 0 ? (y / max).toFixed(3) : 0);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // active nav link
  const navLinks = $$('.nav a');
  const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => io.observe(s));
  }

  /* =======================================================
     HERO SLIDESHOW
     ======================================================= */
  const slides = $$('.hero__slide'), heroCur = $('.hero__cur'), heroProg = $('.hero__prog span');
  let slideIdx = 0, slideTween = null, slideTimer = null;
  const SLIDE_MS = 6500;
  // slides 2-5 carry data-src; fetch one only when it is next in line
  const loadSlide = i => { const im = slides[i] && $('img', slides[i]); if (im && im.dataset.src && !im.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); } };
  const goSlide = i => {
    slides[slideIdx].classList.remove('is-active');
    slideIdx = (i + slides.length) % slides.length;
    loadSlide(slideIdx);
    slides[slideIdx].classList.add('is-active');
    loadSlide((slideIdx + 1) % slides.length);
    heroCur.textContent = String(slideIdx + 1).padStart(2, '0');
    runSlideTimer();
  };
  function runSlideTimer() {
    loadSlide((slideIdx + 1) % slides.length);
    if (hasGSAP) {
      if (slideTween) slideTween.kill();
      slideTween = gsap.fromTo(heroProg, { scaleX: 0 }, { scaleX: 1, duration: SLIDE_MS / 1000, ease: 'none', onComplete: () => goSlide(slideIdx + 1) });
    } else {
      clearTimeout(slideTimer);
      slideTimer = setTimeout(() => goSlide(slideIdx + 1), SLIDE_MS);
    }
  }
  document.addEventListener('visibilitychange', () => { if (slideTween) document.hidden ? slideTween.pause() : slideTween.resume(); });

  /* =======================================================
     QUOTES
     ======================================================= */
  const qs = $$('.qslide'), qCount = $('.qnav__count b');
  let qi = 0, qTimer;
  const goQ = i => {
    qs[qi].classList.remove('is-on');
    qi = (i + qs.length) % qs.length;
    qs[qi].classList.add('is-on');
    qCount.textContent = String(qi + 1).padStart(2, '0');
    clearInterval(qTimer); qTimer = setInterval(() => goQ(qi + 1), 8000);
  };
  if (qs.length) {
    $('.qprev').addEventListener('click', () => goQ(qi - 1));
    $('.qnext').addEventListener('click', () => goQ(qi + 1));
    qTimer = setInterval(() => goQ(qi + 1), 8000);
  }

  /* =======================================================
     PILLARS (C · I · Q · U)
     ======================================================= */
  const pLetters = $$('.pillars__letters span'), pTexts = $$('.pillar'), pDots = $$('.pillars__dots i');
  const pBig = $$('.pillars__imgs:not(.pillars__imgs--sm) figure'), pSmall = $$('.pillars__imgs--sm figure');
  let pIdx = 0;
  const setPillar = i => {
    if (i === pIdx) return;
    [pBig, pSmall].forEach(set => set.forEach((f, k) => {
      f.classList.toggle('was-on', k === pIdx);
      f.classList.toggle('is-on', k === i);
      if (k !== i && k !== pIdx) f.classList.remove('was-on');
    }));
    [pLetters, pTexts, pDots].forEach(set => set.forEach((el, k) => el.classList.toggle('is-on', k === i)));
    pIdx = i;
  };
  pDots.forEach((d, i) => d.addEventListener('click', () => setPillar(i)));

  /* =======================================================
     CONTACT FORM — composes an email to CIQU
     ======================================================= */
  const form = $('.cform');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const note = $('.cform__note', form);
    let ok = true;
    $$('[required]', form).forEach(f => {
      const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      f.closest('.field').classList.toggle('is-error', bad);
      if (bad) ok = false;
    });
    if (!ok) { note.textContent = 'Please complete your name, a valid e-mail and a message.'; return; }
    const d = Object.fromEntries(new FormData(form));
    const bodyTxt = `Name: ${d.name}\nE-mail: ${d.email}\nArea / suburb: ${d.area || '-'}\nTelephone: ${d.tel || '-'}\nInterested in: ${d.type}\n\n${d.message}`;
    window.location.href = `mailto:info@ciquconstruction.com?subject=${encodeURIComponent('Project enquiry — ' + d.type)}&body=${encodeURIComponent(bodyTxt)}`;
    note.textContent = 'Thank you — your e-mail app is opening with your message to CIQU.';
    form.reset();
  });
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* =======================================================
     CURSOR + MAGNETIC
     ======================================================= */
  if (finePointer && !reduced) {
    const cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px, ${my}px)`; }, { passive: true });
    const loop = () => { rx += (mx - rx) * .16; ry += (my - ry) * .16; ring.style.transform = `translate(${rx}px, ${ry}px)`; requestAnimationFrame(loop); };
    loop();
    document.addEventListener('mouseover', e => {
      const v = e.target.closest('[data-cursor="view"]');
      cur.classList.toggle('is-view', !!v);
      cur.classList.toggle('is-link', !v && !!e.target.closest('a, button, .prow[data-open], select'));
    });
    document.addEventListener('mouseleave', () => { cur.style.opacity = 0; });
    document.addEventListener('mouseenter', () => { cur.style.opacity = 1; });

    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * .3, y = (e.clientY - r.top - r.height / 2) * .4;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1), color .5s, border-color .5s'; el.style.transform = ''; setTimeout(() => { el.style.transition = ''; }, 600); });
    });

    // portfolio hover image
    const float = $('.plist__float'), fImg = float && $('img', float);
    if (float) {
      let fx = 0, fy = 0, tx = 0, ty = 0, on = false;
      $$('.prow').forEach(row => {
        row.addEventListener('mouseenter', () => { if (!row.dataset.img) return; fImg.src = row.dataset.img; on = true; float.classList.add('is-on'); });
        row.addEventListener('mouseleave', () => { on = false; float.classList.remove('is-on'); });
      });
      window.addEventListener('mousemove', e => { tx = e.clientX + 30; ty = e.clientY - 120; }, { passive: true });
      const fl = () => { fx += (tx - fx) * .12; fy += (ty - fy) * .12; if (on) float.style.transform = `translate(${fx}px, ${fy}px) rotate(${(tx - fx) * .02}deg)`; requestAnimationFrame(fl); };
      fl();
    }
  }

  /* =======================================================
     NO-ANIMATION FALLBACK
     ======================================================= */
  if (!animate) {
    const loader = $('.loader'); if (loader) loader.remove();
    body.classList.remove('is-loading');
    runSlideTimer();
    // simple pillar rotation
    setInterval(() => setPillar((pIdx + 1) % 4), 4000);
    return;
  }

  /* =======================================================
     LOADER → HERO INTRO
     ======================================================= */
  body.classList.add('is-loading');
  window.scrollTo(0, 0);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const loader = $('.loader');
  const words = $$('.loader__words span');
  const counter = { v: 0 };
  const countEl = $('.loader__count'), barEl = $('.loader__bar span');

  // real loading progress: fonts + hero image + logo
  const assets = [slides[0] && $('img', slides[0]).src, IMG + 'ciqu_construction_logo5.png', IMG + 'home/slider_a.webp'].filter(Boolean);
  let loaded = 0;
  const total = assets.length + 1;
  const ready = new Promise(res => {
    const tick = () => { loaded++; if (loaded >= total) res(); };
    assets.forEach(src => { const im = new Image(); im.onload = im.onerror = tick; im.src = src; });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(tick);
    setTimeout(res, 6000); // never hang on a slow network
  });

  const intro = gsap.timeline({ paused: true });
  intro
    .from('.hero__media', { scale: 1.3, duration: 2.2, ease: 'expo.out' }, 0)
    .from('.hero__lines i', { scaleY: 0, transformOrigin: 'top', duration: 1.6, stagger: .08, ease: 'expo.out' }, .1)
    .from('.hero__title .ln > span', { yPercent: 110, rotate: 3, duration: 1.4, stagger: .1, ease: 'expo.out' }, .25)
    .from('.hero__eyebrow', { y: 20, opacity: 0, duration: 1, ease: 'expo.out' }, .4)
    .from('.hero__lead, .hero__cta > *', { y: 30, opacity: 0, duration: 1.1, stagger: .08, ease: 'expo.out' }, .6)
    .from('.hero__rail', { opacity: 0, y: 20, duration: 1, ease: 'expo.out' }, .8)
    .from('.header__inner > *', { y: -30, opacity: 0, duration: 1, stagger: .08, ease: 'expo.out' }, .5);

  const tl = gsap.timeline();
  tl.from('.loader__grid i', { scaleY: 0, duration: 1.2, stagger: .08, ease: 'expo.inOut' })
    .to('.loader__logo', { clipPath: 'inset(0 0% 0 0)', duration: 1.3, ease: 'expo.inOut' }, .2)
    .to(counter, {
      v: 70, duration: 2, ease: 'power2.inOut',
      onUpdate: () => { countEl.textContent = String(Math.round(counter.v)).padStart(3, '0'); gsap.set(barEl, { scaleX: counter.v / 100 }); }
    }, .3);
  // words cycle C → I → Q → U
  gsap.set(words, { yPercent: 110, opacity: 1 });
  words.forEach((w, i) => {
    tl.to(w, { yPercent: 0, duration: .55, ease: 'expo.out' }, .45 + i * .5);
    if (i < words.length - 1) tl.to(w, { yPercent: -110, duration: .45, ease: 'expo.in' }, .45 + i * .5 + .38);
  });

  Promise.all([ready, new Promise(r => tl.eventCallback('onComplete', r))]).then(() => {
    gsap.timeline()
      .to(counter, {
        v: 100, duration: .7, ease: 'power2.out',
        onUpdate: () => { countEl.textContent = String(Math.round(counter.v)).padStart(3, '0'); gsap.set(barEl, { scaleX: counter.v / 100 }); }
      })
      .to('.loader__inner', { y: -40, opacity: 0, duration: .7, ease: 'expo.in' }, '+=.15')
      .to('.loader__curtain i', { scaleY: 1, duration: .8, ease: 'expo.inOut' }, '-=.35')
      .add(() => { loader.style.background = 'transparent'; gsap.set('.loader__grid', { opacity: 0 }); loader.classList.add('is-out'); })
      .to('.loader__curtain i:first-child', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '+=.05')
      .to('.loader__curtain i:last-child', { yPercent: 100, duration: 1.1, ease: 'expo.inOut' }, '<')
      .add(() => { intro.play(); runSlideTimer(); }, '<.15')
      .add(() => {
        loader.remove();
        body.classList.remove('is-loading');
        if (lenis) lenis.start();
        ScrollTrigger.refresh();
        if (location.hash && $(location.hash)) scrollToTarget(location.hash);
      });
  });
  // the loader's dark backdrop is a pseudo-element; hide it with the class when the curtain opens
  const st = document.createElement('style');
  st.textContent = '.loader.is-out::before{opacity:0;transition:opacity .2s}';
  document.head.appendChild(st);

  /* =======================================================
     SCROLL ANIMATIONS
     ======================================================= */
  // headings: word-by-word rise
  $$('.split').forEach(el => {
    const parts = splitWords(el);
    gsap.from(parts, {
      yPercent: 115, duration: 1.2, stagger: .035, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  // big intro paragraph: words light up as you scroll
  $$('[data-words]').forEach(el => {
    const parts = splitWords(el);
    gsap.to(parts, {
      opacity: 1, stagger: .05, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true }
    });
  });

  // fade-up blocks
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, stagger: .09, ease: 'expo.out', overwrite: true })
  });

  // image reveals
  $$('.img-reveal').forEach(el => {
    const img = $('img', el);
    const t = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%' } });
    t.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.5, ease: 'expo.inOut' });
    if (img && !img.dataset.speed) t.from(img, { scale: 1.3, duration: 1.8, ease: 'expo.out' }, 0);
  });

  // parallax images
  $$('[data-speed]').forEach(img => {
    const s = parseFloat(img.dataset.speed) || -.1;
    gsap.fromTo(img, { yPercent: -s * 100 }, {
      yPercent: s * 100, ease: 'none',
      scrollTrigger: { trigger: img.closest('section') || img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  // founder: frame, corners, badge and signature enter in sequence
  const founder = $('.founder');
  if (founder) {
    const sig = $('.founder__sig', founder);
    if (sig) gsap.set(sig, { clipPath: 'inset(0 100% 0 0)', opacity: 0 });
    gsap.timeline({ scrollTrigger: { trigger: '.founder__media', start: 'top 80%' } })
      .from('.founder__outline', { opacity: 0, x: -26, y: -26, duration: 1.6, ease: 'expo.out' }, .5)
      .from('.founder__corner--tl', { opacity: 0, x: 24, y: 24, duration: 1.1, ease: 'expo.out' }, .9)
      .from('.founder__corner--br', { opacity: 0, x: -24, y: -24, duration: 1.1, ease: 'expo.out' }, .9)
      .from('.founder__badge', { opacity: 0, xPercent: 40, clipPath: 'inset(0 0 0 100%)', duration: 1.3, ease: 'expo.out' }, 1)
      .from('.founder__badge > *', { opacity: 0, y: 14, duration: .9, stagger: .1, ease: 'expo.out' }, 1.3)
      .add(() => { const s = $('.founder__shine', founder); if (s) gsap.fromTo(s, { xPercent: -120 }, { xPercent: 120, duration: 1.4, ease: 'power2.inOut', clearProps: 'transform' }); }, 1.6);
    if (sig) gsap.to(sig, { clipPath: 'inset(0 0% 0 0)', opacity: .9, duration: 2.2, ease: 'power2.inOut', scrollTrigger: { trigger: sig, start: 'top 92%' } });
    // big background name drifts sideways with scroll
    gsap.fromTo('.founder__word', { xPercent: 12 }, { xPercent: -12, ease: 'none', scrollTrigger: { trigger: founder, start: 'top bottom', end: 'bottom top', scrub: true } });
    // gentle 3D tilt that follows the cursor
    const media = $('.founder__media', founder), tilt = $('.founder__tilt', founder);
    if (finePointer && media && tilt) {
      const rx = gsap.quickTo(tilt, 'rotationX', { duration: .8, ease: 'power3.out' });
      const ry = gsap.quickTo(tilt, 'rotationY', { duration: .8, ease: 'power3.out' });
      media.addEventListener('mousemove', e => {
        const r = media.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - .5) * 9);
        rx(-((e.clientY - r.top) / r.height - .5) * 9);
      });
      media.addEventListener('mouseleave', () => { rx(0); ry(0); });
    }
  }

  // marquee speeds up & reverses with scroll direction
  const mTrack = $('.marquee__track');
  if (mTrack) {
    mTrack.style.animation = 'none';
    const mTween = gsap.to(mTrack, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      onUpdate: self => {
        const v = self.getVelocity();
        gsap.to(mTween, { timeScale: (v < 0 ? -1 : 1) * Math.min(6, 1 + Math.abs(v) / 400), duration: .3, overwrite: true });
        gsap.to(mTween, { timeScale: v < 0 ? -1 : 1, duration: 1.2, delay: .3, overwrite: false });
      }
    });
  }

  const mm = gsap.matchMedia();

  // pillars — pinned on desktop, auto-rotate on small screens
  mm.add('(min-width: 993px)', () => {
    const t = ScrollTrigger.create({
      trigger: '.pillars', start: 'top top', end: '+=280%', pin: '.pillars__pin', scrub: true,
      onUpdate: self => setPillar(Math.min(3, Math.floor(self.progress * 4)))
    });
    return () => t.kill();
  });
  mm.add('(max-width: 992px)', () => {
    let iv = null;
    const t = ScrollTrigger.create({
      trigger: '.pillars', start: 'top 70%', end: 'bottom 30%',
      onToggle: self => { clearInterval(iv); if (self.isActive) iv = setInterval(() => setPillar((pIdx + 1) % 4), 3200); }
    });
    return () => { clearInterval(iv); t.kill(); };
  });

  // services — earlier cards recede as the next one stacks over them
  mm.add('(min-width: 993px)', () => {
    const cards = $$('.scard');
    const tw = cards.slice(0, -1).map((c, i) => gsap.fromTo(c, { scale: 1, filter: 'brightness(1)' }, {
      scale: .94, filter: 'brightness(.6)', ease: 'none',
      scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top top+=110', scrub: true }
    }));
    return () => tw.forEach(t => t.scrollTrigger && t.scrollTrigger.kill());
  });

  // process timeline line draw
  const tlEl = $('.timeline');
  if (tlEl) {
    ScrollTrigger.create({
      trigger: tlEl, start: 'top 70%', end: 'bottom 60%', scrub: true,
      onUpdate: self => tlEl.style.setProperty('--p', self.progress.toFixed(3))
    });
    $$('.tl', tlEl).forEach(li => ScrollTrigger.create({ trigger: li, start: 'top 68%', onToggle: s => li.classList.toggle('is-on', s.isActive || s.progress > 0), end: 'max' }));
    gsap.from($$('.tl > div', tlEl), { opacity: 0, x: 40, duration: 1.1, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: tlEl, start: 'top 75%' } });
  }

  // sustainability icons
  gsap.from('.gitem', { opacity: 0, y: 50, duration: 1.1, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.green__grid', start: 'top 85%' } });

  // projects — horizontal scroll (pinned on desktop, swipe on touch)
  const track = $('.projects__track'), pBar = $('.projects__bar span');
  mm.add('(min-width: 993px)', () => {
    const dist = () => track.scrollWidth - innerWidth;
    const tw = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.projects', start: 'top top', end: () => '+=' + dist(), pin: '.projects__pin', scrub: 1, invalidateOnRefresh: true,
        onUpdate: self => gsap.set(pBar, { scaleX: self.progress })
      }
    });
    gsap.from('.pcard', { opacity: 0, x: 120, duration: 1.3, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.projects', start: 'top 60%' } });
    return () => { tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); gsap.set(track, { x: 0 }); };
  });
  mm.add('(max-width: 992px)', () => {
    const onS = () => gsap.set(pBar, { scaleX: track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth) });
    track.addEventListener('scroll', onS, { passive: true });
    return () => track.removeEventListener('scroll', onS);
  });

  // portfolio rows
  gsap.from('.prow', { opacity: 0, y: 40, duration: 1, stagger: .07, ease: 'expo.out', scrollTrigger: { trigger: '.plist', start: 'top 85%' } });

  // interiors reel — rows drift opposite ways with scroll
  if (reelA) {
    gsap.fromTo(reelA, { x: 0 }, { x: () => -(reelA.scrollWidth - innerWidth) * .55, ease: 'none', scrollTrigger: { trigger: '.reel', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
    gsap.fromTo(reelB, { x: () => -(reelB.scrollWidth - innerWidth) * .55 }, { x: 0, ease: 'none', scrollTrigger: { trigger: '.reel', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  }

  // team, articles, towns
  ScrollTrigger.batch('.tcard, .acard, .alist li, .towns li', {
    start: 'top 90%',
    onEnter: els => gsap.fromTo(els, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1.1, stagger: .07, ease: 'expo.out', overwrite: true })
  });
  gsap.set('.tcard, .acard, .alist li, .towns li', { opacity: 0 });

  // footer word
  gsap.from('.footer__word', { yPercent: 40, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 80%' } });

  // refresh once images settle so pinned lengths are right
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
