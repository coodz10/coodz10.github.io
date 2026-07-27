(function() {
  // Default playlist fallback
  let playlist = [
    'music/Giovani_Re.mp3',
    'music/tiktok.mp3'
  ];
  let startTrackName = null;
  let isFirstPlay = true;

  let audio = document.getElementById('bg-audio');
  let currentTrackIndex = -1;
  let failedAttempts = 0;

  if (!audio) return;
  audio.volume = 0.85;

  // Robust load for music/playlist.json with trailing comma tolerance
  async function loadPlaylistJSON() {
    try {
      const isSubfolder = location.pathname.includes('/servers/');
      const jsonPath = isSubfolder ? '../music/playlist.json' : 'music/playlist.json';
      const res = await fetch(jsonPath);
      if (res.ok) {
        const text = await res.text();
        // Remove trailing commas automatically so minor JSON typos don't break playback
        const cleanedText = text.replace(/,\s*([\]}])/g, '$1');
        const data = JSON.parse(cleanedText);
        let rawTracks = [];

        if (Array.isArray(data)) {
          rawTracks = data;
        } else if (data && typeof data === 'object') {
          if (data.startTrack) startTrackName = data.startTrack;
          if (Array.isArray(data.tracks)) rawTracks = data.tracks;
        }

        if (rawTracks.length > 0) {
          playlist = rawTracks.map(track => {
            if (track.startsWith('http') || track.startsWith('/')) return track;
            const cleanName = track.replace(/^music\//, '').replace(/^\//, '');
            return isSubfolder ? '../music/' + cleanName : 'music/' + cleanName;
          });
        }
      }
    } catch (err) {
      // Silent fallback to default list if JSON parse fails
    }
  }

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
    if (currentTrackIndex === -1) {
      await loadPlaylistJSON();
    }
    if (playlist.length === 0) return;

    let nextIndex = -1;

    // Support startTrack for initial play
    if (isFirstPlay && !forceRandom && startTrackName) {
      const cleanStart = startTrackName.replace(/^music\//, '').replace(/^\//, '').toLowerCase();
      const foundIdx = playlist.findIndex(p => p.toLowerCase().endsWith(cleanStart));
      if (foundIdx !== -1) {
        nextIndex = foundIdx;
      }
    }
    isFirstPlay = false;

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
    audio.src = playlist[currentTrackIndex];

    audio.play().then(() => {
      failedAttempts = 0;
      window.syncAudioUI();
    }).catch(err => {
      failedAttempts++;
      if (failedAttempts < playlist.length * 2) {
        setTimeout(() => playNextTrack(true), 200);
      } else {
        window.syncAudioUI();
      }
    });
  }

  // Silent fallback: Skip to next track if file fetch or play fails
  audio.onerror = () => {
    failedAttempts++;
    if (failedAttempts < playlist.length * 2) {
      playNextTrack(true);
    }
  };

  audio.onended = () => playNextTrack(true);

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
        playNextTrack();
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 700);
      });
    }
  }

  // Top Navbar Audio Buttons Event Listener (Play/Pause & Skip Next Track)
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('#nav-audio-btn');
    const navNext = e.target.closest('#nav-audio-next');

    if (navNext) {
      playNextTrack(true);
      return;
    }

    if (navBtn) {
      if (audio.paused) {
        if (!audio.src) playNextTrack();
        else audio.play().then(() => window.syncAudioUI()).catch(() => playNextTrack());
      } else {
        audio.pause();
        window.syncAudioUI();
      }
    }
  });

  audio.addEventListener('play', window.syncAudioUI);
  audio.addEventListener('pause', window.syncAudioUI);
})();
