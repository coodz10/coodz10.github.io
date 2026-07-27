import glob
import re

html_files = glob.glob('*.html')

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update body background CSS to use the ultra-HD galaxy_bg.png image with fixed cover
    content = re.sub(
        r'body\s*\{[^}]*\}',
        """body {
    background: #0b0a1a url('galaxy_bg.png') no-repeat center center fixed;
    background-size: cover;
    color: var(--ink);
    font-family: 'Sora', sans-serif;
    overflow-x: hidden;
  }""",
        content,
        flags=re.DOTALL
    )

    # Clean previous canvas procedural galaxy scripts
    content = re.sub(r'<script>\s*// High-End Cyberpunk Galaxy & Spiral Nebula Canvas Engine.*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'const canvas = document\.getElementById\(\'stars\'\);.*?window\.addEventListener\(\'resize\', resizeCanvas\);', '', content, flags=re.DOTALL)

    # Simple subtle twinkling stars overlay on top of galaxy_bg.png
    simple_stars_script = """
<script>
  (function() {
    const canvas = document.getElementById('stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(document.body.scrollHeight, window.innerHeight);
      canvas.style.height = canvas.height + 'px';
      stars = [];
      const count = Math.floor((canvas.width * canvas.height) / 18000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.2 + 0.3,
          alpha: Math.random() * 0.6 + 0.2,
          dAlpha: (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1)
        });
      }
    }

    function animateStars() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.alpha += s.dAlpha;
        if (s.alpha > 0.85 || s.alpha < 0.15) s.dAlpha *= -1;
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(animateStars);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animateStars();
  })();
</script>
"""

    if '</body>' in content and 'animateStars' not in content:
        content = content.replace('</body>', simple_stars_script + '</body>')
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Successfully updated galaxy image background in {file}")
