import sys

with open('c:/Users/cood_/Desktop/esperienzecood/metamc.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Title
content = content.replace('<title>PixyMC — coodz_10</title>', '<title>MetaMc — coodz_10</title>')

# 2. Extract up to <!-- PIXYMC DETTAGLI --> and after <!-- FOOTER -->
main_start = content.find('  <!-- PIXYMC DETTAGLI -->')
footer_start = content.find('  <!-- FOOTER -->')

new_main = """  <!-- METAMC DETTAGLI -->
  <main class="relative z-10 flex-grow max-w-5xl mx-auto px-6 pt-32 pb-24 flex flex-col justify-center w-full">

    <!-- HEADER -->
    <div class="animate-in delay-1 mb-10 border-b border-[rgba(124,108,240,.2)] pb-8">
      <a href="experiences.html"
        class="mono text-xs text-[var(--ink-dim)] hover:text-white transition-colors tracking-widest mb-6 inline-block">&larr;
        <span class="lang-it">TORNA ALLE ESPERIENZE</span><span class="lang-en hidden">BACK TO EXPERIENCES</span></a>
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 class="text-5xl md:text-7xl font-extrabold text-white glow tracking-tighter leading-none mb-3 mt-2">MetaMc
          </h2>
          <p class="mono text-sm text-[var(--cyan)] uppercase tracking-wider">Trainee</p>
        </div>
        <div class="flex flex-col items-start md:items-end gap-2 text-sm text-[var(--ink-dim)]">
          <div><span class="text-white">? / 5</span> <span class="opacity-30">★</span></div>
          <div
            class="inline-block border border-[rgba(124,108,240,.4)] text-[10px] uppercase px-3 py-1 rounded tracking-wider">
            <span class="lang-it">Stato: Work in Progress</span>
            <span class="lang-en hidden">Status: Work in Progress</span>
          </div>
        </div>
      </div>
    </div>

    <!-- CONTENT GRID -->
    <div class="grid grid-cols-1 gap-8 animate-in delay-2">

      <!-- MAIN TEXT -->
      <div class="space-y-8">
        <div
          class="bg-[rgba(11,10,26,.4)] border border-[rgba(124,108,240,.15)] p-8 rounded-xl hover:border-[rgba(124,108,240,.3)] transition-colors">
          <h3 class="text-xl text-white font-bold mb-4 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="text-[var(--violet)]">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span class="lang-it">La Mia Esperienza</span>
            <span class="lang-en hidden">My Experience</span>
          </h3>
          <p class="text-[var(--ink-dim)] leading-relaxed text-sm md:text-base">
            <span class="lang-it">
              Esperienza attualmente in corso. Work in progress! Non ci sono ancora informazioni.
            </span>
            <span class="lang-en hidden">
              Experience currently in progress. Work in progress! There is no information yet.
            </span>
          </p>
        </div>
      </div>
    </div>
  </main>

"""

new_content = content[:main_start] + new_main + content[footer_start:]

# Remove the Modal script logic
modal_script = """    // Modal Logic
    const modal = document.getElementById('proofsModal');
    const modalContent = modal.querySelector('div');

    function openModal() {
      modal.classList.remove('hidden');
      // piccolissimo ritardo per permettere a display:block di applicarsi prima dell'animazione
      setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
      }, 10);
    }

    function closeModal() {
      modal.classList.add('opacity-0');
      modalContent.classList.add('scale-95');
      setTimeout(() => {
        modal.classList.add('hidden');
      }, 300);
    }

    // Chiude il modal se si clicca fuori dal box centrale
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });"""

new_content = new_content.replace(modal_script, '')

with open('c:/Users/cood_/Desktop/esperienzecood/metamc.html', 'w', encoding='utf-8') as f:
    f.write(new_content)
