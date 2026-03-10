import { RideIntensity, RideLength } from '../app/types';
import { GameState } from '../app/state';

export class MainMenu {
  private root: HTMLElement;
  private startLayout: HTMLElement;
  private lengthGroup: HTMLElement;
  private intensityGroup: HTMLElement;
  private seedInput: HTMLInputElement;
  private btnGenerate: HTMLButtonElement;
  private btnRide: HTMLButtonElement;
  private btnEnterVR: HTMLButtonElement;
  private generatingText: HTMLElement;

  onGenerate: (() => void) | null = null;
  onRide: (() => void) | null = null;
  onEnterVR: (() => void) | null = null;

  constructor(private state: GameState) {
    this.root = document.getElementById('main-menu')!;
    this.startLayout = document.getElementById('start-layout')!;
    this.lengthGroup = document.getElementById('length-group')!;
    this.intensityGroup = document.getElementById('intensity-group')!;
    this.seedInput = document.getElementById('seed-input') as HTMLInputElement;
    this.btnGenerate = document.getElementById('btn-generate') as HTMLButtonElement;
    this.btnRide = document.getElementById('btn-ride') as HTMLButtonElement;
    this.btnEnterVR = document.getElementById('btn-enter-vr') as HTMLButtonElement;
    this.generatingText = document.getElementById('generating-text')!;

    this.seedInput.value = String(state.settings.seed);
    this.setupBtnGroup(this.lengthGroup, state.settings.length);
    this.setupBtnGroup(this.intensityGroup, state.settings.intensity);

    this.lengthGroup.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('button');
      if (!btn) return;
      this.activateInGroup(this.lengthGroup, btn);
      state.settings.length = btn.dataset.value as RideLength;
    });

    this.intensityGroup.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('button');
      if (!btn) return;
      this.activateInGroup(this.intensityGroup, btn);
      state.settings.intensity = btn.dataset.value as RideIntensity;
    });

    this.seedInput.addEventListener('change', () => {
      const val = parseInt(this.seedInput.value, 10);
      if (!isNaN(val)) state.settings.seed = val;
    });

    this.btnGenerate.addEventListener('click', () => {
      const val = parseInt(this.seedInput.value, 10);
      if (!isNaN(val)) state.settings.seed = val;
      this.onGenerate?.();
    });

    this.btnRide.addEventListener('click', () => {
      this.onRide?.();
    });

    this.btnEnterVR.addEventListener('click', () => {
      this.onEnterVR?.();
    });

    this.setupInstructionTabs();
  }

  show(): void {
    this.startLayout.style.display = 'flex';
    this.seedInput.value = String(this.state.settings.seed);
    this.setupBtnGroup(this.lengthGroup, this.state.settings.length);
    this.setupBtnGroup(this.intensityGroup, this.state.settings.intensity);
  }

  hide(): void {
    this.startLayout.style.display = 'none';
  }

  showRideButton(): void {
    this.btnRide.classList.add('visible');
    this.generatingText.style.display = 'none';
  }

  hideRideButton(): void {
    this.btnRide.classList.remove('visible');
  }

  showVRButton(): void {
    this.btnEnterVR.classList.add('visible');
  }

  hideVRButton(): void {
    this.btnEnterVR.classList.remove('visible');
  }

  showGenerating(): void {
    this.generatingText.style.display = 'block';
  }

  updateSeedDisplay(seed: number): void {
    this.seedInput.value = String(seed);
  }

  private setupInstructionTabs(): void {
    const tabs = this.root.querySelectorAll('.instructions-tab');
    const contents = this.root.querySelectorAll('.instructions-content');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = (tab as HTMLElement).dataset.tab;
        tabs.forEach((t) => t.classList.remove('active'));
        contents.forEach((c) => c.classList.remove('active'));
        tab.classList.add('active');
        const targetEl = document.getElementById(`instructions-${target}`);
        targetEl?.classList.add('active');
      });
    });
  }

  private setupBtnGroup(group: HTMLElement, activeValue: string): void {
    const buttons = group.querySelectorAll('button');
    buttons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.value === activeValue);
    });
  }

  private activateInGroup(group: HTMLElement, activeBtn: Element): void {
    group.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
    activeBtn.classList.add('active');
  }
}
