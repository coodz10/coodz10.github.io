import glob
import re

html_files = glob.glob('*.html')

overlay_and_player = """
  <!-- ENTRY OVERLAY -->
  <div id="entry-overlay" class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--bg)] transition-opacity duration-700" style="background: linear-gradient(-45deg, #0b0a1a, #150f2d, #0b0a1a, #0c1a2f); background-size: 400% 400%; animation: gradientBG 15s ease infinite;">
    <div id="loading-text" class="mono text-[var(--cyan)] text-sm mb-4 tracking-widest">INITIALIZING_SYSTEM...</div>
    <div class="w-64 h-1 bg-[rgba(124,108,240,.2)] rounded overflow-hidden relative">
      <div id="loading-bar" class="absolute top-0 left-0 h-full w-0 bg-[var(--cyan)] transition-all duration-1000"></div>
    </div>
    <div id="enter-text" class="hidden mt-8 text-xl sm:text-3xl text-white glow tracking-widest cursor-pointer font-bold uppercase animate-in" style="animation-duration: 0.5s;">
      [ CLICK ANYWHERE TO ENTER ]
    </div>
  </div>

  <!-- SPOTIFY PLAYER & SPA ROUTER -->
  <div class="fixed bottom-4 right-4 z-50 animate-in delay-3" style="box-shadow: 0 0 20px rgba(124,108,240,.3); border-radius: 12px;">
    <div id="embed-iframe"></div>
  </div>
  
  <script src="https://open.spotify.com/embed/iframe-api/v1" async></script>
  <script>
    // 1. SPOTIFY API
    let spotifyPlayer;
    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      const element = document.getElementById('embed-iframe');
      const options = {
        width: '300',
        height: '80',
        uri: 'spotify:playlist:4JM4IDjbCw16i5ff9OBI9D',
        theme: '0'
      };
      const callback = (EmbedController) => {
        spotifyPlayer = EmbedController;
      };
      IFrameAPI.createController(element, options, callback);
    };

    // 2. ENTRY OVERLAY LOGIC
    document.addEventListener('DOMContentLoaded', () => {
      const overlay = document.getElementById('entry-overlay');
      const loadingBar = document.getElementById('loading-bar');
      const loadingText = document.getElementById('loading-text');
      const enterText = document.getElementById('enter-text');

      if (sessionStorage.getItem('system_entered')) {
        if (overlay) overlay.remove();
      } else {
        setTimeout(() => { if (loadingBar) loadingBar.style.width = '100%'; }, 100);
        setTimeout(() => {
          if (loadingText) loadingText.textContent = 'SYSTEM_READY';
          if (enterText) enterText.classList.remove('hidden');
        }, 1200);

        if (overlay) {
          overlay.addEventListener('click', () => {
            if (enterText && !enterText.classList.contains('hidden')) {
              sessionStorage.setItem('system_entered', 'true');
              if (spotifyPlayer) spotifyPlayer.play();
              overlay.style.opacity = '0';
              setTimeout(() => overlay.remove(), 700);
            }
          });
        }
      }
    });

    // 3. SPA ROUTER
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

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Rimuovi eventuali versioni precedenti del player, dell'overlay e dello script
    content = re.sub(r'<!-- ENTRY OVERLAY.*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)
    content = re.sub(r'<!-- SPOTIFY PLAYER.*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)
    content = re.sub(r'<!-- SPOTIFY PLAYER.*?</div>\s*</body>', '</body>', content, flags=re.DOTALL)
    
    if '</body>' in content:
        content = content.replace('</body>', overlay_and_player)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file}")
