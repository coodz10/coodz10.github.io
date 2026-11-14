console.log('ehi, stai guardando il codice. se ti serve qualcosa scrivimi su discord: coodz_10');

(function () {
  'use strict';

  const CONFIG = {
    SKIN_URL: 'assets/skin.png',
    bg: '#05060f',
    text: '#e8eaff',
    muted: '#7c83a8',

    // Avatar Sizing & Vertical Placement (~74vh tall: head ~10vh, feet ~84vh, title ~88vh)
    AVATAR_ZOOM_DESKTOP: 0.92, // Desktop camera zoom (~74vh tall, clearly below navbar)
    AVATAR_ZOOM_MOBILE: 0.52,  // Mobile camera zoom (fully visible, proportioned)
    AVATAR_Y_OFFSET: -25,      // Vertical stage nudge in px (top of head ~10vh, feet ~84vh)
    AVATAR_BASE_HEIGHT_PX_AT_ZOOM: 0, // Visual height of avatar at scale 1 (measured once via 3D bounding box)
    BG_WORD_WIDTH_VW: 88,      // Target width in vw for fitted giant background word
    BG_WORD_OPACITY: 0.22,

    // Avatar Rotations (0 shows front face towards camera; Math.PI turns 180° to back)
    ROT_OFFSET: 0,             // Rotation offset (0 = face toward camera; Math.PI = back)
    ROT_ABOUT: 0,              // chi_sono: faces forward between the two balanced content columns
    ROT_EXP: 0.50,             // esperienze: turns toward cards on the right
    ROT_EXP_DETAIL: 0.65,      // esperienze-detail: turns toward detail panel on right

    // Lighting & Emissive Luminous Skin (Dark navy black texels, vivid blues)
    GLOBAL_LIGHT: 5.5,         // Global ambient light intensity
    CAMERA_LIGHT: 2.8,         // Directional camera light intensity
    AVATAR_EMISSIVE: '#0b1536',
    AVATAR_EMISSIVE_INTENSITY: 1.0, // Emissive intensity in 3D materials
    AURA: 1.0,                 // Aura drop-shadow strength (0 to 1)

    // Hand-Writing Pen & IK
    PEN_ARM: 'left',           // 'left' arm faces viewer right when facing camera
    ARM_TIP: 10.0,             // Skin local Y distance for fingertip (~10 units)
    WRITE_SCALE: 0.42,         // Avatar scale during writing (~30vh tall)

    // Head Tracking Look-At Signs (+1: right->right, above->up; -1: inverted)
    HEAD_YAW_SIGN: 1,          // Mouse right -> face turns to viewer's right
    HEAD_PITCH_SIGN: 1,        // Mouse above -> face looks up

    // Home Avatar Final Placement (46vh tall desktop scale ~0.62, mobile ~34vh scale ~0.46, head >= 10vh from top)
    HOME_AVATAR: {
      x: 0,
      y: -17,
      scale: 0.62,
      scaleMobile: 0.46,
      yaw: 0.1
    },

    // Intro Sequence Timing (all durations in seconds)
    INTRO: {
      GATE_FADE_DUR: 0.4,
      FLY_IN_DUR: 1.0,
      WRITE_START: 1.4,
      WRITE_END: 5.0,
      SETTLE_END: 5.9,
      TOPBAR_TIME: 5.9,
      SUBTITLE_TIME: 6.4,
      BOTTOM_TIME: 6.9,
      TOTAL_TIME: 7.2,
      PEN_MASK_WIDTH: 0.22,
      REPEAT_SPEED: 0.4,
      AUDIO_FADE_DUR: 3.0,
      SUBTITLE_DECRYPT_DUR: 0.8
    },

    // Scroll-Driven Flight Keyframes (units: vw for x, vh for y, scale relative to 100% avatar)
    AVATAR_KEYFRAMES: [
      { id: 'home', x: 0, y: -17, scale: 0.62, scaleMobile: 0.46, yaw: 0.1, roll: 0, xMobile: 0, yMobile: -17 },
      { id: 'chi_sono', x: 0, y: 7, scale: 0.56, scaleMobile: 0.36, yaw: 0.0, roll: 0, xMobile: 0, yMobile: -15 },
      { id: 'esperienze', x: -25, y: 8, scale: 0.50, scaleMobile: 0.36, yaw: 0.45, roll: 0, xMobile: 0, yMobile: -15 },
      { id: 'contatti', x: 0, y: -8, scale: 0.35, scaleMobile: 0.30, yaw: 0.0, roll: 0, xMobile: 0, yMobile: -18 }
    ],
    FLIGHT_ARC_X: 9,           // Extra arc horizontal offset in vw
    FLIGHT_ARC_Y: 4,           // Extra arc vertical lift in vh
    FLIGHT_SWOOP: 0.14,        // Swoop scale overshoot factor
    FLIGHT_ROLL: 0.12,         // Bank roll during flight in rad
    FLIGHT_VELOCITY_REF: 0.85, // Velocity reference for flight pose blend (sections/sec)
    WARP_STRENGTH: 28,         // Warp star streak length multiplier

    // Audio & Playlist (Web Audio routing with dynamics compressor + master gain)
    AUDIO_VOLUME: 0.9,
    AUDIO_GAIN: 1.4,
    PLAYLIST: [
      { name: 'dorado', src: 'music/dorado.mp3' },
      { name: '30C', src: 'music/30C.mp3' },
      { name: 'Grinch3', src: 'music/Grinch3.mp3' }
    ]
  };

  // Translations object for data-i18n attributes
  const TRANSLATIONS = {
    it: {
      gateText: 'ENTRA',
      audioSkip: '[ >> ]',
      musicOn: '[ MUSICA ON ]',
      musicOff: '[ MUSICA OFF ]',
      musicOnShort: '[ ON ]',
      musicOffShort: '[ OFF ]',
      musicAriaMute: 'Disattiva Musica',
      musicAriaUnmute: 'Attiva Musica',
      navHome: '[ home ]',
      navAbout: '[ chi sono ]',
      navExp: '[ esperienze ]',
      navContact: '[ contatti ]',
      onlineStatus: 'coodz_10 · online',
      scrollHint: '[ SCROLL ]',
      aboutTag: '01 · chi sono',
      aboutTitle: 'Chi sono',
      aboutHandleLabel: 'handle',
      aboutRoleLabel: 'ruolo',
      aboutRoleVal: 'sysadmin · security',
      aboutStatusLabel: 'stato',
      aboutStatusVal: 'operativo',
      aboutIntro: "Mi chiamo Samuele, ho 16 anni e sono uno studente di liceo scientifico. Ho una forte passione per l'informatica a 360 gradi, dall'hardware al software, con un approccio molto pratico e orientato a capire cosa succede davvero dietro le quinte di un sistema.",
      aboutPillarTitle1: 'SOFTWARE & SICUREZZA',
      aboutPillarDesc1: "Sul lato software e sicurezza, mi specializzo in analisi forense digitale (ScreenSharing) applicata principalmente all'ecosistema dei server Minecraft competitivi.",
      aboutPillarTitle2: 'INTELLIGENZA ARTIFICIALE',
      aboutPillarDesc2: "Parallelamente, utilizzo strumenti di intelligenza artificiale in modo avanzato, sia attraverso modelli locali sia tramite piattaforme cloud, sfruttandoli per lo sviluppo di software, l'analisi tecnica, il debugging e l'automazione di processi. Ho inoltre esperienza nella personalizzazione e nell'ottimizzazione dei modelli per adattarli alle mie esigenze.",
      aboutPillarTitle3: 'HARDWARE & CUSTOM PC',
      aboutPillarDesc3: "Sul lato hardware, mi occupo di assemblaggio e configurazione di PC personalizzati, seguendo l'intero processo: dalla scelta dei componenti in base alle esigenze e al budget, fino all'assemblaggio, all'ottimizzazione e alla risoluzione di eventuali problemi. Offro inoltre supporto a chi necessita di una configurazione o di una build su misura.",
      expTag: '02 · esperienze',
      expTitle: 'Esperienze',
      expTabAll: '[ TUTTO ]',
      expCatMinecraft: '[ MINECRAFT ]',
      expCatDiscord: '[ DISCORD ]',
      expGroupMinecraft: 'MINECRAFT',
      expGroupDiscord: 'DISCORD · DS',
      expRedisRole: 'Helper',
      expRedisStatus: 'attivo',
      expElysianRole: 'SS Verified',
      expElysianStatus: 'attivo',
      expSyndicateRole: 'Support Team',
      expSyndicateStatus: 'attivo',
      expMeowtoolsRole: 'in lavorazione',
      expMeowtoolsStatus: 'attivo',
      expMetaRole: 'Helper ★★★★☆',
      expMetaStatus: 'dimesso',
      expPixyRole: 'Owner · SS Manager ★★★★☆',
      expPixyStatus: 'dimesso',
      contactTag: '03 · contatti',
      contactTitle: 'Parliamo',
      contactSub: 'Per collaborazioni, richieste di servizi o investigazioni di sicurezza.',
      footerEnd: 'coodz_10 · 2026',
      backToExperiences: '[ ← torna alle esperienze ]',
      openProofs: '[ APRI PROVE ]',
      proofsTitle: 'Link e prove',
      proofsClose: '[ chiudi ]',
      btnAbout: '[ CHI SONO ]',
      btnExp: '[ LE MIE ESPERIENZE ]',
      bgWordAbout: 'CHI SONO',
      bgWordExp: 'ESPERIENZE',
      bgWordContact: 'CONTATTI'
    },
    en: {
      gateText: 'ENTER',
      audioSkip: '[ >> ]',
      musicOn: '[ MUSIC ON ]',
      musicOff: '[ MUSIC OFF ]',
      musicOnShort: '[ ON ]',
      musicOffShort: '[ OFF ]',
      musicAriaMute: 'Mute Music',
      musicAriaUnmute: 'Unmute Music',
      navHome: '[ home ]',
      navAbout: '[ about me ]',
      navExp: '[ experience ]',
      navContact: '[ contact ]',
      onlineStatus: 'coodz_10 · online',
      scrollHint: '[ SCROLL ]',
      aboutTag: '01 · about',
      aboutTitle: 'About me',
      aboutHandleLabel: 'handle',
      aboutRoleLabel: 'role',
      aboutRoleVal: 'sysadmin · security',
      aboutStatusLabel: 'status',
      aboutStatusVal: 'operational',
      aboutIntro: "My name is Samuele, I am 16 years old, and I am a scientific high school student. I have a strong passion for 360° IT, from hardware to software, with a highly practical approach focused on understanding what really happens behind the scenes of a system.",
      aboutPillarTitle1: 'SOFTWARE & SECURITY',
      aboutPillarDesc1: "On the software and security side, I specialize in digital forensics (ScreenSharing) applied primarily to the competitive Minecraft server ecosystem.",
      aboutPillarTitle2: 'ARTIFICIAL INTELLIGENCE',
      aboutPillarDesc2: "In parallel, I utilize artificial intelligence tools in an advanced manner, both through local models and cloud platforms, leveraging them for software development, technical analysis, debugging, and process automation. I also have experience customizing and fine-tuning models to fit my needs.",
      aboutPillarTitle3: 'HARDWARE & CUSTOM PC',
      aboutPillarDesc3: "On the hardware side, I build and configure custom PCs, overseeing the entire process: from component selection based on needs and budget, to assembly, optimization, and troubleshooting. I also provide guidance and support to anyone in need of a tailored configuration or build.",
      expTag: '02 · experience',
      expTitle: 'Experience',
      expTabAll: '[ ALL ]',
      expCatMinecraft: '[ MINECRAFT ]',
      expCatDiscord: '[ DISCORD ]',
      expGroupMinecraft: 'MINECRAFT',
      expGroupDiscord: 'DISCORD · DS',
      expRedisRole: 'Helper',
      expRedisStatus: 'active',
      expElysianRole: 'SS Verified',
      expElysianStatus: 'active',
      expSyndicateRole: 'Support Team',
      expSyndicateStatus: 'active',
      expMeowtoolsRole: 'in progress',
      expMeowtoolsStatus: 'active',
      expMetaRole: 'Helper ★★★★☆',
      expMetaStatus: 'resigned',
      expPixyRole: 'Owner · SS Manager ★★★★☆',
      expPixyStatus: 'resigned',
      contactTag: '03 · contact',
      contactTitle: "Let's talk",
      contactSub: 'For collaborations, service requests or security investigations.',
      footerEnd: 'coodz_10 · 2026',
      backToExperiences: '[ ← back to experience ]',
      openProofs: '[ OPEN PROOFS ]',
      proofsTitle: 'Links & proofs',
      proofsClose: '[ close ]',
      btnAbout: '[ ABOUT ME ]',
      btnExp: '[ MY EXPERIENCE ]',
      bgWordAbout: 'ABOUT',
      bgWordExp: 'EXPERIENCE',
      bgWordContact: 'CONTACT'
    }
  };
  window.CONFIG = CONFIG;

  const EXPERIENCE_DETAILS = {
    redismc: {
      index: '01',
      title: 'RedisMC',
      category: 'minecraft',
      role: { it: 'Helper', en: 'Helper' },
      stars: '',
      status: { it: 'attivo', en: 'active' },
      period: { it: 'ottobre 2026 -', en: 'october 2026 -' },
      inProgress: true,
      noticeTag: { it: 'in lavorazione', en: 'in progress' },
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
      status: { it: 'dimesso', en: 'resigned' },
      period: { it: 'agosto - settembre 2026', en: 'august - september 2026' },
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
      role: { it: 'Owner · SS Manager', en: 'Owner · SS Manager' },
      stars: '★★★★☆',
      status: { it: 'dimesso', en: 'resigned' },
      period: { it: 'agosto 2025 - luglio 2026', en: 'august 2025 - july 2026' },
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
      status: { it: 'attivo', en: 'active' },
      period: { it: 'ottobre 2026 -', en: 'october 2026 -' },
      inProgress: true,
      noticeTag: { it: 'in lavorazione', en: 'in progress' },
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
      status: { it: 'attivo', en: 'active' },
      period: { it: '2026 -', en: '2026 -' },
      inProgress: true,
      noticeTag: { it: 'in lavorazione', en: 'in progress' },
      noticeText: {
        it: 'I dettagli e la recensione di questa esperienza sono attualmente in fase di stesura.',
        en: 'Details and review for this experience are currently work in progress.'
      },
      proofs: []
    },
    meowtools: {
      index: '03',
      title: 'MeowTools & Community',
      category: 'ds',
      role: { it: 'in lavorazione', en: 'in progress' },
      stars: '',
      status: { it: 'attivo', en: 'active' },
      period: { it: 'in corso', en: 'ongoing' },
      inProgress: true,
      noticeTag: { it: 'in lavorazione', en: 'in progress' },
      noticeText: {
        it: 'I dettagli e la recensione di questa esperienza sono attualmente in fase di stesura.',
        en: 'Details and review for this experience are currently work in progress.'
      },
      proofs: [
        { url: 'https://imgur.com/a/Amgjwsz' }
      ]
    }
  };

  function safeStorageGet(type, key) {
    try {
      const store = type === 'session' ? window.sessionStorage : window.localStorage;
      return store ? store.getItem(key) : null;
    } catch (e) {
      return null;
    }
  }

  function safeStorageSet(type, key, value) {
    try {
      const store = type === 'session' ? window.sessionStorage : window.localStorage;
      if (store) store.setItem(key, value);
    } catch (e) { }
  }

  let currentLang = safeStorageGet('local', 'coodz_lang') || 'it';
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
  let lastComputedStageX = 0;
  let lastComputedStageY = 0;
  let prevStageX = 0;
  let prevStageY = 0;
  let prevStageVx = 0;
  let prevStageVy = 0;
  let tryStartAudioGlobal = null;

  // Look mode: 'intro' forces target and completely ignores mouse; 'normal' follows mouse in home
  let headLookMode = 'intro';

  // Float driver state (fades from 0 to 1 over 1.2s after intro)
  let floatDriverAmplitude = 0;
  let floatFadeStartTime = null;
  const FLOAT_FADE_DURATION = 1.2;
  let currentHomeFloatAmp = 0;

  // Audio diagnostics, Web Audio pipeline & playback state
  let audioLastError = null;
  let audioNeedsRetry = false;
  let audioRetryAttached = false;
  let webAudioCtx = null;
  let webAudioSource = null;
  let webAudioCompressor = null;
  let webAudioMasterGain = null;
  let webAudioAnalyser = null;
  let webAudioReady = false;
  let currentPlayPromise = null;
  let playlistIndex = 0;
  let skipDebounceTimer = null;
  let updateMuteBtnState = () => { };

  function attachMusicStartOnInteraction() {
    const events = ['click', 'pointerdown', 'keydown', 'touchstart'];
    function onFirstUserGesture() {
      events.forEach((evt) => {
        window.removeEventListener(evt, onFirstUserGesture, true);
      });
      const audio = document.getElementById('bg-audio');
      const isMuted = safeStorageGet('local', 'coodz_muted') === 'true';
      if (!isMuted && audio) {
        initWebAudioGraph(audio);
        if (webAudioCtx && webAudioCtx.state === 'suspended') {
          webAudioCtx.resume().catch(() => { });
        }
        audio.muted = false;
        if (webAudioMasterGain && webAudioCtx) {
          webAudioMasterGain.gain.setValueAtTime(0, webAudioCtx.currentTime);
        } else {
          audio.volume = 0;
        }
        safePlayAudio(audio).then(() => {
          fadeAudioVolume(audio, CONFIG.AUDIO_VOLUME, 2000);
          updateMuteBtnState();
        }).catch(() => { });
      }
    }
    events.forEach((evt) => {
      window.addEventListener(evt, onFirstUserGesture, { capture: true, once: true });
    });
  }

  function attachAudioRetryListener() {
    if (audioRetryAttached) return;
    audioRetryAttached = true;
    const retryEvents = ['click', 'pointerdown', 'keydown', 'touchstart'];
    function onRetryInteraction() {
      retryEvents.forEach((evt) => window.removeEventListener(evt, onRetryInteraction, true));
      audioRetryAttached = false;
      const audio = document.getElementById('bg-audio');
      if (audio && safeStorageGet('local', 'coodz_muted') !== 'true') {
        initWebAudioGraph(audio);
        if (webAudioCtx && webAudioCtx.state === 'suspended') {
          webAudioCtx.resume().catch(() => { });
        }
        audio.muted = false;
        safePlayAudio(audio).then(() => {
          fadeAudioVolume(audio, CONFIG.AUDIO_VOLUME, 1000);
          updateMuteBtnState();
        }).catch(() => { });
      }
    }
    retryEvents.forEach((evt) => window.addEventListener(evt, onRetryInteraction, { capture: true, once: true }));
  }

  // Quality Tier detection ('high', 'med', 'low')
  let qualityTier = 'high';
  const urlQuality = new URLSearchParams(window.location.search).get('quality');
  if (urlQuality === 'low' || urlQuality === 'med' || urlQuality === 'high') {
    qualityTier = urlQuality;
  } else {
    const hw = navigator.hardwareConcurrency || 4;
    const dm = navigator.deviceMemory || 4;
    if (hw <= 2 || dm < 3 || (window.innerWidth <= 480 && (window.devicePixelRatio || 1) < 2)) {
      qualityTier = 'low';
    } else if (hw <= 4 || dm < 4 || window.innerWidth <= 768) {
      qualityTier = 'med';
    }
  }

  if (typeof window !== 'undefined' && window.AvatarRig && typeof window.AvatarRig.setQualityTier === 'function') {
    window.AvatarRig.setQualityTier(qualityTier);
  }

  const POSES = (typeof window !== 'undefined' && window.AvatarRig && window.AvatarRig.POSES)
    ? window.AvatarRig.POSES
    : {};

  function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  // Screen look-at target state & cached DOM elements
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

  // Cached DOM references for zero DOM searches in requestAnimationFrame loops
  let domStage = null;
  let domAvatarFloat = null;
  let domHeroTitle = null;
  let domHeroTitleChSpans = null;
  let domHeroSubElements = null;
  let domBgWord = null;
  let domActionsEl = null;
  const bgWordMetrics = {
    1: { text: 'CHI SONO', fontSize: '100px' },
    2: { text: 'ESPERIENZE', fontSize: '100px' },
    3: { text: 'CONTATTI', fontSize: '100px' }
  };
  let activeBgWordIndex = -1;

  function getDomStage() {
    if (!domStage) domStage = document.getElementById('avatar-stage');
    return domStage;
  }
  function getDomAvatarFloat() {
    if (!domAvatarFloat) domAvatarFloat = document.getElementById('avatar-float');
    return domAvatarFloat;
  }
  function getDomHeroTitle() {
    if (!domHeroTitle) {
      domHeroTitle = document.getElementById('hero-title');
      if (domHeroTitle) {
        domHeroTitleChSpans = domHeroTitle.querySelectorAll('.ch');
      }
    }
    return domHeroTitle;
  }
  function getDomHeroTitleChSpans() {
    if (!domHeroTitleChSpans) {
      getDomHeroTitle();
    }
    return domHeroTitleChSpans;
  }
  function getDomHeroSubElements() {
    if (!domHeroSubElements) {
      domHeroSubElements = document.querySelectorAll('.hero-subtitle-wrap, .home-bottom-actions, .hero-light-spill');
    }
    return domHeroSubElements;
  }
  function getDomBgWord() {
    if (!domBgWord) {
      domBgWord = document.getElementById('bg-word');
    }
    return domBgWord;
  }
  function getDomActionsEl() {
    if (!domActionsEl) {
      domActionsEl = document.querySelector('.hero-actions') || document.querySelector('[data-i18n="scrollHint"]');
    }
    return domActionsEl;
  }

  // Pre-allocated vectors & points for zero-allocation avatar projection loops
  let _fingertipLocal = null;
  let _fingertipWorld = null;
  let _projPoint = null;
  const _canvasPoint = { x: 0, y: 0 };

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

    if (headLookMode === 'intro') {
      // While intro runs, IGNORE mouse completely.
      // Look targets are driven strictly by the intro timeline via setDesiredLookTarget().
    } else if (flightW > 0.3) {
      // During flight look forward / at camera (target = viewport center)
      desiredLookTargetX = cachedWindowWidth * 0.5;
      desiredLookTargetY = cachedWindowHeight * 0.5;
    } else if (activeSectionId === 'home') {
      if (mouseInWindow && !isTouchDevice) {
        desiredLookTargetX = mouseX;
        desiredLookTargetY = mouseY;
      } else {
        // Slowly scan between title and buttons
        const titleEl = getDomHeroTitle();
        const actionsEl = getDomActionsEl();
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

  function updateHeadLookTarget() {
    if (!skinViewer || !skinViewer.playerObject) return;
    const stage = getDomStage();
    if (!stage) return;

    const stageRect = stage.getBoundingClientRect();
    const headScreenX = stageRect.left + stageRect.width * 0.5;
    const headScreenY = stageRect.top + stageRect.height * 0.15;

    const dx = currentLookTargetX - headScreenX;
    const dy = currentLookTargetY - headScreenY;

    const halfW = Math.max(1, window.innerWidth * 0.5);
    const halfH = Math.max(1, window.innerHeight * 0.5);

    const rawYaw = (dx / halfW) * CONFIG.HEAD_YAW_SIGN;
    const rawPitch = -(dy / halfH) * CONFIG.HEAD_PITCH_SIGN; // Positive pitch = look up

    const bodyYaw = skinViewer.playerObject.rotation.y - CONFIG.ROT_OFFSET;
    const targetHeadYaw = rawYaw - bodyYaw;

    let clampedYaw = 0;
    let clampedPitch = 0;

    if (flightW > 0.3) {
      clampedYaw = Math.max(-0.25, Math.min(0.25, targetHeadYaw));
      clampedPitch = Math.max(-0.15, Math.min(0.15, rawPitch));
    } else if (headLookMode === 'intro') {
      clampedYaw = Math.max(-0.65, Math.min(0.65, targetHeadYaw));
      clampedPitch = Math.max(-0.55, Math.min(0.55, rawPitch));
    } else if (fDisplay < 0.2) {
      clampedYaw = Math.max(-0.45, Math.min(0.45, targetHeadYaw));
      clampedPitch = Math.max(-0.35, Math.min(0.35, rawPitch));
    } else {
      clampedYaw = Math.max(-0.8, Math.min(0.8, targetHeadYaw));
      clampedPitch = Math.max(-0.4, Math.min(0.4, rawPitch));
    }

    if (window.AvatarRig) {
      window.AvatarRig.setLook(clampedYaw, clampedPitch);
    }
  }

  function scheduleNextReadingTarget() {
    clearTimeout(readingTargetTimer);
    if (activeSectionId === 'home') return;

    const delay = Math.random() * 1500 + 2500; // 2.5s to 4s
    readingTargetTimer = setTimeout(() => {
      if (activeSectionId === 'home') return;

      if (activeSectionId === 'chi_sono') {
        const steps = ['.section-head', '.about-meta', '.about-item'];
        currentReadingIndex = (currentReadingIndex + 1) % steps.length;
        const sel = steps[currentReadingIndex];
        const el = document.querySelector(`#chi_sono ${sel}`);
        if (el) {
          const r = el.getBoundingClientRect();
          const targetX = r.left + r.width * 0.5;
          const targetY = r.top + r.height * 0.5;
          setDesiredLookTarget(targetX, targetY, 0.8);
        }
      } else if (activeSectionId === 'esperienze' || activeSectionId === 'esperienze-detail') {
        if (activeDetailId) {
          const steps = ['.detail-title', '.detail-paragraphs', '.detail-pros-cons-grid', '.detail-list'];
          currentReadingIndex = (currentReadingIndex + 1) % steps.length;
          const el = document.querySelector(`#experience-detail-view ${steps[currentReadingIndex]}`);
          if (el) {
            const r = el.getBoundingClientRect();
            setDesiredLookTarget(r.left + r.width * 0.5, r.top + r.height * 0.5, 0.8);
          }
        } else if (!hoveredCard) {
          const cards = document.querySelectorAll('#esperienze .row-link, #esperienze .card-minimal');
          const count = cards.length + 1;
          currentReadingIndex = (currentReadingIndex + 1) % count;
          if (currentReadingIndex === 0) {
            const el = document.querySelector('#esperienze .section-head, #esperienze .section-title');
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
            const el = document.querySelector('#contatti .section-head__title, #contatti .contact-cta-title');
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

  const FloatAnimation = (typeof window !== 'undefined' && window.AvatarRig && window.AvatarRig.RigAnimation)
    ? window.AvatarRig.RigAnimation
    : class { };

  function decryptTitle(el, targetText, duration) {
    if (!el) return;
    const chars = '01!<>-_/[]{}*#+=';
    const len = targetText.length;
    const startTime = performance.now();
    const spans = el.querySelectorAll('.ch');

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / Math.max(1, duration));
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
      }
    }

    requestAnimationFrame(update);
  }

  function initTitleHoverScramble() {
    const titleEl = document.getElementById('hero-title');
    if (!titleEl) return;

    const chars = '01!<>-_/[]{}*#+=';
    const spans = titleEl.querySelectorAll('.ch');

    spans.forEach((span) => {
      const originalText = span.textContent;
      let scrambleTimer = null;
      let frame = 0;

      span.addEventListener('mouseenter', () => {
        if (isIntroActive) return;
        clearInterval(scrambleTimer);
        frame = 0;

        scrambleTimer = setInterval(() => {
          frame++;
          if (frame < 5) {
            span.textContent = chars[Math.floor(Math.random() * chars.length)];
          } else {
            clearInterval(scrambleTimer);
            span.textContent = originalText;
          }
        }, 40);
      });
    });
  }

  let isIntroActive = false;
  let introCancelRequested = false;
  let introRafId = null;

  // Normalized stroke waypoints per letter (ink box 0..1)
  const CHAR_STROKES = {
    c: [
      [[0.88, 0.25], [0.65, 0.08], [0.35, 0.12], [0.14, 0.35], [0.14, 0.65], [0.35, 0.88], [0.65, 0.92], [0.88, 0.75]]
    ],
    o: [
      [[0.50, 0.08], [0.20, 0.20], [0.10, 0.50], [0.20, 0.80], [0.50, 0.92], [0.80, 0.80], [0.90, 0.50], [0.80, 0.20], [0.50, 0.08]]
    ],
    d: [
      [[0.62, 0.50], [0.30, 0.46], [0.12, 0.68], [0.28, 0.92], [0.60, 0.93], [0.80, 0.72]],
      [[0.80, 0.04], [0.80, 0.96]]
    ],
    z: [
      [[0.10, 0.12], [0.90, 0.12], [0.10, 0.88], [0.90, 0.88]]
    ],
    '_': [
      [[0.00, 0.50], [1.00, 0.50]]
    ],
    '1': [
      [[0.10, 0.32], [0.62, 0.04], [0.62, 0.96]]
    ],
    '0': [
      [[0.50, 0.08], [0.20, 0.20], [0.10, 0.50], [0.20, 0.80], [0.50, 0.92], [0.80, 0.80], [0.90, 0.50], [0.80, 0.20], [0.50, 0.08]]
    ]
  };

  let debugOverlayGlyphs = false;
  let debugShowWaypointsMask = false;
  let debugShowIntroPoints = false;

  function initGateAndIntro() {
    const gateScreen = document.getElementById('gate-screen');
    const gateBtn = document.getElementById('gate-btn');
    const titleEl = document.getElementById('hero-title');
    const spans = titleEl ? Array.from(titleEl.querySelectorAll('.ch')) : [];
    const introCanvas = document.getElementById('intro-canvas');
    const navBar = document.querySelector('.nav-bar');
    const subtitleWrap = document.querySelector('.hero-subtitle-wrap');
    const bottomActions = document.querySelector('.home-bottom-actions');
    const avatarStage = document.getElementById('avatar-stage');
    const audio = document.getElementById('bg-audio');

    // Initial state: hide top bar, title spans, subtitle, bottom actions
    if (navBar) {
      navBar.style.opacity = '0';
      navBar.style.pointerEvents = 'none';
    }
    if (subtitleWrap) {
      subtitleWrap.style.opacity = '0';
      subtitleWrap.style.pointerEvents = 'none';
    }
    if (bottomActions) {
      bottomActions.style.opacity = '0';
      bottomActions.style.pointerEvents = 'none';
    }
    spans.forEach((sp) => {
      sp.style.opacity = '0';
    });

    // Lock scroll during intro
    document.documentElement.classList.add('intro-locked');
    document.body.classList.add('intro-locked');

    // Safety fallback: ensure .intro-pending is never stuck indefinitely
    setTimeout(() => {
      document.documentElement.classList.remove('intro-pending');
    }, 15000);

    function lockScrollHandler(e) {
      if (isIntroActive) {
        e.preventDefault();
      }
    }
    window.addEventListener('wheel', lockScrollHandler, { passive: false });
    window.addEventListener('touchmove', lockScrollHandler, { passive: false });

    const urlParams = new URLSearchParams(window.location.search);
    const slowParam = parseFloat(urlParams.get('slow'));
    const isSlowActive = !isNaN(slowParam) && slowParam >= 1 && slowParam <= 10;
    const slowMultiplier = isSlowActive ? slowParam : 1;
    const isIntroSkip = urlParams.get('intro') === 'skip';

    if (isSlowActive) {
      let slowBadge = document.getElementById('slow-debug-badge');
      if (!slowBadge) {
        slowBadge = document.createElement('div');
        slowBadge.id = 'slow-debug-badge';
        slowBadge.className = 'slow-debug-badge mono';
        slowBadge.textContent = `SLOW x${slowMultiplier}`;
        document.body.appendChild(slowBadge);
      }
    }

    const isDeepLink = window.location.hash && window.location.hash !== '#home';
    const isRepeatSession = !!safeStorageGet('session', 'coodz_intro_seen');

    function finishIntroInstant(options = {}) {
      const startMusic = options.startMusic !== false;
      isIntroActive = false;
      introCancelRequested = true;
      if (introRafId) cancelAnimationFrame(introRafId);

      document.documentElement.classList.remove('intro-pending');
      headLookMode = 'normal';
      setDesiredLookTarget(mouseX, mouseY, 0.8);

      if (window.AvatarDirector) {
        window.AvatarDirector.onIntroStep('finish');
      }

      if (introCanvas) {
        introCanvas.style.display = 'none';
      }
      if (titleEl) {
        titleEl.style.transform = '';
      }
      if (gateScreen) {
        gateScreen.classList.add('faded-out');
        gateScreen.style.display = 'none';
      }
      if (avatarStage) {
        avatarStage.classList.add('stage-ready');
        avatarStage.style.opacity = '1';
        const kfHome = resolveKeyframe(CONFIG.AVATAR_KEYFRAMES[0]);
        avatarStage.style.transform = `translate3d(${kfHome.x.toFixed(2)}px, ${kfHome.y.toFixed(2)}px, 0) scale(${kfHome.scale.toFixed(3)}) rotate(0rad)`;
      }

      if (floatAnimation) {
        floatAnimation.transitionTo('float', 1.2);
      }
      if (floatFadeStartTime === null) {
        floatFadeStartTime = performance.now() / 1000;
      }

      spans.forEach((sp) => {
        sp.classList.add('intro-revealed');
        sp.style.opacity = '1';
      });
      if (navBar) {
        navBar.classList.add('intro-revealed');
        navBar.style.opacity = '1';
        navBar.style.pointerEvents = 'auto';
        navBar.style.transition = 'opacity 0.4s ease';
      }
      if (subtitleWrap) {
        subtitleWrap.classList.add('intro-revealed');
        subtitleWrap.style.opacity = '1';
        subtitleWrap.style.pointerEvents = 'auto';
        subtitleWrap.style.transition = 'opacity 0.4s ease';
      }
      if (bottomActions) {
        bottomActions.classList.add('intro-revealed');
        bottomActions.style.opacity = '1';
        bottomActions.style.pointerEvents = 'auto';
        bottomActions.style.transition = 'opacity 0.4s ease';
      }
      const scrollHint = document.querySelector('.scroll-hint-wrap');
      if (scrollHint) {
        scrollHint.classList.add('intro-revealed');
        scrollHint.style.opacity = '1';
        scrollHint.style.pointerEvents = 'auto';
      }

      document.documentElement.classList.remove('intro-locked');
      document.body.classList.remove('intro-locked');
      window.removeEventListener('wheel', lockScrollHandler);
      window.removeEventListener('touchmove', lockScrollHandler);

      safeStorageSet('session', 'coodz_intro_seen', 'true');

      if (startMusic && audio && !audio.muted && safeStorageGet('local', 'coodz_muted') !== 'true') {
        initWebAudioGraph(audio);
        safePlayAudio(audio).then(() => {
          fadeAudioVolume(audio, CONFIG.AUDIO_VOLUME, 1200);
          updateMuteBtnState();
        });
      }

      if (isDeepLink) {
        setTimeout(handleRoute, 120);
      } else {
        updateNavIndicator('home');
      }
    }

    window.finishIntroInstant = finishIntroInstant;

    if (isIntroSkip || isDeepLink || prefersReducedMotion) {
      headLookMode = 'normal';
      floatDriverAmplitude = prefersReducedMotion ? 0 : 1.0;
      floatFadeStartTime = null;
      finishIntroInstant({ startMusic: false });
      if (isIntroSkip || isDeepLink) {
        attachMusicStartOnInteraction();
      }
      return;
    }

    // Gate button / click to start
    let gateTriggered = false;
    function onGateTrigger() {
      if (gateTriggered) return;
      gateTriggered = true;

      // Synchronously unlock audio at gate interaction
      if (audio) {
        initWebAudioGraph(audio);
        if (webAudioCtx && webAudioCtx.state === 'suspended') {
          webAudioCtx.resume().catch(() => { });
        }
        if (!audio.src) {
          audio.src = CONFIG.PLAYLIST[playlistIndex || 0].src;
        }
        const isMuted = safeStorageGet('local', 'coodz_muted') === 'true';
        if (!isMuted) {
          audio.muted = false;
          if (webAudioMasterGain && webAudioCtx) {
            webAudioMasterGain.gain.setValueAtTime(0, webAudioCtx.currentTime);
          } else {
            audio.volume = 0;
          }
          safePlayAudio(audio).then(() => {
            fadeAudioVolume(audio, CONFIG.AUDIO_VOLUME, 1500);
            updateMuteBtnState();
          }).catch((err) => {
            audioLastError = err ? (err.message || String(err)) : 'gate play rejected';
            if (window.AvatarDebug) console.warn('[Audio] play rejected at gate:', err);
            audioNeedsRetry = true;
            attachAudioRetryListener();
          });
        } else {
          audio.muted = true;
        }
      }

      // Start Intro Animation
      headLookMode = 'intro';
      startIntroSequence();
    }

    if (gateBtn) {
      gateBtn.addEventListener('click', onGateTrigger);
    }
    if (gateScreen) {
      gateScreen.addEventListener('click', onGateTrigger);
    }
    window.addEventListener('keydown', (e) => {
      if (!gateTriggered && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) {
        onGateTrigger();
      }
    });

    function runFallbackWipe() {
      spans.forEach((sp, idx) => {
        setTimeout(() => {
          sp.classList.add('intro-revealed');
          sp.style.transition = 'opacity 0.3s ease';
          sp.style.opacity = '1';
        }, idx * (2500 / Math.max(1, spans.length)));
      });
      setTimeout(() => {
        finishIntroInstant();
      }, 2800);
    }

    function startIntroSequence() {
      isIntroActive = true;
      if (gateScreen) {
        gateScreen.classList.add('faded-out');
        setTimeout(() => {
          if (gateScreen) gateScreen.style.display = 'none';
        }, 550);
      }

      function onSkipEvent() {
        if (!isIntroActive) return;
        finishIntroInstant();
        removeSkipListeners();
      }

      function onKeyDownSkip(e) {
        if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
          onSkipEvent();
        }
      }

      function onResizeSkip() {
        if (isIntroActive) {
          finishIntroInstant();
          removeSkipListeners();
        }
      }

      function removeSkipListeners() {
        window.removeEventListener('click', onSkipEvent);
        window.removeEventListener('keydown', onKeyDownSkip);
        window.removeEventListener('resize', onResizeSkip);
      }

      setTimeout(() => {
        if (isIntroActive) {
          window.addEventListener('click', onSkipEvent);
          window.addEventListener('keydown', onKeyDownSkip);
          window.addEventListener('resize', onResizeSkip, { passive: true });
        }
      }, 100);

      const fontsReady = waitForSiteFonts();

      fontsReady.then(() => {
        if (!isIntroActive || introCancelRequested) return;
        fitHeroTitle();

        try {
          if (!introCanvas || spans.length < 8) {
            runFallbackWipe();
            return;
          }

          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const dpr = Math.min(2, window.devicePixelRatio || 1);

          introCanvas.width = vw * dpr;
          introCanvas.height = vh * dpr;
          introCanvas.style.width = vw + 'px';
          introCanvas.style.height = vh + 'px';
          introCanvas.style.display = 'block';
          introCanvas.style.opacity = '1';

          const introCtx = introCanvas.getContext('2d');
          if (!introCtx) {
            runFallbackWipe();
            return;
          }
          introCtx.scale(dpr, dpr);

          const offGlyphs = document.createElement('canvas');
          offGlyphs.width = vw * dpr;
          offGlyphs.height = vh * dpr;
          const offGlyphsCtx = offGlyphs.getContext('2d');
          offGlyphsCtx.scale(dpr, dpr);

          const offMask = document.createElement('canvas');
          offMask.width = vw * dpr;
          offMask.height = vh * dpr;
          const offMaskCtx = offMask.getContext('2d');
          offMaskCtx.scale(dpr, dpr);

          // Get computed typography
          const titleStyle = window.getComputedStyle(titleEl);
          const fontFamily = titleStyle.fontFamily || "'Bricolage Grotesque', system-ui, sans-serif";
          const fontWeight = titleStyle.fontWeight || '800';
          const fontStyle = titleStyle.fontStyle || 'normal';
          const computedFontSize = parseFloat(titleStyle.fontSize) || 96;

          offGlyphsCtx.font = `${fontStyle} ${fontWeight} ${computedFontSize}px ${fontFamily}`;
          offGlyphsCtx.textAlign = 'left';
          offGlyphsCtx.textBaseline = 'alphabetic';

          // 1. Initial title placement: center vertically around 50vh
          const finalTitleRect = titleEl.getBoundingClientRect();
          const finalCenterY = finalTitleRect.top + finalTitleRect.height * 0.5;
          const introCenterY = vh * 0.5;
          let introDeltaY = introCenterY - finalCenterY;
          let introDeltaX = 0;

          titleEl.style.transform = `translate3d(${introDeltaX.toFixed(2)}px, ${introDeltaY.toFixed(2)}px, 0)`;

          const charTexts = ['c', 'o', 'o', 'd', 'z', '_', '1', '0'];
          const rawMetrics = spans.map((span, idx) => {
            const ch = charTexts[idx] || span.textContent.trim();
            const rect = span.getBoundingClientRect();
            const metrics = offGlyphsCtx.measureText(ch);

            const fontAscent = (metrics.fontBoundingBoxAscent !== undefined) ? metrics.fontBoundingBoxAscent : (metrics.actualBoundingBoxAscent || computedFontSize * 0.78);
            const fontDescent = (metrics.fontBoundingBoxDescent !== undefined) ? metrics.fontBoundingBoxDescent : (metrics.actualBoundingBoxDescent || computedFontSize * 0.22);

            const baselineY = rect.top + (rect.height - (fontAscent + fontDescent)) * 0.5 + fontAscent;
            const charX = rect.left;

            const actLeft = metrics.actualBoundingBoxLeft !== undefined ? metrics.actualBoundingBoxLeft : 0;
            const actRight = metrics.actualBoundingBoxRight !== undefined ? metrics.actualBoundingBoxRight : rect.width;
            const actAscent = metrics.actualBoundingBoxAscent !== undefined ? metrics.actualBoundingBoxAscent : fontAscent;
            const actDescent = metrics.actualBoundingBoxDescent !== undefined ? metrics.actualBoundingBoxDescent : fontDescent;

            const inkLeft = charX - actLeft;
            const inkRight = charX + actRight;
            const inkTop = baselineY - actAscent;
            const inkBottom = baselineY + actDescent;

            return {
              ch, span, rect, baselineY, charX, inkLeft, inkRight, inkTop, inkBottom
            };
          });

          // Horizontal & Vertical centering by INK bounds: (inkLeft + inkRight)/2 == vw/2 within 1px
          const totalInkLeft = Math.min(...rawMetrics.map((m) => m.inkLeft));
          const totalInkRight = Math.max(...rawMetrics.map((m) => m.inkRight));
          const currentInkCenterX = (totalInkLeft + totalInkRight) * 0.5;
          const viewportCenterX = vw * 0.5;
          const horizontalCorr = viewportCenterX - currentInkCenterX;

          const totalInkTop = Math.min(...rawMetrics.map((m) => m.inkTop));
          const totalInkBottom = Math.max(...rawMetrics.map((m) => m.inkBottom));
          const currentInkCenterY = (totalInkTop + totalInkBottom) * 0.5;
          const viewportCenterY = vh * 0.5;
          const verticalCorr = viewportCenterY - currentInkCenterY;

          introDeltaX += horizontalCorr;
          introDeltaY += verticalCorr;
          titleEl.style.transform = `translate3d(${introDeltaX.toFixed(2)}px, ${introDeltaY.toFixed(2)}px, 0)`;

          // Shift metrics by corrections to align offscreen canvas with DOM
          const letterData = rawMetrics.map((m) => {
            const charX = m.charX + horizontalCorr;
            const baselineY = m.baselineY + verticalCorr;
            const inkLeft = m.inkLeft + horizontalCorr;
            const inkRight = m.inkRight + horizontalCorr;
            const inkTop = m.inkTop + verticalCorr;
            const inkBottom = m.inkBottom + verticalCorr;
            const inkWidth = Math.max(1, inkRight - inkLeft);
            const inkHeight = Math.max(1, inkBottom - inkTop);

            // Build strokes with precalculated segment distances
            const rawPolys = CHAR_STROKES[m.ch] || CHAR_STROKES['o'];
            const strokes = rawPolys.map((poly) => {
              const points = poly.map((pt) => ({
                x: inkLeft + pt[0] * inkWidth,
                y: inkTop + pt[1] * inkHeight
              }));
              const dists = [0];
              let totalLen = 0;
              for (let k = 0; k < points.length - 1; k++) {
                const d = Math.hypot(points[k + 1].x - points[k].x, points[k + 1].y - points[k].y);
                totalLen += d;
                dists.push(totalLen);
              }
              return { points, dists, totalLen };
            });

            return {
              char: m.ch,
              span: m.span,
              rect: {
                left: m.rect.left + horizontalCorr,
                right: m.rect.right + horizontalCorr,
                top: m.rect.top + verticalCorr,
                bottom: m.rect.bottom + verticalCorr,
                width: m.rect.width,
                height: m.rect.height
              },
              baselineY,
              charX,
              inkLeft,
              inkRight,
              inkTop,
              inkBottom,
              inkWidth,
              inkHeight,
              strokes,
              completed: false
            };
          });

          // Draw real glyphs on offscreen canvas with horizontal gradient
          const finalInkLeft = Math.min(...letterData.map((l) => (l.inkLeft !== undefined ? l.inkLeft : 0)));
          const finalInkRight = Math.max(...letterData.map((l) => (l.inkRight !== undefined ? l.inkRight : (l.inkLeft || 0) + (l.inkWidth || 10))));
          const safeRight = (isFinite(finalInkRight) && finalInkRight > finalInkLeft) ? finalInkRight : (finalInkLeft + 100);
          const grad = offGlyphsCtx.createLinearGradient(isFinite(finalInkLeft) ? finalInkLeft : 0, 0, safeRight, 0);
          grad.addColorStop(0, '#1d4ed8');
          grad.addColorStop(1, '#7aa4ff');
          offGlyphsCtx.fillStyle = grad;
          letterData.forEach((ld) => {
            offGlyphsCtx.fillText(ld.char, ld.charX, ld.baselineY);
          });

          // Helper to get point and path along a stroke at progress u (0..1)
          function getStrokePathAt(stroke, u) {
            const pts = stroke.points;
            if (pts.length <= 1) return { pen: pts[0] || { x: 0, y: 0 }, drawn: pts };
            const targetDist = Math.max(0, Math.min(1, u)) * stroke.totalLen;
            const drawn = [pts[0]];
            let pen = pts[0];

            for (let i = 0; i < pts.length - 1; i++) {
              const d0 = stroke.dists[i];
              const d1 = stroke.dists[i + 1];
              if (targetDist >= d1) {
                drawn.push(pts[i + 1]);
                pen = pts[i + 1];
              } else {
                const segLen = Math.max(0.0001, d1 - d0);
                const s = (targetDist - d0) / segLen;
                pen = {
                  x: pts[i].x + (pts[i + 1].x - pts[i].x) * s,
                  y: pts[i].y + (pts[i + 1].y - pts[i].y) * s
                };
                drawn.push(pen);
                break;
              }
            }
            return { pen, drawn };
          }

          const maskLineWidth = CONFIG.INTRO.PEN_MASK_WIDTH * computedFontSize;
          const penRadius = Math.max(4, 0.07 * computedFontSize);

          if (avatarStage) {
            avatarStage.classList.add('stage-ready');
            avatarStage.style.opacity = '1';
          }
          if (floatAnimation) {
            floatAnimation.transitionTo('fly', 0.2);
          }

          const timeScale = isSlowActive ? (1 / slowMultiplier) : (isRepeatSession ? (1 / CONFIG.INTRO.REPEAT_SPEED) : 1.0);
          let lastTime = performance.now();
          let virtualTime = 0;

          const T_GATE = CONFIG.INTRO.GATE_FADE_DUR;
          const T_FLY_IN = T_GATE + CONFIG.INTRO.FLY_IN_DUR;
          const T_WRITE_START = CONFIG.INTRO.WRITE_START;
          const T_WRITE_END = CONFIG.INTRO.WRITE_END;
          const T_SETTLE_END = CONFIG.INTRO.SETTLE_END;
          const T_TOPBAR = CONFIG.INTRO.TOPBAR_TIME;
          const T_SUBTITLE = CONFIG.INTRO.SUBTITLE_TIME;
          const T_BOTTOM = CONFIG.INTRO.BOTTOM_TIME;
          const T_TOTAL = CONFIG.INTRO.TOTAL_TIME;

          const cStart = letterData[0].strokes[0].points[0];

          let curAvatarX = 0;
          let curAvatarY = -vh * 0.45;
          let lastAvatarX = 0;
          let lastAvatarY = -vh * 0.45;
          let lastAvatarScale = CONFIG.WRITE_SCALE;
          let settleCrossfadeStarted = false;
          let topBarRevealed = false;
          let subtitleRevealed = false;
          let bottomRevealed = false;
          let homePoseSet = false;
          let handoverLookSet = false;

          const cometTrail = [];
          const MAX_TRAIL_PTS = 14;
          const sparkles = [];

          function introTick(now) {
            if (!isIntroActive || introCancelRequested) return;

            const dtSec = Math.min(0.1, (now - lastTime) / 1000);
            lastTime = now;
            virtualTime += dtSec * timeScale;

            const curVw = window.innerWidth;
            const curVh = window.innerHeight;
            const halfW = curVw * 0.5;
            const halfH = curVh * 0.5;
            const homeKf = resolveKeyframe(CONFIG.AVATAR_KEYFRAMES[0]);

            let activePenX = cStart.x;
            let activePenY = cStart.y;
            let targetPenX = cStart.x;
            let targetPenY = cStart.y;
            let isPenWriting = false;

            // Phase 1: Gate fade out
            if (virtualTime < T_GATE) {
              if (avatarStage) avatarStage.style.opacity = '0';
            }
            // Phase 2: Fly-in from far away to above 'c' start
            else if (virtualTime >= T_GATE && virtualTime < T_FLY_IN) {
              if (avatarStage) avatarStage.style.opacity = '1';

              const u = (virtualTime - T_GATE) / (T_FLY_IN - T_GATE);
              const t = smoothstep(u);

              const curWriteScale = isMobile ? (CONFIG.WRITE_SCALE * 0.82) : CONFIG.WRITE_SCALE;
              const startScale = 0.10;
              const curScale = startScale + (curWriteScale - startScale) * t;

              // Solve IK translation so avatar arrives ready next to first letter
              const tipCanvas = projectToCanvas(getAvatarFingertipWorld(CONFIG.ARM_TIP));
              const tipScreenNoTransX = halfW + ((tipCanvas ? tipCanvas.x : halfW) - halfW) * curScale;
              const tipScreenNoTransY = halfH + ((tipCanvas ? tipCanvas.y : (halfH + 60)) - halfH) * curScale;

              const targetTx = cStart.x - tipScreenNoTransX;
              const targetTy = cStart.y - tipScreenNoTransY;

              const startX = 0;
              const startY = -curVh * 0.45;

              curAvatarX = startX + (targetTx - startX) * t;
              curAvatarY = startY + (targetTy - startY) * t;
              const curRoll = -0.06 * Math.sin(Math.PI * t);

              if (avatarStage) {
                avatarStage.style.transform = `translate3d(${curAvatarX.toFixed(2)}px, ${curAvatarY.toFixed(2)}px, 0) scale(${curScale.toFixed(3)}) rotate(${curRoll.toFixed(4)}rad)`;
              }

              if (window.AvatarDirector) {
                window.AvatarDirector.setStageTransform({
                  x: curAvatarX,
                  y: curAvatarY,
                  scale: curScale,
                  roll: curRoll,
                  bobY: 0,
                  bobRoll: 0
                });
                window.AvatarDirector.onIntroStep('fly-in');
              }

              if (floatAnimation && floatAnimation.currentPoseName !== 'fly') {
                floatAnimation.transitionTo('fly', 0.2);
              }

              setDesiredLookTarget(cStart.x, cStart.y, 0.15);
              activePenX = cStart.x;
              activePenY = cStart.y;
              targetPenX = cStart.x;
              targetPenY = cStart.y;
              lastAvatarX = curAvatarX;
              lastAvatarY = curAvatarY;
              lastAvatarScale = curScale;
            }
            // Phase 3: Avatar writes all 8 letters with the hand
            else if (virtualTime >= T_WRITE_START && virtualTime < T_WRITE_END) {
              if (avatarStage) avatarStage.style.opacity = '1';

              if (floatAnimation && floatAnimation.currentPoseName !== 'write') {
                floatAnimation.transitionTo('write', 0.25);
              }

              const writeElapsed = virtualTime - T_WRITE_START;
              const letterDuration = (T_WRITE_END - T_WRITE_START) / 8; // 0.45s per letter
              const letterIdx = Math.min(7, Math.floor(writeElapsed / letterDuration));
              const letterTime = writeElapsed % letterDuration;

              // Ensure all previous letters have their full mask cell stamped
              for (let k = 0; k < letterIdx; k++) {
                if (!letterData[k].completed) {
                  letterData[k].completed = true;
                  offMaskCtx.save();
                  offMaskCtx.fillStyle = '#ffffff';
                  offMaskCtx.fillRect(letterData[k].rect.left - 2, letterData[k].rect.top - 2, letterData[k].rect.width + 4, letterData[k].rect.height + 4);
                  offMaskCtx.restore();
                }
              }

              const curL = letterData[letterIdx];
              const nextL = letterIdx < 7 ? letterData[letterIdx + 1] : null;

              if (curL.char === 'd') {
                // Multi-stroke 'd': stroke 1 (bowl 0..0.20s), internal air hop (0.20..0.26s), stroke 2 (stem 0.26..0.39s), hop to 'z' (0.39..0.45s)
                const s1 = curL.strokes[0];
                const s2 = curL.strokes[1];

                if (letterTime < 0.20) {
                  // Stroke 1: bowl
                  isPenWriting = true;
                  const uStroke = letterTime / 0.20;
                  const { pen, drawn } = getStrokePathAt(s1, uStroke);
                  targetPenX = pen.x;
                  targetPenY = pen.y;

                  offMaskCtx.save();
                  offMaskCtx.beginPath();
                  offMaskCtx.rect(curL.rect.left - 2, curL.rect.top - 2, curL.rect.width + 4, curL.rect.height + 4);
                  offMaskCtx.clip();
                  offMaskCtx.beginPath();
                  offMaskCtx.lineWidth = maskLineWidth;
                  offMaskCtx.lineCap = 'round';
                  offMaskCtx.lineJoin = 'round';
                  offMaskCtx.strokeStyle = '#ffffff';
                  offMaskCtx.moveTo(drawn[0].x, drawn[0].y);
                  for (let i = 1; i < drawn.length; i++) offMaskCtx.lineTo(drawn[i].x, drawn[i].y);
                  offMaskCtx.stroke();
                  offMaskCtx.restore();
                } else if (letterTime >= 0.20 && letterTime < 0.26) {
                  // Internal air hop from bowl end to stem top
                  isPenWriting = false;
                  const hopU = (letterTime - 0.20) / 0.06;
                  const fromP = s1.points[s1.points.length - 1];
                  const toP = s2.points[0];
                  const arc = curVh * 0.04;
                  targetPenX = fromP.x + (toP.x - fromP.x) * hopU;
                  targetPenY = fromP.y + (toP.y - fromP.y) * hopU - arc * Math.sin(Math.PI * hopU);
                } else if (letterTime >= 0.26 && letterTime < 0.39) {
                  // Stroke 2: stem
                  isPenWriting = true;
                  const uStroke = (letterTime - 0.26) / 0.13;
                  const { pen, drawn } = getStrokePathAt(s2, uStroke);
                  targetPenX = pen.x;
                  targetPenY = pen.y;

                  offMaskCtx.save();
                  offMaskCtx.beginPath();
                  offMaskCtx.rect(curL.rect.left - 2, curL.rect.top - 2, curL.rect.width + 4, curL.rect.height + 4);
                  offMaskCtx.clip();
                  offMaskCtx.beginPath();
                  offMaskCtx.lineWidth = maskLineWidth;
                  offMaskCtx.lineCap = 'round';
                  offMaskCtx.lineJoin = 'round';
                  offMaskCtx.strokeStyle = '#ffffff';
                  offMaskCtx.moveTo(drawn[0].x, drawn[0].y);
                  for (let i = 1; i < drawn.length; i++) offMaskCtx.lineTo(drawn[i].x, drawn[i].y);
                  offMaskCtx.stroke();
                  offMaskCtx.restore();
                } else {
                  // Air hop to next letter 'z'
                  isPenWriting = false;
                  if (!curL.completed) {
                    curL.completed = true;
                    offMaskCtx.save();
                    offMaskCtx.fillStyle = '#ffffff';
                    offMaskCtx.fillRect(curL.rect.left - 2, curL.rect.top - 2, curL.rect.width + 4, curL.rect.height + 4);
                    offMaskCtx.restore();
                  }
                  const hopU = (letterTime - 0.39) / 0.06;
                  const fromP = s2.points[s2.points.length - 1];
                  const toP = nextL ? nextL.strokes[0].points[0] : fromP;
                  const arc = curVh * 0.04;
                  targetPenX = fromP.x + (toP.x - fromP.x) * hopU;
                  targetPenY = fromP.y + (toP.y - fromP.y) * hopU - arc * Math.sin(Math.PI * hopU);
                }
              } else {
                // Single-stroke letters: write 0..0.37s, then air hop 0.37..0.45s
                const stroke = curL.strokes[0];
                const writeLimit = letterIdx === 7 ? 0.45 : 0.37;

                if (letterTime < writeLimit) {
                  isPenWriting = true;
                  const uStroke = letterTime / writeLimit;
                  const { pen, drawn } = getStrokePathAt(stroke, uStroke);
                  targetPenX = pen.x;
                  targetPenY = pen.y;

                  offMaskCtx.save();
                  offMaskCtx.beginPath();
                  offMaskCtx.rect(curL.rect.left - 2, curL.rect.top - 2, curL.rect.width + 4, curL.rect.height + 4);
                  offMaskCtx.clip();
                  offMaskCtx.beginPath();
                  offMaskCtx.lineWidth = maskLineWidth;
                  offMaskCtx.lineCap = 'round';
                  offMaskCtx.lineJoin = 'round';
                  offMaskCtx.strokeStyle = '#ffffff';
                  offMaskCtx.moveTo(drawn[0].x, drawn[0].y);
                  for (let i = 1; i < drawn.length; i++) offMaskCtx.lineTo(drawn[i].x, drawn[i].y);
                  offMaskCtx.stroke();
                  offMaskCtx.restore();
                } else {
                  // Air hop to next letter
                  isPenWriting = false;
                  if (!curL.completed) {
                    curL.completed = true;
                    offMaskCtx.save();
                    offMaskCtx.fillStyle = '#ffffff';
                    offMaskCtx.fillRect(curL.rect.left - 2, curL.rect.top - 2, curL.rect.width + 4, curL.rect.height + 4);
                    offMaskCtx.restore();
                  }
                  const hopU = (letterTime - writeLimit) / 0.08;
                  const fromP = stroke.points[stroke.points.length - 1];
                  const toP = nextL ? nextL.strokes[0].points[0] : fromP;
                  const arc = curVh * 0.04;
                  targetPenX = fromP.x + (toP.x - fromP.x) * hopU;
                  targetPenY = fromP.y + (toP.y - fromP.y) * hopU - arc * Math.sin(Math.PI * hopU);
                }
              }

              // IK-lite: solve stage translation so the avatar's fingertip lands exactly on target
              const curWriteScale = isMobile ? (CONFIG.WRITE_SCALE * 0.82) : CONFIG.WRITE_SCALE;
              const tipCanvas = projectToCanvas(getAvatarFingertipWorld(CONFIG.ARM_TIP));

              if (tipCanvas) {
                const tipScreenNoTransX = halfW + (tipCanvas.x - halfW) * curWriteScale;
                const tipScreenNoTransY = halfH + (tipCanvas.y - halfH) * curWriteScale;

                const desiredTx = targetPenX - tipScreenNoTransX;
                const desiredTy = targetPenY - tipScreenNoTransY;

                // Smooth with lerp factor 0.35
                curAvatarX += (desiredTx - curAvatarX) * 0.35;
                curAvatarY += (desiredTy - curAvatarY) * 0.35;

                let actualTipX = tipScreenNoTransX + curAvatarX;
                let actualTipY = tipScreenNoTransY + curAvatarY;

                // Snap if error exceeds 10px so pen dot always sits on the hand
                const errDist = Math.hypot(targetPenX - actualTipX, targetPenY - actualTipY);
                if (errDist > 10) {
                  curAvatarX = desiredTx;
                  curAvatarY = desiredTy;
                  actualTipX = targetPenX;
                  actualTipY = targetPenY;
                }

                activePenX = actualTipX;
                activePenY = actualTipY;
              } else {
                activePenX = targetPenX;
                activePenY = targetPenY;
                curAvatarX = targetPenX - halfW;
                curAvatarY = targetPenY - halfH;
              }

              lastAvatarX = curAvatarX;
              lastAvatarY = curAvatarY;
              lastAvatarScale = curWriteScale;

              if (avatarStage) {
                avatarStage.style.transform = `translate3d(${curAvatarX.toFixed(2)}px, ${curAvatarY.toFixed(2)}px, 0) scale(${curWriteScale.toFixed(3)}) rotate(0rad)`;
              }

              if (window.AvatarDirector) {
                window.AvatarDirector.setStageTransform({
                  x: curAvatarX,
                  y: curAvatarY,
                  scale: curWriteScale,
                  roll: 0,
                  bobY: 0,
                  bobRoll: 0
                });
                window.AvatarDirector.onIntroStep('writing', { penX: targetPenX, penY: targetPenY });
              }

              setDesiredLookTarget(activePenX, activePenY, 0.08);
            }
            // Phase 4: Settle & Glide Down. Title glides to ~71vh, avatar glides up to HOME_AVATAR
            else if (virtualTime >= T_WRITE_END && virtualTime < T_SETTLE_END) {
              if (window.AvatarDirector && !settleCrossfadeStarted) {
                window.AvatarDirector.onIntroStep('glide-settle');
              }
              // Ensure all cells are fully filled
              for (let k = 0; k < 8; k++) {
                if (!letterData[k].completed) {
                  letterData[k].completed = true;
                  offMaskCtx.save();
                  offMaskCtx.fillStyle = '#ffffff';
                  offMaskCtx.fillRect(letterData[k].rect.left - 2, letterData[k].rect.top - 2, letterData[k].rect.width + 4, letterData[k].rect.height + 4);
                  offMaskCtx.restore();
                }
              }

              // Crossfade canvas -> DOM glyphs (250ms) immediately when writing completes
              if (!settleCrossfadeStarted) {
                settleCrossfadeStarted = true;
                spans.forEach((sp) => {
                  sp.classList.add('intro-revealed');
                  sp.style.opacity = '1';
                });
                if (introCanvas) {
                  introCanvas.style.transition = 'opacity 0.25s ease';
                  introCanvas.style.opacity = '0';
                  setTimeout(() => {
                    if (introCanvas && !isIntroActive) introCanvas.style.display = 'none';
                  }, 260);
                }
              }

              const u = (virtualTime - T_WRITE_END) / (T_SETTLE_END - T_WRITE_END); // 0.9s duration
              const t = easeInOutCubic(Math.min(1, Math.max(0, u)));

              // Animate title wrapper transform to 0 over 0.9s
              const curDeltaX = introDeltaX * (1 - t);
              const curDeltaY = introDeltaY * (1 - t);
              if (titleEl) {
                if (Math.abs(curDeltaX) > 0.05 || Math.abs(curDeltaY) > 0.05) {
                  titleEl.style.transform = `translate3d(${curDeltaX.toFixed(2)}px, ${curDeltaY.toFixed(2)}px, 0)`;
                } else {
                  titleEl.style.transform = '';
                }
              }

              // Animate avatar to CONFIG.HOME_AVATAR
              const fromX = lastAvatarX;
              const fromY = lastAvatarY;
              const fromScale = lastAvatarScale;

              const toX = homeKf.x;
              const toY = homeKf.y;
              const toScale = homeKf.scale;

              curAvatarX = fromX + (toX - fromX) * t;
              curAvatarY = fromY + (toY - fromY) * t;
              const curScale = fromScale + (toScale - fromScale) * t;
              const curRoll = 0.04 * Math.sin(Math.PI * t) * (toX >= fromX ? 1 : -1);

              if (avatarStage) {
                avatarStage.style.transform = `translate3d(${curAvatarX.toFixed(2)}px, ${curAvatarY.toFixed(2)}px, 0) scale(${curScale.toFixed(3)}) rotate(${curRoll.toFixed(4)}rad)`;
              }

              if (window.AvatarDirector) {
                window.AvatarDirector.setStageTransform({
                  x: curAvatarX,
                  y: curAvatarY,
                  scale: curScale,
                  roll: curRoll,
                  bobY: 0,
                  bobRoll: 0
                });
                window.AvatarDirector.onIntroStep('fly-in');
              }

              if (!handoverLookSet) {
                handoverLookSet = true;
                setDesiredLookTarget(halfW, halfH, 0.8);
              }

              if (!homePoseSet && u > 0.05) {
                homePoseSet = true;
                if (floatAnimation) {
                  floatAnimation.transitionTo('float', 0.9);
                }
                floatFadeStartTime = performance.now() / 1000;
                if (titleEl) {
                  titleEl.classList.add('shimmer-active');
                }
              }
            }
            // Phase 5: Reveal Top Bar & Fade Audio
            else if (virtualTime >= T_SETTLE_END && virtualTime < T_SUBTITLE) {
              if (avatarStage) {
                avatarStage.style.transform = `translate3d(${homeKf.x.toFixed(2)}px, ${homeKf.y.toFixed(2)}px, 0) scale(${homeKf.scale.toFixed(3)}) rotate(0rad)`;
              }

              if (!topBarRevealed && virtualTime >= T_TOPBAR) {
                topBarRevealed = true;
                if (navBar) {
                  navBar.classList.add('intro-revealed');
                  navBar.style.opacity = '1';
                  navBar.style.pointerEvents = 'auto';
                  navBar.style.transition = 'opacity 0.4s ease';
                }
                if (audio && !audio.muted) {
                  fadeAudioVolume(audio, CONFIG.AUDIO_VOLUME, (CONFIG.INTRO.AUDIO_FADE_DUR * 1000) / timeScale);
                }
                setTimeout(() => {
                  const isGainLow = webAudioMasterGain ? (webAudioMasterGain.gain.value < 0.05) : (audio.volume < 0.05);
                  if (audio && (audio.paused || isGainLow) && safeStorageGet('local', 'coodz_muted') !== 'true') {
                    audioNeedsRetry = true;
                    attachAudioRetryListener();
                  }
                }, 1500 / timeScale);
              }
            }
            // Phase 6: Subtitle decrypt & Phase 7: Bottom buttons reveal
            else if (virtualTime >= T_SUBTITLE && virtualTime < T_TOTAL) {
              if (avatarStage) {
                avatarStage.style.transform = `translate3d(${homeKf.x.toFixed(2)}px, ${homeKf.y.toFixed(2)}px, 0) scale(${homeKf.scale.toFixed(3)}) rotate(0rad)`;
              }

              if (!subtitleRevealed) {
                subtitleRevealed = true;
                if (subtitleWrap) {
                  subtitleWrap.classList.add('intro-revealed');
                  subtitleWrap.style.opacity = '1';
                  subtitleWrap.style.pointerEvents = 'auto';
                  subtitleWrap.style.transition = 'opacity 0.4s ease';
                  const subTextEl = subtitleWrap.querySelector('.hero-subtitle');
                  if (subTextEl) {
                    decryptTitle(subTextEl, 'MINECRAFT SCREENSHARER', (CONFIG.INTRO.SUBTITLE_DECRYPT_DUR * 1000) / timeScale);
                  }
                }
              }

              if (!bottomRevealed && virtualTime >= T_BOTTOM) {
                bottomRevealed = true;
                if (bottomActions) {
                  bottomActions.classList.add('intro-revealed');
                  bottomActions.style.opacity = '1';
                  bottomActions.style.pointerEvents = 'auto';
                  bottomActions.style.transition = 'opacity 0.6s ease';
                }
                const scrollHint = document.querySelector('.scroll-hint-wrap');
                if (scrollHint) {
                  scrollHint.classList.add('intro-revealed');
                  scrollHint.style.opacity = '1';
                  scrollHint.style.pointerEvents = 'auto';
                }
              }
            }
            // Phase 8: 7.2s Handover & Crossfade to DOM glyphs (250ms)
            else if (virtualTime >= T_TOTAL) {
              spans.forEach((sp) => {
                sp.classList.add('intro-revealed');
                sp.style.opacity = '1';
              });

              if (introCanvas) {
                introCanvas.style.opacity = '0';
                setTimeout(() => {
                  if (introCanvas) introCanvas.style.display = 'none';
                }, 260);
              }

              finishIntroInstant();
              removeSkipListeners();
              return;
            }

            // Compositing on #intro-canvas
            introCtx.save();
            introCtx.setTransform(1, 0, 0, 1, 0, 0);
            introCtx.clearRect(0, 0, introCanvas.width, introCanvas.height);

            // Draw glyphs masked by offMask
            introCtx.drawImage(offGlyphs, 0, 0);
            introCtx.globalCompositeOperation = 'destination-in';
            introCtx.drawImage(offMask, 0, 0);
            introCtx.globalCompositeOperation = 'source-over';
            introCtx.restore();

            // Render pen point, comet trail & sparkles during writing
            if (virtualTime >= T_WRITE_START && virtualTime < T_WRITE_END) {
              cometTrail.push({ x: activePenX, y: activePenY, time: virtualTime });
              if (cometTrail.length > MAX_TRAIL_PTS) {
                cometTrail.shift();
              }

              // Comet trail
              if (cometTrail.length > 1) {
                for (let k = 1; k < cometTrail.length; k++) {
                  const p1 = cometTrail[k - 1];
                  const p2 = cometTrail[k];
                  const progress = k / cometTrail.length;
                  const alpha = progress * 0.7;
                  const width = Math.max(1.5, penRadius * 0.7 * progress);
                  introCtx.strokeStyle = `rgba(122, 164, 255, ${alpha.toFixed(3)})`;
                  introCtx.lineWidth = width;
                  introCtx.lineCap = 'round';
                  introCtx.beginPath();
                  introCtx.moveTo(p1.x, p1.y);
                  introCtx.lineTo(p2.x, p2.y);
                  introCtx.stroke();
                }
              }

              // Glowing pen point
              const glowRadius = penRadius * 3.5;
              const glow = introCtx.createRadialGradient(activePenX, activePenY, 1, activePenX, activePenY, glowRadius);
              glow.addColorStop(0, 'rgba(232, 234, 255, 0.95)');
              glow.addColorStop(0.3, 'rgba(122, 164, 255, 0.85)');
              glow.addColorStop(0.7, 'rgba(51, 115, 255, 0.35)');
              glow.addColorStop(1, 'rgba(29, 78, 216, 0)');
              introCtx.fillStyle = glow;
              introCtx.beginPath();
              introCtx.arc(activePenX, activePenY, glowRadius, 0, Math.PI * 2);
              introCtx.fill();

              // Bright core dot
              introCtx.fillStyle = '#e8eaff';
              introCtx.beginPath();
              introCtx.arc(activePenX, activePenY, Math.max(2, penRadius * 0.45), 0, Math.PI * 2);
              introCtx.fill();

              // Sparkles when pen writes
              if (isPenWriting && Math.random() < 0.6) {
                sparkles.push({
                  x: activePenX + (Math.random() - 0.5) * penRadius * 1.5,
                  y: activePenY + (Math.random() - 0.5) * penRadius * 1.5,
                  vx: (Math.random() - 0.5) * 45,
                  vy: (Math.random() - 0.5) * 45 - 15,
                  life: 1.0,
                  decay: 1.8 + Math.random() * 1.2,
                  size: Math.max(1.5, penRadius * (0.3 + Math.random() * 0.3))
                });
              }
            }

            // Update & render sparkles
            for (let i = sparkles.length - 1; i >= 0; i--) {
              const sp = sparkles[i];
              sp.x += sp.vx * dtSec;
              sp.y += sp.vy * dtSec;
              sp.life -= sp.decay * dtSec;
              if (sp.life <= 0) {
                sparkles.splice(i, 1);
              } else {
                introCtx.fillStyle = `rgba(122, 164, 255, ${(sp.life * 0.85).toFixed(3)})`;
                introCtx.fillRect(sp.x - sp.size * 0.5, sp.y - sp.size * 0.5, sp.size, sp.size);
              }
            }

            // Debug overlays if enabled
            if (debugShowIntroPoints) {
              introCtx.save();
              // 1. Viewport Center Lines
              introCtx.strokeStyle = 'rgba(122, 164, 255, 0.45)';
              introCtx.lineWidth = 1;
              introCtx.setLineDash([4, 4]);
              introCtx.beginPath();
              introCtx.moveTo(halfW, 0);
              introCtx.lineTo(halfW, curVh);
              introCtx.moveTo(0, halfH);
              introCtx.lineTo(curVw, halfH);
              introCtx.stroke();
              introCtx.setLineDash([]);
              introCtx.fillStyle = '#7aa4ff';
              introCtx.font = '11px "Martian Mono", ui-monospace, monospace';
              introCtx.fillText('VIEWPORT CENTER (50vw, 50vh)', halfW + 6, halfH - 8);

              // 2. Ink bounds & Ink center
              const tInkLeft = Math.min(...letterData.map((l) => l.inkLeft));
              const tInkRight = Math.max(...letterData.map((l) => l.inkRight));
              const tInkTop = Math.min(...letterData.map((l) => l.inkTop));
              const tInkBottom = Math.max(...letterData.map((l) => l.inkBottom));
              const midInkX = (tInkLeft + tInkRight) * 0.5;

              introCtx.strokeStyle = 'rgba(51, 115, 255, 0.6)';
              introCtx.strokeRect(tInkLeft, tInkTop, tInkRight - tInkLeft, tInkBottom - tInkTop);
              introCtx.strokeStyle = '#3373ff';
              introCtx.beginPath();
              introCtx.moveTo(midInkX, tInkTop - 12);
              introCtx.lineTo(midInkX, tInkBottom + 12);
              introCtx.stroke();
              introCtx.fillStyle = '#3373ff';
              introCtx.fillText(`INK CENTER: ${midInkX.toFixed(1)}px (diff: ${(midInkX - halfW).toFixed(1)}px)`, tInkLeft, tInkTop - 14);

              letterData.forEach((ld) => {
                introCtx.strokeStyle = 'rgba(122, 164, 255, 0.3)';
                introCtx.strokeRect(ld.inkLeft, ld.inkTop, ld.inkWidth, ld.inkHeight);
              });

              // 3. Target point
              introCtx.fillStyle = '#7aa4ff';
              introCtx.beginPath();
              introCtx.arc(targetPenX, targetPenY, 5, 0, Math.PI * 2);
              introCtx.fill();
              introCtx.fillText('TARGET', targetPenX + 8, targetPenY - 4);

              // 4. Computed fingertip
              introCtx.fillStyle = '#e8eaff';
              introCtx.beginPath();
              introCtx.arc(activePenX, activePenY, 6, 0, Math.PI * 2);
              introCtx.fill();
              introCtx.fillText(`FINGERTIP [${CONFIG.PEN_ARM}] (tip=${CONFIG.ARM_TIP})`, activePenX + 8, activePenY + 12);

              // Line between target and fingertip
              introCtx.strokeStyle = '#3373ff';
              introCtx.beginPath();
              introCtx.moveTo(activePenX, activePenY);
              introCtx.lineTo(targetPenX, targetPenY);
              introCtx.stroke();
              introCtx.restore();
            }

            if (debugShowWaypointsMask) {
              letterData.forEach((ld) => {
                introCtx.strokeStyle = 'rgba(122, 164, 255, 0.5)';
                introCtx.lineWidth = 1;
                introCtx.strokeRect(ld.inkLeft, ld.inkTop, ld.inkWidth, ld.inkHeight);
                ld.strokes.forEach((st) => {
                  st.points.forEach((pt) => {
                    introCtx.fillStyle = '#3373ff';
                    introCtx.beginPath();
                    introCtx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
                    introCtx.fill();
                  });
                });
              });
            }

            introRafId = requestAnimationFrame(introTick);
          }

          introRafId = requestAnimationFrame(introTick);
        } catch (err) {
          if (window.AvatarDebug) console.warn('[Intro V2] Initialization error, falling back to wipe:', err);
          runFallbackWipe();
        }
      }).catch((err) => {
        if (window.AvatarDebug) console.warn('[Intro V2] Font load error, falling back to wipe:', err);
        runFallbackWipe();
      });
    }
  }

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
  }

  const cachedSlotKeyframes = {
    home: null,
    chi_sono: null,
    esperienze: null,
    contatti: null
  };

  /**
   * Measure the avatar's height at scale 1 once by projecting the 3D meshes
   * with the active camera and storing it in CONFIG.AVATAR_BASE_HEIGHT_PX_AT_ZOOM.
   */
  function measureAvatarBaseHeight() {
    if (!skinViewer || !skinViewer.camera || !skinViewer.playerObject) {
      if (!CONFIG.AVATAR_BASE_HEIGHT_PX_AT_ZOOM) {
        CONFIG.AVATAR_BASE_HEIGHT_PX_AT_ZOOM = window.innerHeight * (isMobile ? CONFIG.AVATAR_ZOOM_MOBILE : CONFIG.AVATAR_ZOOM_DESKTOP) * 0.82;
      }
      return CONFIG.AVATAR_BASE_HEIGHT_PX_AT_ZOOM;
    }

    try {
      skinViewer.playerObject.updateMatrixWorld(true);
      const Vector3 = skinViewer.camera.position.constructor;

      let minY = Infinity;
      let maxY = -Infinity;

      skinViewer.playerObject.traverse((node) => {
        if (node.isMesh && node.geometry) {
          if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
          const geomBox = node.geometry.boundingBox;
          if (geomBox) {
            const corners = [
              new Vector3(geomBox.min.x, geomBox.min.y, geomBox.min.z),
              new Vector3(geomBox.min.x, geomBox.max.y, geomBox.min.z),
              new Vector3(geomBox.max.x, geomBox.min.y, geomBox.min.z),
              new Vector3(geomBox.max.x, geomBox.max.y, geomBox.min.z),
              new Vector3(geomBox.min.x, geomBox.min.y, geomBox.max.z),
              new Vector3(geomBox.min.x, geomBox.max.y, geomBox.max.z),
              new Vector3(geomBox.max.x, geomBox.min.y, geomBox.max.z),
              new Vector3(geomBox.max.x, geomBox.max.y, geomBox.max.z)
            ];
            for (let i = 0; i < 8; i++) {
              const c = corners[i];
              c.applyMatrix4(node.matrixWorld);
              const p = c.clone().project(skinViewer.camera);
              const screenY = (-p.y * 0.5 + 0.5) * window.innerHeight;
              if (screenY < minY) minY = screenY;
              if (screenY > maxY) maxY = screenY;
            }
          }
        }
      });

      if (minY !== Infinity && maxY !== -Infinity && maxY > minY) {
        CONFIG.AVATAR_BASE_HEIGHT_PX_AT_ZOOM = maxY - minY;
        return CONFIG.AVATAR_BASE_HEIGHT_PX_AT_ZOOM;
      }
    } catch (e) {
      if (window.AvatarDebug) console.warn('[Avatar] Failed to measure base height:', e);
    }

    CONFIG.AVATAR_BASE_HEIGHT_PX_AT_ZOOM = window.innerHeight * (isMobile ? CONFIG.AVATAR_ZOOM_MOBILE : CONFIG.AVATAR_ZOOM_DESKTOP) * 0.82;
    return CONFIG.AVATAR_BASE_HEIGHT_PX_AT_ZOOM;
  }

  const resolvedKeyframeSlots = [
    { id: 'home', x: 0, y: 0, scale: 0.5, yaw: 0, roll: 0 },
    { id: 'chi_sono', x: 0, y: 0, scale: 0.5, yaw: 0, roll: 0 },
    { id: 'esperienze', x: 0, y: 0, scale: 0.5, yaw: 0, roll: 0 },
    { id: 'contatti', x: 0, y: 0, scale: 0.5, yaw: 0, roll: 0 }
  ];

  /**
   * Derive avatar keyframes (x, y, scale) directly from .avatar-slot elements
   * in each section's CSS grid relative to section to avoid scroll offset errors.
   */
  function computeSlotKeyframes() {
    updateCachedDimensions();
    const baseH = measureAvatarBaseHeight();
    const baseW = baseH * 0.65;
    const vw = cachedWindowWidth;
    const vh = cachedWindowHeight;
    const viewportCenterX = vw * 0.5;
    const viewportCenterY = vh * 0.5;

    const sections = [
      { id: 'home', el: document.getElementById('home'), slotSelector: '.home-avatar-slot' },
      { id: 'chi_sono', el: document.getElementById('chi_sono'), slotSelector: '.about-avatar-slot' },
      { id: 'esperienze', el: document.getElementById('esperienze'), slotSelector: '.exp-avatar-slot' },
      { id: 'contatti', el: document.getElementById('contatti'), slotSelector: '.contact-avatar-slot' }
    ];

    sections.forEach(({ id, el, slotSelector }) => {
      if (!el) return;
      const slot = el.querySelector(slotSelector) || el.querySelector('.avatar-slot');
      if (!slot) return;

      const secRect = el.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();

      const slotRelLeft = slotRect.left - secRect.left;
      const slotRelTop = slotRect.top - secRect.top;

      const slotCenterX = slotRelLeft + slotRect.width * 0.5;
      const slotCenterY = slotRelTop + slotRect.height * 0.5;

      const targetX = slotCenterX - viewportCenterX;
      const targetY = slotCenterY - viewportCenterY;

      let scale = 0.5;
      if (baseH > 0 && slotRect.height > 0) {
        const scaleH = (slotRect.height * 0.96) / baseH;
        const scaleW = (slotRect.width > 0) ? (slotRect.width / baseW) : scaleH;
        scale = Math.min(scaleH, scaleW);
      }
      scale = Math.max(0.20, Math.min(1.15, scale));

      cachedSlotKeyframes[id] = {
        x: targetX,
        y: targetY,
        scale: scale,
        slotRect: {
          left: slotRelLeft,
          top: slotRelTop,
          width: slotRect.width,
          height: slotRect.height
        }
      };
    });

    const kfs = CONFIG.AVATAR_KEYFRAMES;
    for (let i = 0; i < kfs.length; i++) {
      const kf = kfs[i];
      const isMob = cachedWindowWidth <= 768;
      const cached = cachedSlotKeyframes[kf.id];
      const targetObj = resolvedKeyframeSlots[i];
      targetObj.id = kf.id;
      if (cached) {
        targetObj.x = cached.x;
        targetObj.y = cached.y;
        targetObj.scale = cached.scale;
      } else {
        const kfXVal = isMob && kf.xMobile !== undefined ? kf.xMobile : kf.x;
        const kfYVal = isMob && kf.yMobile !== undefined ? kf.yMobile : kf.y;
        targetObj.x = (kfXVal / 100) * cachedWindowWidth;
        targetObj.y = (kfYVal / 100) * cachedWindowHeight + (CONFIG.AVATAR_Y_OFFSET || 0);
        targetObj.scale = isMob ? (kf.scaleMobile || kf.scale * 0.8) : kf.scale;
      }
      targetObj.yaw = isMob ? 0 : (kf.yaw || 0);
      targetObj.roll = kf.roll || 0;
    }

    if (window.AvatarDirector && typeof window.AvatarDirector.updateReadingRects === 'function') {
      window.AvatarDirector.updateReadingRects();
    }
  }

  function smoothstep(x) {
    const c = Math.max(0, Math.min(1, x));
    return c * c * (3 - 2 * c);
  }

  function resolveKeyframe(kf) {
    const isMob = cachedWindowWidth <= 768;
    const cached = cachedSlotKeyframes[kf.id];

    let kfX = 0;
    let kfY = 0;
    let kfScale = isMob ? (kf.scaleMobile || kf.scale * 0.8) : kf.scale;

    if (cached) {
      kfX = cached.x;
      kfY = cached.y;
      kfScale = cached.scale;
    } else {
      const kfXVal = isMob && kf.xMobile !== undefined ? kf.xMobile : kf.x;
      const kfYVal = isMob && kf.yMobile !== undefined ? kf.yMobile : kf.y;
      kfX = (kfXVal / 100) * cachedWindowWidth;
      kfY = (kfYVal / 100) * cachedWindowHeight + (CONFIG.AVATAR_Y_OFFSET || 0);
    }

    return {
      id: kf.id,
      x: kfX,
      y: kfY,
      scale: kfScale,
      yaw: isMob ? 0 : (kf.yaw || 0),
      roll: kf.roll || 0
    };
  }

  function applyBgWordOpacity() {
    document.documentElement.style.setProperty('--bg-word-opacity', CONFIG.BG_WORD_OPACITY);
    const el = getDomBgWord();
    if (el && fDisplay > 0.15) {
      const idx = Math.max(1, Math.min(3, Math.round(fDisplay)));
      const dist = fDisplay - idx;
      if (Math.abs(dist) < 0.85) {
        const op = Math.max(0, 1 - Math.abs(dist) * 1.25) * (typeof CONFIG.BG_WORD_OPACITY === 'number' ? CONFIG.BG_WORD_OPACITY : 1.0);
        el.style.opacity = op.toFixed(3);
      }
    }
  }

  function fitBgWords() {
    const el = getDomBgWord();
    if (!el) return;
    const widthVw = (typeof CONFIG.BG_WORD_WIDTH_VW === 'number' ? CONFIG.BG_WORD_WIDTH_VW : 88);
    const targetWidth = window.innerWidth * (widthVw / 100);
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.it;
    const words = {
      1: dict.bgWordAbout || 'CHI SONO',
      2: dict.bgWordExp || 'ESPERIENZE',
      3: dict.bgWordContact || 'CONTATTI'
    };

    const prevTransform = el.style.transform;
    el.style.transform = 'translate3d(-50%, -50%, 0)';
    [1, 2, 3].forEach((idx) => {
      const word = words[idx];
      el.textContent = word;
      el.style.fontSize = '100px';
      const rectW = el.getBoundingClientRect().width || el.offsetWidth || el.scrollWidth;
      if (rectW > 0) {
        const fittedPx = (targetWidth / rectW) * 100;
        bgWordMetrics[idx] = { text: word, fontSize: `${fittedPx.toFixed(1)}px` };
      } else {
        bgWordMetrics[idx] = { text: word, fontSize: '100px' };
      }
    });
    el.style.transform = prevTransform;

    if (activeBgWordIndex >= 1 && bgWordMetrics[activeBgWordIndex]) {
      el.textContent = bgWordMetrics[activeBgWordIndex].text;
      el.style.fontSize = bgWordMetrics[activeBgWordIndex].fontSize;
    } else {
      el.textContent = '';
    }
  }

  window.__applyBgWordOpacity = applyBgWordOpacity;
  window.__fitBgWords = fitBgWords;

  function waitForSiteFonts() {
    if (!document.fonts) return Promise.resolve();
    const loads = [
      document.fonts.load('800 100px "Bricolage Grotesque"'),
      document.fonts.load('400 12px "Martian Mono"'),
      document.fonts.ready
    ];
    return Promise.race([
      Promise.all(loads),
      new Promise((res) => setTimeout(res, 1500))
    ]).catch(() => { });
  }

  function fitHeroTitle() {
    const titleEl = document.getElementById('hero-title');
    if (!titleEl) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMob = vw <= 768;
    const targetWidth = vw * (isMob ? 0.86 : 0.68);
    const prevTransform = titleEl.style.transform;

    titleEl.style.transform = '';
    titleEl.style.left = '';
    titleEl.style.maxWidth = 'none';
    titleEl.style.position = 'relative';
    titleEl.style.fontSize = '100px';

    const rect = titleEl.getBoundingClientRect();
    const measuredW = Math.max(rect.width, titleEl.offsetWidth || 0, titleEl.scrollWidth || 0);
    let fittedPx = 100;
    if (measuredW > 0) {
      fittedPx = (targetWidth / measuredW) * 100;
      const maxByHeight = vh * (isMob ? 0.16 : 0.27);
      const minPx = isMob ? 40 : 56;
      const maxPx = Math.max(minPx, Math.min(isMob ? 110 : 275, maxByHeight));
      fittedPx = Math.max(minPx, Math.min(maxPx, fittedPx));
      titleEl.style.fontSize = `${fittedPx.toFixed(1)}px`;
    }

    const spans = Array.from(titleEl.querySelectorAll('.ch'));
    if (spans.length > 0) {
      const style = window.getComputedStyle(titleEl);
      const c = document.createElement('canvas').getContext('2d');
      if (c) {
        const measureInkSpanRange = () => {
          const curStyle = window.getComputedStyle(titleEl);
          c.font = `${curStyle.fontStyle} ${curStyle.fontWeight} ${curStyle.fontSize} ${curStyle.fontFamily}`;
          let minInk = Infinity;
          let maxInk = -Infinity;
          spans.forEach((sp) => {
            const r = sp.getBoundingClientRect();
            const m = c.measureText(sp.textContent.trim());
            const al = m.actualBoundingBoxLeft !== undefined ? m.actualBoundingBoxLeft : 0;
            const ar = m.actualBoundingBoxRight !== undefined ? m.actualBoundingBoxRight : r.width;
            minInk = Math.min(minInk, r.left - al);
            maxInk = Math.max(maxInk, r.left + ar);
          });
          return { minInk, maxInk };
        };

        let { minInk, maxInk } = measureInkSpanRange();
        const inkW = maxInk - minInk;
        if (isFinite(inkW) && inkW > targetWidth) {
          fittedPx = fittedPx * (targetWidth / inkW);
          titleEl.style.fontSize = `${fittedPx.toFixed(1)}px`;
          ({ minInk, maxInk } = measureInkSpanRange());
        }
        if (isFinite(minInk) && isFinite(maxInk)) {
          const corrX = (vw * 0.5) - ((minInk + maxInk) * 0.5);
          if (Math.abs(corrX) > 0.25) {
            titleEl.style.left = `${corrX.toFixed(2)}px`;
          }
        }
      }
    }

    titleEl.style.transform = prevTransform;
  }

  function updateDocumentTitle(secId) {
    const map = {
      it: {
        home: 'coodz_10 · minecraft screensharer',
        chi_sono: 'coodz_10 · chi sono',
        esperienze: 'coodz_10 · esperienze',
        'esperienze-detail': 'coodz_10 · esperienze',
        contatti: 'coodz_10 · contatti'
      },
      en: {
        home: 'coodz_10 · minecraft screensharer',
        chi_sono: 'coodz_10 · about me',
        esperienze: 'coodz_10 · experience',
        'esperienze-detail': 'coodz_10 · experience',
        contatti: 'coodz_10 · contact'
      }
    };
    const langMap = map[currentLang] || map.it;
    document.title = langMap[secId] || langMap.home;
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

    const kfA = resolvedKeyframeSlots[seg];
    const kfB = resolvedKeyframeSlots[seg + 1];

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

    // Compute stage velocity and acceleration for secondary motion
    const vh = Math.max(1, cachedWindowHeight);
    const safeDt = Math.max(0.001, dt);
    const stageVx = (finalX - prevStageX) / safeDt / vh;
    const stageVy = (finalY - prevStageY) / safeDt / vh;
    prevStageX = finalX;
    prevStageY = finalY;

    const stageAx = (stageVx - prevStageVx) / safeDt;
    const stageAy = (stageVy - prevStageVy) / safeDt;
    prevStageVx = stageVx;
    prevStageVy = stageVy;

    // Apply transform directly to #avatar-stage (translate3d, scale, rotate) when intro is not running
    if (!isIntroActive) {
      const stage = getDomStage();
      if (stage) {
        stage.style.transform = `translate3d(${finalX.toFixed(2)}px, ${finalY.toFixed(2)}px, 0) scale(${finalScale.toFixed(3)}) rotate(${finalRoll.toFixed(4)}rad)`;
      }
    }

    // Pass target yaw to model
    if (!activeDetailId) {
      targetPlayerRotY = baseYaw;
    }

    // Float driver amplitude fade (0 to 1 over 1.2s after intro)
    if (floatFadeStartTime !== null) {
      const elapsed = nowSec - floatFadeStartTime;
      floatDriverAmplitude = Math.min(1, Math.max(0, elapsed / FLOAT_FADE_DURATION));
      if (elapsed >= FLOAT_FADE_DURATION) {
        floatFadeStartTime = null;
        floatDriverAmplitude = 1.0;
      }
    } else if (!isIntroActive && !prefersReducedMotion) {
      floatDriverAmplitude = 1.0;
    }

    // Combined home float amplitude (strictly 1 at fDisplay=0 after intro fade; fades out while scrolling away)
    const homeWeight = (fDisplay < 0.35) ? Math.max(0, 1 - (fDisplay / 0.35)) : 0;
    currentHomeFloatAmp = prefersReducedMotion ? 0 : (floatDriverAmplitude * homeWeight * (1 - flightW));

    let bobVy = 0;
    if (!prefersReducedMotion && currentHomeFloatAmp > 0.001) {
      const omega = (2 * Math.PI) / 5.5;
      bobVy = 0.02 * omega * Math.cos(nowSec * omega) * currentHomeFloatAmp;
    }

    if (window.AvatarRig) {
      window.AvatarRig.setStageMotion(stageVx, stageVy + bobVy, stageAx, stageAy);
      window.AvatarRig.setFlightW(flightW);
      window.AvatarRig.setHomeFloatAmp(currentHomeFloatAmp);
    }

    // 6. Home float bob and slow roll tilt (+-2vh period 5.5s, sway +-2.2deg)
    let bobPx = 0;
    let rollDeg = 0;
    const avatarFloatEl = getDomAvatarFloat();
    if (!prefersReducedMotion) {
      if (currentHomeFloatAmp > 0.001) {
        bobPx = (cachedWindowHeight * 0.02) * Math.sin(nowSec * (2 * Math.PI / 5.5)) * currentHomeFloatAmp;
        rollDeg = 2.2 * Math.sin(nowSec * (2 * Math.PI / 7.5)) * currentHomeFloatAmp;
      } else if (fDisplay >= 0.35) {
        const nonHomeWeight = Math.min(1, (fDisplay - 0.35) / 0.2);
        bobPx = (cachedWindowHeight * 0.015) * Math.sin(nowSec * (2 * Math.PI / 6.0)) * nonHomeWeight * (1 - flightW);
        rollDeg = 1.5 * Math.sin(nowSec * (2 * Math.PI / 9.0)) * nonHomeWeight * (1 - flightW);
      }
      if (avatarFloatEl) {
        if (currentHomeFloatAmp > 0.001 || fDisplay >= 0.35) {
          avatarFloatEl.style.transformOrigin = '50% 50%';
          avatarFloatEl.style.transform = `translate3d(0, ${bobPx.toFixed(2)}px, 0) rotate(${rollDeg.toFixed(2)}deg)`;
        } else {
          avatarFloatEl.style.transform = 'none';
        }
      }
    }

    if (window.AvatarDirector) {
      window.AvatarDirector.setStageTransform({
        x: finalX,
        y: finalY,
        scale: finalScale,
        roll: finalRoll,
        bobY: bobPx,
        bobRoll: (rollDeg * Math.PI) / 180
      });
      window.AvatarDirector.updateFlightMotion(stageVx, stageVy + bobVy, stageAx, stageAy, safeDt);
    }

    // 7. Title float & letter wave + scrub
    const heroTitle = getDomHeroTitle();
    if (heroTitle && !isIntroActive) {
      if (fDisplay <= 0.6) {
        const p = fDisplay / 0.6;
        const s = 1 + 0.18 * p;
        const op = Math.max(0, 1 - p);
        const bl = (6 * p).toFixed(1);

        let bobTitlePx = 0;
        let rotTitleDeg = 0;
        if (!prefersReducedMotion && fDisplay < 0.35 && !isIntroActive) {
          const titleAmp = Math.max(0, 1 - (fDisplay / 0.35)) * (1 - flightW);
          const titleBobVh = 1.1 * Math.sin(nowSec * (2 * Math.PI / 6.5)) * titleAmp;
          rotTitleDeg = 0.5 * Math.sin(nowSec * (2 * Math.PI / 9.0)) * titleAmp;
          bobTitlePx = (titleBobVh * cachedWindowHeight) / 100;

          if (qualityTier !== 'low') {
            const chSpans = getDomHeroTitleChSpans();
            if (chSpans) {
              for (let i = 0; i < chSpans.length; i++) {
                const chYVh = Math.sin((2 * Math.PI * nowSec / 5.0) + (i * 0.55)) * 0.5 * titleAmp;
                const chYPx = (chYVh * cachedWindowHeight) / 100;
                chSpans[i].style.transform = `translate3d(0, ${chYPx.toFixed(2)}px, 0)`;
              }
            }
          }
        } else {
          const chSpans = getDomHeroTitleChSpans();
          if (chSpans) {
            chSpans.forEach((ch) => { ch.style.transform = ''; });
          }
        }

        heroTitle.style.transform = `translate3d(0, ${bobTitlePx.toFixed(2)}px, 0) rotate(${rotTitleDeg.toFixed(2)}deg) scale(${s.toFixed(3)})`;
        heroTitle.style.opacity = op.toFixed(3);
        heroTitle.style.filter = `blur(${bl}px)`;
        heroTitle.style.pointerEvents = op < 0.1 ? 'none' : 'auto';
      } else {
        heroTitle.style.opacity = '0';
        heroTitle.style.filter = 'blur(6px)';
        heroTitle.style.pointerEvents = 'none';
      }
    }

    const heroSubElements = getDomHeroSubElements();
    if (heroSubElements) {
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
    }

    // 8. Continuous single fixed background word sliding scrub
    const bgEl = getDomBgWord();
    if (bgEl) {
      const idx = Math.max(1, Math.min(3, Math.round(fDisplay)));
      const dist = fDisplay - idx;
      if (fDisplay > 0.15 && Math.abs(dist) < 0.85) {
        if (activeBgWordIndex !== idx && bgWordMetrics[idx]) {
          activeBgWordIndex = idx;
          bgEl.textContent = bgWordMetrics[idx].text;
          bgEl.style.fontSize = bgWordMetrics[idx].fontSize;
        }
        const opMult = typeof CONFIG.BG_WORD_OPACITY === 'number' ? CONFIG.BG_WORD_OPACITY : 1.0;
        const op = Math.max(0, 1 - Math.abs(dist) * 1.25) * opMult;
        const shiftPx = dist * 70;
        bgEl.style.transform = `translate3d(calc(-50% + ${shiftPx.toFixed(1)}px), -50%, 0)`;
        bgEl.style.opacity = op.toFixed(3);
      } else {
        activeBgWordIndex = -1;
        bgEl.style.opacity = '0';
      }
    }
  }

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
      targetPlayerRotY = CONFIG.HOME_AVATAR.yaw; // slight turn in home
    } else {
      targetPlayerRotY = 0;
    }

    if (floatAnimation) {
      floatAnimation.onSectionChange(state);
    }

    if (window.AvatarDirector) {
      window.AvatarDirector.onSectionEnter(state);
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

    measureAvatarBaseHeight();
    computeSlotKeyframes();
  }

  let skinMaterialsConfigured = false;

  function applyAvatarMaterialSettings() {
    if (!skinViewer || !skinViewer.playerObject) return;
    try {
      skinViewer.playerObject.traverse((node) => {
        if (node.isMesh && node.material) {
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          mats.forEach((mat) => {
            if (mat && mat.emissive) {
              if (typeof mat.emissive.set === 'function') {
                mat.emissive.set(CONFIG.AVATAR_EMISSIVE);
              }
              mat.emissiveIntensity = CONFIG.AVATAR_EMISSIVE_INTENSITY;
              mat.roughness = 0.45;
              mat.metalness = 0.12;
              mat.needsUpdate = true;
            }
          });
        }
      });
      if (skinViewer.globalLight) skinViewer.globalLight.intensity = CONFIG.GLOBAL_LIGHT;
      if (skinViewer.cameraLight) skinViewer.cameraLight.intensity = CONFIG.CAMERA_LIGHT;

      if (skinViewer.scene && !skinViewer._rimLight && skinViewer.cameraLight) {
        try {
          const LightClass = skinViewer.cameraLight.constructor;
          const rimLight = new LightClass(0x3373ff, 2.5);
          rimLight.position.set(-25, 30, -30);
          skinViewer.scene.add(rimLight);
          skinViewer._rimLight = rimLight;

          const fillLight = new LightClass(0xe8eaff, 1.8);
          fillLight.position.set(25, 20, 25);
          skinViewer.scene.add(fillLight);
          skinViewer._fillLight = fillLight;
        } catch (lightErr) {
          if (window.AvatarDebug) console.warn('[Avatar] Error adding studio rim/fill lights:', lightErr);
        }
      }
    } catch (err) {
      if (window.AvatarDebug) console.warn('[Avatar] Error applying emissive material settings:', err);
    }
  }

  function updateAvatarAura() {
    const canvas = document.getElementById('avatar-canvas');
    const fallbackAura = document.getElementById('avatar-aura-fallback');
    if (!canvas) return;

    const strength = (typeof CONFIG.AURA === 'number') ? Math.max(0, Math.min(1, CONFIG.AURA)) : 1.0;

    if (qualityTier === 'low') {
      canvas.style.filter = 'none';
      if (fallbackAura) {
        fallbackAura.style.display = strength > 0.05 ? 'block' : 'none';
        fallbackAura.style.opacity = (strength * 0.18).toFixed(3);
      }
      return;
    }

    if (fallbackAura) fallbackAura.style.display = 'none';

    if (strength <= 0.01) {
      canvas.style.filter = 'none';
    } else {
      const a1 = (0.16 * strength).toFixed(3);
      const a2 = (0.10 * strength).toFixed(3);
      canvas.style.filter = `drop-shadow(0 0 14px rgba(29, 78, 216, ${a1})) drop-shadow(0 0 40px rgba(29, 78, 216, ${a2}))`;
    }
  }

  window.__updateAvatarAura = updateAvatarAura;

  function getAvatarFingertipWorld(tipDistance = CONFIG.ARM_TIP) {
    if (!skinViewer || !skinViewer.playerObject || !skinViewer.playerObject.skin || !skinViewer.camera) {
      return null;
    }
    const skin = skinViewer.playerObject.skin;
    const arm = (CONFIG.PEN_ARM === 'right') ? skin.rightArm : skin.leftArm;
    if (!arm) return null;

    try {
      skinViewer.playerObject.updateMatrixWorld(true);
      if (!_fingertipLocal) {
        const Vector3 = skinViewer.camera.position.constructor;
        _fingertipLocal = new Vector3();
        _fingertipWorld = new Vector3();
      }
      _fingertipLocal.set(0, -tipDistance, 0);
      _fingertipWorld.copy(_fingertipLocal);
      arm.localToWorld(_fingertipWorld);
      return _fingertipWorld;
    } catch (e) {
      return null;
    }
  }

  function projectToCanvas(worldPoint) {
    if (!worldPoint || !skinViewer || !skinViewer.camera) return null;
    try {
      if (!_projPoint) {
        _projPoint = new (skinViewer.camera.position.constructor)();
      }
      _projPoint.copy(worldPoint);
      _projPoint.project(skinViewer.camera);
      const w = window.innerWidth;
      const h = window.innerHeight;
      _canvasPoint.x = (_projPoint.x * 0.5 + 0.5) * w;
      _canvasPoint.y = (-_projPoint.y * 0.5 + 0.5) * h;
      return _canvasPoint;
    } catch (e) {
      return null;
    }
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
        const dt = Math.max(0.001, Math.min(0.05, (now - lastFallbackTime) / 1000));
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
        height: window.innerHeight
      });

      if (skinViewer.renderer) {
        skinViewer.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        skinViewer.renderer.setSize(window.innerWidth, window.innerHeight, false);
      }

      skinViewer.controls.enabled = false;
      skinViewer.autoRotate = false; // Smoothly controlled via zero-g per-frame lerp

      // Single custom AvatarRig animation engine owning all joints
      if (window.AvatarRig) {
        window.AvatarRig.init(skinViewer.playerObject, skinViewer);
        skinViewer.animation = new window.AvatarRig.RigAnimation();
        floatAnimation = skinViewer.animation;
      } else {
        skinViewer.animation = new FloatAnimation();
        floatAnimation = skinViewer.animation;
      }

      // Apply light intensities and 3D emissive material luminosity
      if (skinViewer.globalLight) skinViewer.globalLight.intensity = CONFIG.GLOBAL_LIGHT;
      if (skinViewer.cameraLight) skinViewer.cameraLight.intensity = CONFIG.CAMERA_LIGHT;
      applyAvatarMaterialSettings();
      updateAvatarAura();

      if (skinViewer.loadSkin) {
        const origLoadSkin = skinViewer.loadSkin.bind(skinViewer);
        skinViewer.loadSkin = function (...args) {
          const res = origLoadSkin(...args);
          if (res && typeof res.then === 'function') {
            res.then(() => {
              applyAvatarMaterialSettings();
              updateAvatarAura();
            }).catch(() => { });
          }
          return res;
        };
        const skinPromise = skinViewer.loadSkin(CONFIG.SKIN_URL);
        if (skinPromise && typeof skinPromise.catch === 'function') {
          skinPromise.catch(() => showFallback());
        }
      }

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
        const dt = Math.max(0.001, Math.min(0.05, (now - lastRenderTime) / 1000));
        lastRenderTime = now;

        // Apply emissive materials once meshes become ready
        if (!skinMaterialsConfigured && skinViewer.playerObject) {
          let hasMeshes = false;
          skinViewer.playerObject.traverse((n) => { if (n.isMesh) hasMeshes = true; });
          if (hasMeshes) {
            applyAvatarMaterialSettings();
            skinMaterialsConfigured = true;
          }
        }

        // 1. Run scroll-driven flight & keyframe interpolation
        runFrameFlightTick(nowSec, dt);

        // 2. Update on-screen look targets
        updateLookTargetEveryFrame();
        updateHeadLookTarget();

        // 3. Continuous rotation on player.rotation.y (driven via AvatarRig root yaw spring)
        if (skinViewer.playerObject) {
          let yawDrift = 0;
          if (!prefersReducedMotion && flightW < 0.2) {
            if (currentHomeFloatAmp > 0.001) {
              yawDrift = 0.18 * Math.sin(nowSec * (2 * Math.PI / 8.0)) * currentHomeFloatAmp;
            } else if (fDisplay >= 0.35) {
              yawDrift = 0.12 * Math.sin(nowSec * (2 * Math.PI / 11.0));
            }
          }
          avatarSpinCurrent += (avatarSpinTarget - avatarSpinCurrent) * 0.09;
          const baseYaw = (homeReactionActive && activeSectionId === 'home' && fDisplay < 0.35) ? homeReactionYaw : targetPlayerRotY;
          const finalTargetRotY = baseYaw + CONFIG.ROT_OFFSET + yawDrift + avatarSpinCurrent;

          if (window.AvatarRig) {
            window.AvatarRig.setRootYaw(finalTargetRotY);
          } else {
            skinViewer.playerObject.rotation.y += (finalTargetRotY - skinViewer.playerObject.rotation.y) * 0.08;
          }
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

      // Resize & Orientation
      window.addEventListener('resize', updateViewerSize, { passive: true });
      window.addEventListener('orientationchange', () => {
        setTimeout(updateViewerSize, 120);
      }, { passive: true });

      // Pause rendering when tab hidden
      document.addEventListener('visibilitychange', () => {
        if (skinViewer) {
          skinViewer.renderPaused = document.hidden;
        }
      });
    } catch (err) {
      if (window.AvatarDebug) console.warn('SkinViewer failed to initialize, using fallback image:', err);
      showFallback();
    }
  }

  let avatarSpinCurrent = 0;
  let avatarSpinTarget = 0;
  let homeReactionActive = false;
  let homeReactionYaw = 0;

  function initAvatarInteraction() {
    function handleInteraction(clientX, clientY, target) {
      if (target && target.closest('button, a, input, select, textarea, [role="button"], #opening-screen, .opening-screen, .avatar-debug-panel, #proofs-modal, .proofs-modal')) {
        return;
      }
      if (!skinViewer || !floatAnimation) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // In home section: clicking/tapping avatar triggers wave + small 360 spin
      if (activeSectionId === 'home' && fDisplay < 0.35) {
        const kfHome = resolveKeyframe(CONFIG.AVATAR_KEYFRAMES[0]);
        const centerX = (vw * 0.5) + kfHome.x;
        const centerY = (vh * 0.5) + kfHome.y;
        const boxWidth = isMobile ? vw * 0.6 : vh * 0.42;
        const boxHeight = isMobile ? vh * 0.45 : vh * 0.55;

        const dx = Math.abs(clientX - centerX);
        const dy = Math.abs(clientY - centerY);

        if (dx <= boxWidth / 2 && dy <= boxHeight / 2) {
          if (window.AvatarDirector) {
            window.AvatarDirector.onAvatarClick();
          } else {
            floatAnimation.triggerWave(2.2);
            avatarSpinTarget += Math.PI * 2;
          }
          return;
        }
      }

      if (currentAvatarState === 'home') return;

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

    // Pointer movement tracking for AvatarDirector
    window.addEventListener('mousemove', (e) => {
      if (window.AvatarDirector) {
        window.AvatarDirector.onPointerMove(e.clientX, e.clientY);
      }
    }, { passive: true });

    // Hover Reactions in Home (Only for non-touch devices)
    if (!isTouchDevice) {
      const bottomLinks = document.querySelectorAll('.home-bottom-actions a, .home-bottom-actions button');
      const heroTitle = document.getElementById('hero-title');

      function onButtonHover(btnEl, isEntering) {
        if (activeSectionId !== 'home' || fDisplay >= 0.35 || isIntroActive) return;
        if (isEntering) {
          homeReactionActive = true;
          const rect = btnEl.getBoundingClientRect();
          const btnCenterX = rect.left + rect.width * 0.5;
          const btnCenterY = rect.top + rect.height * 0.5;
          homeReactionYaw = (btnCenterX < window.innerWidth * 0.5) ? -0.42 : 0.42;
          setDesiredLookTarget(btnCenterX, btnCenterY, 0.35);
          if (window.AvatarDirector) {
            window.AvatarDirector.onHover(btnEl, 'home-button');
          }
          if (floatAnimation) {
            floatAnimation.transitionTo('point', 0.5);
          }
        } else {
          homeReactionActive = false;
          if (window.AvatarDirector) {
            window.AvatarDirector.onLeave(btnEl);
          }
          if (floatAnimation) {
            floatAnimation.transitionTo('float', 0.8);
          }
        }
      }

      bottomLinks.forEach((link) => {
        link.addEventListener('mouseenter', () => onButtonHover(link, true));
        link.addEventListener('mouseleave', () => onButtonHover(link, false));
      });

      if (heroTitle) {
        heroTitle.addEventListener('mouseenter', () => {
          if (activeSectionId !== 'home' || fDisplay >= 0.35 || isIntroActive) return;
          const rect = heroTitle.getBoundingClientRect();
          setDesiredLookTarget(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5, 0.35);
          if (window.AvatarDirector) {
            window.AvatarDirector.onHover(heroTitle, 'hero-title');
          }
        });
        heroTitle.addEventListener('mouseleave', () => {
          if (activeSectionId !== 'home' || fDisplay >= 0.35 || isIntroActive) return;
          if (window.AvatarDirector) {
            window.AvatarDirector.onLeave(heroTitle);
          }
        });
      }
    }
  }

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
          color: Math.random() > 0.4 ? '#e8eaff' : (Math.random() > 0.5 ? '#7aa4ff' : '#3373ff')
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

    // Shooting Star (Meteor) Object Pool (No per-frame allocations)
    const meteorPoolSize = qualityTier === 'low' ? 6 : (isMobile ? 8 : 16);
    const meteorPool = [];
    for (let i = 0; i < meteorPoolSize; i++) {
      meteorPool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        len: 0,
        angleRad: 0,
        alpha: 0,
        decay: 0,
        lineWidth: 1.5,
        isBig: false
      });
    }

    function spawnMeteorFromPool(isBig = false) {
      let m = null;
      for (let i = 0; i < meteorPool.length; i++) {
        if (!meteorPool[i].active) {
          m = meteorPool[i];
          break;
        }
      }
      if (!m) return;

      const angleDeg = Math.random() * 25 + 25; // 25-50 degrees
      const angleRad = (angleDeg * Math.PI) / 180;
      const speed = isBig ? (Math.random() * 6 + 18) : (Math.random() * 10 + 12);
      const len = isBig ? (Math.random() * 60 + 200) : (Math.random() * 140 + 80); // 80-220px

      let startX, startY;
      if (Math.random() < 0.6) {
        // Start from top edge
        startX = Math.random() * (width * 1.1);
        startY = -30;
      } else {
        // Start from right edge
        startX = width + 30;
        startY = Math.random() * (height * 0.5);
      }

      m.active = true;
      m.x = startX;
      m.y = startY;
      m.vx = -Math.cos(angleRad) * speed;
      m.vy = Math.sin(angleRad) * speed;
      m.len = len;
      m.angleRad = angleRad;
      m.alpha = 1.0;
      m.decay = isBig ? 0.009 : (Math.random() * 0.012 + 0.012);
      m.lineWidth = isBig ? 2.5 : (Math.random() * 0.8 + 1.2);
      m.isBig = isBig;
    }

    let nextMeteorTime = performance.now() + (isMobile ? 1800 : 900);
    let nextBigMeteorTime = performance.now() + 12000; // Big brighter one every ~12s

    let startTime = performance.now();

    function renderStars(now) {
      const starsT0 = (window.AvatarDebug && window.AvatarDebug.isPerfActive && window.AvatarDebug.isPerfActive()) ? performance.now() : 0;
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
            ctx.strokeStyle = 'rgba(122, 164, 255, 0.35)';
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

        // 2. Spawn and render shooting stars (meteors) via object pool
        if (now >= nextMeteorTime) {
          spawnMeteorFromPool(false);
          // Desktop: sometimes two at once (25% chance)
          if (!isMobile && Math.random() < 0.25) {
            spawnMeteorFromPool(false);
          }
          const minInt = isMobile ? 1500 : 800;
          const maxInt = isMobile ? 3500 : 2200;
          nextMeteorTime = now + (Math.random() * (maxInt - minInt) + minInt);
        }

        if (now >= nextBigMeteorTime) {
          spawnMeteorFromPool(true);
          nextBigMeteorTime = now + (Math.random() * 3000 + 11000); // about every 12s
        }

        for (let i = 0; i < meteorPool.length; i++) {
          const m = meteorPool[i];
          if (!m.active) continue;

          m.x += m.vx;
          m.y += m.vy;
          m.alpha -= m.decay;

          if (m.alpha <= 0 || m.y > height + 200 || m.x < -200) {
            m.active = false;
            continue;
          }

          const tailX = m.x - Math.cos(m.angleRad) * (-m.len);
          const tailY = m.y - Math.sin(m.angleRad) * m.len;

          const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
          if (m.isBig) {
            grad.addColorStop(0, `rgba(232, 234, 255, ${m.alpha})`);
            grad.addColorStop(0.2, `rgba(122, 164, 255, ${(m.alpha * 0.9).toFixed(2)})`);
            grad.addColorStop(0.6, `rgba(51, 115, 255, ${(m.alpha * 0.5).toFixed(2)})`);
            grad.addColorStop(1, 'rgba(29, 78, 216, 0)');
          } else {
            grad.addColorStop(0, `rgba(122, 164, 255, ${m.alpha})`);
            grad.addColorStop(0.35, `rgba(51, 115, 255, ${(m.alpha * 0.6).toFixed(2)})`);
            grad.addColorStop(1, 'rgba(29, 78, 216, 0)');
          }

          ctx.strokeStyle = grad;
          ctx.lineWidth = m.lineWidth;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(m.x, m.y, m.isBig ? 2.5 : 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(232, 234, 255, ${m.alpha})`;
          ctx.fill();
        }

        // 3. Subtle thrust particles under avatar feet when in home section
        if (activeSectionId === 'home' && !prefersReducedMotion && fDisplay < 0.2) {
          const scale = isMobile ? CONFIG.HOME_AVATAR.scaleMobile : CONFIG.HOME_AVATAR.scale;
          const feetX = (width * 0.5) + lastComputedStageX;
          const feetY = (height * 0.5) + lastComputedStageY + (height * 0.74 * 0.5 * scale);

          if (thrustParticles.length < 10 && Math.random() < 0.35) {
            thrustParticles.push({
              x: feetX + (Math.random() - 0.5) * 16 * scale,
              y: feetY + Math.random() * 4,
              vx: (Math.random() - 0.5) * 0.4,
              vy: Math.random() * 0.7 + 0.5,
              radius: Math.random() * 0.8 + 0.6,
              alpha: 0.55,
              color: Math.random() > 0.5 ? '#7aa4ff' : '#3373ff'
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

      if (starsT0 > 0 && window.AvatarDebug && typeof window.AvatarDebug.recordMetric === 'function') {
        window.AvatarDebug.recordMetric('starsCanvas', performance.now() - starsT0);
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

  function renderExperienceDetail(key) {
    const exp = EXPERIENCE_DETAILS[key];
    const detailEl = document.getElementById('experience-detail-view');
    if (!exp || !detailEl) return;

    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.it;

    let proofsBtnHtml = '';
    if (exp.proofs && exp.proofs.length > 0) {
      proofsBtnHtml = `
        <div class="detail-actions">
          <button id="detail-proofs-btn" class="btn btn--primary mono cursor-pointer" data-exp="${key}">
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
            <div class="detail-pros-col">
              <div class="detail-group-tag mono"><span class="item-num">01 · </span>${exp.strengthsTitle[currentLang].toUpperCase()}</div>
              <ul class="detail-list mono">
                ${exp.strengths[currentLang].map((item) => `<li><span class="bullet accent">·</span> <span>${item}</span></li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${exp.weaknesses ? `
            <div class="detail-cons-col">
              <div class="detail-group-tag mono"><span class="item-num">02 · </span>${exp.weaknessesTitle[currentLang].toUpperCase()}</div>
              <ul class="detail-list mono">
                ${exp.weaknesses[currentLang].map((item) => `<li><span class="bullet accent">·</span> <span>${item}</span></li>`).join('')}
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
          <h3 class="detail-review-title">${exp.experienceTitle[currentLang]}</h3>
          <div class="detail-paragraphs">
            ${exp.experienceParagraphs[currentLang].map((p) => `<p class="lead">${p}</p>`).join('')}
          </div>
        </div>
      `;
    }

    let noticeHtml = '';
    if (exp.inProgress) {
      noticeHtml = `
        <div class="detail-notice mono">
          <span class="status-dot-accent">●</span>
          <span class="detail-notice-tag">${exp.noticeTag[currentLang]}</span>
          <span class="detail-notice-text">${exp.noticeText[currentLang]}</span>
        </div>
      `;
    }

    detailEl.innerHTML = `
      <div class="detail-top-nav">
        <button id="btn-back-to-experiences" class="btn btn--secondary mono cursor-pointer" aria-label="Torna alle esperienze">
          ${dict.backToExperiences || '[ ← torna alle esperienze ]'}
        </button>
      </div>

      <div class="detail-header">
        <div class="detail-header-left">
          <div class="detail-title-row">
            <span class="detail-index mono">${exp.index}</span>
            <h2 class="detail-title">${exp.title}</h2>
          </div>
          <p class="detail-role mono">${exp.role[currentLang]}</p>
        </div>
        <div class="detail-header-right mono">
          ${exp.stars ? `<span class="detail-stars">${exp.stars}</span>` : ''}
          <span class="status-indicator-tag ${exp.inProgress ? 'status--active' : 'status--dimesso'}">
            <span class="${exp.inProgress ? 'status-dot-accent' : 'status-dot-muted'}">${exp.inProgress ? '●' : '○'}</span>
            <span>${exp.inProgress ? (currentLang === 'it' ? 'attivo' : 'active') : (currentLang === 'it' ? 'dimesso' : 'resigned')}</span>
          </span>
          <span class="detail-period">${exp.period[currentLang]}</span>
        </div>
      </div>

      <div class="divider"></div>

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
      if (window.AvatarDirector) {
        window.AvatarDirector.onDetailOpen(key);
        if (typeof window.AvatarDirector.updateReadingRects === 'function') {
          window.AvatarDirector.updateReadingRects();
        }
      }
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
      if (window.AvatarDirector) {
        window.AvatarDirector.onDetailClose();
        if (typeof window.AvatarDirector.updateReadingRects === 'function') {
          window.AvatarDirector.updateReadingRects();
        }
      }
    });

    setTimeout(() => {
      if (!activeDetailId) {
        detailView.style.display = 'none';
        detailView.setAttribute('aria-hidden', 'true');
      }
    }, 500);
  }

  function openProofsModal(key) {
    const exp = EXPERIENCE_DETAILS[key];
    const modal = document.getElementById('proofs-modal');
    const titleEl = document.getElementById('proofs-modal-title');
    const linksEl = document.getElementById('proofs-modal-links');
    if (!exp || !modal || !titleEl || !linksEl) return;

    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.it;
    titleEl.textContent = `${dict.proofsTitle || 'Link e prove'} · ${exp.title}`;

    linksEl.innerHTML = exp.proofs.map((p) => `
      <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="row-link proof-link-item mono">
        <span class="row-link__left"><span class="row-link__title truncate">${p.url}</span></span>
        <span class="row-link__right"><span class="row-link__arrow" aria-hidden="true">&rarr;</span></span>
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
    const tabBtns = document.querySelectorAll('.filter-tab, .exp-tab-btn, [data-filter]');
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
        if (window.AvatarDirector) {
          window.AvatarDirector.onHover(card, 'experience-row');
        }
        if (floatAnimation) {
          floatAnimation.onCardHover(true);
        }
      });

      card.addEventListener('mouseleave', () => {
        hoveredCard = null;
        if (window.AvatarDirector) {
          window.AvatarDirector.onLeave(card);
        }
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
        if (window.AvatarDirector) {
          window.AvatarDirector.onHover(row, 'contact-row');
        }
      });

      row.addEventListener('mouseleave', () => {
        hoveredContactRow = null;
        if (window.AvatarDirector) {
          window.AvatarDirector.onLeave(row);
        }
      });

      row.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          if (window.AvatarDirector) {
            window.AvatarDirector.onClick(link, 'contact-link');
          }
        });
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
      updateDocumentTitle('home');
      return;
    }

    if (hash.startsWith('#esperienze/')) {
      const key = hash.replace('#esperienze/', '').toLowerCase();
      if (EXPERIENCE_DETAILS[key]) {
        const expSec = document.getElementById('esperienze');
        if (expSec) {
          expSec.scrollIntoView({ behavior: 'smooth' });
        }
        openExperienceDetail(key, false);
        updateNavIndicator('esperienze');
        updateDocumentTitle('esperienze');
        return;
      }
    }

    const secId = hash.replace('#', '');
    const targetSec = document.getElementById(secId);
    if (targetSec) {
      if (activeDetailId) {
        closeExperienceDetail(false);
      }
      targetSec.scrollIntoView({ behavior: 'smooth' });
      updateNavIndicator(secId);
      updateDocumentTitle(secId);
    }
  }

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
    document.documentElement.lang = lang;
    safeStorageSet('local', 'coodz_lang', lang);

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

    const skipBtn = document.getElementById('audio-skip-btn');
    if (skipBtn) {
      skipBtn.setAttribute('aria-label', lang === 'it' ? 'Brano successivo' : 'Next track');
    }

    if (window.__coUpdateAudioUI) {
      window.__coUpdateAudioUI();
    }

    // If an experience detail is open, immediately re-render it with new language
    if (activeDetailId) {
      renderExperienceDetail(activeDetailId);
    }

    updateCachedDimensions();
    computeSlotKeyframes();
    fitHeroTitle();
    fitBgWords();
    updateDocumentTitle(activeSectionId);

    setTimeout(() => {
      updateNavIndicator(activeSectionId);
      computeSlotKeyframes();
    }, 50);
  }

  function initSectionObserver() {
    const scrollContainer = document.getElementById('scroll-container');
    const sections = document.querySelectorAll('.snap-section');

    if (!sections.length) return;

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
          updateDocumentTitle(activeSectionId);
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

    updateCachedDimensions();
    updateNavIndicator(activeSectionId);
    fitHeroTitle();
    fitBgWords();
    window.addEventListener('resize', () => {
      updateCachedDimensions();
      updateNavIndicator(activeSectionId);
      if (!isIntroActive) fitHeroTitle();
      fitBgWords();
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
      const mqMobile = window.matchMedia('(max-width: 768px)');
      const updateMenuA11y = (e) => {
        if (e.matches) {
          menuToggleBtn.removeAttribute('tabindex');
          menuToggleBtn.setAttribute('aria-hidden', 'false');
        } else {
          menuToggleBtn.setAttribute('tabindex', '-1');
          menuToggleBtn.setAttribute('aria-hidden', 'true');
        }
      };
      mqMobile.addEventListener('change', updateMenuA11y);
      updateMenuA11y(mqMobile);

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

  function initWebAudioGraph(audioEl) {
    if (webAudioReady && webAudioMasterGain && webAudioCtx) {
      if (webAudioCtx.state === 'suspended') {
        webAudioCtx.resume().catch(() => { });
      }
      return true;
    }
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return false;
      if (!webAudioCtx) {
        webAudioCtx = new AudioCtxClass();
      }
      if (webAudioCtx.state === 'suspended') {
        webAudioCtx.resume().catch(() => { });
      }
      if (!webAudioSource && audioEl) {
        webAudioSource = webAudioCtx.createMediaElementSource(audioEl);
        webAudioCompressor = webAudioCtx.createDynamicsCompressor();
        webAudioCompressor.threshold.setValueAtTime(-18, webAudioCtx.currentTime);
        webAudioCompressor.ratio.setValueAtTime(3, webAudioCtx.currentTime);
        webAudioCompressor.attack.setValueAtTime(0.01, webAudioCtx.currentTime);
        webAudioCompressor.release.setValueAtTime(0.25, webAudioCtx.currentTime);

        webAudioMasterGain = webAudioCtx.createGain();
        const isMuted = audioEl.muted || safeStorageGet('local', 'coodz_muted') === 'true';
        const defaultGain = (CONFIG.AUDIO_VOLUME || 0.9) * (CONFIG.AUDIO_GAIN || 1.4);
        webAudioMasterGain.gain.setValueAtTime(isMuted ? 0 : defaultGain, webAudioCtx.currentTime);

        webAudioSource.connect(webAudioCompressor);
        webAudioCompressor.connect(webAudioMasterGain);
        webAudioMasterGain.connect(webAudioCtx.destination);

        // Music reactive AnalyserNode for AvatarDirector
        try {
          webAudioAnalyser = webAudioCtx.createAnalyser();
          webAudioAnalyser.fftSize = 128;
          webAudioCompressor.connect(webAudioAnalyser);
          if (window.AvatarDirector && typeof window.AvatarDirector.setAudioAnalyser === 'function') {
            window.AvatarDirector.setAudioAnalyser(webAudioAnalyser, webAudioCtx, audioEl);
          }
        } catch (e) {
          if (window.AvatarDebug) console.warn('[Web Audio] AnalyserNode setup error:', e);
        }
        audioEl.volume = 1.0; // Audio element volume at 1.0 so GainNode manages master volume
        webAudioReady = true;
      }
      return true;
    } catch (err) {
      if (window.AvatarDebug) console.warn('[Web Audio] Graph initialization failed, fallback to element.volume:', err);
      webAudioReady = false;
      return false;
    }
  }

  function safePlayAudio(audioEl) {
    if (!audioEl) return Promise.resolve();
    if (webAudioCtx && webAudioCtx.state === 'suspended') {
      webAudioCtx.resume().catch(() => { });
    }
    try {
      const p = audioEl.play();
      if (p !== undefined && typeof p.then === 'function') {
        currentPlayPromise = p;
        return p.then(() => {
          if (currentPlayPromise === p) currentPlayPromise = null;
          audioLastError = null;
        }).catch((err) => {
          if (currentPlayPromise === p) currentPlayPromise = null;
          if (err && err.name === 'AbortError') {
            // Normal interruption when track changes or pauses rapidly
            return;
          }
          audioLastError = err ? (err.message || String(err)) : 'play error';
          if (window.AvatarDebug) console.warn('[Audio] play error:', err);
        });
      }
    } catch (err) {
      audioLastError = err ? (err.message || String(err)) : 'sync play error';
      if (window.AvatarDebug) console.warn('[Audio] sync play error:', err);
    }
    return Promise.resolve();
  }

  function fadeAudioVolume(audioEl, targetVol, duration = 1000, onComplete) {
    if (!audioEl) return;
    const isGraphOk = initWebAudioGraph(audioEl);
    if (isGraphOk && webAudioMasterGain && webAudioCtx) {
      if (webAudioCtx.state === 'suspended') {
        webAudioCtx.resume().catch(() => { });
      }
      const targetGain = targetVol <= 0 ? 0 : targetVol * (CONFIG.AUDIO_GAIN || 1.4);
      const currTime = webAudioCtx.currentTime;
      const durSec = Math.max(0.04, duration / 1000);

      try {
        const curVal = webAudioMasterGain.gain.value;
        webAudioMasterGain.gain.cancelScheduledValues(currTime);
        webAudioMasterGain.gain.setValueAtTime(curVal, currTime);
        webAudioMasterGain.gain.linearRampToValueAtTime(targetGain, currTime + durSec);
      } catch (e) {
        try {
          webAudioMasterGain.gain.setValueAtTime(targetGain, currTime);
        } catch (e2) { }
      }

      if (targetVol > 0) {
        audioEl.muted = false;
        audioEl.volume = 1.0;
      }
      if (onComplete) {
        setTimeout(onComplete, duration);
      }
    } else {
      const startVol = audioEl.volume;
      const startTime = performance.now();
      function step(now) {
        const elapsed = now - startTime;
        const p = Math.min(1, elapsed / Math.max(10, duration));
        audioEl.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * p));
        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          if (targetVol <= 0) audioEl.muted = true;
          if (onComplete) onComplete();
        }
      }
      requestAnimationFrame(step);
    }
  }

  function initAudio() {
    const audio = document.getElementById('bg-audio');
    const muteBtn = document.getElementById('mute-btn');
    const skipBtn = document.getElementById('audio-skip-btn');
    if (!audio) return;

    function loadTrack(index) {
      playlistIndex = ((index % CONFIG.PLAYLIST.length) + CONFIG.PLAYLIST.length) % CONFIG.PLAYLIST.length;
      const track = CONFIG.PLAYLIST[playlistIndex];
      if (!track || !track.src) return;

      const cur = audio.getAttribute('src') || '';
      if (!cur.endsWith(track.src)) {
        audio.src = track.src;
        try {
          audio.load();
        } catch (e) { }
      }
    }

    // Mute preference
    const isMutedPref = safeStorageGet('local', 'coodz_muted') === 'true';
    audio.loop = false;
    audio.muted = isMutedPref;

    // Restore saved audio track index and mute state from sessionStorage if available (always restart from 0:00)
    let wasPlayingBeforeRefresh = false;
    try {
      const savedStateStr = safeStorageGet('session', 'coodz_audio_state');
      if (savedStateStr) {
        const saved = JSON.parse(savedStateStr);
        if (typeof saved.trackIndex === 'number') {
          playlistIndex = ((saved.trackIndex % CONFIG.PLAYLIST.length) + CONFIG.PLAYLIST.length) % CONFIG.PLAYLIST.length;
        }
        if (saved.muted === true) {
          audio.muted = true;
          safeStorageSet('local', 'coodz_muted', 'true');
        } else if (saved.muted === false) {
          audio.muted = false;
          safeStorageSet('local', 'coodz_muted', 'false');
        }
        wasPlayingBeforeRefresh = !!saved.playing;
      }
    } catch (e) { }

    loadTrack(playlistIndex);

    // If user refreshed while playing (and not muted), respect browser autoplay policy and the user interaction gate
    const urlParams = new URLSearchParams(window.location.search);
    const isGateBypassed = urlParams.get('intro') === 'skip' ||
      (window.location.hash && window.location.hash.length > 1) ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    if (wasPlayingBeforeRefresh && !audio.muted) {
      if (isGateBypassed) {
        safePlayAudio(audio).then(() => {
          fadeAudioVolume(audio, CONFIG.AUDIO_VOLUME, 1000);
          updateMuteBtnState();
        }).catch(() => {
          attachMusicStartOnInteraction();
        });
      }
      // If the intro gate is active, playback will begin from 0:00 when the user enters the gate
    }

    updateMuteBtnState = function () {
      if (!muteBtn) return;
      const isMutedNow = audio.muted || safeStorageGet('local', 'coodz_muted') === 'true';
      const isPlaying = !audio.paused && !isMutedNow;
      const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.it;

      const desktopLabel = muteBtn.querySelector('.audio-label-desktop');
      const mobileLabel = muteBtn.querySelector('.audio-label-mobile');

      if (isPlaying) {
        muteBtn.classList.add('playing');
        muteBtn.setAttribute('aria-label', dict.musicAriaMute || 'Disattiva Musica');
        if (desktopLabel) desktopLabel.textContent = dict.musicOn || '[ MUSICA ON ]';
        if (mobileLabel) mobileLabel.textContent = dict.musicOnShort || '[ ON ]';
      } else {
        muteBtn.classList.remove('playing');
        muteBtn.setAttribute('aria-label', dict.musicAriaUnmute || 'Attiva Musica');
        if (desktopLabel) desktopLabel.textContent = dict.musicOff || '[ MUSICA OFF ]';
        if (mobileLabel) mobileLabel.textContent = dict.musicOffShort || '[ OFF ]';
      }
    };

    // Expose for language changes
    window.__coUpdateAudioUI = updateMuteBtnState;

    if (muteBtn) {
      muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        initWebAudioGraph(audio);
        if (webAudioCtx && webAudioCtx.state === 'suspended') {
          webAudioCtx.resume().catch(() => { });
        }
        const isMutedNow = audio.muted || safeStorageGet('local', 'coodz_muted') === 'true';
        if (isMutedNow || audio.paused) {
          audio.muted = false;
          safeStorageSet('local', 'coodz_muted', 'false');
          safePlayAudio(audio).then(() => {
            fadeAudioVolume(audio, CONFIG.AUDIO_VOLUME, 500);
            updateMuteBtnState();
          });
          updateMuteBtnState();
        } else {
          safeStorageSet('local', 'coodz_muted', 'true');
          fadeAudioVolume(audio, 0, 300, () => {
            audio.muted = true;
            updateMuteBtnState();
          });
          updateMuteBtnState();
        }
      });
    }

    function skipNextTrack() {
      if (!audio) return;
      initWebAudioGraph(audio);
      if (webAudioCtx && webAudioCtx.state === 'suspended') {
        webAudioCtx.resume().catch(() => { });
      }

      const isMutedNow = audio.muted || safeStorageGet('local', 'coodz_muted') === 'true';
      const wasPlaying = !audio.paused && !isMutedNow;

      // Increment playlistIndex immediately so rapid clicks advance cleanly
      playlistIndex = (playlistIndex + 1) % CONFIG.PLAYLIST.length;

      if (skipDebounceTimer) {
        clearTimeout(skipDebounceTimer);
        skipDebounceTimer = null;
      }

      if (wasPlaying) {
        fadeAudioVolume(audio, 0, 100);
        skipDebounceTimer = setTimeout(() => {
          skipDebounceTimer = null;
          loadTrack(playlistIndex);
          safePlayAudio(audio).then(() => {
            if (!audio.muted && safeStorageGet('local', 'coodz_muted') !== 'true') {
              fadeAudioVolume(audio, CONFIG.AUDIO_VOLUME, 200);
            }
            updateMuteBtnState();
          });
        }, 110);
      } else {
        loadTrack(playlistIndex);
        if (isMutedNow) audio.muted = true;
        updateMuteBtnState();
      }
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        skipNextTrack();
      });
    }

    // Auto loop playlist: track 1 -> track 2 -> track 3 -> loop
    audio.addEventListener('ended', () => {
      playlistIndex = (playlistIndex + 1) % CONFIG.PLAYLIST.length;
      loadTrack(playlistIndex);
      const isMutedNow = audio.muted || safeStorageGet('local', 'coodz_muted') === 'true';
      if (!isMutedNow) {
        safePlayAudio(audio).then(() => {
          fadeAudioVolume(audio, CONFIG.AUDIO_VOLUME, 800);
          updateMuteBtnState();
        });
      }
    });

    audio.addEventListener('play', updateMuteBtnState);
    audio.addEventListener('pause', updateMuteBtnState);
    audio.addEventListener('volumechange', updateMuteBtnState);

    // Never stop by itself: do NOT pause on tab hidden; resume on visible/pageshow/focus if browser paused it
    function tryResumeAudioPlayback() {
      if (!audio) return;
      const isMutedNow = safeStorageGet('local', 'coodz_muted') === 'true';
      if (isMutedNow) return;
      if (webAudioCtx && webAudioCtx.state === 'suspended') {
        webAudioCtx.resume().catch(() => { });
      }
      if (audio.paused) {
        safePlayAudio(audio).then(() => {
          fadeAudioVolume(audio, CONFIG.AUDIO_VOLUME, 400);
          updateMuteBtnState();
        });
      }
    }

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        tryResumeAudioPlayback();
      }
    });
    window.addEventListener('pageshow', tryResumeAudioPlayback);
    window.addEventListener('focus', tryResumeAudioPlayback);

    // Touch/pointer down unlock for mobile browsers (iOS Safari / Android Chrome)
    function onMobileAudioTouch() {
      if (webAudioCtx && (webAudioCtx.state === 'suspended' || webAudioCtx.state === 'interrupted')) {
        webAudioCtx.resume().catch(() => { });
      }
    }
    window.addEventListener('touchstart', onMobileAudioTouch, { passive: true });
    window.addEventListener('pointerdown', onMobileAudioTouch, { passive: true });

    // SessionStorage state tracking (preserves selected track and play state across refreshes, no timestamp)
    function saveAudioSessionState() {
      if (!audio) return;
      try {
        const isCurrentlyMuted = audio.muted || safeStorageGet('local', 'coodz_muted') === 'true';
        const isCurrentlyPlaying = !audio.paused && !isCurrentlyMuted;

        const state = {
          trackIndex: playlistIndex,
          muted: isCurrentlyMuted,
          playing: isCurrentlyPlaying
        };
        safeStorageSet('session', 'coodz_audio_state', JSON.stringify(state));
      } catch (e) { }
    }

    setInterval(saveAudioSessionState, 1000);
    window.addEventListener('beforeunload', saveAudioSessionState);
    window.addEventListener('pagehide', saveAudioSessionState);

    // Debug readout accessor
    window.__coAudioDebug = {
      getAudio: () => audio,
      getTrackIndex: () => playlistIndex,
      isWebAudioReady: () => webAudioReady,
      getMasterGain: () => (webAudioMasterGain ? webAudioMasterGain.gain.value : null),
      getPendingRestoreTime: () => null
    };

    updateMuteBtnState();
  }

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

  document.addEventListener('DOMContentLoaded', () => {
    initAudio();
    initGateAndIntro();
    initTitleHoverScramble();
    applyBgWordOpacity();
    initAvatar();
    initAvatarInteraction();
    initStars();
    initNavigation();
    initExperienceCards();
    initProofsModal();
    initScrollProgress();
    initKeyboardNav();
    initSectionObserver();

    if (window.AvatarDebug) {
      if (typeof window.AvatarDebug.initDebugHelper === 'function') window.AvatarDebug.initDebugHelper();
      if (typeof window.AvatarDebug.initLayoutAuditOverlay === 'function') window.AvatarDebug.initLayoutAuditOverlay();
    }

    waitForSiteFonts().then(() => {
      if (!isIntroActive) fitHeroTitle();
      computeSlotKeyframes();
      fitBgWords();
    });
  });

})();
