// frontend/src/components/DeckView.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Card from './Card';
import AnimatedCard from './AnimatedCard';
import useDeckInteractions from '../hooks/useDeckInteractions';

export default function DeckView({ player, playerIndex = 0, limit = null }) {
  const [viewMode, setViewMode] = useState('pile'); // 'pile' or 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  const {
    library,
    getDeckStatistics
  } = useDeckInteractions(playerIndex);

  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);

  useEffect(() => {
    if (!player || !player.library) {
      setCards([]);
      return;
    }

    // Get cards from library, reverse to show top-of-deck first
    const lib = [...player.library].slice().reverse();
    const cardsToShow = limit ? lib.slice(0, limit) : lib;
    setCards(cardsToShow);
  }, [player, limit]);

  // Filter cards based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCards(cards);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = cards.filter(card =>
      card.name?.toLowerCase().includes(term) ||
      card.type?.toLowerCase().includes(term) ||
      (card.text && card.text.toLowerCase().includes(term))
    );

    setFilteredCards(filtered);
  }, [cards, searchTerm]);

  if (!player) return null;

  const deckStats = getDeckStatistics();
  const hasLibrary = player.library && player.library.length > 0;

  return (
    <div style={{
      marginTop: 10,
      background: 'rgba(0,0,0,0.3)',
      borderRadius: 12,
      padding: 16,
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      {/* Header with controls */}
      <motion.div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#ffd700'
          }}>
            🂠 Mazo: {library.length} cartas
          </div>

          {hasLibrary && (
            <div style={{
              display: 'flex',
              gap: 8
            }}>
              <motion.button
                onClick={() => setViewMode('pile')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: viewMode === 'pile' ? '#1f7a8c' : '#333',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Pila de Mazo
              </motion.button>

              <motion.button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: viewMode === 'grid' ? '#1f7a8c' : '#333',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Vista en Cuadrícula
              </motion.button>
            </div>
          )}
        </div>

        {hasLibrary && (
          <motion.button
            onClick={() => setShowFullPreview(!showFullPreview)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: '#f4a261',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12
            }}
            whileHover={{ scale: 1.05, background: '#f7b267' }}
            whileTap={{ scale: 0.95 }}
          >
            📊 Estadísticas
          </motion.button>
        )}
      </motion.div>

      {/* Search bar */}
      {hasLibrary && viewMode === 'grid' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar cartas por nombre, tipo o texto..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              background: '#1a1a1a',
              color: 'white',
              border: '1px solid #333',
              fontSize: 14,
              marginBottom: 12
            }}
          />
        </motion.div>
      )}

      {/* Deck content */}
      <AnimatePresence mode="wait">
        {!hasLibrary ? (
          <motion.div
            key="empty"
            style={{
              padding: 40,
              textAlign: 'center',
              color: '#666',
              fontStyle: 'italic'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <div>No hay cartas en el mazo</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>
              Importa un mazo para comenzar
            </div>
          </motion.div>
        ) : viewMode === 'pile' ? (
          <motion.div
            key="pile"
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '20px 0'
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            {/* Stacked pile visualization */}
            <div style={{
              position: 'relative',
              width: 120,
              height: 168
            }}>
              {Array.from({ length: Math.min(library.length, 8) }).map((_, i) => (
                <motion.div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: i * 2,
                    left: i * 2,
                    transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)`,
                    zIndex: i
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div style={{
                    width: 120,
                    height: 168,
                    background: 'linear-gradient(135deg, #2a1810 0%, #0f0704 100%)',
                    border: '2px solid rgba(255,215,0,0.3)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.2)',
                    fontSize: 24,
                    fontWeight: 'bold'
                  }}>
                    MTG
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: 12,
              maxHeight: 400,
              overflowY: 'auto',
              padding: 8
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {filteredCards.length > 0 ? (
              filteredCards.map((card, index) => (
                <motion.div
                  key={`${card.id}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ scale: 1.05, zIndex: 10 }}
                  onHoverStart={() => setHoveredCard(card)}
                  onHoverEnd={() => setHoveredCard(null)}
                  style={{
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <Card card={card} small />
                  <div style={{
                    position: 'absolute',
                    bottom: -20,
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontSize: 10,
                    color: '#ccc',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {card.name}
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: 20,
                  color: '#666'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                No se encontraron cartas que coincidan con "{searchTerm}"
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card preview on hover */}
      <AnimatePresence>
        {hoveredCard && (
          <motion.div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              pointerEvents: 'none'
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <AnimatedCard card={hoveredCard} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics modal */}
      <AnimatePresence>
        {showFullPreview && deckStats && (
          <motion.div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(20,20,20,0.98)',
              border: '2px solid #f4a261',
              borderRadius: 12,
              padding: 24,
              zIndex: 100,
              minWidth: 400,
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowFullPreview(false);
              }
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <h2 style={{
                margin: 0,
                color: '#f4a261',
                fontSize: 20
              }}>
                📊 Estadísticas Completas del Mazo
              </h2>
              <button
                onClick={() => setShowFullPreview(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ccc',
                  fontSize: 24,
                  cursor: 'pointer',
                  padding: 0,
                  width: 30,
                  height: 30
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 20
            }}>
              {/* Basic stats */}
              <div>
                <h3 style={{
                  color: '#ffd700',
                  marginBottom: 12,
                  fontSize: 16
                }}>
                  Información General
                </h3>
                <div style={{ color: '#ccc', lineHeight: 1.8 }}>
                  <div><strong>Total:</strong> {deckStats.total} cartas</div>
                  <div><strong>CMC Promedio:</strong> {deckStats.manaCost.average}</div>
                </div>
              </div>

              {/* Type distribution */}
              <div>
                <h3 style={{
                  color: '#ffd700',
                  marginBottom: 12,
                  fontSize: 16
                }}>
                  Distribución por Tipo
                </h3>
                <div style={{ color: '#ccc', lineHeight: 1.8, fontSize: 14 }}>
                  {deckStats.creatures > 0 && (
                    <div>Criaturas: {deckStats.creatures}</div>
                  )}
                  {deckStats.lands > 0 && (
                    <div>Tierras: {deckStats.lands}</div>
                  )}
                  {deckStats.artifacts > 0 && (
                    <div>Artefactos: {deckStats.artifacts}</div>
                  )}
                  {deckStats.enchantments > 0 && (
                    <div>Encantamientos: {deckStats.enchantments}</div>
                  )}
                  {deckStats.instants > 0 && (
                    <div>Instantáneos: {deckStats.instants}</div>
                  )}
                  {deckStats.sorceries > 0 && (
                    <div>Hechizos: {deckStats.sorceries}</div>
                  )}
                </div>
              </div>

              {/* Color distribution */}
              {Object.keys(deckStats.colors).length > 0 && (
                <div>
                  <h3 style={{
                    color: '#ffd700',
                    marginBottom: 12,
                    fontSize: 16
                  }}>
                    Distribución por Color
                  </h3>
                  <div style={{ color: '#ccc', lineHeight: 1.8, fontSize: 14 }}>
                    {Object.entries(deckStats.colors).map(([color, count]) => (
                      <div key={color}>
                        {color === 'W' && 'Blanco'}
                        {color === 'U' && 'Azul'}
                        {color === 'B' && 'Negro'}
                        {color === 'R' && 'Rojo'}
                        {color === 'G' && 'Verde'}
                        : {count} cartas
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
