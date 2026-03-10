import * as THREE from 'three';
import { TrackSample } from '../app/types';
import { TrackSpline } from '../coaster/TrackSpline';

export class DebugDraw {
  private splineLine: THREE.Line | null = null;
  private frameHelpers: THREE.Group | null = null;

  drawSpline(spline: TrackSpline, parent: THREE.Group): void {
    this.clearSpline(parent);

    const points = spline.samples.map((s) => s.position);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
    this.splineLine = new THREE.Line(geometry, material);
    parent.add(this.splineLine);
  }

  drawFrames(spline: TrackSpline, parent: THREE.Group, interval = 20): void {
    this.clearFrames(parent);
    this.frameHelpers = new THREE.Group();

    const axisLen = 3;
    for (let i = 0; i < spline.samples.length; i += interval) {
      const s = spline.samples[i];
      this.addAxis(s, axisLen);
    }

    parent.add(this.frameHelpers);
  }

  clearSpline(parent: THREE.Group): void {
    if (this.splineLine) {
      parent.remove(this.splineLine);
      this.splineLine.geometry.dispose();
      (this.splineLine.material as THREE.Material).dispose();
      this.splineLine = null;
    }
  }

  clearFrames(parent: THREE.Group): void {
    if (this.frameHelpers) {
      parent.remove(this.frameHelpers);
      this.frameHelpers.traverse((child) => {
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      this.frameHelpers = null;
    }
  }

  private addAxis(sample: TrackSample, length: number): void {
    if (!this.frameHelpers) return;
    const p = sample.position;

    // Tangent = blue
    this.addLine(p, p.clone().addScaledVector(sample.tangent, length), 0x0000ff);
    // Normal = green
    this.addLine(p, p.clone().addScaledVector(sample.normal, length), 0x00ff00);
    // Binormal = red
    this.addLine(p, p.clone().addScaledVector(sample.binormal, length), 0xff0000);
  }

  private addLine(from: THREE.Vector3, to: THREE.Vector3, color: number): void {
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    const mat = new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geo, mat);
    this.frameHelpers!.add(line);
  }
}
