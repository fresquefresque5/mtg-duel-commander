// frontend/src/components/PlayerDeckZone.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CardBack from './CardBack.jsx';
import AnimatedCard from './AnimatedCard.jsx';
import useDeckInteractions from '../hooks/useDeckInteractions';
import { CARD_VARIANTS, DECK_PILE_CONFIG } from '../utils/animationConfigs';

export default function PlayerDeckZone({ playerIndex = 0, className = '', style = {} }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const {
    isAnimating,
    peekCard,
    library,
    shuffleDeck,
    drawCard,
    drawSevenCards,
    peekTopCard,
    hidePeekCard,
    getDeckStatistics,
    canShuffle,
    canDraw,
    canDrawSeven,
    canPeek
  } = useDeckInteractions(playerIndex);

  // Hide peek card when component unmounts
  useEffect(() => {
    return () => {
      hidePeekCard();
    };
  }, [hidePeekCard]);

  // Handle shuffle with animation
  const handleShuffle = () => {
    if (!canShuffle) return;

    setIsShuffling(true);
    shuffleDeck();

    setTimeout(() => {
      setIsShuffling(false);
    }, 1000);

    setMenuVisible(false);
  };

  // Handle draw card
  const handleDrawCard = () => {
    if (!canDraw) return;
    drawCard();
    setMenuVisible(false);
  };

  // Handle draw seven cards
  const handleDrawSevenCards = () => {
    if (!canDrawSeven) return;
    drawSevenCards();
    setMenuVisible(false);
  };

  // Handle peek
  const handlePeek = () => {
    if (!canPeek) return;
    peekTopCard();
    setMenuVisible(false);
  };

  // Get deck statistics
  const deckStats = getDeckStatistics();

  // Render stacked cards
  const renderStackedCards = () => {
    const visibleCards = Math.min(library.length, DECK_PILE_CONFIG.MAX_VISIBLE_CARDS);
    const cards = [];

    for (let i = visibleCards - 1; i >= 0; i--) {
      const isAnimatingCard = isShuffling && i === 0;

      cards.push(
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            top: i * DECK_PILE_CONFIG.CARD_OFFSET,
            left: i * DECK_PILE_CONFIG.CARD_OFFSET,
            transform: `rotate(${i % 2 === 0 ? -DECK_PILE_CONFIG.CARD_ROTATION : DECK_PILE_CONFIG.CARD_ROTATION}deg)`,
            zIndex: i,
            cursor: 'pointer'
          }}
          variants={{
            rest: CARD_VARIANTS.deckRest,
            hover: CARD_VARIANTS.deckHover,
            shuffle: isAnimatingCard ? CARD_VARIANTS.shuffleFan(i, visibleCards) : {},
            shuffleComplete: CARD_VARIANTS.shuffleRestack
          }}
          initial="rest"
          animate={isShuffling ? "shuffle" : "hover"}
          whileHover={!isAnimating ? "hover" : "rest"}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <CardBack size="large" draggable={false} />
        </motion.div>
      );
    }

    return cards;
  };

  return (
    <div className={`player-deck-zone ${className}`} style={{
      textAlign: 'center',
      position: 'relative',
      ...style
    }}>
      {/* Deck title */}
      <motion.div
        style={{
          fontSize: 14,
          opacity: 0.9,
          marginBottom: 12,
          color: '#ffd700',
          fontWeight: 'bold'
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 0.9, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        🂠 Tu Biblioteca
      </motion.div>

      {/* Deck pile */}
      <motion.div
        style={{
          position: 'relative',
          width: 120,
          height: 168,
          cursor: 'pointer',
          margin: '0 auto'
        }}
        onClick={() => setMenuVisible(!menuVisible)}
        whileHover={!isAnimating ? { scale: 1.02 } : {}}
        whileTap={!isAnimating ? { scale: 0.98 } : {}}
      >
        {library.length > 0 ? renderStackedCards() : (
          <motion.div
            style={{
              width: 120,
              height: 168,
              border: '2px dashed rgba(255,255,255,0.2)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: 12
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Mazo vacío
          </motion.div>
        )}

        {/* Card count */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: -25,
            right: 5,
            color: '#4fc3f7',
            fontSize: 16,
            fontWeight: 'bold',
            background: 'rgba(0,0,0,0.7)',
            padding: '2px 6px',
            borderRadius: 4
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {library.length}
        </motion.div>
      </motion.div>

      {/* Interaction menu */}
      <AnimatePresence>
        {menuVisible && (
          <motion.div
            style={{
              position: 'absolute',
              top: 190,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(20,20,20,0.98)',
              border: '2px solid #1f7a8c',
              borderRadius: 12,
              padding: 12,
              zIndex: 10,
              minWidth: 200,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
            variants={{
              appear: CARD_VARIANTS.menuAppear,
              disappear: CARD_VARIANTS.menuDisappear
            }}
            initial="disappear"
            animate="appear"
            exit="disappear"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={handleShuffle}
                disabled={!canShuffle}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: canShuffle ? '#1f7a8c' : '#333',
                  color: 'white',
                  border: 'none',
                  cursor: canShuffle ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 'bold',
                  opacity: canShuffle ? 1 : 0.5,
                  transition: 'all 0.2s'
                }}
                whileHover={canShuffle ? { scale: 1.05, background: '#2a8a9c' } : {}}
                whileTap={canShuffle ? { scale: 0.95 } : {}}
              >
                🔀 Barajar Mazo
              </button>

              <button
                onClick={handleDrawCard}
                disabled={!canDraw}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: canDraw ? '#2a9d8f' : '#333',
                  color: 'white',
                  border: 'none',
                  cursor: canDraw ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 'bold',
                  opacity: canDraw ? 1 : 0.5,
                  transition: 'all 0.2s'
                }}
                whileHover={canDraw ? { scale: 1.05, background: '#3aa39f' } : {}}
                whileTap={canDraw ? { scale: 0.95 } : {}}
              >
                🃏 Robar Carta
              </button>

              <button
                onClick={handleDrawSevenCards}
                disabled={!canDrawSeven}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: canDrawSeven ? '#e76f51' : '#333',
                  color: 'white',
                  border: 'none',
                  cursor: canDrawSeven ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 'bold',
                  opacity: canDrawSeven ? 1 : 0.5,
                  transition: 'all 0.2s'
                }}
                whileHover={canDrawSeven ? { scale: 1.05, background: '#f7a072' } : {}}
                whileTap={canDrawSeven ? { scale: 0.95 } : {}}
              >
                📋 Robar 7 Cartas
              </button>

              <button
                onClick={handlePeek}
                disabled={!canPeek}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: canPeek ? '#264653' : '#333',
                  color: 'white',
                  border: 'none',
                  cursor: canPeek ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 'bold',
                  opacity: canPeek ? 1 : 0.5,
                  transition: 'all 0.2s'
                }}
                whileHover={canPeek ? { scale: 1.05, background: '#2a9d8f' } : {}}
                whileTap={canPeek ? { scale: 0.95 } : {}}
              >
                👁️ Ver Carta Superior
              </button>

              <div style={{ height: 1, background: '#333', margin: '4px 0' }} />

              <button
                onClick={() => { setShowStats(!showStats); setMenuVisible(false); }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: '#f4a261',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
                whileHover={{ scale: 1.05, background: '#f7b267' }}
                whileTap={{ scale: 0.95 }}
              >
                📜 Ver Estadísticas
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Peek card display */}
      <AnimatePresence>
        {peekCard && (
          <motion.div
            style={{
              position: 'absolute',
              top: -200,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20,
              cursor: 'pointer'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={hidePeekCard}
          >
            <AnimatedCard card={peekCard} small />
            <motion.div
              style={{
                textAlign: 'center',
                color: '#4fc3f7',
                fontSize: 12,
                marginTop: 5
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Clic para cerrar
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics modal */}
      <AnimatePresence>
        {showStats && deckStats && (
          <motion.div
            style={{
              position: 'absolute',
              top: -250,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(20,20,20,0.98)',
              border: '2px solid #f4a261',
              borderRadius: 12,
              padding: 16,
              zIndex: 15,
              minWidth: 280,
              maxHeight: 200,
              overflowY: 'auto'
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: '#f4a261', fontSize: 16 }}>Estadísticas del Mazo</h3>
              <button
                onClick={() => setShowStats(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ccc',
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: 0,
                  width: 24,
                  height: 24
                }}
              >
                ×
              </button>
            </div>

            <div style={{ fontSize: 14, color: '#ccc', lineHeight: 1.6 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Total:</strong> {deckStats.total} cartas
              </div>

              <div style={{ marginBottom: 8 }}>
                <strong>Tipos:</strong><br/>
                <span style={{ fontSize: 12 }}>
                  Criaturas: {deckStats.creatures} | Tierras: {deckStats.lands}<br/>
                  Artefactos: {deckStats.artifacts} | Encantamientos: {deckStats.enchantments}<br/>
                  Instantáneos: {deckStats.instants} | Hechizos: {deckStats.sorceries}
                </span>
              </div>

              <div>
                <strong>Coste de Maná Promedio:</strong> {deckStats.manaCost.average}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
