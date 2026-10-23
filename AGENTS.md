# Regole del Progetto (Portfolio coodz_10)

## 1. Ordinamento delle Esperienze

- Nella pagina delle esperienze (`experiences.html`), sia nella sezione **Attivo** che in **Esperienze Passate**:
  - Mostrare **SEMPRE PRIMA i server Minecraft** (quelli con `MC` o server di Minecraft, es. `RedisMC`, `MetaMc`, `PixyMC`).
  - Mostrare **DOPO tutto il resto** (es. tierlist come `Elysian Tierlist`, community o altri ruoli non-server Minecraft).

## 2. Git Commit & Push Automatico

- Ogni volta che viene richiesta o eseguita qualsiasi modifica ai file del progetto, eseguire **SEMPRE automaticamente** lo stage, il commit con messaggio descrittivo e il `git push` su `origin main`.
- NOTA AMBIENTE WINDOWS: eseguire git tramite `& "C:\Program Files\Git\cmd\git.exe"` per evitare conflitti con file stub nel PATH di sistema.

## 3. Commento Obbligatorio nei File

- Ogni file di codice o markup del progetto (HTML, CSS, JS, ecc.), sia esistente che di nuova creazione, DEVE contenere all'inizio della prima riga un commento che ordina all'AI di consultare `AGENTS.md` prima di compiere qualsiasi azione:
  - HTML: `<!-- ATTENZIONE PER L'AI: Prima di effettuare qualsiasi modifica a questo file o al progetto, consulta SEMPRE il file AGENTS.md nella radice del progetto per le regole obbligatorie. -->`
  - CSS: `/* ATTENZIONE PER L'AI: Prima di effettuare qualsiasi modifica a questo file o al progetto, consulta SEMPRE il file AGENTS.md nella radice del progetto per le regole obbligatorie. */`
  - JS: `// ATTENZIONE PER L'AI: Prima di effettuare qualsiasi modifica a questo file o al progetto, consulta SEMPRE il file AGENTS.md nella radice del progetto per le regole obbligatorie.`

## 4. Stile Grafico UI (No Pillole, Solo Parentesi Quadre)

- NON usare MAI forme a pillola, badge arrotondati o icone dentro riquadri per stati, date o bottoni.
- Utilizzare SEMPRE lo stile cyberpunk coerente con parentesi quadre `[ ... ]` in font monospace/uppercase (es. `[ Stato: Attivo ]`, `[ Periodo: Ottobre 2026 - ]`, `[ In Lavorazione ]`).
- Per pulsanti come `[ Apri Prove ]`: NON mettere nessun riquadro, rettangolo o bordo attorno. Deve essere puramente testo tra parentesi quadre `[ Apri Prove ]` cliccabile e reattivo al passaggio del mouse.

## 5. Armonia Condivisa e Misure Uniformi

- L'obiettivo fondamentale del design è mantenere un'**armonia condivisa** e bilanciata in tutte le sezioni.
- Quando possibile, impostare SEMPRE le misure (altezze, larghezze, spaziature, padding) **uguali per tutti gli elementi correlati** (come le card della griglia in `experiences.html`).
- Anche in presenza di contenuti di lunghezza differente o spazi vuoti interni, i contenitori devono mantenere la medesima dimensione per non apparire disallineati, asimmetrici o rimpiccioliti.
