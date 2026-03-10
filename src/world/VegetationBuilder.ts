import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TerrainBuilder } from './TerrainBuilder';
import { SeededRandom } from '../coaster/SeededRandom';
import { TrackSample } from '../app/types';

export class VegetationBuilder {
  private vegetationGroup: THREE.Group;

  /** Cached pine model from GLB, null until loaded */
  private pineModel: THREE.Group | null = null;
  private pineModelHeight = 2;
  private pineModelMinY = -1;
  private pineLoading = false;
  private pendingRebuild: { trackSamples: TrackSample[] | null; seed: number } | null = null;

  constructor(parent: THREE.Group) {
    this.vegetationGroup = new THREE.Group();
    this.vegetationGroup.name = 'vegetation';
    parent.add(this.vegetationGroup);
    this.loadPineModel();
  }

  private loadPineModel(): void {
    if (this.pineLoading) return;
    this.pineLoading = true;

    const loader = new GLTFLoader();
    loader.load(
      '/low-poly-pine-tree.glb',
      (gltf) => {
        this.pineModel = gltf.scene;

        const box = new THREE.Box3().setFromObject(this.pineModel);
        this.pineModelMinY = box.min.y;
        this.pineModelHeight = box.max.y - box.min.y;

        this.pineModel.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });
        this.pineLoading = false;

        if (this.pendingRebuild) {
          const { trackSamples, seed } = this.pendingRebuild;
          this.pendingRebuild = null;
          this.rebuild(trackSamples, seed);
        }
      },
      undefined,
      (err) => {
        console.warn('Failed to load low-poly-pine-tree.glb:', err);
        this.pineLoading = false;
      }
    );
  }

  rebuild(trackSamples: TrackSample[] | null, seed: number): void {
    if (!this.pineModel) {
      this.pendingRebuild = { trackSamples, seed };
      return;
    }

    this.clear();

    const rng = new SeededRandom(seed + 7777);

    const trackPositions: Array<{ x: number; z: number }> = [];
    if (trackSamples) {
      for (let i = 0; i < trackSamples.length; i += 3) {
        trackPositions.push({
          x: trackSamples[i].position.x,
          z: trackSamples[i].position.z,
        });
      }
    }

    const treeExclusionRadius = 14;

    const isNearTrack = (x: number, z: number): boolean => {
      for (const tp of trackPositions) {
        const dx = x - tp.x;
        const dz = z - tp.z;
        if (dx * dx + dz * dz < treeExclusionRadius * treeExclusionRadius)
          return true;
      }
      return false;
    };

    const treeCount = 900;
    let placed = 0;
    let attempts = 0;
    while (placed < treeCount && attempts < treeCount * 5) {
      attempts++;
      const dist =
        rng.next() < 0.4 ? rng.float(18, 250) : rng.float(250, 750);
      const angle = rng.float(0, Math.PI * 2);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (isNearTrack(x, z)) continue;
      const groundY = TerrainBuilder.sampleHeight(x, z);
      this.addPineTree(x, groundY, z, rng);
      placed++;
    }
  }

  private addPineTree(
    x: number,
    groundY: number,
    z: number,
    rng: SeededRandom
  ): void {
    const tree = this.pineModel!.clone();

    const targetHeight = rng.float(10, 28);
    const scale = targetHeight / Math.max(this.pineModelHeight, 0.01);
    tree.scale.set(scale, scale, scale);

    tree.position.set(x, groundY - 0.3, z);
    tree.rotation.y = rng.float(0, Math.PI * 2);
    tree.rotation.x = rng.float(-0.03, 0.03);
    tree.rotation.z = rng.float(-0.03, 0.03);

    this.vegetationGroup.add(tree);
  }

  clear(): void {
    while (this.vegetationGroup.children.length > 0) {
      const child = this.vegetationGroup.children[0];
      this.vegetationGroup.remove(child);
      child.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
        }
      });
    }
  }
}
