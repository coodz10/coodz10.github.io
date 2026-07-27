import glob
import re

html_files = glob.glob('*.html')

body_css_replacement = """body {
    background: linear-gradient(-45deg, #070614, #120c2b, #070614, #081122);
    background-size: 400% 400%;
    animation: gradientBG 15s ease infinite;
    color: var(--ink);
    font-family: 'Sora', sans-serif;
    overflow-x: hidden;
  }"""

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace body CSS to use ultra-sleek assistenzaluni deep dark gradient background
    content = re.sub(
        r'body\s*\{[^}]*\}',
        body_css_replacement,
        content,
        flags=re.DOTALL
    )

    # Clean previous canvas procedural galaxy scripts
    content = re.sub(r'<script>\s*// High-End Cyberpunk Galaxy & Spiral Nebula Canvas Engine.*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'const canvas = document\.getElementById\(\'stars\'\);.*?window\.addEventListener\(\'resize\', resizeCanvas\);', '', content, flags=re.DOTALL)
    content = re.sub(r'<script>\s*\(function\(\)\s*\{\s*const canvas = document\.getElementById\(\'stars\'\);.*?\}\)\(\);\s*</script>', '', content, flags=re.DOTALL)

    # Sleek Assistenzaluni-inspired Starfield Overlay Script
    assistenzaluni_stars_script = """
<script>
  (function() {
    const canvas = document.getElementById('stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    let shootingStars = [];

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(document.body.scrollHeight, window.innerHeight);
      canvas.style.height = canvas.height + 'px';
      stars = [];
      const count = Math.floor((canvas.width * canvas.height) / 14000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.3 + 0.3,
          alpha: Math.random() * 0.7 + 0.2,
          dAlpha: (Math.random() * 0.012 + 0.004) * (Math.random() > 0.5 ? 1 : -1),
          color: Math.random() > 0.25 ? '#ffffff' : (Math.random() > 0.5 ? '#4fd1ff' : '#7c6cf0')
        });
      }
    }

    function spawnShootingStar() {
      if (Math.random() < 0.03) {
        shootingStars.push({
          x: Math.random() * canvas.width * 1.4,
          y: Math.random() * (canvas.height * 0.4),
          len: Math.random() * 80 + 30,
          speed: Math.random() * 12 + 10,
          alpha: 1,
          color: Math.random() > 0.5 ? '#ffffff' : '#4fd1ff'
        });
      }
    }

    function animateAssistenzaluniSpace() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ambient radial light glow
      const centerX = canvas.width * 0.5;
      const centerY = 350;
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, Math.min(canvas.width, canvas.height) * 0.45);
      coreGrad.addColorStop(0, 'rgba(124, 108, 240, 0.09)');
      coreGrad.addColorStop(0.5, 'rgba(79, 209, 255, 0.05)');
      coreGrad.addColorStop(1, 'rgba(7, 6, 20, 0)');
      
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.min(canvas.width, canvas.height) * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Twinkling stars
      stars.forEach(s => {
        s.alpha += s.dAlpha;
        if (s.alpha > 0.85 || s.alpha < 0.15) s.dAlpha *= -1;
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Shooting stars
      spawnShootingStar();
      ctx.lineWidth = 1.6;
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        let ss = shootingStars[i];
        ss.x -= ss.speed;
        ss.y += ss.speed * 0.65;
        ss.alpha -= 0.02;

        if (ss.alpha <= 0 || ss.y > canvas.height || ss.x < 0) {
          shootingStars.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = ss.alpha;
        ctx.strokeStyle = ss.color;
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x + ss.len, ss.y - ss.len * 0.65);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(animateAssistenzaluniSpace);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animateAssistenzaluniSpace();
  })();
</script>
"""

    if '</body>' in content and 'animateAssistenzaluniSpace' not in content:
        content = content.replace('</body>', assistenzaluni_stars_script + '</body>')

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Successfully updated assistenzaluni style in {file}")
