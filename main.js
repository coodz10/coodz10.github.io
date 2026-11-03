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
  // CONFIGURATION CONSTANTS (All tunable values)
  // ==========================================================================
  const CONFIG = {
    SKIN_URL: 'assets/skin.png',
    accentBlue: '#5ea8ff',
    accentViolet: '#8b6cff',
    accentLilac: '#c4b5ff',
    bg: '#03040a',
    text: '#e8eaff',
    muted: '#7c83a8',

    // Avatar Sizing & Vertical Placement (~74vh tall: head ~10vh, feet ~84vh, title ~88vh)
    AVATAR_ZOOM_DESKTOP: 0.92, // Desktop camera zoom (~74vh tall, clearly below navbar)
    AVATAR_ZOOM_MOBILE: 0.52,  // Mobile camera zoom (fully visible, proportioned)
    AVATAR_Y_OFFSET: -25,      // Vertical stage nudge in px (top of head ~10vh, feet ~84vh)

    // Avatar Rotations (0 shows front face towards camera; Math.PI turns 180° to back)
    ROT_OFFSET: 0,             // Rotation offset (0 = face toward camera; Math.PI = back)
    ROT_ABOUT: -0.65,          // chi_sono: turns 3/4 toward text on the left
    ROT_EXP: 0.65,             // esperienze: turns 3/4 toward cards on the right

    // Lighting (illuminates dark skin on dark backgrounds)
    GLOBAL_LIGHT: 4.5,         // Global ambient light intensity
    CAMERA_LIGHT: 1.8,         // Directional camera light intensity

    // Display Filters (CSS variables --avatar-contrast, --avatar-brightness)
    AVATAR_CONTRAST: 0.78,     // Lift pure blacks
    AVATAR_BRIGHTNESS: 1.5,    // Brighten dark skin

    // Audio & Playlist
    DEFAULT_VOLUME: 0.4,
    PLAYLIST: [
      { name: 'dorado', src: 'music/dorado.mp3' },
      { name: '30C', src: 'music/30C.mp3' },
      { name: 'Grinch3', src: 'music/Grinch3.mp3' }
    ]
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
  let currentHeadX = 0;
  let currentHeadY = 0;
  let gestureHeadX = 0;
  let gestureHeadY = 0;

  let targetPlayerRotY = 0; // State rotation relative to ROT_OFFSET
  let bonusSpinRotY = 0;    // Dynamic 360-spin offset on click/interaction
  let currentAvatarState = 'home';
  let activeSectionId = 'home';
  let isMobile = window.innerWidth <= 768;

  // Timers and transitions
  let gestureTimer = null;
  let transitionTimer = null;
  let isTransitioning = false;
  let lastHomeGesture = null;

  const HOME_GESTURES = ['wave', 'lookAround', 'stretch', 'headTilt', 'smallHop', 'handsOnHips', 'armsCrossed'];

  function pickRandomGesture(list, last) {
    const pool = list.filter((g) => g !== last);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function clearTimers() {
    if (gestureTimer) clearTimeout(gestureTimer);
    if (transitionTimer) clearTimeout(transitionTimer);
    gestureTimer = null;
    transitionTimer = null;
    gestureHeadX = 0;
    gestureHeadY = 0;
  }

  // ==========================================================================
  // CUSTOM SKINVIEW3D COMPOSITE GESTURE ANIMATION (Half-sine ease-in/out)
  // ==========================================================================
  class CompositeGestureAnimation extends (window.skinview3d ? skinview3d.PlayerAnimation : class {}) {
    constructor(gestureName, onComplete) {
      super();
      this.gestureName = gestureName;
      this.onComplete = onComplete;
      this.hasCompleted = false;

      // Base idle animation running continuously beneath gestures
      this.idleAnim = new skinview3d.IdleAnimation();
      this.idleAnim.speed = 0.8;

      // Gestures duration between 1.4s and 2.4s
      const durations = {
        wave: 2.1,
        lookAround: 2.2,
        stretch: 2.4,
        headTilt: 1.8,
        smallHop: 1.4,
        handsOnHips: 2.2,
        armsCrossed: 2.4,
        pointCards: 2.2
      };
      this.duration = durations[gestureName] || 2.0;
    }

    animate(player) {
      if (!player || !player.skin) return;

      // 1. Maintain underlying idle breathing on chest and limbs
      this.idleAnim.progress = this.progress;
      this.idleAnim.animate(player);

      // 2. Smooth half-sine envelope (0 at start -> 1 at peak -> 0 at finish)
      const t = this.progress / this.duration;
      if (t >= 1) {
        if (!this.hasCompleted) {
          this.hasCompleted = true;
          player.position.y = 0;
          gestureHeadX = 0;
          gestureHeadY = 0;
          player.skin.head.rotation.z = 0;
          if (this.onComplete) setTimeout(this.onComplete, 0);
        }
        return;
      }

      const w = Math.sin(t * Math.PI);

      // 3. Blend specific gesture pose
      switch (this.gestureName) {
        case 'wave': {
          const wave = Math.sin(this.progress * 8) * 0.35;
          player.skin.rightArm.rotation.x = (-Math.PI * 0.85) * w + player.skin.rightArm.rotation.x * (1 - w);
          player.skin.rightArm.rotation.z = (-0.25 + wave) * w + player.skin.rightArm.rotation.z * (1 - w);
          player.skin.rightArm.rotation.y = 0.2 * w;
          break;
        }

        case 'lookAround': {
          gestureHeadY = Math.sin(this.progress * 3.5) * 0.45 * w;
          break;
        }

        case 'stretch': {
          player.skin.rightArm.rotation.x = (-Math.PI * 0.92) * w + player.skin.rightArm.rotation.x * (1 - w);
          player.skin.leftArm.rotation.x = (-Math.PI * 0.92) * w + player.skin.leftArm.rotation.x * (1 - w);
          player.skin.rightArm.rotation.z = 0.25 * w + player.skin.rightArm.rotation.z * (1 - w);
          player.skin.leftArm.rotation.z = -0.25 * w + player.skin.leftArm.rotation.z * (1 - w);
          gestureHeadX = -0.22 * w;
          break;
        }

        case 'headTilt': {
          player.skin.head.rotation.z = Math.sin(this.progress * 3.5) * 0.32 * w;
          break;
        }

        case 'smallHop': {
          player.position.y = Math.sin(t * Math.PI) * 4.0;
          player.skin.leftLeg.rotation.x = -0.35 * w;
          player.skin.rightLeg.rotation.x = -0.35 * w;
          break;
        }

        case 'handsOnHips': {
          player.skin.leftArm.rotation.x = -0.25 * w + player.skin.leftArm.rotation.x * (1 - w);
          player.skin.leftArm.rotation.z = -0.55 * w + player.skin.leftArm.rotation.z * (1 - w);
          player.skin.leftArm.rotation.y = -0.2 * w;
          player.skin.rightArm.rotation.x = -0.25 * w + player.skin.rightArm.rotation.x * (1 - w);
          player.skin.rightArm.rotation.z = 0.55 * w + player.skin.rightArm.rotation.z * (1 - w);
          player.skin.rightArm.rotation.y = 0.2 * w;
          break;
        }

        case 'armsCrossed': {
          player.skin.leftArm.rotation.x = (-Math.PI * 0.45) * w + player.skin.leftArm.rotation.x * (1 - w);
          player.skin.leftArm.rotation.z = 0.45 * w + player.skin.leftArm.rotation.z * (1 - w);
          player.skin.rightArm.rotation.x = (-Math.PI * 0.45) * w + player.skin.rightArm.rotation.x * (1 - w);
          player.skin.rightArm.rotation.z = -0.45 * w + player.skin.rightArm.rotation.z * (1 - w);
          break;
        }

        case 'pointCards': {
          player.skin.rightArm.rotation.x = (-Math.PI * 0.55) * w + player.skin.rightArm.rotation.x * (1 - w);
          player.skin.rightArm.rotation.y = -0.38 * w;
          player.skin.rightArm.rotation.z = 0.28 * w + player.skin.rightArm.rotation.z * (1 - w);
          break;
        }
      }
    }
  }

  function playGesture(gestureName, onComplete) {
    if (!skinViewer) return;
    skinViewer.animation = new CompositeGestureAnimation(gestureName, () => {
      if (onComplete) onComplete();
    });
  }

  // ==========================================================================
  // GESTURE SCHEDULERS FOR SECTIONS
  // ==========================================================================
  function scheduleHomeGesture() {
    clearTimeout(gestureTimer);
    if (currentAvatarState !== 'home' || isTransitioning) return;
    const delay = Math.random() * 4000 + 5000; // Random interval 5-9 seconds
    gestureTimer = setTimeout(() => {
      if (currentAvatarState !== 'home' || isTransitioning) return;
      const g = pickRandomGesture(HOME_GESTURES, lastHomeGesture);
      lastHomeGesture = g;
      playGesture(g, () => {
        if (currentAvatarState === 'home' && !isTransitioning && skinViewer) {
          skinViewer.animation = new skinview3d.IdleAnimation();
          skinViewer.animation.speed = 0.8;
          scheduleHomeGesture();
        }
      });
    }, delay);
  }

  function scheduleChiSonoHeadTilt() {
    clearTimeout(gestureTimer);
    if (currentAvatarState !== 'chi_sono' || isTransitioning) return;
    const delay = Math.random() * 3000 + 6000; // Occasional head tilt 6-9 seconds
    gestureTimer = setTimeout(() => {
      if (currentAvatarState !== 'chi_sono' || isTransitioning) return;
      playGesture('headTilt', () => {
        if (currentAvatarState === 'chi_sono' && !isTransitioning && skinViewer) {
          skinViewer.animation = new skinview3d.IdleAnimation();
          skinViewer.animation.speed = 0.8;
          scheduleChiSonoHeadTilt();
        }
      });
    }, delay);
  }

  function scheduleEsperienzePoint() {
    clearTimeout(gestureTimer);
    if (currentAvatarState !== 'esperienze' || isTransitioning) return;
    const delay = Math.random() * 3000 + 6000; // Occasional stop & point 6-9 seconds
    gestureTimer = setTimeout(() => {
      if (currentAvatarState !== 'esperienze' || isTransitioning) return;
      playGesture('pointCards', () => {
        if (currentAvatarState === 'esperienze' && !isTransitioning && skinViewer) {
          const walk = new skinview3d.WalkingAnimation();
          walk.speed = 0.45;
          walk.headBobbing = false;
          skinViewer.animation = walk;
          scheduleEsperienzePoint();
        }
      });
    }, delay);
  }

  function scheduleContattiGesture() {
    clearTimeout(gestureTimer);
    if (currentAvatarState !== 'contatti' || isTransitioning) return;
    const delay = Math.random() * 4000 + 5000; // Random idle gestures 5-9 seconds
    gestureTimer = setTimeout(() => {
      if (currentAvatarState !== 'contatti' || isTransitioning) return;
      const g = pickRandomGesture(HOME_GESTURES, lastHomeGesture);
      lastHomeGesture = g;
      playGesture(g, () => {
        if (currentAvatarState === 'contatti' && !isTransitioning && skinViewer) {
          skinViewer.animation = new skinview3d.IdleAnimation();
          skinViewer.animation.speed = 0.8;
          scheduleContattiGesture();
        }
      });
    }, delay);
  }

  // ==========================================================================
  // SECTION POSE ACTIVATOR
  // ==========================================================================
  function activateSectionPose(state) {
    if (!skinViewer) return;

    // Reset arm, leg, and head rotations smoothly before starting section pose
    if (skinViewer.playerObject && skinViewer.playerObject.skin) {
      const s = skinViewer.playerObject.skin;
      s.leftArm.rotation.x = 0;
      s.rightArm.rotation.x = 0;
      s.leftArm.rotation.y = 0;
      s.rightArm.rotation.y = 0;
      s.leftArm.rotation.z = 0;
      s.rightArm.rotation.z = 0;
      s.leftLeg.rotation.x = 0;
      s.rightLeg.rotation.x = 0;
      s.head.rotation.z = 0;
    }
    if (skinViewer.playerObject) {
      skinViewer.playerObject.position.y = 0;
    }

    switch (state) {
      case 'home':
        targetPlayerRotY = 0;
        skinViewer.animation = new skinview3d.IdleAnimation();
        skinViewer.animation.speed = 0.8;
        scheduleHomeGesture();
        break;

      case 'chi_sono':
        // Avatar shifts to right, turns 3/4 toward text on left, initial wave then head tilt
        targetPlayerRotY = CONFIG.ROT_ABOUT;
        playGesture('wave', () => {
          if (currentAvatarState === 'chi_sono' && !isTransitioning && skinViewer) {
            skinViewer.animation = new skinview3d.IdleAnimation();
            skinViewer.animation.speed = 0.8;
            scheduleChiSonoHeadTilt();
          }
        });
        break;

      case 'esperienze':
        // Avatar shifts to left, walking in place, turns 3/4 toward cards on right
        targetPlayerRotY = CONFIG.ROT_EXP;
        const walk = new skinview3d.WalkingAnimation();
        walk.speed = 0.45;
        walk.headBobbing = false;
        skinViewer.animation = walk;
        scheduleEsperienzePoint();
        break;

      case 'contatti':
        // Back to center, facing front, short wave then random gestures
        targetPlayerRotY = 0;
        playGesture('wave', () => {
          if (currentAvatarState === 'contatti' && !isTransitioning && skinViewer) {
            skinViewer.animation = new skinview3d.IdleAnimation();
            skinViewer.animation.speed = 0.8;
            scheduleContattiGesture();
          }
        });
        break;
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

      // Smooth scroll to target hash if arriving with an anchor (e.g. #esperienze)
      if (window.location.hash) {
        const targetSec = document.querySelector(window.location.hash);
        if (targetSec) {
          setTimeout(() => {
            targetSec.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }
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
    if (currentAvatarState === state && skinViewer && skinViewer.animation) return;
    const isStateChange = (currentAvatarState !== state);
    currentAvatarState = state;

    const stage = document.getElementById('avatar-stage');
    if (stage) {
      stage.classList.remove('state-home', 'state-chi_sono', 'state-esperienze', 'state-contatti');
      stage.classList.add(`state-${state}`);
    }

    if (!skinViewer) return;

    clearTimers();

    // Directional rotation for state
    if (state === 'chi_sono') {
      targetPlayerRotY = CONFIG.ROT_ABOUT;
    } else if (state === 'esperienze') {
      targetPlayerRotY = CONFIG.ROT_EXP;
    } else {
      targetPlayerRotY = 0;
    }

    if (isStateChange) {
      // 900ms Section Transition: avatar RUNS while CSS stage moves across viewport
      isTransitioning = true;
      const run = new skinview3d.RunningAnimation();
      run.speed = 1.0;
      run.headBobbing = false;
      skinViewer.animation = run;

      transitionTimer = setTimeout(() => {
        isTransitioning = false;
        activateSectionPose(state);
      }, 900);
    } else {
      activateSectionPose(state);
    }
  }

  function updateViewerSize() {
    if (!skinViewer) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    isMobile = w <= 768;
    skinViewer.width = w;
    skinViewer.height = h;

    // Use configurable zoom from CONFIG (~74vh tall on desktop)
    skinViewer.zoom = isMobile ? CONFIG.AVATAR_ZOOM_MOBILE : CONFIG.AVATAR_ZOOM_DESKTOP;

    const stage = document.getElementById('avatar-stage');
    if (stage) {
      stage.style.setProperty('--avatar-y', `${CONFIG.AVATAR_Y_OFFSET}px`);
    }
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
      skinViewer.autoRotate = false; // Controlled smoothly via continuous per-frame lerp

      // Apply light intensities from CONFIG (illuminates dark skin on dark backgrounds)
      if (skinViewer.globalLight) skinViewer.globalLight.intensity = CONFIG.GLOBAL_LIGHT;
      if (skinViewer.cameraLight) skinViewer.cameraLight.intensity = CONFIG.CAMERA_LIGHT;

      // Ensure CSS filter variables match CONFIG
      document.documentElement.style.setProperty('--avatar-contrast', CONFIG.AVATAR_CONTRAST);
      document.documentElement.style.setProperty('--avatar-brightness', CONFIG.AVATAR_BRIGHTNESS);

      // Initial rotation facing front (ROT_OFFSET = 0)
      if (skinViewer.playerObject) {
        skinViewer.playerObject.rotation.y = CONFIG.ROT_OFFSET;
      }

      updateViewerSize();

      // Hook skinViewer.render to run right after animation.update() and before composer.render().
      // This guarantees cursor head-following and rotation lerp are applied smoothly on every single frame,
      // including in walking and running states and across all gestures.
      const origRender = skinViewer.render.bind(skinViewer);
      skinViewer.render = function () {
        if (skinViewer.playerObject) {
          // Continuous lerp on player.rotation.y (NEVER move the camera)
          // CONFIG.ROT_OFFSET is added inside the per-frame lerp so it cannot be bypassed or overwritten
          const finalTargetRotY = targetPlayerRotY + CONFIG.ROT_OFFSET + bonusSpinRotY;
          skinViewer.playerObject.rotation.y += (finalTargetRotY - skinViewer.playerObject.rotation.y) * 0.08;

          // Smooth lerp on head rotation (cursor follow + gesture offset)
          currentHeadY += (targetHeadY - currentHeadY) * 0.08;
          currentHeadX += (targetHeadX - currentHeadX) * 0.08;

          if (skinViewer.playerObject.skin && skinViewer.playerObject.skin.head) {
            const head = skinViewer.playerObject.skin.head;
            head.rotation.y = gestureHeadY + currentHeadY;
            head.rotation.x = gestureHeadX + currentHeadX;
          }
        }

        origRender();
      };

      // Activate initial pose for active section
      activateSectionPose(activeSectionId || 'home');

      // Track mouse across screen for head following
      window.addEventListener('mousemove', (e) => {
        const halfW = window.innerWidth / 2;
        const halfH = window.innerHeight / 2;
        const normX = (e.clientX - halfW) / halfW;
        const normY = (e.clientY - halfH) / halfH;

        targetHeadY = -normX * 0.55;
        targetHeadX = normY * 0.35;
      }, { passive: true });

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
  // CLICK / TAP INTERACTION (360-degree Spin or Jump Hop)
  // ==========================================================================
  function initAvatarInteraction() {
    let isSpinning = false;

    function triggerSpin() {
      if (isSpinning) return;
      isSpinning = true;
      const startTime = performance.now();
      const duration = 650; // Snappy 360-degree rotation

      function spinStep(now) {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - t, 3); // Ease-out cubic
        bonusSpinRotY = ease * Math.PI * 2;

        if (t < 1) {
          requestAnimationFrame(spinStep);
        } else {
          if (skinViewer && skinViewer.playerObject) {
            skinViewer.playerObject.rotation.y -= Math.PI * 2;
          }
          bonusSpinRotY = 0;
          isSpinning = false;
        }
      }
      requestAnimationFrame(spinStep);
    }

    function triggerJump() {
      playGesture('smallHop', () => {
        if (currentAvatarState === 'home') {
          skinViewer.animation = new skinview3d.IdleAnimation();
          skinViewer.animation.speed = 0.8;
          scheduleHomeGesture();
        } else if (currentAvatarState === 'esperienze') {
          const walk = new skinview3d.WalkingAnimation();
          walk.speed = 0.45;
          walk.headBobbing = false;
          skinViewer.animation = walk;
          scheduleEsperienzePoint();
        } else {
          skinViewer.animation = new skinview3d.IdleAnimation();
          skinViewer.animation.speed = 0.8;
        }
      });
    }

    function handleInteraction(clientX, clientY, target) {
      if (target && target.closest('button, a, input, select, textarea, [role="button"], #opening-screen, .opening-screen, .avatar-debug-panel')) {
        return;
      }
      if (!skinViewer) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let shiftX = 0;
      let shiftY = CONFIG.AVATAR_Y_OFFSET;

      if (currentAvatarState === 'chi_sono') {
        shiftX = vw * 0.22;
        shiftY = CONFIG.AVATAR_Y_OFFSET * 0.8;
      } else if (currentAvatarState === 'esperienze') {
        shiftX = -vw * 0.22;
        shiftY = CONFIG.AVATAR_Y_OFFSET * 0.8;
      }

      const centerX = (vw / 2) + shiftX;
      const centerY = (vh / 2) + shiftY;

      const boxWidth = isMobile ? vw * 0.65 : vh * 0.38;
      const boxHeight = isMobile ? vh * 0.6 : vh * 0.74;

      const dx = Math.abs(clientX - centerX);
      const dy = Math.abs(clientY - centerY);

      if (dx <= boxWidth / 2 && dy <= boxHeight / 2) {
        if (Math.random() > 0.5) {
          triggerSpin();
        } else {
          triggerJump();
        }
      }
    }

    document.addEventListener('click', (e) => {
      handleInteraction(e.clientX, e.clientY, e.target);
    });
  }

  // ==========================================================================
  // 3. CANVAS STARS & CYBER-RAIN WITH SHOOTING STARS (METEORS)
  // ==========================================================================
  function initStars() {
    const canvas = document.getElementById('stars-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let starCount = isMobile ? 65 : 120;
    const stars = [];
    const meteors = [];

    function populateStars() {
      stars.length = 0;
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 0.9 + 0.4,
          baseAlpha: Math.random() * 0.45 + 0.2,
          speedY: Math.random() * 0.3 + 0.2, // Slow vertical drift (0.2..0.5 px/frame for light cyber-rain)
          speedX: (Math.random() - 0.5) * 0.06,
          twinkleSpeed: Math.random() * 1.6 + 0.8,
          phase: Math.random() * Math.PI * 2,
          color: Math.random() > 0.4 ? '#e8eaff' : (Math.random() > 0.5 ? '#5ea8ff' : '#c4b5ff')
        });
      }
    }

    populateStars();

    function renderStatic() {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.baseAlpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    if (prefersReducedMotion) {
      renderStatic();
      return;
    }

    let nextMeteorTime = performance.now() + (Math.random() * 3000 + 2000); // 2-5 seconds

    function spawnMeteor() {
      const angleDeg = Math.random() * 15 + 30; // 30-45 degrees angle
      const angleRad = (angleDeg * Math.PI) / 180;
      const speed = Math.random() * 8 + 10;
      const len = Math.random() * 70 + 60;

      meteors.push({
        x: Math.random() * width * 0.9 + width * 0.1,
        y: Math.random() * (height * 0.4),
        vx: -Math.cos(angleRad) * speed,
        vy: Math.sin(angleRad) * speed,
        len: len,
        angleRad: angleRad,
        alpha: 1.0,
        decay: Math.random() * 0.012 + 0.015
      });
    }

    let startTime = performance.now();

    function renderStars(now) {
      if (!document.hidden) {
        const elapsed = (now - startTime) / 1000;
        ctx.clearRect(0, 0, width, height);

        // 1. Draw and drift stars
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          s.y += s.speedY;
          s.x += s.speedX;

          if (s.y > height) {
            s.y = 0;
            s.x = Math.random() * width;
          }
          if (s.x < 0) s.x = width;
          if (s.x > width) s.x = 0;

          const twinkle = Math.sin(elapsed * s.twinkleSpeed + s.phase) * 0.25;
          const alpha = Math.min(1, Math.max(0.12, s.baseAlpha + twinkle));

          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = alpha;
          ctx.fill();
        }

        // 2. Spawn and render shooting stars (meteors)
        if (now >= nextMeteorTime) {
          spawnMeteor();
          nextMeteorTime = now + (Math.random() * 3000 + 2000); // 2-5s
        }

        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.x += m.vx;
          m.y += m.vy;
          m.alpha -= m.decay;

          if (m.alpha <= 0 || m.y > height + 100 || m.x < -100) {
            meteors.splice(i, 1);
            continue;
          }

          const tailX = m.x - Math.cos(m.angleRad) * (-m.len);
          const tailY = m.y - Math.sin(m.angleRad) * m.len;

          const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
          grad.addColorStop(0, `rgba(94, 168, 255, ${m.alpha})`);
          grad.addColorStop(0.35, `rgba(139, 108, 255, ${(m.alpha * 0.6).toFixed(2)})`);
          grad.addColorStop(1, 'rgba(94, 168, 255, 0)');

          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(m.x, m.y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(232, 234, 255, ${m.alpha})`;
          ctx.fill();
        }

        ctx.globalAlpha = 1;
      }

      requestAnimationFrame(renderStars);
    }

    requestAnimationFrame(renderStars);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      starCount = (window.innerWidth <= 768) ? 65 : 120;
      populateStars();
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
  // 5. AUDIO CONTROLS & REAL PLAYLIST ENGINE
  // ==========================================================================
  function initAudio() {
    const audio = document.getElementById('bg-audio');
    const audioToggleBtn = document.getElementById('audio-toggle-btn');
    const audioSkipBtn = document.getElementById('audio-skip-btn');
    const trackNameEl = document.getElementById('current-track-name');

    if (!audio) return;

    let playlistIndex = 0;
    let isPlaying = false;

    // Volume remembered via localStorage, defaulting to CONFIG.DEFAULT_VOLUME (0.4)
    const savedVol = localStorage.getItem('coodz_audio_volume');
    audio.volume = savedVol !== null ? parseFloat(savedVol) : CONFIG.DEFAULT_VOLUME;
    audio.loop = false;

    function loadTrack(index) {
      playlistIndex = ((index % CONFIG.PLAYLIST.length) + CONFIG.PLAYLIST.length) % CONFIG.PLAYLIST.length;
      const track = CONFIG.PLAYLIST[playlistIndex];
      audio.src = track.src;
      if (trackNameEl) {
        trackNameEl.textContent = track.name;
        trackNameEl.setAttribute('title', track.name);
      }
    }

    // Load initial track (dorado) without autoplay (respects browser autoplay policy)
    loadTrack(0);

    // Audio Play/Pause Button
    if (audioToggleBtn) {
      audioToggleBtn.addEventListener('click', () => {
        if (!isPlaying) {
          audio.play().then(() => {
            isPlaying = true;
            audioToggleBtn.classList.add('playing');
          }).catch((err) => {
            console.warn('Audio play request blocked or failed:', err);
          });
        } else {
          audio.pause();
          isPlaying = false;
          audioToggleBtn.classList.remove('playing');
        }
      });
    }

    // Skip Button: advances to next track and loops at end
    if (audioSkipBtn) {
      audioSkipBtn.addEventListener('click', () => {
        audioSkipBtn.classList.add('pulse');
        setTimeout(() => audioSkipBtn.classList.remove('pulse'), 250);

        loadTrack(playlistIndex + 1);
        if (isPlaying) {
          audio.play().catch(() => {});
        }
      });
    }

    // Auto-advance to next track on ended (loops playlist)
    audio.addEventListener('ended', () => {
      loadTrack(playlistIndex + 1);
      audio.play().catch(() => {});
    });

    audio.addEventListener('play', () => {
      isPlaying = true;
      if (audioToggleBtn) audioToggleBtn.classList.add('playing');
    });

    audio.addEventListener('pause', () => {
      isPlaying = false;
      if (audioToggleBtn) audioToggleBtn.classList.remove('playing');
    });

    audio.addEventListener('volumechange', () => {
      localStorage.setItem('coodz_audio_volume', audio.volume.toString());
    });
  }

  // ==========================================================================
  // 6. SCROLL PROGRESS BAR (ACCENT GRADIENT AT VERY TOP)
  // ==========================================================================
  function initScrollProgress() {
    const scrollContainer = document.getElementById('scroll-container');
    const progressBar = document.getElementById('scroll-progress-bar');
    if (!scrollContainer || !progressBar) return;

    function updateProgress() {
      const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollContainer.scrollTop / maxScroll)) : 0;
      progressBar.style.transform = `scaleX(${progress})`;
    }

    scrollContainer.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    updateProgress();
  }

  // ==========================================================================
  // 7. KEYBOARD NAVIGATION (ARROWS / PAGEUP / PAGEDOWN MOVE SECTIONS)
  // ==========================================================================
  function initKeyboardNav() {
    const sectionIds = ['home', 'chi_sono', 'esperienze', 'contatti'];
    let isNavigating = false;

    window.addEventListener('keydown', (e) => {
      // Do not intercept if user is interacting with an input or editable element
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
        return;
      }

      let delta = 0;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        delta = 1;
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        delta = -1;
      } else if (e.key === 'Home') {
        delta = -999;
      } else if (e.key === 'End') {
        delta = 999;
      }

      if (delta !== 0) {
        e.preventDefault();
        if (isNavigating) return;

        const currentIndex = sectionIds.indexOf(activeSectionId);
        let targetIndex = 0;

        if (delta === 999) {
          targetIndex = sectionIds.length - 1;
        } else if (delta === -999) {
          targetIndex = 0;
        } else {
          const cur = currentIndex >= 0 ? currentIndex : 0;
          targetIndex = Math.min(sectionIds.length - 1, Math.max(0, cur + delta));
        }

        if (targetIndex !== currentIndex) {
          const targetSec = document.getElementById(sectionIds[targetIndex]);
          if (targetSec) {
            isNavigating = true;
            targetSec.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
              isNavigating = false;
            }, 650);
          }
        }
      }
    });
  }

  // ==========================================================================
  // 8. DEBUG HELPER PANEL (?debug query parameter only)
  // ==========================================================================
  function initDebugHelper() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('debug')) return;

    const panel = document.createElement('div');
    panel.id = 'avatar-debug-panel';
    panel.className = 'avatar-debug-panel mono';

    panel.innerHTML = `
      <div class="debug-header">
        <span class="debug-title">[ AVATAR DEBUG ]</span>
        <button id="debug-copy-btn" class="debug-btn" title="Copy to clipboard">[ COPY ]</button>
      </div>
      <div class="debug-controls">
        <label class="debug-row">
          <span>Zoom: <b id="val-zoom">${CONFIG.AVATAR_ZOOM_DESKTOP.toFixed(2)}</b></span>
          <input type="range" id="slider-zoom" min="0.2" max="1.5" step="0.01" value="${CONFIG.AVATAR_ZOOM_DESKTOP}">
        </label>
        <label class="debug-row">
          <span>Y Offset: <b id="val-y">${CONFIG.AVATAR_Y_OFFSET}px</b></span>
          <input type="range" id="slider-y" min="-200" max="200" step="1" value="${CONFIG.AVATAR_Y_OFFSET}">
        </label>
        <label class="debug-row">
          <span>Rot Offset: <b id="val-rot">${CONFIG.ROT_OFFSET.toFixed(2)} rad</b></span>
          <input type="range" id="slider-rot" min="0" max="6.28" step="0.02" value="${CONFIG.ROT_OFFSET}">
        </label>
        <label class="debug-row">
          <span>Global Light: <b id="val-glight">${CONFIG.GLOBAL_LIGHT.toFixed(1)}</b></span>
          <input type="range" id="slider-glight" min="0" max="8.0" step="0.1" value="${CONFIG.GLOBAL_LIGHT}">
        </label>
        <label class="debug-row">
          <span>Camera Light: <b id="val-clight">${CONFIG.CAMERA_LIGHT.toFixed(1)}</b></span>
          <input type="range" id="slider-clight" min="0" max="5.0" step="0.1" value="${CONFIG.CAMERA_LIGHT}">
        </label>
        <label class="debug-row">
          <span>Contrast: <b id="val-contrast">${CONFIG.AVATAR_CONTRAST.toFixed(2)}</b></span>
          <input type="range" id="slider-contrast" min="0.4" max="1.6" step="0.02" value="${CONFIG.AVATAR_CONTRAST}">
        </label>
        <label class="debug-row">
          <span>Brightness: <b id="val-brightness">${CONFIG.AVATAR_BRIGHTNESS.toFixed(2)}</b></span>
          <input type="range" id="slider-brightness" min="0.8" max="2.5" step="0.05" value="${CONFIG.AVATAR_BRIGHTNESS}">
        </label>
      </div>
      <pre id="debug-code-output" class="debug-output"></pre>
    `;

    document.body.appendChild(panel);

    const sliderZoom = panel.querySelector('#slider-zoom');
    const sliderY = panel.querySelector('#slider-y');
    const sliderRot = panel.querySelector('#slider-rot');
    const sliderGLight = panel.querySelector('#slider-glight');
    const sliderCLight = panel.querySelector('#slider-clight');
    const sliderContrast = panel.querySelector('#slider-contrast');
    const sliderBrightness = panel.querySelector('#slider-brightness');

    const valZoom = panel.querySelector('#val-zoom');
    const valY = panel.querySelector('#val-y');
    const valRot = panel.querySelector('#val-rot');
    const valGLight = panel.querySelector('#val-glight');
    const valCLight = panel.querySelector('#val-clight');
    const valContrast = panel.querySelector('#val-contrast');
    const valBrightness = panel.querySelector('#val-brightness');
    const codeOutput = panel.querySelector('#debug-code-output');
    const copyBtn = panel.querySelector('#debug-copy-btn');

    function updateConfigReadout() {
      const code = `// COPY INTO CONFIG:
AVATAR_ZOOM_DESKTOP: ${CONFIG.AVATAR_ZOOM_DESKTOP.toFixed(2)},
AVATAR_Y_OFFSET: ${CONFIG.AVATAR_Y_OFFSET},
ROT_OFFSET: ${(CONFIG.ROT_OFFSET / Math.PI).toFixed(2)} * Math.PI, // ${(CONFIG.ROT_OFFSET).toFixed(3)} rad
GLOBAL_LIGHT: ${CONFIG.GLOBAL_LIGHT.toFixed(1)},
CAMERA_LIGHT: ${CONFIG.CAMERA_LIGHT.toFixed(1)},
AVATAR_CONTRAST: ${CONFIG.AVATAR_CONTRAST.toFixed(2)},
AVATAR_BRIGHTNESS: ${CONFIG.AVATAR_BRIGHTNESS.toFixed(2)}`;
      codeOutput.textContent = code;
    }

    sliderZoom.addEventListener('input', (e) => {
      CONFIG.AVATAR_ZOOM_DESKTOP = parseFloat(e.target.value);
      valZoom.textContent = CONFIG.AVATAR_ZOOM_DESKTOP.toFixed(2);
      if (skinViewer && !isMobile) {
        skinViewer.zoom = CONFIG.AVATAR_ZOOM_DESKTOP;
      }
      updateConfigReadout();
    });

    sliderY.addEventListener('input', (e) => {
      CONFIG.AVATAR_Y_OFFSET = parseInt(e.target.value, 10);
      valY.textContent = CONFIG.AVATAR_Y_OFFSET + 'px';
      const stage = document.getElementById('avatar-stage');
      if (stage) {
        stage.style.setProperty('--avatar-y', `${CONFIG.AVATAR_Y_OFFSET}px`);
      }
      updateConfigReadout();
    });

    sliderRot.addEventListener('input', (e) => {
      CONFIG.ROT_OFFSET = parseFloat(e.target.value);
      valRot.textContent = CONFIG.ROT_OFFSET.toFixed(2) + ' rad';
      updateConfigReadout();
    });

    sliderGLight.addEventListener('input', (e) => {
      CONFIG.GLOBAL_LIGHT = parseFloat(e.target.value);
      valGLight.textContent = CONFIG.GLOBAL_LIGHT.toFixed(1);
      if (skinViewer && skinViewer.globalLight) {
        skinViewer.globalLight.intensity = CONFIG.GLOBAL_LIGHT;
      }
      updateConfigReadout();
    });

    sliderCLight.addEventListener('input', (e) => {
      CONFIG.CAMERA_LIGHT = parseFloat(e.target.value);
      valCLight.textContent = CONFIG.CAMERA_LIGHT.toFixed(1);
      if (skinViewer && skinViewer.cameraLight) {
        skinViewer.cameraLight.intensity = CONFIG.CAMERA_LIGHT;
      }
      updateConfigReadout();
    });

    sliderContrast.addEventListener('input', (e) => {
      CONFIG.AVATAR_CONTRAST = parseFloat(e.target.value);
      valContrast.textContent = CONFIG.AVATAR_CONTRAST.toFixed(2);
      document.documentElement.style.setProperty('--avatar-contrast', CONFIG.AVATAR_CONTRAST);
      updateConfigReadout();
    });

    sliderBrightness.addEventListener('input', (e) => {
      CONFIG.AVATAR_BRIGHTNESS = parseFloat(e.target.value);
      valBrightness.textContent = CONFIG.AVATAR_BRIGHTNESS.toFixed(2);
      document.documentElement.style.setProperty('--avatar-brightness', CONFIG.AVATAR_BRIGHTNESS);
      updateConfigReadout();
    });

    copyBtn.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(codeOutput.textContent).then(() => {
          copyBtn.textContent = '[ COPIED! ]';
          setTimeout(() => (copyBtn.textContent = '[ COPY ]'), 1500);
        });
      }
    });

    updateConfigReadout();
  }

  // ==========================================================================
  // INITIALIZATION ON DOMContentLoaded
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initOpeningSequence();
    initAvatar();
    initAvatarInteraction();
    initStars();
    initNavigation();
    initAudio();
    initScrollProgress();
    initKeyboardNav();
    initSectionObserver();
    initDebugHelper();
  });

})();
