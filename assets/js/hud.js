// 3D Holographic Wireframe Globe & Futuristic HUD Canvas Component
(function() {
  const canvas = document.getElementById('hero-hud');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height;
  let rotationY = 0;
  let rotationX = 0.2;
  const nodes = [];
  const rings = [];

  function resizeHUD() {
    const parent = canvas.parentElement;
    if (!parent) return;
    width = parent.clientWidth;
    height = Math.min(width, 380);
    canvas.width = width;
    canvas.height = height;
    initHUD();
  }

  function initHUD() {
    nodes.length = 0;
    rings.length = 0;

    const radius = Math.min(width, height) * 0.32;

    // 1. Latitude & Longitude Wireframe Nodes on Sphere
    const latLines = 8;
    const lonLines = 12;

    for (let i = 0; i <= latLines; i++) {
      const lat = (Math.PI / latLines) * i - Math.PI / 2;
      for (let j = 0; j < lonLines; j++) {
        const lon = ((Math.PI * 2) / lonLines) * j;
        nodes.push({
          x: radius * Math.cos(lat) * Math.cos(lon),
          y: radius * Math.sin(lat),
          z: radius * Math.cos(lat) * Math.sin(lon),
          lat: lat,
          lon: lon,
          pulse: Math.random() * Math.PI
        });
      }
    }

    // 2. Cyber HUD Rings
    rings.push({ r: radius * 1.25, speed: 0.008, color: 'rgba(79, 209, 255, 0.4)', dash: [8, 8] });
    rings.push({ r: radius * 1.4, speed: -0.005, color: 'rgba(124, 108, 240, 0.35)', dash: [15, 10] });
    rings.push({ r: radius * 1.1, speed: 0.012, color: 'rgba(79, 209, 255, 0.25)', dash: [4, 6] });
  }

  function project3D(x, y, z) {
    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);
    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);

    // Rotate Y
    let x1 = x * cosY - z * sinY;
    let z1 = z * cosY + x * sinY;

    // Rotate X
    let y2 = y * cosX - z1 * sinX;
    let z2 = z1 * cosX + y * sinX;

    const fov = 400;
    const scale = fov / (fov + z2);
    const px = x1 * scale + width / 2;
    const py = y2 * scale + height / 2;

    return { px, py, scale, z: z2 };
  }

  function renderHUD() {
    ctx.clearRect(0, 0, width, height);

    rotationY += 0.006;
    const cx = width / 2;
    const cy = height / 2;

    // A. Draw Outer HUD Rings
    rings.forEach((ring, idx) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotationY * (idx % 2 === 0 ? 1 : -1) * 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
      ctx.setLineDash(ring.dash);
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    });

    // B. Project & Draw Sphere Wireframe Lines
    const projected = nodes.map(n => project3D(n.x, n.y, n.z));

    ctx.lineWidth = 0.8;
    for (let i = 0; i < projected.length; i++) {
      const p1 = projected[i];
      if (p1.z > 80) continue; // Back-face culling for transparency

      // Connect to neighbors
      if ((i + 1) % 12 !== 0) {
        const p2 = projected[i + 1];
        if (p2 && p2.z <= 80) {
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          const alpha = (1 - p1.z / 200) * 0.25;
          ctx.strokeStyle = `rgba(124, 108, 240, ${Math.max(0.05, alpha)})`;
          ctx.stroke();
        }
      }
    }

    // C. Draw Nodes & Pulsing Telemetry Dots
    nodes.forEach((n, idx) => {
      const p = projected[idx];
      if (p.z > 100) return;

      n.pulse += 0.03;
      const glow = Math.sin(n.pulse) * 0.4 + 0.6;
      const alpha = Math.max(0.1, (1 - p.z / 200) * glow);

      ctx.fillStyle = idx % 5 === 0 ? '#4fd1ff' : '#7c6cf0';
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.px, p.py, 2 * p.scale, 0, Math.PI * 2);
      ctx.fill();
    });

    // D. HUD Center Crosshair & Telemetry Text
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#4fd1ff';
    ctx.lineWidth = 1;

    // Crosshair corners
    const size = 16;
    ctx.beginPath();
    ctx.moveTo(cx - size, cy); ctx.lineTo(cx + size, cy);
    ctx.moveTo(cx, cy - size); ctx.lineTo(cx, cy + size);
    ctx.stroke();

    // Telemetry text overlay
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#4fd1ff';
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.fillText('NODE_SYS // ACTIVE', 12, 20);
    ctx.fillText(`LAT: ${(Math.sin(rotationY) * 45).toFixed(2)}°`, 12, 34);
    ctx.fillText(`LON: ${(Math.cos(rotationY) * 180).toFixed(2)}°`, 12, 48);

    ctx.globalAlpha = 1;
    requestAnimationFrame(renderHUD);
  }

  window.addEventListener('resize', resizeHUD);
  resizeHUD();
  renderHUD();
})();
