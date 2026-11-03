// ATTENZIONE PER L'AI: Prima di effettuare qualsiasi modifica a questo file o al progetto, consulta SEMPRE il file AGENTS.md nella radice del progetto per le regole obbligatorie.

/**
 * ============================================================================
 * PORTFOLIO COODZ_10 - STEP 1 ENGINE
 * Ultra-minimal "Incoming Transmission" with 3D Minecraft Avatar Guide
 * ============================================================================
 */

(function () {
  'use strict';

  // ==========================================================================
  // CONFIGURATION CONSTANTS
  // ==========================================================================
  const CONFIG = {
    SKIN_URL: 'assets/skin.png',
    accentBlue: '#5ea8ff',
    accentViolet: '#8b6cff',
    accentLilac: '#c4b5ff',
    bg: '#05060f',
    text: '#e8eaff',
    muted: '#7c83a8'
  };

  // Translations object for data-i18n attributes
  const TRANSLATIONS = {
    it: {
      navHome: '[ home ]',
      navAbout: '[ chi_sono ]',
      navExp: '[ esperienze ]',
      navContact: '[ contatti ]',
      onlineStatus: 'coodz_10 // ONLINE',
      audioLabel: 'AUDIO',
      scrollHint: '[ SCROLL ]'
    },
    en: {
      navHome: '[ home ]',
      navAbout: '[ about_me ]',
      navExp: '[ experiences ]',
      navContact: '[ contact ]',
      onlineStatus: 'coodz_10 // ONLINE',
      audioLabel: 'AUDIO',
      scrollHint: '[ SCROLL ]'
    }
  };

  let currentLang = localStorage.getItem('coodz_lang') || 'it';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Global state references
  let skinViewer = null;
  let targetHeadX = 0;
  let targetHeadY = 0;
  let headAnimFrameId = null;
  let starsAnimFrameId = null;

  // ==========================================================================
  // 1. OPENING SEQUENCE (~2s, Skippable by Click or Keypress)
  // ==========================================================================
  function initOpeningSequence() {
    const openingScreen = document.getElementById('opening-screen');
    const terminalEl = document.getElementById('opening-terminal');
    const progressBar = document.getElementById('opening-progress-bar');
    const avatarStage = document.getElementById('avatar-stage');
    const heroTitle = document.getElementById('hero-title');

    if (!openingScreen) return;

    let isDone = false;
    let progressTimer = null;
    let typeTimeout1 = null;
    let typeTimeout2 = null;

    function finishOpening() {
      if (isDone) return;
      isDone = true;

      if (progressTimer) clearInterval(progressTimer);
      if (typeTimeout1) clearTimeout(typeTimeout1);
      if (typeTimeout2) clearTimeout(typeTimeout2);

      if (progressBar) progressBar.style.width = '100%';
      if (terminalEl) terminalEl.textContent = '> signal locked';

      openingScreen.classList.add('faded-out');
      if (avatarStage) avatarStage.classList.add('stage-ready');

      // Decrypt Title "coodz_10"
      if (heroTitle) {
        decryptTitle(heroTitle, 'coodz_10', 1200);
      }

      setTimeout(() => {
        openingScreen.style.display = 'none';
      }, 850);
    }

    // Progress line animation 0 -> 100% over ~2000ms
    let progress = 0;
    progressTimer = setInterval(() => {
      progress += 2;
      if (progressBar) progressBar.style.width = progress + '%';
      if (progress >= 100) {
        clearInterval(progressTimer);
        setTimeout(finishOpening, 200);
      }
    }, 40);

    // Monospace lines typing sequence
    typeTimeout1 = setTimeout(() => {
      if (!isDone && terminalEl) {
        terminalEl.textContent = '> establishing link... [OK]';
      }
    }, 850);

    typeTimeout2 = setTimeout(() => {
      if (!isDone && terminalEl) {
        terminalEl.textContent = '> signal locked';
      }
    }, 1500);

    // Skippable by clicking anywhere or pressing Escape / Space
    openingScreen.addEventListener('click', finishOpening);
    window.addEventListener('keydown', (e) => {
      if (!isDone && (e.key === 'Escape' || e.key === ' ')) {
        finishOpening();
      }
    }, { once: true });
  }

  // ==========================================================================
  // TITLE DECRYPT EFFECT (Random glyphs resolving left to right)
  // ==========================================================================
  function decryptTitle(el, targetText, duration) {
    const chars = '01!<>-_/[]{}*#+=';
    const len = targetText.length;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const lockedCount = Math.floor(progress * len);

      let output = '';
      for (let i = 0; i < len; i++) {
        if (i < lockedCount) {
          output += targetText[i];
        } else if (i === lockedCount && progress >= 0.95) {
          output += targetText[i];
        } else {
          output += chars[Math.floor(Math.random() * chars.length)];
        }
      }

      el.textContent = output;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = targetText;
      }
    }

    requestAnimationFrame(update);
  }

  // ==========================================================================
  // 2. AVATAR (skinview3d SkinViewer with Idle Animation & Mouse Head Tracking)
  // ==========================================================================
  function updateViewerSize() {
    if (!skinViewer) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    skinViewer.width = w;
    skinViewer.height = h;

    // Mobile avatar smaller, desktop giant (~80vh tall)
    if (w < 768) {
      skinViewer.zoom = 0.65;
    } else {
      skinViewer.zoom = 1.05;
    }
  }

  function animateHead() {
    if (document.hidden) {
      headAnimFrameId = requestAnimationFrame(animateHead);
      return;
    }

    if (skinViewer && skinViewer.playerObject && skinViewer.playerObject.skin && skinViewer.playerObject.skin.head) {
      const head = skinViewer.playerObject.skin.head;
      head.rotation.y += (targetHeadY - head.rotation.y) * 0.08;
      head.rotation.x += (targetHeadX - head.rotation.x) * 0.08;
    }

    headAnimFrameId = requestAnimationFrame(animateHead);
  }

  function initAvatar() {
    const canvas = document.getElementById('avatar-canvas');
    const fallbackImg = document.getElementById('avatar-fallback');

    function showFallback() {
      if (canvas) canvas.style.display = 'none';
      if (fallbackImg) fallbackImg.style.display = 'block';
    }

    // Check WebGL availability
    let isWebGLAvailable = false;
    try {
      const testCanvas = document.createElement('canvas');
      isWebGLAvailable = !!(window.WebGLRenderingContext && (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')));
    } catch (e) {
      isWebGLAvailable = false;
    }

    if (!isWebGLAvailable || typeof skinview3d === 'undefined' || !canvas) {
      showFallback();
      return;
    }

    try {
      skinViewer = new skinview3d.SkinViewer({
        canvas: canvas,
        width: window.innerWidth,
        height: window.innerHeight,
        skin: CONFIG.SKIN_URL
      });

      // Configuration
      skinViewer.controls.enabled = false;
      skinViewer.autoRotate = true;
      skinViewer.autoRotateSpeed = 0.35;

      // Idle breathing animation
      skinViewer.animation = new skinview3d.IdleAnimation();
      skinViewer.animation.speed = 0.8;

      updateViewerSize();

      // Track mouse across window for smooth head following
      window.addEventListener('mousemove', (e) => {
        const halfW = window.innerWidth / 2;
        const halfH = window.innerHeight / 2;
        const normX = (e.clientX - halfW) / halfW;
        const normY = (e.clientY - halfH) / halfH;

        // Natural head rotation angles (clamped in radians)
        targetHeadY = -normX * 0.65;
        targetHeadX = normY * 0.45;
      }, { passive: true });

      // Start head tracking animation loop
      animateHead();

      // Handle Resize
      window.addEventListener('resize', updateViewerSize, { passive: true });

      // Pause rendering when tab is hidden
      document.addEventListener('visibilitychange', () => {
        if (skinViewer) {
          skinViewer.renderPaused = document.hidden;
        }
      });
    } catch (err) {
      console.warn('SkinViewer failed to initialize, using fallback image:', err);
      showFallback();
    }
  }

  // ==========================================================================
  // 3. CANVAS STARS (~60 Tiny Twinkling Stars, No Heavy Motion)
  // ==========================================================================
  function initStars() {
    const canvas = document.getElementById('stars-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const starCount = 60;
    const stars = [];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 0.85 + 0.6,
        baseAlpha: Math.random() * 0.4 + 0.25,
        speed: Math.random() * 1.5 + 0.75,
        phase: Math.random() * Math.PI * 2
      });
    }

    function renderStatic() {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < starCount; i++) {
        const s = stars[i];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 234, 255, ${s.baseAlpha})`;
        ctx.fill();
      }
    }

    if (prefersReducedMotion) {
      renderStatic();
      return;
    }

    let startTime = performance.now();

    function renderStars(now) {
      if (document.hidden) {
        starsAnimFrameId = requestAnimationFrame(renderStars);
        return;
      }

      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < starCount; i++) {
        const s = stars[i];
        const alpha = Math.max(0.1, s.baseAlpha + Math.sin(elapsed * s.speed + s.phase) * 0.25);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 234, 255, ${alpha.toFixed(2)})`;
        ctx.fill();
      }

      starsAnimFrameId = requestAnimationFrame(renderStars);
    }

    starsAnimFrameId = requestAnimationFrame(renderStars);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      for (let i = 0; i < starCount; i++) {
        stars[i].x = Math.random() * width;
        stars[i].y = Math.random() * height;
      }
      if (prefersReducedMotion) renderStatic();
    }, { passive: true });
  }

  // ==========================================================================
  // 4. NAVIGATION, IT/EN TOGGLE & AUDIO CONTROLS
  // ==========================================================================
  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('coodz_lang', lang);

    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.textContent = lang === 'it' ? '[ EN ]' : '[ IT ]';
    }

    const dict = TRANSLATIONS[lang] || TRANSLATIONS.it;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });
  }

  function initNavigation() {
    // Language Toggle
    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        applyLanguage(currentLang === 'it' ? 'en' : 'it');
      });
    }
    applyLanguage(currentLang);

    // Audio Controls (UI wired to <audio> element with placeholder src)
    const audio = document.getElementById('bg-audio');
    const audioToggleBtn = document.getElementById('audio-toggle-btn');
    const audioSkipBtn = document.getElementById('audio-skip-btn');
    let isPlaying = false;

    if (audioToggleBtn && audio) {
      audioToggleBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        if (isPlaying) {
          audioToggleBtn.classList.add('playing');
          audio.play().catch(() => {
            // Handled gracefully for placeholder audio
          });
        } else {
          audioToggleBtn.classList.remove('playing');
          audio.pause();
        }
      });
    }

    if (audioSkipBtn) {
      audioSkipBtn.addEventListener('click', () => {
        audioSkipBtn.classList.add('pulse');
        setTimeout(() => audioSkipBtn.classList.remove('pulse'), 300);
      });
    }

    // Mobile Hamburger Menu
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    if (menuToggleBtn && mobileMenu) {
      menuToggleBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
        const isOpen = mobileMenu.classList.contains('open');
        menuToggleBtn.textContent = isOpen ? '[ × ]' : '[ ☰ ]';
      });

      mobileLinks.forEach((link) => {
        link.addEventListener('click', () => {
          mobileMenu.classList.remove('open');
          menuToggleBtn.textContent = '[ ☰ ]';
        });
      });
    }

    // Hero title re-scramble on hover
    const heroTitle = document.getElementById('hero-title');
    if (heroTitle) {
      heroTitle.addEventListener('mouseenter', () => {
        decryptTitle(heroTitle, 'coodz_10', 900);
      });
    }
  }

  // ==========================================================================
  // INITIALIZATION ON DOMContentLoaded
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initOpeningSequence();
    initAvatar();
    initStars();
    initNavigation();
  });

})();
