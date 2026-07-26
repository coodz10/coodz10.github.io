import os

files = ['index.html', 'about.html', 'contact.html', 'experiences.html', 'pixymc.html']

github_link = '<a href="https://github.com" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">[ GitHub ]</a>'
github_link_alt = '<a href="https://github.com" target="_blank" rel="noopener noreferrer"\n          class="hover:text-white transition-colors">[ GitHub ]</a>'

for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Remove github link
        content = content.replace(github_link, '')
        content = content.replace(github_link_alt, '')
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
    except Exception as e:
        print(f"Error processing {f}: {e}")
