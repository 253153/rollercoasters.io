import { RideSimState, TrackSample } from '../app/types';
import { TrackSpline } from './TrackSpline';
import { SpeedModel } from './SpeedModel';
import { CameraManager } from '../core/CameraManager';

export type RideEventCallback = (event: 'start' | 'finish') => void;

export class RideSimulator {
  state: RideSimState = 'idle';
  distanceTraveled = 0;
  elapsedTime = 0;
  progress = 0;

  private spline: TrackSpline | null = null;
  readonly speedModel: SpeedModel;
  private cameraManager: CameraManager;
  private eventCallback: RideEventCallback | null = null;

  /** Distance into the track where the lift hill ends */
  private liftEndDistance = 0;

  constructor(cameraManager: CameraManager) {
    this.speedModel = new SpeedModel();
    this.cameraManager = cameraManager;
  }

  onEvent(cb: RideEventCallback): void {
    this.eventCallback = cb;
  }

  setTrack(spline: TrackSpline, liftEndDistance: number): void {
    this.spline = spline;
    this.liftEndDistance = liftEndDistance;
  }

  start(): void {
    if (!this.spline) return;
    this.state = 'riding';
    this.distanceTraveled = 0;
    this.elapsedTime = 0;
    this.progress = 0;
    this.speedModel.reset();
    this.eventCallback?.('start');
  }

  stop(): void {
    this.state = 'idle';
  }

  reset(): void {
    this.state = 'idle';
    this.distanceTraveled = 0;
    this.elapsedTime = 0;
    this.progress = 0;
    this.speedModel.reset();
  }

  update(dt: number): TrackSample | null {
    if (this.state !== 'riding' || !this.spline) return null;

    this.elapsedTime += dt;

    // Determine if we're on the lift hill
    this.speedModel.setOnLift(this.distanceTraveled < this.liftEndDistance);

    // Get current sample for speed calculation
    const sample = this.spline.sampleAtDistance(this.distanceTraveled);
    this.speedModel.update(dt, sample);

    // Advance distance
    this.distanceTraveled += this.speedModel.speed * dt;
    this.progress = this.distanceTraveled / this.spline.totalLength;

    // Check completion
    if (this.distanceTraveled >= this.spline.totalLength) {
      this.distanceTraveled = this.spline.totalLength;
      this.progress = 1;
      this.state = 'finished';
      this.eventCallback?.('finish');
      return this.spline.sampleAtDistance(this.spline.totalLength);
    }

    // Get interpolated frame and apply to camera
    const rideSample = this.spline.sampleAtDistance(this.distanceTraveled);
    this.cameraManager.applyRideFrame(rideSample);

    return rideSample;
  }
}
