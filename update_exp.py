import os
import re

file_path = 'c:\\Users\\cood_\\Desktop\\esperienzecood\\experiences.html'

with open(file_path, 'r', encoding='utf-8') as file:
    content = file.read()

# Replace the card
old_card = r'''<!-- PixyMC Card -->.*?</div>\s*</div>\s*</main>'''
new_card = '''<!-- PixyMC Card -->
      <a href="pixymc.html" class="block border border-[rgba(124,108,240,.2)] bg-[rgba(11,10,26,.4)] p-6 rounded-lg hover:border-[rgba(124,108,240,.5)] hover:bg-[rgba(124,108,240,.05)] transition-colors relative group cursor-pointer">
        <div class="text-sm text-[var(--ink-dim)] mb-3">
          <span class="text-white">????</span><span class="opacity-30">?</span>
        </div>
        <div class="inline-block border border-[rgba(124,108,240,.4)] text-[var(--ink-dim)] text-[10px] uppercase px-2 py-0.5 rounded mb-4 tracking-wider">
          <span class="lang-it">Dimesso</span>
          <span class="lang-en hidden">Resign</span>
        </div>
        <h3 class="text-2xl text-white font-bold mb-2 group-hover:text-[var(--cyan)] transition-colors">PixyMC</h3>
        <p class="text-sm md:text-base text-[var(--ink-dim)] leading-relaxed">
          Owner [ SS Manager ]
        </p>
      </a>

    </div>
  </main>'''
content = re.sub(old_card, new_card, content, flags=re.DOTALL)

# Remove Modal HTML
content = re.sub(r'<!-- MODAL -->.*?</div>\s*</div>\s*</div>', '', content, flags=re.DOTALL)

# Remove Modal JS
content = re.sub(r'// Modal Logic.*?</script>', '</script>', content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as file:
    file.write(content)
