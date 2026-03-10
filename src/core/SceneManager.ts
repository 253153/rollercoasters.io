import * as THREE from 'three';

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly trackGroup: THREE.Group;
  readonly worldGroup: THREE.Group;
  readonly debugGroup: THREE.Group;

  constructor() {
    this.scene = new THREE.Scene();
    this.trackGroup = new THREE.Group();
    this.trackGroup.name = 'track';
    this.worldGroup = new THREE.Group();
    this.worldGroup.name = 'world';
    this.debugGroup = new THREE.Group();
    this.debugGroup.name = 'debug';

    this.scene.add(this.trackGroup);
    this.scene.add(this.worldGroup);
    this.scene.add(this.debugGroup);
  }

  clearTrack(): void {
    this.disposeGroup(this.trackGroup);
  }

  clearDebug(): void {
    this.disposeGroup(this.debugGroup);
  }

  private disposeGroup(group: THREE.Group): void {
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
      if (child instanceof THREE.Line) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          (child.material as THREE.Material)?.dispose();
        }
      }
    }
  }

  dispose(): void {
    this.clearTrack();
    this.clearDebug();
    this.disposeGroup(this.worldGroup);
  }
}
