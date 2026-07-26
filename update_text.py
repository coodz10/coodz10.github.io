import os

def update_file(filename, replacements):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

# INDEX.HTML
update_file('index.html', [
    ('[ chi sono ]', '<span class="lang-it">[ chi sono ]</span><span class="lang-en hidden">[ about me ]</span>'),
    ('[ le mie esperienze ]', '<span class="lang-it">[ le mie esperienze ]</span><span class="lang-en hidden">[ my experiences ]</span>')
])

# ABOUT.HTML
about_it = '''Ho una forte passione per l'informatica a 360°: dall'ottimizzazione dei sistemi Windows
        all'infrastruttura server, dalla sicurezza informatica allo sviluppo di strumenti custom.
        Mi occupo anche di <span class="text-white font-semibold">screen share</span>: analizzo processi Windows,
        registro di sistema, USN Journal e Prefetch per trovare cheat nascosti e ricostruire
        l'attività recente di una macchina.<br><br> Mi piace capire come funzionano davvero le cose e
        trasformare quella curiosità in soluzioni concrete — che si tratti di un'indagine
        forense o di tenere online un network con centinaia di giocatori connessi.'''

about_en = '''I have a strong passion for 360° IT: from Windows system optimization to server infrastructure, from cybersecurity to custom tools development. I also do <span class="text-white font-semibold">screen share</span>: I analyze Windows processes, the registry, USN Journal and Prefetch to find hidden cheats and reconstruct the recent activity of a machine.<br><br> I like to understand how things really work and turn that curiosity into concrete solutions — whether it's a forensic investigation or keeping a network with hundreds of connected players online.'''

update_file('about.html', [
    ('LOG_ENTRY_00 // CHI_SONO', '<span class="lang-it">LOG_ENTRY_00 // CHI_SONO</span><span class="lang-en hidden">LOG_ENTRY_00 // ABOUT_ME</span>'),
    (about_it, f'<span class="lang-it">{about_it}</span><span class="lang-en hidden">{about_en}</span>')
])

# CONTACT.HTML
update_file('contact.html', [
    ('LOG_ENTRY_02 // CONTATTI', '<span class="lang-it">LOG_ENTRY_02 // CONTATTI</span><span class="lang-en hidden">LOG_ENTRY_02 // CONTACT</span>'),
    ('Rimaniamo in Contatto', '<span class="lang-it">Rimaniamo in Contatto</span><span class="lang-en hidden">Let\\'s get in touch</span>')
])

