// ATTENZIONE PER L'AI: Prima di effettuare qualsiasi modifica a questo file o al progetto, consulta SEMPRE il file AGENTS.md nella radice del progetto per le regole obbligatorie.

/**
 * ============================================================================
 * PORTFOLIO COODZ_10 - STEP 2 & 3 ENGINE
 * Ultra-minimal "Incoming Transmission" with 3D Avatar State Machine & In-Page Experience Details
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
    ROT_EXP_DETAIL: 0.85,      // esperienze-detail: turns further toward detail panel on right

    // Lighting (illuminates dark skin on dark backgrounds)
    GLOBAL_LIGHT: 4.5,         // Global ambient light intensity
    CAMERA_LIGHT: 1.8,         // Directional camera light intensity

    // Display Filters & Backdrop Haze (Mild lift, faint edge, soft wide haze)
    AVATAR_CONTRAST: 0.92,     // Mild lift contrast
    AVATAR_BRIGHTNESS: 1.25,   // Mild lift brightness
    HAZE_OPACITY: 0.35,        // Soft wide haze backdrop opacity

    // Zero-Gravity Float Dynamics
    FLOAT_BOB: 1.2,            // Vertical bob amplitude in vh (period ~6s)
    POSE_BLEND: 2.0,           // Pose blend duration in seconds (easeInOutCubic)

    // Head Tracking Look-At Signs (+1: right->right, above->up; -1: inverted)
    HEAD_YAW_SIGN: 1,          // Mouse right -> face turns to viewer's right
    HEAD_PITCH_SIGN: 1,        // Mouse above -> face looks up

    // Home Banner Anchor & Holding Dynamics (Swaying Pendulum Flight)
    HOLD_ANCHOR: 'underscore', // 'underscore' (center of _) or 'center' (center of title)
    HOLD_TITLE: true,          // true: hands touch bottom of title; false: floats above
    HOME_AVATAR_SCALE: 0.38,   // Avatar scale in home state (~28vh tall)
    SPILL_OPACITY: 0.18,       // Soft light spill opacity under title

    // Scroll-Driven Flight Keyframes (units: vw for x, vh for y, scale relative to 100% avatar)
    AVATAR_KEYFRAMES: [
      { id: 'home',       x: 'anchor', y: 'anchor', scale: 'anchor', yaw: 0.15, roll: 0 },
      { id: 'chi_sono',   x: 0,        y: 0,        scale: 1.0,      yaw: 0.0,  roll: 0 },
      { id: 'esperienze', x: -22,      y: 0,        scale: 0.8,      yaw: 0.65, roll: 0 },
      { id: 'contatti',   x: 0,        y: 2,        scale: 0.7,      yaw: 0.0,  roll: 0 }
    ],
    FLIGHT_ARC_X: 9,           // Extra arc horizontal offset in vw
    FLIGHT_ARC_Y: 4,           // Extra arc vertical lift in vh
    FLIGHT_SWOOP: 0.14,        // Swoop scale overshoot factor
    FLIGHT_ROLL: 0.12,         // Bank roll during flight in rad
    FLIGHT_VELOCITY_REF: 0.85, // Velocity reference for flight pose blend (sections/sec)
    WARP_STRENGTH: 28,         // Warp star streak length multiplier

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
      aboutText: `<p>Mi chiamo Samuele, ho 16 anni e sono uno studente di liceo scientifico. Ho una forte passione per l'informatica a 360 gradi, dall'hardware al software, con un approccio molto pratico e orientato a capire cosa succede davvero dietro le quinte di un sistema.</p><p>Sul lato software e sicurezza, mi specializzo in analisi forense digitale (ScreenSharing) applicata principalmente all'ecosistema dei server Minecraft competitivi.</p><p>Parallelamente, utilizzo strumenti di intelligenza artificiale in modo avanzato, sia attraverso modelli locali sia tramite piattaforme cloud, sfruttandoli per lo sviluppo di software, l'analisi tecnica, il debugging e l'automazione di processi. Ho inoltre esperienza nella personalizzazione e nell'ottimizzazione dei modelli per adattarli alle mie esigenze.</p><p>Sul lato hardware, mi occupo di assemblaggio e configurazione di PC personalizzati, seguendo l'intero processo: dalla scelta dei componenti in base alle esigenze e al budget, fino all'assemblaggio, all'ottimizzazione e alla risoluzione di eventuali problemi. Offro inoltre supporto a chi necessita di una configurazione o di una build su misura.</p>`,
      aboutHandleLabel: 'HANDLE:',
      aboutRoleLabel: 'RUOLO:',
      aboutRoleVal: 'SysAdmin // Security',
      aboutStatusLabel: 'STATO:',
      aboutStatusVal: '[ OPERATIVO ]',
      expTag: 'LOG_ENTRY_01 // ESPERIENZE',
      expTitle: 'Esperienze',
      expTabAll: '[ TUTTO ]',
      expCatMinecraft: '[ MINECRAFT ]',
      expCatDiscord: '[ DISCORD ]',
      expGroupMinecraft: '[ MINECRAFT ]',
      expGroupDiscord: '[ DISCORD // DS ]',
      expRedisRole: 'Helper',
      expRedisStatus: '[ Stato: Attivo ]',
      expElysianRole: 'SS Verified',
      expElysianStatus: '[ Stato: Attivo ]',
      expSyndicateRole: 'Support Team',
      expSyndicateStatus: '[ Stato: Attivo ]',
      expMetaRole: 'Helper ★★★★☆',
      expMetaStatus: '[ Stato: Dimesso ]',
      expPixyRole: 'Owner [ SS Manager ] ★★★★☆',
      expPixyStatus: '[ Stato: Dimesso ]',
      viewDossier: '[ VEDI SCHEDA ]',
      contactTag: 'LOG_ENTRY_02 // CONTATTI',
      contactTitle: 'Parliamo',
      contactSub: 'Per collaborazioni, richieste di servizi o investigazioni di sicurezza.',
      footerEnd: 'END_TRANSMISSION // COODZ_10',
      backToExperiences: '[ ← torna alle esperienze ]',
      openProofs: '[ APRI PROVE ]',
      proofsTitle: 'Link e Prove',
      btnAbout: '[ CHI SONO ]',
      btnExp: '[ LE MIE ESPERIENZE ]',
      bgWordAbout: 'CHI SONO',
      bgWordExp: 'ESPERIENZE',
      bgWordContact: 'CONTATTI'
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
      aboutText: `<p>My name is Samuele, I am 16 years old, and I am a scientific high school student. I have a strong passion for 360° IT, from hardware to software, with a highly practical approach focused on understanding what really happens behind the scenes of a system.</p><p>On the software and security side, I specialize in digital forensics (ScreenSharing) applied primarily to the competitive Minecraft server ecosystem.</p><p>In parallel, I utilize artificial intelligence tools in an advanced manner, both through local models and cloud platforms, leveraging them for software development, technical analysis, debugging, and process automation. I also have experience customizing and fine-tuning models to fit my needs.</p><p>On the hardware side, I build and configure custom PCs, overseeing the entire process: from component selection based on needs and budget, to assembly, optimization, and troubleshooting. I also provide guidance and support to anyone in need of a tailored configuration or build.</p>`,
      aboutHandleLabel: 'HANDLE:',
      aboutRoleLabel: 'ROLE:',
      aboutRoleVal: 'SysAdmin // Security',
      aboutStatusLabel: 'STATUS:',
      aboutStatusVal: '[ OPERATIONAL ]',
      expTag: 'LOG_ENTRY_01 // EXPERIENCES',
      expTitle: 'Experiences',
      expTabAll: '[ ALL ]',
      expCatMinecraft: '[ MINECRAFT ]',
      expCatDiscord: '[ DISCORD ]',
      expGroupMinecraft: '[ MINECRAFT ]',
      expGroupDiscord: '[ DISCORD // DS ]',
      expRedisRole: 'Helper',
      expRedisStatus: '[ Status: Active ]',
      expElysianRole: 'SS Verified',
      expElysianStatus: '[ Status: Active ]',
      expSyndicateRole: 'Support Team',
      expSyndicateStatus: '[ Status: Active ]',
      expMetaRole: 'Helper ★★★★☆',
      expMetaStatus: '[ Status: Resign ]',
      expPixyRole: 'Owner [ SS Manager ] ★★★★☆',
      expPixyStatus: '[ Status: Resign ]',
      viewDossier: '[ VIEW DOSSIER ]',
      contactTag: 'LOG_ENTRY_02 // CONTACT',
      contactTitle: "Let's Talk",
      contactSub: 'For collaborations, service requests or security investigations.',
      footerEnd: 'END_TRANSMISSION // COODZ_10',
      backToExperiences: '[ ← back to experiences ]',
      openProofs: '[ OPEN PROOFS ]',
      proofsTitle: 'Links & Proofs',
      btnAbout: '[ ABOUT ME ]',
      btnExp: '[ MY EXPERIENCES ]',
      bgWordAbout: 'ABOUT',
      bgWordExp: 'EXPERIENCE',
      bgWordContact: 'CONTACT'
    }
  };

  // ==========================================================================
  // COMPLETE EXPERIENCE DETAILS (Ported exactly from servers/*.html)
  // ==========================================================================
  const EXPERIENCE_DETAILS = {
    redismc: {
      index: '01',
      title: 'RedisMC',
      category: 'minecraft',
      role: { it: 'Helper', en: 'Helper' },
      stars: '',
      status: { it: '[ Stato: Attivo ]', en: '[ Status: Active ]' },
      period: { it: '[ Periodo: Ottobre 2026 - ]', en: '[ Period: October 2026 - ]' },
      inProgress: true,
      noticeTag: { it: '[ In Lavorazione ]', en: '[ In Progress ]' },
      noticeText: {
        it: 'I dettagli e la recensione di questa esperienza sono attualmente in fase di stesura.',
        en: 'Details and review for this experience are currently work in progress.'
      },
      proofs: [
        { url: 'https://imgur.com/a/6r60dbY' }
      ]
    },
    metamc: {
      index: '02',
      title: 'MetaMc',
      category: 'minecraft',
      role: { it: 'Helper', en: 'Helper' },
      stars: '★★★★☆',
      status: { it: '[ Stato: Dimesso ]', en: '[ Status: Resign ]' },
      period: { it: '[ Periodo: Agosto - Settembre 2026 ]', en: '[ Period: August - September 2026 ]' },
      experienceTitle: { it: 'La Mia Esperienza', en: 'My Experience' },
      experienceParagraphs: {
        it: [
          'Sono stato membro dello staff di MetaMC per circa due mesi, periodo durante il quale ho potuto apprezzare un ambiente ben strutturato e professionale.',
          'Subito dopo aver superato il provino, sono stato affiancato e formato con chiarezza sui compiti da svolgere.',
          'In gioco l\'organizzazione e i comandi sono configurati in modo quasi impeccabile; inoltre, il team è accogliente e affiatato, rendendo il lavoro stimolante e mai pesante.',
          'Trattandosi di un network di grandi dimensioni, MetaMC richiede presenza costante e alta attenzione: nello specifico, operando nelle modalità PvP, gestivo controlli su un bacino di oltre 600 utenti al giorno, a cui si sommava il supporto su Discord tra ticket, chat e assistenza vocale.',
          'Un aspetto critico riguarda la comunicazione interna: ho riscontrato uno scambio scarso o insufficiente sia all\'interno dei gradi superiori, sia tra questi ultimi e lo staff di livello medio-basso.',
          'A questo si aggiunge la mia esperienza con la candidatura per il ruolo di SS Verified: nonostante l\'esito positivo della candidatura scritta, a distanza di due settimane non ho più ricevuto alcun riscontro da parte del responsabile SS.',
          'Sebbene non si tratti di una responsabilità diretta di MetaMC, dato che il percorso formativo è delegato all\'hub della Tierlist italiana, questo passaggio rappresenta comunque una nota dolente e un ostacolo per chiunque desideri specializzarsi nei controlli hack sul server.'
        ],
        en: [
          'I was a staff member of MetaMC for about two months, during which I appreciated a well-structured and professional environment.',
          'Right after passing the trial, I was mentored and trained with clarity on the tasks to carry out.',
          'In-game, the organization and commands are configured almost impeccably; furthermore, the team is welcoming and close-knit, making the work engaging and never tedious.',
          'As a large-scale network, MetaMC requires constant presence and high attention: specifically, operating in the PvP game modes, I managed checks on a player base of over 600 users per day, alongside Discord support across tickets, chat, and voice assistance.',
          'A critical aspect concerns internal communication: I noticed scarce or insufficient communication both within higher ranks and between them and mid-to-low level staff.',
          'Additionally, regarding my application for the SS Verified role: despite passing the written application, after two weeks I received no further follow-up or feedback from the SS lead.',
          'Although this is not a direct responsibility of MetaMC, since the training path is delegated to the Italian Tierlist hub, this process remains a sore point and an obstacle for anyone wishing to specialize in hack checks on the server.'
        ]
      },
      strengthsTitle: { it: 'Punti di Forza', en: 'Strengths' },
      strengths: {
        it: ['Professionalità', 'Organizzazione'],
        en: ['Professionalism', 'Organization']
      },
      weaknessesTitle: { it: 'Punti Deboli', en: 'Weaknesses' },
      weaknesses: {
        it: ['Comunicazione insufficiente'],
        en: ['Insufficient communication']
      },
      proofs: [
        { url: 'https://imgur.com/a/YgUNOux' },
        { url: 'https://imgur.com/wOMooyU' }
      ]
    },
    pixymc: {
      index: '03',
      title: 'PixyMC',
      category: 'minecraft',
      role: { it: 'Owner [ SS Manager ]', en: 'Owner [ SS Manager ]' },
      stars: '★★★★☆',
      status: { it: '[ Stato: Dimesso ]', en: '[ Status: Resign ]' },
      period: { it: '[ Periodo: Agosto 2025 - Luglio 2026 ]', en: '[ Period: August 2025 - July 2026 ]' },
      experienceTitle: { it: 'La Mia Esperienza', en: 'My Experience' },
      experienceParagraphs: {
        it: [
          'Sono stato membro dello staff per più di un anno, crescendo da Helper fino a diventare Owner. Nel corso del tempo ho potuto notare come il server offra una community sana e divertente, caratterizzata da ottimi rapporti tra player e staff.',
          'L\'ambiente di lavoro è uno dei migliori che io abbia mai visto: ti fa sentire parte di una famiglia, prima ancora che di un\'azienda. L\'headstaff e i founder sono molto comprensivi, amichevoli e capaci di metterti subito a tuo agio.',
          'L\'utenza del server è uno degli aspetti che apprezzo di più: sono tutti educati, corretti, pensano a divertirsi e non creano mai problemi.',
          'Tuttavia, questa atmosfera fin troppo familiare porta a una scarsa professionalità, con continui "sconti" sul regolamento da parte dell\'headstaff e scherzi eccessivi.',
          'In definitiva, PixyMC è un server ideale per chi vuole fare lo staffer senza troppo impegno e senza stress.'
        ],
        en: [
          'I was a staff member for over a year, progressing from Helper up to Owner. Over time, I\'ve observed that the server fosters a healthy and highly enjoyable community, with excellent relationships between players and staff.',
          'The work environment is among the best I\'ve ever encountered: it makes you feel like part of a family, rather than just a company. The head staff and founders are incredibly understanding and friendly, immediately putting you at ease.',
          'The server\'s player base is what I love the most: everyone is extremely polite, fair, and just there to have fun without ever causing trouble.',
          'However, this overly familiar atmosphere leads to a lack of professionalism, with constant "exceptions" to the rules by the head staff and excessive joking.',
          'Ultimately, PixyMC is an ideal server for anyone who wants to be a staff member casually and without stress.'
        ]
      },
      strengthsTitle: { it: 'Punti di Forza', en: 'Strengths' },
      strengths: {
        it: ['Ottimo ambiente di lavoro', 'Staff comprensivo e disponibile'],
        en: ['Great working environment', 'Understanding and friendly staff']
      },
      weaknessesTitle: { it: 'Punti Deboli', en: 'Weaknesses' },
      weaknesses: {
        it: ['Scarsa organizzazione iniziale', 'Poca professionalità'],
        en: ['Lack of initial organization', 'Lack of professionalism']
      },
      proofs: [
        { url: 'https://imgur.com/0a8e2HW' },
        { url: 'https://imgur.com/T2BEOhO' },
        { url: 'https://imgur.com/YOaVB2c' }
      ]
    },
    elysian: {
      index: '01',
      title: 'Elysian Tierlist',
      category: 'ds',
      role: { it: 'SS Verified', en: 'SS Verified' },
      stars: '',
      status: { it: '[ Stato: Attivo ]', en: '[ Status: Active ]' },
      period: { it: '[ Periodo: Ottobre 2026 - ]', en: '[ Period: October 2026 - ]' },
      inProgress: true,
      noticeTag: { it: '[ In Lavorazione ]', en: '[ In Progress ]' },
      noticeText: {
        it: 'I dettagli e la recensione di questa esperienza sono attualmente in fase di stesura.',
        en: 'Details and review for this experience are currently work in progress.'
      },
      proofs: [
        { url: 'https://imgur.com/a/Ff0pF34' }
      ]
    },
    syndicate: {
      index: '02',
      title: 'ScreenShare Syndicate',
      category: 'ds',
      role: { it: 'Support Team', en: 'Support Team' },
      stars: '',
      status: { it: '[ Stato: Attivo ]', en: '[ Status: Active ]' },
      period: { it: '[ Periodo: 2026 - ]', en: '[ Period: 2026 - ]' },
      inProgress: true,
      noticeTag: { it: '[ In Lavorazione ]', en: '[ In Progress ]' },
      noticeText: {
        it: 'I dettagli e la recensione di questa esperienza sono attualmente in fase di stesura.',
        en: 'Details and review for this experience are currently work in progress.'
      },
      proofs: []
    }
  };

  let currentLang = localStorage.getItem('coodz_lang') || 'it';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Global state references
  let skinViewer = null;
  let floatAnimation = null;
  let targetPlayerRotY = 0; // State rotation relative to ROT_OFFSET
  let currentAvatarState = 'home';
  let activeSectionId = 'home';
  let activeDetailId = null; // Currently open experience detail key ('redismc', 'metamc', 'pixymc')
  let isMobile = window.innerWidth <= 768;

  // Scroll-driven flight state & layout caching
  let targetScrollF = 0;
  let fDisplay = 0;
  let prevFDisplay = 0;
  let scrollVelocity = 0;
  let flightW = 0;
  let manualF = null;
  let lastFrameTime = performance.now();

  let cachedSectionHeight = window.innerHeight;
  let cachedWindowWidth = window.innerWidth;
  let cachedWindowHeight = window.innerHeight;
  let cachedAnchorAxPx = 0;
  let cachedAnchorAyPx = 0;
  let cachedAnchorScale = 0.38;
  let lastComputedStageX = 0;
  let lastComputedStageY = 0;
  let tryStartAudioGlobal = null;

  // ==========================================================================
  // ZERO-GRAVITY POSES & CUBIC EASING ENGINE
  // ==========================================================================
  const POSES = {
    neutral: {
      body: { x: 0, y: 0, z: 0 },
      leftArm: { x: 0.08, y: 0, z: -0.18 },
      rightArm: { x: 0.08, y: 0, z: 0.18 },
      leftLeg: { x: -0.05, y: 0, z: -0.04 },
      rightLeg: { x: 0.05, y: 0, z: 0.04 }
    },
    open: {
      body: { x: -0.02, y: 0, z: 0 },
      leftArm: { x: -0.15, y: 0.15, z: -0.5 },
      rightArm: { x: -0.15, y: -0.15, z: 0.5 },
      leftLeg: { x: -0.06, y: 0, z: -0.06 },
      rightLeg: { x: 0.06, y: 0, z: 0.06 }
    },
    reach: {
      body: { x: 0.03, y: 0.08, z: 0 },
      leftArm: { x: 0.1, y: 0, z: -0.15 },
      rightArm: { x: -1.2, y: -0.1, z: -0.2 },
      leftLeg: { x: 0.1, y: 0, z: -0.03 },
      rightLeg: { x: -0.12, y: 0, z: 0.04 }
    },
    rest: {
      body: { x: 0.05, y: 0, z: 0 },
      leftArm: { x: 0.04, y: 0, z: -0.1 },
      rightArm: { x: 0.04, y: 0, z: 0.1 },
      leftLeg: { x: 0.12, y: 0, z: -0.02 },
      rightLeg: { x: -0.08, y: 0, z: 0.02 }
    },
    point: {
      body: { x: 0.02, y: 0.2, z: 0 },
      leftArm: { x: 0.08, y: 0, z: -0.15 },
      rightArm: { x: -1.45, y: -0.3, z: 0.15 },
      leftLeg: { x: -0.05, y: 0, z: -0.03 },
      rightLeg: { x: 0.08, y: 0, z: 0.03 }
    },
    wave: {
      body: { x: 0, y: 0, z: 0 },
      leftArm: { x: 0.08, y: 0, z: -0.15 },
      rightArm: { x: -2.8, y: 0.2, z: -0.35 },
      leftLeg: { x: -0.03, y: 0, z: -0.02 },
      rightLeg: { x: 0.03, y: 0, z: 0.02 }
    },
    hold: {
      body: { x: -0.02, y: 0, z: 0 },
      leftArm: { x: -2.9, y: 0.05, z: -0.12 },
      rightArm: { x: -2.9, y: -0.05, z: 0.12 },
      leftLeg: { x: 0.05, y: 0, z: -0.06 },
      rightLeg: { x: -0.05, y: 0, z: 0.06 }
    },
    fly: {
      body: { x: 0.35, y: 0, z: 0 },
      leftArm: { x: -1.5, y: 0, z: -0.15 },
      rightArm: { x: -1.5, y: 0, z: 0.15 },
      leftLeg: { x: -0.25, y: 0, z: -0.04 },
      rightLeg: { x: -0.25, y: 0, z: 0.04 }
    }
  };

  function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  // ==========================================================================
  // SCREEN LOOK-AT TARGET SYSTEM
  // ==========================================================================
  let currentLookTargetX = window.innerWidth * 0.5;
  let currentLookTargetY = window.innerHeight * 0.3;
  let desiredLookTargetX = currentLookTargetX;
  let desiredLookTargetY = currentLookTargetY;
  let blendLookSourceX = currentLookTargetX;
  let blendLookSourceY = currentLookTargetY;
  let blendLookStartTime = performance.now() / 1000;
  let blendLookDuration = 0.8;

  let mouseInWindow = true;
  let mouseX = window.innerWidth * 0.5;
  let mouseY = window.innerHeight * 0.3;
  const isTouchDevice = ('ontouchstart' in window) && (navigator.maxTouchPoints > 0);

  let readingTargetTimer = null;
  let currentReadingIndex = 0;
  let hoveredCard = null;
  let hoveredContactRow = null;

  function setDesiredLookTarget(x, y, duration = 0.8) {
    blendLookSourceX = currentLookTargetX;
    blendLookSourceY = currentLookTargetY;
    desiredLookTargetX = x;
    desiredLookTargetY = y;
    blendLookStartTime = performance.now() / 1000;
    blendLookDuration = duration;
  }

  function updateLookTargetEveryFrame() {
    const nowSec = performance.now() / 1000;

    if (flightW > 0.3) {
      // During flight look forward / at camera (target = viewport center)
      desiredLookTargetX = cachedWindowWidth * 0.5;
      desiredLookTargetY = cachedWindowHeight * 0.5;
    } else if (activeSectionId === 'home') {
      if (mouseInWindow && !isTouchDevice) {
        desiredLookTargetX = mouseX;
        desiredLookTargetY = mouseY;
      } else {
        // Slowly scan between title and buttons
        const titleEl = document.getElementById('hero-title');
        const actionsEl = document.querySelector('.hero-actions') || document.querySelector('[data-i18n="scrollHint"]');
        let p1 = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.85 };
        let p2 = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.94 };

        if (titleEl) {
          const r1 = titleEl.getBoundingClientRect();
          p1 = { x: r1.left + r1.width * 0.5, y: r1.top + r1.height * 0.5 };
        }
        if (actionsEl) {
          const r2 = actionsEl.getBoundingClientRect();
          p2 = { x: r2.left + r2.width * 0.5, y: r2.top + r2.height * 0.5 };
        }

        const scan = (Math.sin(nowSec * (2 * Math.PI / 5.0)) + 1) / 2;
        desiredLookTargetX = p1.x * (1 - scan) + p2.x * scan;
        desiredLookTargetY = p1.y * (1 - scan) + p2.y * scan;
      }
    } else {
      // In other sections: ignore mouse completely
      if (activeSectionId === 'esperienze' && hoveredCard) {
        const rect = hoveredCard.getBoundingClientRect();
        desiredLookTargetX = rect.left + rect.width * 0.5;
        desiredLookTargetY = rect.top + rect.height * 0.5;
      } else if (activeSectionId === 'contatti' && hoveredContactRow) {
        const rect = hoveredContactRow.getBoundingClientRect();
        desiredLookTargetX = rect.left + rect.width * 0.5;
        desiredLookTargetY = rect.top + rect.height * 0.5;
      }
    }

    // Blend between old and new look targets over ~0.8s (no snapping)
    const elapsed = nowSec - blendLookStartTime;
    const p = Math.min(1, Math.max(0, elapsed / Math.max(0.01, blendLookDuration)));
    const ease = easeInOutCubic(p);
    currentLookTargetX = blendLookSourceX + (desiredLookTargetX - blendLookSourceX) * ease;
    currentLookTargetY = blendLookSourceY + (desiredLookTargetY - blendLookSourceY) * ease;
  }

  function scheduleNextReadingTarget() {
    clearTimeout(readingTargetTimer);
    if (activeSectionId === 'home') return;

    const delay = Math.random() * 1500 + 2500; // 2.5s to 4s
    readingTargetTimer = setTimeout(() => {
      if (activeSectionId === 'home') return;

      if (activeSectionId === 'chi_sono') {
        const steps = ['.section-tag', '.section-title', '.about-text', '.about-text', '.info-card'];
        currentReadingIndex = (currentReadingIndex + 1) % steps.length;
        const sel = steps[currentReadingIndex];
        const el = document.querySelector(`#chi_sono ${sel}`);
        if (el) {
          const r = el.getBoundingClientRect();
          let targetX = r.left + r.width * 0.5;
          let targetY = r.top + r.height * 0.5;
          if (sel === '.about-text') {
            if (currentReadingIndex === 2) {
              targetX = r.left + r.width * 0.25;
              targetY = r.top + r.height * 0.3;
            } else {
              targetX = r.left + r.width * 0.75;
              targetY = r.top + r.height * 0.7;
            }
          }
          setDesiredLookTarget(targetX, targetY, 0.8);
        }
      } else if (activeSectionId === 'esperienze' || activeSectionId === 'esperienze-detail') {
        if (activeDetailId) {
          const steps = ['.detail-title', '.detail-paragraphs', '.detail-pros-cons-grid'];
          currentReadingIndex = (currentReadingIndex + 1) % steps.length;
          const el = document.querySelector(`#experience-detail-view ${steps[currentReadingIndex]}`);
          if (el) {
            const r = el.getBoundingClientRect();
            setDesiredLookTarget(r.left + r.width * 0.5, r.top + r.height * 0.5, 0.8);
          }
        } else if (!hoveredCard) {
          const cards = document.querySelectorAll('#esperienze .card-minimal');
          const count = cards.length + 1;
          currentReadingIndex = (currentReadingIndex + 1) % count;
          if (currentReadingIndex === 0) {
            const el = document.querySelector('#esperienze .section-title');
            if (el) {
              const r = el.getBoundingClientRect();
              setDesiredLookTarget(r.left + r.width * 0.5, r.top + r.height * 0.5, 0.8);
            }
          } else {
            const c = cards[currentReadingIndex - 1];
            if (c) {
              const r = c.getBoundingClientRect();
              setDesiredLookTarget(r.left + r.width * 0.5, r.top + r.height * 0.5, 0.8);
            }
          }
        }
      } else if (activeSectionId === 'contatti') {
        if (!hoveredContactRow) {
          const rows = document.querySelectorAll('#contatti .contact-row');
          const count = rows.length + 2;
          currentReadingIndex = (currentReadingIndex + 1) % count;
          if (currentReadingIndex === 0) {
            const el = document.querySelector('#contatti .contact-cta-title');
            if (el) {
              const r = el.getBoundingClientRect();
              setDesiredLookTarget(r.left + r.width * 0.5, r.top + r.height * 0.5, 0.8);
            }
          } else if (currentReadingIndex === 1) {
            const el = document.querySelector('#contatti .contact-sub');
            if (el) {
              const r = el.getBoundingClientRect();
              setDesiredLookTarget(r.left + r.width * 0.5, r.top + r.height * 0.5, 0.8);
            }
          } else {
            const row = rows[currentReadingIndex - 2];
            if (row) {
              const r = row.getBoundingClientRect();
              setDesiredLookTarget(r.left + r.width * 0.5, r.top + r.height * 0.5, 0.8);
            }
          }
        }
      }

      scheduleNextReadingTarget();
    }, delay);
  }

  // ==========================================================================
  // CUSTOM ZERO-GRAVITY FLOAT ANIMATION ENGINE (Owns all joints every frame)
  // ==========================================================================
  class FloatAnimation extends (window.skinview3d ? skinview3d.PlayerAnimation : class {}) {
    constructor() {
      super();
      this.currentPoseName = 'hold';
      this.sourceRotations = this.clonePose(POSES.hold);
      this.targetRotations = this.clonePose(POSES.hold);
      this.blendedRotations = this.clonePose(POSES.hold);

      this.blendStartTime = performance.now() / 1000;
      this.blendDuration = CONFIG.POSE_BLEND;
      this.isBlending = false;

      this.holdStartTime = performance.now() / 1000;
      this.holdDuration = 7.0;

      this.forcedPose = null;
      this.isOneShotWave = false;
      this.oneShotHoldDuration = 2.0;

      this.headYaw = 0;
      this.headPitch = 0;

      this.currentSection = 'home';
      this.hasDoneChiSonoWave = false;
    }

    clonePose(p) {
      return {
        body: { ...p.body },
        leftArm: { ...p.leftArm },
        rightArm: { ...p.rightArm },
        leftLeg: { ...p.leftLeg },
        rightLeg: { ...p.rightLeg }
      };
    }

    interpolateJoints(from, to, factor, target) {
      for (const joint of ['body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg']) {
        target[joint].x = from[joint].x + (to[joint].x - from[joint].x) * factor;
        target[joint].y = from[joint].y + (to[joint].y - from[joint].y) * factor;
        target[joint].z = from[joint].z + (to[joint].z - from[joint].z) * factor;
      }
    }

    transitionTo(poseName, customDuration) {
      if (!POSES[poseName]) return;
      this.sourceRotations = this.clonePose(this.blendedRotations);
      this.targetRotations = this.clonePose(POSES[poseName]);
      this.currentPoseName = poseName;
      this.blendStartTime = performance.now() / 1000;
      this.blendDuration = (typeof customDuration === 'number') ? customDuration : CONFIG.POSE_BLEND;
      this.isBlending = true;
    }

    triggerWave(duration = 2.0) {
      this.isOneShotWave = true;
      this.oneShotHoldDuration = duration;
      this.transitionTo('wave', 0.8);
    }

    onSectionChange(sectionId) {
      this.currentSection = sectionId;
      this.isOneShotWave = false;

      if (sectionId === 'home') {
        this.transitionTo('hold', 1.8);
        return;
      } else if (sectionId === 'chi_sono') {
        this.transitionTo('rest');
        this.holdDuration = Math.random() * 4 + 6;
        this.holdStartTime = performance.now() / 1000;
      } else if (sectionId === 'esperienze') {
        this.transitionTo('neutral');
        this.holdDuration = Math.random() * 4 + 6;
        this.holdStartTime = performance.now() / 1000;
      } else if (sectionId === 'esperienze-detail') {
        this.transitionTo('point');
      } else if (sectionId === 'contatti') {
        this.triggerWave(2.0);
      }
    }

    onCardHover(isHovered) {
      if (this.currentSection === 'esperienze' && !activeDetailId && !this.forcedPose) {
        if (isHovered) {
          this.transitionTo('point', 0.8);
        } else {
          this.transitionTo('neutral', 1.2);
        }
      }
    }

    pickNextPose() {
      if (this.forcedPose) {
        this.transitionTo(this.forcedPose);
        return;
      }

      if (fDisplay < 0.15) {
        this.transitionTo('hold');
        return;
      }

      let pool = ['neutral', 'open', 'rest'];
      if (this.currentSection === 'chi_sono') {
        pool = ['rest', 'open', 'neutral'];
      } else if (this.currentSection === 'esperienze') {
        if (activeDetailId) {
          this.transitionTo('point');
          return;
        }
        pool = ['neutral', 'point', 'rest'];
      } else if (this.currentSection === 'contatti') {
        pool = ['open', 'neutral'];
      }

      const available = pool.filter((p) => p !== this.currentPoseName);
      const next = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : pool[0];
      this.transitionTo(next);
      this.holdDuration = Math.random() * 4 + 6;
      this.holdStartTime = performance.now() / 1000;
    }

    animate(player) {
      if (!player || !player.skin) return;

      const nowSec = performance.now() / 1000;

      // 1. Pose Blend
      if (this.isBlending) {
        const elapsed = nowSec - this.blendStartTime;
        const p = Math.min(1, Math.max(0, elapsed / Math.max(0.1, this.blendDuration)));
        const ease = easeInOutCubic(p);

        this.interpolateJoints(this.sourceRotations, this.targetRotations, ease, this.blendedRotations);

        if (p >= 1) {
          this.isBlending = false;
          this.holdStartTime = nowSec;
          if (!this.isOneShotWave) {
            this.holdDuration = Math.random() * 4 + 6;
          }
        }
      } else {
        if (this.isOneShotWave) {
          if (nowSec - this.holdStartTime >= (this.oneShotHoldDuration || 2.0)) {
            this.isOneShotWave = false;
            this.pickNextPose();
          }
        } else if (!this.forcedPose) {
          if (nowSec - this.holdStartTime >= this.holdDuration) {
            this.pickNextPose();
          }
        }
      }

      // In home section (fDisplay < 0.15): ALWAYS stay in 'hold' pose holding the banner!
      if (fDisplay < 0.15) {
        if (this.currentPoseName !== 'hold' && !this.forcedPose) {
          this.transitionTo('hold', 0.6);
        }
      } else {
        // When leaving home: transition out of 'hold'
        if (this.currentPoseName === 'hold' && !this.isBlending) {
          this.transitionTo('neutral', 1.0);
        }
      }

      // 2. Flight Pose Blend & Flutter
      const w = Math.min(1, Math.max(0, flightW));
      const skin = player.skin;
      const b = this.blendedRotations;
      const fly = POSES.fly;

      let legFlutter = 0;
      if (!prefersReducedMotion && w > 0.02) {
        legFlutter = 0.08 * Math.sin(nowSec * 14.0) * w;
      }

      // 3. Secondary Limb Drift & Noise (Weightless float feel)
      let armLDriftZ = 0;
      let armRDriftZ = 0;
      let legLDriftX = 0;
      let legRDriftX = 0;
      let bodyNoiseX = 0;
      let bodyNoiseZ = 0;
      let waveOscZ = 0;
      let legSway = 0;
      let armTremorL = 0;
      let armTremorR = 0;

      if (!prefersReducedMotion) {
        if (this.currentPoseName === 'hold' && fDisplay < 0.1) {
          const homeInf = Math.max(0, 1 - fDisplay / 0.1);
          legSway = 0.12 * Math.sin(nowSec * (2 * Math.PI / 5.0)) * homeInf;
          armTremorL = (Math.random() - 0.5) * 0.03 * homeInf;
          armTremorR = (Math.random() - 0.5) * 0.03 * homeInf;
        }

        const driftWeight = 1 - w * 0.7; // drift calms down during high-speed flight
        armLDriftZ = 0.08 * Math.sin(nowSec * 1.1 + 0.5) * driftWeight;
        armRDriftZ = -0.08 * Math.sin(nowSec * 1.3 + 2.0) * driftWeight;
        legLDriftX = 0.06 * Math.sin(nowSec * 0.9 + 1.2) * driftWeight;
        legRDriftX = -0.06 * Math.sin(nowSec * 1.05 + 3.4) * driftWeight;
        bodyNoiseX = 0.02 * Math.sin(nowSec * 0.8 + 0.2) * driftWeight;
        bodyNoiseZ = 0.015 * Math.sin(nowSec * 0.7 + 1.5) * driftWeight;

        if (this.currentPoseName === 'wave' || this.isOneShotWave) {
          waveOscZ = Math.sin(nowSec * 7.0) * 0.35 * (1 - w);
        }
      }

      // 4. Lerp with fly pose
      const bodyRotX = (b.body.x * (1 - w) + fly.body.x * w);
      const leftArmRotX = (b.leftArm.x * (1 - w) + fly.leftArm.x * w);
      const leftArmRotZ = (b.leftArm.z * (1 - w) + fly.leftArm.z * w);
      const rightArmRotX = (b.rightArm.x * (1 - w) + fly.rightArm.x * w);
      const rightArmRotZ = (b.rightArm.z * (1 - w) + fly.rightArm.z * w);
      const leftLegRotX = (b.leftLeg.x * (1 - w) + fly.leftLeg.x * w) + legFlutter;
      const rightLegRotX = (b.rightLeg.x * (1 - w) + fly.rightLeg.x * w) - legFlutter;

      if (skin.body) {
        skin.body.rotation.x = bodyRotX + bodyNoiseX;
        skin.body.rotation.y = b.body.y;
        skin.body.rotation.z = b.body.z + bodyNoiseZ;
      }

      skin.leftArm.rotation.x = leftArmRotX + armTremorL;
      skin.leftArm.rotation.y = b.leftArm.y;
      skin.leftArm.rotation.z = leftArmRotZ + armLDriftZ;

      skin.rightArm.rotation.x = rightArmRotX + armTremorR;
      skin.rightArm.rotation.y = b.rightArm.y;
      skin.rightArm.rotation.z = rightArmRotZ + armRDriftZ + waveOscZ;

      skin.leftLeg.rotation.x = leftLegRotX + legLDriftX + legSway;
      skin.leftLeg.rotation.y = b.leftLeg.y;
      skin.leftLeg.rotation.z = b.leftLeg.z;

      skin.rightLeg.rotation.x = rightLegRotX + legRDriftX - legSway;
      skin.rightLeg.rotation.y = b.rightLeg.y;
      skin.rightLeg.rotation.z = b.rightLeg.z;

      // 5. Drive Head inside FloatAnimation
      this.updateHeadLook(player);
    }

    updateHeadLook(player) {
      if (!player.skin || !player.skin.head) return;

      const stage = document.getElementById('avatar-stage');
      if (!stage) return;

      const stageRect = stage.getBoundingClientRect();
      const headScreenX = stageRect.left + stageRect.width * 0.5;
      const headScreenY = stageRect.top + stageRect.height * 0.15;

      const dx = currentLookTargetX - headScreenX;
      const dy = currentLookTargetY - headScreenY;

      const halfW = Math.max(1, window.innerWidth * 0.5);
      const halfH = Math.max(1, window.innerHeight * 0.5);

      const rawYaw = (dx / halfW) * CONFIG.HEAD_YAW_SIGN;
      const rawPitch = (dy / halfH) * CONFIG.HEAD_PITCH_SIGN;

      const bodyYaw = player.rotation.y - CONFIG.ROT_OFFSET;
      const targetHeadYaw = rawYaw - bodyYaw;

      let clampedYaw = 0;
      let clampedPitch = 0;

      if (flightW > 0.3) {
        clampedYaw = Math.max(-0.25, Math.min(0.25, targetHeadYaw));
        clampedPitch = Math.max(-0.15, Math.min(0.15, rawPitch));
      } else if (fDisplay < 0.2) {
        const lookUpBias = -0.18; // tilt head up towards title
        clampedYaw = Math.max(-0.45, Math.min(0.45, targetHeadYaw));
        clampedPitch = Math.max(-0.25, Math.min(0.25, rawPitch)) + lookUpBias;
      } else {
        clampedYaw = Math.max(-0.8, Math.min(0.8, targetHeadYaw));
        clampedPitch = Math.max(-0.4, Math.min(0.4, rawPitch));
      }

      this.headYaw += (clampedYaw - this.headYaw) * 0.05;
      this.headPitch += (clampedPitch - this.headPitch) * 0.05;

      player.skin.head.rotation.y = this.headYaw;
      player.skin.head.rotation.x = this.headPitch;
      player.skin.head.rotation.z = 0;
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

      // Start audio immediately if not yet playing
      if (tryStartAudioGlobal) {
        tryStartAudioGlobal();
      }

      // Re-anchor home avatar to banner
      updateHomeAvatarAnchor();

      // Handle deep links on page arrival (e.g. #esperienze/pixymc or #esperienze)
      if (window.location.hash && window.location.hash !== '#home') {
        setTimeout(handleRoute, 150);
      } else {
        updateNavIndicator('home');
      }

      setTimeout(() => {
        openingScreen.style.display = 'none';
      }, 850);
    }

    // If arriving via direct deep link (e.g. from servers/*.html or bookmark), skip the opening delay
    if (window.location.hash && window.location.hash !== '#home') {
      finishOpening();
      return;
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
  // TITLE DECRYPT EFFECT (Random glyphs resolving left to right per span)
  // ==========================================================================
  function decryptTitle(el, targetText, duration) {
    const chars = '01!<>-_/[]{}*#+=';
    const len = targetText.length;
    const startTime = performance.now();
    const spans = el.querySelectorAll('.ch');

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const lockedCount = Math.floor(progress * len);

      if (spans.length === len) {
        for (let i = 0; i < len; i++) {
          if (i < lockedCount) {
            spans[i].textContent = targetText[i];
          } else if (i === lockedCount && progress >= 0.95) {
            spans[i].textContent = targetText[i];
          } else {
            spans[i].textContent = chars[Math.floor(Math.random() * chars.length)];
          }
        }
      } else {
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
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        if (spans.length === len) {
          for (let i = 0; i < len; i++) {
            spans[i].textContent = targetText[i];
          }
        } else {
          el.textContent = targetText;
        }
        updateHomeAvatarAnchor();
      }
    }

    requestAnimationFrame(update);
  }

  // ==========================================================================
  // HOME BANNER & AVATAR HANDS ANCHOR CALCULATION
  // ==========================================================================
  function updateCachedDimensions() {
    cachedWindowWidth = window.innerWidth;
    cachedWindowHeight = window.innerHeight;
    isMobile = cachedWindowWidth <= 768;

    const scrollContainer = document.getElementById('scroll-container');
    if (scrollContainer) {
      cachedSectionHeight = scrollContainer.clientHeight || window.innerHeight;
    } else {
      cachedSectionHeight = window.innerHeight;
    }

    updateHomeAvatarAnchor();
  }

  function updateHomeAvatarAnchor() {
    const titleEl = document.getElementById('hero-title');
    const heroSwayGroup = document.getElementById('hero-sway-group');
    if (!titleEl || !heroSwayGroup) return;

    const underscoreSpan = document.querySelector('.ch-underscore');

    // 1. Avatar Home Scale
    isMobile = window.innerWidth <= 768;
    const scale = isMobile ? (CONFIG.HOME_AVATAR_SCALE * 0.8) : CONFIG.HOME_AVATAR_SCALE;

    // 2. Intrinsic Layout Dimensions (Independent of scroll position and live transforms)
    // .hero-sway-group is placed at top: 40vh, left: 50%, transform: translate(-50%, -50%)
    const groupHeight = heroSwayGroup.offsetHeight || (window.innerHeight * 0.2);
    const groupTop = (window.innerHeight * 0.40) - (groupHeight * 0.5);
    const titleTop = groupTop + (titleEl.offsetTop || 0);
    const titleHeight = titleEl.offsetHeight || (window.innerHeight * 0.15);
    const bottomY = titleTop + titleHeight;

    // 3. Hands position math
    // Model height in unscaled canvas is ~74vh (window.innerHeight * 0.74)
    // Distance from center of unscaled avatar to raised hands top is ~0.37 * window.innerHeight
    const handsDistFromCenter = (window.innerHeight * 0.74 * 0.5) * scale;

    let targetX = window.innerWidth * 0.5;
    if (CONFIG.HOLD_ANCHOR === 'underscore' && underscoreSpan) {
      const titleLeft = (window.innerWidth * 0.5) - (titleEl.offsetWidth * 0.5);
      targetX = titleLeft + (underscoreSpan.offsetLeft || 0) + ((underscoreSpan.offsetWidth || 0) * 0.5);
    }

    const targetY = CONFIG.HOLD_TITLE
      ? (bottomY + window.innerHeight * 0.012)
      : (titleTop - window.innerHeight * 0.04);

    const ax = targetX - (window.innerWidth * 0.5);
    const ay = targetY + handsDistFromCenter - (window.innerHeight * 0.5);

    cachedAnchorAxPx = ax;
    cachedAnchorAyPx = ay;
    cachedAnchorScale = scale;

    document.documentElement.style.setProperty('--home-ax', `${ax.toFixed(2)}px`);
    document.documentElement.style.setProperty('--home-ay', `${ay.toFixed(2)}px`);
    document.documentElement.style.setProperty('--home-as', `${scale.toFixed(3)}`);
    document.documentElement.style.setProperty('--spill-opacity', CONFIG.SPILL_OPACITY);

    heroSwayGroup.style.transformOrigin = '50% 50%';
    const avatarFloatEl = document.getElementById('avatar-float');
    if (avatarFloatEl) {
      avatarFloatEl.style.transformOrigin = '50% 50%';
    }
  }

  function smoothstep(x) {
    const c = Math.max(0, Math.min(1, x));
    return c * c * (3 - 2 * c);
  }

  function resolveKeyframe(kf) {
    if (kf.anchor || kf.x === 'anchor') {
      return {
        x: cachedAnchorAxPx,
        y: cachedAnchorAyPx,
        scale: cachedAnchorScale,
        yaw: (typeof kf.yaw === 'number') ? kf.yaw : 0.15,
        roll: 0
      };
    }
    const isMob = cachedWindowWidth <= 768;
    const kfX = (kf.x / 100) * cachedWindowWidth;
    const kfY = (kf.y / 100) * cachedWindowHeight + (CONFIG.AVATAR_Y_OFFSET || 0);
    const kfScale = isMob ? (kf.scaleMobile || kf.scale * 0.75) : kf.scale;
    return {
      x: kfX,
      y: kfY,
      scale: kfScale,
      yaw: kf.yaw || 0,
      roll: kf.roll || 0
    };
  }

  function runFrameFlightTick(nowSec, dt) {
    // 1. Determine target scroll fraction
    const targetF = (manualF !== null) ? manualF : targetScrollF;

    // 2. Smoothly scrub displayed value
    fDisplay += (targetF - fDisplay) * 0.14;
    fDisplay = Math.max(0, Math.min(3, fDisplay));

    // 3. Scroll velocity & flight weight (smoothed: fast rise, slow fall ~1s)
    const frameDt = Math.max(0.001, dt);
    scrollVelocity = (fDisplay - prevFDisplay) / frameDt;
    prevFDisplay = fDisplay;

    const targetW = Math.min(1, Math.max(0, Math.abs(scrollVelocity) / CONFIG.FLIGHT_VELOCITY_REF));
    if (targetW > flightW) {
      flightW += (targetW - flightW) * 0.25;
    } else {
      flightW += (targetW - flightW) * Math.min(1, frameDt / 1.0);
    }

    // 4. Wave trigger on first landing at chi_sono
    if (Math.abs(fDisplay - 1.0) < 0.08 && flightW < 0.25 && floatAnimation && !floatAnimation.hasDoneChiSonoWave) {
      floatAnimation.hasDoneChiSonoWave = true;
      floatAnimation.triggerWave(2.2);
    }

    // 5. Interpolate keyframes
    const kfs = CONFIG.AVATAR_KEYFRAMES;
    let seg = Math.floor(fDisplay);
    if (seg >= kfs.length - 1) seg = kfs.length - 2;
    if (seg < 0) seg = 0;

    const u = Math.min(1, Math.max(0, fDisplay - seg));
    const t = smoothstep(u);

    const kfA = resolveKeyframe(kfs[seg]);
    const kfB = resolveKeyframe(kfs[seg + 1]);

    const baseX = kfA.x + (kfB.x - kfA.x) * t;
    const baseY = kfA.y + (kfB.y - kfA.y) * t;
    const baseScale = kfA.scale + (kfB.scale - kfA.scale) * t;
    const baseYaw = kfA.yaw + (kfB.yaw - kfA.yaw) * t;
    const baseRoll = kfA.roll + (kfB.roll - kfA.roll) * t;

    // Flight curved arc (alternate direction per segment)
    const dir = (seg % 2 === 0) ? 1 : -1;
    const sinT = Math.sin(Math.PI * t);
    const arcX = (CONFIG.FLIGHT_ARC_X / 100) * cachedWindowWidth * sinT * dir;
    const arcY = -(CONFIG.FLIGHT_ARC_Y / 100) * cachedWindowHeight * sinT; // lift
    const swoop = 1 + CONFIG.FLIGHT_SWOOP * sinT;
    const bankRoll = CONFIG.FLIGHT_ROLL * sinT * dir;

    const finalX = baseX + arcX;
    const finalY = baseY + arcY;
    const finalScale = baseScale * swoop;
    const finalRoll = baseRoll + bankRoll;

    lastComputedStageX = finalX;
    lastComputedStageY = finalY;

    // Apply transform directly to #avatar-stage (translate3d, scale, rotate)
    const stage = document.getElementById('avatar-stage');
    if (stage) {
      stage.style.transform = `translate3d(${finalX.toFixed(2)}px, ${finalY.toFixed(2)}px, 0) scale(${finalScale.toFixed(3)}) rotate(${finalRoll.toFixed(4)}rad)`;
    }

    // Pass target yaw to model
    if (!activeDetailId) {
      targetPlayerRotY = baseYaw;
    }

    // 6. Home pendulum bob (pure vertical gentle synchronized bob, no tilting/rotation)
    const heroSwayGroup = document.getElementById('hero-sway-group');
    const avatarFloatEl = document.getElementById('avatar-float');
    let homeWeight = 0;
    if (fDisplay < 0.35) {
      homeWeight = Math.max(0, 1 - (fDisplay / 0.35));
    }

    if (!prefersReducedMotion && homeWeight > 0.001) {
      const bobPx = (cachedWindowHeight * (CONFIG.FLOAT_BOB / 100)) * Math.sin(nowSec * (2 * Math.PI / 6.0)) * homeWeight;

      if (heroSwayGroup) {
        heroSwayGroup.style.transform = `translate(-50%, -50%) translate3d(0, ${bobPx.toFixed(2)}px, 0)`;
      }

      if (avatarFloatEl) {
        avatarFloatEl.style.transformOrigin = '50% 50%';
        avatarFloatEl.style.transform = `translate3d(0, ${bobPx.toFixed(2)}px, 0)`;
      }
    } else {
      if (heroSwayGroup) {
        heroSwayGroup.style.transform = 'translate(-50%, -50%)';
      }
      if (!prefersReducedMotion && avatarFloatEl && fDisplay >= 0.35) {
        // Zero-gravity bob & gentle roll in subsequent sections
        const nonHomeWeight = Math.min(1, (fDisplay - 0.35) / 0.2);
        const bobPx = (cachedWindowHeight * (CONFIG.FLOAT_BOB / 100)) * Math.sin(nowSec * (2 * Math.PI / 6.0)) * nonHomeWeight * (1 - flightW);
        const rollDeg = 1.5 * Math.sin(nowSec * (2 * Math.PI / 9.0)) * nonHomeWeight * (1 - flightW);
        avatarFloatEl.style.transformOrigin = '50% 50%';
        avatarFloatEl.style.transform = `translate3d(0, ${bobPx.toFixed(2)}px, 0) rotate(${rollDeg.toFixed(2)}deg)`;
      } else if (avatarFloatEl) {
        avatarFloatEl.style.transform = 'none';
      }
    }

    // 7. Title & Actions scrub
    const heroTitle = document.getElementById('hero-title');
    if (heroTitle) {
      if (fDisplay <= 0.6) {
        const p = fDisplay / 0.6;
        const s = 1 + 0.18 * p;
        const op = Math.max(0, 1 - p);
        const bl = (6 * p).toFixed(1);
        heroTitle.style.transform = `scale(${s.toFixed(3)})`;
        heroTitle.style.opacity = op.toFixed(3);
        heroTitle.style.filter = `blur(${bl}px)`;
        heroTitle.style.pointerEvents = op < 0.1 ? 'none' : 'auto';
      } else {
        heroTitle.style.opacity = '0';
        heroTitle.style.filter = 'blur(6px)';
        heroTitle.style.pointerEvents = 'none';
      }
    }

    const heroSubElements = document.querySelectorAll('.hero-subtitle, .hero-actions, .scroll-hint');
    if (fDisplay <= 0.3) {
      const subOp = Math.max(0, 1 - (fDisplay / 0.3));
      heroSubElements.forEach((el) => {
        el.style.opacity = subOp.toFixed(3);
        el.style.pointerEvents = subOp < 0.1 ? 'none' : 'auto';
      });
    } else {
      heroSubElements.forEach((el) => {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      });
    }

    // 8. Continuous background word sliding scrub
    const bgWordTargets = [
      { sel: '#chi_sono .section-bg-word', index: 1 },
      { sel: '#esperienze .section-bg-word', index: 2 },
      { sel: '#contatti .section-bg-word', index: 3 }
    ];
    bgWordTargets.forEach((item) => {
      const el = document.querySelector(item.sel);
      if (el) {
        const dist = fDisplay - item.index;
        if (Math.abs(dist) < 1.2) {
          const op = Math.max(0, 1 - Math.abs(dist)) * 0.12;
          const shiftPx = dist * 70;
          if (item.sel.includes('contatti')) {
            el.style.transform = `translate(-50%, -50%) translateX(${shiftPx.toFixed(1)}px)`;
          } else {
            el.style.transform = `translateY(-50%) translateX(${shiftPx.toFixed(1)}px)`;
          }
          el.style.opacity = op.toFixed(3);
        } else {
          el.style.opacity = '0';
        }
      }
    });
  }

  // ==========================================================================
  // 2. AVATAR STATE MACHINE & ZERO-GRAVITY FRAME TICK
  // ==========================================================================
  function setAvatarState(state) {
    currentAvatarState = state;

    const stage = document.getElementById('avatar-stage');
    if (stage) {
      stage.classList.remove('state-home', 'state-chi_sono', 'state-esperienze', 'state-esperienze-detail', 'state-contatti');
      stage.classList.add(`state-${state}`);
    }

    if (!skinViewer) return;

    // Directional rotation for state
    if (state === 'chi_sono') {
      targetPlayerRotY = CONFIG.ROT_ABOUT;
    } else if (state === 'esperienze') {
      targetPlayerRotY = CONFIG.ROT_EXP;
    } else if (state === 'esperienze-detail') {
      targetPlayerRotY = CONFIG.ROT_EXP_DETAIL;
    } else if (state === 'home') {
      targetPlayerRotY = 0.15; // slight turn in home holding banner
      updateHomeAvatarAnchor();
    } else {
      targetPlayerRotY = 0;
    }

    if (floatAnimation) {
      floatAnimation.onSectionChange(state);
    }

    currentReadingIndex = 0;
    setDesiredLookTarget(desiredLookTargetX, desiredLookTargetY, 0.8);
    scheduleNextReadingTarget();
  }

  function updateViewerSize() {
    if (!skinViewer) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    isMobile = w <= 768;
    skinViewer.width = w;
    skinViewer.height = h;

    if (skinViewer.renderer) {
      skinViewer.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      skinViewer.renderer.setSize(w, h, false);
    }

    // Use configurable zoom from CONFIG (~74vh tall on desktop)
    skinViewer.zoom = isMobile ? CONFIG.AVATAR_ZOOM_MOBILE : CONFIG.AVATAR_ZOOM_DESKTOP;

    const stage = document.getElementById('avatar-stage');
    if (stage) {
      stage.style.setProperty('--avatar-y', `${CONFIG.AVATAR_Y_OFFSET}px`);
    }

    updateHomeAvatarAnchor();
  }

  function initAvatar() {
    const canvas = document.getElementById('avatar-canvas');
    const fallbackImg = document.getElementById('avatar-fallback');

    function showFallback() {
      if (canvas) canvas.style.display = 'none';
      if (fallbackImg) fallbackImg.style.display = 'block';

      let lastFallbackTime = performance.now();
      function fallbackLoop() {
        const now = performance.now();
        const nowSec = now / 1000;
        const dt = Math.min(0.1, (now - lastFallbackTime) / 1000);
        lastFallbackTime = now;

        runFrameFlightTick(nowSec, dt);
        updateLookTargetEveryFrame();
        requestAnimationFrame(fallbackLoop);
      }
      requestAnimationFrame(fallbackLoop);
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

      if (skinViewer.renderer) {
        skinViewer.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        skinViewer.renderer.setSize(window.innerWidth, window.innerHeight, false);
      }

      skinViewer.controls.enabled = false;
      skinViewer.autoRotate = false; // Smoothly controlled via zero-g per-frame lerp

      // Single custom FloatAnimation engine owning all joints
      skinViewer.animation = new FloatAnimation();
      floatAnimation = skinViewer.animation;

      // Apply light intensities from CONFIG
      if (skinViewer.globalLight) skinViewer.globalLight.intensity = CONFIG.GLOBAL_LIGHT;
      if (skinViewer.cameraLight) skinViewer.cameraLight.intensity = CONFIG.CAMERA_LIGHT;

      // Ensure CSS filter variables and haze opacity match CONFIG
      document.documentElement.style.setProperty('--avatar-contrast', CONFIG.AVATAR_CONTRAST);
      document.documentElement.style.setProperty('--avatar-brightness', CONFIG.AVATAR_BRIGHTNESS);
      document.documentElement.style.setProperty('--avatar-haze-opacity', CONFIG.HAZE_OPACITY);

      // Initial rotation facing front (ROT_OFFSET = 0)
      if (skinViewer.playerObject) {
        skinViewer.playerObject.rotation.y = CONFIG.ROT_OFFSET;
      }

      updateViewerSize();

      const avatarFloatEl = document.getElementById('avatar-float');

      // Hook skinViewer.render: runs per frame
      let lastRenderTime = performance.now();
      const origRender = skinViewer.render.bind(skinViewer);
      skinViewer.render = function () {
        const now = performance.now();
        const nowSec = now / 1000;
        const dt = Math.min(0.1, (now - lastRenderTime) / 1000);
        lastRenderTime = now;

        // 1. Run scroll-driven flight & keyframe interpolation
        runFrameFlightTick(nowSec, dt);

        // 2. Update on-screen look targets
        updateLookTargetEveryFrame();

        // 3. Continuous rotation lerp on player.rotation.y (NEVER move the camera)
        if (skinViewer.playerObject) {
          let yawDrift = 0;
          if (!prefersReducedMotion && fDisplay >= 0.35 && flightW < 0.2) {
            yawDrift = 0.12 * Math.sin(nowSec * (2 * Math.PI / 11.0));
          }
          const finalTargetRotY = targetPlayerRotY + CONFIG.ROT_OFFSET + yawDrift;
          skinViewer.playerObject.rotation.y += (finalTargetRotY - skinViewer.playerObject.rotation.y) * 0.08;
        }

        origRender();
      };

      // Set initial section state
      setAvatarState(activeSectionId || 'home');
      updateCachedDimensions();
      if (document.fonts) {
        document.fonts.ready.then(updateCachedDimensions);
      }

      // Track mouse across screen for head following in home section
      window.addEventListener('mousemove', (e) => {
        mouseInWindow = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
      }, { passive: true });

      document.addEventListener('mouseenter', () => {
        mouseInWindow = true;
      });

      document.addEventListener('mouseleave', () => {
        mouseInWindow = false;
      });

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
  // CLICK / TAP INTERACTION (Single Small Wave, No Jumps, No Spins)
  // ==========================================================================
  function initAvatarInteraction() {
    function handleInteraction(clientX, clientY, target) {
      if (target && target.closest('button, a, input, select, textarea, [role="button"], #opening-screen, .opening-screen, .avatar-debug-panel, #proofs-modal, .proofs-modal')) {
        return;
      }
      if (!skinViewer || !floatAnimation) return;
      if (currentAvatarState === 'home') return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let shiftX = 0;
      let shiftY = CONFIG.AVATAR_Y_OFFSET;

      if (currentAvatarState === 'chi_sono') {
        shiftX = vw * 0.22;
        shiftY = CONFIG.AVATAR_Y_OFFSET * 0.8;
      } else if (currentAvatarState === 'esperienze' || currentAvatarState === 'esperienze-detail') {
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
        floatAnimation.triggerWave(2.0);
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

    let starCount = isMobile ? 40 : 100;
    const stars = [];
    const meteors = [];
    const thrustParticles = [];

    function populateStars() {
      stars.length = 0;
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 0.9 + 0.4,
          baseAlpha: Math.random() * 0.45 + 0.2,
          speedY: (Math.random() - 0.5) * 0.04, // Calm, subtle omnidirectional floating (no fast downward rain)
          speedX: (Math.random() - 0.5) * 0.04,
          twinkleSpeed: Math.random() * 1.6 + 0.8,
          phase: Math.random() * Math.PI * 2,
          depth: Math.random() * 0.8 + 0.2, // Depth z (0.2..1.0) for radial warp streaks
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

    let nextMeteorTime = performance.now() + (Math.random() * 8000 + 7000); // 7-15 seconds

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

        // 1. Draw and drift stars / radial warp streaks
        const avatarCenterX = (width * 0.5) + lastComputedStageX;
        const avatarCenterY = (height * 0.5) + lastComputedStageY;
        const isWarping = !prefersReducedMotion && Math.abs(scrollVelocity) > 0.08;

        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];

          if (isWarping) {
            // Draw radial streak from avatar screen position (outward when down, inward when up)
            let dx = s.x - avatarCenterX;
            let dy = s.y - avatarCenterY;
            let dist = Math.hypot(dx, dy);
            if (dist < 1) { dx = 0; dy = 1; dist = 1; }
            const dirX = dx / dist;
            const dirY = dy / dist;

            let streakLen = scrollVelocity * s.depth * CONFIG.WARP_STRENGTH;
            if (streakLen > 70) streakLen = 70;
            if (streakLen < -70) streakLen = -70;

            const tailX = s.x - dirX * streakLen;
            const tailY = s.y - dirY * streakLen;

            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(tailX, tailY);
            ctx.strokeStyle = 'rgba(196, 181, 255, 0.35)';
            ctx.lineWidth = s.radius * 1.6;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = 0.55;
            ctx.fill();
          } else {
            s.y += s.speedY;
            s.x += s.speedX;

            if (s.y < 0) s.y = height;
            if (s.y > height) s.y = 0;
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
        }

        // 2. Spawn and render shooting stars (meteors)
        if (now >= nextMeteorTime) {
          spawnMeteor();
          nextMeteorTime = now + (Math.random() * 8000 + 7000); // 7-15s
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

        // 3. Subtle thrust particles under avatar feet when in home section
        if (activeSectionId === 'home' && !prefersReducedMotion) {
          const ax = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--home-ax')) || 0;
          const ay = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--home-ay')) || 0;
          const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--home-as')) || CONFIG.HOME_AVATAR_SCALE;
          const feetX = (width * 0.5) + ax;
          const feetY = (height * 0.5) + ay + (height * 0.74 * 0.5 * scale);

          if (thrustParticles.length < 10 && Math.random() < 0.35) {
            thrustParticles.push({
              x: feetX + (Math.random() - 0.5) * 16 * scale,
              y: feetY + Math.random() * 4,
              vx: (Math.random() - 0.5) * 0.4,
              vy: Math.random() * 0.7 + 0.5,
              radius: Math.random() * 0.8 + 0.6,
              alpha: 0.55,
              color: Math.random() > 0.5 ? '#5ea8ff' : '#c4b5ff'
            });
          }
        }

        for (let i = thrustParticles.length - 1; i >= 0; i--) {
          const tp = thrustParticles[i];
          tp.x += tp.vx;
          tp.y += tp.vy;
          tp.alpha -= 0.015;
          if (tp.alpha <= 0) {
            thrustParticles.splice(i, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, tp.radius, 0, Math.PI * 2);
          ctx.fillStyle = tp.color;
          ctx.globalAlpha = tp.alpha;
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
      starCount = (window.innerWidth <= 768) ? 40 : 100;
      populateStars();
      if (prefersReducedMotion) renderStatic();
    }, { passive: true });
  }

  // ==========================================================================
  // 4. IN-PAGE EXPERIENCE DETAILS ENGINE & ROUTING
  // ==========================================================================
  function renderExperienceDetail(key) {
    const exp = EXPERIENCE_DETAILS[key];
    const detailEl = document.getElementById('experience-detail-view');
    if (!exp || !detailEl) return;

    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.it;

    let proofsBtnHtml = '';
    if (exp.proofs && exp.proofs.length > 0) {
      proofsBtnHtml = `
        <div class="detail-actions">
          <button id="detail-proofs-btn" class="detail-proofs-btn mono cursor-pointer" data-exp="${key}">
            ${dict.openProofs || '[ APRI PROVE ]'}
          </button>
        </div>
      `;
    }

    let prosConsHtml = '';
    if (exp.strengths || exp.weaknesses) {
      prosConsHtml = `
        <div class="detail-pros-cons-grid">
          ${exp.strengths ? `
            <div class="detail-pro-card">
              <h5 class="detail-card-title mono accent">${exp.strengthsTitle[currentLang]}</h5>
              <ul class="detail-list mono">
                ${exp.strengths[currentLang].map((item) => `<li><span class="bullet accent">▹</span> <span>${item}</span></li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${exp.weaknesses ? `
            <div class="detail-con-card">
              <h5 class="detail-card-title mono violet">${exp.weaknessesTitle[currentLang]}</h5>
              <ul class="detail-list mono">
                ${exp.weaknesses[currentLang].map((item) => `<li><span class="bullet violet">▹</span> <span>${item}</span></li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `;
    }

    let reviewHtml = '';
    if (exp.experienceParagraphs) {
      reviewHtml = `
        <div class="detail-review-section">
          <h4 class="detail-review-title">${exp.experienceTitle[currentLang]}</h4>
          <div class="detail-paragraphs">
            ${exp.experienceParagraphs[currentLang].map((p) => `<p>${p}</p>`).join('')}
          </div>
        </div>
      `;
    }

    let noticeHtml = '';
    if (exp.inProgress) {
      noticeHtml = `
        <div class="detail-notice-box">
          <p class="detail-notice-tag mono accent">${exp.noticeTag[currentLang]}</p>
          <p class="detail-notice-text mono">${exp.noticeText[currentLang]}</p>
        </div>
      `;
    }

    detailEl.innerHTML = `
      <div class="detail-top-nav">
        <button id="btn-back-to-experiences" class="detail-back-btn mono cursor-pointer" aria-label="Torna alle esperienze">
          ${dict.backToExperiences || '[ ← torna alle esperienze ]'}
        </button>
      </div>

      <div class="detail-header">
        <div class="detail-header-left">
          <div class="detail-title-row">
            <span class="detail-index mono">${exp.index}</span>
            <h3 class="detail-title gradient-text">${exp.title}</h3>
          </div>
          <p class="detail-role mono">${exp.role[currentLang]}</p>
        </div>
        <div class="detail-header-right mono">
          ${exp.stars ? `<span class="detail-stars">${exp.stars}</span>` : ''}
          <span class="detail-tag ${exp.inProgress ? 'accent' : 'muted'}">${exp.status[currentLang]}</span>
          <span class="detail-tag accent">${exp.period[currentLang]}</span>
        </div>
      </div>

      <div class="detail-divider"></div>

      <div class="detail-body">
        ${noticeHtml}
        ${reviewHtml}
        ${prosConsHtml}
        ${proofsBtnHtml}
      </div>
    `;

    // Wire back button
    const backBtn = detailEl.querySelector('#btn-back-to-experiences');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeExperienceDetail(true);
      });
    }

    // Wire proofs button
    const proofsBtn = detailEl.querySelector('#detail-proofs-btn');
    if (proofsBtn) {
      proofsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openProofsModal(key);
      });
    }
  }

  function openExperienceDetail(key, updateHistory = true) {
    if (!EXPERIENCE_DETAILS[key]) return;
    activeDetailId = key;

    if (updateHistory) {
      history.pushState({ exp: key }, '', `#esperienze/${key}`);
    }

    renderExperienceDetail(key);

    const cardsView = document.getElementById('experiences-cards-view');
    const detailView = document.getElementById('experience-detail-view');
    if (!cardsView || !detailView) return;

    detailView.style.display = 'block';
    detailView.setAttribute('aria-hidden', 'false');
    detailView.scrollTop = 0;

    // Trigger smooth 500ms slide/fade transition
    requestAnimationFrame(() => {
      cardsView.classList.add('view-hidden');
      detailView.classList.remove('view-hidden');
      detailView.classList.add('view-active');

      // Trigger avatar reaction (substate 'esperienze-detail': turns slightly toward panel and nods)
      setAvatarState('esperienze-detail');
    });

    setTimeout(() => {
      if (activeDetailId === key) {
        cardsView.style.display = 'none';
        cardsView.setAttribute('aria-hidden', 'true');
      }
    }, 500);
  }

  function closeExperienceDetail(updateHistory = true) {
    if (!activeDetailId) return;
    activeDetailId = null;

    if (updateHistory) {
      history.pushState(null, '', '#esperienze');
    }

    const cardsView = document.getElementById('experiences-cards-view');
    const detailView = document.getElementById('experience-detail-view');
    if (!cardsView || !detailView) return;

    cardsView.style.display = 'block';
    cardsView.setAttribute('aria-hidden', 'false');

    requestAnimationFrame(() => {
      cardsView.classList.remove('view-hidden');
      detailView.classList.remove('view-active');
      detailView.classList.add('view-hidden');

      // Avatar returns to walking pose in 'esperienze'
      setAvatarState('esperienze');
    });

    setTimeout(() => {
      if (!activeDetailId) {
        detailView.style.display = 'none';
        detailView.setAttribute('aria-hidden', 'true');
      }
    }, 500);
  }

  // ==========================================================================
  // PROOFS MODAL CONTROLS
  // ==========================================================================
  function openProofsModal(key) {
    const exp = EXPERIENCE_DETAILS[key];
    const modal = document.getElementById('proofs-modal');
    const titleEl = document.getElementById('proofs-modal-title');
    const linksEl = document.getElementById('proofs-modal-links');
    if (!exp || !modal || !titleEl || !linksEl) return;

    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.it;
    titleEl.textContent = `${dict.proofsTitle || 'Link e Prove'} (${exp.title})`;

    linksEl.innerHTML = exp.proofs.map((p) => `
      <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="proof-link-item mono">
        <span class="proof-icon">↗</span>
        <span class="proof-url truncate">${p.url}</span>
      </a>
    `).join('');

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');

    requestAnimationFrame(() => {
      modal.classList.add('modal-open');
    });
  }

  function closeProofsModal() {
    const modal = document.getElementById('proofs-modal');
    if (!modal) return;

    modal.classList.remove('modal-open');
    setTimeout(() => {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }, 300);
  }

  function initProofsModal() {
    const modal = document.getElementById('proofs-modal');
    const closeBtn = document.getElementById('proofs-modal-close');
    if (!modal) return;

    if (closeBtn) {
      closeBtn.addEventListener('click', closeProofsModal);
    }

    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('proofs-backdrop') || e.target === modal) {
        closeProofsModal();
      }
    });
  }

  function initExperienceCards() {
    // Experience Category Filter Tabs (Tutto / Minecraft / Discord)
    const tabBtns = document.querySelectorAll('.exp-tab-btn');
    const expGroups = document.querySelectorAll('.exp-group');

    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        tabBtns.forEach((b) => b.classList.toggle('active', b === btn));

        expGroups.forEach((group) => {
          const cat = group.getAttribute('data-category');
          if (filter === 'all' || cat === filter) {
            group.classList.remove('group-hidden');
          } else {
            group.classList.add('group-hidden');
          }
        });
      });
    });

    // Intercept clicks on experience cards to keep visitor inside the single-page layout
    document.querySelectorAll('.card-minimal[data-exp]').forEach((card) => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const key = card.getAttribute('data-exp');
        if (key && EXPERIENCE_DETAILS[key]) {
          openExperienceDetail(key, true);
        }
      });

      card.addEventListener('mouseenter', () => {
        hoveredCard = card;
        const r = card.getBoundingClientRect();
        setDesiredLookTarget(r.left + r.width * 0.5, r.top + r.height * 0.5, 0.8);
        if (floatAnimation) {
          floatAnimation.onCardHover(true);
        }
      });

      card.addEventListener('mouseleave', () => {
        hoveredCard = null;
        if (floatAnimation) {
          floatAnimation.onCardHover(false);
        }
      });
    });

    // Contact rows hover targeting
    document.querySelectorAll('#contatti .contact-row').forEach((row) => {
      row.addEventListener('mouseenter', () => {
        hoveredContactRow = row;
        const r = row.getBoundingClientRect();
        setDesiredLookTarget(r.left + r.width * 0.5, r.top + r.height * 0.5, 0.8);
      });

      row.addEventListener('mouseleave', () => {
        hoveredContactRow = null;
      });
    });
  }

  function handleRoute() {
    const hash = window.location.hash;
    if (!hash || hash === '' || hash === '#') {
      if (activeDetailId) {
        closeExperienceDetail(false);
      }
      updateNavIndicator('home');
      return;
    }

    // Check deep links like #esperienze/pixymc
    if (hash.startsWith('#esperienze/')) {
      const key = hash.replace('#esperienze/', '').toLowerCase();
      if (EXPERIENCE_DETAILS[key]) {
        const expSec = document.getElementById('esperienze');
        if (expSec) {
          expSec.scrollIntoView({ behavior: 'smooth' });
        }
        openExperienceDetail(key, false);
        updateNavIndicator('esperienze');
        return;
      }
    }

    // Top-level sections (#home, #chi_sono, #esperienze, #contatti)
    const secId = hash.replace('#', '');
    const targetSec = document.getElementById(secId);
    if (targetSec) {
      if (activeDetailId) {
        closeExperienceDetail(false);
      }
      targetSec.scrollIntoView({ behavior: 'smooth' });
      updateNavIndicator(secId);
    }
  }

  // ==========================================================================
  // 5. NAVIGATION, UNDERLINE INDICATOR, i18n & SCROLL-SNAP INTERSECTIONOBSERVER
  // ==========================================================================
  function updateNavIndicator(activeId) {
    const navIndicator = document.getElementById('nav-indicator');
    const lookupId = (activeId === 'esperienze-detail') ? 'esperienze' : activeId;
    const activeLink = document.querySelector(`.nav-link[href="#${lookupId}"]`);
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
      if (link.getAttribute('href') === `#${lookupId}`) {
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
        if (key === 'aboutText') {
          el.innerHTML = dict[key];
        } else {
          el.textContent = dict[key];
        }
      }
    });

    // If an experience detail is open, immediately re-render it with new language
    if (activeDetailId) {
      renderExperienceDetail(activeDetailId);
    }

    // Re-anchor home avatar on language change & update cached dimensions
    updateCachedDimensions();

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

          if (activeSectionId === 'esperienze' && activeDetailId) {
            setAvatarState('esperienze-detail');
          } else {
            setAvatarState(activeSectionId);
          }

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
          if (activeDetailId && targetId !== '#esperienze') {
            closeExperienceDetail(true);
          }
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

    // Initial Indicator & cached dimensions update
    updateCachedDimensions();
    updateNavIndicator(activeSectionId);
    window.addEventListener('resize', () => {
      updateCachedDimensions();
      updateNavIndicator(activeSectionId);
    }, { passive: true });

    // Passive scroll listener for continuous scroll-driven flight
    const scrollContainer = document.getElementById('scroll-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', () => {
        if (manualF === null && cachedSectionHeight > 0) {
          targetScrollF = scrollContainer.scrollTop / cachedSectionHeight;
        }
      }, { passive: true });
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

    // History & routing events
    window.addEventListener('popstate', handleRoute);
    window.addEventListener('hashchange', handleRoute);
  }

  // ==========================================================================
  // 6. AUDIO CONTROLS & REAL PLAYLIST ENGINE
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

    function tryStartAudio() {
      if (audio && audio.paused) {
        const p = audio.play();
        if (p !== undefined) {
          p.then(() => {
            isPlaying = true;
            if (audioToggleBtn) audioToggleBtn.classList.add('playing');
            removeGestureListeners();
          }).catch(() => {
            // Autoplay blocked until user interaction
          });
        }
      }
    }

    tryStartAudioGlobal = tryStartAudio;

    function onUserGesture() {
      tryStartAudio();
    }

    function removeGestureListeners() {
      ['click', 'pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel'].forEach((evt) => {
        window.removeEventListener(evt, onUserGesture, true);
      });
      const scrollEl = document.getElementById('scroll-container');
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', onUserGesture, true);
      }
    }

    function addGestureListeners() {
      ['click', 'pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel'].forEach((evt) => {
        window.addEventListener(evt, onUserGesture, { capture: true, once: false, passive: true });
      });
      const scrollEl = document.getElementById('scroll-container');
      if (scrollEl) {
        scrollEl.addEventListener('scroll', onUserGesture, { capture: true, once: false, passive: true });
      }
    }

    // Load initial track (dorado), attempt immediate playback and attach gesture triggers
    loadTrack(0);
    tryStartAudio();
    addGestureListeners();

    // Audio Play/Pause Button
    if (audioToggleBtn) {
      audioToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isPlaying) {
          audio.play().then(() => {
            isPlaying = true;
            audioToggleBtn.classList.add('playing');
            removeGestureListeners();
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
  // 7. SCROLL PROGRESS BAR (ACCENT GRADIENT AT VERY TOP)
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
  // 8. KEYBOARD NAVIGATION & ESCAPE KEY HANDLER
  // ==========================================================================
  function initKeyboardNav() {
    const sectionIds = ['home', 'chi_sono', 'esperienze', 'contatti'];
    let isNavigating = false;

    window.addEventListener('keydown', (e) => {
      // Escape key closes modal if open, else closes experience detail
      if (e.key === 'Escape') {
        const modal = document.getElementById('proofs-modal');
        if (modal && modal.style.display !== 'none' && modal.classList.contains('modal-open')) {
          closeProofsModal();
          return;
        }
        if (activeDetailId) {
          closeExperienceDetail(true);
          return;
        }
      }

      // Do not intercept if user is interacting with an input or editable element
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
        return;
      }

      // If experience detail is open, allow natural arrow scroll inside the panel
      if (activeDetailId && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'PageDown' || e.key === 'PageUp')) {
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
  // 9. DEBUG HELPER PANEL (?debug query parameter only)
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
        <button id="debug-copy-btn" class="debug-btn cursor-pointer" title="Copy to clipboard">[ COPY ]</button>
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
          <span>Float Bob: <b id="val-bob">${CONFIG.FLOAT_BOB.toFixed(1)}vh</b></span>
          <input type="range" id="slider-bob" min="0" max="3.0" step="0.1" value="${CONFIG.FLOAT_BOB}">
        </label>
        <label class="debug-row">
          <span>Pose Blend: <b id="val-blend">${CONFIG.POSE_BLEND.toFixed(1)}s</b></span>
          <input type="range" id="slider-blend" min="0.5" max="4.0" step="0.1" value="${CONFIG.POSE_BLEND}">
        </label>
        <label class="debug-row">
          <span>Haze Opacity: <b id="val-haze">${CONFIG.HAZE_OPACITY.toFixed(2)}</b></span>
          <input type="range" id="slider-haze" min="0" max="1.0" step="0.05" value="${CONFIG.HAZE_OPACITY}">
        </label>
        <label class="debug-row">
          <span>Contrast: <b id="val-contrast">${CONFIG.AVATAR_CONTRAST.toFixed(2)}</b></span>
          <input type="range" id="slider-contrast" min="0.4" max="1.6" step="0.02" value="${CONFIG.AVATAR_CONTRAST}">
        </label>
        <label class="debug-row">
          <span>Brightness: <b id="val-brightness">${CONFIG.AVATAR_BRIGHTNESS.toFixed(2)}</b></span>
          <input type="range" id="slider-brightness" min="0.8" max="2.5" step="0.05" value="${CONFIG.AVATAR_BRIGHTNESS}">
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
          <span>Home Scale: <b id="val-home-scale">${CONFIG.HOME_AVATAR_SCALE.toFixed(2)}</b></span>
          <input type="range" id="slider-home-scale" min="0.2" max="0.7" step="0.02" value="${CONFIG.HOME_AVATAR_SCALE}">
        </label>
        <label class="debug-row">
          <span>Spill Opacity: <b id="val-spill">${CONFIG.SPILL_OPACITY.toFixed(2)}</b></span>
          <input type="range" id="slider-spill" min="0" max="0.6" step="0.02" value="${CONFIG.SPILL_OPACITY}">
        </label>
        <label class="debug-row">
          <span>Flight Arc X: <b id="val-arc-x">${CONFIG.FLIGHT_ARC_X.toFixed(1)}vw</b></span>
          <input type="range" id="slider-arc-x" min="0" max="25" step="0.5" value="${CONFIG.FLIGHT_ARC_X}">
        </label>
        <label class="debug-row">
          <span>Flight Arc Y: <b id="val-arc-y">${CONFIG.FLIGHT_ARC_Y.toFixed(1)}vh</b></span>
          <input type="range" id="slider-arc-y" min="0" max="20" step="0.5" value="${CONFIG.FLIGHT_ARC_Y}">
        </label>
        <label class="debug-row">
          <span>Flight Swoop: <b id="val-swoop">${CONFIG.FLIGHT_SWOOP.toFixed(2)}</b></span>
          <input type="range" id="slider-swoop" min="0" max="0.4" step="0.01" value="${CONFIG.FLIGHT_SWOOP}">
        </label>
        <label class="debug-row">
          <span>Flight Roll: <b id="val-roll">${CONFIG.FLIGHT_ROLL.toFixed(2)} rad</b></span>
          <input type="range" id="slider-roll" min="0" max="0.5" step="0.01" value="${CONFIG.FLIGHT_ROLL}">
        </label>
        <label class="debug-row">
          <span>Warp Strength: <b id="val-warp">${CONFIG.WARP_STRENGTH.toFixed(0)}</b></span>
          <input type="range" id="slider-warp" min="5" max="80" step="1" value="${CONFIG.WARP_STRENGTH}">
        </label>

        <div class="debug-toggles-row">
          <button id="toggle-scrub-mode" class="debug-toggle-btn cursor-pointer">[ SCRUB: AUTO ]</button>
        </div>
        <label class="debug-row">
          <span>Manual f: <b id="val-scrub">${fDisplay.toFixed(2)}</b></span>
          <input type="range" id="slider-scrub" min="0" max="3" step="0.01" value="${fDisplay.toFixed(2)}">
        </label>

        <div class="debug-toggles-row">
          <button id="toggle-yaw" class="debug-toggle-btn cursor-pointer">[ YAW: ${CONFIG.HEAD_YAW_SIGN > 0 ? '+1' : '-1'} ]</button>
          <button id="toggle-pitch" class="debug-toggle-btn cursor-pointer">[ PITCH: ${CONFIG.HEAD_PITCH_SIGN > 0 ? '+1' : '-1'} ]</button>
        </div>

        <div class="debug-toggles-row">
          <button id="toggle-hold-title" class="debug-toggle-btn cursor-pointer">[ HOLD: ${CONFIG.HOLD_TITLE ? 'BOTTOM' : 'ABOVE'} ]</button>
          <button id="toggle-hold-anchor" class="debug-toggle-btn cursor-pointer">[ ANCHOR: ${CONFIG.HOLD_ANCHOR} ]</button>
        </div>

        <label class="debug-row">
          <span>Force Pose:</span>
          <select id="debug-pose-select" class="debug-select cursor-pointer">
            <option value="auto">[ AUTO / SECTION ]</option>
            <option value="hold">hold</option>
            <option value="neutral">neutral</option>
            <option value="open">open</option>
            <option value="reach">reach</option>
            <option value="rest">rest</option>
            <option value="point">point</option>
            <option value="wave">wave</option>
          </select>
        </label>
      </div>
      <pre id="debug-code-output" class="debug-output"></pre>
    `;

    document.body.appendChild(panel);

    const sliderZoom = panel.querySelector('#slider-zoom');
    const sliderY = panel.querySelector('#slider-y');
    const sliderRot = panel.querySelector('#slider-rot');
    const sliderBob = panel.querySelector('#slider-bob');
    const sliderBlend = panel.querySelector('#slider-blend');
    const sliderHaze = panel.querySelector('#slider-haze');
    const sliderContrast = panel.querySelector('#slider-contrast');
    const sliderBrightness = panel.querySelector('#slider-brightness');
    const sliderGLight = panel.querySelector('#slider-glight');
    const sliderCLight = panel.querySelector('#slider-clight');
    const sliderHomeScale = panel.querySelector('#slider-home-scale');
    const sliderSpill = panel.querySelector('#slider-spill');
    const sliderArcX = panel.querySelector('#slider-arc-x');
    const sliderArcY = panel.querySelector('#slider-arc-y');
    const sliderSwoop = panel.querySelector('#slider-swoop');
    const sliderRoll = panel.querySelector('#slider-roll');
    const sliderWarp = panel.querySelector('#slider-warp');
    const toggleScrubMode = panel.querySelector('#toggle-scrub-mode');
    const sliderScrub = panel.querySelector('#slider-scrub');

    const valZoom = panel.querySelector('#val-zoom');
    const valY = panel.querySelector('#val-y');
    const valRot = panel.querySelector('#val-rot');
    const valBob = panel.querySelector('#val-bob');
    const valBlend = panel.querySelector('#val-blend');
    const valHaze = panel.querySelector('#val-haze');
    const valContrast = panel.querySelector('#val-contrast');
    const valBrightness = panel.querySelector('#val-brightness');
    const valGLight = panel.querySelector('#val-glight');
    const valCLight = panel.querySelector('#val-clight');
    const valHomeScale = panel.querySelector('#val-home-scale');
    const valSpill = panel.querySelector('#val-spill');
    const valArcX = panel.querySelector('#val-arc-x');
    const valArcY = panel.querySelector('#val-arc-y');
    const valSwoop = panel.querySelector('#val-swoop');
    const valRoll = panel.querySelector('#val-roll');
    const valWarp = panel.querySelector('#val-warp');
    const valScrub = panel.querySelector('#val-scrub');

    const toggleYaw = panel.querySelector('#toggle-yaw');
    const togglePitch = panel.querySelector('#toggle-pitch');
    const toggleHoldTitle = panel.querySelector('#toggle-hold-title');
    const toggleHoldAnchor = panel.querySelector('#toggle-hold-anchor');
    const poseSelect = panel.querySelector('#debug-pose-select');
    const codeOutput = panel.querySelector('#debug-code-output');
    const copyBtn = panel.querySelector('#debug-copy-btn');

    function updateConfigReadout() {
      const code = `// COPY INTO CONFIG:
AVATAR_ZOOM_DESKTOP: ${CONFIG.AVATAR_ZOOM_DESKTOP.toFixed(2)},
AVATAR_Y_OFFSET: ${CONFIG.AVATAR_Y_OFFSET},
ROT_OFFSET: ${(CONFIG.ROT_OFFSET / Math.PI).toFixed(2)} * Math.PI, // ${(CONFIG.ROT_OFFSET).toFixed(3)} rad
FLOAT_BOB: ${CONFIG.FLOAT_BOB.toFixed(1)},
POSE_BLEND: ${CONFIG.POSE_BLEND.toFixed(1)},
HAZE_OPACITY: ${CONFIG.HAZE_OPACITY.toFixed(2)},
AVATAR_CONTRAST: ${CONFIG.AVATAR_CONTRAST.toFixed(2)},
AVATAR_BRIGHTNESS: ${CONFIG.AVATAR_BRIGHTNESS.toFixed(2)},
HEAD_YAW_SIGN: ${CONFIG.HEAD_YAW_SIGN},
HEAD_PITCH_SIGN: ${CONFIG.HEAD_PITCH_SIGN},
GLOBAL_LIGHT: ${CONFIG.GLOBAL_LIGHT.toFixed(1)},
CAMERA_LIGHT: ${CONFIG.CAMERA_LIGHT.toFixed(1)},
HOLD_ANCHOR: '${CONFIG.HOLD_ANCHOR}',
HOLD_TITLE: ${CONFIG.HOLD_TITLE},
HOME_AVATAR_SCALE: ${CONFIG.HOME_AVATAR_SCALE.toFixed(2)},
SPILL_OPACITY: ${CONFIG.SPILL_OPACITY.toFixed(2)},
FLIGHT_ARC_X: ${CONFIG.FLIGHT_ARC_X.toFixed(1)},
FLIGHT_ARC_Y: ${CONFIG.FLIGHT_ARC_Y.toFixed(1)},
FLIGHT_SWOOP: ${CONFIG.FLIGHT_SWOOP.toFixed(2)},
FLIGHT_ROLL: ${CONFIG.FLIGHT_ROLL.toFixed(2)},
WARP_STRENGTH: ${CONFIG.WARP_STRENGTH.toFixed(0)}`;
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

    sliderBob.addEventListener('input', (e) => {
      CONFIG.FLOAT_BOB = parseFloat(e.target.value);
      valBob.textContent = CONFIG.FLOAT_BOB.toFixed(1) + 'vh';
      updateConfigReadout();
    });

    sliderBlend.addEventListener('input', (e) => {
      CONFIG.POSE_BLEND = parseFloat(e.target.value);
      valBlend.textContent = CONFIG.POSE_BLEND.toFixed(1) + 's';
      updateConfigReadout();
    });

    sliderHaze.addEventListener('input', (e) => {
      CONFIG.HAZE_OPACITY = parseFloat(e.target.value);
      valHaze.textContent = CONFIG.HAZE_OPACITY.toFixed(2);
      document.documentElement.style.setProperty('--avatar-haze-opacity', CONFIG.HAZE_OPACITY);
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

    toggleYaw.addEventListener('click', () => {
      CONFIG.HEAD_YAW_SIGN *= -1;
      toggleYaw.textContent = `[ YAW: ${CONFIG.HEAD_YAW_SIGN > 0 ? '+1' : '-1'} ]`;
      updateConfigReadout();
    });

    togglePitch.addEventListener('click', () => {
      CONFIG.HEAD_PITCH_SIGN *= -1;
      togglePitch.textContent = `[ PITCH: ${CONFIG.HEAD_PITCH_SIGN > 0 ? '+1' : '-1'} ]`;
      updateConfigReadout();
    });

    sliderHomeScale.addEventListener('input', (e) => {
      CONFIG.HOME_AVATAR_SCALE = parseFloat(e.target.value);
      valHomeScale.textContent = CONFIG.HOME_AVATAR_SCALE.toFixed(2);
      updateHomeAvatarAnchor();
      updateConfigReadout();
    });

    sliderSpill.addEventListener('input', (e) => {
      CONFIG.SPILL_OPACITY = parseFloat(e.target.value);
      valSpill.textContent = CONFIG.SPILL_OPACITY.toFixed(2);
      document.documentElement.style.setProperty('--spill-opacity', CONFIG.SPILL_OPACITY);
      updateConfigReadout();
    });

    sliderArcX.addEventListener('input', (e) => {
      CONFIG.FLIGHT_ARC_X = parseFloat(e.target.value);
      valArcX.textContent = CONFIG.FLIGHT_ARC_X.toFixed(1) + 'vw';
      updateConfigReadout();
    });

    sliderArcY.addEventListener('input', (e) => {
      CONFIG.FLIGHT_ARC_Y = parseFloat(e.target.value);
      valArcY.textContent = CONFIG.FLIGHT_ARC_Y.toFixed(1) + 'vh';
      updateConfigReadout();
    });

    sliderSwoop.addEventListener('input', (e) => {
      CONFIG.FLIGHT_SWOOP = parseFloat(e.target.value);
      valSwoop.textContent = CONFIG.FLIGHT_SWOOP.toFixed(2);
      updateConfigReadout();
    });

    sliderRoll.addEventListener('input', (e) => {
      CONFIG.FLIGHT_ROLL = parseFloat(e.target.value);
      valRoll.textContent = CONFIG.FLIGHT_ROLL.toFixed(2) + ' rad';
      updateConfigReadout();
    });

    sliderWarp.addEventListener('input', (e) => {
      CONFIG.WARP_STRENGTH = parseFloat(e.target.value);
      valWarp.textContent = CONFIG.WARP_STRENGTH.toFixed(0);
      updateConfigReadout();
    });

    toggleScrubMode.addEventListener('click', () => {
      if (manualF === null) {
        manualF = parseFloat(sliderScrub.value);
        toggleScrubMode.textContent = '[ SCRUB: MANUAL ]';
      } else {
        manualF = null;
        toggleScrubMode.textContent = '[ SCRUB: AUTO ]';
      }
    });

    sliderScrub.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      valScrub.textContent = val.toFixed(2);
      if (manualF !== null) {
        manualF = val;
      }
    });

    toggleHoldTitle.addEventListener('click', () => {
      CONFIG.HOLD_TITLE = !CONFIG.HOLD_TITLE;
      toggleHoldTitle.textContent = `[ HOLD: ${CONFIG.HOLD_TITLE ? 'BOTTOM' : 'ABOVE'} ]`;
      updateHomeAvatarAnchor();
      updateConfigReadout();
    });

    toggleHoldAnchor.addEventListener('click', () => {
      CONFIG.HOLD_ANCHOR = CONFIG.HOLD_ANCHOR === 'underscore' ? 'center' : 'underscore';
      toggleHoldAnchor.textContent = `[ ANCHOR: ${CONFIG.HOLD_ANCHOR} ]`;
      updateHomeAvatarAnchor();
      updateConfigReadout();
    });

    poseSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (floatAnimation) {
        if (val === 'auto') {
          floatAnimation.forcedPose = null;
          floatAnimation.pickNextPose();
        } else {
          floatAnimation.forcedPose = val;
          floatAnimation.transitionTo(val, 1.0);
        }
      }
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
    initAudio();
    initOpeningSequence();
    initAvatar();
    initAvatarInteraction();
    initStars();
    initNavigation();
    initExperienceCards();
    initProofsModal();
    initScrollProgress();
    initKeyboardNav();
    initSectionObserver();
    initDebugHelper();
  });

})();
