'use strict';

// shuffleBag — draws items in shuffled order without immediate repeats.
// Once the deck runs out it reshuffles, but the first item of the new deck
// is never the same as the last drawn, so it always feels random.

function shuffleBag(items) {
  let deck = [];
  let lastDrawn = null;

  function refill() {
    deck = [...items].sort(() => Math.random() - 0.5);

    if (deck.length > 1 && deck[0] === lastDrawn) {
      const swapIndex = Math.floor(Math.random() * (deck.length - 1)) + 1;
      [deck[0], deck[swapIndex]] = [deck[swapIndex], deck[0]];
    }
  }

  return {
    next() {
      if (!deck.length) refill();
      lastDrawn = deck.pop();
      return lastDrawn;
    },
  };
}
