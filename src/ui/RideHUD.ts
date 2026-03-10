export class RideHUD {
  private root: HTMLElement;
  private speedValue: HTMLElement;

  onShare: (() => void) | null = null;

  constructor() {
    this.root = document.getElementById('ride-hud')!;
    this.speedValue = document.getElementById('hud-speed-value')!;

    document.getElementById('btn-share-ride')!.addEventListener('click', () => {
      this.onShare?.();
    });
  }

  show(): void {
    this.root.classList.add('visible');
  }

  hide(): void {
    this.root.classList.remove('visible');
  }

  update(speedKmh: number, _progress: number): void {
    this.speedValue.textContent = Math.round(speedKmh).toString();
  }
}
