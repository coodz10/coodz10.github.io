# Portfolio — `coodz_10`

Interactive single-page portfolio with a 3D Minecraft avatar (`skinview3d` + Three.js), scroll-driven flight, Web Audio visualizer, and IT/EN localization.

## Structure
- `index.html` — Single-page application markup (`#home`, `#chi_sono`, `#esperienze`, `#contatti`, proofs modal, intro gate)
- `style.css` — Design tokens, layout grid, cyberpunk `[ ... ]` UI, responsive rules
- `main.js` — Intro sequence, handwriting pen IK, scroll flight, hash routing, Web Audio pipeline, i18n
- `avatar-rig.js` — Articulated skeleton, joint limits, spring-damper physics, procedural motion, `AvatarRig.validate()`
- `avatar-director.js` — Behavioral animation director, gaze look-at, gestures, audio-reactive motion
- `avatar-debug.js` — On-screen debug/layout audit panel (`?debug`, `?layout`, `?autotest`)
- `assets/` & `music/` — Skin texture, fonts, icons, audio playlist
- `servers/` — Legacy deep-link redirect pages into `index.html#esperienze/...`

## URL Switches
- `?intro=skip` — Skip the opening gate and handwriting intro
- `?slow=N` — Slow intro timeline by factor `N` (e.g. `?slow=2`)
- `?debug` — Open the AvatarRig debug HUD & log verified rig facts
- `?layout` — Open layout/viewport audit metrics
- `?autotest` — Run automated rig & director self-checks
- `?perf` — Show live FPS / frame timing overlay
- `?quality=low|med|high` — Override rendering quality tier

## Avatar Architecture
1. **Rig (`avatar-rig.js`)**: Single animation owner over `skinview3d` joints using `XYZ` Euler order, anatomical poses, spring-damper interpolation, and self-collision clamping.
2. **Director (`avatar-director.js`)**: Priority-layered pose/gesture scheduler, pointer look-at solver, and audio-spectrum reactivity feeding targets into `AvatarRig`.
3. **Intro (`main.js`)**: Gate-triggered fly-in, 2D canvas handwriting reveal synced with 3D `left` arm IK tip tracking, then handoff to scroll-driven flight keyframes.
