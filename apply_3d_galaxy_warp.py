import glob
import re

html_files = glob.glob('*.html')

body_css_replacement = """body {
    background: linear-gradient(-45deg, #060512, #100b26, #060512, #070e1e);
    background-size: 400% 400%;
    animation: gradientBG 15s ease infinite;
    color: var(--ink);
    font-family: 'Sora', sans-serif;
    overflow-x: hidden;
  }"""

galaxy_3d_warp_script = """
<script>
  // Real 3D Perspective Galaxy & Shooting Stars Engine
  (function() {
    const canvas = document.getElementById('stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let stars = [];
    let shootingStars = [];
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const numStars = 450;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(document.body.scrollHeight, window.innerHeight);
      canvas.style.height = canvas.height + 'px';
      initStars();
    }

    function initStars() {
      stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: (Math.random() - 0.5) * canvas.width * 2.2,
          y: (Math.random() - 0.5) * canvas.height * 2.2,
          z: Math.random() * 1000 + 1,
          size: Math.random() * 1.5 + 0.5,
          color: Math.random() > 0.35 ? '#ffffff' : (Math.random() > 0.5 ? '#4fd1ff' : '#a78bfa')
        });
      }
    }

    document.addEventListener('mousemove', (e) => {
      mouse.targetX = (e.clientX - window.innerWidth / 2) * 0.12;
      mouse.targetY = (e.clientY - window.innerHeight / 2) * 0.12;
    });

    function spawnShootingStar() {
      if (Math.random() < 0.04) {
        shootingStars.push({
          x: Math.random() * canvas.width * 1.4,
          y: Math.random() * (canvas.height * 0.5),
          len: Math.random() * 110 + 50,
          speed: Math.random() * 16 + 14,
          alpha: 1,
          color: Math.random() > 0.5 ? '#ffffff' : '#4fd1ff'
        });
      }
    }

    function render3DGalaxy() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      const centerX = canvas.width * 0.5 + mouse.x * 0.5;
      const centerY = Math.min(canvas.height * 0.45, 450) + mouse.y * 0.5;

      // 1. Deep Glowing Galaxy Core
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, Math.min(canvas.width, canvas.height) * 0.55);
      coreGrad.addColorStop(0, 'rgba(79, 209, 255, 0.16)');
      coreGrad.addColorStop(0.3, 'rgba(124, 108, 240, 0.11)');
      coreGrad.addColorStop(0.7, 'rgba(21, 15, 45, 0.05)');
      coreGrad.addColorStop(1, 'rgba(6, 5, 18, 0)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.min(canvas.width, canvas.height) * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // 2. TRUE 3D Flying Stars (Z-axis Projection Depth)
      for (let i = 0; i < stars.length; i++) {
        let s = stars[i];

        // Move stars closer along Z axis
        s.z -= 1.3;
        if (s.z <= 0) {
          s.z = 1000;
          s.x = (Math.random() - 0.5) * canvas.width * 2.2;
          s.y = (Math.random() - 0.5) * canvas.height * 2.2;
        }

        // 3D Perspective Projection
        const k = 400 / s.z;
        const px = (s.x + mouse.x * (1000 / s.z)) * k + canvas.width * 0.5;
        const py = (s.y + mouse.y * (1000 / s.z)) * k + canvas.height * 0.45;

        if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
          const radius = Math.max(0.3, (1 - s.z / 1000) * s.size * 2.4);
          const alpha = Math.min(1, Math.max(0.1, (1 - s.z / 1000) * 1.2));

          ctx.globalAlpha = alpha;
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fill();

          // Speed trail for fast foreground stars
          if (s.z < 220) {
            ctx.strokeStyle = s.color;
            ctx.lineWidth = radius * 0.7;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px - (px - canvas.width * 0.5) * 0.03, py - (py - canvas.height * 0.45) * 0.03);
            ctx.stroke();
          }
        }
      }

      // 3. Bright & Dynamic Shooting Stars (Stelle Cadenti)
      spawnShootingStar();
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
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x + ss.len, ss.y - ss.len * 0.7);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(render3DGalaxy);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    render3DGalaxy();
  })();
</script>
"""

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update body CSS
    content = re.sub(
        r'body\s*\{[^}]*\}',
        body_css_replacement,
        content,
        flags=re.DOTALL
    )

    # Clean all previous scripts
    content = re.sub(r'<script>\s*// High-End Assistenzaluni.*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'<script>\s*// High-End Cyberpunk Galaxy.*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'<script>\s*// Real 3D Perspective Galaxy.*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'<script>\s*\(function\(\)\s*\{\s*const canvas = document\.getElementById\(\'stars\'\);.*?\}\)\(\);\s*</script>', '', content, flags=re.DOTALL)

    if '</body>' in content and 'render3DGalaxy' not in content:
        content = content.replace('</body>', galaxy_3d_warp_script + '</body>')

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Successfully applied Real 3D Galaxy & Shooting Stars engine in {file}")
