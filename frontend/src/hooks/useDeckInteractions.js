// frontend/src/hooks/useDeckInteractions.js
import { useState, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { CARD_VARIANTS, ANIMATION_DURATION } from '../utils/animationConfigs';

export const useDeckInteractions = (playerIndex = 0) => {
  const { state, setState } = useGameStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [peekCard, setPeekCard] = useState(null);
  const animationTimeouts = useRef([]);

  // Clear animation timeouts on unmount
  const clearAllTimeouts = useCallback(() => {
    animationTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
    animationTimeouts.current = [];
  }, []);

  // Get current player
  const currentPlayer = state?.players?.[playerIndex];
  const library = currentPlayer?.library || [];
  const hand = currentPlayer?.hand || [];

  // Update game state helper
  const updateGameState = useCallback((updates) => {
    setState(prevState => {
      const newPlayers = [...prevState.players];
      newPlayers[playerIndex] = { ...newPlayers[playerIndex], ...updates };
      return { ...prevState, players: newPlayers };
    });
  }, [setState, playerIndex]);

  // Shuffle deck
  const shuffleDeck = useCallback(() => {
    if (isAnimating || library.length === 0) return false;

    setIsAnimating(true);

    // Create shuffled array
    const shuffledLibrary = [...library].sort(() => Math.random() - 0.5);

    updateGameState({ library: shuffledLibrary });

    // Animation duration
    const timeoutId = setTimeout(() => {
      setIsAnimating(false);
    }, ANIMATION_DURATION.SHUFFLE * 1000);

    animationTimeouts.current.push(timeoutId);
    return true;
  }, [isAnimating, library, updateGameState]);

  // Draw single card
  const drawCard = useCallback(() => {
    if (isAnimating || library.length === 0) return null;

    setIsAnimating(true);

    const drawnCard = library[library.length - 1]; // Top card
    const newLibrary = library.slice(0, -1);
    const newHand = [...hand, drawnCard];

    updateGameState({
      library: newLibrary,
      hand: newHand
    });

    // Animation duration
    const timeoutId = setTimeout(() => {
      setIsAnimating(false);
    }, ANIMATION_DURATION.SLOW * 1000);

    animationTimeouts.current.push(timeoutId);
    return drawnCard;
  }, [isAnimating, library, hand, updateGameState]);

  // Draw multiple cards
  const drawMultipleCards = useCallback((count) => {
    if (isAnimating || library.length === 0 || count <= 0) return [];

    setIsAnimating(true);
    const cardsToDraw = Math.min(count, library.length);
    const drawnCards = [];

    // Draw cards from top
    for (let i = 0; i < cardsToDraw; i++) {
      drawnCards.push(library[library.length - 1 - i]);
    }

    const newLibrary = library.slice(0, -cardsToDraw);
    const newHand = [...hand, ...drawnCards.reverse()]; // Add in draw order

    updateGameState({
      library: newLibrary,
      hand: newHand
    });

    // Animation duration (sequential)
    const totalAnimationTime = ANIMATION_DURATION.SLOW + (cardsToDraw - 1) * ANIMATION_DURATION.DRAW_SEQUENTIAL_DELAY;
    const timeoutId = setTimeout(() => {
      setIsAnimating(false);
    }, totalAnimationTime * 1000);

    animationTimeouts.current.push(timeoutId);
    return drawnCards;
  }, [isAnimating, library, hand, updateGameState]);

  // Draw seven cards
  const drawSevenCards = useCallback(() => {
    return drawMultipleCards(7);
  }, [drawMultipleCards]);

  // Peek at top card
  const peekTopCard = useCallback(() => {
    if (library.length === 0) return null;

    const topCard = library[library.length - 1];
    setPeekCard(topCard);

    // Auto-hide after 3 seconds
    const timeoutId = setTimeout(() => {
      setPeekCard(null);
    }, 3000);

    animationTimeouts.current.push(timeoutId);
    return topCard;
  }, [library]);

  // Hide peek card
  const hidePeekCard = useCallback(() => {
    setPeekCard(null);
  }, []);

  // Get deck statistics
  const getDeckStatistics = useCallback(() => {
    if (library.length === 0) return null;

    const stats = {
      total: library.length,
      types: {},
      colors: {},
      manaCost: { average: 0, distribution: {} },
      creatures: 0,
      lands: 0,
      artifacts: 0,
      enchantments: 0,
      instants: 0,
      sorceries: 0,
      planeswalkers: 0,
      other: 0
    };

    let totalManaCost = 0;
    let cardsWithCost = 0;

    library.forEach(card => {
      // Count types
      if (card.type) {
        if (card.type.includes('Creature')) stats.creatures++;
        else if (card.type.includes('Land')) stats.lands++;
        else if (card.type.includes('Artifact')) stats.artifacts++;
        else if (card.type.includes('Enchantment')) stats.enchantments++;
        else if (card.type.includes('Instant')) stats.instants++;
        else if (card.type.includes('Sorcery')) stats.sorceries++;
        else if (card.type.includes('Planeswalker')) stats.planeswalkers++;
        else stats.other++;
      }

      // Count colors
      if (card.colors && Array.isArray(card.colors)) {
        card.colors.forEach(color => {
          stats.colors[color] = (stats.colors[color] || 0) + 1;
        });
      }

      // Count mana cost
      if (card.manaCost) {
        // Extract numeric value from mana cost (simple parsing)
        const costMatch = card.manaCost.match(/\{(\d+)\}/);
        if (costMatch) {
          const cost = parseInt(costMatch[1]);
          totalManaCost += cost;
          cardsWithCost++;

          stats.manaCost.distribution[cost] = (stats.manaCost.distribution[cost] || 0) + 1;
        }
      }
    });

    stats.manaCost.average = cardsWithCost > 0 ? (totalManaCost / cardsWithCost).toFixed(1) : 0;

    return stats;
  }, [library]);

  // Check if actions are available
  const canShuffle = library.length > 0 && !isAnimating;
  const canDraw = library.length > 0 && !isAnimating;
  const canDrawSeven = library.length >= 7 && !isAnimating;
  const canPeek = library.length > 0 && !isAnimating;

  return {
    // State
    isAnimating,
    peekCard,
    library,
    hand,

    // Actions
    shuffleDeck,
    drawCard,
    drawMultipleCards,
    drawSevenCards,
    peekTopCard,
    hidePeekCard,

    // Utilities
    getDeckStatistics,

    // Availability checks
    canShuffle,
    canDraw,
    canDrawSeven,
    canPeek,

    // Cleanup
    clearAllTimeouts
  };
};

export default useDeckInteractions;