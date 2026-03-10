import { RideStats } from '../app/types';
import { CoasterStats } from '../coaster/CoasterStats';

export class ResultsPanel {
  private root: HTMLElement;
  private statsGrid: HTMLElement;
  private toast: HTMLElement;
  private toastTimer = 0;

  onRideAgain: (() => void) | null = null;
  onNewCoaster: (() => void) | null = null;
  onShare: (() => void) | null = null;

  constructor() {
    this.root = document.getElementById('results-panel')!;
    this.statsGrid = document.getElementById('stats-grid')!;
    this.toast = document.getElementById('share-toast')!;

    document.getElementById('btn-ride-again')!.addEventListener('click', () => {
      this.onRideAgain?.();
    });
    document.getElementById('btn-new-coaster')!.addEventListener('click', () => {
      this.onNewCoaster?.();
    });
    document.getElementById('btn-share-results')!.addEventListener('click', () => {
      this.onShare?.();
    });
  }

  show(stats: RideStats): void {
    const formatted = CoasterStats.format(stats);
    this.statsGrid.innerHTML = formatted
      .map(
        (s) =>
          `<div class="stat-item">
            <div class="stat-label">${s.label}</div>
            <div class="stat-value">${s.value}</div>
          </div>`
      )
      .join('');
    this.root.classList.add('visible');
  }

  hide(): void {
    this.root.classList.remove('visible');
  }

  showToast(message: string): void {
    this.toast.textContent = message;
    this.toast.classList.add('visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toast.classList.remove('visible');
    }, 2000);
  }
}
