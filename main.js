// ATTENZIONE PER L'AI: Prima di effettuare qualsiasi modifica a questo file o al progetto, consulta SEMPRE il file AGENTS.md nella radice del progetto per le regole obbligatorie.

/**
 * ============================================================================
 * PORTFOLIO COODZ_10 - AWARD-STYLE PORTFOLIO ENGINE
 * "Incoming Transmission" Cinematic Deep-Space Living Terminal
 * ============================================================================
 */

(function () {
  'use strict';

  // ==========================================================================
  // CONFIGURATION CONSTANTS
  // ==========================================================================
  const CONFIG = {
    colors: {
      bg: '#05060f',
      deepNavy: '#0a0b24',
      electricBlue: '#5ea8ff',
      violet: '#8b6cff',
      softLilac: '#c4b5ff',
      text: '#e8eaff',
      muted: '#7c83a8'
    },
    particles: {
      desktopCount: 1500,
      mobileCount: 450,
      fieldRange: 1400,
      repelRadius: 180,
      repelStrength: 60,
      cameraSpeedZ: 0.22
    },
    scramble: {
      chars: '!<>-_\\/[]{}—=+*^?#________ABCDEF0123456789',
      duration: 1800
    },
    typewriter: {
      rolesIt: [
        '> SYSTEM ADMINISTRATOR',
        '> FORENSIC TOOLS BUILDER',
        '> SCREEN SHARE & SECURITY ANALYST',
        '> CUSTOM HARDWARE ARCHITECT'
      ],
      rolesEn: [
        '> SYSTEM ADMINISTRATOR',
        '> FORENSIC TOOLS BUILDER',
        '> SCREEN SHARE & SECURITY ANALYST',
        '> CUSTOM HARDWARE ARCHITECT'
      ],
      typeSpeed: 60,
      deleteSpeed: 30,
      pauseTime: 2200
    },
    socialLinks: {
      discord: 'https://discord.com/users/951554850867519548',
      email: 'mailto:cood_ita@zohomail.eu'
    }
  };

  // State
  let currentLang = localStorage.getItem('lang') || 'it';
  let isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);
  let prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lenisInstance = null;

  // ==========================================================================
  // 1. BOOT SEQUENCE / LOADER (~2.5s, Skippable) + CIRCLE WIPE REVEAL
  // ==========================================================================
  function initBootSequence() {
    const bootScreen = document.getElementById('boot-screen');
    const bootProgressFill = document.getElementById('boot-progress-fill');
    const bootPercent = document.getElementById('boot-percent');
    const bootLines = document.querySelectorAll('.boot-line');
    const skipBtn = document.getElementById('boot-skip-btn');
    const mainApp = document.getElementById('main-app');
    const shockwave = document.getElementById('reveal-shockwave');

    if (!bootScreen || !mainApp) return;

    // Check if user has entered this session
    const hasEntered = sessionStorage.getItem('coodz_transmission_synced') === 'true';

    let progress = 0;
    let isFinished = false;
    let timer = null;

    function finishBoot() {
      if (isFinished) return;
      isFinished = true;
      if (timer) clearInterval(timer);

      sessionStorage.setItem('coodz_transmission_synced', 'true');

      if (bootProgressFill) bootProgressFill.style.width = '100%';
      if (bootPercent) bootPercent.textContent = '100%';
      bootLines.forEach(l => l.classList.add('visible'));

      // Trigger Shockwave & Cinematic circular wipe reveal
      setTimeout(() => {
        if (shockwave) shockwave.classList.add('active');
        mainApp.classList.add('circle-wipe-in');
        bootScreen.classList.add('boot-revealed');

        setTimeout(() => {
          bootScreen.style.display = 'none';
        }, 800);

        triggerHeroIntro();

        if (window.audioPlayer && !window.audioPlayer.isPlaying) {
          window.audioPlayer.play();
        }
      }, 350);
    }

    if (hasEntered) {
      bootScreen.style.display = 'none';
      mainApp.classList.add('circle-wipe-in');
      mainApp.style.clipPath = 'none';
      triggerHeroIntro();
      return;
    }

    // Type out lines progressively
    setTimeout(() => { if (bootLines[0]) bootLines[0].classList.add('visible'); }, 300);
    setTimeout(() => { if (bootLines[1]) bootLines[1].classList.add('visible'); }, 950);
    setTimeout(() => { if (bootLines[2]) bootLines[2].classList.add('visible'); }, 1700);

    // Progress counter 0 -> 100%
    const duration = 2400;
    const intervalTime = 30;
    const increment = 100 / (duration / intervalTime);

    timer = setInterval(() => {
      progress += increment;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
        setTimeout(finishBoot, 200);
      }
      if (bootProgressFill) bootProgressFill.style.width = `${Math.floor(progress)}%`;
      if (bootPercent) bootPercent.textContent = `${Math.floor(progress)}%`;
    }, intervalTime);

    if (skipBtn) {
      skipBtn.addEventListener('click', finishBoot);
    }

    window.addEventListener('keydown', (e) => {
      if (!isFinished && (e.key === 'Escape' || e.key === ' ')) {
        finishBoot();
      }
    }, { once: true });
  }

  // ==========================================================================
  // 2. BACKGROUND (THREE.JS 3D PARTICLE FIELD / CONSTELLATION)
  // ==========================================================================
  let bgRenderer, bgScene, bgCamera, bgParticles, bgPositions, bgOriginalPositions;
  let bgMouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let bgScroll = { current: 0, target: 0 };
  let isTabVisible = true;

  function initThreeBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    try {
      const width = window.innerWidth;
      const height = window.innerHeight;

      bgScene = new THREE.Scene();
      bgScene.fog = new THREE.FogExp2(0x05060f, 0.00085);

      bgCamera = new THREE.PerspectiveCamera(65, width / height, 1, 3200);
      bgCamera.position.z = 700;

      bgRenderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: !isMobile,
        powerPreference: 'high-performance'
      });
      bgRenderer.setSize(width, height);
      bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Build Soft Particle Sprite via Offscreen 2D Canvas
      const spriteCanvas = document.createElement('canvas');
      spriteCanvas.width = 64;
      spriteCanvas.height = 64;
      const ctx = spriteCanvas.getContext('2d');
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.25, 'rgba(94, 168, 255, 0.85)');
      grad.addColorStop(0.6, 'rgba(139, 108, 255, 0.35)');
      grad.addColorStop(1, 'rgba(10, 11, 36, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      const texture = new THREE.CanvasTexture(spriteCanvas);

      // Particle Geometry & Colors
      const particleCount = isMobile ? CONFIG.particles.mobileCount : CONFIG.particles.desktopCount;
      const geometry = new THREE.BufferGeometry();
      bgPositions = new Float32Array(particleCount * 3);
      bgOriginalPositions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      const color1 = new THREE.Color(CONFIG.colors.electricBlue);
      const color2 = new THREE.Color(CONFIG.colors.violet);
      const color3 = new THREE.Color(CONFIG.colors.softLilac);

      const range = CONFIG.particles.fieldRange;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const x = (Math.random() - 0.5) * range * 1.8;
        const y = (Math.random() - 0.5) * range * 1.2;
        const z = (Math.random() - 0.5) * range * 1.8;

        bgPositions[i3] = x;
        bgPositions[i3 + 1] = y;
        bgPositions[i3 + 2] = z;

        bgOriginalPositions[i3] = x;
        bgOriginalPositions[i3 + 1] = y;
        bgOriginalPositions[i3 + 2] = z;

        // Gradient color blending
        const ratio = Math.random();
        let c = color1.clone();
        if (ratio < 0.4) {
          c = color1.clone().lerp(color2, ratio / 0.4);
        } else {
          c = color2.clone().lerp(color3, (ratio - 0.4) / 0.6);
        }

        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: isMobile ? 5 : 7,
        map: texture,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });

      bgParticles = new THREE.Points(geometry, material);
      bgScene.add(bgParticles);

      // Mouse Parallax Tracking
      window.addEventListener('mousemove', (e) => {
        bgMouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
        bgMouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
      }, { passive: true });

      // Window Resize
      window.addEventListener('resize', onThreeResize, { passive: true });

      // Tab visibility pause to save frame budget & battery
      document.addEventListener('visibilitychange', () => {
        isTabVisible = !document.hidden;
      });

      // Start RAF Loop
      renderThreeFrame();
    } catch (err) {
      console.warn('WebGL initialization fallback:', err);
    }
  }

  function onThreeResize() {
    if (!bgCamera || !bgRenderer) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    isMobile = w <= 768;
    bgCamera.aspect = w / h;
    bgCamera.updateProjectionMatrix();
    bgRenderer.setSize(w, h);
  }

  function renderThreeFrame() {
    requestAnimationFrame(renderThreeFrame);

    if (!isTabVisible || !bgRenderer || !bgScene || !bgCamera) return;

    if (!prefersReducedMotion) {
      // Smooth mouse lerp
      bgMouse.x += (bgMouse.targetX - bgMouse.x) * 0.05;
      bgMouse.y += (bgMouse.targetY - bgMouse.y) * 0.05;

      // Parallax camera sway
      bgCamera.position.x += (bgMouse.x * 90 - bgCamera.position.x) * 0.04;
      bgCamera.position.y += (bgMouse.y * 70 - bgCamera.position.y) * 0.04;

      // Camera flight forward with scroll
      const scrollY = window.scrollY || window.pageYOffset || 0;
      bgScroll.target = scrollY * CONFIG.particles.cameraSpeedZ;
      bgScroll.current += (bgScroll.target - bgScroll.current) * 0.08;

      bgCamera.position.z = 700 - (bgScroll.current % 1400);

      // Constellation rotation
      if (bgParticles) {
        bgParticles.rotation.y += 0.0004;
        bgParticles.rotation.x += 0.0002;

        // Particle repulsion from cursor
        if (!isMobile && bgPositions && bgOriginalPositions) {
          const mouseWorldX = bgMouse.x * 500;
          const mouseWorldY = bgMouse.y * 350;
          const repelDistSq = CONFIG.particles.repelRadius * CONFIG.particles.repelRadius;

          const posAttr = bgParticles.geometry.attributes.position;
          const posArray = posAttr.array;
          const origArray = bgOriginalPositions;
          const count = posArray.length / 3;

          for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const px = posArray[i3];
            const py = posArray[i3 + 1];
            const ox = origArray[i3];
            const oy = origArray[i3 + 1];

            const dx = px - mouseWorldX;
            const dy = py - mouseWorldY;
            const d2 = dx * dx + dy * dy;

            if (d2 < repelDistSq && d2 > 0) {
              const dist = Math.sqrt(d2);
              const force = (1 - dist / CONFIG.particles.repelRadius) * CONFIG.particles.repelStrength;
              posArray[i3] += (dx / dist) * force;
              posArray[i3 + 1] += (dy / dist) * force;
            } else {
              posArray[i3] += (ox - px) * 0.06;
              posArray[i3 + 1] += (oy - py) * 0.06;
            }
          }
          posAttr.needsUpdate = true;
        }
      }
    }

    bgCamera.lookAt(bgScene.position);
    bgRenderer.render(bgScene, bgCamera);
  }

  // ==========================================================================
  // 3. HERO: TEXT SCRAMBLE / DECRYPT + TYPEWRITER + LIVE CLOCK
  // ==========================================================================
  class TextScrambler {
    constructor(element) {
      this.el = element;
      this.chars = CONFIG.scramble.chars;
      this.frame = 0;
      this.queue = [];
      this.frameRequest = null;
      this.resolve = null;
      this.update = this.update.bind(this);
    }

    setText(newText) {
      const oldText = this.el.innerText;
      const length = Math.max(oldText.length, newText.length);
      const promise = new Promise((resolve) => (this.resolve = resolve));
      this.queue = [];

      for (let i = 0; i < length; i++) {
        const from = oldText[i] || '';
        const to = newText[i] || '';
        const start = Math.floor(Math.random() * 25);
        const end = start + Math.floor(Math.random() * 25) + 10;
        this.queue.push({ from, to, start, end, char: '' });
      }

      cancelAnimationFrame(this.frameRequest);
      this.frame = 0;
      this.update();
      return promise;
    }

    update() {
      let output = '';
      let complete = 0;

      for (let i = 0, n = this.queue.length; i < n; i++) {
        let { from, to, start, end, char } = this.queue[i];
        if (this.frame >= end) {
          complete++;
          output += to;
        } else if (this.frame >= start) {
          if (!char || Math.random() < 0.28) {
            char = this.chars[Math.floor(Math.random() * this.chars.length)];
            this.queue[i].char = char;
          }
          output += `<span style="color:var(--electric-blue);">${char}</span>`;
        } else {
          output += from;
        }
      }

      this.el.innerHTML = output;

      if (complete === this.queue.length) {
        if (this.resolve) this.resolve();
      } else {
        this.frameRequest = requestAnimationFrame(this.update);
        this.frame++;
      }
    }
  }

  let heroScrambler = null;

  function triggerHeroIntro() {
    const heroTitle = document.getElementById('hero-title');
    if (!heroTitle) return;

    if (!heroScrambler) {
      heroScrambler = new TextScrambler(heroTitle);
    }

    heroScrambler.setText('coodz_10');

    // Scramble on hover
    heroTitle.addEventListener('mouseenter', () => {
      heroTitle.classList.add('glitching');
      heroScrambler.setText('coodz_10').then(() => {
        heroTitle.classList.remove('glitching');
      });
    });
  }

  // Typewriter
  function initTypewriter() {
    const typeTarget = document.getElementById('typewriter-text');
    if (!typeTarget) return;

    let roles = currentLang === 'it' ? CONFIG.typewriter.rolesIt : CONFIG.typewriter.rolesEn;
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function tick() {
      roles = currentLang === 'it' ? CONFIG.typewriter.rolesIt : CONFIG.typewriter.rolesEn;
      const currentRole = roles[roleIndex];

      if (isDeleting) {
        charIndex--;
        typeTarget.textContent = currentRole.substring(0, charIndex);
      } else {
        charIndex++;
        typeTarget.textContent = currentRole.substring(0, charIndex);
      }

      let speed = isDeleting ? CONFIG.typewriter.deleteSpeed : CONFIG.typewriter.typeSpeed;

      if (!isDeleting && charIndex === currentRole.length) {
        speed = CONFIG.typewriter.pauseTime;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        speed = 400;
      }

      setTimeout(tick, speed);
    }

    tick();
  }

  // Live Clock (UTC+1 Rome)
  function initLiveClock() {
    const clockEl = document.getElementById('live-clock');
    if (!clockEl) return;

    function updateTime() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      clockEl.textContent = `${hours}:${minutes}:${seconds} UTC+1`;
    }

    updateTime();
    setInterval(updateTime, 1000);
  }

  // Magnetic Button Effect
  function initMagneticButtons() {
    if (isMobile) return;

    const magneticElements = document.querySelectorAll('.btn-magnetic');

    magneticElements.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0px, 0px)';
        btn.style.transition = 'transform 0.5s var(--ease-expo)';
        setTimeout(() => {
          btn.style.transition = '';
        }, 500);
      });
    });
  }

  // ==========================================================================
  // 4. CUSTOM CURSOR
  // ==========================================================================
  function initCustomCursor() {
    if (isMobile) return;

    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    const label = document.querySelector('.cursor-label');

    if (!dot || !ring) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    }, { passive: true });

    function renderCursor() {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;

      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(renderCursor);
    }
    renderCursor();

    // Hover detection for interactive elements
    const hoverTargets = document.querySelectorAll('a, button, .experience-card, .system-card, .contact-row');

    hoverTargets.forEach((target) => {
      target.addEventListener('mouseenter', () => {
        document.body.classList.add('cursor-hover');
        const customText = target.getAttribute('data-cursor') || (currentLang === 'it' ? 'APRI' : 'OPEN');
        if (label) label.textContent = customText;
      });

      target.addEventListener('mouseleave', () => {
        document.body.classList.remove('cursor-hover');
        if (label) label.textContent = '';
      });
    });
  }

  // ==========================================================================
  // 5. FIXED NAVIGATION & ACTIVE INDICATOR
  // ==========================================================================
  function initNavigation() {
    const navHud = document.querySelector('.nav-hud');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id], header[id]');

    // Scroll progress bar
    const scrollBar = document.getElementById('global-scroll-progress');

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY || window.pageYOffset;
      if (scrollY > 50) {
        navHud.classList.add('scrolled');
      } else {
        navHud.classList.remove('scrolled');
      }

      if (scrollBar) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? scrollY / docHeight : 0;
        scrollBar.style.transform = `scaleX(${progress})`;
      }

      // Highlight active section
      let currentSection = '';
      sections.forEach((sec) => {
        const top = sec.offsetTop - 200;
        const height = sec.offsetHeight;
        if (scrollY >= top && scrollY < top + height) {
          currentSection = sec.getAttribute('id');
        }
      });

      if (currentSection) {
        navLinks.forEach((link) => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
          }
        });
      }
    }, { passive: true });

    // Smooth navigation click
    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
          e.preventDefault();
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            if (lenisInstance) {
              lenisInstance.scrollTo(targetEl, { offset: -60, duration: 1.2 });
            } else {
              targetEl.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }
      });
    });

    // Mobile nav toggle
    const toggleBtn = document.getElementById('nav-mobile-toggle-btn');
    const mobileOverlay = document.getElementById('mobile-nav-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    if (toggleBtn && mobileOverlay) {
      toggleBtn.addEventListener('click', () => {
        mobileOverlay.classList.toggle('open');
        const isOpen = mobileOverlay.classList.contains('open');
        toggleBtn.textContent = isOpen ? '[ × ]' : '[ ☰ ]';
      });

      mobileLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
          mobileOverlay.classList.remove('open');
          toggleBtn.textContent = '[ ☰ ]';
          const targetId = link.getAttribute('href');
          if (targetId && targetId.startsWith('#')) {
            e.preventDefault();
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
              if (lenisInstance) {
                lenisInstance.scrollTo(targetEl, { offset: -60, duration: 1.2 });
              } else {
                targetEl.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }
        });
      });
    }
  }

  // ==========================================================================
  // 6. CHI_SONO: WORD-BY-WORD SCROLL REVEAL & 3D TILT
  // ==========================================================================
  function initAboutSection() {
    // 3D Tilt for System Info Card
    const card = document.querySelector('.system-card');
    if (card && !isMobile) {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty('--mx', `${x}px`);
        card.style.setProperty('--my', `${y}px`);

        const rotateX = ((y / rect.height) - 0.5) * -12;
        const rotateY = ((x / rect.width) - 0.5) * 12;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });
    }

    // Split words in paragraphs while preserving highlight spans and structure
    function splitWordsPreservingHighlights(container) {
      if (!container) return;
      const paragraphs = container.querySelectorAll('.about-p');
      paragraphs.forEach((p) => {
        const childNodes = Array.from(p.childNodes);
        p.innerHTML = '';
        childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const words = node.textContent.split(/\s+/).filter(Boolean);
            words.forEach((w) => {
              const span = document.createElement('span');
              span.className = 'word';
              span.textContent = w + ' ';
              p.appendChild(span);
            });
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const isHighlight = node.classList.contains('about-highlight');
            const words = node.textContent.split(/\s+/).filter(Boolean);
            words.forEach((w) => {
              const span = document.createElement('span');
              span.className = isHighlight ? 'word highlight' : 'word';
              span.textContent = w + ' ';
              p.appendChild(span);
            });
          }
        });
      });
    }

    document.querySelectorAll('.about-statement-wrap').forEach(splitWordsPreservingHighlights);

    // Scroll reveal illumination using GSAP ScrollTrigger or scroll fallback
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      const words = document.querySelectorAll('.about-statement .word');
      if (words.length > 0) {
        gsap.to(words, {
          scrollTrigger: {
            trigger: '#chi_sono .about-statement',
            start: 'top 75%',
            end: 'bottom 60%',
            scrub: 0.6
          },
          opacity: 1,
          stagger: 0.015,
          ease: 'power2.out'
        });
      }
    } else {
      window.addEventListener('scroll', () => {
        const words = document.querySelectorAll('.about-statement .word');
        const trigger = window.innerHeight * 0.8;
        words.forEach((w) => {
          const rect = w.getBoundingClientRect();
          if (rect.top < trigger) {
            w.classList.add('lit');
          }
        });
      }, { passive: true });
    }

    // Animated Counters
    const statBoxes = document.querySelectorAll('.stat-number');
    let countersStarted = false;

    function startCounters() {
      if (countersStarted) return;
      countersStarted = true;

      statBoxes.forEach((box) => {
        const target = parseInt(box.getAttribute('data-target'), 10) || 0;
        const suffix = box.getAttribute('data-suffix') || '';
        let count = 0;
        const duration = 2000;
        const stepTime = 30;
        const totalSteps = duration / stepTime;
        const stepIncrement = target / totalSteps;

        const counterTimer = setInterval(() => {
          count += stepIncrement;
          if (count >= target) {
            count = target;
            clearInterval(counterTimer);
          }
          box.textContent = `${Math.floor(count)}${suffix}`;
        }, stepTime);
      });
    }

    const statsContainer = document.querySelector('.stats-grid');
    if (statsContainer) {
      const obs = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          startCounters();
          obs.disconnect();
        }
      }, { threshold: 0.3 });
      obs.observe(statsContainer);
    }
  }

  // ==========================================================================
  // 7. ESPERIENZE: PINNED HORIZONTAL SCROLL + SPOTLIGHT BORDER + TILT
  // ==========================================================================
  function initExperiencesSection() {
    const section = document.querySelector('.experiences-section');
    const track = document.querySelector('.experiences-track');
    const cards = document.querySelectorAll('.experience-card');
    const progressFill = document.querySelector('.track-progress-fill');

    if (!section || !track) return;

    // Card Spotlight and 3D Tilt
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty('--mx', `${x}px`);
        card.style.setProperty('--my', `${y}px`);

        if (!isMobile) {
          const rotX = ((y / rect.height) - 0.5) * -10;
          const rotY = ((x / rect.width) - 0.5) * 10;
          card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;
        }
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });

      card.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        const link = card.querySelector('a.bracket-link');
        if (link && link.href) {
          window.location.href = link.href;
        }
      });
    });

    // GSAP ScrollTrigger Pinned Horizontal Scroll
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !isMobile) {
      gsap.registerPlugin(ScrollTrigger);

      function calculateScrollAmount() {
        return Math.max(track.scrollWidth - window.innerWidth + 100, 600);
      }

      gsap.to(track, {
        x: () => -calculateScrollAmount(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          start: 'top top',
          end: () => `+=${calculateScrollAmount()}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progressFill) {
              progressFill.style.width = `${self.progress * 100}%`;
            }
          }
        }
      });
    } else {
      // Mobile fallback: horizontal touch scrolling
      track.style.overflowX = 'auto';
      track.style.scrollSnapType = 'x mandatory';
      cards.forEach(c => c.style.scrollSnapAlign = 'start');

      track.addEventListener('scroll', () => {
        const maxScroll = track.scrollWidth - track.clientWidth;
        if (progressFill && maxScroll > 0) {
          progressFill.style.width = `${(track.scrollLeft / maxScroll) * 100}%`;
        }
      }, { passive: true });
    }
  }

  // ==========================================================================
  // 8. CONTATTI: REVERSING MARQUEE + ROW HOVER
  // ==========================================================================
  function initContactSection() {
    const marquee = document.querySelector('.contact-marquee');
    if (!marquee) return;

    let pos = 0;
    let speed = 0.8;
    let lastScrollY = window.scrollY;

    function renderMarquee() {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      if (Math.abs(delta) > 0.5) {
        speed = delta * 0.15;
      } else {
        speed += (0.8 - speed) * 0.05;
      }

      pos -= speed;
      marquee.style.transform = `translateX(${pos % 1000}px)`;

      requestAnimationFrame(renderMarquee);
    }

    renderMarquee();
  }

  // ==========================================================================
  // 9. FOOTER & BACK TO TOP
  // ==========================================================================
  function initFooter() {
    const yearEl = document.getElementById('footer-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }

    const backToTopBtn = document.getElementById('back-to-top-btn');
    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
        if (lenisInstance) {
          lenisInstance.scrollTo(0, { duration: 1.5 });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }

  // ==========================================================================
  // 10. AUDIO SYSTEM (WITH PLAYLIST & EQUALIZER SYNC)
  // ==========================================================================
  class AudioEngine {
    constructor() {
      this.audio = document.getElementById('bg-audio');
      this.playlist = ['music/30C.mp3', 'music/dorado.mp3', 'music/Grinch3.mp3'];
      this.currentIndex = 0;
      this.isPlaying = false;

      this.init();
    }

    async init() {
      if (!this.audio) return;
      this.audio.volume = 0.75;

      try {
        const res = await fetch('music/playlist.json');
        if (res.ok) {
          const data = await res.json();
          if (data && data.tracks && Array.isArray(data.tracks)) {
            this.playlist = data.tracks.map(t => t.startsWith('music/') ? t : `music/${t}`);
            if (data.startTrack) {
              const startIdx = this.playlist.findIndex(t => t.includes(data.startTrack));
              if (startIdx !== -1) this.currentIndex = startIdx;
            }
          }
        }
      } catch (e) {
        // Fallback default
      }

      this.audio.addEventListener('ended', () => {
        this.nextTrack();
      });

      this.audio.addEventListener('play', () => {
        this.isPlaying = true;
        this.updateUI();
      });

      this.audio.addEventListener('pause', () => {
        this.isPlaying = false;
        this.updateUI();
      });

      const toggleBtn = document.getElementById('nav-audio-btn');
      const nextBtn = document.getElementById('nav-audio-next');

      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          this.togglePlay();
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          this.nextTrack();
        });
      }
    }

    play() {
      if (!this.audio) return;
      if (!this.audio.src || !this.audio.src.includes(this.playlist[this.currentIndex])) {
        this.audio.src = this.playlist[this.currentIndex];
      }
      this.audio.play().then(() => {
        this.isPlaying = true;
        this.updateUI();
      }).catch(() => {
        this.isPlaying = false;
        this.updateUI();
      });
    }

    pause() {
      if (!this.audio) return;
      this.audio.pause();
      this.isPlaying = false;
      this.updateUI();
    }

    togglePlay() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    }

    nextTrack() {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
      if (this.audio) {
        this.audio.src = this.playlist[this.currentIndex];
        this.play();
      }
    }

    updateUI() {
      const toggleBtn = document.getElementById('nav-audio-btn');
      if (toggleBtn) {
        if (this.isPlaying) {
          toggleBtn.classList.add('audio-playing');
        } else {
          toggleBtn.classList.remove('audio-playing');
        }
      }
    }
  }

  // ==========================================================================
  // 11. INTERNATIONALIZATION (IT / EN LANGUAGE SWITCH)
  // ==========================================================================
  window.setLanguage = function (lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);

    document.querySelectorAll('.lang-it').forEach((el) => {
      if (lang === 'it') el.classList.remove('hidden-lang');
      else el.classList.add('hidden-lang');
    });

    document.querySelectorAll('.lang-en').forEach((el) => {
      if (lang === 'en') el.classList.remove('hidden-lang');
      else el.classList.add('hidden-lang');
    });

    const btnIt = document.getElementById('lang-btn-it');
    const btnEn = document.getElementById('lang-btn-en');
    if (btnIt && btnEn) {
      if (lang === 'it') {
        btnIt.classList.add('active');
        btnEn.classList.remove('active');
      } else {
        btnEn.classList.add('active');
        btnIt.classList.remove('active');
      }
    }

    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  };

  // ==========================================================================
  // 12. SMOOTH SCROLL (LENIS + GSAP INTEGRATION)
  // ==========================================================================
  function initLenis() {
    if (typeof Lenis === 'undefined' || prefersReducedMotion || isMobile) return;

    lenisInstance = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5
    });

    if (typeof ScrollTrigger !== 'undefined' && typeof gsap !== 'undefined') {
      lenisInstance.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenisInstance.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenisInstance.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }

  // ==========================================================================
  // INITIALIZATION ON DOM READY
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    // Audio Player
    window.audioPlayer = new AudioEngine();

    // Set initial language
    window.setLanguage(currentLang);

    // Boot sequence
    initBootSequence();

    // Three.js Background
    initThreeBackground();

    // Custom Cursor
    initCustomCursor();

    // Typewriter & Clock
    initTypewriter();
    initLiveClock();
    initMagneticButtons();

    // Sections
    initNavigation();
    initAboutSection();
    initExperiencesSection();
    initContactSection();
    initFooter();

    // Smooth scroll
    initLenis();
  });

})();
