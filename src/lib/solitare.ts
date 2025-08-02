export class solitaire {
  public newGame(): void {
    console.log('Starting a new game of Solitaire');
  }

  public drawCard(): boolean {
    return true;
  }

  public shuffleDiscardPile(): boolean {
    return true;
  }

  public playDiscardPileCardToFoundation(): boolean {
    return true;
  }

  public playDiscardPileCardToTableau(targetTableauPileIndex: number): boolean {
    return true;
  }

  public moveTableauCardToFoundation(sourceTableauPileIndex: number): boolean {
    return true;
  }

  public moveTableauCardToAnotherTableau(
    sourceTableauPileIndex: number,
    cardIndex: number,
    targetTableauPileIndex: number,
  ): boolean {
    return true;
  }

  public flipTopTableauCard(tableauPileIndex: number): boolean {
    return true;
  }
}
