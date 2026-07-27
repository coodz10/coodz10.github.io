import glob
import re

html_files = glob.glob('*.html')

# Persistent Audio Script & Hidden Audio Element
audio_script_and_element = """
  <audio id="bg-audio" preload="auto"></audio>

  <script>
    // Rock-Solid Audio Controller (Persistent Navbar Button)
    (function() {
      const playlist = [
        'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3', // Lofi Chill Ambient
        'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3', // Lofi Night Drive
        'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c41e8f237f.mp3', // Cyber Lofi Beats
        'music.mp3',
        'music/track1.mp3',
        'music/track2.mp3'
      ];

      let audio = document.getElementById('bg-audio');
      let currentTrackIndex = -1;

      if (!audio) return;
      audio.volume = 0.35;

      window.updateAudioIcon = function() {
        const audioOn = document.getElementById('nav-audio-on');
        const audioOff = document.getElementById('nav-audio-off');
        const btn = document.getElementById('nav-audio-btn');

        if (!audioOn || !audioOff || !btn) return;

        if (audio && !audio.paused) {
          audioOn.classList.remove('hidden');
          audioOff.classList.add('hidden');
          btn.classList.add('border-[var(--cyan)]', 'text-[var(--cyan)]', 'shadow-[0_0_12px_rgba(79,209,255,0.4)]');
          btn.classList.remove('opacity-60');
        } else {
          audioOn.classList.add('hidden');
          audioOff.classList.remove('hidden');
          btn.classList.remove('border-[var(--cyan)]', 'text-[var(--cyan)]', 'shadow-[0_0_12px_rgba(79,209,255,0.4)]');
          btn.classList.add('opacity-60');
        }
      };

      function playRandomTrack() {
        if (!audio) return;
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
          window.updateAudioIcon();
        }).catch(err => {
          window.updateAudioIcon();
        });
      }

      // Start playing music
      playRandomTrack();

      // Trigger playback on first user click if browser prevented immediate unmuted play
      const tryAutoPlay = () => {
        if (audio && audio.paused) {
          if (!audio.src) playRandomTrack();
          else audio.play().then(() => window.updateAudioIcon()).catch(() => {});
        }
      };

      document.addEventListener('click', tryAutoPlay);
      document.addEventListener('touchstart', tryAutoPlay);

      // Auto play next random song on end
      audio.onended = () => {
        playRandomTrack();
      };

      // Navbar Audio Toggle Button Event Listener
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('#nav-audio-btn');
        if (!btn) return;

        if (audio.paused) {
          if (!audio.src) {
            playRandomTrack();
          } else {
            audio.play().then(() => window.updateAudioIcon()).catch(() => playRandomTrack());
          }
        } else {
          audio.pause();
          window.updateAudioIcon();
        }
      });

      // Keep state in sync
      audio.addEventListener('play', window.updateAudioIcon);
      audio.addEventListener('pause', window.updateAudioIcon);
    })();

    // SPA Router: Only replaces <main> so <nav> and the Audio Button NEVER flicker or disappear
    document.addEventListener('click', async (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || !href.endsWith('.html')) return;

      e.preventDefault();
      await loadPage(href);
      history.pushState({ path: href }, '', href);
    });

    window.addEventListener('popstate', async (e) => {
      const path = e.state?.path || location.pathname.split('/').pop() || 'index.html';
      await loadPage(path);
    });

    async function loadPage(href) {
      try {
        const res = await fetch(href);
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        document.title = doc.title;

        // Replace only main content so navigation and audio button stay completely intact
        const currentMain = document.querySelector('main');
        const newMain = doc.querySelector('main');
        if (currentMain && newMain) currentMain.replaceWith(newMain);

        // Update Nav Active Link styling without destroying navbar
        const currentNavLinks = document.querySelectorAll('nav a');
        currentNavLinks.forEach(a => {
          const aHref = a.getAttribute('href');
          if (aHref === href) {
            a.className = 'text-white transition-colors';
          } else {
            a.className = 'hover:text-white transition-colors text-[var(--ink-dim)]';
          }
        });

        if (typeof setLanguage === 'function') {
          setLanguage(localStorage.getItem('lang') || 'it');
        }

        if (typeof window.updateAudioIcon === 'function') {
          window.updateAudioIcon();
        }

        window.scrollTo(0, 0);
      } catch (err) {
        window.location.href = href;
      }
    }
  </script>
</body>
"""

nav_button_html = """        <button onclick="setLanguage('en')" id="lang-btn-en" class="text-[var(--ink-dim)] hover:text-white transition-colors">&bull; EN</button>
        <button id="nav-audio-btn" aria-label="Attiva o Disattiva Musica" title="Attiva o Disattiva Musica" class="flex items-center justify-center p-1.5 rounded-lg border border-[var(--cyan)] bg-[rgba(124,108,240,.15)] text-[var(--cyan)] hover:bg-[rgba(124,108,240,.3)] hover:scale-105 transition-all ml-2 shadow-[0_0_12px_rgba(79,209,255,0.4)] cursor-pointer">
          <svg id="nav-audio-on" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          <svg id="nav-audio-off" class="w-4 h-4 hidden text-[var(--ink-dim)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon></svg>
        </button>"""

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Clean previous audio scripts
    content = re.sub(r'<!-- ENTRY OVERLAY.*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)
    content = re.sub(r'<!-- CUSTOM AUDIO PLAYER CONTAINER.*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)
    content = re.sub(r'<!-- CUSTOM SHUFFLE AUDIO PLAYER CONTAINER.*.*?</body>', '</body>', content, flags=re.DOTALL)
    content = re.sub(r'<!-- SPOTIFY PLAYER.*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)
    content = re.sub(r'<audio id="bg-audio".*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)

    if 'id="nav-audio-btn"' not in content:
        content = content.replace('<button onclick="setLanguage(\'en\')" id="lang-btn-en" class="text-[var(--ink-dim)] hover:text-white transition-colors">&bull; EN</button>', nav_button_html)

    if '</body>' in content:
        content = content.replace('</body>', audio_script_and_element)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Successfully fixed persistent navbar audio button in {file}")
