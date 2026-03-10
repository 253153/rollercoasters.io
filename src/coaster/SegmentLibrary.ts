import { SegmentDefinition, SegmentCategory, RideIntensity } from '../app/types';
import { CONFIG } from '../app/config';
import { ALL_SEGMENT_TEMPLATES } from './SegmentTemplates';
import { SeededRandom } from './SeededRandom';

export class SegmentLibrary {
  private segments: SegmentDefinition[];

  constructor() {
    this.segments = ALL_SEGMENT_TEMPLATES;
  }

  getById(id: string): SegmentDefinition | undefined {
    return this.segments.find((s) => s.id === id);
  }

  getByCategory(category: SegmentCategory): SegmentDefinition[] {
    return this.segments.filter((s) => s.category === category);
  }

  /** Get main-body segments filtered by intensity */
  getForIntensity(intensity: RideIntensity): SegmentDefinition[] {
    const cfg = CONFIG.generation.intensityThrill[intensity];
    return this.segments.filter(
      (s) =>
        s.weight > 0 &&
        s.thrillRating <= cfg.maxThrill &&
        s.category !== 'start' &&
        s.category !== 'lift' &&
        s.category !== 'brake'
    );
  }

  /** Weighted random pick from candidates, respecting cooldown tags */
  getWeightedRandom(
    candidates: SegmentDefinition[],
    rng: SeededRandom,
    recentTags: string[],
    consecutiveInversions: number
  ): SegmentDefinition | null {
    let filtered = candidates.filter((s) => {
      // Respect cooldown: skip if any of this segment's cooldownTags appeared recently
      if (s.cooldownTags.some((tag) => recentTags.includes(tag))) return false;
      // Limit consecutive inversions
      if (
        s.inversionCount > 0 &&
        consecutiveInversions >= CONFIG.generation.maxConsecutiveInversions
      ) {
        return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      // Fallback: relax cooldown restriction
      filtered = candidates.filter((s) => {
        if (
          s.inversionCount > 0 &&
          consecutiveInversions >= CONFIG.generation.maxConsecutiveInversions
        ) {
          return false;
        }
        return true;
      });
    }

    if (filtered.length === 0) {
      // Ultimate fallback: pick any non-inversion segment
      filtered = candidates.filter((s) => s.inversionCount === 0);
    }

    if (filtered.length === 0) return null;

    const weights = filtered.map((s) => s.weight);
    return rng.weightedPick(filtered, weights);
  }
}
