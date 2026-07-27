import glob
import re
import os

html_files = glob.glob('*.html')

# Find local MP3 files in workspace
local_mp3s = []
for file in glob.glob('music/*.mp3'):
    local_mp3s.append(file.replace('\\', '/'))
for file in glob.glob('*.mp3'):
    local_mp3s.append(file.replace('\\', '/'))

default_names = [
    'music/Giovani_Re.mp3',
    'music/tiktok.mp3',
    'music/doppio_hublot.mp3',
    'music/peace_and_love.mp3',
    'music/popstar.mp3',
    'music.mp3'
]

combined_playlist = list(dict.fromkeys(local_mp3s + default_names))
playlist_js_array = str(combined_playlist)

overlay_and_player_html = f"""
  <!-- CYBERPUNK ENTRY OVERLAY (LOADING SCREEN) -->
  <div id="entry-overlay" class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0b0a1a] transition-opacity duration-700 select-none cyberpunk-overlay-bg">
    <div class="text-center max-w-md px-6 flex flex-col items-center">
      
      <!-- LOGO / TITLE -->
      <h1 class="text-4xl sm:text-5xl font-extrabold text-white glow tracking-tighter mb-8">coodz_10</h1>
      
      <!-- LOADING STATUS -->
      <div class="mono text-[var(--cyan)] text-xs sm:text-sm mb-4 tracking-[0.25em] uppercase font-bold" id="loading-text">INITIALIZING_SYSTEM...</div>
      
      <!-- GLOWING PROGRESS BAR -->
      <div class="w-64 sm:w-72 h-1.5 bg-[rgba(124,108,240,.2)] rounded-full overflow-hidden relative mb-8 border border-[rgba(124,108,240,.35)] shadow-[0_0_15px_rgba(124,108,240,.2)]">
        <div id="loading-bar" class="absolute top-0 left-0 h-full w-0 bg-gradient-to-r from-[var(--violet)] to-[var(--cyan)] transition-all duration-1000"></div>
      </div>
      
      <!-- CLICK TO ENTER BUTTON (HIDDEN DURING LOADING) -->
      <div id="enter-text" class="hidden text-sm sm:text-base text-white glow tracking-[0.2em] cursor-pointer font-bold uppercase py-4 px-8 rounded-xl border border-[rgba(79,209,255,.6)] bg-[rgba(11,10,26,.9)] hover:bg-[rgba(124,108,240,.3)] hover:scale-105 transition-all shadow-[0_0_25px_rgba(79,209,255,0.4)] animate-pulse">
        [ CLICK ANYWHERE TO ENTER ]
      </div>
    </div>
  </div>

  <audio id="bg-audio" preload="auto"></audio>

  <script>
    // Global Clean Audio & Loading Controller (Only Top Navbar Button)
    (function() {{
      const playlist = {playlist_js_array};

      let audio = document.getElementById('bg-audio');
      let currentTrackIndex = -1;

      if (!audio) return;
      audio.volume = 0.85;

      window.syncAudioUI = function() {{
        const navOn = document.getElementById('nav-audio-on');
        const navOff = document.getElementById('nav-audio-off');
        const navBtn = document.getElementById('nav-audio-btn');

        const isPlaying = audio && !audio.paused && !audio.muted;

        if (navOn && navOff) {{
          if (isPlaying) {{
            navOn.classList.remove('hidden');
            navOff.classList.add('hidden');
            if (navBtn) navBtn.classList.add('border-[var(--cyan)]', 'text-[var(--cyan)]', 'shadow-[0_0_12px_rgba(79,209,255,0.4)]');
          }} else {{
            navOn.classList.add('hidden');
            navOff.classList.remove('hidden');
            if (navBtn) navBtn.classList.remove('border-[var(--cyan)]', 'text-[var(--cyan)]', 'shadow-[0_0_12px_rgba(79,209,255,0.4)]');
          }}
        }}
      }};

      function playRandomTrack() {{
        if (!audio || playlist.length === 0) return;
        let nextIndex;
        if (playlist.length > 1) {{
          do {{
            nextIndex = Math.floor(Math.random() * playlist.length);
          }} while (nextIndex === currentTrackIndex && playlist.length > 1);
        }} else {{
          nextIndex = 0;
        }}

        currentTrackIndex = nextIndex;
        audio.src = playlist[currentTrackIndex];

        audio.play().then(() => {{
          window.syncAudioUI();
        }}).catch(err => {{
          if (playlist.length > 1) {{
            setTimeout(playRandomTrack, 300);
          }} else {{
            window.syncAudioUI();
          }}
        }});
      }}

      audio.onended = () => playRandomTrack();

      // Loading Animation Logic
      const overlay = document.getElementById('entry-overlay');
      const loadingBar = document.getElementById('loading-bar');
      const loadingText = document.getElementById('loading-text');
      const enterText = document.getElementById('enter-text');

      if (sessionStorage.getItem('system_entered')) {{
        if (overlay) overlay.remove();
        playRandomTrack();
      }} else {{
        audio.pause();

        setTimeout(() => {{ if (loadingBar) loadingBar.style.width = '50%'; }}, 200);
        setTimeout(() => {{
          if (loadingBar) loadingBar.style.width = '100%';
          if (loadingText) loadingText.textContent = 'LOADING_COMPLETE';
        }}, 800);
        setTimeout(() => {{
          if (loadingText) loadingText.textContent = 'SYSTEM_READY';
          if (enterText) enterText.classList.remove('hidden');
        }}, 1200);

        if (overlay) {{
          overlay.addEventListener('click', () => {{
            sessionStorage.setItem('system_entered', 'true');
            playRandomTrack();
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 700);
          }});
        }}
      }}

      // Top Navbar Audio Button Listener
      document.addEventListener('click', (e) => {{
        const navBtn = e.target.closest('#nav-audio-btn');

        if (navBtn) {{
          if (audio.paused) {{
            if (!audio.src) playRandomTrack();
            else audio.play().then(() => window.syncAudioUI()).catch(() => playRandomTrack());
          }} else {{
            audio.pause();
            window.syncAudioUI();
          }}
        }}
      }});

      audio.addEventListener('play', window.syncAudioUI);
      audio.addEventListener('pause', window.syncAudioUI);
    }})();

    // SPA Router: Replaces only <main> so Nav and Audio Button stay completely persistent
    document.addEventListener('click', async (e) => {{
      const link = e.target.closest('a');
      if (!link) return;
      
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || !href.endsWith('.html')) return;

      e.preventDefault();
      await loadPage(href);
      history.pushState({{ path: href }}, '', href);
    }});

    window.addEventListener('popstate', async (e) => {{
      const path = e.state?.path || location.pathname.split('/').pop() || 'index.html';
      await loadPage(path);
    }});

    async function loadPage(href) {{
      try {{
        const res = await fetch(href);
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        document.title = doc.title;

        const currentMain = document.querySelector('main');
        const newMain = doc.querySelector('main');
        if (currentMain && newMain) currentMain.replaceWith(newMain);

        const currentNavLinks = document.querySelectorAll('nav a');
        currentNavLinks.forEach(a => {{
          const aHref = a.getAttribute('href');
          if (aHref === href) {{
            a.className = 'text-white transition-colors';
          }} else {{
            a.className = 'hover:text-white transition-colors text-[var(--ink-dim)]';
          }}
        }});

        if (typeof setLanguage === 'function') {{
          setLanguage(localStorage.getItem('lang') || 'it');
        }}

        if (typeof window.syncAudioUI === 'function') {{
          window.syncAudioUI();
        }}

        window.scrollTo(0, 0);
      }} catch (err) {{
        window.location.href = href;
      }}
    }}
  </script>
</body>
"""

nav_button_html = """        <button onclick="setLanguage('en')" id="lang-btn-en" class="text-[var(--ink-dim)] hover:text-white transition-colors">&bull; EN</button>
        <button id="nav-audio-btn" aria-label="Attiva o Disattiva Musica" title="Attiva o Disattiva Musica" class="flex items-center justify-center p-1.5 rounded-lg border border-[var(--cyan)] bg-[rgba(124,108,240,.15)] text-[var(--cyan)] hover:bg-[rgba(124,108,240,.3)] hover:scale-105 transition-all ml-2 shadow-[0_0_12px_rgba(79,209,255,0.4)] cursor-pointer">
          <svg id="nav-audio-on" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          <svg id="nav-audio-off" class="w-4 h-4 hidden text-[var(--ink-dim)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon></svg>
        </button>"""

css_overlay_rule = """
  .cyberpunk-overlay-bg {
    background: linear-gradient(-45deg, #0b0a1a, #150f2d, #0b0a1a, #0c1a2f);
    background-size: 400% 400%;
    animation: gradientBG 15s ease infinite;
  }
"""

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Inject CSS class rule inside <style>
    if '.cyberpunk-overlay-bg' not in content and '</style>' in content:
        content = content.replace('</style>', css_overlay_rule + '</style>')

    # Clean all previous scripts
    content = re.sub(r'<!-- CYBERPUNK ENTRY OVERLAY.*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)
    content = re.sub(r'<!-- ENTRY OVERLAY.*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)
    content = re.sub(r'<!-- CUSTOM AUDIO PLAYER CONTAINER.*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)
    content = re.sub(r'<!-- PERSISTENT AUDIO CONTROL WIDGET.*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)
    content = re.sub(r'<!-- CUSTOM SHUFFLE AUDIO PLAYER CONTAINER.*.*?</body>', '</body>', content, flags=re.DOTALL)
    content = re.sub(r'<!-- SPOTIFY PLAYER.*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)
    content = re.sub(r'<audio id="bg-audio".*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)

    if 'id="nav-audio-btn"' not in content:
        content = content.replace('<button onclick="setLanguage(\'en\')" id="lang-btn-en" class="text-[var(--ink-dim)] hover:text-white transition-colors">&bull; EN</button>', nav_button_html)

    if '</body>' in content:
        content = content.replace('</body>', overlay_and_player_html)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Successfully cleaned inline CSS warning in {file}")
