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
