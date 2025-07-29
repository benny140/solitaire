import * as Phaser from 'phaser';
import { ASSET_KEYS, CARD_HEIGHT, CARD_WIDTH, SCENE_KEYS } from './common';

const DEBUG = true;
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
const CARD_OFFSET = 20;
const DRAW_RECTANGLE_HEIGHT = 78;
const DRAW_RECTANGLE_WIDTH = 56;
type ZoneType = keyof typeof ZONE_TYPE;
const ZONE_TYPE = {
  FOUNDATION: 'foundation',
  TABLEAU: 'tableau',
  DRAW: 'draw',
  DISCARD: 'discard',
} as const;

export class GameScene extends Phaser.Scene {
  private drawPileCards!: Phaser.GameObjects.Image[];
  private discardPileCards!: Phaser.GameObjects.Image[];
  private foundationPileCards!: Phaser.GameObjects.Image[];
  private tableauContainers!: Phaser.GameObjects.Container[];
  private draggedStack: Phaser.GameObjects.Image[] = [];

  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  public create(): void {
    this.createDrawPile();
    this.createDiscardPile();
    this.createFoundationPiles();
    this.createTableauPiles();
    this.createDragEvent();
    this.createDropZones();
  }

  private createDrawPile(): void {
    this.drawCardLocationBox(DRAW_PILE_X_POSITION, DRAW_PILE_Y_POSITION);
    this.drawPileCards = [];
    for (let i = 0; i < 3; i++) {
      this.drawPileCards.push(this.createCard(DRAW_PILE_X_POSITION + 5 * i, DISCARD_PILE_Y_POSITION, true));
    }
    const drawZone = this.add
      .zone(0, 0, CARD_WIDTH * SCALE + 20, CARD_HEIGHT * SCALE + 12)
      .setOrigin(0, 0)
      .setInteractive();

    drawZone.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.discardPileCards[0].setFrame(this.discardPileCards[1].frame).setVisible(this.discardPileCards[1].visible);
      this.discardPileCards[1].setFrame(this.drawPileCards[0].frame).setVisible(true);
    });

    if (DEBUG) {
      this.add
        .rectangle(drawZone.x, drawZone.y, drawZone.width, drawZone.height)
        .setOrigin(0, 0)
        .setFillStyle(0xff0000, 0.5);
    }
  }

  /**
   * Draws a rectangle to indicate a card pile location.
   * @param x The x-coordinate of the box.
   * @param y The y-coordinate of the box.
   */
  private drawCardLocationBox(x: number, y: number): void {
    this.add
      .rectangle(x, y, DRAW_RECTANGLE_WIDTH, DRAW_RECTANGLE_HEIGHT)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x000000, 0.5);
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
        const cardObject = this.createCard(0, j * CARD_OFFSET, true, j, i);
        tableauContainer.add(cardObject);
      }
    }
  }

  private createDragEvent(): void {
    this.input.on(Phaser.Input.Events.DRAG_START, this.handleDragStart);
    this.input.on(Phaser.Input.Events.DRAG, this.handleDrag);
    this.input.on(Phaser.Input.Events.DRAG_END, this.handleDragEnd);
    this.input.on(Phaser.Input.Events.DROP, this.dropEventListener);
  }

  private handleDragStart = (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image): void => {
    if (gameObject.texture.key === ASSET_KEYS.CARDS) {
      const pileIndex = gameObject.getData('pileIndex');
      const cardIndex = gameObject.getData('cardIndex');
      if (pileIndex !== undefined && cardIndex !== undefined && this.tableauContainers[pileIndex]) {
        // Find all cards in the stack (cardIndex and above)
        this.draggedStack = this.tableauContainers[pileIndex].list.filter(
          (child: any) => child.getData('cardIndex') >= cardIndex,
        ) as Phaser.GameObjects.Image[];
        this.draggedStack.forEach((card) => {
          card.setDepth(1);
          card.setAlpha(0.8);
        });
      } else {
        // Not part of tableauContainers, just apply to the card itself
        this.draggedStack = [gameObject];
        gameObject.setDepth(1);
        gameObject.setAlpha(0.8);
      }
    }
  };

  private handleDrag = (
    pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.Image,
    dragX: number,
    dragY: number,
  ): void => {
    // Move all cards in the dragged stack, offset by their position in the stack
    this.draggedStack.forEach((card, idx) => {
      card.x = dragX;
      card.y = dragY + idx * CARD_OFFSET; // 20px offset per card
    });
  };

  private handleDragEnd = (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image): void => {
    this.draggedStack.forEach((card) => {
      card.setDepth(0);
      card.setAlpha(1);
      card.setPosition(card.getData('x'), card.getData('y'));
    });
    this.draggedStack = [];
  };

  private dropEventListener = (
    pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.Image,
    dropZone: Phaser.GameObjects.Zone,
  ): void => {
    if (dropZone.getData('zoneType') === ZONE_TYPE.FOUNDATION) {
      this.handleMoveCardToFoundation(gameObject, dropZone);
    } else if (dropZone.getData('zoneType') === ZONE_TYPE.TABLEAU) {
      this.handleMoveCardToTableau(gameObject, dropZone);
    }
  };

  private handleMoveCardToFoundation(gameObject: Phaser.GameObjects.Image, zone: Phaser.GameObjects.Zone): void {
    // TODO: Implement logic to move card(s) to the foundation pile.
    // Example: Remove from tableau, add to foundation, update card position, etc.
    // You may want to check if the move is valid according to solitaire rules.
    console.log('Move card to foundation:', gameObject, zone);
  }

  private handleMoveCardToTableau(gameObject: Phaser.GameObjects.Image, zone: Phaser.GameObjects.Zone): void {
    // TODO: Implement logic to move card(s) to the tableau pile.
    // Example: Remove from current pile, add to tableau, update card position, etc.
    // You may want to check if the move is valid according to solitaire rules.
    console.log('Move card to tableau:', gameObject, zone.getData('tableauIndex'));
  }

  private createDropZones(): void {
    let zone = this.add
      .zone(350, 0, 270, 85)
      .setOrigin(0, 0)
      .setRectangleDropZone(270, 85)
      .setData({ zoneType: ZONE_TYPE.FOUNDATION });
    if (DEBUG) {
      this.add.rectangle(zone.x, zone.y, zone.width, zone.height).setOrigin(0, 0).setFillStyle(0xff0000, 0.5);
    }

    for (let i = 0; i < 7; i++) {
      zone = this.add
        .zone(30 + i * 85, TABLEAU_PILE_Y_POSITION, 75.5, this.scale.height - TABLEAU_PILE_Y_POSITION)
        .setOrigin(0, 0)
        .setRectangleDropZone(75.5, this.scale.height - TABLEAU_PILE_Y_POSITION)
        .setData({ zoneType: ZONE_TYPE.TABLEAU, tableauIndex: i })
        .setDepth(-1);
      if (DEBUG) {
        this.add.rectangle(zone.x, zone.y, zone.width, zone.height).setOrigin(0, 0).setFillStyle(0xff0000, 0.5);
      }
    }
  }
}
