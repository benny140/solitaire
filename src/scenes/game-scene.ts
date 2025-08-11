import * as Phaser from 'phaser';
import { ASSET_KEYS, CARD_HEIGHT, CARD_WIDTH, SCENE_KEYS } from './common';
import { CardSuit, CardValue } from '../lib/common';
import { Solitaire } from '../lib/solitare';

const DEBUG = false;
const SCALE = 1.5;
const CARD_BACK_FRAME = 52;
const SUIT_FRAME = {
  HEARTS: 26,
  DIAMONDS: 13,
  CLUBS: 0,
  SPADES: 39,
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
  #drawZone!: Phaser.GameObjects.Zone;
  #solitaire: Solitaire;

  constructor() {
    super({ key: SCENE_KEYS.GAME });
    this.#solitaire = new Solitaire();
  }

  public create(): void {
    this.#createDrawPile();
    this.#createDiscardPile();
    this.#createFoundationPiles();
    this.#createTableauPiles();
    this.#createDragEvent();
    this.#createDropZones();
  }

  #createDrawPileCards(): void {
    // Destroy existing cards to prevent memory leaks and visual issues
    if (this.#drawPileCards) {
      this.#drawPileCards.forEach((card) => card.destroy());
    }

    const drawPile = this.#solitaire.returnDrawPile();
    // console.log(drawPile);
    const maxShift = 15;
    const shiftPerCard = drawPile.length > 1 ? maxShift / (drawPile.length - 1) : 0;

    this.#drawPileCards = drawPile.map((card, index) => {
      const x = DRAW_PILE_X_POSITION + shiftPerCard * index;
      return this.#createCard(x, DRAW_PILE_Y_POSITION, true);
    });

    // Ensure draw zone stays on top for clicking
    if (this.#drawZone) {
      this.#drawZone.setDepth(1000);
    }
  }

  #createDrawPile(): void {
    this.#drawCardLocationBox(DRAW_PILE_X_POSITION, DRAW_PILE_Y_POSITION);
    this.#createDrawPileCards();
    this.#drawZone = this.add
      .zone(0, 0, CARD_WIDTH * SCALE + 20, CARD_HEIGHT * SCALE + 12)
      .setOrigin(0, 0)
      .setInteractive()
      .setDepth(1000);

    this.#drawZone.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (this.#solitaire.drawCard()) {
        // Animate the top card from the draw pile to the discard pile
        this.#animateCardFromDrawToDiscard();
      } else if (this.#solitaire.shuffleDiscardPile()) {
        // Animate shuffling the discard pile back into the draw pile
        this.#animateShuffleDiscardToDrawPile();
      } else {
        return;
      }
    });

    if (DEBUG) {
      this.add
        .rectangle(this.#drawZone.x, this.#drawZone.y, this.#drawZone.width, this.#drawZone.height)
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
   * @param draggable Whether the card is draggable.
   * @param cardIndex The index of the card in its pile.
   * @param pileIndex The index of the pile the card belongs to.
   * @param suit The suit of the card (optional).
   * @param cardNumber The number of the card (1-13, optional).
   * @param isFaceUp Whether the card should show face up (optional, defaults to true).
   * @returns The created card image.
   */
  #createCard(
    x: number,
    y: number,
    draggable: boolean,
    cardIndex?: number,
    pileIndex?: number,
    suit?: CardSuit,
    cardNumber?: CardValue,
    isFaceUp: boolean = true,
  ): Phaser.GameObjects.Image {
    let frame = CARD_BACK_FRAME;

    // If suit and cardNumber are provided and card is face up, calculate the correct frame
    if (suit && cardNumber && isFaceUp) {
      frame = SUIT_FRAME[suit] + (cardNumber - 1);
    }

    const card = this.add.image(x, y, ASSET_KEYS.CARDS, frame);
    card.setOrigin(0, 0);
    card.setScale(SCALE);
    card.setInteractive({ draggable: draggable });
    card.setData({ x, y, cardIndex, pileIndex, suit, cardNumber, isFaceUp });
    return card;
  }

  #createDiscardPile(): void {
    this.#drawCardLocationBox(DISCARD_PILE_X_POSITION, DISCARD_PILE_Y_POSITION);
    this.#discardPileCards = this.#solitaire
      .returnDiscardPile()
      .map((card) =>
        this.#createCard(
          DISCARD_PILE_X_POSITION,
          DISCARD_PILE_Y_POSITION,
          true,
          undefined,
          undefined,
          card.suit,
          card.value,
          card.isFaceUp,
        ),
      );
  }

  #createFoundationPiles(): void {
    this.#foundationPileCards = [];
    FOUNDATION_PILE_X_POSITIONS.forEach((x) => {
      this.#drawCardLocationBox(x, FOUNDATION_PILE_Y_POSITION);
      const card = this.#createCard(x, FOUNDATION_PILE_Y_POSITION, false).setVisible(false);
      this.#foundationPileCards.push(card);
    });
  }

  /**
   * Animates a card moving from the draw pile to the discard pile
   */
  #animateCardFromDrawToDiscard(): void {
    if (this.#drawPileCards.length === 0) return;

    const topDrawCard = this.#drawPileCards[this.#drawPileCards.length - 1];
    const discardPile = this.#solitaire.returnDiscardPile();
    const topDiscardCard = discardPile[discardPile.length - 1];

    // Create a temporary card for animation
    const animatedCard = this.add.image(
      topDrawCard.x,
      topDrawCard.y,
      ASSET_KEYS.CARDS,
      topDiscardCard ? SUIT_FRAME[topDiscardCard.suit] + (topDiscardCard.value - 1) : CARD_BACK_FRAME,
    );
    animatedCard.setOrigin(0, 0);
    animatedCard.setScale(SCALE);
    animatedCard.setDepth(1000);

    // Hide the original top draw card
    topDrawCard.setVisible(false);

    // Play card place sound
    this.sound.play(ASSET_KEYS.CARD_PLACE_SOUND);

    // Animate the card movement
    this.tweens.add({
      targets: animatedCard,
      x: DISCARD_PILE_X_POSITION,
      y: DISCARD_PILE_Y_POSITION,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        // Clean up animated card
        animatedCard.destroy();

        // Update the piles after animation
        this.#createDiscardPile();
        this.#createDrawPileCards();
      },
    });
  }

  /**
   * Animates shuffling the discard pile back to the draw pile
   */
  #animateShuffleDiscardToDrawPile(): void {
    const discardCards = [...this.#discardPileCards];

    if (discardCards.length === 0) return;

    // Animate each discard card moving to draw pile position
    discardCards.forEach((card, index) => {
      this.tweens.add({
        targets: card,
        x: DRAW_PILE_X_POSITION,
        y: DRAW_PILE_Y_POSITION,
        duration: 200 + index * 50, // Stagger the animations
        ease: 'Power2',
        onComplete: () => {
          if (index === discardCards.length - 1) {
            // After the last card animation completes, update both piles
            this.#createDiscardPile();
            this.#createDrawPileCards();
          }
        },
      });
    });
  }

  /**
   * Generic method to animate a card to a specific position
   */
  #animateCardToPosition(
    card: Phaser.GameObjects.Image,
    targetX: number,
    targetY: number,
    onComplete?: () => void,
  ): void {
    this.tweens.add({
      targets: card,
      x: targetX,
      y: targetY,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        if (onComplete) {
          onComplete();
        }
      },
    });
  }

  #createTableauPiles(): void {
    this.#tableauContainers = [];
    for (let i = 0; i < 7; i++) {
      const x = TABLEAU_PILE_X_POSITION + i * 85;
      const tableauContainer = this.add.container(x, TABLEAU_PILE_Y_POSITION, []);
      this.#tableauContainers.push(tableauContainer);

      try {
        const tableauPile = this.#solitaire.returnTableauPile(i);
        if (!tableauPile) continue;

        for (let j = 0; j <= i; j++) {
          try {
            const card = tableauPile[j];
            if (!card) continue;

            const cardObject = this.#createCard(0, j * CARD_OFFSET, true, j, i, card.suit, card.value, card.isFaceUp);
            tableauContainer.add(cardObject);
          } catch (error) {
            console.warn(`Failed to create card at tableau ${i}, position ${j}:`, error);
            continue;
          }
        }
      } catch (error) {
        console.warn(`Failed to get tableau pile ${i}:`, error);
        continue;
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
          // Animate card moving to foundation position
          const foundationX = FOUNDATION_PILE_X_POSITIONS[0]; // You might need to determine the correct foundation pile
          this.#animateCardToPosition(gameObject, foundationX, FOUNDATION_PILE_Y_POSITION, () => {
            // Remove card from tableau and update visual
            tableauContainer.remove(gameObject);
            gameObject.destroy();

            // Flip the next card if it exists and is face down
            if (tableauContainer.list.length > 0) {
              this.#solitaire.flipTopTableauCard(pileIndex);
              // TODO: Update visual representation of flipped card
            }
          });
        }
      }
    } else {
      // Handle discard pile to foundation move
      const success = this.#solitaire.playDiscardPileCardToFoundation();
      if (success) {
        // Animate discard card to foundation
        if (this.#discardPileCards.length > 0) {
          const topDiscardCard = this.#discardPileCards[this.#discardPileCards.length - 1];
          const foundationX = FOUNDATION_PILE_X_POSITIONS[0]; // You might need to determine the correct foundation pile
          this.#animateCardToPosition(topDiscardCard, foundationX, FOUNDATION_PILE_Y_POSITION, () => {
            this.#createDiscardPile(); // Refresh discard pile
            console.log('Moved discard card to foundation');
          });
        }
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

        // Animate all cards in the dragged stack to their new positions
        this.#draggedStack.forEach((card, idx) => {
          sourceContainer.remove(card);

          // Calculate new position in target container
          const newY = targetContainer.list.length * CARD_OFFSET;
          const targetX = TABLEAU_PILE_X_POSITION + targetTableauIndex * 85;
          const targetCardY = TABLEAU_PILE_Y_POSITION + newY;

          // Animate the card to its new position
          this.tweens.add({
            targets: card,
            x: targetX,
            y: targetCardY,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
              // Update card data and position
              card.setData('x', 0);
              card.setData('y', newY);
              card.setData('pileIndex', targetTableauIndex);
              card.setData('cardIndex', targetContainer.list.length);

              // Set final position relative to container
              card.setPosition(0, newY);
              targetContainer.add(card);

              // Only flip the top card after the last animation completes
              if (idx === this.#draggedStack.length - 1) {
                // Flip the top card of source pile if it exists and is face down
                if (sourceContainer.list.length > 0) {
                  this.#solitaire.flipTopTableauCard(sourcePileIndex);
                  // TODO: Update visual representation of flipped card
                }
              }
            },
          });
        });
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
