(function() {
  // Clean playlist referencing existing MP3 tracks in /music
  const playlist = [
    'music/Giovani_Re.mp3',
    'music/tiktok.mp3'
  ];

  let audio = document.getElementById('bg-audio');
  let currentTrackIndex = -1;
  let failedAttempts = 0;

  if (!audio) return;
  audio.volume = 0.85;

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

  function playRandomTrack() {
    if (!audio || playlist.length === 0) return;
    let nextIndex;
    if (playlist.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * playlist.length);
      } while (nextIndex === currentTrackIndex && playlist.length > 1);
    } else {
      nextIndex = 0;
    }

    currentTrackIndex = nextIndex;
    audio.src = playlist[currentTrackIndex];

    audio.play().then(() => {
      failedAttempts = 0;
      window.syncAudioUI();
    }).catch(err => {
      failedAttempts++;
      if (failedAttempts < playlist.length * 2) {
        setTimeout(playRandomTrack, 200);
      } else {
        window.syncAudioUI();
      }
    });
  }

  // Silent fallback: Skip to next track if file fetch or play fails
  audio.onerror = () => {
    failedAttempts++;
    if (failedAttempts < playlist.length * 2) {
      playRandomTrack();
    }
  };

  audio.onended = () => playRandomTrack();

  // Cyberpunk Entry Loading Overlay Animation Logic
  const overlay = document.getElementById('entry-overlay');
  const loadingBar = document.getElementById('loading-bar');
  const loadingText = document.getElementById('loading-text');
  const enterText = document.getElementById('enter-text');

  if (sessionStorage.getItem('system_entered')) {
    if (overlay) overlay.remove();
    playRandomTrack();
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
        playRandomTrack();
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 700);
      });
    }
  }

  // Top Navbar Audio Button Event Listener
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('#nav-audio-btn');

    if (navBtn) {
      if (audio.paused) {
        if (!audio.src) playRandomTrack();
        else audio.play().then(() => window.syncAudioUI()).catch(() => playRandomTrack());
      } else {
        audio.pause();
        window.syncAudioUI();
      }
    }
  });

  audio.addEventListener('play', window.syncAudioUI);
  audio.addEventListener('pause', window.syncAudioUI);
})();
