// SPA Router: Replaces <main> with smooth fade-out/fade-in transition and updates active nav links, <title>, and <meta name="description">

function getSiteRootURL() {
  let path = location.pathname;
  if (path.includes('/servers/')) {
    path = path.split('/servers/')[0] + '/';
  } else {
    path = path.substring(0, path.lastIndexOf('/') + 1);
  }
  return location.origin + path;
}

function resolvePageUrl(href) {
  if (!href) return '';
  if (href.startsWith('http://') || href.startsWith('https://')) return href;

  const rootUrl = getSiteRootURL();
  const cleanHref = href.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '').replace(/^\//, '');

  if (cleanHref.startsWith('servers/')) {
    return rootUrl + cleanHref;
  }
  if (href.includes('servers/')) {
    const filename = cleanHref.split('/').pop();
    return rootUrl + 'servers/' + filename;
  }
  const filename = cleanHref.split('/').pop() || 'index.html';
  return rootUrl + filename;
}

async function loadPage(targetUrl) {
  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      console.error('Failed to load page:', targetUrl, res.status);
      window.location.href = targetUrl;
      return;
    }
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    // 1. Update Document Title
    if (doc.title) document.title = doc.title;

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

    // 4. Update Navigation Links (Hrefs & Active Styling for SPA consistency across depths)
    const isTargetInServers = targetUrl.includes('/servers/');
    const pageFilename = targetUrl.split('/').pop() || 'index.html';

    const currentNavLinks = document.querySelectorAll('nav a');
    currentNavLinks.forEach(a => {
      const aHref = a.getAttribute('href') || '';
      const cleanNavFile = aHref.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '').replace(/^\//, '').split('/').pop();

      if (cleanNavFile) {
        a.setAttribute('href', isTargetInServers ? '../' + cleanNavFile : cleanNavFile);
      }

      const isExperiencesMatch = isTargetInServers && cleanNavFile === 'experiences.html';
      const isDirectMatch = cleanNavFile === pageFilename;
      if (isDirectMatch || isExperiencesMatch) {
        a.className = 'text-white transition-colors';
      } else {
        a.className = 'hover:text-white transition-colors text-[var(--ink-dim)]';
      }
    });

    // 5. Update Footer Year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // 6. Preserve Language Choice
    if (typeof setLanguage === 'function') {
      setLanguage(localStorage.getItem('lang') || 'it');
    }

    // 7. Sync Audio UI Status
    if (typeof window.syncAudioUI === 'function') {
      window.syncAudioUI();
    }

    window.scrollTo(0, 0);
  } catch (err) {
    console.error('Router error:', err);
    window.location.href = targetUrl;
  }
}

document.addEventListener('click', async (e) => {
  const link = e.target.closest('a');
  if (!link) return;

  const rawHref = link.getAttribute('href');
  if (!rawHref || rawHref.startsWith('http://') || rawHref.startsWith('https://') || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || !rawHref.includes('.html')) return;

  e.preventDefault();
  const targetUrl = resolvePageUrl(rawHref);
  await loadPage(targetUrl);
  history.pushState({ path: targetUrl }, '', targetUrl);
});

window.addEventListener('popstate', async (e) => {
  const targetUrl = e.state?.path || location.href;
  await loadPage(targetUrl);
});

// Global Proofs Modal Support (ensures modal works across SPA page transitions)
window.openModal = function() {
  const modal = document.getElementById('proofsModal');
  if (!modal) return;
  const modalContent = modal.querySelector('div');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    if (modalContent) modalContent.classList.remove('scale-95');
  }, 10);
};

window.closeModal = function() {
  const modal = document.getElementById('proofsModal');
  if (!modal) return;
  const modalContent = modal.querySelector('div');
  modal.classList.add('opacity-0');
  if (modalContent) modalContent.classList.add('scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }, 300);
};

document.addEventListener('click', (e) => {
  const modal = document.getElementById('proofsModal');
  if (modal && e.target === modal) {
    window.closeModal();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.closeModal();
  }
});
