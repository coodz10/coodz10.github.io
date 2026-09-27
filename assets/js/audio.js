(function() {
  // Default fallback track filenames in /music
  let rawTracks = [
    '30C.mp3',
    'dorado.mp3',
    'Grinch3.mp3'
  ];
  let playlist = [];
  let startTrackName = null;
  let isFirstPlay = true;
  let isTransitioning = false;

  let audio = document.getElementById('bg-audio');
  let currentTrackIndex = -1;
  let failedAttempts = 0;

  if (!audio) return;
  audio.volume = 0.85;
  audio.loop = false; // Assicura che l'evento 'ended' scatti alla fine di ogni brano

  // Calcola l'URL assoluto della cartella music per evitare errori 404 durante la navigazione SPA (/ e /servers/)
  function getMusicBaseURL() {
    let path = location.pathname;
    if (path.includes('/servers/')) {
      path = path.split('/servers/')[0] + '/';
    } else {
      path = path.substring(0, path.lastIndexOf('/') + 1);
    }
    return location.origin + path + 'music/';
  }

  function getMusicTrackUrl(trackFilename) {
    if (!trackFilename) return '';
    if (trackFilename.startsWith('http://') || trackFilename.startsWith('https://')) {
      return trackFilename;
    }
    const cleanName = trackFilename.replace(/^music\//, '').replace(/^\//, '');
    if (location.origin && location.origin !== 'null' && location.protocol !== 'file:') {
      return getMusicBaseURL() + cleanName;
    }
    const isSubfolder = location.pathname.includes('/servers/');
    return isSubfolder ? '../music/' + cleanName : 'music/' + cleanName;
  }

  function getPlaylistJsonUrl() {
    if (location.origin && location.origin !== 'null' && location.protocol !== 'file:') {
      return getMusicBaseURL() + 'playlist.json?v=' + Date.now();
    }
    const isSubfolder = location.pathname.includes('/servers/');
    return (isSubfolder ? '../music/playlist.json' : 'music/playlist.json') + '?v=' + Date.now();
  }

  function refreshPlaylistUrls() {
    playlist = rawTracks.map(name => getMusicTrackUrl(name));
  }

  refreshPlaylistUrls();

  // Caricamento robusto di music/playlist.json con tolleranza per virgole finali e anticache
  async function loadPlaylistJSON() {
    try {
      const jsonUrl = getPlaylistJsonUrl();
      const res = await fetch(jsonUrl, { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        const cleanedText = text.replace(/,\s*([\]}])/g, '$1');
        const data = JSON.parse(cleanedText);
        let loadedTracks = [];

        if (Array.isArray(data)) {
          loadedTracks = data;
          startTrackName = null;
        } else if (data && typeof data === 'object') {
          // Se startTrack è stringa non vuota (e non "random"/"none"), salvala; altrimenti null (scelta random)
          if (typeof data.startTrack === 'string') {
            const clean = data.startTrack.trim();
            if (clean !== '' && clean.toLowerCase() !== 'random' && clean.toLowerCase() !== 'none') {
              startTrackName = clean;
            } else {
              startTrackName = null;
            }
          } else {
            startTrackName = null;
          }
          if (Array.isArray(data.tracks)) loadedTracks = data.tracks;
        }

        if (loadedTracks.length > 0) {
          rawTracks = loadedTracks.map(t => t.replace(/^music\//, '').replace(/^\//, ''));
          refreshPlaylistUrls();
        }
      }
    } catch (err) {
      // Fallback silenzioso alla playlist di riserva se il parsing del JSON fallisce
    }
  }

  // Precarica la playlist all'avvio
  loadPlaylistJSON();

  window.syncAudioUI = function() {
    const navOn = document.getElementById('nav-audio-on');
    const navOff = document.getElementById('nav-audio-off');
    const navBtn = document.getElementById('nav-audio-btn');

    const isPlaying = audio && !audio.paused && !audio.muted;

    if (navOn && navOff) {
      if (isPlaying) {
        navOn.classList.remove('hidden');
        navOff.classList.add('hidden');
        if (navBtn) navBtn.classList.add('border-[var(--cyan)]', 'text-[var(--cyan)]', 'shadow-[0_0_12px_rgba(79,209,255,0.4)]');
      } else {
        navOn.classList.add('hidden');
        navOff.classList.remove('hidden');
        if (navBtn) navBtn.classList.remove('border-[var(--cyan)]', 'text-[var(--cyan)]', 'shadow-[0_0_12px_rgba(79,209,255,0.4)]');
      }
    }
  };

  async function playNextTrack(forceRandom = false) {
    if (!audio) return;
    if (isTransitioning) return;
    isTransitioning = true;

    try {
      if (currentTrackIndex === -1 || playlist.length === 0) {
        await loadPlaylistJSON();
      }
      if (playlist.length === 0) {
        isTransitioning = false;
        return;
      }

      let nextIndex = -1;

      // Se è il primo avvio e startTrack è specificato, seleziona quel brano
      if (isFirstPlay && !forceRandom && startTrackName) {
        const cleanStart = startTrackName.replace(/^music\//, '').replace(/^\//, '').toLowerCase();
        const foundIdx = rawTracks.findIndex(p => p.toLowerCase().endsWith(cleanStart));
        if (foundIdx !== -1) {
          nextIndex = foundIdx;
        }
      }
      isFirstPlay = false;

      // Se startTrack è vuoto (""), non specificato o per le tracce successive: sceglie casualmente
      if (nextIndex === -1) {
        if (playlist.length > 1) {
          do {
            nextIndex = Math.floor(Math.random() * playlist.length);
          } while (nextIndex === currentTrackIndex && playlist.length > 1);
        } else {
          nextIndex = 0;
        }
      }

      currentTrackIndex = nextIndex;
      const targetSrc = playlist[currentTrackIndex];

      // Reset pulito della sorgente audio prima di avviare il nuovo brano
      audio.pause();
      audio.src = targetSrc;
      audio.load();

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          failedAttempts = 0;
          isTransitioning = false;
          window.syncAudioUI();
        }).catch(err => {
          isTransitioning = false;
          failedAttempts++;
          if (failedAttempts < playlist.length * 2) {
            setTimeout(() => playNextTrack(true), 300);
          } else {
            window.syncAudioUI();
          }
        });
      } else {
        isTransitioning = false;
        window.syncAudioUI();
      }
    } catch (e) {
      isTransitioning = false;
    }
  }

  // Quando un brano finisce, avvia subito il brano successivo
  audio.addEventListener('ended', () => {
    isTransitioning = false;
    failedAttempts = 0;
    playNextTrack(true);
  });

  // Fallback in caso di errore di caricamento del file audio
  audio.addEventListener('error', () => {
    if (audio.src && !isTransitioning) {
      failedAttempts++;
      if (failedAttempts < playlist.length * 2) {
        setTimeout(() => playNextTrack(true), 300);
      }
    }
  });

  // Cyberpunk Entry Loading Overlay Animation Logic
  const overlay = document.getElementById('entry-overlay');
  const loadingBar = document.getElementById('loading-bar');
  const loadingText = document.getElementById('loading-text');
  const enterText = document.getElementById('enter-text');

  if (sessionStorage.getItem('system_entered')) {
    if (overlay) overlay.remove();
    playNextTrack();
  } else {
    audio.pause();

    setTimeout(() => { if (loadingBar) loadingBar.style.width = '50%'; }, 200);
    setTimeout(() => {
      if (loadingBar) loadingBar.style.width = '100%';
      if (loadingText) loadingText.textContent = 'LOADING_COMPLETE';
    }, 800);
    setTimeout(() => {
      if (loadingText) loadingText.textContent = 'SYSTEM_READY';
      if (enterText) enterText.classList.remove('hidden');
    }, 1200);

    if (overlay) {
      overlay.addEventListener('click', () => {
        sessionStorage.setItem('system_entered', 'true');
        failedAttempts = 0;
        playNextTrack();
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 700);
      });
    }
  }

  // Top Navbar Audio Buttons Event Listener (Play/Pause & Salta al brano successivo)
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('#nav-audio-btn');
    const navNext = e.target.closest('#nav-audio-next');

    if (navNext) {
      isTransitioning = false;
      failedAttempts = 0;
      playNextTrack(true);
      return;
    }

    if (navBtn) {
      failedAttempts = 0;
      if (audio.paused) {
        if (!audio.src) {
          playNextTrack();
        } else {
          audio.play().then(() => window.syncAudioUI()).catch(() => {
            isTransitioning = false;
            playNextTrack(true);
          });
        }
      } else {
        audio.pause();
        window.syncAudioUI();
      }
    }
  });

  audio.addEventListener('play', window.syncAudioUI);
  audio.addEventListener('pause', window.syncAudioUI);
})();
