import * as THREE from 'three';
import { GameState } from './state';
import { Renderer } from '../core/Renderer';
import { SceneManager } from '../core/SceneManager';
import { CameraManager } from '../core/CameraManager';
import { GameLoop } from '../core/GameLoop';
import { ResizeHandler } from '../core/ResizeHandler';
import { EnvironmentBuilder } from '../world/EnvironmentBuilder';
import { SegmentLibrary } from '../coaster/SegmentLibrary';
import { TrackGenerator } from '../coaster/TrackGenerator';
import { TrackSpline } from '../coaster/TrackSpline';
import { TrackMeshBuilder } from '../coaster/TrackMeshBuilder';
import { SupportBuilder } from '../coaster/SupportBuilder';
import { RideSimulator } from '../coaster/RideSimulator';
import { CoasterStats } from '../coaster/CoasterStats';
import { UIManager } from '../ui/UIManager';
import { DebugPanel } from '../debug/DebugPanel';
import { SaveManager } from './SaveManager';

export class App {
  private renderer: Renderer;
  private sceneManager: SceneManager;
  private cameraManager: CameraManager;
  private gameLoop: GameLoop;
  private resizeHandler: ResizeHandler;

  private state: GameState;
  private ui: UIManager;
  private debugPanel: DebugPanel;

  private segmentLibrary: SegmentLibrary;
  private trackGenerator: TrackGenerator;
  private trackMeshBuilder: TrackMeshBuilder;
  private supportBuilder: SupportBuilder;
  private rideSimulator: RideSimulator;

  private environment: EnvironmentBuilder;
  private currentSpline: TrackSpline | null = null;
  private fpsFrames = 0;
  private fpsTime = 0;
  private currentFps = 60;
  private fpsEl: HTMLElement;

  constructor(container: HTMLElement) {
    this.state = new GameState();

    // Core
    this.renderer = new Renderer(container);
    this.sceneManager = new SceneManager();
    this.cameraManager = new CameraManager(
      container.clientWidth / container.clientHeight,
      this.renderer.domElement
    );
    this.cameraManager.init(this.sceneManager.scene);
    this.gameLoop = new GameLoop(this.renderer.renderer);
    this.resizeHandler = new ResizeHandler(container, this.renderer, this.cameraManager);

    // World
    this.environment = new EnvironmentBuilder(this.sceneManager, this.renderer.mobile);

    // Coaster systems
    this.segmentLibrary = new SegmentLibrary();
    this.trackGenerator = new TrackGenerator(this.segmentLibrary);
    this.trackMeshBuilder = new TrackMeshBuilder();
    this.supportBuilder = new SupportBuilder();
    this.rideSimulator = new RideSimulator(this.cameraManager);

    // UI
    this.ui = new UIManager(this.state);
    this.debugPanel = new DebugPanel();
    this.fpsEl = document.getElementById('fps-counter')!;

    this.wireEvents();
    this.gameLoop.register(this.update);
    this.gameLoop.start();

    // Enable WebXR if available
    this.setupVR();

    // Check URL for shared coaster
    const shared = SaveManager.parseFromURL();
    if (shared) {
      this.state.settings.seed = shared.seed;
      this.state.settings.length = shared.length;
      this.state.settings.intensity = shared.intensity;
      SaveManager.clearURL();
      this.ui.showMenu();
      this.ui.mainMenu.updateSeedDisplay(shared.seed);
      this.generateCoaster();
    } else {
      this.ui.showMenu();
    }

    // Place initial vegetation before any coaster exists
    this.environment.rebuildVegetation(null, this.state.settings.seed);
  }

  private async setupVR(): Promise<void> {
    if (!('xr' in navigator)) return;
    try {
      const supported = await navigator.xr!.isSessionSupported('immersive-vr');
      if (supported) {
        this.ui.mainMenu.showVRButton();
      }
    } catch {
      // WebXR not available
    }
  }

  private async enterVR(): Promise<void> {
    try {
      const session = await navigator.xr!.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor'],
      });

      this.renderer.renderer.xr.enabled = true;
      this.renderer.renderer.xr.setReferenceSpaceType('local-floor');
      await this.renderer.renderer.xr.setSession(session);

      this.cameraManager.vrActive = true;
      this.ui.hideAll();

      // If no coaster exists yet, generate one
      if (!this.currentSpline || !this.state.coasterGenerated) {
        this.generateCoaster();
      }

      // Start the ride — camera goes into the rig via disableOrbitControls,
      // then we zero out the local offset so the XR reference space handles head height
      this.startRide();
      this.cameraManager.camera.position.set(0, 0, 0);

      session.addEventListener('end', () => {
        this.renderer.renderer.xr.enabled = false;
        this.cameraManager.vrActive = false;
        this.rideSimulator.reset();
        this.cameraManager.enableOrbitControls();
        this.state.setAppState('menu');
        this.ui.showMenu();
      });
    } catch (err) {
      console.warn('Failed to enter VR:', err);
    }
  }

  private wireEvents(): void {
    this.ui.mainMenu.onGenerate = () => this.generateCoaster();
    this.ui.mainMenu.onRide = () => this.startRide();
    this.ui.mainMenu.onEnterVR = () => this.enterVR();

    this.ui.resultsPanel.onRideAgain = () => this.startRide();
    this.ui.resultsPanel.onNewCoaster = () => {
      this.state.settings.seed = Math.floor(Math.random() * 999999);
      this.state.setAppState('menu');
      this.cameraManager.enableOrbitControls();
      this.ui.showMenu();
      this.ui.mainMenu.hideRideButton();
    };

    this.rideSimulator.onEvent((event) => {
      if (event === 'finish') {
        this.onRideFinished();
      }
    });

    this.debugPanel.setupCallbacks(
      this.sceneManager.debugGroup,
      () => this.currentSpline
    );

    this.debugPanel.onRegenerateRandom = () => {
      this.state.settings.seed = Math.floor(Math.random() * 999999);
      this.ui.mainMenu.updateSeedDisplay(this.state.settings.seed);
      this.generateCoaster();
    };

    // Share from ride HUD
    this.ui.rideHUD.onShare = async () => {
      const ok = await SaveManager.copyShareURL(this.state.settings);
      this.ui.resultsPanel.showToast(
        ok ? 'Link copied to clipboard!' : 'Could not copy link'
      );
    };

    // Share from results
    this.ui.resultsPanel.onShare = async () => {
      const ok = await SaveManager.copyShareURL(this.state.settings);
      this.ui.resultsPanel.showToast(
        ok ? 'Link copied to clipboard!' : 'Could not copy link'
      );
    };

    // Menu toggle button during ride/results
    this.ui.onMenuToggle = (open) => {
      if (open) {
        this.cameraManager.enableOrbitControls();
      } else {
        if (this.state.appState === 'riding') {
          this.cameraManager.disableOrbitControls();
        }
      }
    };
  }

  private generateCoaster(): void {
    this.ui.mainMenu.showGenerating();
    this.sceneManager.clearTrack();
    this.sceneManager.clearDebug();
    this.debugPanel.clearDebugVisuals(this.sceneManager.debugGroup);
    this.rideSimulator.reset();

    requestAnimationFrame(() => {
      const coaster = this.trackGenerator.generate(this.state.settings);
      this.state.currentCoaster = coaster;
      this.state.coasterGenerated = true;

      this.currentSpline = new TrackSpline(coaster.allPoints);

      let liftEndDist = 0;
      if (coaster.segments.length >= 2) {
        const stationPts = coaster.segments[0].worldPoints;
        const liftPts = coaster.segments[1].worldPoints;
        for (let i = 1; i < stationPts.length; i++) {
          liftEndDist += stationPts[i].distanceTo(stationPts[i - 1]);
        }
        for (let i = 1; i < liftPts.length; i++) {
          liftEndDist += liftPts[i].distanceTo(liftPts[i - 1]);
        }
      }

      this.rideSimulator.setTrack(this.currentSpline, liftEndDist);

      this.trackMeshBuilder.build(
        this.currentSpline.samples,
        this.sceneManager.trackGroup
      );
      this.supportBuilder.build(
        this.currentSpline.samples,
        this.sceneManager.trackGroup
      );

      this.environment.rebuildVegetation(
        this.currentSpline.samples,
        this.state.settings.seed
      );

      const center = this.currentSpline.getCenter();
      this.cameraManager.setOrbitTarget(center);

      this.state.setAppState('preview');
      this.ui.mainMenu.showRideButton();
      this.debugPanel.showSegments(coaster);
    });
  }

  private startRide(): void {
    if (!this.currentSpline) return;
    this.cameraManager.disableOrbitControls();
    this.state.setAppState('riding');
    this.ui.showRiding();
    this.rideSimulator.start();
  }

  private onRideFinished(): void {
    if (!this.state.currentCoaster || !this.currentSpline) return;

    // In VR, auto-restart the ride instead of showing 2D results
    if (this.cameraManager.vrActive) {
      this.rideSimulator.reset();
      this.rideSimulator.start();
      return;
    }

    const stats = CoasterStats.compute(
      this.state.currentCoaster,
      this.currentSpline,
      this.rideSimulator
    );
    this.state.rideStats = stats;
    this.state.setAppState('results');
    this.cameraManager.enableOrbitControls();
    this.ui.showResults(stats);
  }

  private update = (dt: number, _elapsed: number): void => {
    this.fpsFrames++;
    this.fpsTime += dt;
    if (this.fpsTime >= 0.5) {
      this.currentFps = this.fpsFrames / this.fpsTime;
      this.fpsFrames = 0;
      this.fpsTime = 0;
      this.fpsEl.textContent = `${Math.round(this.currentFps)} FPS`;
    }

    const appState = this.state.appState;

    if (appState === 'menu' || appState === 'preview' || appState === 'results') {
      this.cameraManager.updateOrbit();
    }

    if (appState === 'riding') {
      if (!this.ui.isMenuOverlayOpen) {
        this.cameraManager.updateRideLook(dt);
        const sample = this.rideSimulator.update(dt);
        if (sample) {
          this.ui.rideHUD.update(
            this.rideSimulator.speedModel.getSpeedKmh(),
            this.rideSimulator.progress
          );
        }
      } else {
        this.cameraManager.updateOrbit();
      }
    }

    this.debugPanel.updateInfo(
      this.state.settings.seed,
      this.rideSimulator.speedModel.getSpeedKmh(),
      this.currentFps
    );

    this.renderer.render(this.sceneManager.scene, this.cameraManager.camera);
  };
}
