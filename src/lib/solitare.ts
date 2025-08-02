export class solitaire {
  newGame(): void {
    console.log('Starting a new game of Solitaire');
  }

  drawCard(): boolean {
    return true;
  }

  shuffleDiscardPile(): boolean {
    return true;
  }

  playDiscardPileCardToFoundation(): boolean {
    return true;
  }

  playDiscardPileCardToTableau(targetTableauPileIndex: number): boolean {
    return true;
  }

  moveTableauCardToFoundation(sourceTableauPileIndex: number): boolean {
    return true;
  }

  moveTableauCardToAnotherTableau(
    sourceTableauPileIndex: number,
    cardIndex: number,
    targetTableauPileIndex: number,
  ): boolean {
    return true;
  }

  flipTopTableauCard(tableauPileIndex: number): boolean {
    return true;
  }
}
