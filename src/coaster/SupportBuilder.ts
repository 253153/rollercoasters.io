import * as THREE from 'three';
import { TrackSample } from '../app/types';
import { CONFIG } from '../app/config';
import { COLORS } from '../utils/constants';
import { TerrainBuilder } from '../world/TerrainBuilder';

export class SupportBuilder {
  build(samples: TrackSample[], parent: THREE.Group): void {
    const supportMat = new THREE.MeshStandardMaterial({
      color: COLORS.support,
      roughness: 0.55,
      metalness: 0.4,
    });

    const baseMat = new THREE.MeshStandardMaterial({
      color: COLORS.supportBase,
      roughness: 0.65,
      metalness: 0.3,
    });

    const interval = CONFIG.supports.interval;
    const minHeight = CONFIG.supports.minHeight;
    const radialSegs = CONFIG.supports.radialSegments;
    let lastSupportX = -Infinity;
    let lastSupportZ = -Infinity;
    const minSpacingXZ = 5;

    for (let i = 0; i < samples.length; i += interval) {
      const s = samples[i];
      const trackY = s.position.y;
      const groundY = TerrainBuilder.sampleHeight(s.position.x, s.position.z);
      const height = trackY - groundY;

      if (height < minHeight) continue;

      const dx = s.position.x - lastSupportX;
      const dz = s.position.z - lastSupportZ;
      if (Math.sqrt(dx * dx + dz * dz) < minSpacingXZ) continue;

      const colGeo = new THREE.CylinderGeometry(
        CONFIG.supports.radius * 0.85,
        CONFIG.supports.radius,
        height,
        radialSegs
      );
      const column = new THREE.Mesh(colGeo, supportMat);
      column.position.set(s.position.x, groundY + height / 2, s.position.z);
      column.castShadow = true;
      parent.add(column);

      const baseGeo = new THREE.CylinderGeometry(
        CONFIG.supports.baseRadius,
        CONFIG.supports.baseRadius * 1.1,
        CONFIG.supports.baseHeight,
        radialSegs
      );
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.set(s.position.x, groundY + CONFIG.supports.baseHeight / 2, s.position.z);
      parent.add(base);

      lastSupportX = s.position.x;
      lastSupportZ = s.position.z;
    }
  }
}
