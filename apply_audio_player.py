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

print(f"Playlist for player: {combined_playlist}")

overlay_and_player_html = f"""
  <!-- CYBERPUNK ENTRY OVERLAY (LOADING SCREEN) -->
  <div id="entry-overlay" class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0b0a1a] transition-opacity duration-700 select-none" style="background: linear-gradient(-45deg, #0b0a1a, #150f2d, #0b0a1a, #0c1a2f); background-size: 400% 400%; animation: gradientBG 15s ease infinite;">
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

  <!-- PERSISTENT AUDIO CONTROL WIDGET (BOTTOM RIGHT) -->
  <div id="audio-widget-container" class="fixed bottom-5 right-5 z-40">
    <div class="flex items-center gap-3 px-4 py-3 bg-[rgba(11,10,26,.88)] border border-[rgba(124,108,240,.4)] backdrop-blur-md rounded-xl shadow-[0_0_25px_rgba(124,108,240,.3)] mono text-xs select-none">
      
      <!-- PLAY / PAUSE BUTTON -->
      <button id="widget-toggle-btn" aria-label="Riproduci o Metti in Pausa" title="Riproduci o Metti in Pausa" class="flex items-center justify-center w-9 h-9 rounded-lg bg-[rgba(124,108,240,.2)] border border-[rgba(124,108,240,.4)] text-[var(--cyan)] hover:bg-[rgba(124,108,240,.4)] hover:scale-105 transition-all cursor-pointer">
        <svg id="widget-play-icon" class="w-4 h-4 hidden" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        <svg id="widget-pause-icon" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
      </button>

      <!-- NEXT TRACK BUTTON (RANDOM SHUFFLE) -->
      <button id="widget-next-btn" aria-label="Prossima Canzone" title="Prossima Canzone" class="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgba(124,108,240,.15)] border border-[rgba(124,108,240,.3)] text-[var(--ink-dim)] hover:text-white hover:bg-[rgba(124,108,240,.3)] transition-all cursor-pointer">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
      </button>

      <!-- TRACK INFO -->
      <div class="flex flex-col max-w-[120px] overflow-hidden">
        <span id="widget-track-name" class="text-white font-bold tracking-wider text-[11px] truncate">coodz_10 // SHUFFLE</span>
        <span id="widget-status" class="text-[var(--cyan)] text-[10px] tracking-widest uppercase">PLAYING</span>
      </div>

      <!-- EQUALIZER ANIMATION -->
      <div class="flex items-end gap-1 h-4 px-1" id="widget-eq-bars">
        <span class="w-1 bg-[var(--cyan)] rounded-full animate-[eq_0.8s_ease-in-out_infinite_alternate] h-[60%]"></span>
        <span class="w-1 bg-[var(--violet)] rounded-full animate-[eq_0.6s_ease-in-out_infinite_alternate_0.2s] h-full"></span>
        <span class="w-1 bg-[var(--cyan)] rounded-full animate-[eq_0.7s_ease-in-out_infinite_alternate_0.4s] h-[40%]"></span>
      </div>

      <!-- MUTE / UNMUTE TOGGLE BUTTON -->
      <button id="widget-mute-btn" aria-label="Disattiva o Attiva Audio" title="Disattiva o Attiva Audio" class="text-[var(--ink-dim)] hover:text-white transition-colors ml-1 cursor-pointer">
        <svg id="widget-vol-on" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        <svg id="widget-vol-off" class="w-4 h-4 hidden text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon></svg>
      </button>

    </div>
  </div>

  <audio id="bg-audio" preload="auto"></audio>

  <script>
    // Inject Equalizer Keyframe Animations
    if (!document.getElementById('eq-styles')) {{
      const style = document.createElement('style');
      style.id = 'eq-styles';
      style.textContent = `@keyframes eq {{ 0% {{ height: 20%; }} 100% {{ height: 100%; }} }}`;
      document.head.appendChild(style);
    }}

    // Global Audio & Loading Controller
    (function() {{
      const playlist = {playlist_js_array};

      let audio = document.getElementById('bg-audio');
      let currentTrackIndex = -1;

      if (!audio) return;
      // High volume as requested
      audio.volume = 0.85;

      window.syncAudioUI = function() {{
        const playIcon = document.getElementById('widget-play-icon');
        const pauseIcon = document.getElementById('widget-pause-icon');
        const eqBars = document.getElementById('widget-eq-bars');
        const statusText = document.getElementById('widget-status');
        const volOn = document.getElementById('widget-vol-on');
        const volOff = document.getElementById('widget-vol-off');

        const navOn = document.getElementById('nav-audio-on');
        const navOff = document.getElementById('nav-audio-off');
        const navBtn = document.getElementById('nav-audio-btn');

        const isPlaying = audio && !audio.paused && !audio.muted;

        if (playIcon && pauseIcon) {{
          if (isPlaying) {{
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
          }} else {{
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
          }}
        }}

        if (eqBars) {{
          if (isPlaying) eqBars.classList.remove('opacity-20');
          else eqBars.classList.add('opacity-20');
        }}

        if (statusText) {{
          statusText.textContent = isPlaying ? 'PLAYING' : 'PAUSED';
        }}

        if (volOn && volOff) {{
          if (audio.muted) {{
            volOn.classList.add('hidden');
            volOff.classList.remove('hidden');
          }} else {{
            volOn.classList.remove('hidden');
            volOff.classList.add('hidden');
          }}
        }}

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
        const trackPath = playlist[currentTrackIndex];
        audio.src = trackPath;

        const trackNameEl = document.getElementById('widget-track-name');
        if (trackNameEl) {{
          const cleanName = trackPath.split('/').pop().replace(/\.mp3$/i, '').replace(/_/g, ' ').toUpperCase();
          trackNameEl.textContent = cleanName;
        }}

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
        // Music plays on enter if user already entered session
        playRandomTrack();
      }} else {{
        // Music remains SILENT during loading animation
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
            // MUSIC STARTS ONLY WHEN USER CLICKS TO ENTER
            playRandomTrack();
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 700);
          }});
        }}
      }}

      // Widget Button Listeners
      document.addEventListener('click', (e) => {{
        const toggleBtn = e.target.closest('#widget-toggle-btn');
        const nextBtn = e.target.closest('#widget-next-btn');
        const muteBtn = e.target.closest('#widget-mute-btn');
        const navBtn = e.target.closest('#nav-audio-btn');

        if (toggleBtn || navBtn) {{
          if (audio.paused) {{
            if (!audio.src) playRandomTrack();
            else audio.play().then(() => window.syncAudioUI()).catch(() => playRandomTrack());
          }} else {{
            audio.pause();
            window.syncAudioUI();
          }}
        }}

        if (nextBtn) {{
          playRandomTrack();
        }}

        if (muteBtn) {{
          audio.muted = !audio.muted;
          window.syncAudioUI();
        }}
      }});

      audio.addEventListener('play', window.syncAudioUI);
      audio.addEventListener('pause', window.syncAudioUI);
    }})();

    // SPA Router: Replaces only <main> so Loading Overlay, Audio Widget and Nav remain persistent
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

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Clean previous audio elements and scripts
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
        print(f"Successfully applied high-volume audio, cyberpunk loading screen & widgets in {file}")
