import { CardSuit, CardValue, CardSuitColour, CARD_SUIT_TO_COLOUR } from './common';

export class Card {
  #suit: CardSuit;
  #value: CardValue;
  #isFaceUp: boolean;

  constructor(suit: CardSuit, value: CardValue, isFaceUp: boolean = false) {
    this.#suit = suit;
    this.#value = value;
    this.#isFaceUp = isFaceUp;
  }

  get suit(): CardSuit {
    return this.#suit;
  }

  get value(): CardValue {
    return this.#value;
  }

  get isFaceUp(): boolean {
    return this.#isFaceUp;
  }

  get colour(): CardSuitColour {
    return CARD_SUIT_TO_COLOUR[this.suit];
  }

  flip(): void {
    this.#isFaceUp = !this.#isFaceUp;
  }
}
