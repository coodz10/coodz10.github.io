import os
import re

file_path = 'c:\\Users\\cood_\\Desktop\\esperienzecood\\pixymc.html'

with open(file_path, 'r', encoding='utf-8') as file:
    content = file.read()

# Update title
content = content.replace('<title>Esperienze — coodz_10</title>', '<title>PixyMC — coodz_10</title>')

# Update <main> content
old_main = r'''  <!-- ESPERIENZE -->\s*<main.*?</div>\s*</main>'''
new_main = '''  <!-- PIXYMC DETTAGLI -->
  <main class="relative z-10 flex-grow max-w-4xl mx-auto px-6 pt-32 pb-24 flex flex-col justify-center">
    
    <div class="mb-12 animate-in delay-1">
      <a href="experiences.html" class="mono text-xs text-[var(--ink-dim)] hover:text-white transition-colors tracking-widest mb-6 inline-block">&larr; TORNA ALLE ESPERIENZE</a>
      <h2 class="text-5xl md:text-7xl font-extrabold text-white glow tracking-tighter leading-none mb-4 mt-4">PixyMC</h2>
      <div class="text-sm text-[var(--ink-dim)] mb-2">
        <span class="text-white">????</span><span class="opacity-30">?</span>
      </div>
      <p class="mono text-sm text-[var(--cyan)] uppercase tracking-wider">Owner [ SS Manager ] &bull; <span class="lang-it">Dimesso</span><span class="lang-en hidden">Resign</span></p>
    </div>

    <div class="space-y-10 animate-in delay-2 text-[var(--ink-dim)] leading-relaxed">
      
      <div>
        <h3 class="text-xl text-white font-bold mb-3 border-b border-[rgba(124,108,240,.3)] pb-2 inline-block"><span class="lang-it">Come mi sono trovato</span><span class="lang-en hidden">My Experience</span></h3>
        <p>
          <span class="lang-it"><!-- INSERISCI QUI COME TI SEI TROVATO (ITALIANO) -->Scrivi qui come ti sei trovato...</span>
          <span class="lang-en hidden"><!-- INSERISCI QUI COME TI SEI TROVATO (INGLESE) -->Write here about your experience...</span>
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="bg-[rgba(11,10,26,.6)] border border-[rgba(124,108,240,.2)] p-6 rounded-lg">
          <h3 class="text-lg text-[var(--cyan)] font-bold mb-3"><span class="lang-it">Punti di Forza</span><span class="lang-en hidden">Strengths</span></h3>
          <ul class="list-disc list-inside space-y-2">
            <li><span class="lang-it">Primo punto di forza</span><span class="lang-en hidden">First strength</span></li>
            <li><span class="lang-it">Secondo punto di forza</span><span class="lang-en hidden">Second strength</span></li>
            <!-- AGGIUNGI ALTRI PUNTI DI FORZA -->
          </ul>
        </div>
        
        <div class="bg-[rgba(11,10,26,.6)] border border-[rgba(124,108,240,.2)] p-6 rounded-lg">
          <h3 class="text-lg text-[var(--violet)] font-bold mb-3"><span class="lang-it">Punti Deboli</span><span class="lang-en hidden">Weaknesses</span></h3>
          <ul class="list-disc list-inside space-y-2">
            <li><span class="lang-it">Primo punto debole</span><span class="lang-en hidden">First weakness</span></li>
            <li><span class="lang-it">Secondo punto debole</span><span class="lang-en hidden">Second weakness</span></li>
            <!-- AGGIUNGI ALTRI PUNTI DEBOLI -->
          </ul>
        </div>
      </div>

      <div class="pt-8">
        <button onclick="openModal()" class="bracket-btn px-8 py-4 text-sm tracking-widest uppercase transition-colors">
          <span class="lang-it">[ Prove ]</span>
          <span class="lang-en hidden">[ Proofs ]</span>
        </button>
      </div>

    </div>
  </main>'''

content = re.sub(old_main, new_main, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as file:
    file.write(content)
