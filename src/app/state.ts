import { AppState, GeneratedCoaster, GenerationSettings, RideStats } from './types';

export class GameState {
  appState: AppState = 'menu';
  settings: GenerationSettings = {
    length: 'medium',
    intensity: 'thrill',
    seed: Math.floor(Math.random() * 999999),
  };
  currentCoaster: GeneratedCoaster | null = null;
  rideStats: RideStats | null = null;
  coasterGenerated = false;

  private listeners: Array<() => void> = [];

  onChange(fn: () => void): void {
    this.listeners.push(fn);
  }

  notify(): void {
    for (const fn of this.listeners) fn();
  }

  setAppState(state: AppState): void {
    this.appState = state;
    this.notify();
  }

  reset(): void {
    this.currentCoaster = null;
    this.rideStats = null;
    this.coasterGenerated = false;
    this.settings.seed = Math.floor(Math.random() * 999999);
    this.setAppState('menu');
  }
}
