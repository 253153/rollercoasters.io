import { GenerationSettings, SavedCoaster } from './types';

const STORAGE_KEY = 'endless-coaster-saves';

export class SaveManager {
  private saves: SavedCoaster[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.saves = JSON.parse(raw);
    } catch {
      this.saves = [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.saves));
    } catch {
      // Storage full or unavailable
    }
  }

  getAll(): SavedCoaster[] {
    return [...this.saves];
  }

  save(settings: GenerationSettings, name?: string): SavedCoaster {
    const entry: SavedCoaster = {
      name: name || `Coaster #${settings.seed}`,
      seed: settings.seed,
      length: settings.length,
      intensity: settings.intensity,
      savedAt: Date.now(),
    };
    // Avoid duplicates by seed+length+intensity
    const existIdx = this.saves.findIndex(
      (s) =>
        s.seed === entry.seed &&
        s.length === entry.length &&
        s.intensity === entry.intensity
    );
    if (existIdx >= 0) {
      this.saves[existIdx] = entry;
    } else {
      this.saves.unshift(entry);
    }
    this.persist();
    return entry;
  }

  remove(index: number): void {
    this.saves.splice(index, 1);
    this.persist();
  }

  /** Encode settings into a shareable URL hash */
  static toShareURL(settings: GenerationSettings): string {
    const params = new URLSearchParams({
      seed: String(settings.seed),
      length: settings.length,
      intensity: settings.intensity,
    });
    return `${window.location.origin}${window.location.pathname}#${params.toString()}`;
  }

  /** Copy share URL to clipboard, returns true on success */
  static async copyShareURL(settings: GenerationSettings): Promise<boolean> {
    const url = SaveManager.toShareURL(settings);
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }
  }

  /** Parse settings from the current URL hash, returns null if none */
  static parseFromURL(): GenerationSettings | null {
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    try {
      const params = new URLSearchParams(hash);
      const seed = params.get('seed');
      const length = params.get('length');
      const intensity = params.get('intensity');
      if (!seed) return null;
      const seedNum = parseInt(seed, 10);
      if (isNaN(seedNum)) return null;
      return {
        seed: seedNum,
        length: (['short', 'medium', 'long', 'extreme'].includes(length || '')
          ? length
          : 'medium') as GenerationSettings['length'],
        intensity: (['chill', 'thrill', 'insane'].includes(intensity || '')
          ? intensity
          : 'thrill') as GenerationSettings['intensity'],
      };
    } catch {
      return null;
    }
  }

  /** Clear the URL hash without reloading */
  static clearURL(): void {
    history.replaceState(null, '', window.location.pathname);
  }
}
