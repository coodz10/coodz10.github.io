// ATTENZIONE PER L'AI: Prima di effettuare qualsiasi modifica a questo file o al progetto, consulta SEMPRE il file AGENTS.md nella radice del progetto per le regole obbligatorie.

/**
 * ============================================================================
 * PORTFOLIO COODZ_10 - STEP 2 ENGINE
 * Ultra-minimal "Incoming Transmission" with 3D Avatar State Machine
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
      scrollHint: '[ SCROLL ]',
      aboutTag: 'LOG_ENTRY_00 // CHI_SONO',
      aboutTitle: 'Chi Sono',
      aboutText: "Ho una forte passione per l'informatica a 360°: dall'ottimizzazione dei sistemi Windows alla gestione di infrastrutture server, fino alla sicurezza informatica e allo sviluppo di software su misura.",
      aboutHandleLabel: 'HANDLE:',
      aboutRoleLabel: 'RUOLO:',
      aboutRoleVal: 'SysAdmin // Security',
      aboutStatusLabel: 'STATO:',
      aboutStatusVal: '[ OPERATIVO ]',
      expTag: 'LOG_ENTRY_01 // ESPERIENZE',
      expTitle: 'Esperienze',
      expRedisRole: 'Helper',
      expRedisStatus: '[ Stato: Attivo ]',
      expMetaRole: 'Helper ★★★★☆',
      expMetaStatus: '[ Stato: Dimesso ]',
      expPixyRole: 'Owner [ SS Manager ] ★★★★☆',
      expPixyStatus: '[ Stato: Dimesso ]',
      viewDossier: '[ VEDI SCHEDA ]',
      contactTag: 'LOG_ENTRY_02 // CONTATTI',
      contactTitle: 'Parliamo',
      contactSub: 'Per collaborazioni, richieste di servizi o investigazioni di sicurezza.',
      footerEnd: 'END_TRANSMISSION // COODZ_10'
    },
    en: {
      navHome: '[ home ]',
      navAbout: '[ about_me ]',
      navExp: '[ experiences ]',
      navContact: '[ contact ]',
      onlineStatus: 'coodz_10 // ONLINE',
      audioLabel: 'AUDIO',
      scrollHint: '[ SCROLL ]',
      aboutTag: 'LOG_ENTRY_00 // ABOUT_ME',
      aboutTitle: 'About Me',
      aboutText: 'I have a strong passion for 360° IT: from Windows system optimization to server infrastructure management, cybersecurity, and custom software development.',
      aboutHandleLabel: 'HANDLE:',
      aboutRoleLabel: 'ROLE:',
      aboutRoleVal: 'SysAdmin // Security',
      aboutStatusLabel: 'STATUS:',
      aboutStatusVal: '[ OPERATIONAL ]',
      expTag: 'LOG_ENTRY_01 // EXPERIENCES',
      expTitle: 'Experiences',
      expRedisRole: 'Helper',
      expRedisStatus: '[ Status: Active ]',
      expMetaRole: 'Helper ★★★★☆',
      expMetaStatus: '[ Status: Resign ]',
      expPixyRole: 'Owner [ SS Manager ] ★★★★☆',
      expPixyStatus: '[ Status: Resign ]',
      viewDossier: '[ VIEW DOSSIER ]',
      contactTag: 'LOG_ENTRY_02 // CONTACT',
      contactTitle: "Let's Talk",
      contactSub: 'For collaborations, service requests or security investigations.',
      footerEnd: 'END_TRANSMISSION // COODZ_10'
    }
  };

  let currentLang = localStorage.getItem('coodz_lang') || 'it';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Global state references
  let skinViewer = null;
  let targetHeadX = 0;
  let targetHeadY = 0;
  let targetPlayerRotY = 0;
  let currentAvatarState = 'home';
  let activeSectionId = 'home';
  let isMobile = window.innerWidth <= 768;

  // ==========================================================================
  // CUSTOM SKINVIEW3D ANIMATIONS (WAVE & SHORT-WAVE-THEN-IDLE)
  // ==========================================================================
  class WaveAnimation extends (window.skinview3d ? skinview3d.PlayerAnimation : class {}) {
    animate(player) {
      if (!player || !player.skin) return;
      const t = this.progress * 6;

      // Right arm raised and waving
      player.skin.rightArm.rotation.x = -Math.PI * 0.85;
      player.skin.rightArm.rotation.z = -0.3 + Math.sin(t) * 0.35;
      player.skin.rightArm.rotation.y = 0.2;

      // Left arm relaxed idle breathing
      player.skin.leftArm.rotation.x = 0;
      player.skin.leftArm.rotation.z = 0.05 + Math.cos(this.progress * 2) * 0.03;
      player.skin.leftArm.rotation.y = 0;

      // Keep legs straight
      player.skin.leftLeg.rotation.x = 0;
      player.skin.rightLeg.rotation.x = 0;
      player.skin.leftLeg.rotation.z = 0;
      player.skin.rightLeg.rotation.z = 0;
    }
  }

  class ShortWaveThenIdleAnimation extends (window.skinview3d ? skinview3d.PlayerAnimation : class {}) {
    constructor(onComplete) {
      super();
      this.onComplete = onComplete;
      this.waveDuration = 2.0;
      this.hasCompleted = false;
    }

    animate(player) {
      if (!player || !player.skin) return;

      if (this.progress < this.waveDuration) {
        const t = this.progress * 7;
        player.skin.rightArm.rotation.x = -Math.PI * 0.85;
        player.skin.rightArm.rotation.z = -0.3 + Math.sin(t) * 0.35;
        player.skin.rightArm.rotation.y = 0.2;

        player.skin.leftArm.rotation.x = 0;
        player.skin.leftArm.rotation.z = 0.05 + Math.cos(this.progress * 2) * 0.03;
        player.skin.leftArm.rotation.y = 0;

        player.skin.leftLeg.rotation.x = 0;
        player.skin.rightLeg.rotation.x = 0;
      } else {
        if (!this.hasCompleted) {
          this.hasCompleted = true;
          if (this.onComplete) this.onComplete();
        }
      }
    }
  }

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
  // 2. AVATAR STATE MACHINE & CONTINUOUS FRAME TICK
  // ==========================================================================
  function setAvatarState(state) {
    if (currentAvatarState === state) return;
    currentAvatarState = state;

    const stage = document.getElementById('avatar-stage');
    if (stage) {
      stage.classList.remove('state-home', 'state-chi_sono', 'state-esperienze', 'state-contatti');
      stage.classList.add(`state-${state}`);
    }

    if (!skinViewer) return;

    // Reset arm/leg rotations smoothly before switching animation
    if (skinViewer.playerObject && skinViewer.playerObject.skin) {
      const s = skinViewer.playerObject.skin;
      s.leftArm.rotation.x = 0;
      s.rightArm.rotation.x = 0;
      s.leftArm.rotation.z = 0;
      s.rightArm.rotation.z = 0;
      s.leftLeg.rotation.x = 0;
      s.rightLeg.rotation.x = 0;
    }

    switch (state) {
      case 'home':
        targetPlayerRotY = 0;
        skinViewer.animation = new skinview3d.IdleAnimation();
        skinViewer.animation.speed = 0.8;
        break;

      case 'chi_sono':
        // Avatar shifts to right, turns 3/4 toward text on left, waving with right arm
        targetPlayerRotY = -0.65;
        skinViewer.animation = new WaveAnimation();
        break;

      case 'esperienze':
        // Avatar shifts to left, walking in place slowly, looking toward cards on right
        targetPlayerRotY = 0.65;
        const walk = new skinview3d.WalkingAnimation();
        walk.speed = 0.45;
        skinViewer.animation = walk;
        break;

      case 'contatti':
        // Back to center, facing front, short wave then idle
        targetPlayerRotY = 0;
        skinViewer.animation = new ShortWaveThenIdleAnimation(() => {
          if (currentAvatarState === 'contatti' && skinViewer) {
            skinViewer.animation = new skinview3d.IdleAnimation();
            skinViewer.animation.speed = 0.8;
          }
        });
        break;
    }
  }

  function updateViewerSize() {
    if (!skinViewer) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    isMobile = w <= 768;
    skinViewer.width = w;
    skinViewer.height = h;

    // On mobile keep avatar smaller, on desktop giant (~80vh tall)
    if (isMobile) {
      skinViewer.zoom = 0.6;
    } else {
      skinViewer.zoom = 1.05;
    }
  }

  function avatarFrameTick() {
    if (!document.hidden && skinViewer && skinViewer.playerObject) {
      // Smooth lerp on player.rotation.y (NEVER move the camera)
      skinViewer.playerObject.rotation.y += (targetPlayerRotY - skinViewer.playerObject.rotation.y) * 0.06;

      // Smooth lerp on head rotation (adds subtle cursor following)
      if (skinViewer.playerObject.skin && skinViewer.playerObject.skin.head) {
        const head = skinViewer.playerObject.skin.head;
        head.rotation.y += (targetHeadY - head.rotation.y) * 0.08;
        head.rotation.x += (targetHeadX - head.rotation.x) * 0.08;
      }
    }

    requestAnimationFrame(avatarFrameTick);
  }

  function initAvatar() {
    const canvas = document.getElementById('avatar-canvas');
    const fallbackImg = document.getElementById('avatar-fallback');

    function showFallback() {
      if (canvas) canvas.style.display = 'none';
      if (fallbackImg) fallbackImg.style.display = 'block';
    }

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

      skinViewer.controls.enabled = false;
      skinViewer.autoRotate = false; // Rotation controlled smoothly via state machine lerp

      // Initial state: home idle breathing
      skinViewer.animation = new skinview3d.IdleAnimation();
      skinViewer.animation.speed = 0.8;

      updateViewerSize();

      // Track mouse across screen for head following
      window.addEventListener('mousemove', (e) => {
        const halfW = window.innerWidth / 2;
        const halfH = window.innerHeight / 2;
        const normX = (e.clientX - halfW) / halfW;
        const normY = (e.clientY - halfH) / halfH;

        targetHeadY = -normX * 0.55;
        targetHeadX = normY * 0.35;
      }, { passive: true });

      // Start continuous lerp RAF loop
      avatarFrameTick();

      // Resize
      window.addEventListener('resize', updateViewerSize, { passive: true });

      // Pause rendering when tab hidden
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
  // 3. CANVAS STARS (~60 Tiny Twinkling Stars)
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
      if (!document.hidden) {
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
      }

      requestAnimationFrame(renderStars);
    }

    requestAnimationFrame(renderStars);

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
  // 4. NAVIGATION, UNDERLINE INDICATOR, i18n & SCROLL-SNAP INTERSECTIONOBSERVER
  // ==========================================================================
  function updateNavIndicator(activeId) {
    const navIndicator = document.getElementById('nav-indicator');
    const activeLink = document.querySelector(`.nav-link[href="#${activeId}"]`);
    if (!navIndicator || !activeLink) return;

    const left = activeLink.offsetLeft;
    const width = activeLink.offsetWidth;

    navIndicator.style.transform = `translateX(${left}px)`;
    navIndicator.style.width = `${width}px`;

    document.querySelectorAll('.nav-link').forEach((link) => {
      if (link === activeLink) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    document.querySelectorAll('.mobile-link').forEach((link) => {
      if (link.getAttribute('href') === `#${activeId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

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

    // Update nav indicator position after text changes
    setTimeout(() => updateNavIndicator(activeSectionId), 50);
  }

  function initSectionObserver() {
    const scrollContainer = document.getElementById('scroll-container');
    const sections = document.querySelectorAll('.snap-section');

    if (!sections.length) return;

    // Use IntersectionObserver with threshold 0.6 as specified
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSectionId = entry.target.id;
          entry.target.classList.add('section-active');
          setAvatarState(activeSectionId);
          updateNavIndicator(activeSectionId);
        } else {
          entry.target.classList.remove('section-active');
        }
      });
    }, {
      root: scrollContainer,
      threshold: 0.6
    });

    sections.forEach((sec) => observer.observe(sec));

    // Nav Links smooth scroll click
    document.querySelectorAll('.nav-link, .mobile-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
          e.preventDefault();
          const targetSec = document.querySelector(targetId);
          if (targetSec) {
            targetSec.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });

    // Experience Card Mouse Spotlight (--mx, --my)
    document.querySelectorAll('.card-minimal').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });
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

    // Initial Indicator update
    updateNavIndicator(activeSectionId);
    window.addEventListener('resize', () => updateNavIndicator(activeSectionId), { passive: true });

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
          audio.play().catch(() => {});
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
    initSectionObserver();
  });

})();
