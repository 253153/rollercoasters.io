import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CONFIG } from '../app/config';
import { TrackSample } from '../app/types';

export class CameraManager {
  readonly camera: THREE.PerspectiveCamera;
  readonly rig: THREE.Group;
  readonly orbitControls: OrbitControls;

  private scene: THREE.Scene | null = null;
  private domElement: HTMLCanvasElement;

  /** Mouse-look state for ride mode */
  private lookYaw = 0;
  private lookPitch = 0;
  private isPointerDown = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private rideLookActive = false;
  private _vrActive = false;

  private readonly _euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private readonly _quat = new THREE.Quaternion();

  constructor(aspect: number, domElement: HTMLCanvasElement) {
    this.domElement = domElement;

    this.camera = new THREE.PerspectiveCamera(
      CONFIG.camera.fov,
      aspect,
      CONFIG.camera.near,
      CONFIG.camera.far
    );

    this.rig = new THREE.Group();
    this.rig.name = 'cameraRig';

    this.camera.position.set(80, 60, 80);

    this.orbitControls = new OrbitControls(this.camera, domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.08;
    this.orbitControls.minDistance = 10;
    this.orbitControls.maxDistance = 500;
    this.orbitControls.maxPolarAngle = Math.PI * 0.48;
    this.orbitControls.minPolarAngle = Math.PI * 0.05;
    this.orbitControls.target.set(0, 10, 0);
    this.orbitControls.autoRotate = true;
    this.orbitControls.autoRotateSpeed = 0.8;
    this.orbitControls.enabled = true;
    this.orbitControls.update();

    this.setupRideLookListeners();
  }

  init(scene: THREE.Scene): void {
    this.scene = scene;
    scene.add(this.camera);
    scene.add(this.rig);
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  enableOrbitControls(): void {
    this.orbitControls.enabled = true;
    this.rideLookActive = false;

    if (this.camera.parent === this.rig) {
      const worldPos = new THREE.Vector3();
      this.camera.getWorldPosition(worldPos);
      this.rig.remove(this.camera);
      this.scene?.add(this.camera);
      this.camera.position.copy(worldPos);
      this.camera.quaternion.identity();
      this.orbitControls.update();
    }
  }

  disableOrbitControls(): void {
    this.orbitControls.enabled = false;
    this.rideLookActive = true;
    this.lookYaw = 0;
    this.lookPitch = 0;

    if (this.camera.parent !== this.rig) {
      this.camera.removeFromParent();
      this.rig.add(this.camera);
      this.camera.position.set(0, CONFIG.camera.rideOffset[1], 0);
      this.camera.quaternion.identity();
    }
  }

  updateOrbit(): void {
    if (this.orbitControls.enabled) {
      this.orbitControls.update();
    }
  }

  setOrbitTarget(target: THREE.Vector3): void {
    this.orbitControls.target.copy(target);
    const offset = new THREE.Vector3(80, 60, 80);
    this.camera.position.copy(target).add(offset);
    this.orbitControls.update();
  }

  get vrActive(): boolean { return this._vrActive; }
  set vrActive(v: boolean) { this._vrActive = v; }

  applyRideFrame(sample: TrackSample): void {
    this.rig.position.copy(sample.position);

    const tangent = sample.tangent;
    const normal = sample.normal;
    const binormal = sample.binormal;

    const m = new THREE.Matrix4();
    m.set(
      binormal.x, normal.x, -tangent.x, 0,
      binormal.y, normal.y, -tangent.y, 0,
      binormal.z, normal.z, -tangent.z, 0,
      0, 0, 0, 1
    );

    this.rig.quaternion.setFromRotationMatrix(m);

    if (this._vrActive) {
      // In VR the XR system controls camera position/orientation within the rig
      return;
    }

    this.camera.position.set(0, CONFIG.camera.rideOffset[1], 0);

    this._euler.set(this.lookPitch, this.lookYaw, 0, 'YXZ');
    this._quat.setFromEuler(this._euler);
    this.camera.quaternion.copy(this._quat);
  }

  /** Smoothly return look to center when mouse isn't held */
  updateRideLook(dt: number): void {
    if (!this.rideLookActive || this.isPointerDown) return;
    const returnSpeed = CONFIG.camera.lookReturnSpeed * dt;
    this.lookYaw *= Math.max(0, 1 - returnSpeed);
    this.lookPitch *= Math.max(0, 1 - returnSpeed);
    if (Math.abs(this.lookYaw) < 0.001) this.lookYaw = 0;
    if (Math.abs(this.lookPitch) < 0.001) this.lookPitch = 0;
  }

  private setupRideLookListeners(): void {
    const el = this.domElement;

    el.addEventListener('pointerdown', (e: PointerEvent) => {
      if (!this.rideLookActive) return;
      this.isPointerDown = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.rideLookActive || !this.isPointerDown) return;
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;

      const sens = CONFIG.camera.lookSensitivity;
      this.lookYaw -= dx * sens;
      this.lookPitch -= dy * sens;

      this.lookYaw = Math.max(
        -CONFIG.camera.lookMaxYaw,
        Math.min(CONFIG.camera.lookMaxYaw, this.lookYaw)
      );
      this.lookPitch = Math.max(
        -CONFIG.camera.lookMaxPitch,
        Math.min(CONFIG.camera.lookMaxPitch, this.lookPitch)
      );
    });

    el.addEventListener('pointerup', (e: PointerEvent) => {
      this.isPointerDown = false;
      el.releasePointerCapture(e.pointerId);
    });

    el.addEventListener('pointercancel', (e: PointerEvent) => {
      this.isPointerDown = false;
      el.releasePointerCapture(e.pointerId);
    });
  }
}
