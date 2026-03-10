import { GeneratedCoaster, RideStats } from '../app/types';
import { TrackSpline } from './TrackSpline';
import { RideSimulator } from './RideSimulator';

export class CoasterStats {
  static compute(
    coaster: GeneratedCoaster,
    spline: TrackSpline,
    simulator: RideSimulator
  ): RideStats {
    return {
      duration: simulator.elapsedTime,
      totalInversions: coaster.totalInversions,
      maxSpeed: simulator.speedModel.maxRecordedSpeed * 3.6,
      maxHeight: spline.getMaxHeight(),
      segmentCount: coaster.segmentCount,
      seed: coaster.settings.seed,
      totalDistance: spline.totalLength,
    };
  }

  static format(stats: RideStats): Array<{ label: string; value: string }> {
    return [
      { label: 'Duration', value: `${stats.duration.toFixed(1)}s` },
      { label: 'Max Speed', value: `${stats.maxSpeed.toFixed(0)} km/h` },
      { label: 'Max Height', value: `${stats.maxHeight.toFixed(0)}m` },
      { label: 'Inversions', value: `${stats.totalInversions}` },
      { label: 'Segments', value: `${stats.segmentCount}` },
      { label: 'Distance', value: `${stats.totalDistance.toFixed(0)}m` },
      { label: 'Seed', value: `${stats.seed}` },
    ];
  }
}
