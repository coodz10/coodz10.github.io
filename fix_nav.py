import os
import re

files = ['index.html', 'about.html', 'contact.html', 'experiences.html']

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We want to replace the closing of the div for the nav links
    # The nav links block looks something like:
    # <div class="flex gap-4 sm:gap-6 text-[var(--ink-dim)]">
    # ...
    # </div>
    
    # Let's fix the class of the flex container to include items-center
    content = content.replace('<div class="flex gap-4 sm:gap-6 text-[var(--ink-dim)]">', '<div class="flex items-center gap-4 sm:gap-6 text-[var(--ink-dim)]">')

    # Remove any existing [ EN ] button
    content = re.sub(r'<button id="lang-toggle".*?</button>', '', content)
    
    # Replace the end of the div
    # In some files it's <a href="contact.html" ...>...</a>
    # Let's just find </a>\n    </div>\n  </div>\n</nav>
    
    pattern = r'(<a href="contact\.html"[^>]*>.*?</a>)\s*</div>\s*</div>\s*</nav>'
    
    replacement = r'''\1
      <div class="flex items-center ml-2 border-l border-[rgba(124,108,240,.3)] pl-4 gap-3 text-xs">
        <button onclick="setLanguage('it')" id="lang-btn-it" class="text-white transition-colors">&bull; IT</button>
        <button onclick="setLanguage('en')" id="lang-btn-en" class="text-[var(--ink-dim)] hover:text-white transition-colors">&bull; EN</button>
      </div>
    </div>
  </div>
</nav>'''
    
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    # Also fix contact translation in nav if missing
    content = content.replace('<a href="contact.html" class="hover:text-white transition-colors">[ contatti ]</a>', '<a href="contact.html" class="hover:text-white transition-colors"><span class="lang-it">[ contatti ]</span><span class="lang-en hidden">[ contact ]</span></a>')
    content = content.replace('<a href="contact.html" class="text-white transition-colors">[ contatti ]</a>', '<a href="contact.html" class="text-white transition-colors"><span class="lang-it">[ contatti ]</span><span class="lang-en hidden">[ contact ]</span></a>')

    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
