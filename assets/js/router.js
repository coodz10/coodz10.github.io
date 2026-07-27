// SPA Router: Replaces <main> with smooth fade-out/fade-in transition and updates active nav links, <title>, and <meta name="description">
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

    // 1. Update Document Title
    document.title = doc.title;

    // 2. Update Meta Description if present
    const newMetaDesc = doc.querySelector('meta[name="description"]');
    let currentMetaDesc = document.querySelector('meta[name="description"]');
    if (newMetaDesc) {
      if (!currentMetaDesc) {
        currentMetaDesc = document.createElement('meta');
        currentMetaDesc.setAttribute('name', 'description');
        document.head.appendChild(currentMetaDesc);
      }
      currentMetaDesc.setAttribute('content', newMetaDesc.getAttribute('content') || '');
    }

    // 3. Smooth Fade-Out / Fade-In Transition
    const currentMain = document.querySelector('main');
    const newMain = doc.querySelector('main');

    if (currentMain && newMain) {
      currentMain.style.transition = 'opacity 200ms ease';
      currentMain.style.opacity = '0';

      await new Promise(resolve => setTimeout(resolve, 200));

      newMain.style.opacity = '0';
      newMain.style.transition = 'opacity 200ms ease';
      currentMain.replaceWith(newMain);

      requestAnimationFrame(() => {
        newMain.style.opacity = '1';
      });

      setTimeout(() => {
        newMain.style.transition = '';
        newMain.style.opacity = '';
      }, 200);
    }

    // 4. Update Navigation Links Active Styling
    const currentNavLinks = document.querySelectorAll('nav a');
    currentNavLinks.forEach(a => {
      const aHref = a.getAttribute('href');
      if (aHref === href || (href.includes('servers/') && aHref === 'experiences.html')) {
        a.className = 'text-white transition-colors';
      } else {
        a.className = 'hover:text-white transition-colors text-[var(--ink-dim)]';
      }
    });

    // 5. Preserve Language Choice
    if (typeof setLanguage === 'function') {
      setLanguage(localStorage.getItem('lang') || 'it');
    }

    // 6. Sync Audio UI Status
    if (typeof window.syncAudioUI === 'function') {
      window.syncAudioUI();
    }

    window.scrollTo(0, 0);
  } catch (err) {
    window.location.href = href;
  }
}
