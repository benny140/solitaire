import { Card } from './card';
import { CardSuit, CARD_SUIT } from './common';

export class FoundationPile {
  #piles: Map<CardSuit, Card[]>;

  constructor() {
    this.#piles = new Map();
    // Initialize empty piles for each suit
    this.#piles.set(CARD_SUIT.HEARTS, []);
    this.#piles.set(CARD_SUIT.DIAMONDS, []);
    this.#piles.set(CARD_SUIT.CLUBS, []);
    this.#piles.set(CARD_SUIT.SPADES, []);
  }

  get piles(): Map<CardSuit, Card[]> {
    return this.#piles;
  }

  getPile(suit: CardSuit): Card[] {
    return this.#piles.get(suit) || [];
  }

  getTopCard(suit: CardSuit): Card | null {
    const pile = this.getPile(suit);
    return pile.length > 0 ? pile[pile.length - 1] : null;
  }

  canAddCard(card: Card): boolean {
    const pile = this.getPile(card.suit);

    // If pile is empty, only Ace (value 1) can be added
    if (pile.length === 0) {
      return card.value === 1;
    }

    // Card must be face up and next in sequence
    const topCard = this.getTopCard(card.suit);
    return card.isFaceUp && topCard !== null && card.value === topCard.value + 1;
  }

  addCard(card: Card): boolean {
    if (!this.canAddCard(card)) {
      return false;
    }

    const pile = this.getPile(card.suit);
    pile.push(card);
    return true;
  }

  isComplete(): boolean {
    // Foundation is complete when all piles have 13 cards (Ace to King)
    for (const pile of this.#piles.values()) {
      if (pile.length !== 13) {
        return false;
      }
    }
    return true;
  }

  reset(): void {
    // Clear all piles
    this.#piles.set(CARD_SUIT.HEARTS, []);
    this.#piles.set(CARD_SUIT.DIAMONDS, []);
    this.#piles.set(CARD_SUIT.CLUBS, []);
    this.#piles.set(CARD_SUIT.SPADES, []);
  }

  getCardCount(): number {
    let total = 0;
    for (const pile of this.#piles.values()) {
      total += pile.length;
    }
    return total;
  }
}
