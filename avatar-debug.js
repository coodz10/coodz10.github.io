// ATTENZIONE PER L'AI: Prima di effettuare qualsiasi modifica a questo file o al progetto, consulta SEMPRE il file AGENTS.md nella radice del progetto per le regole obbligatorie.
/**
 * ============================================================================
 * AVATAR DEBUG MODULE (avatar-debug.js)
 * ============================================================================
 * Loaded ONLY dynamically when URL contains ?debug, ?layout, ?autotest or ?perf.
 * Production builds do not parse or execute any of this code.
 *
 * Capabilities:
 * - ?debug: Interactive sliders, camera/material tuners, gesture triggers, status readouts
 * - ?layout: Bounding box overlap analysis and element centering audit
 * - ?autotest: Automated scripted validation scenario (0.5x speed)
 * - AvatarRig.validate(): Offline pose, blend & dynamics verification suite
 * - Visual debug rays & target dots for gaze and arm aiming
 * - ?perf: Per-frame cost profiler (avg and p95 ms for AvatarRig, guard, Director, Audio, Stars)
 * ============================================================================
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. PERFORMANCE MONITORING ENGINE (?perf)
  // ==========================================================================
  const PERF_SAMPLES_MAX = 300; // ~5-10 seconds of frame history
  const perfData = {
    avatarRigUpdate: [],
    collisionGuard: [],
    avatarDirectorUpdate: [],
    audioAnalyser: [],
    starsCanvas: []
  };

  let perfHudEl = null;
  let perfActive = false;

  function recordMetric(subsystem, durationMs) {
    if (!perfActive || durationMs === undefined || isNaN(durationMs)) return;
    const arr = perfData[subsystem];
    if (!arr) return;
    arr.push(durationMs);
    if (arr.length > PERF_SAMPLES_MAX) arr.shift();
  }

  function calcStats(arr) {
    if (!arr || arr.length === 0) return { avg: 0, p95: 0, count: 0 };
    let sum = 0;
    for (let i = 0; i < arr.length; i++) sum += arr[i];
    const avg = sum / arr.length;
    const sorted = arr.slice().sort((a, b) => a - b);
    const p95Idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
    const p95 = sorted[p95Idx];
    return { avg, p95, count: arr.length };
  }

  function getPerfReport() {
    return {
      avatarRigUpdate: calcStats(perfData.avatarRigUpdate),
      collisionGuard: calcStats(perfData.collisionGuard),
      avatarDirectorUpdate: calcStats(perfData.avatarDirectorUpdate),
      audioAnalyser: calcStats(perfData.audioAnalyser),
      starsCanvas: calcStats(perfData.starsCanvas)
    };
  }

  function createPerfHUD() {
    if (perfHudEl || typeof document === 'undefined') return;
    perfHudEl = document.createElement('div');
    perfHudEl.id = 'perf-mon-hud';
    perfHudEl.style.position = 'fixed';
    perfHudEl.style.top = '1rem';
    perfHudEl.style.right = '1rem';
    perfHudEl.style.zIndex = '999999';
    perfHudEl.style.background = 'rgba(5, 6, 15, 0.92)';
    perfHudEl.style.border = '1px solid rgba(94, 168, 255, 0.5)';
    perfHudEl.style.padding = '0.75rem 1rem';
    perfHudEl.style.color = '#e8eaff';
    perfHudEl.style.fontFamily = 'monospace';
    perfHudEl.style.fontSize = '0.75rem';
    perfHudEl.style.lineHeight = '1.6';
    perfHudEl.style.pointerEvents = 'none';
    perfHudEl.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
    document.body.appendChild(perfHudEl);

    setInterval(() => {
      if (!perfHudEl) return;
      const r = getPerfReport();
      const f = (n) => n.toFixed(3) + ' ms';
      perfHudEl.innerHTML = `
        <div style="color:#5ea8ff;font-weight:bold;margin-bottom:0.25rem;">[ PERF MONITOR ] (avg / p95)</div>
        <div>AvatarRig.update:    ${f(r.avatarRigUpdate.avg)} / ${f(r.avatarRigUpdate.p95)}</div>
        <div>Collision Guard:     ${f(r.collisionGuard.avg)} / ${f(r.collisionGuard.p95)}</div>
        <div>AvatarDirector:      ${f(r.avatarDirectorUpdate.avg)} / ${f(r.avatarDirectorUpdate.p95)}</div>
        <div>Audio Analyser:      ${f(r.audioAnalyser.avg)} / ${f(r.audioAnalyser.p95)}</div>
        <div>Stars Canvas:        ${f(r.starsCanvas.avg)} / ${f(r.starsCanvas.p95)}</div>
        <div style="color:#7c83a8;font-size:0.68rem;margin-top:0.35rem;">Samples: ${r.avatarRigUpdate.count} frames</div>
      `;
    }, 400);
  }

  function initPerfMonitor() {
    perfActive = true;
    createPerfHUD();

    // Hook AvatarRig.update
    if (window.AvatarRig && typeof window.AvatarRig.update === 'function') {
      const origRig = window.AvatarRig.update;
      window.AvatarRig.update = function (dt) {
        const t0 = performance.now();
        origRig.call(this, dt);
        const cost = performance.now() - t0;
        recordMetric('avatarRigUpdate', cost);

        if (typeof window.AvatarRig.getLastGuardCost === 'function') {
          recordMetric('collisionGuard', window.AvatarRig.getLastGuardCost());
        }
      };
    }

    // Hook AvatarDirector.update
    if (window.AvatarDirector && typeof window.AvatarDirector.update === 'function') {
      const origDir = window.AvatarDirector.update;
      window.AvatarDirector.update = function (dt) {
        const t0 = performance.now();
        origDir.call(this, dt);
        const cost = performance.now() - t0;
        recordMetric('avatarDirectorUpdate', cost);

        if (typeof window.AvatarDirector.getLastAudioCost === 'function') {
          recordMetric('audioAnalyser', window.AvatarDirector.getLastAudioCost());
        }
      };
    }

    // Hook Stars Canvas
    if (typeof window.__hookStarsRender === 'function') {
      window.__hookStarsRender((cost) => {
        recordMetric('starsCanvas', cost);
      });
    }
  }

  // ==========================================================================
  // 2. OFFLINE VALIDATION SUITE (AvatarRig.validate())
  // ==========================================================================
  function validateRig() {
    console.log('\n======================================================');
    console.log(' [AvatarRig.validate()] - Rig Verification & Acceptance');
    console.log('======================================================\n');

    const rig = window.AvatarRig;
    if (!rig) {
      console.warn('[AvatarDebug] Error: AvatarRig not available.');
      return { passes: false, error: 'AvatarRig not available' };
    }

    const playerRef = rig.getPlayerObject();
    const skinRef = playerRef ? playerRef.skin : null;
    if (!skinRef || !playerRef) {
      console.warn('[AvatarDebug] Error: Rig not initialized. Cannot validate.');
      return { passes: false, error: 'Not initialized' };
    }

    const poseNames = rig.getPoseNames ? rig.getPoseNames() : Object.keys(rig.POSES || {});
    const testYaws = [-0.65, 0, 0.65];
    const reportRows = [];
    let allPassed = true;

    const JOINT_NAMES = ['head', 'body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    const JOINT_COUNT = 6;
    const DOF_COUNT = 18;

    // Check collision helper
    const checkAnyCol = () => {
      const meshes = rig.getInnerMeshes();
      if (!meshes) return false;
      const pairs = [
        ['leftArm', 'body'],
        ['rightArm', 'body'],
        ['leftLeg', 'rightLeg'],
        ['leftArm', 'leftLeg'],
        ['rightArm', 'rightLeg'],
        ['leftArm', 'head'],
        ['rightArm', 'head']
      ];
      for (let p of pairs) {
        const mA = meshes[p[0]];
        const mB = meshes[p[1]];
        if (mA && mB && rig.testPairCollision(mA, mB)) return true;
      }
      return false;
    };

    // 1. Static Poses x 3 Yaws
    poseNames.forEach((name) => {
      const pArr = rig.POSES[name];
      if (!pArr) return;
      testYaws.forEach((yaw) => {
        for (let j = 0; j < JOINT_COUNT; j++) {
          const obj = skinRef[JOINT_NAMES[j]];
          if (obj) obj.rotation.set(pArr[j * 3 + 0], pArr[j * 3 + 1], pArr[j * 3 + 2]);
        }
        playerRef.rotation.y = yaw;
        playerRef.updateMatrixWorld(true);

        const beforeCollision = checkAnyCol();
        const resolved = rig.resolvePoseCollisions(new Float32Array(pArr));
        for (let j = 0; j < JOINT_COUNT; j++) {
          const obj = skinRef[JOINT_NAMES[j]];
          if (obj) obj.rotation.set(resolved[j * 3 + 0], resolved[j * 3 + 1], resolved[j * 3 + 2]);
        }
        playerRef.updateMatrixWorld(true);
        const afterCollision = checkAnyCol();

        if (afterCollision) allPassed = false;

        reportRows.push({
          type: 'STATIC POSE',
          test: `${name} (yaw: ${yaw})`,
          beforeResolver: beforeCollision ? 'COLLISION' : 'CLEAN',
          afterResolver: afterCollision ? 'FAIL (COLLISION)' : 'PASS (CLEAN)',
          maxVel: '0.00 rad/s',
          maxJump: '0.00 rad'
        });
      });
    });

    // 2. Pose Transitions at 25%, 50%, 75% Blends
    for (let i = 0; i < poseNames.length; i++) {
      for (let k = i + 1; k < poseNames.length; k++) {
        const pA = rig.POSES[poseNames[i]];
        const pB = rig.POSES[poseNames[k]];
        if (!pA || !pB) continue;

        [0.25, 0.50, 0.75].forEach((blend) => {
          const blendArr = new Float32Array(DOF_COUNT);
          for (let dof = 0; dof < DOF_COUNT; dof++) {
            blendArr[dof] = pA[dof] * (1 - blend) + pB[dof] * blend;
          }

          for (let j = 0; j < JOINT_COUNT; j++) {
            const obj = skinRef[JOINT_NAMES[j]];
            if (obj) obj.rotation.set(blendArr[j * 3 + 0], blendArr[j * 3 + 1], blendArr[j * 3 + 2]);
          }
          playerRef.updateMatrixWorld(true);

          const beforeCol = checkAnyCol();
          const resolved = rig.resolvePoseCollisions(blendArr);
          for (let j = 0; j < JOINT_COUNT; j++) {
            const obj = skinRef[JOINT_NAMES[j]];
            if (obj) obj.rotation.set(resolved[j * 3 + 0], resolved[j * 3 + 1], resolved[j * 3 + 2]);
          }
          playerRef.updateMatrixWorld(true);
          const afterCol = checkAnyCol();

          if (afterCol) allPassed = false;

          reportRows.push({
            type: 'TRANSITION BLEND',
            test: `${poseNames[i]} -> ${poseNames[k]} (${Math.round(blend * 100)}%)`,
            beforeResolver: beforeCol ? 'COLLISION' : 'CLEAN',
            afterResolver: afterCol ? 'FAIL (COLLISION)' : 'PASS (CLEAN)',
            maxVel: 'N/A',
            maxJump: '0.00 rad'
          });
        });
      }
    }

    // 3. Simulated Dynamic 3s Transition: rate limits & continuity test
    let simMaxVel = 0;
    let simMaxAccel = 0;
    let simMaxJump = 0;
    const simSteps = 180; // 3 seconds at 60Hz
    const simDt = 1 / 60;

    rig.setPose('reach');
    for (let s = 0; s < simSteps; s++) {
      const prevVals = rig.getJointValues();
      const prevJoints = new Float32Array(prevVals.joints);
      rig.update(simDt);
      const curVals = rig.getJointValues();
      for (let dof = 0; dof < DOF_COUNT; dof++) {
        const jump = Math.abs(curVals.joints[dof] - prevJoints[dof]);
        const vel = jump / simDt;
        if (vel > simMaxVel) simMaxVel = vel;
        if (jump > simMaxJump) simMaxJump = jump;
      }
    }

    const rateExceeded = simMaxVel > 9.5;
    const discontinuityDetected = simMaxJump > 0.15;
    if (rateExceeded || discontinuityDetected) allPassed = false;

    reportRows.push({
      type: 'SIMULATION 3s',
      test: 'float -> reach transition dynamics',
      beforeResolver: 'CLEAN',
      afterResolver: (rateExceeded || discontinuityDetected) ? 'FAIL' : 'PASS',
      maxVel: `${simMaxVel.toFixed(2)} rad/s (${rateExceeded ? 'EXCEEDED' : 'OK'})`,
      maxAccel: `${(simMaxVel / simDt).toFixed(1)} rad/s²`,
      maxJump: `${simMaxJump.toFixed(3)} rad (${discontinuityDetected ? 'DISCONTINUITY' : 'OK'})`
    });

    console.table(reportRows);
    console.log(`\n>>> OVERALL VALIDATION RESULT: [ ${allPassed ? 'ACCEPTED (ALL CHECKS PASSED)' : 'REJECTED (ISSUES DETECTED)'} ]\n`);

    return { passes: allPassed, report: reportRows };
  }

  // ==========================================================================
  // 3. VISUAL DEBUG RAYS & DOTS (?debug)
  // ==========================================================================
  let debugOverlayCanvas = null;
  let debugOverlayCtx = null;

  function initDebugCanvas() {
    if (debugOverlayCanvas) return;
    debugOverlayCanvas = document.createElement('canvas');
    debugOverlayCanvas.id = 'debug-director-canvas';
    debugOverlayCanvas.style.position = 'fixed';
    debugOverlayCanvas.style.inset = '0';
    debugOverlayCanvas.style.width = '100vw';
    debugOverlayCanvas.style.height = '100vh';
    debugOverlayCanvas.style.pointerEvents = 'none';
    debugOverlayCanvas.style.zIndex = '99999';
    document.body.appendChild(debugOverlayCanvas);
    debugOverlayCtx = debugOverlayCanvas.getContext('2d');
  }

  function renderDebugRays() {
    initDebugCanvas();
    if (!debugOverlayCanvas || !debugOverlayCtx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    if (debugOverlayCanvas.width !== w || debugOverlayCanvas.height !== h) {
      debugOverlayCanvas.width = w;
      debugOverlayCanvas.height = h;
    }

    debugOverlayCtx.clearRect(0, 0, w, h);

    const dir = window.AvatarDirector;
    if (!dir) return;
    const status = dir.getStatus();
    const player = window.AvatarRig ? window.AvatarRig.getPlayerObject() : null;
    const skinViewer = window.skinViewer;
    if (!player || !player.skin || !skinViewer || !skinViewer.camera) return;

    // Head ray: cyan
    if (player.skin.head && status.targetScreen) {
      const headPos = player.position.clone();
      player.skin.head.getWorldPosition(headPos);
      headPos.project(skinViewer.camera);

      const hx = (headPos.x * 0.5 + 0.5) * w;
      const hy = (-headPos.y * 0.5 + 0.5) * h;

      debugOverlayCtx.strokeStyle = 'rgba(94, 168, 255, 0.7)';
      debugOverlayCtx.lineWidth = 2;
      debugOverlayCtx.setLineDash([4, 4]);
      debugOverlayCtx.beginPath();
      debugOverlayCtx.moveTo(hx, hy);
      debugOverlayCtx.lineTo(status.targetScreen.x, status.targetScreen.y);
      debugOverlayCtx.stroke();
      debugOverlayCtx.setLineDash([]);

      debugOverlayCtx.fillStyle = '#5ea8ff';
      debugOverlayCtx.beginPath();
      debugOverlayCtx.arc(status.targetScreen.x, status.targetScreen.y, 4, 0, Math.PI * 2);
      debugOverlayCtx.fill();
    }
  }

  // ==========================================================================
  // 4. AUTOTEST SUITE (?autotest)
  // ==========================================================================
  const autotestMetrics = {
    running: false,
    startTime: 0,
    collisions: 0,
    maxJointSpeed: 0,
    maxFrameJump: 0,
    gestureCount: 0,
    gesturesDuringFlight: 0,
    unblendedPops: 0,
    lastAngles: new Float32Array(18)
  };

  function runAutoTest() {
    console.log('\n======================================================');
    console.log(' [AvatarDirector.runAutoTest()] - Automated Verification');
    console.log(' Running scripted scenario at 0.5x speed...');
    console.log('======================================================\n');

    const rig = window.AvatarRig;
    const dir = window.AvatarDirector;
    if (!rig || !dir) {
      console.warn('[AvatarDebug] Rig or Director missing for autotest.');
      return;
    }

    rig.setSlowMo(0.5);

    autotestMetrics.running = true;
    autotestMetrics.startTime = performance.now();
    autotestMetrics.collisions = 0;
    autotestMetrics.maxJointSpeed = 0;
    autotestMetrics.maxFrameJump = 0;
    autotestMetrics.gestureCount = 0;
    autotestMetrics.gesturesDuringFlight = 0;
    autotestMetrics.unblendedPops = 0;

    const initVals = rig.getJointValues();
    for (let i = 0; i < 18; i++) {
      autotestMetrics.lastAngles[i] = initVals.joints[i];
    }

    // Hook Director update for autotest tracking
    const origDirUpdate = dir.update;
    dir.update = function (dt) {
      origDirUpdate.call(this, dt);
      if (autotestMetrics.running) {
        const vals = rig.getJointValues();
        if (vals.isColliding) autotestMetrics.collisions++;
        const safeDt = Math.max(0.001, dt);
        for (let i = 0; i < 18; i++) {
          const cur = vals.joints[i];
          const prev = autotestMetrics.lastAngles[i];
          const diff = Math.abs(cur - prev);
          const speed = diff / safeDt;
          if (speed > autotestMetrics.maxJointSpeed) autotestMetrics.maxJointSpeed = speed;
          const frameJump = (safeDt <= 0.025) ? diff : (diff / safeDt) * (1 / 60);
          if (frameJump > autotestMetrics.maxFrameJump) autotestMetrics.maxFrameJump = frameJump;
          if (diff > 0.15 && speed > 7.5) autotestMetrics.unblendedPops++;
          autotestMetrics.lastAngles[i] = cur;
        }
      }
    };

    const origTriggerGesture = dir.triggerGesture;
    dir.triggerGesture = function (name, options = {}) {
      const status = dir.getStatus();
      if (status.isFlightActive && !options.allowInFlight) {
        autotestMetrics.gesturesDuringFlight++;
      }
      const res = origTriggerGesture.call(this, name, options);
      if (res && autotestMetrics.running) {
        autotestMetrics.gestureCount++;
      }
      return res;
    };

    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

    (async () => {
      // 1. Skip intro immediately
      if (typeof window.finishIntroInstant === 'function') {
        window.finishIntroInstant();
      }
      await sleep(1000);

      // 2. 5 seconds idle in home section
      console.log('Step 1: 5s home idle monitoring...');
      await sleep(5000);

      // 3. Hover home bottom buttons
      console.log('Step 2: Hovering home bottom buttons...');
      const btns = document.querySelectorAll('.home-bottom-actions button, .home-bottom-actions a');
      for (let b of btns) {
        dir.onHover(b, 'home-button');
        await sleep(1200);
        dir.onLeave(b);
        await sleep(400);
      }

      // 4. Hover hero title
      const title = document.getElementById('hero-title');
      if (title) {
        dir.onHover(title, 'hero-title');
        await sleep(1000);
        dir.onLeave(title);
        await sleep(300);
      }

      // 5. Scroll through sections
      const sectionIds = ['chi_sono', 'esperienze', 'contatti', 'home'];
      for (let secId of sectionIds) {
        console.log(`Step 3: Programmatic transition to #${secId}...`);
        const secEl = document.getElementById(secId);
        if (secEl) {
          secEl.scrollIntoView({ behavior: 'smooth' });
          dir.onSectionEnter(secId);
        }
        await sleep(3000);

        if (secId === 'esperienze') {
          const card = document.querySelector('.card-minimal');
          if (card) {
            dir.onHover(card, 'experience-row');
            await sleep(1000);
            dir.onLeave(card);
            await sleep(400);
          }
          dir.onDetailOpen('redismc');
          await sleep(1500);
          dir.onDetailClose();
          await sleep(1200);
        } else if (secId === 'contatti') {
          const row = document.querySelector('.contact-row');
          if (row) {
            dir.onHover(row, 'contact-row');
            await sleep(1000);
            dir.onClick(row, 'contact-link');
            await sleep(1200);
            dir.onLeave(row);
          }
        }
      }

      // 6. Click avatar
      console.log('Step 4: Click avatar (wave then spin)...');
      dir.onAvatarClick();
      await sleep(3500);

      // 7. Toggle audio
      console.log('Step 5: Toggle audio check...');
      dir.CONFIG.MUSIC_REACTIVE = true;
      await sleep(1000);

      autotestMetrics.running = false;
      rig.setSlowMo(1.0);

      // Print report
      console.log('\n======================================================');
      console.log(' [AvatarDirector.runAutoTest()] - FINAL REPORT');
      console.log('======================================================');
      console.log(` - Collisions Detected:         ${autotestMetrics.collisions} (Goal: 0)`);
      console.log(` - Max Joint Speed:             ${autotestMetrics.maxJointSpeed.toFixed(2)} rad/s`);
      console.log(` - Max Frame-to-Frame Jump:     ${autotestMetrics.maxFrameJump.toFixed(4)} rad (Goal: < 0.15)`);
      console.log(` - Total Gestures Executed:     ${autotestMetrics.gestureCount}`);
      console.log(` - Gestures Started in Flight:  ${autotestMetrics.gesturesDuringFlight} (Goal: 0)`);
      console.log(` - Unblended Pops:              ${autotestMetrics.unblendedPops} (Goal: 0)`);

      const pass = autotestMetrics.collisions === 0 &&
        autotestMetrics.gesturesDuringFlight === 0 &&
        autotestMetrics.unblendedPops === 0 &&
        autotestMetrics.maxFrameJump < 0.15;

      if (pass) {
        console.log('\n>> ACCEPTED: ALL CHECKS PASSED <<\n');
      } else {
        console.warn('\n>> VALIDATION WARNING: Review metrics above <<\n');
      }

      // Banner display
      const resEl = document.createElement('div');
      resEl.id = 'autotest-results-banner';
      resEl.style.position = 'fixed';
      resEl.style.bottom = '1rem';
      resEl.style.left = '1rem';
      resEl.style.padding = '0.75rem 1.25rem';
      resEl.style.background = pass ? 'rgba(10, 30, 20, 0.95)' : 'rgba(30, 10, 10, 0.95)';
      resEl.style.border = pass ? '1px solid #44ff88' : '1px solid #ff4444';
      resEl.style.color = pass ? '#44ff88' : '#ff4444';
      resEl.style.fontFamily = 'monospace';
      resEl.style.fontSize = '0.85rem';
      resEl.style.zIndex = '999999';
      resEl.innerHTML = `[ AUTOTEST: ${pass ? 'PASSED (0 COLLISIONS, 0 POPS)' : 'FAILED'} ]<br>Collisions: ${autotestMetrics.collisions} · Gestures: ${autotestMetrics.gestureCount} · MaxJump: ${autotestMetrics.maxFrameJump.toFixed(3)} rad`;
      document.body.appendChild(resEl);
    })();
  }

  // ==========================================================================
  // 5. LAYOUT AUDIT ENGINE (?layout)
  // ==========================================================================
  function runLayoutAudit(sectionId) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const viewportCenterX = vw * 0.5;
    const viewportCenterY = vh * 0.5;

    // 1. Nav Centering Audit (desktop only)
    const navBar = document.querySelector('.nav-bar');
    const navCenter = document.querySelector('.nav-center');
    let navCenteringError = 0;
    let navBottom = 0;
    if (navBar) {
      navBottom = navBar.getBoundingClientRect().bottom;
    }
    if (navCenter && vw > 768) {
      const nRect = navCenter.getBoundingClientRect();
      const navLinksGroupCenterX = nRect.left + nRect.width * 0.5;
      navCenteringError = Math.round(Math.abs(viewportCenterX - navLinksGroupCenterX) * 100) / 100;
    }

    const sections = [
      { id: 'home', slotSelector: '.home-avatar-slot', headerSelector: '.hero-title' },
      { id: 'chi_sono', slotSelector: '.about-avatar-slot', headerSelector: '.about-head' },
      { id: 'esperienze', slotSelector: '.exp-avatar-slot', headerSelector: '.exp-head' },
      { id: 'contatti', slotSelector: '.contact-avatar-slot', headerSelector: '.contact-head' }
    ];

    const targets = sectionId ? sections.filter((s) => s.id === sectionId) : sections;
    const auditResults = [];

    targets.forEach(({ id, slotSelector, headerSelector }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const secRect = el.getBoundingClientRect();
      const slot = el.querySelector(slotSelector) || el.querySelector('.avatar-slot');
      if (!slot) return;

      const slotRect = slot.getBoundingClientRect();

      const avatarBox = {
        left: slotRect.left,
        top: slotRect.top,
        right: slotRect.right,
        bottom: slotRect.bottom,
        width: slotRect.width,
        height: slotRect.height
      };

      // Header Centering Error
      const headerEl = el.querySelector(headerSelector);
      let headerCenteringError = 0;
      let headerTop = 0;
      let distanceFromNav = 0;
      if (headerEl) {
        const hr = headerEl.getBoundingClientRect();
        headerTop = Math.round(hr.top * 10) / 10;
        distanceFromNav = Math.round((hr.top - navBottom) * 10) / 10;
        if (id === 'home' || id === 'chi_sono' || id === 'contatti') {
          const headerCenterX = hr.left + hr.width * 0.5;
          const targetCenterX = secRect.left + secRect.width * 0.5;
          headerCenteringError = Math.round(Math.abs(targetCenterX - headerCenterX) * 100) / 100;
        }
      }

      // Column Top Alignment & Relative Rules
      let columnTopAlignment = 0;
      let noColumnHigherThanHeader = true;

      if (id === 'esperienze' && vw > 768) {
        const expHead = el.querySelector('.exp-head');
        const expContentCol = el.querySelector('.experiences-content-col');
        if (expHead && expContentCol) {
          const ht = expHead.getBoundingClientRect().top;
          const ct = expContentCol.getBoundingClientRect().top;
          columnTopAlignment = Math.round(Math.abs(ht - ct) * 100) / 100;
          if (ct < ht - 2) noColumnHigherThanHeader = false;
        }
      } else if (id === 'chi_sono' && vw > 768) {
        const aboutHead = el.querySelector('.about-head');
        const leftCol = el.querySelector('.about-col--left');
        const rightCol = el.querySelector('.about-col--right');
        if (aboutHead && leftCol && rightCol) {
          const ht = aboutHead.getBoundingClientRect().top;
          const lt = leftCol.getBoundingClientRect().top;
          const rt = rightCol.getBoundingClientRect().top;
          if (lt < ht - 2 || rt < ht - 2) noColumnHigherThanHeader = false;
        }
      } else if (id === 'contatti') {
        const contactHead = el.querySelector('.contact-head');
        const contactRows = el.querySelector('.contact-rows');
        if (contactHead && contactRows) {
          const ht = contactHead.getBoundingClientRect().top;
          const rt = contactRows.getBoundingClientRect().top;
          if (rt < ht - 2) noColumnHigherThanHeader = false;
        }
      }

      const textNodes = Array.from(el.querySelectorAll('h1, h2, h3, p, a, button, .section-head, .lead, .about-item, .exp-row, .contact-row, .hero-title, .hero-subtitle, .home-cta-row, .contact-foot'))
        .filter((node) => {
          if (node.closest('.section-bg-word') || node.closest('.avatar-slot')) return false;
          const r = node.getBoundingClientRect();
          if (r.width <= 0 || r.height <= 0) return false;
          const style = window.getComputedStyle(node);
          return style.visibility !== 'hidden' && style.display !== 'none';
        });

      const overlaps = [];
      textNodes.forEach((node) => {
        const nr = node.getBoundingClientRect();
        const overlapW = Math.max(0, Math.min(nr.right, avatarBox.right) - Math.max(nr.left, avatarBox.left));
        const overlapH = Math.max(0, Math.min(nr.bottom, avatarBox.bottom) - Math.max(nr.top, avatarBox.top));

        if (overlapW > 2 && overlapH > 2) {
          overlaps.push({
            element: `${node.tagName.toLowerCase()}${node.className ? '.' + String(node.className).trim().split(/\s+/).join('.') : ''}`,
            overlapWidth: Math.round(overlapW * 10) / 10,
            overlapHeight: Math.round(overlapH * 10) / 10
          });
        }
      });

      // Duplicate content & structural count regression guard
      const duplicates = [];
      const i18nCounts = {};
      el.querySelectorAll('[data-i18n]').forEach((node) => {
        const key = node.getAttribute('data-i18n');
        i18nCounts[key] = (i18nCounts[key] || 0) + 1;
      });
      Object.entries(i18nCounts).forEach(([key, count]) => {
        if (count > 1) {
          duplicates.push({ type: 'duplicate-i18n', key, count });
        }
      });

      el.querySelectorAll('*').forEach((parent) => {
        if (parent.closest('#hero-title') || parent.classList.contains('hero-title') || parent.classList.contains('eq-icon')) return;
        const children = Array.from(parent.children);
        const seenText = new Map();
        children.forEach((child) => {
          if (child.children.length > 0) return;
          if (child.classList.contains('meta-sep') && child.textContent.trim() === '·') return;
          const norm = (child.textContent || '').trim().replace(/\s+/g, ' ');
          if (!norm) return;
          if (seenText.has(norm)) {
            duplicates.push({ type: 'duplicate-sibling', parent: parent.className || parent.tagName, text: norm });
          } else {
            seenText.set(norm, true);
          }
        });
      });

      el.querySelectorAll('.about-item__header, .item-title, .section-head__tag, .section-head__title, .meta-item').forEach((node) => {
        if (node.classList.contains('about-item__header') && node.querySelectorAll('.item-title').length > 1) {
          duplicates.push({ type: 'multiple-item-titles', text: (node.textContent || '').trim().replace(/\s+/g, ' ') });
        }
        const norm = (node.textContent || '').trim().replace(/\s+/g, ' ');
        if (/^(.{3,}?)\s+\1$/i.test(norm)) {
          duplicates.push({ type: 'repeated-label', text: norm });
        }
      });

      const counts = {
        headers: el.querySelectorAll('.section-head').length,
        headerTags: el.querySelectorAll('.section-head__tag').length,
        headerTitles: el.querySelectorAll('.section-head__title').length,
        leads: el.querySelectorAll('.lead').length,
        aboutItems: el.querySelectorAll('.about-item').length
      };

      if (id === 'chi_sono' || id === 'esperienze' || id === 'contatti') {
        if (counts.headers !== 1 || counts.headerTags !== 1 || counts.headerTitles !== 1) {
          duplicates.push({ type: 'header-count-mismatch', counts });
        }
      }
      if (id === 'chi_sono' && (counts.leads !== 1 || counts.aboutItems !== 3)) {
        duplicates.push({ type: 'chi-sono-structure-mismatch', counts });
      }

      if (duplicates.length > 0) {
        console.error('[LayoutAudit] Duplicate content detected in #' + id, duplicates);
      }

      const sectionPasses = (
        overlaps.length === 0 &&
        duplicates.length === 0 &&
        headerCenteringError <= 2 &&
        columnTopAlignment <= 2 &&
        (vw <= 768 || navCenteringError <= 2) &&
        noColumnHigherThanHeader
      );

      auditResults.push({
        section: id,
        viewport: { width: vw, height: vh },
        navCenteringError,
        headerCenteringError,
        columnTopAlignment,
        headerTop,
        distanceFromNav,
        noColumnHigherThanHeader,
        overlaps,
        hasOverlaps: overlaps.length > 0,
        duplicates,
        counts,
        passesAudit: sectionPasses
      });
    });

    return sectionId ? auditResults[0] : auditResults;
  }

  function initLayoutAuditOverlay() {
    let auditCanvas = document.getElementById('layout-audit-canvas');
    if (!auditCanvas) {
      auditCanvas = document.createElement('canvas');
      auditCanvas.id = 'layout-audit-canvas';
      auditCanvas.style.position = 'fixed';
      auditCanvas.style.inset = '0';
      auditCanvas.style.width = '100vw';
      auditCanvas.style.height = '100vh';
      auditCanvas.style.pointerEvents = 'none';
      auditCanvas.style.zIndex = '99998';
      document.body.appendChild(auditCanvas);
    }

    const ctx = auditCanvas.getContext('2d');
    const vw = (auditCanvas.width = window.innerWidth);
    const vh = (auditCanvas.height = window.innerHeight);

    ctx.clearRect(0, 0, vw, vh);

    const slots = document.querySelectorAll('.avatar-slot');
    slots.forEach((slot) => {
      const r = slot.getBoundingClientRect();
      ctx.strokeStyle = 'rgba(94, 168, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(r.left, r.top, r.width, r.height);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(94, 168, 255, 0.08)';
      ctx.fillRect(r.left, r.top, r.width, r.height);
    });
  }

  // ==========================================================================
  // 6. DEBUG HELPER PANEL (?debug)
  // ==========================================================================
  function initDebugHelper() {
    if (document.getElementById('avatar-debug-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'avatar-debug-panel';
    panel.className = 'avatar-debug-panel mono';
    panel.style.position = 'fixed';
    panel.style.top = '1rem';
    panel.style.left = '1rem';
    panel.style.zIndex = '999990';
    panel.style.background = 'rgba(5, 6, 15, 0.94)';
    panel.style.border = '1px solid rgba(124, 131, 168, 0.35)';
    panel.style.padding = '1rem';
    panel.style.color = '#e8eaff';
    panel.style.fontSize = '0.75rem';
    panel.style.maxHeight = '90vh';
    panel.style.overflowY = 'auto';
    panel.style.boxShadow = '0 8px 32px rgba(0,0,0,0.6)';

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;border-bottom:1px solid rgba(124,131,168,0.25);padding-bottom:0.5rem;">
        <span style="color:#5ea8ff;font-weight:bold;">[ AVATAR DEBUG ]</span>
        <button id="debug-close-btn" style="background:transparent;border:none;color:#7c83a8;cursor:pointer;font-family:monospace;">[ X ]</button>
      </div>

      <div style="margin-bottom:0.75rem;">
        <div style="color:#7c83a8;font-size:0.7rem;margin-bottom:0.35rem;">GESTURES:</div>
        <div style="display:flex;flex-wrap:wrap;gap:0.3rem;" id="debug-gesture-buttons">
          ${['wave', 'point', 'present', 'nod', 'tilt', 'lookAround', 'stretch', 'settle', 'spin'].map(g => `<button class="debug-g-btn cursor-pointer" data-gesture="${g}" style="background:rgba(94,168,255,0.12);border:1px solid rgba(94,168,255,0.3);color:#e8eaff;padding:0.2rem 0.4rem;font-size:0.68rem;font-family:monospace;">[ ${g} ]</button>`).join('')}
        </div>
      </div>

      <div style="margin-bottom:0.75rem;">
        <div style="color:#7c83a8;font-size:0.7rem;margin-bottom:0.35rem;">TUNING SLIDERS:</div>
        <div style="display:flex;flex-direction:column;gap:0.4rem;">
          <label style="display:flex;justify-content:space-between;align-items:center;color:#e8eaff;font-size:0.68rem;">
            <span>Aura Strength:</span>
            <span id="debug-aura-val">${(window.CONFIG && typeof window.CONFIG.AURA === 'number') ? window.CONFIG.AURA.toFixed(2) : '1.00'}</span>
            <input type="range" id="debug-aura-slider" min="0" max="1" step="0.05" value="${(window.CONFIG && window.CONFIG.AURA) || 1.0}" style="width:90px;">
          </label>
          <label style="display:flex;justify-content:space-between;align-items:center;color:#e8eaff;font-size:0.68rem;">
            <span>BG Word Opacity:</span>
            <span id="debug-bg-val">${(window.CONFIG && typeof window.CONFIG.BG_WORD_OPACITY === 'number') ? window.CONFIG.BG_WORD_OPACITY.toFixed(2) : '1.00'}</span>
            <input type="range" id="debug-bg-slider" min="0" max="1" step="0.05" value="${(window.CONFIG && typeof window.CONFIG.BG_WORD_OPACITY === 'number') ? window.CONFIG.BG_WORD_OPACITY : 1.0}" style="width:90px;">
          </label>
          <label style="display:flex;justify-content:space-between;align-items:center;color:#e8eaff;font-size:0.68rem;">
            <span>BG Word Width (vw):</span>
            <span id="debug-bg-width-val">${(window.CONFIG && typeof window.CONFIG.BG_WORD_WIDTH_VW === 'number') ? window.CONFIG.BG_WORD_WIDTH_VW : 88}vw</span>
            <input type="range" id="debug-bg-width-slider" min="50" max="96" step="1" value="${(window.CONFIG && typeof window.CONFIG.BG_WORD_WIDTH_VW === 'number') ? window.CONFIG.BG_WORD_WIDTH_VW : 88}" style="width:90px;">
          </label>
        </div>
      </div>

      <div style="margin-bottom:0.75rem;">
        <div style="color:#7c83a8;font-size:0.7rem;margin-bottom:0.35rem;">TESTS & TOOLS:</div>
        <div style="display:flex;gap:0.4rem;">
          <button id="debug-run-val-btn" style="background:rgba(94,168,255,0.15);border:1px solid #5ea8ff;color:#5ea8ff;padding:0.25rem 0.5rem;font-family:monospace;cursor:pointer;">[ Validate Rig ]</button>
          <button id="debug-run-auto-btn" style="background:rgba(94,168,255,0.15);border:1px solid #5ea8ff;color:#5ea8ff;padding:0.25rem 0.5rem;font-family:monospace;cursor:pointer;">[ Run Autotest ]</button>
          <button id="debug-toggle-rays-btn" style="background:rgba(94,168,255,0.15);border:1px solid #5ea8ff;color:#5ea8ff;padding:0.25rem 0.5rem;font-family:monospace;cursor:pointer;">[ Toggle Rays ]</button>
        </div>
      </div>

      <div style="margin-top:0.75rem;border-top:1px solid rgba(124,131,168,0.2);padding-top:0.5rem;">
        <div style="color:#7c83a8;font-size:0.7rem;margin-bottom:0.25rem;">LIVE STATE:</div>
        <pre id="debug-live-status" style="margin:0;font-size:0.68rem;color:#7c83a8;white-space:pre-wrap;"></pre>
      </div>
    `;

    document.body.appendChild(panel);

    // Close button
    document.getElementById('debug-close-btn').addEventListener('click', () => {
      panel.style.display = 'none';
    });

    // Gesture triggers
    panel.querySelectorAll('.debug-g-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const g = btn.dataset.gesture;
        if (window.AvatarDirector) window.AvatarDirector.triggerGesture(g, { force: true });
      });
    });

    // Validate button
    document.getElementById('debug-run-val-btn').addEventListener('click', () => {
      validateRig();
    });

    // Autotest button
    document.getElementById('debug-run-auto-btn').addEventListener('click', () => {
      runAutoTest();
    });

    // Rays toggle
    let raysActive = false;
    document.getElementById('debug-toggle-rays-btn').addEventListener('click', () => {
      raysActive = !raysActive;
      if (window.AvatarDirector && window.AvatarDirector.CONFIG) {
        window.AvatarDirector.CONFIG.DEBUG_RAYS = raysActive;
      }
      if (!raysActive && debugOverlayCtx) {
        debugOverlayCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    });

    // Tuning sliders
    const auraSlider = document.getElementById('debug-aura-slider');
    if (auraSlider) {
      auraSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (window.CONFIG) window.CONFIG.AURA = val;
        const valEl = document.getElementById('debug-aura-val');
        if (valEl) valEl.textContent = val.toFixed(2);
        if (window.__updateAvatarAura) window.__updateAvatarAura();
      });
    }

    const bgSlider = document.getElementById('debug-bg-slider');
    if (bgSlider) {
      bgSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (window.CONFIG) window.CONFIG.BG_WORD_OPACITY = val;
        const valEl = document.getElementById('debug-bg-val');
        if (valEl) valEl.textContent = val.toFixed(2);
        if (window.__applyBgWordOpacity) window.__applyBgWordOpacity();
      });
    }

    const bgWidthSlider = document.getElementById('debug-bg-width-slider');
    if (bgWidthSlider) {
      bgWidthSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (window.CONFIG) window.CONFIG.BG_WORD_WIDTH_VW = val;
        const valEl = document.getElementById('debug-bg-width-val');
        if (valEl) valEl.textContent = val + 'vw';
        if (window.__fitBgWords) window.__fitBgWords();
      });
    }

    // Live state updater
    const statusPre = document.getElementById('debug-live-status');
    setInterval(() => {
      if (!statusPre || panel.style.display === 'none') return;
      if (window.AvatarDirector) {
        const s = window.AvatarDirector.getStatus();
        statusPre.textContent = JSON.stringify(s, null, 2);
      }
    }, 250);
  }

  // ==========================================================================
  // EXPORT TO WINDOW.AvatarDebug
  // ==========================================================================
  window.AvatarDebug = {
    validateRig,
    runAutoTest,
    renderDebugRays,
    runLayoutAudit,
    initLayoutAuditOverlay,
    initDebugHelper,
    initPerfMonitor,
    getPerfReport,
    recordMetric,
    isPerfActive: () => perfActive
  };

  window.__layoutAudit = runLayoutAudit;

  // Wire back into AvatarRig and AvatarDirector
  if (window.AvatarRig) {
    window.AvatarRig.validate = validateRig;
  }
  if (window.AvatarDirector) {
    window.AvatarDirector.runAutoTest = runAutoTest;
  }

  // Auto-init based on URL parameters
  const params = new URLSearchParams(window.location.search);
  if (params.has('debug')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initDebugHelper);
    } else {
      initDebugHelper();
    }
  }

  if (params.has('layout')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initLayoutAuditOverlay);
    } else {
      initLayoutAuditOverlay();
    }
  }

  if (params.has('perf')) {
    initPerfMonitor();
  }

  if (params.has('autotest')) {
    if (document.readyState === 'complete') {
      setTimeout(runAutoTest, 1200);
    } else {
      window.addEventListener('load', () => {
        setTimeout(runAutoTest, 1200);
      });
    }
  }

})();
