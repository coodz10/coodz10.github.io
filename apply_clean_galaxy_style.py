import glob
import re

html_files = glob.glob('*.html')

body_css = """body {
    background: linear-gradient(135deg, #080716 0%, #110e2b 40%, #091226 70%, #070614 100%);
    background-attachment: fixed;
    color: var(--ink);
    font-family: 'Sora', sans-serif;
    overflow-x: hidden;
  }"""

clean_galaxy_script = """
<script>
  // Clean Modern Cosmic Starfield & Ambient Glow Engine
  (function() {
    const canvas = document.getElementById('stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let stars = [];
    let shootingStars = [];
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(document.body.scrollHeight, window.innerHeight);
      canvas.style.height = canvas.height + 'px';
      initStars();
    }

    function initStars() {
      stars = [];
      const count = Math.floor((canvas.width * canvas.height) / 12000);
      for (let i = 0; i < count; i++) {
        const depth = Math.random() * 1.5 + 0.5;
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          depth: depth,
          r: (Math.random() * 1.2 + 0.4) * (depth * 0.7),
          alpha: Math.random() * 0.65 + 0.2,
          dAlpha: (Math.random() * 0.008 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
          color: Math.random() > 0.3 ? '#ffffff' : (Math.random() > 0.5 ? '#4fd1ff' : '#a78bfa')
        });
      }
    }

    document.addEventListener('mousemove', (e) => {
      mouse.targetX = (e.clientX - window.innerWidth / 2) * 0.03;
      mouse.targetY = (e.clientY - window.innerHeight / 2) * 0.03;
    });

    function spawnShootingStar() {
      if (Math.random() < 0.03) {
        shootingStars.push({
          x: Math.random() * canvas.width * 1.3,
          y: Math.random() * (canvas.height * 0.45),
          len: Math.random() * 90 + 40,
          speed: Math.random() * 12 + 10,
          alpha: 1,
          color: Math.random() > 0.5 ? '#ffffff' : '#4fd1ff'
        });
      }
    }

    function renderCleanSpace() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smooth mouse parallax easing
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      const centerX = canvas.width * 0.5 + mouse.x * 0.8;
      const centerY = 320 + mouse.y * 0.8;

      // 1. Soft Ambient Cosmic Core Glow
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, Math.min(canvas.width, canvas.height) * 0.48);
      coreGrad.addColorStop(0, 'rgba(124, 108, 240, 0.12)');
      coreGrad.addColorStop(0.4, 'rgba(79, 209, 255, 0.06)');
      coreGrad.addColorStop(1, 'rgba(8, 7, 22, 0)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.min(canvas.width, canvas.height) * 0.48, 0, Math.PI * 2);
      ctx.fill();

      // 2. Gentle Twinkling Stars with Mouse Parallax
      stars.forEach(s => {
        s.alpha += s.dAlpha;
        if (s.alpha > 0.85 || s.alpha < 0.15) s.dAlpha *= -1;

        const px = s.x + mouse.x * s.depth;
        const py = s.y + mouse.y * s.depth;

        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Graceful Shooting Stars
      spawnShootingStar();
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
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x + ss.len, ss.y - ss.len * 0.65);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(renderCleanSpace);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    renderCleanSpace();
  })();
</script>
"""

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace body CSS
    content = re.sub(
        r'body\s*\{[^}]*\}',
        body_css,
        content,
        flags=re.DOTALL
    )

    # Clean all previous canvas scripts
    content = re.sub(r'<script>\s*// Real 3D Perspective Galaxy.*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'<script>\s*// High-End Assistenzaluni.*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'<script>\s*// Clean Modern Cosmic.*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'<script>\s*\(function\(\)\s*\{\s*const canvas = document\.getElementById\(\'stars\'\);.*?\}\)\(\);\s*</script>', '', content, flags=re.DOTALL)

    if '</body>' in content and 'renderCleanSpace' not in content:
        content = content.replace('</body>', clean_galaxy_script + '</body>')

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Successfully applied Clean Modern Cosmic style in {file}")
