import * as THREE from 'three';
import { TrackSample } from '../app/types';
import { CONFIG } from '../app/config';
import { COLORS } from '../utils/constants';

export class TrackMeshBuilder {
  build(samples: TrackSample[], parent: THREE.Group): void {
    const railMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.trackRail,
      roughness: 0.3,
      metalness: 0.7,
    });

    const spineMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.trackSpine,
      roughness: 0.4,
      metalness: 0.5,
    });

    const tieMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.trackTie,
      roughness: 0.5,
      metalness: 0.4,
    });

    const halfGauge = CONFIG.track.railGauge / 2;
    const radial = CONFIG.track.railSegmentsRadial;

    const leftPath: THREE.Vector3[] = [];
    const rightPath: THREE.Vector3[] = [];
    const centerPath: THREE.Vector3[] = [];

    for (const s of samples) {
      const offset = s.binormal.clone().multiplyScalar(halfGauge);
      leftPath.push(s.position.clone().add(offset));
      rightPath.push(s.position.clone().sub(offset));
      centerPath.push(s.position.clone());
    }

    const leftRail = this.buildTubeMesh(leftPath, samples, CONFIG.track.railRadius, radial, railMaterial);
    leftRail.castShadow = true;
    leftRail.receiveShadow = true;
    parent.add(leftRail);

    const rightRail = this.buildTubeMesh(rightPath, samples, CONFIG.track.railRadius, radial, railMaterial);
    rightRail.castShadow = true;
    rightRail.receiveShadow = true;
    parent.add(rightRail);

    const spine = this.buildTubeMesh(centerPath, samples, CONFIG.track.spineRadius, Math.max(6, radial - 2), spineMaterial);
    spine.castShadow = true;
    parent.add(spine);

    const tieInterval = CONFIG.track.tieInterval;
    for (let i = 0; i < samples.length; i += tieInterval) {
      const s = samples[i];
      const tieMesh = this.buildTie(s, tieMaterial);
      tieMesh.castShadow = true;
      parent.add(tieMesh);
    }
  }

  /**
   * Build a tube mesh using the track sample frames for twist-free orientation.
   * Each ring of vertices is oriented by the sample's normal and binormal.
   */
  private buildTubeMesh(
    path: THREE.Vector3[],
    samples: TrackSample[],
    radius: number,
    radialSegments: number,
    material: THREE.Material
  ): THREE.Mesh {
    const segCount = path.length - 1;
    const vertsPerRing = radialSegments + 1;
    const totalVerts = path.length * vertsPerRing;
    const totalTris = segCount * radialSegments * 2;

    const positions = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);
    const indices = new Uint32Array(totalTris * 3);

    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      const s = samples[i];

      // Use the track sample's normal and binormal for twist-free rings
      const up = s.normal;
      const right = s.binormal;

      for (let j = 0; j <= radialSegments; j++) {
        const angle = (j / radialSegments) * Math.PI * 2;
        const nx = Math.cos(angle);
        const ny = Math.sin(angle);

        const normalVec = new THREE.Vector3()
          .addScaledVector(right, nx)
          .addScaledVector(up, ny);

        const vx = p.x + normalVec.x * radius;
        const vy = p.y + normalVec.y * radius;
        const vz = p.z + normalVec.z * radius;

        const idx = (i * vertsPerRing + j) * 3;
        positions[idx] = vx;
        positions[idx + 1] = vy;
        positions[idx + 2] = vz;
        normals[idx] = normalVec.x;
        normals[idx + 1] = normalVec.y;
        normals[idx + 2] = normalVec.z;
      }
    }

    let triIdx = 0;
    for (let i = 0; i < segCount; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * vertsPerRing + j;
        const b = a + vertsPerRing;
        const c = a + 1;
        const d = b + 1;

        indices[triIdx++] = a;
        indices[triIdx++] = b;
        indices[triIdx++] = c;
        indices[triIdx++] = c;
        indices[triIdx++] = b;
        indices[triIdx++] = d;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    return new THREE.Mesh(geometry, material);
  }

  private buildTie(sample: TrackSample, material: THREE.Material): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(
      CONFIG.track.tieWidth,
      CONFIG.track.tieHeight,
      CONFIG.track.tieDepth
    );

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(sample.position);

    const m = new THREE.Matrix4();
    m.makeBasis(sample.binormal, sample.normal, sample.tangent);
    mesh.quaternion.setFromRotationMatrix(m);

    return mesh;
  }
}
