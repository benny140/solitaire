export type CardSuit = 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type CardSuitColour = 'RED' | 'BLACK';

export const CARD_SUIT = {
  HEARTS: 'HEARTS',
  DIAMONDS: 'DIAMONDS',
  CLUBS: 'CLUBS',
  SPADES: 'SPADES',
} as const;
export const CARD_SUIT_COLOUR = {
  RED: 'RED',
  BLACK: 'BLACK',
} as const;
export const CARD_SUIT_TO_COLOUR = {
  [CARD_SUIT.HEARTS]: CARD_SUIT_COLOUR.RED,
  [CARD_SUIT.DIAMONDS]: CARD_SUIT_COLOUR.RED,
  [CARD_SUIT.CLUBS]: CARD_SUIT_COLOUR.BLACK,
  [CARD_SUIT.SPADES]: CARD_SUIT_COLOUR.BLACK,
} as const;
