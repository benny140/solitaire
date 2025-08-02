import * as Phaser from 'phaser';
import { ASSET_KEYS, CARD_HEIGHT, CARD_WIDTH, SCENE_KEYS } from './common';
import { solitaire } from '../lib/solitare';

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
  #drawPileCards!: Phaser.GameObjects.Image[];
  #discardPileCards!: Phaser.GameObjects.Image[];
  #foundationPileCards!: Phaser.GameObjects.Image[];
  #tableauContainers!: Phaser.GameObjects.Container[];
  #draggedStack: Phaser.GameObjects.Image[] = [];
  #solitaire: solitaire;

  constructor() {
    super({ key: SCENE_KEYS.GAME });
    this.#solitaire = new solitaire();
    this.#solitaire.newGame();
  }

  public create(): void {
    this.#createDrawPile();
    this.#createDiscardPile();
    this.#createFoundationPiles();
    this.#createTableauPiles();
    this.#createDragEvent();
    this.#createDropZones();
  }

  #createDrawPile(): void {
    this.#drawCardLocationBox(DRAW_PILE_X_POSITION, DRAW_PILE_Y_POSITION);
    this.#drawPileCards = [];
    for (let i = 0; i < 3; i++) {
      this.#drawPileCards.push(this.#createCard(DRAW_PILE_X_POSITION + 5 * i, DISCARD_PILE_Y_POSITION, true));
    }
    const drawZone = this.add
      .zone(0, 0, CARD_WIDTH * SCALE + 20, CARD_HEIGHT * SCALE + 12)
      .setOrigin(0, 0)
      .setInteractive();

    drawZone.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.#discardPileCards[0].setFrame(this.#discardPileCards[1].frame).setVisible(this.#discardPileCards[1].visible);
      this.#discardPileCards[1].setFrame(this.#drawPileCards[0].frame).setVisible(true);
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
  #drawCardLocationBox(x: number, y: number): void {
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
  #createCard(
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

  #createDiscardPile(): void {
    this.#drawCardLocationBox(DISCARD_PILE_X_POSITION, DISCARD_PILE_Y_POSITION);
    this.#discardPileCards = [];
    const bottomCard = this.#createCard(DISCARD_PILE_X_POSITION, DISCARD_PILE_Y_POSITION, true).setVisible(false);
    const topCard = this.#createCard(DISCARD_PILE_X_POSITION, DISCARD_PILE_Y_POSITION, true).setVisible(false);
    this.#discardPileCards.push(bottomCard, topCard);
  }

  #createFoundationPiles(): void {
    this.#foundationPileCards = [];
    FOUNDATION_PILE_X_POSITIONS.forEach((x) => {
      this.#drawCardLocationBox(x, FOUNDATION_PILE_Y_POSITION);
      const card = this.#createCard(x, FOUNDATION_PILE_Y_POSITION, false).setVisible(false);
      this.#foundationPileCards.push(card);
    });
  }

  #createTableauPiles(): void {
    this.#tableauContainers = [];
    for (let i = 0; i < 7; i++) {
      const x = TABLEAU_PILE_X_POSITION + i * 85;
      const tableauContainer = this.add.container(x, TABLEAU_PILE_Y_POSITION, []);
      this.#tableauContainers.push(tableauContainer);
      for (let j = 0; j <= i; j++) {
        const cardObject = this.#createCard(0, j * CARD_OFFSET, true, j, i);
        tableauContainer.add(cardObject);
      }
    }
  }

  #createDragEvent(): void {
    this.input.on(Phaser.Input.Events.DRAG_START, this.#handleDragStart);
    this.input.on(Phaser.Input.Events.DRAG, this.#handleDrag);
    this.input.on(Phaser.Input.Events.DRAG_END, this.#handleDragEnd);
    this.input.on(Phaser.Input.Events.DROP, this.#dropEventListener);
  }

  #handleDragStart = (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image): void => {
    if (gameObject.texture.key === ASSET_KEYS.CARDS) {
      const pileIndex = gameObject.getData('pileIndex');
      const cardIndex = gameObject.getData('cardIndex');
      if (pileIndex !== undefined && cardIndex !== undefined && this.#tableauContainers[pileIndex]) {
        // Bring the tableau container to the front, so it appears above other elements
        this.#tableauContainers[pileIndex].setDepth(1);
        // Find all cards in the stack (cardIndex and above)
        this.#draggedStack = this.#tableauContainers[pileIndex].list.filter(
          (child: any) => child.getData('cardIndex') >= cardIndex,
        ) as Phaser.GameObjects.Image[];
        this.#draggedStack.forEach((card) => {
          card.setDepth(1);
          card.setAlpha(0.8);
        });
      } else {
        // Not part of tableauContainers, just apply to the card itself
        this.#draggedStack = [gameObject];
        gameObject.setDepth(1);
        gameObject.setAlpha(0.8);
      }
    }
  };

  #handleDrag = (
    pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.Image,
    dragX: number,
    dragY: number,
  ): void => {
    // Move all cards in the dragged stack, offset by their position in the stack
    this.#draggedStack.forEach((card, idx) => {
      card.x = dragX;
      card.y = dragY + idx * CARD_OFFSET; // 20px offset per card
    });
  };

  #handleDragEnd = (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image): void => {
    // Reset depth for all tableau containers
    this.#tableauContainers.forEach((container) => {
      container.setDepth(0);
    });

    this.#draggedStack.forEach((card) => {
      card.setDepth(0);
      card.setAlpha(1);
      card.setPosition(card.getData('x'), card.getData('y'));
    });
    this.#draggedStack = [];
  };

  #dropEventListener = (
    pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.Image,
    dropZone: Phaser.GameObjects.Zone,
  ): void => {
    if (dropZone.getData('zoneType') === ZONE_TYPE.FOUNDATION) {
      this.#handleMoveCardToFoundation(gameObject, dropZone);
    } else if (dropZone.getData('zoneType') === ZONE_TYPE.TABLEAU) {
      this.#handleMoveCardToTableau(gameObject, dropZone);
    }
  };

  #handleMoveCardToFoundation(gameObject: Phaser.GameObjects.Image, zone: Phaser.GameObjects.Zone): void {
    const pileIndex = gameObject.getData('pileIndex');
    const cardIndex = gameObject.getData('cardIndex');

    // Check if this is from a tableau pile
    if (pileIndex !== undefined && cardIndex !== undefined) {
      // Only allow moving the top card (last card in the stack)
      const tableauContainer = this.#tableauContainers[pileIndex];
      const topCardIndex = tableauContainer.list.length - 1;
      const topCard = tableauContainer.list[topCardIndex] as Phaser.GameObjects.Image;

      if (gameObject === topCard) {
        const success = this.#solitaire.moveTableauCardToFoundation(pileIndex);
        if (success) {
          // Remove card from tableau and update visual
          tableauContainer.remove(gameObject);
          gameObject.destroy();

          // Flip the next card if it exists and is face down
          if (tableauContainer.list.length > 0) {
            this.#solitaire.flipTopTableauCard(pileIndex);
            // TODO: Update visual representation of flipped card
          }
        }
      }
    } else {
      // Handle discard pile to foundation move
      const success = this.#solitaire.playDiscardPileCardToFoundation();
      if (success) {
        // TODO: Update discard pile visual representation
        console.log('Moved discard card to foundation');
      }
    }
  }

  #handleMoveCardToTableau(gameObject: Phaser.GameObjects.Image, zone: Phaser.GameObjects.Zone): void {
    const targetTableauIndex = zone.getData('tableauIndex');
    const sourcePileIndex = gameObject.getData('pileIndex');
    const cardIndex = gameObject.getData('cardIndex');

    if (targetTableauIndex === undefined) {
      console.warn('Target tableau index not found');
      return;
    }

    if (sourcePileIndex === targetTableauIndex) {
      return;
    }

    // Check if this is from a tableau pile
    if (sourcePileIndex !== undefined && cardIndex !== undefined) {
      // Moving from tableau to tableau
      const success = this.#solitaire.moveTableauCardToAnotherTableau(sourcePileIndex, cardIndex, targetTableauIndex);

      if (success) {
        const sourceContainer = this.#tableauContainers[sourcePileIndex];
        const targetContainer = this.#tableauContainers[targetTableauIndex];

        // Move all cards in the dragged stack
        this.#draggedStack.forEach((card, idx) => {
          sourceContainer.remove(card);

          // Calculate new position in target container
          const newY = targetContainer.list.length * CARD_OFFSET;
          card.setData('x', 0);
          card.setData('y', newY);
          card.setData('pileIndex', targetTableauIndex);
          card.setData('cardIndex', targetContainer.list.length);

          card.setPosition(0, newY);
          targetContainer.add(card);
        });

        // Flip the top card of source pile if it exists and is face down
        if (sourceContainer.list.length > 0) {
          this.#solitaire.flipTopTableauCard(sourcePileIndex);
          // TODO: Update visual representation of flipped card
        }
      }
    } else {
      // Moving from discard pile to tableau
      const success = this.#solitaire.playDiscardPileCardToTableau(targetTableauIndex);
      if (success) {
        // TODO: Update discard pile and tableau visual representations
        console.log('Moved discard card to tableau:', targetTableauIndex);
      }
    }
  }

  #createDropZones(): void {
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
