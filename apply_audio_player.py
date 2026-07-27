import glob
import re

html_files = glob.glob('*.html')

# Minimal Audio Script & Hidden Audio Element
audio_script_and_element = """
  <audio id="bg-audio"></audio>

  <script>
    // Global Minimal Audio Controller
    (function() {
      const playlist = [
        'music.mp3',
        'music1.mp3',
        'music2.mp3',
        'music3.mp3',
        'music4.mp3',
        'music5.mp3',
        'music/track1.mp3',
        'music/track2.mp3',
        'music/track3.mp3',
        'music/track4.mp3',
        'music/track5.mp3',
        'music/tik_tok.mp3',
        'music/peace_and_love.mp3',
        'music/doppio_hublot.mp3',
        'music/giovani_re.mp3',
        'music/popstar.mp3'
      ];

      let audio = document.getElementById('bg-audio');
      let currentTrackIndex = -1;
      let failedAttempts = 0;

      if (!audio) return;
      audio.volume = 0.4;

      function updateNavAudioUI(isPlaying) {
        const audioOn = document.getElementById('nav-audio-on');
        const audioOff = document.getElementById('nav-audio-off');
        const btn = document.getElementById('nav-audio-btn');

        if (!audioOn || !audioOff) return;

        if (isPlaying) {
          audioOn.classList.remove('hidden');
          audioOff.classList.add('hidden');
          if (btn) {
            btn.classList.add('border-[var(--cyan)]', 'shadow-[0_0_12px_rgba(79,209,255,0.4)]');
            btn.classList.remove('opacity-60');
          }
        } else {
          audioOn.classList.add('hidden');
          audioOff.classList.remove('hidden');
          if (btn) {
            btn.classList.remove('border-[var(--cyan)]', 'shadow-[0_0_12px_rgba(79,209,255,0.4)]');
            btn.classList.add('opacity-60');
          }
        }
      }

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
          failedAttempts = 0;
          updateNavAudioUI(true);
        }).catch(err => {
          failedAttempts++;
          if (failedAttempts >= 3) {
            audio.src = 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3';
            audio.play().then(() => updateNavAudioUI(true)).catch(() => updateNavAudioUI(false));
          } else {
            setTimeout(playRandomTrack, 200);
          }
        });
      }

      audio.onended = () => {
        playRandomTrack();
      };

      document.addEventListener('click', (e) => {
        const btn = e.target.closest('#nav-audio-btn');
        if (!btn) return;

        if (audio.paused) {
          if (!audio.src) {
            playRandomTrack();
          } else {
            audio.play().then(() => updateNavAudioUI(true)).catch(() => playRandomTrack());
          }
        } else {
          audio.pause();
          updateNavAudioUI(false);
        }
      });

      // Maintain UI state on page updates
      setInterval(() => {
        if (audio && !audio.paused) {
          updateNavAudioUI(true);
        }
      }, 500);
    })();

    // SPA Router: Keeps music playing smoothly without restart on page navigation
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

        const currentMain = document.querySelector('main');
        const newMain = doc.querySelector('main');
        if (currentMain && newMain) currentMain.replaceWith(newMain);

        const currentNav = document.querySelector('nav');
        const newNav = doc.querySelector('nav');
        if (currentNav && newNav) currentNav.replaceWith(newNav);

        if (typeof setLanguage === 'function') {
          setLanguage(localStorage.getItem('lang') || 'it');
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
        <button id="nav-audio-btn" aria-label="Attiva o Disattiva Musica" title="Attiva o Disattiva Musica" class="flex items-center justify-center p-1.5 rounded-lg border border-[rgba(124,108,240,.4)] bg-[rgba(124,108,240,.15)] text-[var(--cyan)] hover:bg-[rgba(124,108,240,.3)] hover:scale-105 transition-all ml-2 opacity-60">
          <svg id="nav-audio-on" class="w-4 h-4 hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          <svg id="nav-audio-off" class="w-4 h-4 text-[var(--ink-dim)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon></svg>
        </button>"""

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove previous overlay and floating bottom audio player widgets
    content = re.sub(r'<!-- ENTRY OVERLAY.*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)
    content = re.sub(r'<!-- CUSTOM AUDIO PLAYER CONTAINER.*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)
    content = re.sub(r'<!-- CUSTOM SHUFFLE AUDIO PLAYER CONTAINER.*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)
    content = re.sub(r'<!-- SPOTIFY PLAYER.*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)

    # Insert minimal speaker button into top nav if not present
    if 'id="nav-audio-btn"' not in content:
        content = content.replace('<button onclick="setLanguage(\'en\')" id="lang-btn-en" class="text-[var(--ink-dim)] hover:text-white transition-colors">&bull; EN</button>', nav_button_html)

    if '</body>' in content:
        content = content.replace('</body>', audio_script_and_element)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Successfully updated minimal top audio button in {file}")
