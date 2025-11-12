// frontend/src/utils/animationConfigs.js
import { easeInOut, cubicBezier } from 'framer-motion';

// Core animation timing configurations
export const ANIMATION_DURATION = {
  FAST: 0.2,
  NORMAL: 0.4,
  SLOW: 0.6,
  SHUFFLE: 1.0,
  DRAW_SEQUENTIAL_DELAY: 0.2,
  DRAW_SEQUENCE_DELAY: 0.15,
  MENU_TRANSITION: 0.3
};

// Easing functions for smooth animations
export const ANIMATION_EASING = {
  DEFAULT: [0.4, 0, 0.2, 1], // cubic-bezier(0.4, 0, 0.2, 1)
  SMOOTH_IN_OUT: cubicBezier(0.25, 0.46, 0.45, 0.94),
  BOUNCE: cubicBezier(0.68, -0.55, 0.265, 1.55),
  GENTLE: cubicBezier(0.25, 0.1, 0.25, 1)
};

// Card animation variants
export const CARD_VARIANTS = {
  // Deck pile animations
  deckHover: {
    scale: 1.02,
    y: -5,
    filter: 'brightness(1.1) drop-shadow(0 10px 20px rgba(0,0,0,0.3))',
    transition: {
      duration: ANIMATION_DURATION.FAST,
      ease: ANIMATION_EASING.DEFAULT
    }
  },
  deckRest: {
    scale: 1,
    y: 0,
    filter: 'brightness(1) drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
    transition: {
      duration: ANIMATION_DURATION.FAST,
      ease: ANIMATION_EASING.DEFAULT
    }
  },

  // Card draw animations
  drawFromDeck: (targetPosition = { x: 0, y: 0 }) => ({
    x: targetPosition.x,
    y: targetPosition.y,
    rotate: Math.random() * 10 - 5, // Small random rotation
    scale: 1,
    opacity: 1,
    transition: {
      duration: ANIMATION_DURATION.SLOW,
      ease: ANIMATION_EASING.SMOOTH_IN_OUT
    }
  }),

  // Shuffle animation
  shuffleFan: (index = 0, total = 5) => ({
    x: (index - total / 2) * 15,
    y: -Math.abs(index - total / 2) * 8,
    rotate: (index - total / 2) * 8,
    scale: 0.9,
    opacity: 0.8,
    transition: {
      duration: ANIMATION_DURATION.SHUFFLE,
      ease: ANIMATION_EASING.BOUNCE,
      delay: index * 0.05
    }
  }),

  shuffleRestack: {
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    opacity: 1,
    transition: {
      duration: ANIMATION_DURATION.SHUFFLE,
      ease: ANIMATION_EASING.SMOOTH_IN_OUT
    }
  },

  // Peek animation
  peekUp: {
    y: -50,
    rotate: 5,
    scale: 1.1,
    transition: {
      duration: ANIMATION_DURATION.NORMAL,
      ease: ANIMATION_EASING.GENTLE
    }
  },

  peekDown: {
    y: 0,
    rotate: 0,
    scale: 1,
    transition: {
      duration: ANIMATION_DURATION.NORMAL,
      ease: ANIMATION_EASING.GENTLE
    }
  },

  // Menu animations
  menuAppear: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.MENU_TRANSITION,
      ease: ANIMATION_EASING.BOUNCE
    }
  },

  menuDisappear: {
    opacity: 0,
    scale: 0.9,
    y: -10,
    transition: {
      duration: ANIMATION_DURATION.MENU_TRANSITION,
      ease: ANIMATION_EASING.DEFAULT
    }
  }
};

// Deck pile configuration
export const DECK_PILE_CONFIG = {
  MAX_VISIBLE_CARDS: 5,
  CARD_OFFSET: 2, // pixels between stacked cards
  CARD_ROTATION: 2, // degrees for alternating rotation
  HOVER_LIFT: 5, // pixels to lift on hover
  GLOW_COLOR: 'rgba(79, 195, 247, 0.3)', // #4fc3f7 with transparency
  BASE_SHADOW: '0 4px 8px rgba(0,0,0,0.3)',
  HOVER_SHADOW: '0 10px 20px rgba(0,0,0,0.4)'
};

// Sequential animation generator
export const createSequentialAnimations = (count, baseVariant, delay = ANIMATION_DURATION.DRAW_SEQUENTIAL_DELAY) => {
  return Array.from({ length: count }).map((_, index) => ({
    ...baseVariant,
    transition: {
      ...baseVariant.transition,
      delay: index * delay
    }
  }));
};

// Stagger animation helper
export const createStaggeredAnimation = (children, staggerDelay = 0.05) => {
  return children.map((child, index) => ({
    ...child,
    transition: {
      ...child.transition,
      delay: index * staggerDelay
    }
  }));
};

// Responsive animation configurations
export const getResponsiveConfig = (screenSize) => {
  const baseConfig = {
    mobile: {
      cardScale: 0.8,
      staggerDelay: 0.03,
      menuPadding: 8
    },
    tablet: {
      cardScale: 0.9,
      staggerDelay: 0.04,
      menuPadding: 10
    },
    desktop: {
      cardScale: 1,
      staggerDelay: 0.05,
      menuPadding: 12
    }
  };

  return baseConfig[screenSize] || baseConfig.desktop;
};

export default {
  ANIMATION_DURATION,
  ANIMATION_EASING,
  CARD_VARIANTS,
  DECK_PILE_CONFIG,
  createSequentialAnimations,
  createStaggeredAnimation,
  getResponsiveConfig
};