import { Card } from './card';
import { CardSuit, CardValue, CARD_SUIT } from './common';
import { shuffleArray } from './utils';

export class Deck {
  #cards: Card[];
  #drawPile: Card[];
  #discardPile: Card[];

  static createStandardDeck(): Card[] {
    const cards: Card[] = [];
    const suits: CardSuit[] = [CARD_SUIT.HEARTS, CARD_SUIT.DIAMONDS, CARD_SUIT.CLUBS, CARD_SUIT.SPADES];
    for (const suit of suits) {
      for (let value = 1; value <= 13; value++) {
        cards.push(new Card(suit, value as CardValue));
      }
    }
    return cards;
  }

  constructor() {
    this.#cards = Deck.createStandardDeck();
    this.#drawPile = [...this.#cards]; // Copy all cards to draw pile
    this.#discardPile = []; // Start with empty discard pile
  }

  get cards(): Card[] {
    return this.#cards;
  }

  get drawPile(): Card[] {
    return this.#drawPile;
  }

  get discardPile(): Card[] {
    return this.#discardPile;
  }

  shuffle(): void {
    // Move all cards back to draw pile for shuffling
    this.#drawPile = [...this.#cards];
    this.#discardPile = [];

    // Shuffle the draw pile
    shuffleArray(this.#drawPile);
  }

  drawCard(): Card | null {
    if (this.#drawPile.length > 0) {
      const card = this.#drawPile.pop()!;
      card.flip(); // Flip the card face up when drawn
      this.#discardPile.push(card);
      return card;
    }
    return null; // No more cards to draw
  }

  recycleDiscardPile(): void {
    if (this.#discardPile.length === 0) {
      return; // Nothing to recycle
    }

    this.#drawPile.forEach((card) => card.flip()); // Flip all cards in draw pile face down

    // Shuffle the discard pile
    shuffleArray(this.#discardPile);

    // Add shuffled discard pile to draw pile
    this.#drawPile.push(...this.#discardPile);

    // Empty the discard pile
    this.#discardPile = [];
  }

  removeCardFromDiscard(targetCard: Card): Card | null {
    const cardIndex = this.#discardPile.findIndex(
      (card) => card.suit === targetCard.suit && card.value === targetCard.value,
    );

    if (cardIndex !== -1) {
      // Remove and return the card at the found index
      return this.#discardPile.splice(cardIndex, 1)[0];
    }

    return null; // Card not found in discard pile
  }

  reset(): void {
    // Move all cards back to draw pile
    this.#drawPile = [...this.#cards];
    this.#discardPile = [];
  }
}
