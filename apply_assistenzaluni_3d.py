import glob
import re

html_files = glob.glob('*.html')

body_css_replacement = """body {
    background: linear-gradient(135deg, #090a19 0%, #111029 40%, #0d162d 70%, #080718 100%);
    color: var(--ink);
    font-family: 'Sora', sans-serif;
    overflow-x: hidden;
  }"""

assistenzaluni_3d_script = """
<script>
  // High-End Assistenzaluni 3D Parallax Constellation Engine
  (function() {
    const canvas = document.getElementById('stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let particles = [];
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(document.body.scrollHeight, window.innerHeight);
      canvas.style.height = canvas.height + 'px';
      initParticles();
    }

    function initParticles() {
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 11000);
      for (let i = 0; i < count; i++) {
        const z = Math.random() * 2.2 + 0.5; // 3D depth multiplier
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: z,
          r: (Math.random() * 1.4 + 0.4) * (z * 0.65),
          vx: (Math.random() - 0.5) * 0.35 * z,
          vy: (Math.random() - 0.5) * 0.35 * z,
          alpha: Math.random() * 0.65 + 0.2,
          color: Math.random() > 0.3 ? '#ffffff' : (Math.random() > 0.5 ? '#4fd1ff' : '#7c6cf0')
        });
      }
    }

    // Parallax mouse movement tracking
    document.addEventListener('mousemove', (e) => {
      mouse.targetX = (e.clientX - window.innerWidth / 2) * 0.04;
      mouse.targetY = (e.clientY - window.innerHeight / 2) * 0.04;
    });

    let wavePhase = 0;

    function drawAssistenzaluniBackground() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      const width = canvas.width;
      const height = canvas.height;

      // 1. Organic Wavy Flow Lines (matching assistenzaluni screenshot)
      wavePhase += 0.007;
      ctx.save();
      ctx.globalAlpha = 0.4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const yOffset = height * (0.5 + i * 0.16);
        ctx.moveTo(-50, yOffset);
        
        for (let x = -50; x <= width + 50; x += 40) {
          const y = Math.sin(x * 0.0018 + wavePhase + i * 1.5) * 55 + Math.cos(x * 0.001 + wavePhase * 0.6) * 35 + yOffset;
          ctx.lineTo(x + mouse.x * (i + 1) * 0.25, y + mouse.y * (i + 1) * 0.25);
        }
        
        ctx.lineTo(width + 50, height + 50);
        ctx.lineTo(-50, height + 50);
        ctx.closePath();
        
        const grad = ctx.createLinearGradient(0, yOffset - 80, 0, height);
        if (i === 0) {
          grad.addColorStop(0, 'rgba(23, 21, 55, 0.45)');
          grad.addColorStop(1, 'rgba(9, 10, 25, 0.85)');
        } else if (i === 1) {
          grad.addColorStop(0, 'rgba(32, 26, 70, 0.35)');
          grad.addColorStop(1, 'rgba(11, 10, 26, 0.92)');
        } else {
          grad.addColorStop(0, 'rgba(16, 30, 60, 0.3)');
          grad.addColorStop(1, 'rgba(7, 6, 20, 0.98)');
        }
        ctx.fillStyle = grad;
        ctx.fill();
      }
      ctx.restore();

      // 2. Constellation Lines between neighboring star nodes
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = (particles[i].x + mouse.x * particles[i].z) - (particles[j].x + mouse.x * particles[j].z);
          const dy = (particles[i].y + mouse.y * particles[i].z) - (particles[j].y + mouse.y * particles[j].z);
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 115) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x + mouse.x * particles[i].z, particles[i].y + mouse.y * particles[i].z);
            ctx.lineTo(particles[j].x + mouse.x * particles[j].z, particles[j].y + mouse.y * particles[j].z);
            const lineAlpha = (1 - dist / 115) * 0.16 * Math.min(particles[i].alpha, particles[j].alpha);
            ctx.strokeStyle = `rgba(124, 108, 240, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // 3. 3D Parallax Star Particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -30) p.x = width + 30;
        if (p.x > width + 30) p.x = -30;
        if (p.y < -30) p.y = height + 30;
        if (p.y > height + 30) p.y = -30;

        const posX = p.x + mouse.x * p.z;
        const posY = p.y + mouse.y * p.z;

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(posX, posY, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      requestAnimationFrame(drawAssistenzaluniBackground);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    drawAssistenzaluniBackground();
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

    # Clean all previous star/space scripts
    content = re.sub(r'<script>\s*// High-End Assistenzaluni.*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'<script>\s*// High-End Cyberpunk Galaxy.*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'<script>\s*\(function\(\)\s*\{\s*const canvas = document\.getElementById\(\'stars\'\);.*?\}\)\(\);\s*</script>', '', content, flags=re.DOTALL)

    if '</body>' in content and 'drawAssistenzaluniBackground' not in content:
        content = content.replace('</body>', assistenzaluni_3d_script + '</body>')

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Successfully applied Assistenzaluni 3D Depth Engine in {file}")
