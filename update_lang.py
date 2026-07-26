import os
import re

files = ['index.html', 'about.html', 'contact.html', 'experiences.html']

js_script = '''
  <script>
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
  </script>
</body>
'''

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # 1. Add JS before </body> if not there
    if 'id="lang-toggle"' not in content:
        content = content.replace('</body>', js_script)

    # 2. Add Lang Toggle to navbar
    nav_links = '''<a href="contact.html" class="hover:text-white transition-colors">[ contatti ]</a>
      </div>'''
    nav_links_active = '''<a href="contact.html" class="text-white transition-colors">[ contatti ]</a>
      </div>'''
    
    if 'id="lang-toggle"' not in content:
        replacement = '''<a href="contact.html" class="hover:text-white transition-colors"><span class="lang-it">[ contatti ]</span><span class="lang-en hidden">[ contact ]</span></a>
        <button id="lang-toggle" class="ml-2 border border-[rgba(124,108,240,.4)] px-2 py-0.5 hover:text-white transition-colors text-xs">[ EN ]</button>
      </div>'''
        
        replacement_active = '''<a href="contact.html" class="text-white transition-colors"><span class="lang-it">[ contatti ]</span><span class="lang-en hidden">[ contact ]</span></a>
        <button id="lang-toggle" class="ml-2 border border-[rgba(124,108,240,.4)] px-2 py-0.5 hover:text-white transition-colors text-xs">[ EN ]</button>
      </div>'''
        
        content = content.replace(nav_links, replacement)
        content = content.replace(nav_links_active, replacement_active)
        
        # Translate the other nav links
        content = content.replace('[ chi_sono ]', '<span class="lang-it">[ chi_sono ]</span><span class="lang-en hidden">[ about_me ]</span>')
        content = content.replace('[ esperienze ]', '<span class="lang-it">[ esperienze ]</span><span class="lang-en hidden">[ experiences ]</span>')

    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
