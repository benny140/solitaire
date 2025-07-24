import * as Phaser from 'phaser';
import { ASSET_KEYS, SCENE_KEYS } from './common';

const DEBUG = false;
const SCALE = 1.5;
const CARD_BACK_FRAME = 52;
const SUIT_FRAME = {
  HEART: 26,
  DIAMOND: 13,
  CLUB: 0,
  SPADE: 39,
};

const FOUNDATION_PILE_X_POSITIONS = [360, 425, 490, 555];
const FOUNDATION_PILE_Y_POSITION = 5;
const DISCARD_PILE_X_POSITION = 85;
const DISCARD_PILE_Y_POSITION = 5;
const DRAW_PILE_X_POSITION = 5;
const DRAW_PILE_Y_POSITION = 5;
const TABLEAU_PILE_X_POSITION = 40;
const TABLEAU_PILE_Y_POSITION = 92;

export class GameScene extends Phaser.Scene {
  private drawPileCards!: Phaser.GameObjects.Image[];
  private discardPileCards!: Phaser.GameObjects.Image[];
  private foundationPileCards!: Phaser.GameObjects.Image[];
  private tableauContainers!: Phaser.GameObjects.Container[];

  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  public create(): void {
    this.createDrawPile();
    this.createDiscardPile();
    this.createFoundationPiles();
    this.createTableauPiles();
    this.createDragEvent();
  }

  private createDrawPile(): void {
    this.drawCardLocationBox(DRAW_PILE_X_POSITION, DRAW_PILE_Y_POSITION);
    this.drawPileCards = [];
    for (let i = 0; i < 3; i++) {
      this.drawPileCards.push(this.createCard(DRAW_PILE_X_POSITION + 5 * i, DISCARD_PILE_Y_POSITION, true));
    }
  }

  /**
   * Draws a rectangle to indicate a card pile location.
   * @param x The x-coordinate of the box.
   * @param y The y-coordinate of the box.
   */
  private drawCardLocationBox(x: number, y: number): void {
    this.add.rectangle(x, y, 56, 78).setOrigin(0, 0).setStrokeStyle(2, 0x000000, 0.5);
  }

  /**
   * Creates a card game object.
   * @param x The x-coordinate of the card.
   * @param y The y-coordinate of the card.
   * @returns The created card image.
   */
  private createCard(
    x: number,
    y: number,
    draggable: boolean,
    cardIndex?: number,
    pileIndex?: number,
  ): Phaser.GameObjects.Image {
    const card = this.add.image(x, y, ASSET_KEYS.CARDS, CARD_BACK_FRAME);
    card.setOrigin(0, 0);
    card.setScale(SCALE);
    card.setInteractive({ draggable: draggable });
    card.setData({ x, y, cardIndex, pileIndex });
    return card;
  }

  private createDiscardPile(): void {
    this.drawCardLocationBox(DISCARD_PILE_X_POSITION, DISCARD_PILE_Y_POSITION);
    this.discardPileCards = [];
    const bottomCard = this.createCard(DISCARD_PILE_X_POSITION, DISCARD_PILE_Y_POSITION, true).setVisible(false);
    const topCard = this.createCard(DISCARD_PILE_X_POSITION, DISCARD_PILE_Y_POSITION, true).setVisible(false);
    this.discardPileCards.push(bottomCard, topCard);
  }

  private createFoundationPiles(): void {
    this.foundationPileCards = [];
    FOUNDATION_PILE_X_POSITIONS.forEach((x) => {
      this.drawCardLocationBox(x, FOUNDATION_PILE_Y_POSITION);
      const card = this.createCard(x, FOUNDATION_PILE_Y_POSITION, false).setVisible(false);
      this.foundationPileCards.push(card);
    });
  }

  private createTableauPiles(): void {
    this.tableauContainers = [];
    for (let i = 0; i < 7; i++) {
      const x = TABLEAU_PILE_X_POSITION + i * 85;
      const tableauContainer = this.add.container(x, TABLEAU_PILE_Y_POSITION, []);
      this.tableauContainers.push(tableauContainer);
      for (let j = 0; j <= i; j++) {
        const cardObject = this.createCard(0, j * 20, true, j, i);
        tableauContainer.add(cardObject);
      }
    }
  }

  private createDragEvent(): void {
    this.input.on(Phaser.Input.Events.DRAG_START, this.handleDragStart);
    this.input.on(Phaser.Input.Events.DRAG, this.handleDrag);
    this.input.on(Phaser.Input.Events.DRAG_END, this.handleDragEnd);
  }

  private handleDragStart = (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image): void => {
    if (gameObject.texture.key === ASSET_KEYS.CARDS) {
      const tableauPileIndex = gameObject.getData('pileIndex') as number | undefined;
      if (tableauPileIndex !== undefined) {
        this.tableauContainers[tableauPileIndex].setDepth(1);
      } else {
        gameObject.setDepth(1);
      }
      gameObject.setAlpha(0.8);
    }
  };

  private handleDrag = (
    pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.Image,
    dragX: number,
    dragY: number,
  ): void => {
    gameObject.x = dragX;
    gameObject.y = dragY;
  };

  private handleDragEnd = (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image): void => {
    if (gameObject.texture.key === ASSET_KEYS.CARDS) {
      const tableauPileIndex = gameObject.getData('pileIndex') as number | undefined;
      if (tableauPileIndex !== undefined) {
        this.tableauContainers[tableauPileIndex].setDepth(0);
      } else {
        gameObject.setDepth(0);
      }
      gameObject.setAlpha(1);
      gameObject.setPosition(gameObject.getData('x'), gameObject.getData('y'));
    }
  };
}
