import glob
import re

html_files = glob.glob('*.html')

# High-Performance Interactive Galaxy & Nebula Canvas Script
galaxy_script = """
<script>
  // High-End Cyberpunk Galaxy & Spiral Nebula Canvas Engine
  (function() {
    const canvas = document.getElementById('stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let stars = [];
    let nebulaParticles = [];
    let shootingStars = [];
    let rotationAngle = 0;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(document.body.scrollHeight, window.innerHeight);
      canvas.style.height = canvas.height + 'px';
      initGalaxy();
    }

    function initGalaxy() {
      stars = [];
      nebulaParticles = [];
      
      const width = canvas.width;
      const height = canvas.height;

      // 1. Background Starfield
      const starCount = Math.floor((width * height) / 12000);
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.4 + 0.3,
          alpha: Math.random() * 0.7 + 0.2,
          dAlpha: (Math.random() * 0.015 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
          color: Math.random() > 0.3 ? '#ffffff' : (Math.random() > 0.5 ? '#4fd1ff' : '#7c6cf0')
        });
      }

      // 2. Spiral Galaxy Nebula Dust Particles
      const nebulaCount = 180;
      const centerX = width * 0.5;
      const centerY = Math.min(height * 0.45, 450);

      for (let i = 0; i < nebulaCount; i++) {
        const dist = Math.pow(Math.random(), 2) * Math.min(width, height) * 0.6 + 40;
        const angle = Math.random() * Math.PI * 2;
        const armOffset = (i % 2) * Math.PI; // 2 spiral arms
        
        nebulaParticles.push({
          dist: dist,
          angle: angle + armOffset,
          size: Math.random() * 80 + 30,
          color: i % 3 === 0 ? 'rgba(124,108,240,' : (i % 3 === 1 ? 'rgba(79,209,255,' : 'rgba(21,15,45,'),
          alpha: Math.random() * 0.15 + 0.05,
          speed: (Math.random() * 0.0005 + 0.0002) * (dist < 200 ? 1.5 : 0.8)
        });
      }
    }

    function spawnShootingStar() {
      if (Math.random() < 0.035) {
        shootingStars.push({
          x: Math.random() * canvas.width * 1.4,
          y: Math.random() * (canvas.height * 0.5),
          len: Math.random() * 90 + 40,
          speed: Math.random() * 14 + 12,
          alpha: 1,
          color: Math.random() > 0.5 ? '#ffffff' : '#4fd1ff'
        });
      }
    }

    function renderGalaxy() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width * 0.5;
      const centerY = Math.min(canvas.height * 0.45, 450);

      // A. Glowing Galaxy Core
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, Math.min(canvas.width, canvas.height) * 0.5);
      coreGradient.addColorStop(0, 'rgba(79, 209, 255, 0.18)');
      coreGradient.addColorStop(0.25, 'rgba(124, 108, 240, 0.12)');
      coreGradient.addColorStop(0.6, 'rgba(21, 15, 45, 0.08)');
      coreGradient.addColorStop(1, 'rgba(11, 10, 26, 0)');
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.min(canvas.width, canvas.height) * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // B. Rotating Spiral Nebula Clouds
      rotationAngle += 0.0006;
      nebulaParticles.forEach(p => {
        p.angle += p.speed;
        const currentAngle = p.angle + rotationAngle;
        const px = centerX + Math.cos(currentAngle) * p.dist;
        const py = centerY + Math.sin(currentAngle) * (p.dist * 0.5); // Elliptical tilt for 3D depth

        const cloudGradient = ctx.createRadialGradient(px, py, 0, px, py, p.size);
        cloudGradient.addColorStop(0, p.color + p.alpha + ')');
        cloudGradient.addColorStop(1, p.color + '0)');

        ctx.fillStyle = cloudGradient;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // C. Twinkling Stars
      stars.forEach(s => {
        s.alpha += s.dAlpha;
        if (s.alpha > 0.85 || s.alpha < 0.15) s.dAlpha *= -1;
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // D. Shooting Stars
      spawnShootingStar();
      ctx.lineWidth = 1.8;
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        let ss = shootingStars[i];
        ss.x -= ss.speed;
        ss.y += ss.speed * 0.7;
        ss.alpha -= 0.02;

        if (ss.alpha <= 0 || ss.y > canvas.height || ss.x < 0) {
          shootingStars.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = ss.alpha;
        ctx.strokeStyle = ss.color;
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x + ss.len, ss.y - ss.len * 0.7);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(renderGalaxy);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    renderGalaxy();
  })();
</script>
"""

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace old starfield script with new rich galaxy nebula engine
    content = re.sub(r'<script>\s*document\.getElementById\(\'year\'\).*?window\.addEventListener\(\'resize\', initStars\);\s*</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'const canvas = document\.getElementById\(\'stars\'\);.*?window\.addEventListener\(\'resize\', initStars\);', '', content, flags=re.DOTALL)
    content = re.sub(r'// Animated starfield with twinkling and shooting stars.*?</script>', '</script>', content, flags=re.DOTALL)

    if '</body>' in content and 'renderGalaxy' not in content:
        content = content.replace('</body>', galaxy_script + '</body>')
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Successfully applied 3D Spiral Galaxy & Nebula background in {file}")
