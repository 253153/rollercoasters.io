import { Renderer } from './Renderer';
import { CameraManager } from './CameraManager';

export class ResizeHandler {
  private container: HTMLElement;
  private renderer: Renderer;
  private cameraManager: CameraManager;

  constructor(container: HTMLElement, renderer: Renderer, cameraManager: CameraManager) {
    this.container = container;
    this.renderer = renderer;
    this.cameraManager = cameraManager;
    window.addEventListener('resize', this.onResize);
    this.onResize();
  }

  private onResize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.resize(w, h);
    this.cameraManager.resize(w / h);
  };

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
  }
}
