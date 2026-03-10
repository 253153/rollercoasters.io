import * as THREE from 'three';
import { CONFIG } from '../app/config';

function hash2(ix: number, iy: number): number {
  let h = ix * 374761393 + iy * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

function smoothNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);

  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);

  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function fbmNoise(x: number, z: number, octaves: number, lacunarity: number, gain: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxAmplitude = 0;

  for (let i = 0; i < octaves; i++) {
    value += smoothNoise(x * frequency, z * frequency) * amplitude;
    maxAmplitude += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return value / maxAmplitude;
}

export class TerrainBuilder {
  readonly mesh: THREE.Mesh;

  static readonly GROUND_Y = -2;

  constructor(parent: THREE.Group, mobile = false) {
    const size = CONFIG.world.groundSize;
    const segments = mobile ? 64 : 256;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const posAttr = geometry.attributes.position;

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      const dist = Math.sqrt(x * x + z * z);
      const centralFalloff = Math.min(1, Math.max(0, (dist - 80) / 250));

      const largeScale = fbmNoise(x * 0.002, z * 0.002, 5, 2.0, 0.5) * 8.0;
      const medScale = fbmNoise(x * 0.008 + 100, z * 0.008 + 100, 4, 2.0, 0.5) * 2.5;
      const detailScale = fbmNoise(x * 0.03 + 200, z * 0.03 + 200, 3, 2.0, 0.45) * 0.6;

      const undulation = (largeScale + medScale + detailScale) * centralFalloff;
      const y = TerrainBuilder.GROUND_Y + undulation;
      posAttr.setY(i, y);
    }

    geometry.computeVertexNormals();

    let material: THREE.Material;

    if (mobile) {
      material = new THREE.MeshLambertMaterial({ color: 0x4a8a3a });
    } else {
      const loader = new THREE.TextureLoader();
      const florTexture = loader.load('/textures/flor.png');
      florTexture.wrapS = THREE.RepeatWrapping;
      florTexture.wrapT = THREE.RepeatWrapping;
      florTexture.repeat.set(size / 40, size / 40);
      florTexture.colorSpace = THREE.SRGBColorSpace;

      material = new THREE.MeshStandardMaterial({
        map: florTexture,
        roughness: 0.92,
        metalness: 0.0,
        flatShading: false,
      });
    }

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.receiveShadow = !mobile;
    parent.add(this.mesh);
  }

  static sampleHeight(x: number, z: number): number {
    const dist = Math.sqrt(x * x + z * z);
    const centralFalloff = Math.min(1, Math.max(0, (dist - 80) / 250));
    const largeScale = fbmNoise(x * 0.002, z * 0.002, 5, 2.0, 0.5) * 8.0;
    const medScale = fbmNoise(x * 0.008 + 100, z * 0.008 + 100, 4, 2.0, 0.5) * 2.5;
    const detailScale = fbmNoise(x * 0.03 + 200, z * 0.03 + 200, 3, 2.0, 0.45) * 0.6;
    return TerrainBuilder.GROUND_Y + (largeScale + medScale + detailScale) * centralFalloff;
  }
}
