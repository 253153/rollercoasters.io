import { CONFIG } from '../app/config';
import { TrackSample } from '../app/types';
import { clamp } from '../utils/math';

export class SpeedModel {
  speed: number;
  maxRecordedSpeed: number;
  private isOnLift: boolean;

  constructor() {
    this.speed = CONFIG.speed.initialSpeed;
    this.maxRecordedSpeed = 0;
    this.isOnLift = false;
  }

  reset(): void {
    this.speed = CONFIG.speed.initialSpeed;
    this.maxRecordedSpeed = 0;
    this.isOnLift = false;
  }

  setOnLift(onLift: boolean): void {
    this.isOnLift = onLift;
  }

  /**
   * Update speed based on the current track sample's slope.
   * tangent.y < 0 = going downhill = speed up
   * tangent.y > 0 = going uphill = slow down
   */
  update(dt: number, sample: TrackSample): void {
    if (this.isOnLift) {
      this.speed = CONFIG.speed.liftSpeed;
      return;
    }

    const slope = -sample.tangent.y;
    const acceleration = CONFIG.speed.gravity * slope - CONFIG.speed.drag;
    this.speed += acceleration * dt;
    this.speed = clamp(this.speed, CONFIG.speed.minSpeed, CONFIG.speed.maxSpeed);

    if (this.speed > this.maxRecordedSpeed) {
      this.maxRecordedSpeed = this.speed;
    }
  }

  /** Speed in km/h for display purposes */
  getSpeedKmh(): number {
    return this.speed * 3.6;
  }
}
