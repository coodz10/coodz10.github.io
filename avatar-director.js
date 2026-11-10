// ATTENZIONE PER L'AI: Prima di effettuare qualsiasi modifica a questo file o al progetto, consulta SEMPRE il file AGENTS.md nella radice del progetto per le regole obbligatorie.

/**
 * ============================================================================
 * AVATAR DIRECTOR - GAZE, AIM, GESTURES AND CONTEXT BEHAVIOR ENGINE
 * ============================================================================
 * Namespace: window.AvatarDirector
 * Built on top of window.AvatarRig.
 *
 * Responsibilities:
 * 1. Solvers:
 *    - screenToModelDirection(screenPoint, jointObject): Inverts stage CSS transform,
 *      unprojects through skinViewer.camera onto plane parallel to camera, transforms
 *      to joint parent local space.
 *    - aimArm(side, screenPoint): Closed-form 2 DOF solver for pointing arm (Euler XYZ, Ry=0),
 *      converted to anatomical (raise, spread).
 *    - lookAt(screenPoint): Head yaw & pitch solver with 120ms torso sharing when head yaw > 25°.
 * 2. Gesture Clips:
 *    - Priority queue with joint masks, anticipation, minimum-jerk curves, decaying oscillations,
 *      and soft release easing.
 *    - Library: wave, point, present, nod, tilt, look-around, stretch, settle, spin.
 * 3. Context Behavior Engine:
 *    - Intro: fly-in, pen writing gaze & aim, glide-settle, arrival wave.
 *    - Home: float idle, periodic micro-gestures (look-around, tilt, stretch, wave),
 *      button hover look+point, title hover look, avatar click wave+spin.
 *    - Flight: velocity debouncing (80ms start, 150ms end), brake lean, landing settle,
 *      arrival gestures per section (chi_sono wave, esperienze nod, contatti wave).
 *    - Chi Sono: paragraph reading gaze scanning (left/right column), column switch presentation.
 *    - Esperienze: row hover aim+look, detail open nod, detail close settle.
 *    - Contatti: row hover aim+look, link click nod.
 *    - Music reactive sway via Web Audio AnalyserNode (low-band FFT).
 * 4. Debug & Autotest:
 *    - Visual debug rays for gaze & arm aim.
 *    - Scripted 0.5x automated validation scenario (?autotest).
 * ============================================================================
 */

(function () {
  'use strict';

  // ==========================================================================
  // CONFIGURATION CONSTANTS
  // ==========================================================================
  const CONFIG = {
    TORSO_SHARING: {
      thresholdRad: (25 * Math.PI) / 180, // 25 degrees = 0.4363 rad
      excessRatio: 0.40,                  // Body takes 40% of excess
      delaySeconds: 0.120                 // ~120 ms lag
    },
    READING: {
      fixationMinSec: 0.8,
      fixationMaxSec: 1.4,
      presentCooldownSec: 12.0
    },
    IDLE: {
      minSec: 6.0,
      maxSec: 11.0,
      cooldownSec: 3.0,
      interactionCooldownSec: 2.5
    },
    FLIGHT: {
      speedThreshold: 0.08, // vh/s normalized
      startDebounceMs: 80,
      endDebounceMs: 150
    },
    MUSIC_REACTIVE: true,
    DEBUG_RAYS: false
  };

  // Intent priorities: 0 idle, 1 ambient, 2 reaction, 3 scripted, 4 user action
  const PRIORITY_IDLE        = 0;
  const PRIORITY_AMBIENT     = 1;
  const PRIORITY_REACTION    = 2;
  const PRIORITY_SCRIPTED    = 3;
  const PRIORITY_USER_ACTION = 4;

  const PRIORITY_NAMES = ['IDLE', 'AMBIENT', 'REACTION', 'SCRIPTED', 'USER_ACTION'];

  // Joint index definitions matching AvatarRig
  const J_HEAD      = 0;
  const J_BODY      = 1;
  const J_LEFT_ARM  = 2;
  const J_RIGHT_ARM = 3;
  const J_LEFT_LEG  = 4;
  const J_RIGHT_LEG = 5;
  const DOF_COUNT   = 18;

  // Preallocated Three.js Vector3 instances for zero GC in solvers
  let V3 = null;
  let vNear = null;
  let vFar = null;
  let rayDir = null;
  let rayOrigin = null;
  let jointWorldPos = null;
  let camNormal = null;
  let localHit = null;
  let tempDir = null;
  let scratchVecA = null;
  let scratchInvBodyQuat = null;

  function initVectors() {
    if (V3) return;
    const skinViewer = getSkinViewer();
    if (skinViewer && skinViewer.camera && skinViewer.camera.position) {
      V3 = skinViewer.camera.position.constructor;
      vNear = new V3();
      vFar = new V3();
      rayDir = new V3();
      rayOrigin = new V3();
      jointWorldPos = new V3();
      camNormal = new V3();
      localHit = new V3();
      tempDir = new V3();
      scratchVecA = new V3();
    }
    if (!scratchInvBodyQuat && skinViewer && skinViewer.playerObject && skinViewer.playerObject.quaternion) {
      scratchInvBodyQuat = new (skinViewer.playerObject.quaternion.constructor)();
    }
  }

  // Stage transform cache (updated from main.js every frame, zero layout reads in loop)
  const stageTransform = {
    x: 0,
    y: 0,
    scale: 1.0,
    roll: 0,
    bobY: 0,
    bobRoll: 0
  };

  // Target look coordinates (screen space)
  const defaultCenter = {
    x: (typeof window !== 'undefined' ? window.innerWidth * 0.5 : 960),
    y: (typeof window !== 'undefined' ? window.innerHeight * 0.5 : 540)
  };
  let lookTargetScreen = { x: defaultCenter.x, y: defaultCenter.y };
  let lookTargetSmooth = { x: defaultCenter.x, y: defaultCenter.y };
  let lookMode = 'ambient'; // 'mouse', 'reading', 'element', 'fixed', 'intro'

  // Look-at angles
  let currentHeadYaw = 0;
  let currentHeadPitch = 0;
  let currentBodyYaw = 0;
  let targetBodyYaw = 0;

  // Aim arm angles (right arm default)
  let aimedArmState = {
    side: 'right',
    active: false,
    raise: 0,
    spread: 0,
    weight: 0,
    screenTarget: { x: 0, y: 0 }
  };

  // Gesture system state
  let activeGestures = []; // array of active gesture instances
  const gestureHistory = new Map(); // name -> last trigger timestamp

  // Director intent stack
  const intentStack = []; // items: { id, priority, type, data, startTime, blendWeight }

  // Section & reading tracking
  let currentSectionId = 'home';
  let isDetailOpen = false;
  let readingState = {
    active: false,
    column: 'left',
    paragraphIdx: 0,
    fixationIdx: 0,
    totalFixations: 4,
    timer: 0,
    nextDuration: 1.0,
    lastPresentTime: 0
  };

  // Flight coupling tracking
  let isFlightActive = false;
  let flightSpeedTimer = 0;
  let flightBelowTimer = 0;
  let stageSpeed = 0;

  // Idle timer
  let idleTimer = 0;
  let nextIdleInterval = 7.0;
  let lastUserInteractionTime = performance.now() / 1000;
  let lastIdleGestureName = null;

  // Touch and accessibility detection
  let isTouchDevice = false;
  let prefersReducedMotion = false;
  try {
    isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  // Web Audio Analyser
  let audioAnalyser = null;
  let audioCtxRef = null;
  let audioFreqBuffer = null;
  let smoothedAudioEnergy = 0;

  // Preallocated overlay arrays for AvatarRig
  const directorOverrides = new Float32Array(DOF_COUNT);
  const directorWeights   = new Float32Array(DOF_COUNT);

  // Reusable scratch vectors and result structs for zero per-frame allocations
  const sharedDirResult = { x: 0, y: 0, z: 1 };
  const sharedAimResult = { raise: 0, spread: 0.30, twist: 0 };
  const sharedLookResult = { yaw: 0, pitch: 0, bodyYaw: 0 };
  const hoverPointTarget = { x: 0, y: 0 };
  const hoverPointContext = { pointTarget: hoverPointTarget };

  // Audio measurement state (20 Hz budget)
  let audioSource = null;
  let lastAudioTimeMs = 0;
  let lastAudioCostMs = 0;

  // Cached reading target coordinates (recomputed on resize/i18n/fonts)
  const cachedReadingTargets = {
    left: [],
    right: []
  };

  // ==========================================================================
  // HELPER: ACCESS RIG & VIEWER
  // ==========================================================================
  function getRig() {
    return (typeof window !== 'undefined') ? window.AvatarRig : null;
  }

  function getSkinViewer() {
    const rig = getRig();
    return rig && typeof rig.getPlayerObject === 'function' && rig.getPlayerObject()
      ? rig.getPlayerObject().parent // Three.js scene
      : (window.skinViewer || null);
  }

  function getPlayerObject() {
    const rig = getRig();
    return rig && typeof rig.getPlayerObject === 'function' ? rig.getPlayerObject() : null;
  }

  function getOutwardSign(side) {
    const rig = getRig();
    if (rig && rig.outwardSigns) {
      return (side === 'left' || side === 'l') ? rig.outwardSigns.leftArm : rig.outwardSigns.rightArm;
    }
    return (side === 'left' || side === 'l') ? 1 : -1;
  }

  // Minimum jerk interpolation: s(t) = 10t^3 - 15t^4 + 6t^5
  function minJerk(t) {
    const c = Math.max(0, Math.min(1, t));
    return c * c * c * (10 + c * (-15 + 6 * c));
  }

  // ==========================================================================
  // 1. SOLVERS
  // ==========================================================================

  /**
   * screenToModelDirection(screenPoint, jointObject, relativeToBody = false)
   * Converts a 2D screen coordinate into a normalized 3D direction vector
   * in the local space of the joint's parent object, pointing from the joint
   * pivot toward the target unprojected on the camera-facing plane.
   * If relativeToBody is true, transforms into the body's local frame.
   */
  function screenToModelDirection(screenPoint, jointObject, relativeToBody = false) {
    initVectors();
    if (!V3 || !jointObject) {
      sharedDirResult.x = 0;
      sharedDirResult.y = 0;
      sharedDirResult.z = 1;
      return sharedDirResult;
    }

    const skinViewer = window.skinViewer;
    if (!skinViewer || !skinViewer.camera) {
      sharedDirResult.x = 0;
      sharedDirResult.y = 0;
      sharedDirResult.z = 1;
      return sharedDirResult;
    }

    const camera = skinViewer.camera;
    const vw = window.innerWidth || 1920;
    const vh = window.innerHeight || 1080;
    const cx = vw * 0.5;
    const cy = vh * 0.5;

    // 1. Invert the avatar stage's CSS transform
    const tx = stageTransform.x;
    const ty = stageTransform.y + (stageTransform.bobY || 0);
    const totalRoll = stageTransform.roll + (stageTransform.bobRoll || 0);
    const scale = Math.max(0.001, stageTransform.scale || 1.0);

    const dx = screenPoint.x - cx - tx;
    const dy = screenPoint.y - cy - ty;

    // Invert roll
    const cosR = Math.cos(-totalRoll);
    const sinR = Math.sin(-totalRoll);
    const rx = dx * cosR - dy * sinR;
    const ry = dx * sinR + dy * cosR;

    // Invert scale
    const unscaledX = rx / scale;
    const unscaledY = ry / scale;

    // NDC coordinates (-1 to 1) for Three.js unprojection
    const ndcX = unscaledX / cx;
    const ndcY = -unscaledY / cy;

    // 2. Unproject near and far points
    vNear.set(ndcX, ndcY, -1).unproject(camera);
    vFar.set(ndcX, ndcY, 1).unproject(camera);

    rayDir.copy(vFar).sub(vNear).normalize();
    rayOrigin.copy(camera.position);

    // 3. Joint world position
    jointObject.getWorldPosition(jointWorldPos);

    // 4. Camera plane normal in world space
    camera.getWorldDirection(camNormal);

    // 5. Plane intersection: (rayOrigin + t * rayDir - jointWorldPos) . camNormal = 0
    const denom = rayDir.dot(camNormal);
    if (Math.abs(denom) < 1e-6) {
      sharedDirResult.x = 0;
      sharedDirResult.y = 0;
      sharedDirResult.z = 1;
      return sharedDirResult;
    }

    scratchVecA.copy(jointWorldPos).sub(rayOrigin);
    const t = scratchVecA.dot(camNormal) / denom;
    scratchVecA.copy(rayOrigin).addScaledVector(rayDir, t);

    // 6. Transform worldHit to parent local space
    const parent = jointObject.parent || jointObject;
    localHit.copy(scratchVecA);
    parent.worldToLocal(localHit);

    // 7. Subtract joint local position and normalize
    tempDir.copy(localHit).sub(jointObject.position).normalize();

    // 8. If relativeToBody is true, rotate into the torso's coordinate frame
    if (relativeToBody && scratchInvBodyQuat) {
      const p = getPlayerObject();
      if (p && p.skin && p.skin.body && p.skin.body.quaternion) {
        scratchInvBodyQuat.copy(p.skin.body.quaternion).conjugate();
        tempDir.applyQuaternion(scratchInvBodyQuat);
      }
    }

    sharedDirResult.x = tempDir.x;
    sharedDirResult.y = tempDir.y;
    sharedDirResult.z = tempDir.z;
    return sharedDirResult;
  }

  /**
   * solveAimArm(side, screenPoint)
   * Closed-form 2 DOF solver for arm aiming (Euler XYZ, Ry = 0):
   * d = (sin b, -cos b cos a, -cos b sin a) =>
   * b = asin(d.x * outwardSign-adjusted), a = atan2(-d.z, -d.y)
   * Returns anatomical { raise, spread, twist }.
   */
  function solveAimArm(side, screenPoint) {
    const player = getPlayerObject();
    if (!player || !player.skin) {
      sharedAimResult.raise = 0;
      sharedAimResult.spread = 0.12;
      sharedAimResult.twist = 0;
      return sharedAimResult;
    }

    const jointObj = (side === 'left' || side === 'l') ? player.skin.leftArm : player.skin.rightArm;
    if (!jointObj) {
      sharedAimResult.raise = 0;
      sharedAimResult.spread = 0.12;
      sharedAimResult.twist = 0;
      return sharedAimResult;
    }

    const d = screenToModelDirection(screenPoint, jointObj, true);
    const sign = getOutwardSign(side);

    // b is spread abduction, a is forward raise
    const b = Math.asin(Math.max(-0.999, Math.min(0.999, d.x * sign)));
    const a = Math.atan2(-d.z, -d.y);

    // Anatomical units in AvatarRig:
    // raise = -a (negative rotation.x raises forward horizontal)
    // spread = b * sign (positive spread is abduction away from torso)
    const rawRaise = -a;
    const rawSpread = Math.max(0.30, Math.min(1.35, b));

    // Clamp with rig anatomical limits
    const clampedRaise = Math.max(-0.40, Math.min(2.70, rawRaise));
    const clampedSpread = Math.max(0.30, Math.min(1.30, rawSpread));

    sharedAimResult.raise = clampedRaise;
    sharedAimResult.spread = clampedSpread;
    sharedAimResult.twist = (side === 'right') ? -0.10 : 0.10;
    return sharedAimResult;
  }

  /**
   * solveLookAt(screenPoint)
   * Look-at for the head:
   * yaw = asin(d.x), pitch = atan2(-d.y, d.z)
   * with torso sharing: if head yaw > 25 degrees (0.436 rad), body takes
   * 40% of the excess with ~120 ms lag.
   */
  function solveLookAt(screenPoint, dt) {
    const player = getPlayerObject();
    if (!player || !player.skin || !player.skin.head) {
      sharedLookResult.yaw = 0;
      sharedLookResult.pitch = 0;
      sharedLookResult.bodyYaw = 0;
      return sharedLookResult;
    }

    const d = screenToModelDirection(screenPoint, player.skin.head);

    // Raw yaw and pitch from direction vector
    const rawYaw = Math.asin(Math.max(-0.999, Math.min(0.999, d.x)));
    // In AvatarRig, negative rot.x is look UP.
    // So if d.y > 0 (target is above head), pitch angle must be positive so setLook applies -pitch
    const rawPitch = Math.atan2(d.y, Math.max(0.01, d.z));

    // Soft clamp raw head angles
    const clampedYaw = Math.max(-1.0, Math.min(1.0, rawYaw));
    const clampedPitch = Math.max(-0.55, Math.min(0.50, rawPitch));

    // Torso sharing logic
    const th = CONFIG.TORSO_SHARING.thresholdRad;
    const absYaw = Math.abs(clampedYaw);

    let excessBodyYaw = 0;
    if (absYaw > th) {
      excessBodyYaw = (absYaw - th) * Math.sign(clampedYaw) * CONFIG.TORSO_SHARING.excessRatio;
    }

    // Low-pass exponential filter (~120ms lag) for body follow
    const tau = CONFIG.TORSO_SHARING.delaySeconds;
    const alpha = 1 - Math.exp(-Math.max(0.001, dt) / tau);
    currentBodyYaw += (excessBodyYaw - currentBodyYaw) * alpha;

    // Head leads, body absorbs excess
    const netHeadYaw = clampedYaw - currentBodyYaw;

    currentHeadYaw = netHeadYaw;
    currentHeadPitch = clampedPitch;

    sharedLookResult.yaw = netHeadYaw;
    sharedLookResult.pitch = clampedPitch;
    sharedLookResult.bodyYaw = currentBodyYaw;
    return sharedLookResult;
  }

  // ==========================================================================
  // 2. GESTURE CLIPS LIBRARY
  // ==========================================================================

  const GESTURE_DEFINITIONS = {
    /**
     * wave:
     * Right arm smoothly raises overhead (raise ~2.50 rad, hand clearly above head level),
     * forearm waves side-to-side with decaying exponential oscillation,
     * palm turns slightly forward (twist 0.25 rad), and head tilts warmly toward viewer.
     */
    wave: {
      name: 'wave',
      priority: PRIORITY_REACTION,
      cooldown: 2.5,
      joints: ['rightArm', 'leftArm', 'head'],
      duration: 2.1,
      anticipationSec: 0.12,
      evaluate(t, dur) {
        const u = Math.min(1, Math.max(0, t / dur));
        const leftArmWeight = Math.sin(Math.PI * u) * 0.4;
        const out = {
          rightArm: { raise: 0, spread: 0.22, twist: 0, weight: 0 },
          leftArm: { spread: 0.30, weight: leftArmWeight },
          head: { roll: 0, pitch: 0, weight: 0 }
        };

        if (t < 0.12) {
          // Anticipation: small opposite dip
          const aU = t / 0.12;
          out.rightArm.raise = -0.05 * Math.sin(Math.PI * aU);
          out.rightArm.spread = 0.14;
          out.rightArm.twist = 0;
          out.rightArm.weight = aU * 0.5;
        } else if (t < 0.65) {
          // Action: fast in, raise arm overhead above head
          const actU = (t - 0.12) / (0.65 - 0.12);
          const s = minJerk(actU);
          out.rightArm.raise = -0.05 + (2.50 - (-0.05)) * s;
          out.rightArm.spread = 0.14 + (0.32 - 0.14) * s;
          out.rightArm.twist = 0.25 * s;
          out.rightArm.weight = 1.0;
          out.head.roll = 0.12 * s;
          out.head.pitch = 0.05 * s;
          out.head.weight = s * 0.8;
        } else if (t < 1.60) {
          // Hold with decaying exponential oscillation above head
          const oscT = t - 0.65;
          const decay = Math.exp(-1.4 * oscT);
          const waveOsc = 0.22 * Math.sin(oscT * 10.5) * decay;
          out.rightArm.raise = 2.45 + 0.05 * Math.sin(oscT * 5.0);
          out.rightArm.spread = 0.32 + waveOsc;
          out.rightArm.twist = 0.25;
          out.rightArm.weight = 1.0;
          out.head.roll = 0.12 * decay;
          out.head.pitch = 0.05 * decay;
          out.head.weight = 0.8 * decay;
        } else {
          // Release: smooth ease-out (400-500ms) back to pose
          const relU = (t - 1.60) / (dur - 1.60);
          const s = 1 - minJerk(relU);
          out.rightArm.raise = 2.45 * s;
          out.rightArm.spread = 0.14 + (0.32 - 0.14) * s;
          out.rightArm.twist = 0.25 * s;
          out.rightArm.weight = s;
          out.head.roll = 0.04 * s;
          out.head.pitch = 0.02 * s;
          out.head.weight = s * 0.3;
        }
        return out;
      }
    },

    /**
     * point:
     * aimArm at element center, head looks at it first, body yaw 0.2 toward it.
     */
    point: {
      name: 'point',
      priority: PRIORITY_REACTION,
      cooldown: 0.8,
      joints: ['rightArm', 'leftArm', 'body'],
      duration: 1.8,
      anticipationSec: 0.08,
      evaluate(t, dur, context) {
        const u = Math.min(1, Math.max(0, t / dur));
        const bodyTwistW = (t < 0.60) ? minJerk(Math.max(0, (t - 0.15) / 0.45)) * 0.7 : (t < 1.30) ? 0.7 : (1 - minJerk((t - 1.30) / (dur - 1.30))) * 0.7;
        const leftArmWeight = Math.max(Math.sin(Math.PI * u) * 0.4, bodyTwistW);
        const out = {
          rightArm: { raise: 0, spread: 0.32, twist: 0, weight: 0 },
          leftArm: { spread: 0.36, weight: leftArmWeight },
          body: { twist: 0, weight: 0 }
        };

        const targetScreen = context.pointTarget || { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
        const aim = solveAimArm('right', targetScreen);
        const aimSpread = Math.max(0.35, aim.spread);

        if (t < 0.15) {
          // Anticipation
          const aU = t / 0.15;
          out.rightArm.raise = -0.05 * aU;
          out.rightArm.spread = 0.32;
          out.rightArm.weight = aU * 0.4;
          out.body.twist = 0.05 * aU;
          out.body.weight = aU * 0.4;
        } else if (t < 0.60) {
          // Action: minimum-jerk reach
          const actU = (t - 0.15) / 0.45;
          const s = minJerk(actU);
          out.rightArm.raise = aim.raise * s;
          out.rightArm.spread = 0.30 + (aimSpread - 0.30) * s;
          out.rightArm.twist = aim.twist * s;
          out.rightArm.weight = s;
          out.body.twist = 0.20 * s;
          out.body.weight = s * 0.7;
        } else if (t < 1.30) {
          // Hold on target
          out.rightArm.raise = aim.raise;
          out.rightArm.spread = aimSpread;
          out.rightArm.twist = aim.twist;
          out.rightArm.weight = 1.0;
          out.body.twist = 0.20;
          out.body.weight = 0.7;
        } else {
          // Release
          const relU = (t - 1.30) / (dur - 1.30);
          const s = 1 - minJerk(relU);
          out.rightArm.raise = aim.raise * s;
          out.rightArm.spread = 0.30 + (aimSpread - 0.30) * s;
          out.rightArm.twist = aim.twist * s;
          out.rightArm.weight = s;
          out.body.twist = 0.20 * s;
          out.body.weight = s * 0.7;
        }
        return out;
      }
    },

    /**
     * present:
     * Arm opens toward a column of text, palm side, then releases.
     */
    present: {
      name: 'present',
      priority: PRIORITY_SCRIPTED,
      cooldown: 8.0,
      joints: ['rightArm', 'body'],
      duration: 2.2,
      anticipationSec: 0.10,
      evaluate(t, dur) {
        const out = {
          rightArm: { raise: 0, spread: 0.14, twist: 0, weight: 0 },
          body: { twist: 0, weight: 0 }
        };

        if (t < 0.10) {
          const aU = t / 0.10;
          out.rightArm.weight = aU * 0.2;
        } else if (t < 0.70) {
          const actU = (t - 0.10) / 0.60;
          const s = minJerk(actU);
          out.rightArm.raise = 0.45 * s;
          out.rightArm.spread = (0.14 + (0.75 - 0.14) * s);
          out.rightArm.twist = 0.35 * s; // palm side
          out.rightArm.weight = s;
          out.body.twist = 0.18 * s;
          out.body.weight = s * 0.6;
        } else if (t < 1.60) {
          out.rightArm.raise = 0.45;
          out.rightArm.spread = 0.75;
          out.rightArm.twist = 0.35;
          out.rightArm.weight = 1.0;
          out.body.twist = 0.18;
          out.body.weight = 0.6;
        } else {
          const relU = (t - 1.60) / (dur - 1.60);
          const s = 1 - minJerk(relU);
          out.rightArm.raise = 0.45 * s;
          out.rightArm.spread = 0.14 + (0.75 - 0.14) * s;
          out.rightArm.twist = 0.35 * s;
          out.rightArm.weight = s;
          out.body.twist = 0.18 * s;
          out.body.weight = s * 0.6;
        }
        return out;
      }
    },

    /**
     * nod:
     * Head pitch 0.18 twice, body follows slightly.
     */
    nod: {
      name: 'nod',
      priority: PRIORITY_REACTION,
      cooldown: 2.0,
      joints: ['head'],
      duration: 1.1,
      anticipationSec: 0.08,
      evaluate(t, dur) {
        const out = {
          head: { pitch: 0, weight: 0 }
        };

        if (t < 0.08) {
          const aU = t / 0.08;
          out.head.pitch = -0.04 * aU; // slight head lift before nod
          out.head.weight = aU * 0.4;
        } else if (t < 0.95) {
          const nodT = (t - 0.08) / (0.95 - 0.08); // 2 full cycles
          const nodWave = Math.sin(nodT * Math.PI * 4);
          const envelope = Math.sin(nodT * Math.PI);
          out.head.pitch = 0.18 * Math.max(0, nodWave) * envelope;
          out.head.weight = envelope * 0.9;
        } else {
          out.head.weight = 0;
        }
        return out;
      }
    },

    /**
     * tilt:
     * Head roll 0.2 for 1.2 s.
     */
    tilt: {
      name: 'tilt',
      priority: PRIORITY_AMBIENT,
      cooldown: 5.0,
      joints: ['head'],
      duration: 1.8,
      anticipationSec: 0.10,
      evaluate(t, dur) {
        const out = { head: { roll: 0, weight: 0 } };
        if (t < 0.10) {
          const aU = t / 0.10;
          out.head.roll = -0.03 * aU;
          out.head.weight = aU * 0.3;
        } else if (t < 0.50) {
          const s = minJerk((t - 0.10) / 0.40);
          out.head.roll = 0.20 * s;
          out.head.weight = s;
        } else if (t < 1.30) {
          out.head.roll = 0.20;
          out.head.weight = 1.0;
        } else {
          const s = 1 - minJerk((t - 1.30) / (dur - 1.30));
          out.head.roll = 0.20 * s;
          out.head.weight = s;
        }
        return out;
      }
    },

    /**
     * look-around:
     * Head yaw sweeps +/- 0.5 with small body follow.
     */
    lookAround: {
      name: 'look-around',
      priority: PRIORITY_AMBIENT,
      cooldown: 6.0,
      joints: ['head', 'body'],
      duration: 2.8,
      anticipationSec: 0.12,
      evaluate(t, dur) {
        const out = {
          head: { yaw: 0, weight: 0 },
          body: { twist: 0, weight: 0 }
        };

        const u = t / dur;
        const envelope = Math.sin(u * Math.PI);
        // Sweep right, then left, then center
        const sweep = Math.sin(u * Math.PI * 2);

        out.head.yaw = 0.50 * sweep * envelope;
        out.head.weight = envelope * 0.85;
        out.body.twist = 0.15 * sweep * envelope;
        out.body.weight = envelope * 0.5;

        return out;
      }
    },

    /**
     * stretch:
     * Both arms rise slowly, deep breath, release.
     */
    stretch: {
      name: 'stretch',
      priority: PRIORITY_AMBIENT,
      cooldown: 10.0,
      joints: ['leftArm', 'rightArm', 'body', 'head'],
      duration: 2.6,
      anticipationSec: 0.15,
      evaluate(t, dur) {
        const out = {
          leftArm: { raise: 0, spread: 0.12, twist: 0, weight: 0 },
          rightArm: { raise: 0, spread: 0.14, twist: 0, weight: 0 },
          body: { lean: 0, weight: 0 },
          head: { pitch: 0, weight: 0 }
        };

        if (t < 0.80) {
          const s = minJerk(t / 0.80);
          out.leftArm.raise = 1.40 * s;
          out.leftArm.spread = 0.12 + (0.50 - 0.12) * s;
          out.leftArm.weight = s;
          out.rightArm.raise = 1.40 * s;
          out.rightArm.spread = 0.14 + (0.50 - 0.14) * s;
          out.rightArm.weight = s;
          out.head.pitch = 0.15 * s;
          out.head.weight = s * 0.7;
          out.body.lean = -0.06 * s; // slight backwards arch
          out.body.weight = s * 0.6;
        } else if (t < 1.80) {
          out.leftArm.raise = 1.40;
          out.leftArm.spread = 0.50;
          out.leftArm.weight = 1.0;
          out.rightArm.raise = 1.40;
          out.rightArm.spread = 0.50;
          out.rightArm.weight = 1.0;
          out.head.pitch = 0.15;
          out.head.weight = 0.7;
          out.body.lean = -0.06;
          out.body.weight = 0.6;
        } else {
          const s = 1 - minJerk((t - 1.80) / (dur - 1.80));
          out.leftArm.raise = 1.40 * s;
          out.leftArm.spread = 0.12 + (0.50 - 0.12) * s;
          out.leftArm.weight = s;
          out.rightArm.raise = 1.40 * s;
          out.rightArm.spread = 0.14 + (0.50 - 0.14) * s;
          out.rightArm.weight = s;
          out.head.pitch = 0.15 * s;
          out.head.weight = s * 0.7;
          out.body.lean = -0.06 * s;
          out.body.weight = s * 0.6;
        }
        return out;
      }
    },

    /**
     * settle:
     * Small bob and arm drop after landing.
     */
    settle: {
      name: 'settle',
      priority: PRIORITY_SCRIPTED,
      cooldown: 1.5,
      joints: ['body', 'leftArm', 'rightArm'],
      duration: 0.9,
      anticipationSec: 0.05,
      evaluate(t, dur) {
        const out = {
          body: { lean: 0, weight: 0 },
          leftArm: { raise: 0, spread: 0.30, weight: 0 },
          rightArm: { raise: 0, spread: 0.30, weight: 0 }
        };

        const u = t / dur;
        const decay = Math.exp(-3.5 * u);
        const bob = Math.sin(u * Math.PI * 3) * decay;
        const env = Math.sin(Math.PI * Math.min(1, u * 1.5)) * decay;

        out.body.lean = 0.02 * bob;
        out.body.weight = env;
        out.leftArm.raise = -0.06 * bob;
        out.leftArm.spread = 0.30;
        out.leftArm.weight = env * 0.4;
        out.rightArm.raise = -0.06 * bob;
        out.rightArm.spread = 0.30;
        out.rightArm.weight = env * 0.4;

        return out;
      }
    },

    /**
     * spin:
     * Root yaw 2*PI with ease in/out over 1.4 s, arms spread slightly, used for click.
     */
    spin: {
      name: 'spin',
      priority: PRIORITY_USER_ACTION,
      cooldown: 2.0,
      joints: ['rootYaw', 'leftArm', 'rightArm'],
      duration: 1.4,
      anticipationSec: 0.10,
      evaluate(t, dur) {
        const out = {
          rootYaw: { yaw: 0, weight: 0 },
          leftArm: { spread: 0.12, weight: 0 },
          rightArm: { spread: 0.14, weight: 0 }
        };

        const u = Math.min(1, Math.max(0, t / dur));
        const s = minJerk(u);
        const twoPi = Math.PI * 2;

        out.rootYaw.yaw = twoPi * s;
        out.rootYaw.weight = 1.0;

        const armSpreadExtra = 0.22 * Math.sin(u * Math.PI);
        out.leftArm.spread = 0.12 + armSpreadExtra;
        out.leftArm.weight = Math.sin(u * Math.PI);
        out.rightArm.spread = 0.14 + armSpreadExtra;
        out.rightArm.weight = Math.sin(u * Math.PI);

        return out;
      }
    }
  };

  /**
   * triggerGesture(name, options)
   * Launches a gesture clip if priority allows and cooldown has expired.
   */
  function triggerGesture(name, options = {}) {
    const def = GESTURE_DEFINITIONS[name];
    if (!def) {
      console.warn(`[AvatarDirector] Unknown gesture: ${name}`);
      return false;
    }

    const nowSec = performance.now() / 1000;
    const lastTime = gestureHistory.get(name) || 0;
    if (nowSec - lastTime < (def.cooldown || 1.0) && !options.force) {
      return false;
    }

    // Flight check: No gestures during flight!
    if (isFlightActive && !options.allowInFlight) {
      return false;
    }

    // Reduced motion check
    if (prefersReducedMotion && def.priority < PRIORITY_USER_ACTION) {
      return false;
    }

    // Cancel any lower-priority conflicting gestures
    activeGestures = activeGestures.filter((g) => {
      if (g.def.priority < def.priority) {
        return false; // preempted cleanly
      }
      return true;
    });

    const instance = {
      def,
      startTime: nowSec,
      duration: options.duration || def.duration,
      context: options.context || {},
      onComplete: options.onComplete || null
    };

    activeGestures.push(instance);
    gestureHistory.set(name, nowSec);

    return true;
  }

  // ==========================================================================
  // 3. DIRECTOR EVENT & INTENT HANDLERS
  // ==========================================================================

  function onIntroStep(step, data = {}) {
    if (step === 'fly-in') {
      const rig = getRig();
      if (rig) rig.setPose('fly');
      lookMode = 'fixed';
      lookTargetScreen = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
    } else if (step === 'writing') {
      lookMode = 'element';
      if (data.penX !== undefined && data.penY !== undefined) {
        lookTargetScreen = { x: data.penX, y: data.penY };
      }
    } else if (step === 'glide-settle') {
      const rig = getRig();
      if (rig) rig.setPose('float');
      triggerGesture('settle', { force: true });
    } else if (step === 'finish') {
      lookMode = 'mouse';
      setTimeout(() => {
        triggerGesture('wave', { force: true });
      }, 400);
    }
  }

  function onSectionEnter(sectionId) {
    if (sectionId === currentSectionId) return;
    currentSectionId = sectionId;

    const rig = getRig();
    if (!rig) return;

    if (sectionId === 'home') {
      rig.setPose('float');
      lookMode = 'mouse';
      readingState.active = false;
    } else if (sectionId === 'chi_sono') {
      rig.setPose('rest');
      lookMode = 'reading';
      readingState.active = true;
      readingState.column = 'left';
      readingState.paragraphIdx = 0;
      readingState.fixationIdx = 0;
      readingState.timer = 0;
      readingState.nextDuration = 1.0;
    } else if (sectionId === 'esperienze') {
      rig.setPose('neutral');
      lookMode = 'ambient';
      readingState.active = false;
    } else if (sectionId === 'contatti') {
      rig.setPose('open');
      lookMode = 'ambient';
      readingState.active = false;
    }
  }

  function onHover(element, type) {
    if (!element || prefersReducedMotion || isFlightActive) return;
    lastUserInteractionTime = performance.now() / 1000;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width * 0.5;
    const centerY = rect.top + rect.height * 0.5;

    if (type === 'home-button') {
      lookMode = 'element';
      lookTargetScreen.x = centerX;
      lookTargetScreen.y = centerY;
      hoverPointTarget.x = centerX;
      hoverPointTarget.y = centerY;
      triggerGesture('point', {
        context: hoverPointContext,
        force: true
      });
    } else if (type === 'hero-title') {
      lookMode = 'element';
      lookTargetScreen.x = centerX;
      lookTargetScreen.y = centerY;
    } else if (type === 'experience-row') {
      // Aim at left edge / number
      const leftTargetX = rect.left + Math.min(60, rect.width * 0.2);
      lookMode = 'element';
      lookTargetScreen.x = leftTargetX;
      lookTargetScreen.y = centerY;
      hoverPointTarget.x = leftTargetX;
      hoverPointTarget.y = centerY;
      triggerGesture('point', {
        context: hoverPointContext,
        force: true
      });
    } else if (type === 'contact-row') {
      lookMode = 'element';
      lookTargetScreen.x = centerX;
      lookTargetScreen.y = centerY;
      hoverPointTarget.x = centerX;
      hoverPointTarget.y = centerY;
      triggerGesture('point', {
        context: hoverPointContext,
        force: true
      });
    }
  }

  function onLeave(element) {
    lastUserInteractionTime = performance.now() / 1000;
    setTimeout(() => {
      if (currentSectionId === 'home') {
        lookMode = 'mouse';
      } else if (currentSectionId === 'chi_sono') {
        lookMode = 'reading';
      } else {
        lookMode = 'ambient';
      }
    }, 600);
  }

  function onClick(element, type) {
    lastUserInteractionTime = performance.now() / 1000;
    if (type === 'contact-link') {
      triggerGesture('nod', { force: true });
    }
  }

  function onAvatarClick() {
    lastUserInteractionTime = performance.now() / 1000;
    // Wave fully, then spin on completion
    triggerGesture('wave', {
      force: true,
      onComplete: () => {
        triggerGesture('spin', { force: true });
      }
    });
  }

  function onDetailOpen(key) {
    isDetailOpen = true;
    triggerGesture('nod', { force: true });
    const rig = getRig();
    if (rig) rig.setPose('rest');
  }

  function onDetailClose() {
    isDetailOpen = false;
    triggerGesture('settle', { force: true });
    const rig = getRig();
    if (rig) rig.setPose('neutral');
  }

  function onPointerMove(clientX, clientY) {
    lastUserInteractionTime = performance.now() / 1000;
    if (isTouchDevice) return; // Touch devices don't track hover mouse
    if (lookMode === 'mouse' && currentSectionId === 'home') {
      lookTargetScreen.x = clientX;
      lookTargetScreen.y = clientY;
    }
  }

  // ==========================================================================
  // 4. FLIGHT COUPLING
  // ==========================================================================
  function updateFlightMotion(vx, vy, ax, ay, dt) {
    stageSpeed = Math.hypot(vx, vy);

    if (stageSpeed > CONFIG.FLIGHT.speedThreshold) {
      flightSpeedTimer += dt * 1000;
      flightBelowTimer = 0;
      if (flightSpeedTimer >= CONFIG.FLIGHT.startDebounceMs && !isFlightActive) {
        // flightStart triggered
        isFlightActive = true;
        // Suppress any running idle or reaction gestures
        activeGestures = [];
        const rig = getRig();
        if (rig) rig.setPose('fly');
      }
    } else {
      flightBelowTimer += dt * 1000;
      flightSpeedTimer = 0;
      if (flightBelowTimer >= CONFIG.FLIGHT.endDebounceMs && isFlightActive) {
        // flightEnd triggered
        isFlightActive = false;
        // Settle gesture immediately on landing
        triggerGesture('settle', { force: true });

        // Trigger section arrival gesture
        setTimeout(() => {
          if (currentSectionId === 'chi_sono') {
            triggerGesture('wave', { force: true });
          } else if (currentSectionId === 'esperienze') {
            triggerGesture('nod', { force: true });
          } else if (currentSectionId === 'contatti') {
            triggerGesture('wave', { force: true });
          }
        }, 500);
      }
    }
  }

  // ==========================================================================
  // 5. READING GAZE & MUSIC SWAY
  // ==========================================================================
  function updateReadingRects() {
    cachedReadingTargets.left.length = 0;
    cachedReadingTargets.right.length = 0;

    const leftItems = document.querySelectorAll('#chi_sono .col-left p, #chi_sono .lead, #chi_sono .about-item');
    for (let i = 0; i < leftItems.length; i++) {
      const r = leftItems[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        cachedReadingTargets.left.push({
          left: r.left,
          top: r.top,
          width: r.width,
          height: r.height
        });
      }
    }

    const rightItems = document.querySelectorAll('#chi_sono .col-right p, #chi_sono .about-meta, #chi_sono .about-item');
    for (let i = 0; i < rightItems.length; i++) {
      const r = rightItems[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        cachedReadingTargets.right.push({
          left: r.left,
          top: r.top,
          width: r.width,
          height: r.height
        });
      }
    }
  }

  function updateReadingGaze(dt, nowSec) {
    if (!readingState.active || currentSectionId !== 'chi_sono' || prefersReducedMotion) return;

    readingState.timer += dt;
    if (readingState.timer >= readingState.nextDuration) {
      readingState.timer = 0;
      readingState.nextDuration = CONFIG.READING.fixationMinSec +
        Math.random() * (CONFIG.READING.fixationMaxSec - CONFIG.READING.fixationMinSec);

      readingState.fixationIdx++;
      if (readingState.fixationIdx >= readingState.totalFixations) {
        readingState.fixationIdx = 0;
        readingState.paragraphIdx++;

        // Switch columns every 3 paragraphs
        if (readingState.paragraphIdx >= 3) {
          readingState.paragraphIdx = 0;
          readingState.column = (readingState.column === 'left') ? 'right' : 'left';

          // Body turns 0.15-0.25 toward active column
          const colSign = (readingState.column === 'left') ? -1 : 1;
          targetBodyYaw = colSign * 0.20;

          // Present gesture at most once every 12s
          if (nowSec - readingState.lastPresentTime >= CONFIG.READING.presentCooldownSec) {
            readingState.lastPresentTime = nowSec;
            triggerGesture('present');
          } else {
            // Occasional nod on moving to new item
            if (Math.random() < 0.4) triggerGesture('nod');
          }
        }
      }

      // Use cached targets pool (zero DOM queries per frame)
      const pool = (readingState.column === 'left') ? cachedReadingTargets.left : cachedReadingTargets.right;
      if (pool && pool.length > 0) {
        const r = pool[readingState.paragraphIdx % pool.length];
        const frac = (readingState.fixationIdx + 0.5) / readingState.totalFixations;
        lookTargetScreen.x = r.left + r.width * frac;
        lookTargetScreen.y = r.top + r.height * 0.5;
      }
    }
  }

  function setAudioAnalyser(analyserNode, ctx, audioElement) {
    audioAnalyser = analyserNode;
    audioCtxRef = ctx;
    if (audioElement) audioSource = audioElement;
    if (analyserNode) {
      analyserNode.fftSize = 128;
      audioFreqBuffer = new Uint8Array(analyserNode.frequencyBinCount);
    }
  }

  function updateAudioSway(dt) {
    if (!audioAnalyser || !audioFreqBuffer || !CONFIG.MUSIC_REACTIVE) {
      smoothedAudioEnergy *= 0.90;
      return 0;
    }

    if (audioSource && (audioSource.paused || audioSource.muted || audioSource.volume <= 0)) {
      smoothedAudioEnergy *= 0.90;
      return 0;
    }

    // 20 Hz budget (run at most every 50 ms)
    const nowMs = performance.now();
    if (nowMs - lastAudioTimeMs < 50) {
      return smoothedAudioEnergy;
    }
    const t0 = nowMs;
    lastAudioTimeMs = nowMs;

    try {
      audioAnalyser.getByteFrequencyData(audioFreqBuffer);
      // Low-band bass energy: bins 1 to 4 (~40 to 300 Hz)
      let sum = 0;
      const count = Math.min(5, audioFreqBuffer.length);
      for (let i = 1; i < count; i++) {
        sum += audioFreqBuffer[i];
      }
      const rawEnergy = sum / ((count - 1) * 255);
      // Smooth low-pass
      smoothedAudioEnergy += (rawEnergy - smoothedAudioEnergy) * Math.min(1, dt * 8.0);
      lastAudioCostMs = performance.now() - t0;
      if (window.AvatarDebug && typeof window.AvatarDebug.recordMetric === 'function') {
        window.AvatarDebug.recordMetric('audioAnalyser', lastAudioCostMs);
      }
      return smoothedAudioEnergy;
    } catch (e) {
      return 0;
    }
  }

  // ==========================================================================
  // 6. MAIN UPDATE TICK (Executed before AvatarRig.update)
  // ==========================================================================
  function update(dtRaw) {
    const t0 = (window.AvatarDebug && window.AvatarDebug.isPerfActive && window.AvatarDebug.isPerfActive()) ? performance.now() : 0;
    const dt = Math.max(0.001, Math.min(0.1, dtRaw));
    const nowSec = performance.now() / 1000;

    // Reset director overlay arrays
    for (let i = 0; i < DOF_COUNT; i++) {
      directorOverrides[i] = 0;
      directorWeights[i] = 0;
    }

    // 1. Reading Gaze & Idle Timer Evaluation
    if (lookMode === 'reading') {
      updateReadingGaze(dt, nowSec);
    }

    // Idle gestures in home section (every 6-11s, 3s cooldown)
    if (currentSectionId === 'home' && !isFlightActive && !prefersReducedMotion && activeGestures.length === 0) {
      const timeSinceUser = nowSec - lastUserInteractionTime;
      if (timeSinceUser >= CONFIG.IDLE.interactionCooldownSec) {
        idleTimer += dt;
        if (idleTimer >= nextIdleInterval) {
          idleTimer = 0;
          nextIdleInterval = CONFIG.IDLE.minSec + Math.random() * (CONFIG.IDLE.maxSec - CONFIG.IDLE.minSec);

          const idlePool = ['lookAround', 'tilt', 'stretch'];
          if (Math.random() < 0.15) idlePool.push('wave'); // rare wave
          const available = idlePool.filter((g) => g !== lastIdleGestureName);
          const nextGesture = available[Math.floor(Math.random() * available.length)];
          lastIdleGestureName = nextGesture;
          triggerGesture(nextGesture);
        }
      }
    }

    // 2. Smooth Look-At Target (lerp screen coordinates)
    const lookLerpSpeed = (lookMode === 'reading') ? 4.0 : 8.0;
    lookTargetSmooth.x += (lookTargetScreen.x - lookTargetSmooth.x) * Math.min(1, dt * lookLerpSpeed);
    lookTargetSmooth.y += (lookTargetScreen.y - lookTargetSmooth.y) * Math.min(1, dt * lookLerpSpeed);

    // 3. Solve Look-At Gaze & Torso Sharing
    const lookResult = solveLookAt(lookTargetSmooth, dt);

    // 4. Evaluate Active Gestures
    for (let i = activeGestures.length - 1; i >= 0; i--) {
      const g = activeGestures[i];
      const elapsed = nowSec - g.startTime;

      if (elapsed >= g.duration) {
        if (typeof g.onComplete === 'function') g.onComplete();
        activeGestures.splice(i, 1);
        continue;
      }

      const clipOutput = g.def.evaluate(elapsed, g.duration, g.context);

      // Apply to directorOverrides & weights with joint masking
      if (clipOutput.head && g.def.joints.includes('head')) {
        if (clipOutput.head.pitch !== undefined) {
          directorOverrides[J_HEAD * 3 + 0] = -clipOutput.head.pitch;
          directorWeights[J_HEAD * 3 + 0] = Math.max(directorWeights[J_HEAD * 3 + 0], clipOutput.head.weight || 1);
        }
        if (clipOutput.head.yaw !== undefined) {
          directorOverrides[J_HEAD * 3 + 1] = clipOutput.head.yaw;
          directorWeights[J_HEAD * 3 + 1] = Math.max(directorWeights[J_HEAD * 3 + 1], clipOutput.head.weight || 1);
        }
        if (clipOutput.head.roll !== undefined) {
          directorOverrides[J_HEAD * 3 + 2] = clipOutput.head.roll;
          directorWeights[J_HEAD * 3 + 2] = Math.max(directorWeights[J_HEAD * 3 + 2], clipOutput.head.weight || 1);
        }
      }

      if (clipOutput.body && g.def.joints.includes('body')) {
        if (clipOutput.body.lean !== undefined) {
          directorOverrides[J_BODY * 3 + 0] = clipOutput.body.lean;
          directorWeights[J_BODY * 3 + 0] = Math.max(directorWeights[J_BODY * 3 + 0], clipOutput.body.weight || 1);
        }
        if (clipOutput.body.twist !== undefined) {
          directorOverrides[J_BODY * 3 + 1] = clipOutput.body.twist;
          directorWeights[J_BODY * 3 + 1] = Math.max(directorWeights[J_BODY * 3 + 1], clipOutput.body.weight || 1);
        }
      }

      if (clipOutput.rightArm && g.def.joints.includes('rightArm')) {
        const sign = getOutwardSign('right');
        if (clipOutput.rightArm.raise !== undefined) {
          directorOverrides[J_RIGHT_ARM * 3 + 0] = -clipOutput.rightArm.raise;
          directorWeights[J_RIGHT_ARM * 3 + 0] = Math.max(directorWeights[J_RIGHT_ARM * 3 + 0], clipOutput.rightArm.weight || 1);
        }
        if (clipOutput.rightArm.twist !== undefined) {
          directorOverrides[J_RIGHT_ARM * 3 + 1] = clipOutput.rightArm.twist;
          directorWeights[J_RIGHT_ARM * 3 + 1] = Math.max(directorWeights[J_RIGHT_ARM * 3 + 1], clipOutput.rightArm.weight || 1);
        }
        if (clipOutput.rightArm.spread !== undefined) {
          directorOverrides[J_RIGHT_ARM * 3 + 2] = sign * clipOutput.rightArm.spread;
          directorWeights[J_RIGHT_ARM * 3 + 2] = Math.max(directorWeights[J_RIGHT_ARM * 3 + 2], clipOutput.rightArm.weight || 1);
        }
      }

      if (clipOutput.leftArm && g.def.joints.includes('leftArm')) {
        const sign = getOutwardSign('left');
        if (clipOutput.leftArm.raise !== undefined) {
          directorOverrides[J_LEFT_ARM * 3 + 0] = -clipOutput.leftArm.raise;
          directorWeights[J_LEFT_ARM * 3 + 0] = Math.max(directorWeights[J_LEFT_ARM * 3 + 0], clipOutput.leftArm.weight || 1);
        }
        if (clipOutput.leftArm.twist !== undefined) {
          directorOverrides[J_LEFT_ARM * 3 + 1] = clipOutput.leftArm.twist;
          directorWeights[J_LEFT_ARM * 3 + 1] = Math.max(directorWeights[J_LEFT_ARM * 3 + 1], clipOutput.leftArm.weight || 1);
        }
        if (clipOutput.leftArm.spread !== undefined) {
          directorOverrides[J_LEFT_ARM * 3 + 2] = sign * clipOutput.leftArm.spread;
          directorWeights[J_LEFT_ARM * 3 + 2] = Math.max(directorWeights[J_LEFT_ARM * 3 + 2], clipOutput.leftArm.weight || 1);
        }
      }

      if (clipOutput.rootYaw && g.def.joints.includes('rootYaw')) {
        const rig = getRig();
        if (rig) rig.setRootYaw(clipOutput.rootYaw.yaw);
      }
    }

    // 5. Music Sway
    const musicEnergy = updateAudioSway(dt);
    if (musicEnergy > 0.05 && !prefersReducedMotion) {
      const swayPhase = nowSec * 4.0;
      const bobHead = 0.03 * Math.sin(swayPhase) * musicEnergy;
      const bobBody = 0.02 * Math.sin(swayPhase + 0.5) * musicEnergy;
      const armSpread = 0.02 * Math.cos(swayPhase) * musicEnergy;

      directorOverrides[J_HEAD * 3 + 0] += -bobHead;
      directorWeights[J_HEAD * 3 + 0] = Math.max(directorWeights[J_HEAD * 3 + 0], musicEnergy * 0.4);

      directorOverrides[J_BODY * 3 + 0] += bobBody;
      directorWeights[J_BODY * 3 + 0] = Math.max(directorWeights[J_BODY * 3 + 0], musicEnergy * 0.3);

      directorOverrides[J_LEFT_ARM * 3 + 2] += armSpread * getOutwardSign('left');
      directorWeights[J_LEFT_ARM * 3 + 2] = Math.max(directorWeights[J_LEFT_ARM * 3 + 2], musicEnergy * 0.3);

      directorOverrides[J_RIGHT_ARM * 3 + 2] += armSpread * getOutwardSign('right');
      directorWeights[J_RIGHT_ARM * 3 + 2] = Math.max(directorWeights[J_RIGHT_ARM * 3 + 2], musicEnergy * 0.3);
    }

    // 6. Pass look & torso sharing to AvatarRig
    const rig = getRig();
    if (rig) {
      // If no gesture owns the head, head look continues seamlessly
      if (directorWeights[J_HEAD * 3 + 1] < 0.01) {
        rig.setLook(lookResult.yaw, lookResult.pitch);
      }
      // Pass overlay to AvatarRig
      if (typeof rig.setDirectorOverlay === 'function') {
        rig.setDirectorOverlay(directorOverrides, directorWeights);
      }
    }

    // 7. Render Debug Rays (if enabled and debug module loaded)
    if (CONFIG.DEBUG_RAYS && window.AvatarDebug && typeof window.AvatarDebug.renderDebugRays === 'function') {
      window.AvatarDebug.renderDebugRays(lookTargetSmooth);
    }

    if (t0 > 0 && window.AvatarDebug && typeof window.AvatarDebug.recordMetric === 'function') {
      window.AvatarDebug.recordMetric('avatarDirectorUpdate', performance.now() - t0);
    }
  }

  function runAutoTest() {
    if (window.AvatarDebug && typeof window.AvatarDebug.runAutoTest === 'function') {
      return window.AvatarDebug.runAutoTest();
    }
    console.warn('[AvatarDirector] AvatarDebug module not loaded. Load with ?autotest or include avatar-debug.js');
  }

  // ==========================================================================
  // EXPORT TO NAMESPACE
  // ==========================================================================
  const AvatarDirector = {
    CONFIG,
    update,
    screenToModelDirection,
    solveAimArm,
    solveLookAt,
    triggerGesture,
    onIntroStep,
    onSectionEnter,
    onHover,
    onLeave,
    onClick,
    onAvatarClick,
    onDetailOpen,
    onDetailClose,
    onPointerMove,
    updateFlightMotion,
    setAudioAnalyser,
    updateReadingRects,
    getLastAudioCost() { return lastAudioCostMs; },
    setStageTransform(t) {
      if (t) {
        if (t.x !== undefined) stageTransform.x = t.x;
        if (t.y !== undefined) stageTransform.y = t.y;
        if (t.scale !== undefined) stageTransform.scale = t.scale;
        if (t.roll !== undefined) stageTransform.roll = t.roll;
        if (t.bobY !== undefined) stageTransform.bobY = t.bobY;
        if (t.bobRoll !== undefined) stageTransform.bobRoll = t.bobRoll;
      }
    },
    runAutoTest,
    getStatus() {
      return {
        lookMode,
        targetScreen: { ...lookTargetScreen },
        headAngles: { yaw: currentHeadYaw, pitch: currentHeadPitch },
        bodyYaw: currentBodyYaw,
        activeGestures: activeGestures.map((g) => g.def.name),
        isFlightActive,
        currentSectionId
      };
    }
  };

  // Attach to window & module
  if (typeof window !== 'undefined') {
    window.AvatarDirector = AvatarDirector;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvatarDirector;
  }

})();
