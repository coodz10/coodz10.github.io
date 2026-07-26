import os

files = ['index.html', 'about.html', 'contact.html', 'experiences.html']

old_js = '''  <script>
    const langToggle = document.getElementById('lang-toggle');
    let currentLang = localStorage.getItem('lang') || 'it';
    function setLanguage(lang) {
      currentLang = lang;
      localStorage.setItem('lang', lang);
      document.querySelectorAll('.lang-it').forEach(el => el.style.display = lang === 'it' ? '' : 'none');
      document.querySelectorAll('.lang-en').forEach(el => el.style.display = lang === 'en' ? '' : 'none');
      if (langToggle) langToggle.textContent = lang === 'it' ? '[ EN ]' : '[ IT ]';
    }
    if (langToggle) {
      langToggle.addEventListener('click', () => {
        setLanguage(currentLang === 'it' ? 'en' : 'it');
      });
    }
    setLanguage(currentLang);
  </script>'''

new_js = '''  <script>
    let currentLang = localStorage.getItem('lang') || 'it';
    
    function setLanguage(lang) {
      currentLang = lang;
      localStorage.setItem('lang', lang);
      
      // Update visibility using tailwind .hidden class
      document.querySelectorAll('.lang-it').forEach(el => {
        if(lang === 'it') el.classList.remove('hidden'); else el.classList.add('hidden');
      });
      document.querySelectorAll('.lang-en').forEach(el => {
        if(lang === 'en') el.classList.remove('hidden'); else el.classList.add('hidden');
      });
      
      // Update bullets style
      const btnIt = document.getElementById('lang-btn-it');
      const btnEn = document.getElementById('lang-btn-en');
      if(btnIt && btnEn) {
        if(lang === 'it') {
          btnIt.className = 'text-white transition-colors';
          btnEn.className = 'text-[var(--ink-dim)] hover:text-white transition-colors';
        } else {
          btnEn.className = 'text-white transition-colors';
          btnIt.className = 'text-[var(--ink-dim)] hover:text-white transition-colors';
        }
      }
    }
    
    setLanguage(currentLang);
  </script>'''

old_nav_btn = '''<button id="lang-toggle" class="ml-2 border border-[rgba(124,108,240,.4)] px-2 py-0.5 hover:text-white transition-colors text-xs">[ EN ]</button>'''

new_nav_btn = '''<div class="flex items-center ml-2 border-l border-[rgba(124,108,240,.3)] pl-4 gap-3 text-xs">
          <button onclick="setLanguage('it')" id="lang-btn-it" class="text-white transition-colors">&bull; IT</button>
          <button onclick="setLanguage('en')" id="lang-btn-en" class="text-[var(--ink-dim)] hover:text-white transition-colors">&bull; EN</button>
        </div>'''

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    content = content.replace(old_js, new_js)
    content = content.replace(old_nav_btn, new_nav_btn)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
