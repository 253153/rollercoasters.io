import * as THREE from 'three';
import { COLORS } from '../utils/constants';

export class Lighting {
  readonly sunLight: THREE.DirectionalLight;
  readonly fillLight: THREE.DirectionalLight;
  readonly ambientLight: THREE.HemisphereLight;

  constructor(scene: THREE.Scene, enableShadows = true) {
    // Main sun
    this.sunLight = new THREE.DirectionalLight(COLORS.sunLight, 1.6);
    this.sunLight.position.set(150, 220, 100);

    if (enableShadows) {
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.set(1024, 1024);
      this.sunLight.shadow.camera.left = -300;
      this.sunLight.shadow.camera.right = 300;
      this.sunLight.shadow.camera.top = 300;
      this.sunLight.shadow.camera.bottom = -300;
      this.sunLight.shadow.camera.near = 10;
      this.sunLight.shadow.camera.far = 600;
      this.sunLight.shadow.bias = -0.0003;
      this.sunLight.shadow.normalBias = 0.02;
    }

    scene.add(this.sunLight);

    // Subtle blue-tinted fill from the opposite side
    this.fillLight = new THREE.DirectionalLight(0x8eb8e8, 0.35);
    this.fillLight.position.set(-120, 80, -80);
    scene.add(this.fillLight);

    // Hemisphere ambient: sky blue top, ground green bottom
    this.ambientLight = new THREE.HemisphereLight(
      COLORS.ambientSky,
      COLORS.ambientGround,
      enableShadows ? 0.55 : 0.7
    );
    scene.add(this.ambientLight);
  }
}
