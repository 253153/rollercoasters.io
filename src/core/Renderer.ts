import * as THREE from 'three';
import { CONFIG } from '../app/config';

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
}

export class Renderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly mobile: boolean;

  constructor(container: HTMLElement) {
    this.mobile = isMobile();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.mobile,
      powerPreference: 'high-performance',
    });

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, this.mobile ? 1.5 : CONFIG.renderer.pixelRatioMax)
    );
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    if (this.mobile) {
      this.renderer.shadowMap.enabled = false;
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    container.insertBefore(this.renderer.domElement, container.firstChild);
  }

  resize(width: number, height: number): void {
    this.renderer.setSize(width, height);
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderer.render(scene, camera);
  }

  get domElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  get xr(): THREE.WebXRManager {
    return this.renderer.xr;
  }

  dispose(): void {
    this.renderer.dispose();
  }
}
