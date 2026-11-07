// ATTENZIONE PER L'AI: Prima di effettuare qualsiasi modifica a questo file o al progetto, consulta SEMPRE il file AGENTS.md nella radice del progetto per le regole obbligatorie.

/**
 * ============================================================================
 * AVATAR RIG CORE - FLUID, HUMAN-FEELING, COLLISION-FREE 3D SKELETAL ENGINE
 * ============================================================================
 * Namespace: window.AvatarRig
 *
 * Design:
 * - Single Animation Owner: RigAnimation owns all joint rotations and root transforms.
 * - Anatomical authoring: arm(side, {raise, spread, twist}), leg(side, {swing, spread}),
 *   head({yaw, pitch, roll}), body({lean, twist, roll}).
 * - Runtime outward sign: derived via Math.sign(joint.position.x), never hardcoded.
 * - Critically / slightly under-damped springs with semi-implicit Euler substeps (<= 1/120s).
 * - Rate limiters & soft limits with smooth compression near bounds.
 * - Procedural layers: breathing, 3-frequency organic drift, secondary motion lag & lean.
 * - 3-level collision resolution with bounding box sampling, offline target cleaning,
 *   and a smoothed 30Hz runtime guard spring.
 * - Built-in validation suite (AvatarRig.validate()).
 * ============================================================================
 */

(function () {
  'use strict';

  // ==========================================================================
  // CONFIGURATION CONSTANTS (All tunable values in CONFIG.RIG)
  // ==========================================================================
  const CONFIG = {
    // Spring dynamics: natural frequency (Hz) and damping ratio (zeta)
    SPRINGS: {
      head:      { freq: 3.2, damping: 0.90 },
      body:      { freq: 2.0, damping: 1.00 },
      arms:      { freq: 2.4, damping: 0.80 }, // slight underdamping: max ~8% natural fluid overshoot
      legs:      { freq: 1.7, damping: 0.90 },
      rootYaw:   { freq: 1.6, damping: 1.00 },
      collision: { freq: 3.5, damping: 1.00 }  // collision offset smoothing spring
    },

    // Rate limiters per joint group (max rad/s)
    RATE_LIMITS: {
      head: 6.0,
      arms: 6.5,
      legs: 5.0,
      body: 3.5,
      rootYaw: 3.0
    },

    // Anatomical soft joint limits [min, max] (radians)
    LIMITS: {
      headYaw:   [-1.10, 1.10],
      headPitch: [-0.60, 0.50], // negative x is look up, positive pitch = look up
      headRoll:  [-0.35, 0.35],
      bodyYaw:   [-0.90, 0.90],
      bodyLean:  [-0.25, 0.60],
      bodyRoll:  [-0.30, 0.30],
      armRaise:  [-0.60, 3.10],
      legSwing:  [-0.70, 0.70]
    },

    // Organic drift amplitudes (radians)
    DRIFT: {
      arms: 0.05,
      legs: 0.04,
      head: 0.03,
      body: 0.025
    },

    // Secondary motion lag and lean response factors
    LAG: {
      kArm: 0.12,
      kLeg: 0.15,
      c1: 0.18,
      c2: 0.22
    },

    // Settle variation amplitude (radians added when pose is picked)
    SETTLE_VARIATION: 0.04,

    // Breathing parameters
    BREATHING: {
      period: 4.6,       // seconds
      bodyScaleY: 0.008, // +/- 0.8%
      armSpread: 0.012   // +/- 0.012 rad abduction
    },

    // Collision resolver parameters
    COLLISION: {
      margin: 0.20,       // bounding box shrink margin (units)
      stepSpread: 0.04,   // spread increment per step (rad)
      maxSpreadSteps: 14, // max steps (0.56 rad max outward correction)
      stepSwing: 0.05,    // swing reduction per step (rad)
      guardFreqHz: 30     // runtime guard check frequency
    },

    // Time scale multiplier (can be slowed down via ?debug or ?slow=N)
    timeScale: 1.0,

    // Debug options
    debugTintCollisions: false
  };

  // Expose configuration under AvatarRig
  const AvatarRig = {
    CONFIG,
    POSES: {},
    outwardSigns: {
      leftArm: 1,
      rightArm: -1,
      leftLeg: 1,
      rightLeg: -1
    }
  };

  // ==========================================================================
  // JOINT INDEX DEFINITIONS & PREALLOCATED BUFFERS
  // ==========================================================================
  // 6 joints: 0:head, 1:body, 2:leftArm, 3:rightArm, 4:leftLeg, 5:rightLeg
  const JOINT_NAMES = ['head', 'body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
  const JOINT_COUNT = 6;
  const DOF_COUNT = JOINT_COUNT * 3; // 18 DOFs (X=0, Y=1, Z=2 per joint)

  const J_HEAD      = 0;
  const J_BODY      = 1;
  const J_LEFT_ARM  = 2;
  const J_RIGHT_ARM = 3;
  const J_LEFT_LEG  = 4;
  const J_RIGHT_LEG = 5;

  // Float32Arrays for zero-allocation simulation updates
  const currentJointAngles     = new Float32Array(DOF_COUNT);
  const currentJointVelocities = new Float32Array(DOF_COUNT);
  const targetJointAngles      = new Float32Array(DOF_COUNT);
  const rawTargetJointAngles   = new Float32Array(DOF_COUNT);
  const settleVariationOffsets = new Float32Array(DOF_COUNT);
  const collisionOffsets       = new Float32Array(DOF_COUNT);
  const collisionVelocities    = new Float32Array(DOF_COUNT);
  const targetCollisionOffsets = new Float32Array(DOF_COUNT);
  const proceduralOffsets      = new Float32Array(DOF_COUNT);

  // Director layer overlay buffers
  const directorOverrides      = new Float32Array(DOF_COUNT);
  const directorWeights        = new Float32Array(DOF_COUNT);

  // Root transform (yaw, pitch, roll)
  const rootAngles             = new Float32Array(3);
  const rootVelocities         = new Float32Array(3);
  const targetRootAngles       = new Float32Array(3);

  // Organic drift pre-generated phases (3 sines per DOF)
  const driftPhases = new Float32Array(DOF_COUNT * 3);
  for (let i = 0; i < driftPhases.length; i++) {
    driftPhases[i] = Math.random() * Math.PI * 2;
  }
  const DRIFT_RATIOS = [1.0, 1.6180339, 2.4142135];
  const BASE_DRIFT_FREQ = 0.35; // Hz

  // Stage motion tracking for secondary lag
  let stageVx = 0;
  let stageVy = 0;
  let stageAx = 0;
  let stageAy = 0;
  let stageFlightW = 0;
  let stageHomeFloatAmp = 0;
  let prefersReducedMotion = false;
  try {
    prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  // Gesture overlay system
  let activeGesture = null;
  let gestureStartTime = 0;
  let gestureDuration = 0;
  const gestureRegistry = new Map();

  // Internal state
  let isInitialized = false;
  let playerRef = null;
  let skinRef = null;
  let innerMeshes = {};
  let lastUpdateTime = performance.now();
  let lastGuardTime = performance.now();
  let currentPoseName = 'float';
  let forcedPoseName = null;
  let isTransitionRouting = false;
  let routeTargetPoseName = null;
  let routeStartTime = 0;
  let isCollidingNow = false;
  let currentQualityTier = 'high';
  let isCanvasVisible = true;
  let lastRigCostMs = 0;
  let lastGuardCostMs = 0;

  // Cache for Three.js Vector3 and collision points
  let Vector3Class = null;
  let tempV = null;
  const samplePointsA = new Float32Array(3 * 5 * 3 * 3); // 45 points x 3 floats

  // ==========================================================================
  // RIG FACTS VERIFICATION & LOGGING
  // ==========================================================================
  function verifyRigFacts(player) {
    if (!player || !player.skin) return;
    const skin = player.skin;

    // 1. Derive outward sign dynamically from joint positions
    if (skin.leftArm)  AvatarRig.outwardSigns.leftArm  = Math.sign(skin.leftArm.position.x) || 1;
    if (skin.rightArm) AvatarRig.outwardSigns.rightArm = Math.sign(skin.rightArm.position.x) || -1;
    if (skin.leftLeg)  AvatarRig.outwardSigns.leftLeg  = Math.sign(skin.leftLeg.position.x) || 1;
    if (skin.rightLeg) AvatarRig.outwardSigns.rightLeg = Math.sign(skin.rightLeg.position.x) || -1;

    // 2. Vector3 constructor resolution
    if (skin.leftArm && skin.leftArm.position) {
      Vector3Class = skin.leftArm.position.constructor;
      tempV = new Vector3Class();
    }

    // 3. Cache inner meshes for collision resolver
    JOINT_NAMES.forEach((name) => {
      const joint = skin[name];
      if (!joint) return;
      let inner = null;
      joint.traverse((child) => {
        if (child.isMesh && (child.name === 'inner' || !inner)) {
          inner = child;
        }
      });
      if (inner && inner.geometry) {
        if (!inner.geometry.boundingBox) inner.geometry.computeBoundingBox();
        innerMeshes[name] = inner;
      }
    });

    // 4. Precompute sampling grid inside unit box [min, max] (inset top socket to prevent socket anchor false-positives)
    const bbArm = innerMeshes.leftArm ? innerMeshes.leftArm.geometry.boundingBox : { min: { x: -0.5, y: -0.5, z: -0.5 }, max: { x: 0.5, y: 0.5, z: 0.5 } };
    let pIdx = 0;
    for (let ix = 0; ix < 3; ix++) {
      const fx = bbArm.min.x + (bbArm.max.x - bbArm.min.x) * (ix / 2);
      for (let iy = 0; iy < 5; iy++) {
        const fy = bbArm.min.y + 0.45 * (iy / 4);
        for (let iz = 0; iz < 3; iz++) {
          const fz = bbArm.min.z + (bbArm.max.z - bbArm.min.z) * (iz / 2);
          samplePointsA[pIdx++] = fx;
          samplePointsA[pIdx++] = fy;
          samplePointsA[pIdx++] = fz;
        }
      }
    }

    // Log verified facts for ?debug audit
    console.log('[AvatarRig] Verified Rig Facts:');
    console.log(' - Euler Order: XYZ (Rx * Ry * Rz)');
    console.log(' - Facing: +Z, Up: +Y, Hanging arm: (0, -1, 0)');
    console.log(' - Negative rotation.x raises arm FORWARD');
    console.log(' - Outward Signs: leftArm=' + AvatarRig.outwardSigns.leftArm + ' (+z), rightArm=' + AvatarRig.outwardSigns.rightArm + ' (-z)');
    console.log(' - Head Pitch: negative rot.x looks UP');
    console.log(' - Body/Head Yaw: positive rot.y turns viewer-right (+X)');
  }

  // ==========================================================================
  // ANATOMICAL POSE AUTHORING HELPERS
  // ==========================================================================
  function outwardSign(jointName) {
    return AvatarRig.outwardSigns[jointName] !== undefined ? AvatarRig.outwardSigns[jointName] : (jointName.startsWith('left') ? 1 : -1);
  }

  function arm(side, { raise = 0, spread = 0.12, twist = 0 } = {}) {
    const jName = (side === 'left' || side === 'l') ? 'leftArm' : 'rightArm';
    const sign = outwardSign(jName);
    return {
      x: -raise,                 // negative x raises forward
      y: twist,                  // axial twist
      z: sign * Math.max(0, spread) // outward abduction
    };
  }

  function leg(side, { swing = 0, spread = 0.04 } = {}) {
    const jName = (side === 'left' || side === 'l') ? 'leftLeg' : 'rightLeg';
    const sign = outwardSign(jName);
    return {
      x: -swing,                 // negative x swings forward
      y: 0,
      z: sign * Math.max(0, spread) // outward abduction
    };
  }

  function head({ yaw = 0, pitch = 0, roll = 0 } = {}) {
    return {
      x: -pitch, // positive pitch = look up
      y: yaw,    // positive yaw = look viewer-right
      z: roll
    };
  }

  function body({ lean = 0, twist = 0, roll = 0 } = {}) {
    return {
      x: lean,   // positive lean = tilt forward
      y: twist,  // positive twist = twist viewer-right
      z: roll
    };
  }

  // Helper to pack authored pose into a 18-element Float32Array
  function packPose(p) {
    const arr = new Float32Array(DOF_COUNT);
    arr[0] = p.head.x;  arr[1] = p.head.y;  arr[2] = p.head.z;
    arr[3] = p.body.x;  arr[4] = p.body.y;  arr[5] = p.body.z;
    arr[6] = p.leftArm.x;  arr[7] = p.leftArm.y;  arr[8] = p.leftArm.z;
    arr[9] = p.rightArm.x; arr[10]= p.rightArm.y; arr[11]= p.rightArm.z;
    arr[12]= p.leftLeg.x;  arr[13]= p.leftLeg.y;  arr[14]= p.leftLeg.z;
    arr[15]= p.rightLeg.x; arr[16]= p.rightLeg.y; arr[17]= p.rightLeg.z;
    return arr;
  }

  // ==========================================================================
  // POSE LIBRARY (Authored in anatomical units with deliberate asymmetry)
  // ==========================================================================
  const RAW_POSES = {
    neutral: {
      head:     head({ yaw: 0, pitch: 0, roll: 0 }),
      body:     body({ lean: 0, twist: 0, roll: 0 }),
      leftArm:  arm('left',  { raise: 0, spread: 0.28, twist: 0 }),
      rightArm: arm('right', { raise: 0, spread: 0.28, twist: 0 }),
      leftLeg:  leg('left',  { swing: -0.02, spread: 0.04 }),
      rightLeg: leg('right', { swing: 0.02, spread: 0.04 })
    },
    float: {
      head:     head({ yaw: 0.02, pitch: 0.03, roll: 0 }),
      body:     body({ lean: 0.04, twist: 0, roll: 0 }),
      leftArm:  arm('left',  { raise: 0.06, spread: 0.24, twist: 0.08 }),
      rightArm: arm('right', { raise: 0.06, spread: 0.26, twist: -0.08 }),
      leftLeg:  leg('left',  { swing: 0.08, spread: 0.06 }),
      rightLeg: leg('right', { swing: -0.05, spread: 0.06 })
    },
    rest: {
      head:     head({ yaw: 0.05, pitch: -0.02, roll: 0 }),
      body:     body({ lean: 0.04, twist: 0.02, roll: 0.02 }),
      leftArm:  arm('left',  { raise: 0.08, spread: 0.24, twist: 0 }),
      rightArm: arm('right', { raise: 0.04, spread: 0.24, twist: 0 }),
      leftLeg:  leg('left',  { swing: 0.12, spread: 0.04 }),
      rightLeg: leg('right', { swing: -0.06, spread: 0.04 })
    },
    open: {
      head:     head({ yaw: 0, pitch: 0.04, roll: 0 }),
      body:     body({ lean: -0.02, twist: 0, roll: 0 }),
      leftArm:  arm('left',  { raise: 0.15, spread: 0.38, twist: -0.15 }),
      rightArm: arm('right', { raise: 0.15, spread: 0.38, twist: 0.15 }),
      leftLeg:  leg('left',  { swing: -0.04, spread: 0.05 }),
      rightLeg: leg('right', { swing: 0.04, spread: 0.05 })
    },
    reach: {
      head:     head({ yaw: 0.10, pitch: 0.05, roll: 0 }),
      body:     body({ lean: 0.04, twist: -0.08, roll: 0 }),
      leftArm:  arm('left',  { raise: -0.10, spread: 0.28, twist: 0 }),
      rightArm: arm('right', { raise: 1.20, spread: 0.30, twist: -0.10 }),
      leftLeg:  leg('left',  { swing: -0.08, spread: 0.04 }),
      rightLeg: leg('right', { swing: 0.10, spread: 0.04 })
    },
    wave: {
      head:     head({ yaw: 0.10, pitch: 0.08, roll: 0.05 }),
      body:     body({ lean: 0.02, twist: -0.05, roll: -0.03 }),
      leftArm:  arm('left',  { raise: -0.08, spread: 0.30, twist: 0 }),
      rightArm: arm('right', { raise: 2.60, spread: 0.38, twist: 0.20 }),
      leftLeg:  leg('left',  { swing: 0.02, spread: 0.04 }),
      rightLeg: leg('right', { swing: -0.02, spread: 0.04 })
    },
    fly: {
      head:     head({ yaw: 0, pitch: 0.20, roll: 0 }),
      body:     body({ lean: 0.35, twist: 0, roll: 0 }),
      leftArm:  arm('left',  { raise: 1.50, spread: 0.28, twist: 0 }),
      rightArm: arm('right', { raise: 1.50, spread: 0.28, twist: 0 }),
      leftLeg:  leg('left',  { swing: -0.25, spread: 0.05 }),
      rightLeg: leg('right', { swing: -0.25, spread: 0.05 })
    },
    write: {
      head:     head({ yaw: 0.15, pitch: -0.10, roll: 0 }),
      body:     body({ lean: 0.30, twist: 0.08, roll: 0 }),
      leftArm:  arm('left',  { raise: 0.85, spread: 0.28, twist: 0.10 }),
      rightArm: arm('right', { raise: -0.25, spread: 0.28, twist: -0.10 }),
      leftLeg:  leg('left',  { swing: -0.18, spread: 0.05 }),
      rightLeg: leg('right', { swing: -0.25, spread: 0.05 })
    },
    tilt: {
      head:     head({ yaw: 0.05, pitch: 0, roll: -0.08 }),
      body:     body({ lean: 0.05, twist: 0.10, roll: 0.12 }),
      leftArm:  arm('left',  { raise: 0.06, spread: 0.28, twist: 0 }),
      rightArm: arm('right', { raise: 0.14, spread: 0.30, twist: 0 }),
      leftLeg:  leg('left',  { swing: -0.06, spread: 0.08 }),
      rightLeg: leg('right', { swing: 0.08, spread: 0.08 })
    },
    point: {
      head:     head({ yaw: 0.15, pitch: 0.05, roll: 0 }),
      body:     body({ lean: 0.02, twist: -0.15, roll: 0 }),
      leftArm:  arm('left',  { raise: -0.08, spread: 0.32, twist: 0 }),
      rightArm: arm('right', { raise: 1.45, spread: 0.32, twist: -0.15 }),
      leftLeg:  leg('left',  { swing: -0.05, spread: 0.04 }),
      rightLeg: leg('right', { swing: 0.08, spread: 0.04 })
    },
    hold: {
      head:     head({ yaw: 0, pitch: 0, roll: 0 }),
      body:     body({ lean: 0.04, twist: 0, roll: 0 }),
      leftArm:  arm('left',  { raise: 0.30, spread: 0.28, twist: 0.10 }),
      rightArm: arm('right', { raise: 0.30, spread: 0.28, twist: -0.10 }),
      leftLeg:  leg('left',  { swing: -0.04, spread: 0.04 }),
      rightLeg: leg('right', { swing: 0.04, spread: 0.04 })
    },
    place: {
      head:     head({ yaw: 0.10, pitch: 0.05, roll: 0 }),
      body:     body({ lean: 0.15, twist: -0.08, roll: 0 }),
      leftArm:  arm('left',  { raise: 0.30, spread: 0.28, twist: 0 }),
      rightArm: arm('right', { raise: 0.85, spread: 0.30, twist: -0.20 }),
      leftLeg:  leg('left',  { swing: -0.12, spread: 0.04 }),
      rightLeg: leg('right', { swing: 0.10, spread: 0.04 })
    }
  };

  // Compile and store packed Float32Array poses
  Object.keys(RAW_POSES).forEach((key) => {
    AvatarRig.POSES[key] = packPose(RAW_POSES[key]);
  });

  // ==========================================================================
  // LEVEL 3: SELF-COLLISION RESOLVER ENGINE
  // ==========================================================================
  // Pairs to test: [partA, partB, limbJointToAdjust]
  const COLLISION_PAIRS = [
    { a: 'leftArm',  b: 'body',     limb: J_LEFT_ARM },
    { a: 'rightArm', b: 'body',     limb: J_RIGHT_ARM },
    { a: 'leftArm',  b: 'head',     limb: J_LEFT_ARM },
    { a: 'rightArm', b: 'head',     limb: J_RIGHT_ARM },
    { a: 'leftLeg',  b: 'rightLeg', limb: J_LEFT_LEG },
    { a: 'leftArm',  b: 'leftLeg',  limb: J_LEFT_ARM },
    { a: 'rightArm', b: 'rightLeg', limb: J_RIGHT_ARM }
  ];

  function testPairCollision(meshA, meshB) {
    if (!meshA || !meshB || !tempV) return false;
    const bbB = meshB.geometry.boundingBox;
    if (!bbB) return false;

    const margin = CONFIG.COLLISION.margin;
    const minX = bbB.min.x + margin, maxX = bbB.max.x - margin;
    const minY = bbB.min.y + margin, maxY = bbB.max.y - margin;
    const minZ = bbB.min.z + margin, maxZ = bbB.max.z - margin;

    const matA = meshA.matrixWorld;
    const pts = samplePointsA;
    const len = pts.length;

    for (let i = 0; i < len; i += 3) {
      tempV.set(pts[i], pts[i + 1], pts[i + 2]);
      tempV.applyMatrix4(matA);
      meshB.worldToLocal(tempV);
      if (tempV.x >= minX && tempV.x <= maxX &&
          tempV.y >= minY && tempV.y <= maxY &&
          tempV.z >= minZ && tempV.z <= maxZ) {
        return true;
      }
    }
    return false;
  }

  function checkAnyCollision() {
    if (!skinRef || !playerRef) return false;
    playerRef.updateMatrixWorld(true);

    for (let i = 0; i < COLLISION_PAIRS.length; i++) {
      const pair = COLLISION_PAIRS[i];
      const mA = innerMeshes[pair.a];
      const mB = innerMeshes[pair.b];
      if (testPairCollision(mA, mB)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Offline / target pose collision resolver:
   * Takes a 18-element Float32Array pose, applies it temporarily,
   * tests pairs, and adjusts limb spread / swing until clean.
   */
  function resolvePoseCollisions(poseArr) {
    if (!skinRef || !playerRef) return poseArr;

    // Save current joint rotations
    const saved = new Float32Array(DOF_COUNT);
    for (let i = 0; i < JOINT_COUNT; i++) {
      const j = skinRef[JOINT_NAMES[i]];
      if (j) {
        saved[i * 3 + 0] = j.rotation.x;
        saved[i * 3 + 1] = j.rotation.y;
        saved[i * 3 + 2] = j.rotation.z;
      }
    }

    // Apply target pose
    for (let i = 0; i < JOINT_COUNT; i++) {
      const j = skinRef[JOINT_NAMES[i]];
      if (j) {
        j.rotation.set(poseArr[i * 3 + 0], poseArr[i * 3 + 1], poseArr[i * 3 + 2]);
      }
    }
    playerRef.updateMatrixWorld(true);

    // Resolve collisions
    const maxSteps = CONFIG.COLLISION.maxSpreadSteps;
    const stepSpread = CONFIG.COLLISION.stepSpread;
    const stepSwing = CONFIG.COLLISION.stepSwing;

    for (let p = 0; p < COLLISION_PAIRS.length; p++) {
      const pair = COLLISION_PAIRS[p];
      const mA = innerMeshes[pair.a];
      const mB = innerMeshes[pair.b];
      if (!mA || !mB) continue;

      let colliding = testPairCollision(mA, mB);
      if (colliding) {
        const jObj = skinRef[pair.a];
        const jIdx = pair.limb;
        const sign = outwardSign(pair.a);

        // Stage 1: Increase spread in steps
        for (let s = 0; s < maxSteps && colliding; s++) {
          poseArr[jIdx * 3 + 2] += stepSpread * sign;
          if (jObj) jObj.rotation.z = poseArr[jIdx * 3 + 2];
          playerRef.updateMatrixWorld(true);
          colliding = testPairCollision(mA, mB);
        }

        // Stage 2: If still colliding, reduce forward swing toward 0
        if (colliding) {
          for (let s = 0; s < 10 && colliding; s++) {
            const curRx = poseArr[jIdx * 3 + 0];
            poseArr[jIdx * 3 + 0] += stepSwing * Math.sign(-curRx || 1);
            if (jObj) jObj.rotation.x = poseArr[jIdx * 3 + 0];
            playerRef.updateMatrixWorld(true);
            colliding = testPairCollision(mA, mB);
          }
        }
      }
    }

    // Restore saved rotations
    for (let i = 0; i < JOINT_COUNT; i++) {
      const j = skinRef[JOINT_NAMES[i]];
      if (j) {
        j.rotation.set(saved[i * 3 + 0], saved[i * 3 + 1], saved[i * 3 + 2]);
      }
    }
    playerRef.updateMatrixWorld(true);

    return poseArr;
  }

  // Pre-resolve all authored poses on load
  function preResolveAllPoses() {
    Object.keys(AvatarRig.POSES).forEach((key) => {
      resolvePoseCollisions(AvatarRig.POSES[key]);
    });
  }

  // ==========================================================================
  // SPRING MOTION CORE (Semi-implicit Euler with substeps)
  // ==========================================================================
  function smoothSoftLimit(x, min, max, margin = 0.08) {
    if (x > max) {
      const excess = x - max;
      return max + Math.tanh(excess / margin) * margin;
    }
    if (x < min) {
      const excess = min - x;
      return min - Math.tanh(excess / margin) * margin;
    }
    return x;
  }

  function getJointLimits(jIdx, axis) {
    const L = CONFIG.LIMITS;
    if (jIdx === J_HEAD) {
      if (axis === 0) return L.headPitch;
      if (axis === 1) return L.headYaw;
      if (axis === 2) return L.headRoll;
    } else if (jIdx === J_BODY) {
      if (axis === 0) return L.bodyLean;
      if (axis === 1) return L.bodyYaw;
      if (axis === 2) return L.bodyRoll;
    } else if (jIdx === J_LEFT_ARM || jIdx === J_RIGHT_ARM) {
      if (axis === 0) return L.armRaise;
    } else if (jIdx === J_LEFT_LEG || jIdx === J_RIGHT_LEG) {
      if (axis === 0) return L.legSwing;
    }
    return null;
  }

  function getSpringParams(jIdx) {
    const S = CONFIG.SPRINGS;
    if (jIdx === J_HEAD) return S.head;
    if (jIdx === J_BODY) return S.body;
    if (jIdx === J_LEFT_ARM || jIdx === J_RIGHT_ARM) return S.arms;
    if (jIdx === J_LEFT_LEG || jIdx === J_RIGHT_LEG) return S.legs;
    return S.body;
  }

  function getRateLimit(jIdx) {
    const R = CONFIG.RATE_LIMITS;
    if (jIdx === J_HEAD) return R.head;
    if (jIdx === J_BODY) return R.body;
    if (jIdx === J_LEFT_ARM || jIdx === J_RIGHT_ARM) return R.arms;
    if (jIdx === J_LEFT_LEG || jIdx === J_RIGHT_LEG) return R.legs;
    return 6.0;
  }

  // ==========================================================================
  // UPDATE LOOP (Single Animation Owner)
  // ==========================================================================
  function update(dtRaw) {
    if (!isInitialized || !skinRef || !playerRef) return;
    const rigT0 = (window.AvatarDebug && window.AvatarDebug.isPerfActive && window.AvatarDebug.isPerfActive()) ? performance.now() : 0;

    // Apply rig time scale
    const effectiveDt = Math.max(0.001, Math.min(1 / 30, dtRaw * (CONFIG.timeScale || 1.0)));
    const nowSec = performance.now() / 1000;

    // Allow AvatarDirector to evaluate solvers, gaze, torso sharing, and gesture clips
    if (typeof window !== 'undefined' && window.AvatarDirector && typeof window.AvatarDirector.update === 'function') {
      window.AvatarDirector.update(effectiveDt);
    }

    // 1. Procedural Layers: Breathing, Organic Drift, Secondary Motion
    let breathArmSpread = 0;
    let lagArmL = 0;
    let lagArmR = 0;
    let lagLegs = 0;
    let bodyLeanSecondary = 0;
    let bodyRollSecondary = 0;
    let writeCircleX = 0;
    let writeCircleY = 0;
    let writeFlutter = 0;
    let flightFlutter = 0;

    if (!prefersReducedMotion) {
      const breathOmega = (2 * Math.PI) / CONFIG.BREATHING.period;
      const breathVal = Math.sin(nowSec * breathOmega);

      // Breathing on body scale Y and arm spread
      if (skinRef.body) {
        skinRef.body.scale.y = 1 + CONFIG.BREATHING.bodyScaleY * breathVal;
      }
      breathArmSpread = CONFIG.BREATHING.armSpread * (breathVal * 0.5 + 0.5);

      // Compute drift for all 18 DOFs (calms during high-speed flight, amplified in home float)
      const driftFlightScale = 1 - stageFlightW * 0.7;
      const driftHomeScale = stageHomeFloatAmp > 0.001 ? (stageHomeFloatAmp * 1.5 + 0.5) : 1.0;
      const driftMasterScale = driftFlightScale * driftHomeScale;

      for (let j = 0; j < JOINT_COUNT; j++) {
        let amp = 0.025;
        if (j === J_HEAD) amp = CONFIG.DRIFT.head;
        else if (j === J_BODY) amp = CONFIG.DRIFT.body;
        else if (j === J_LEFT_ARM || j === J_RIGHT_ARM) amp = CONFIG.DRIFT.arms;
        else if (j === J_LEFT_LEG || j === J_RIGHT_LEG) amp = CONFIG.DRIFT.legs;
        amp *= driftMasterScale;

        for (let ax = 0; ax < 3; ax++) {
          const dof = j * 3 + ax;
          const p0 = driftPhases[dof * 3 + 0];
          const p1 = driftPhases[dof * 3 + 1];
          const p2 = driftPhases[dof * 3 + 2];

          const s0 = Math.sin(nowSec * (2 * Math.PI * BASE_DRIFT_FREQ * DRIFT_RATIOS[0]) + p0);
          const s1 = Math.sin(nowSec * (2 * Math.PI * BASE_DRIFT_FREQ * DRIFT_RATIOS[1]) + p1);
          const s2 = Math.sin(nowSec * (2 * Math.PI * BASE_DRIFT_FREQ * DRIFT_RATIOS[2]) + p2);

          proceduralOffsets[dof] = amp * (s0 + s1 + s2) * (1 / 3);
        }
      }

      // Secondary motion lag from stage motion
      lagArmL = -stageAx * CONFIG.LAG.kArm;
      lagArmR =  stageAx * CONFIG.LAG.kArm;
      lagLegs = -stageAy * CONFIG.LAG.kLeg;
      bodyLeanSecondary = Math.max(-0.25, Math.min(0.55, CONFIG.LAG.c1 * stageVy - CONFIG.LAG.c2 * stageAy));
      bodyRollSecondary = Math.max(-0.25, Math.min(0.25, -stageVx * 0.15));

      // Flight leg flutter
      if (stageFlightW > 0.05) {
        flightFlutter = 0.08 * Math.sin(nowSec * 14.0) * stageFlightW;
      }

      // Write pose micro-motion (pen arm circular pulse + subtle leg flutter)
      if (currentPoseName === 'write') {
        writeCircleX = Math.sin(nowSec * 16.0) * 0.06;
        writeCircleY = Math.cos(nowSec * 16.0) * 0.06;
        writeFlutter = 0.08 * Math.sin(nowSec * 12.0);
      }
    } else {
      proceduralOffsets.fill(0);
      if (skinRef.body) skinRef.body.scale.y = 1;
    }

    // 2. Active gesture overlay
    let gestureWaveOscZ = 0;
    if (activeGesture === 'wave') {
      const elapsed = nowSec - gestureStartTime;
      if (elapsed < gestureDuration) {
        gestureWaveOscZ = Math.sin(nowSec * 7.5) * 0.35 * outwardSign('rightArm');
      } else {
        activeGesture = null;
      }
    }

    // 3. Assemble full target angles into targetJointAngles
    for (let j = 0; j < JOINT_COUNT; j++) {
      for (let ax = 0; ax < 3; ax++) {
        const dof = j * 3 + ax;
        let val = rawTargetJointAngles[dof] + (prefersReducedMotion ? 0 : settleVariationOffsets[dof]) + proceduralOffsets[dof];

        // Director layer overlay blend (gestures, aiming, music sway)
        const dWeight = directorWeights[dof];
        if (dWeight > 0.001) {
          val = val * (1 - dWeight) + directorOverrides[dof] * dWeight;
        }

        // Add breathing & lag to limb spread
        if (j === J_LEFT_ARM && ax === 0)  val += writeCircleX;
        if (j === J_LEFT_ARM && ax === 1)  val += writeCircleY;
        if (j === J_LEFT_ARM && ax === 2)  val += (breathArmSpread + lagArmL) * outwardSign('leftArm');
        if (j === J_RIGHT_ARM && ax === 2) val += (breathArmSpread + lagArmR) * outwardSign('rightArm');
        if (j === J_LEFT_LEG && ax === 0)  val += lagLegs + flightFlutter + writeFlutter;
        if (j === J_RIGHT_LEG && ax === 0) val += lagLegs - flightFlutter - writeFlutter;
        if (j === J_BODY && ax === 0)      val += bodyLeanSecondary;
        if (j === J_BODY && ax === 2)      val += bodyRollSecondary;

        // Guaranteed arm spread clearance to prevent limb-torso penetration
        const bodyTurnAbs = Math.abs(currentJointAngles[J_BODY * 3 + 1]);
        const minArmClearance = 0.28 + bodyTurnAbs * 0.40;
        if (j === J_LEFT_ARM && ax === 2)  val = Math.max(minArmClearance, val);
        if (j === J_RIGHT_ARM && ax === 2) val = Math.min(-minArmClearance, val);

        // Add gesture wave oscillation
        if (j === J_RIGHT_ARM && ax === 2 && activeGesture === 'wave') val += gestureWaveOscZ;

        // Apply soft joint limits to target
        const lim = getJointLimits(j, ax);
        if (lim) {
          val = smoothSoftLimit(val, lim[0], lim[1]);
        }

        targetJointAngles[dof] = val;
      }
    }

    // 4. Multi-substep spring integration (substep <= 1/120s)
    const substepCount = Math.max(1, Math.min(8, Math.ceil(effectiveDt / (1 / 120))));
    const h = effectiveDt / substepCount;

    for (let step = 0; step < substepCount; step++) {
      // Joints spring integration
      for (let j = 0; j < JOINT_COUNT; j++) {
        const sp = getSpringParams(j);
        const wn = 2 * Math.PI * sp.freq;
        const maxRate = getRateLimit(j);

        for (let ax = 0; ax < 3; ax++) {
          const dof = j * 3 + ax;
          const pos = currentJointAngles[dof];
          const vel = currentJointVelocities[dof];
          const tgt = targetJointAngles[dof];

          // Spring acceleration: a = wn^2 * (target - pos) - 2 * zeta * wn * vel
          const accel = (wn * wn) * (tgt - pos) - (2 * sp.damping * wn) * vel;
          let newVel = vel + accel * h;

          // Rate limiter clamp
          if (newVel > maxRate) newVel = maxRate;
          else if (newVel < -maxRate) newVel = -maxRate;

          currentJointVelocities[dof] = newVel;
          let newPos = pos + newVel * h;

          // Soft limit compression
          const lim = getJointLimits(j, ax);
          if (lim) {
            newPos = smoothSoftLimit(newPos, lim[0], lim[1]);
          }

          // Enforce rigid physical clearance between arms and torso
          if (j === J_LEFT_ARM && ax === 2) {
            const bTurn = Math.abs(currentJointAngles[J_BODY * 3 + 1]);
            const minC = 0.28 + bTurn * 0.45;
            if (newPos < minC) {
              newPos = minC;
              if (newVel < 0) newVel = 0;
            }
          }
          if (j === J_RIGHT_ARM && ax === 2) {
            const bTurn = Math.abs(currentJointAngles[J_BODY * 3 + 1]);
            const minC = 0.28 + bTurn * 0.45;
            if (newPos > -minC) {
              newPos = -minC;
              if (newVel > 0) newVel = 0;
            }
          }

          currentJointAngles[dof] = newPos;
        }
      }

      // Root yaw/pitch/roll spring integration
      const rSp = CONFIG.SPRINGS.rootYaw;
      const rWn = 2 * Math.PI * rSp.freq;
      const rRate = CONFIG.RATE_LIMITS.rootYaw;
      for (let ax = 0; ax < 3; ax++) {
        const rPos = rootAngles[ax];
        const rVel = rootVelocities[ax];
        const rTgt = targetRootAngles[ax];

        const rAccel = (rWn * rWn) * (rTgt - rPos) - (2 * rSp.damping * rWn) * rVel;
        let newRVel = rVel + rAccel * h;
        if (newRVel > rRate) newRVel = rRate;
        else if (newRVel < -rRate) newRVel = -rRate;

        rootVelocities[ax] = newRVel;
        rootAngles[ax] = rPos + newRVel * h;
      }

      // Collision offset spring smoothing
      const cSp = CONFIG.SPRINGS.collision;
      const cWn = 2 * Math.PI * cSp.freq;
      for (let dof = 0; dof < DOF_COUNT; dof++) {
        const cPos = collisionOffsets[dof];
        const cVel = collisionVelocities[dof];
        const cTgt = targetCollisionOffsets[dof];

        const cAccel = (cWn * cWn) * (cTgt - cPos) - (2 * cSp.damping * cWn) * cVel;
        const newCVel = cVel + cAccel * h;
        collisionVelocities[dof] = newCVel;
        collisionOffsets[dof] = cPos + newCVel * h;
      }
    }

    // 5. Apply computed rotations directly to Three.js joints
    for (let j = 0; j < JOINT_COUNT; j++) {
      const jointObj = skinRef[JOINT_NAMES[j]];
      if (jointObj) {
        const dof = j * 3;
        jointObj.rotation.x = currentJointAngles[dof + 0] + collisionOffsets[dof + 0];
        jointObj.rotation.y = currentJointAngles[dof + 1] + collisionOffsets[dof + 1];
        jointObj.rotation.z = currentJointAngles[dof + 2] + collisionOffsets[dof + 2];
      }
    }

    // Apply root yaw/pitch/roll
    playerRef.rotation.y = rootAngles[0];

    // 6. Runtime collision guard check (30 Hz high, 15 Hz medium, 8 Hz low)
    const guardFreq = (currentQualityTier === 'low') ? 8 : (currentQualityTier === 'medium') ? 15 : (CONFIG.COLLISION.guardFreqHz || 30);
    const guardIntervalMs = 1000 / guardFreq;
    const nowMs = performance.now();
    let isHidden = false;
    try { isHidden = typeof document !== 'undefined' && document.hidden; } catch (e) {}

    if (!isHidden && isCanvasVisible && (nowMs - lastGuardTime >= guardIntervalMs)) {
      const guardT0 = (window.AvatarDebug && window.AvatarDebug.isPerfActive && window.AvatarDebug.isPerfActive()) ? performance.now() : 0;
      lastGuardTime = nowMs;
      playerRef.updateMatrixWorld(true);

      isCollidingNow = false;
      for (let p = 0; p < COLLISION_PAIRS.length; p++) {
        const pair = COLLISION_PAIRS[p];
        const mA = innerMeshes[pair.a];
        const mB = innerMeshes[pair.b];
        if (!mA || !mB) continue;

        if (testPairCollision(mA, mB)) {
          isCollidingNow = true;
          // Step outward correction
          const jIdx = pair.limb;
          const sign = outwardSign(pair.a);
          targetCollisionOffsets[jIdx * 3 + 2] += CONFIG.COLLISION.stepSpread * sign;
        } else {
          // Slowly decay correction offset back to zero
          const jIdx = pair.limb;
          targetCollisionOffsets[jIdx * 3 + 2] *= 0.92;
        }
      }

      // Tint colliding parts red if debug tint option is enabled
      if (CONFIG.debugTintCollisions) {
        JOINT_NAMES.forEach((name) => {
          const mesh = innerMeshes[name];
          if (mesh && mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              if (m.emissive) {
                if (isCollidingNow) m.emissive.set('#ff0055');
                else m.emissive.set(CONFIG.AVATAR_EMISSIVE || '#0c1238');
              }
            });
          }
        });
      }

      if (guardT0 > 0 && window.AvatarDebug && typeof window.AvatarDebug.recordMetric === 'function') {
        lastGuardCostMs = performance.now() - guardT0;
        window.AvatarDebug.recordMetric('collisionGuard', lastGuardCostMs);
      }
    }

    if (rigT0 > 0 && window.AvatarDebug && typeof window.AvatarDebug.recordMetric === 'function') {
      lastRigCostMs = performance.now() - rigT0;
      window.AvatarDebug.recordMetric('avatarRigUpdate', lastRigCostMs);
    }
  }

  // ==========================================================================
  // PUBLIC CONTROL & GESTURE API
  // ==========================================================================
  function setPose(poseName, options = {}) {
    if (!AvatarRig.POSES[poseName]) {
      console.warn(`[AvatarRig] Unknown pose name: ${poseName}`);
      return;
    }
    if (poseName === currentPoseName && !forcedPoseName) return;

    const targetPack = AvatarRig.POSES[poseName];

    // Test 50% blend mix for collision before transitioning
    if (isInitialized && skinRef && playerRef) {
      const halfMix = new Float32Array(DOF_COUNT);
      for (let i = 0; i < DOF_COUNT; i++) {
        halfMix[i] = currentJointAngles[i] * 0.5 + targetPack[i] * 0.5;
      }
      // Temporarily set and test
      for (let j = 0; j < JOINT_COUNT; j++) {
        const obj = skinRef[JOINT_NAMES[j]];
        if (obj) obj.rotation.set(halfMix[j * 3 + 0], halfMix[j * 3 + 1], halfMix[j * 3 + 2]);
      }
      playerRef.updateMatrixWorld(true);

      const collidesInMid = checkAnyCollision();
      // Restore current
      for (let j = 0; j < JOINT_COUNT; j++) {
        const obj = skinRef[JOINT_NAMES[j]];
        if (obj) obj.rotation.set(currentJointAngles[j * 3 + 0], currentJointAngles[j * 3 + 1], currentJointAngles[j * 3 + 2]);
      }
      playerRef.updateMatrixWorld(true);

      if (collidesInMid && poseName !== 'neutral') {
        // Route through 'neutral' first to avoid penetration during transition
        isTransitionRouting = true;
        routeTargetPoseName = poseName;
        routeStartTime = performance.now();
        setPose('neutral');
        setTimeout(() => {
          if (isTransitionRouting && routeTargetPoseName === poseName) {
            isTransitionRouting = false;
            setPose(poseName);
          }
        }, 320);
        return;
      }
    }

    currentPoseName = poseName;

    // Apply pose to rawTargetJointAngles
    for (let i = 0; i < DOF_COUNT; i++) {
      rawTargetJointAngles[i] = targetPack[i];
    }

    // Add subtle settle variation (+/- 0.04 rad) so poses feel alive and non-repetitive
    const vAmp = CONFIG.SETTLE_VARIATION;
    for (let j = 0; j < JOINT_COUNT; j++) {
      settleVariationOffsets[j * 3 + 0] = (Math.random() - 0.5) * vAmp;
      settleVariationOffsets[j * 3 + 1] = (Math.random() - 0.5) * vAmp;
      settleVariationOffsets[j * 3 + 2] = (Math.random() - 0.5) * vAmp;
    }
  }

  function setLook(yawRad, pitchRad, rollRad = 0) {
    // Soft clamp limits
    const limPitch = CONFIG.LIMITS.headPitch;
    const limYaw = CONFIG.LIMITS.headYaw;
    const limRoll = CONFIG.LIMITS.headRoll;

    const clampedPitch = smoothSoftLimit(pitchRad, limPitch[0], limPitch[1]);
    const clampedYaw = smoothSoftLimit(yawRad, limYaw[0], limYaw[1]);
    const clampedRoll = smoothSoftLimit(rollRad, limRoll[0], limRoll[1]);

    // Head DOFs: X=pitch (negative x is up), Y=yaw, Z=roll
    rawTargetJointAngles[J_HEAD * 3 + 0] = -clampedPitch;
    rawTargetJointAngles[J_HEAD * 3 + 1] = clampedYaw;
    rawTargetJointAngles[J_HEAD * 3 + 2] = clampedRoll;
  }

  function setRootYaw(yawRad) {
    targetRootAngles[0] = yawRad;
  }

  function setStageMotion(vx, vy, ax, ay) {
    stageVx = vx;
    stageVy = vy;
    stageAx = ax;
    stageAy = ay;
  }

  function setFlightW(w) {
    stageFlightW = Math.max(0, Math.min(1, w));
  }

  function setHomeFloatAmp(amp) {
    stageHomeFloatAmp = Math.max(0, Math.min(1, amp));
  }

  function setSlowMo(factor) {
    CONFIG.timeScale = Math.max(0.05, Math.min(2.0, factor));
  }

  function setTintCollisions(enabled) {
    CONFIG.debugTintCollisions = !!enabled;
  }

  function setReducedMotion(enabled) {
    prefersReducedMotion = !!enabled;
  }

  function setQualityTier(tier) {
    currentQualityTier = tier;
    CONFIG.COLLISION.guardFreqHz = (tier === 'low') ? 8 : (tier === 'medium') ? 15 : 30;
  }

  function triggerGesture(gestureName, options = {}) {
    activeGesture = gestureName;
    gestureStartTime = performance.now() / 1000;
    gestureDuration = options.duration || 2.0;
    if (gestureName === 'wave') {
      setPose('wave');
    }
  }

  function registerGesture(name, handler) {
    gestureRegistry.set(name, handler);
  }

  function setDirectorOverlay(overrides, weights) {
    if (overrides) {
      for (let i = 0; i < DOF_COUNT; i++) directorOverrides[i] = overrides[i];
    }
    if (weights) {
      for (let i = 0; i < DOF_COUNT; i++) directorWeights[i] = weights[i];
    }
  }

  function clearDirectorOverlay() {
    for (let i = 0; i < DOF_COUNT; i++) directorWeights[i] = 0;
  }

  function setForcedPose(poseName) {
    forcedPoseName = poseName;
    if (poseName) {
      setPose(poseName);
    }
  }

  function pickNextPose(sectionId) {
    if (forcedPoseName) {
      setPose(forcedPoseName);
      return;
    }

    let pool = ['float', 'rest', 'open', 'reach', 'neutral'];
    if (sectionId === 'chi_sono') {
      pool = ['rest', 'open', 'neutral'];
    } else if (sectionId === 'esperienze') {
      pool = ['neutral', 'point', 'rest'];
    } else if (sectionId === 'contatti') {
      pool = ['open', 'neutral'];
    }

    const available = pool.filter((p) => p !== currentPoseName);
    const next = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : pool[0];
    setPose(next);
  }

  // ==========================================================================
  // INITIALIZATION ON PLAYEROBJECT
  // ==========================================================================
  function init(player, skinViewer) {
    if (!player || !player.skin) return;
    playerRef = player;
    skinRef = player.skin;

    verifyRigFacts(player);
    preResolveAllPoses();

    // Start in float pose
    const initialPose = AvatarRig.POSES.float || AvatarRig.POSES.neutral;
    for (let i = 0; i < DOF_COUNT; i++) {
      rawTargetJointAngles[i] = initialPose[i];
      targetJointAngles[i] = initialPose[i];
      currentJointAngles[i] = initialPose[i];
      currentJointVelocities[i] = 0;
    }

    isInitialized = true;
    console.log('[AvatarRig] Initialized with Single Animation Owner.');
  }

  // ==========================================================================
  // VALIDATION SUITE DELEGATION
  // ==========================================================================
  function validate() {
    if (window.AvatarDebug && typeof window.AvatarDebug.validateRig === 'function') {
      return window.AvatarDebug.validateRig();
    }
    console.warn('[AvatarRig] AvatarDebug module not loaded. Load with ?debug, ?autotest, or include avatar-debug.js');
    return { passes: false, error: 'AvatarDebug module not loaded' };
  }

  // ==========================================================================
  // RigAnimation SUBCLASS (Skinview3d PlayerAnimation Interface)
  // ==========================================================================
  const BaseAnimation = (window.skinview3d && window.skinview3d.PlayerAnimation)
    ? window.skinview3d.PlayerAnimation
    : class {};

  class RigAnimation extends BaseAnimation {
    constructor() {
      super();
      this.hasDoneChiSonoWave = false;
      this.holdDuration = 6.0;
      this.holdStartTime = performance.now() / 1000;
      this.currentSection = 'home';
    }

    get currentPoseName() {
      return currentPoseName;
    }

    get forcedPose() {
      return forcedPoseName;
    }

    set forcedPose(val) {
      setForcedPose(val);
    }

    transitionTo(poseName, customDuration) {
      setPose(poseName, { duration: customDuration });
    }

    triggerWave(duration = 2.0) {
      triggerGesture('wave', { duration });
    }

    onSectionChange(sectionId) {
      this.currentSection = sectionId;
      if (typeof window !== 'undefined' && window.AvatarDirector) {
        return; // AvatarDirector manages section poses, gaze, and arrival gestures
      }
      if (sectionId === 'home') {
        setPose('float');
      } else if (sectionId === 'chi_sono') {
        setPose('rest');
        this.holdDuration = Math.random() * 4 + 6;
        this.holdStartTime = performance.now() / 1000;
      } else if (sectionId === 'esperienze') {
        setPose('neutral');
        this.holdDuration = Math.random() * 4 + 6;
        this.holdStartTime = performance.now() / 1000;
      } else if (sectionId === 'esperienze-detail') {
        setPose('point');
      } else if (sectionId === 'contatti') {
        this.triggerWave(2.0);
      }
    }

    onCardHover(isHovered) {
      if (typeof window !== 'undefined' && window.AvatarDirector) return;
      if (this.currentSection === 'esperienze' && !forcedPoseName) {
        if (isHovered) {
          setPose('point');
        } else {
          setPose('neutral');
        }
      }
    }

    pickNextPose() {
      pickNextPose(this.currentSection);
      this.holdDuration = Math.random() * 4 + 6;
      this.holdStartTime = performance.now() / 1000;
    }

    update(player, delta) {
      this.animate(player, delta);
    }

    animate(player) {
      if (!player) return;
      if (!isInitialized) {
        init(player);
      }

      const now = performance.now();
      const dt = Math.min(0.1, (now - lastUpdateTime) / 1000);
      lastUpdateTime = now;

      // Single animation owner: update the rig
      update(dt);

      // Random idle gesture rotation every 6-9 seconds in home section (if Director is not active)
      const nowSec = now / 1000;
      if ((typeof window === 'undefined' || !window.AvatarDirector) && !forcedPoseName && !activeGesture && (nowSec - this.holdStartTime >= this.holdDuration)) {
        this.pickNextPose();
      }
    }
  }

  // ==========================================================================
  // EXPORT TO NAMESPACE
  // ==========================================================================
  AvatarRig.init = init;
  AvatarRig.update = update;
  AvatarRig.setPose = setPose;
  AvatarRig.setLook = setLook;
  AvatarRig.setRootYaw = setRootYaw;
  AvatarRig.setStageMotion = setStageMotion;
  AvatarRig.setFlightW = setFlightW;
  AvatarRig.setHomeFloatAmp = setHomeFloatAmp;
  AvatarRig.setSlowMo = setSlowMo;
  AvatarRig.setTintCollisions = setTintCollisions;
  AvatarRig.setReducedMotion = setReducedMotion;
  AvatarRig.setQualityTier = setQualityTier;
  AvatarRig.triggerGesture = triggerGesture;
  AvatarRig.registerGesture = registerGesture;
  AvatarRig.setDirectorOverlay = setDirectorOverlay;
  AvatarRig.clearDirectorOverlay = clearDirectorOverlay;
  AvatarRig.resolvePoseCollisions = resolvePoseCollisions;
  AvatarRig.setForcedPose = setForcedPose;
  AvatarRig.pickNextPose = pickNextPose;
  AvatarRig.getCurrentPoseName = () => currentPoseName;
  AvatarRig.getPoseNames = () => Object.keys(RAW_POSES);
  AvatarRig.RAW_POSES = RAW_POSES;
  AvatarRig.getPlayerObject = () => playerRef;
  AvatarRig.getInnerMeshes = () => innerMeshes;
  AvatarRig.testPairCollision = testPairCollision;
  AvatarRig.validate = validate;
  AvatarRig.setCanvasVisible = (visible) => { isCanvasVisible = !!visible; };
  AvatarRig.getLastRigCost = () => lastRigCostMs;
  AvatarRig.getLastGuardCost = () => lastGuardCostMs;
  AvatarRig.RigAnimation = RigAnimation;
  AvatarRig.getJointValues = () => ({
    joints: Array.from(currentJointAngles),
    root: Array.from(rootAngles),
    isColliding: isCollidingNow
  });
  AvatarRig.getFormattedReadout = () => {
    const deg = (r) => ((r || 0) * 180 / Math.PI).toFixed(1) + '°';
    const lines = [
      `HEAD:  p:${deg(-currentJointAngles[0])} y:${deg(currentJointAngles[1])} r:${deg(currentJointAngles[2])}`,
      `BODY:  l:${deg(currentJointAngles[3])} t:${deg(currentJointAngles[4])} r:${deg(currentJointAngles[5])}`,
      `L_ARM: r:${deg(-currentJointAngles[6])} s:${deg(currentJointAngles[8])} t:${deg(currentJointAngles[7])}`,
      `R_ARM: r:${deg(-currentJointAngles[9])} s:${deg(-currentJointAngles[11])} t:${deg(currentJointAngles[10])}`,
      `L_LEG: s:${deg(currentJointAngles[12])} a:${deg(currentJointAngles[14])}`,
      `R_LEG: s:${deg(currentJointAngles[15])} a:${deg(-currentJointAngles[17])}`,
      `ROOT:  yaw:${deg(rootAngles[0])} p:${deg(rootAngles[1])} r:${deg(rootAngles[2])}`,
      `STATUS: ${isCollidingNow ? '[ COLLISION GUARD ACTIVE ]' : '[ CLEAR ]'}`
    ];
    return lines.join('\n');
  };

  // Authoring helper exposure
  AvatarRig.helpers = { arm, leg, head, body, outwardSign };

  // Attach to global window and module exports
  if (typeof window !== 'undefined') {
    window.AvatarRig = AvatarRig;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvatarRig;
  }

})();
