import * as Phaser from 'phaser';
import { ASSET_KEYS, SCENE_KEYS, CARD_WIDTH, CARD_HEIGHT } from './common';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.PRELOAD });
  }

  public preload(): void {
    // load assets
    this.load.image(ASSET_KEYS.TITLE, 'assets/images/title.png');
    this.load.image(ASSET_KEYS.CLICK_TO_START, 'assets/images/clickToStart.png');
    this.load.spritesheet(ASSET_KEYS.CARDS, 'assets/images/cards.png', {
      frameWidth: CARD_WIDTH,
      frameHeight: CARD_HEIGHT,
    });
  }

  public create(): void {
    this.scene.start(SCENE_KEYS.TITLE);
  }
}
