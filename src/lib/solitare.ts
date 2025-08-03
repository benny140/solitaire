import { Deck } from './deck';
import { FoundationPile } from './foundation-pile';
import { TableauPile } from './tableau-pile';

export class Solitaire {
  #deck: Deck;
  #tableau: TableauPile;
  #foundation: FoundationPile;

  constructor() {
    this.#deck = new Deck();
    this.#tableau = new TableauPile(this.#deck.cards);
    this.#foundation = new FoundationPile();
  }

  wonGame(): boolean {
    return this.#foundation.isComplete();
  }

  newGame(): void {
    // Reset all piles and deck
    this.#deck.reset();
    this.#tableau.reset(this.#deck.cards);
    this.#foundation.reset();
  }

  drawCard(): boolean {
    const card = this.#deck.drawCard();
    if (!card) {
      return false; // No card to draw
    }
    return true;
  }

  shuffleDiscardPile(): boolean {
    return this.#deck.recycleDiscardPile();
  }

  playDiscardPileCardToFoundation(): boolean {
    const card = this.#deck.discardPile[0];
    if (!card) {
      return false; // No card to play
    }

    // check if card can be added to foundation pile
    if (!this.#foundation.canAddCard(card)) {
      return false; // Card cannot be added to foundation
    } else {
      this.#foundation.addCard(card);
      this.#deck.removeCardFromDiscard(card);
      return true;
    }
  }

  playDiscardPileCardToTableau(targetTableauPileIndex: number): boolean {
    const card = this.#deck.discardPile[0];
    if (!card) {
      return false; // No card to play
    }

    // check if card can be added to tableau pile
    if (!this.#tableau.canAddCard(card, targetTableauPileIndex)) {
      return false; // Card cannot be added to tableau
    } else {
      this.#tableau.addCard(card, targetTableauPileIndex);
      this.#deck.removeCardFromDiscard(card);
      return true;
    }
  }

  moveTableauCardToFoundation(sourceTableauPileIndex: number): boolean {
    const card = this.#tableau.getTopCard(sourceTableauPileIndex);
    if (!card) {
      return false; // No card to play
    }
    if (!this.#foundation.canAddCard(card)) {
      return false; // Card cannot be added to foundation
    } else {
      this.#tableau.removeCard(sourceTableauPileIndex);
      return this.#foundation.addCard(card);
    }
  }

  moveTableauCardToAnotherTableau(
    sourceTableauPileIndex: number,
    cardIndex: number,
    targetTableauPileIndex: number,
  ): boolean {
    return this.#tableau.moveCard(sourceTableauPileIndex, cardIndex, targetTableauPileIndex);
  }

  flipTopTableauCard(tableauPileIndex: number): boolean {
    return this.#tableau.flipTopCard(tableauPileIndex);
  }
}
