import { GameState } from '../app/state';
import { RideStats } from '../app/types';
import { MainMenu } from './MainMenu';
import { RideHUD } from './RideHUD';
import { ResultsPanel } from './ResultsPanel';

export class UIManager {
  readonly mainMenu: MainMenu;
  readonly rideHUD: RideHUD;
  readonly resultsPanel: ResultsPanel;

  private menuBtn: HTMLElement;
  private menuOpen = false;

  onMenuToggle: ((open: boolean) => void) | null = null;

  constructor(state: GameState) {
    this.mainMenu = new MainMenu(state);
    this.rideHUD = new RideHUD();
    this.resultsPanel = new ResultsPanel();
    this.menuBtn = document.getElementById('btn-open-menu')!;

    this.menuBtn.addEventListener('click', () => {
      if (this.menuOpen) {
        this.closeOverlayMenu();
      } else {
        this.openOverlayMenu();
      }
    });
  }

  showMenu(): void {
    this.menuOpen = false;
    this.menuBtn.classList.remove('visible');
    this.mainMenu.show();
    this.rideHUD.hide();
    this.resultsPanel.hide();
  }

  showRiding(): void {
    this.menuOpen = false;
    this.mainMenu.hide();
    this.rideHUD.show();
    this.resultsPanel.hide();
    this.menuBtn.classList.add('visible');
  }

  showResults(stats: RideStats): void {
    this.menuOpen = false;
    this.mainMenu.hide();
    this.rideHUD.hide();
    this.resultsPanel.show(stats);
    this.menuBtn.classList.add('visible');
  }

  hideAll(): void {
    this.menuOpen = false;
    this.mainMenu.hide();
    this.rideHUD.hide();
    this.resultsPanel.hide();
    this.menuBtn.classList.remove('visible');
  }

  private openOverlayMenu(): void {
    this.menuOpen = true;
    this.mainMenu.show();
    this.onMenuToggle?.(true);
  }

  private closeOverlayMenu(): void {
    this.menuOpen = false;
    this.mainMenu.hide();
    this.onMenuToggle?.(false);
  }

  get isMenuOverlayOpen(): boolean {
    return this.menuOpen;
  }
}
