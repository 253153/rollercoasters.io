import * as THREE from 'three';
import { SceneManager } from '../core/SceneManager';
import { Lighting } from './Lighting';
import { SkyBuilder } from './SkyBuilder';
import { TerrainBuilder } from './TerrainBuilder';
import { VegetationBuilder } from './VegetationBuilder';
import { TrackSample } from '../app/types';

export class EnvironmentBuilder {
  readonly lighting: Lighting;
  readonly vegetation: VegetationBuilder;

  constructor(sceneManager: SceneManager, mobile = false) {
    this.lighting = new Lighting(sceneManager.scene, !mobile);
    new SkyBuilder(sceneManager.scene);
    new TerrainBuilder(sceneManager.worldGroup, mobile);
    this.addMountains(sceneManager.worldGroup);
    this.vegetation = new VegetationBuilder(sceneManager.worldGroup);
  }

  rebuildVegetation(trackSamples: TrackSample[] | null, seed: number): void {
    this.vegetation.rebuild(trackSamples, seed);
  }

  private addMountains(parent: THREE.Group): void {
    const mountainDefs = [
      { x: -400, z: -500, r: 100, h: 140, seed: 1 },
      { x: 300, z: -600, r: 130, h: 190, seed: 2 },
      { x: -600, z: -300, r: 85, h: 110, seed: 3 },
      { x: 500, z: -450, r: 110, h: 170, seed: 4 },
      { x: -200, z: -700, r: 150, h: 220, seed: 5 },
      { x: 600, z: -200, r: 75, h: 95, seed: 6 },
      { x: -550, z: 400, r: 100, h: 130, seed: 7 },
      { x: 450, z: 500, r: 115, h: 155, seed: 8 },
      { x: 0, z: -800, r: 170, h: 250, seed: 9 },
      { x: -350, z: -750, r: 90, h: 120, seed: 10 },
      { x: 650, z: -650, r: 120, h: 160, seed: 11 },
    ];

    for (const def of mountainDefs) {
      const mesh = this.buildMountainMesh(def.r, def.h, def.seed);
      mesh.position.set(def.x, 0, def.z);
      parent.add(mesh);
    }
  }

  private buildMountainMesh(radius: number, height: number, seed: number): THREE.Mesh {
    const radialSegs = 24;
    const heightSegs = 12;
    const geo = new THREE.ConeGeometry(radius, height, radialSegs, heightSegs);

    const posAttr = geo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);

      // Normalized height 0 (base) to 1 (peak)
      const nh = (y + height / 2) / height;

      // Noise displacement: more at base, less at peak
      const noiseMag = radius * 0.2 * (1 - nh * 0.7);
      const n1 = Math.sin(x * 0.08 + seed * 7.3) * Math.cos(z * 0.09 + seed * 3.1);
      const n2 = Math.sin((x + z) * 0.12 + seed * 11.7) * 0.5;
      const n3 = Math.cos(y * 0.06 + x * 0.05 + seed * 5.9) * 0.3;
      const displacement = (n1 + n2 + n3) * noiseMag;

      // Displace radially outward
      const dist = Math.sqrt(x * x + z * z);
      if (dist > 0.01) {
        const nx = x / dist;
        const nz = z / dist;
        posAttr.setX(i, x + nx * displacement);
        posAttr.setZ(i, z + nz * displacement);
      }

      // Slight vertical displacement for ruggedness
      posAttr.setY(i, y + (n1 * 0.5 + n3) * height * 0.03);

      // Vertex colors: rock gray at base, lighter/bluer with altitude, snow tint at peak
      const rockR = 0.38 + n2 * 0.08;
      const rockG = 0.36 + n2 * 0.06;
      const rockB = 0.40 + n2 * 0.08;

      const snowR = 0.85;
      const snowG = 0.88;
      const snowB = 0.92;

      const snowLine = 0.75;
      const snowBlend = Math.min(1, Math.max(0, (nh - snowLine) / (1 - snowLine)));

      // Below snow line: green tint at base fading to rock gray
      const greenBlend = Math.max(0, 1 - nh * 2.5);
      let r = rockR + greenBlend * (-0.15 + n1 * 0.03);
      let g = rockG + greenBlend * (0.08 + n1 * 0.04);
      let b = rockB + greenBlend * (-0.15);

      // Snow cap
      r = r * (1 - snowBlend) + snowR * snowBlend;
      g = g * (1 - snowBlend) + snowG * snowBlend;
      b = b * (1 - snowBlend) + snowB * snowBlend;

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: false,
    });

    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}
