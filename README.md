# Endless Coaster VR

A browser-based 3D procedural roller coaster game built with Three.js, TypeScript, and Vite. Generate unique coasters from segment-based templates, ride them in first-person, and regenerate endlessly.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## How to Play

1. Choose a **ride length** (short / medium / long / extreme)
2. Choose an **intensity** (chill / thrill / insane)
3. Optionally set a **seed** for deterministic generation
4. Click **Generate** to create a coaster
5. Click **Ride!** to experience it in first-person
6. View your **stats** after the ride completes
7. Click **Ride Again** or **New Coaster**

Press **`** or **D** to toggle the debug panel.

## Architecture

```
src/
  main.ts                  Entry point
  app/
    App.ts                 Central orchestrator, state machine
    config.ts              Global configuration constants
    types.ts               TypeScript type definitions
    state.ts               Application state management
  core/
    Renderer.ts            WebGLRenderer wrapper (WebXR-ready)
    SceneManager.ts        Scene graph with track/world/debug groups
    CameraManager.ts       Orbit + ride camera modes via a rig group
    GameLoop.ts            RAF loop (swappable for WebXR setAnimationLoop)
    ResizeHandler.ts       Responsive canvas resizing
  coaster/
    TrackGenerator.ts      Segment-chaining procedural generator
    SegmentLibrary.ts      Registry with category/intensity filtering
    SegmentTemplates.ts    17 authored segment definitions
    TrackSpline.ts         CatmullRomCurve3 + parallel transport frames
    TrackMeshBuilder.ts    BufferGeometry rails, spine, and ties
    SupportBuilder.ts      Vertical cylinder supports to ground
    RideSimulator.ts       Distance-based traversal + camera control
    SpeedModel.ts          Slope-based simplified coaster physics
    CoasterStats.ts        Post-ride statistics computation
    SeededRandom.ts        Mulberry32 deterministic PRNG
  world/
    EnvironmentBuilder.ts  Orchestrates world construction
    Lighting.ts            Sun + hemisphere ambient
    TerrainBuilder.ts      Undulating ground plane
    SkyBuilder.ts          Sky color + fog
  ui/
    UIManager.ts           Panel visibility orchestrator
    MainMenu.ts            Length/intensity/seed controls
    RideHUD.ts             Speed + progress during ride
    ResultsPanel.ts        Post-ride stats display
  debug/
    DebugPanel.ts          Toggle-able overlay with live stats
    DebugDraw.ts           Spline + frame axis visualization
  utils/
    math.ts                Clamp, lerp, smoothstep helpers
    curves.ts              Parallel transport frame algorithm
    constants.ts           Color palette
```

### Key Design Decisions

- **Segment-based generation**: Coasters are built by chaining authored segment templates (not random points). Each segment defines local-space control points and metadata. A running transformation matrix chains them into world space.

- **Parallel transport frames**: Camera orientation uses a Bishop frame algorithm instead of naive lookAt, preventing twist discontinuities on loops and inversions.

- **BufferGeometry track**: The entire track mesh is a single BufferGeometry with procedurally computed vertices, keeping draw calls minimal.

- **WebXR-ready architecture**: The game loop uses a callback pattern compatible with `renderer.setAnimationLoop()`. The camera lives inside a rig `THREE.Group` so a WebXR camera can replace it.

## Segment Library

17 segment types across 8 categories:

| Category   | Segments |
|------------|----------|
| start      | stationStart |
| lift       | liftHill |
| drop       | firstDrop |
| transition | straight |
| turn       | gentleLeftBank, gentleRightBank, sTurn, helixLeft, helixRight |
| hill       | camelback, bunnyHops |
| inversion  | verticalLoop, corkscrewLeft, corkscrewRight, inlineTwist, zeroGRoll |
| brake      | brakeRun |

## WebXR Integration — Next Steps

The codebase is structured for clean WebXR addition:

1. **Enable XR on the renderer**: `renderer.xr.enabled = true`
2. **Replace the game loop**: Use `renderer.setAnimationLoop(callback)` instead of the RAF loop
3. **Add VR button**: Use Three.js `VRButton.createButton(renderer)` 
4. **Camera rig**: The `CameraManager.rig` group is already set up — the WebXR camera will be parented here automatically
5. **Input**: Add XR controller support for menu interaction
6. **Comfort**: Add vignette/tunnel vision during high-G moments to reduce motion sickness

## Build for Production

```bash
npm run build
npm run preview
```
