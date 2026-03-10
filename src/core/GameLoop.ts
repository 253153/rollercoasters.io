import type { WebGLRenderer } from 'three';

export type UpdateCallback = (dt: number, elapsed: number) => void;

/**
 * Animation loop that uses renderer.setAnimationLoop so it works
 * for both regular rendering and WebXR sessions.
 */
export class GameLoop {
  private callbacks: UpdateCallback[] = [];
  private running = false;
  private lastTime = 0;
  private elapsed = 0;
  private glRenderer: WebGLRenderer;

  constructor(renderer: WebGLRenderer) {
    this.glRenderer = renderer;
  }

  register(cb: UpdateCallback): void {
    this.callbacks.push(cb);
  }

  unregister(cb: UpdateCallback): void {
    const idx = this.callbacks.indexOf(cb);
    if (idx >= 0) this.callbacks.splice(idx, 1);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.elapsed = 0;
    this.glRenderer.setAnimationLoop(this.tick);
  }

  stop(): void {
    this.running = false;
    this.glRenderer.setAnimationLoop(null);
  }

  private tick = (time: DOMHighResTimeStamp): void => {
    if (!this.running) return;

    const rawDt = (time - this.lastTime) / 1000;
    const dt = Math.min(rawDt, 0.1);
    this.lastTime = time;
    this.elapsed += dt;

    for (const cb of this.callbacks) {
      cb(dt, this.elapsed);
    }
  };
}
