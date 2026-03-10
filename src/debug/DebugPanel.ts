import { GeneratedCoaster } from '../app/types';
import { RideSimulator } from '../coaster/RideSimulator';
import { DebugDraw } from './DebugDraw';
import { TrackSpline } from '../coaster/TrackSpline';
import * as THREE from 'three';

export class DebugPanel {
  private root: HTMLElement;
  private infoDiv: HTMLElement;
  private buttonsDiv: HTMLElement;
  private segmentsDiv: HTMLElement;
  private visible = false;

  readonly debugDraw: DebugDraw;
  private splineVisible = false;
  private framesVisible = false;

  onRegenerateRandom: (() => void) | null = null;

  constructor() {
    this.root = document.getElementById('debug-panel')!;
    this.infoDiv = document.getElementById('debug-info')!;
    this.buttonsDiv = document.getElementById('debug-buttons')!;
    this.segmentsDiv = document.getElementById('debug-segments')!;
    this.debugDraw = new DebugDraw();

    this.buttonsDiv.innerHTML = `
      <button class="debug-btn" id="dbg-regen">Random Seed</button>
      <button class="debug-btn" id="dbg-spline">Spline</button>
      <button class="debug-btn" id="dbg-frames">Frames</button>
    `;

    window.addEventListener('keydown', (e) => {
      if (e.key === '`' || e.key === 'd') {
        if (document.activeElement?.tagName === 'INPUT') return;
        this.toggle();
      }
    });
  }

  setupCallbacks(
    debugGroup: THREE.Group,
    getSpline: () => TrackSpline | null
  ): void {
    document.getElementById('dbg-regen')?.addEventListener('click', () => {
      this.onRegenerateRandom?.();
    });

    document.getElementById('dbg-spline')?.addEventListener('click', () => {
      const spline = getSpline();
      if (!spline) return;
      this.splineVisible = !this.splineVisible;
      if (this.splineVisible) {
        this.debugDraw.drawSpline(spline, debugGroup);
      } else {
        this.debugDraw.clearSpline(debugGroup);
      }
    });

    document.getElementById('dbg-frames')?.addEventListener('click', () => {
      const spline = getSpline();
      if (!spline) return;
      this.framesVisible = !this.framesVisible;
      if (this.framesVisible) {
        this.debugDraw.drawFrames(spline, debugGroup);
      } else {
        this.debugDraw.clearFrames(debugGroup);
      }
    });
  }

  toggle(): void {
    this.visible = !this.visible;
    this.root.classList.toggle('visible', this.visible);
  }

  updateInfo(seed: number, speed: number, fps: number): void {
    this.infoDiv.innerHTML = `
      <div class="debug-row"><span class="key">Seed</span><span class="val">${seed}</span></div>
      <div class="debug-row"><span class="key">Speed</span><span class="val">${speed.toFixed(1)} km/h</span></div>
      <div class="debug-row"><span class="key">FPS</span><span class="val">${fps.toFixed(0)}</span></div>
    `;
  }

  showSegments(coaster: GeneratedCoaster): void {
    this.segmentsDiv.innerHTML = coaster.segments
      .map((s, i) => `${i}: ${s.definition.id}`)
      .join('<br>');
  }

  clearDebugVisuals(debugGroup: THREE.Group): void {
    this.debugDraw.clearSpline(debugGroup);
    this.debugDraw.clearFrames(debugGroup);
    this.splineVisible = false;
    this.framesVisible = false;
  }
}
