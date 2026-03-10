import * as THREE from 'three';
import { CONFIG } from '../app/config';

/**
 * Procedural gradient sky dome rendered via a custom shader.
 * Horizon blends warm haze into deep blue zenith.
 */
export class SkyBuilder {
  constructor(scene: THREE.Scene) {
    const skyGeo = new THREE.SphereGeometry(900, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x2266aa) },
        midColor: { value: new THREE.Color(0x88bbee) },
        bottomColor: { value: new THREE.Color(0xd4e4f0) },
        horizonColor: { value: new THREE.Color(0xeef4f8) },
        offset: { value: 20.0 },
        exponent: { value: 0.5 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 bottomColor;
        uniform vec3 horizonColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;

        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;

          // Below horizon
          if (h < 0.0) {
            float t = clamp(-h * 3.0, 0.0, 1.0);
            gl_FragColor = vec4(mix(horizonColor, bottomColor, t), 1.0);
          } else {
            // Above horizon: horizon -> mid -> top
            float t = pow(h, exponent);
            vec3 col = mix(horizonColor, midColor, clamp(t * 2.0, 0.0, 1.0));
            col = mix(col, topColor, clamp((t - 0.5) * 2.0, 0.0, 1.0));
            gl_FragColor = vec4(col, 1.0);
          }
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);

    scene.fog = new THREE.FogExp2(0xd8e8f0, 0.0012);
  }
}
