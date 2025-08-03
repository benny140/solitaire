import { Card } from './card';

export class TableauPile {
  #piles: Card[][];

  constructor(cards: Card[]) {
    // Initialize 7 tableau piles (standard solitaire)
    this.#piles = Array.from({ length: 7 }, () => []);
    this.setupInitialLayout(cards);
  }

  get piles(): Card[][] {
    return this.#piles;
  }

  getPile(pileIndex: number): Card[] {
    if (pileIndex < 0 || pileIndex >= this.#piles.length) {
      return [];
    }
    return this.#piles[pileIndex];
  }

  getTopCard(pileIndex: number): Card | null {
    const pile = this.getPile(pileIndex);
    return pile.length > 0 ? pile[pile.length - 1] : null;
  }

  getBottomCard(pileIndex: number): Card | null {
    const pile = this.getPile(pileIndex);
    return pile.length > 0 ? pile[0] : null;
  }

  canAddCard(card: Card, pileIndex: number): boolean {
    const topCard = this.getTopCard(pileIndex);

    // If pile is empty, only King (value 13) can be added
    if (!topCard) {
      return card.value === 13;
    }

    // Card must be face up, opposite color, and one value lower
    return card.isFaceUp && card.colour !== topCard.colour && card.value === topCard.value - 1;
  }

  addCard(card: Card, pileIndex: number): boolean {
    if (!this.canAddCard(card, pileIndex)) {
      return false;
    }

    const pile = this.getPile(pileIndex);
    pile.push(card);
    return true;
  }

  addCards(cards: Card[], pileIndex: number): boolean {
    if (cards.length === 0) {
      return false;
    }

    // Check if the first card can be added
    if (!this.canAddCard(cards[0], pileIndex)) {
      return false;
    }

    const pile = this.getPile(pileIndex);
    pile.push(...cards);
    return true;
  }

  removeCard(pileIndex: number): Card | null {
    const pile = this.getPile(pileIndex);
    return pile.length > 0 ? pile.pop() || null : null;
  }

  removeCards(pileIndex: number, cardIndex: number): Card[] {
    const pile = this.getPile(pileIndex);
    if (cardIndex < 0 || cardIndex >= pile.length) {
      return [];
    }

    // Remove cards from cardIndex to the end of the pile
    return pile.splice(cardIndex);
  }

  flipTopCard(pileIndex: number): boolean {
    const topCard = this.getTopCard(pileIndex);
    if (topCard && !topCard.isFaceUp) {
      topCard.flip();
      return true;
    }
    return false;
  }

  moveCard(sourceTableauPileIndex: number, cardIndex: number, targetTableauPileIndex: number): boolean {
    // Validate pile indices
    if (
      sourceTableauPileIndex < 0 ||
      sourceTableauPileIndex >= this.#piles.length ||
      targetTableauPileIndex < 0 ||
      targetTableauPileIndex >= this.#piles.length
    ) {
      return false;
    }

    // Cannot move to the same pile
    if (sourceTableauPileIndex === targetTableauPileIndex) {
      return false;
    }

    const sourcePile = this.getPile(sourceTableauPileIndex);

    // Validate card index
    if (cardIndex < 0 || cardIndex >= sourcePile.length) {
      return false;
    }

    // Get the cards to move (from cardIndex to end of pile)
    const cardsToMove = sourcePile.slice(cardIndex);

    // Check if the first card can be legally added to target pile
    if (!cardsToMove.length || !this.canAddCard(cardsToMove[0], targetTableauPileIndex)) {
      return false;
    }

    // Verify all cards in the sequence are face up and in valid descending order
    for (let i = 0; i < cardsToMove.length; i++) {
      const card = cardsToMove[i];

      // All cards must be face up
      if (!card.isFaceUp) {
        return false;
      }

      // Check sequence validity (each card should be one less than the previous)
      if (i > 0) {
        const prevCard = cardsToMove[i - 1];
        if (card.value !== prevCard.value - 1 || card.colour === prevCard.colour) {
          return false;
        }
      }
    }

    // Perform the move
    const removedCards = this.removeCards(sourceTableauPileIndex, cardIndex);
    const success = this.addCards(removedCards, targetTableauPileIndex);

    // If move failed, put cards back
    if (!success) {
      sourcePile.push(...removedCards);
      return false;
    }

    return true;
  }

  isEmpty(pileIndex: number): boolean {
    return this.getPile(pileIndex).length === 0;
  }

  getCardCount(pileIndex: number): number {
    return this.getPile(pileIndex).length;
  }

  getTotalCardCount(): number {
    return this.#piles.reduce((total, pile) => total + pile.length, 0);
  }

  reset(cards: Card[]): void {
    // Clear all piles
    this.#piles = Array.from({ length: 7 }, () => []);
    this.setupInitialLayout(cards);
  }

  setupInitialLayout(cards: Card[]): void {
    // Standard solitaire setup: 1 card in first pile, 2 in second, etc.
    let cardIndex = 0;

    for (let pileIndex = 0; pileIndex < 7; pileIndex++) {
      for (let cardCount = 0; cardCount <= pileIndex; cardCount++) {
        if (cardIndex < cards.length) {
          const card = cards[cardIndex];

          // Only flip the top card of each pile face up
          if (cardCount === pileIndex) {
            card.flip();
          }

          this.#piles[pileIndex].push(card);
          cardIndex++;
        }
      }
    }
  }
}
