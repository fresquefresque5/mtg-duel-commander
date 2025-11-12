// frontend/src/components/DeckStatistics.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeckStatistics({ stats, isVisible, onClose, title = "Estadísticas del Mazo" }) {
  if (!stats || !isVisible) return null;

  const getManaCurveBars = () => {
    const distribution = stats.manaCost.distribution || {};
    const maxCount = Math.max(...Object.values(distribution), 1);

    return Object.entries(distribution)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([cmc, count]) => ({
        cmc,
        count,
        percentage: (count / stats.total * 100).toFixed(1)
      }));
  };

  const getColorDistribution = () => {
    const colors = stats.colors || {};
    return Object.entries(colors).map(([color, count]) => ({
      color,
      count,
      percentage: (count / stats.total * 100).toFixed(1),
      name: {
        'W': 'Blanco',
        'U': 'Azul',
        'B': 'Negro',
        'R': 'Rojo',
        'G': 'Verde',
        'C': 'Incoloro'
      }[color] || color
    }));
  };

  const manaCurve = getManaCurveBars();
  const colorDistribution = getColorDistribution();

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              zIndex: 999,
              backdropFilter: 'blur(4px)'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(20,20,20,0.98)',
              border: '2px solid var(--mtg-gold, #ffd700)',
              borderRadius: 16,
              padding: 24,
              zIndex: 1000,
              minWidth: 500,
              maxWidth: '90vw',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h2 style={{
                margin: 0,
                color: 'var(--mtg-gold, #ffd700)',
                fontSize: 22,
                fontWeight: 'bold'
              }}>
                📊 {title}
              </h2>

              <motion.button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ccc',
                  fontSize: 28,
                  cursor: 'pointer',
                  padding: 0,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                whileHover={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  rotate: 90
                }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
            </div>

            {/* Overview Section */}
            <motion.div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 16,
                marginBottom: 24
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div style={{
                background: 'rgba(255,215,0,0.1)',
                padding: 16,
                borderRadius: 12,
                textAlign: 'center',
                border: '1px solid rgba(255,215,0,0.3)'
              }}>
                <div style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: 'var(--mtg-gold, #ffd700)',
                  marginBottom: 4
                }}>
                  {stats.total}
                </div>
                <div style={{
                  fontSize: 12,
                  color: '#ccc',
                  textTransform: 'uppercase'
                }}>
                  Cartas Totales
                </div>
              </div>

              <div style={{
                background: 'rgba(79,195,247,0.1)',
                padding: 16,
                borderRadius: 12,
                textAlign: 'center',
                border: '1px solid rgba(79,195,247,0.3)'
              }}>
                <div style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: 'var(--mtg-blue, #4fc3f7)',
                  marginBottom: 4
                }}>
                  {stats.manaCost.average}
                </div>
                <div style={{
                  fontSize: 12,
                  color: '#ccc',
                  textTransform: 'uppercase'
                }}>
                  CMC Promedio
                </div>
              </div>

              <div style={{
                background: 'rgba(42,157,143,0.1)',
                padding: 16,
                borderRadius: 12,
                textAlign: 'center',
                border: '1px solid rgba(42,157,143,0.3)'
              }}>
                <div style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: 'var(--mtg-green, #2a9d8f)',
                  marginBottom: 4
                }}>
                  {stats.lands || 0}
                </div>
                <div style={{
                  fontSize: 12,
                  color: '#ccc',
                  textTransform: 'uppercase'
                }}>
                  Tierras
                </div>
              </div>

              <div style={{
                background: 'rgba(231,111,81,0.1)',
                padding: 16,
                borderRadius: 12,
                textAlign: 'center',
                border: '1px solid rgba(231,111,81,0.3)'
              }}>
                <div style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: 'var(--mtg-orange, #e76f51)',
                  marginBottom: 4
                }}>
                  {stats.creatures || 0}
                </div>
                <div style={{
                  fontSize: 12,
                  color: '#ccc',
                  textTransform: 'uppercase'
                }}>
                  Criaturas
                </div>
              </div>
            </motion.div>

            {/* Type Distribution */}
            <motion.div
              style={{ marginBottom: 24 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 style={{
                color: 'var(--mtg-gold, #ffd700)',
                marginBottom: 16,
                fontSize: 18,
                fontWeight: 'bold'
              }}>
                Distribución por Tipo
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12
              }}>
                {stats.creatures > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 6
                  }}>
                    <span>Criaturas</span>
                    <strong>{stats.creatures}</strong>
                  </div>
                )}

                {stats.lands > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 6
                  }}>
                    <span>Tierras</span>
                    <strong>{stats.lands}</strong>
                  </div>
                )}

                {stats.artifacts > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 6
                  }}>
                    <span>Artefactos</span>
                    <strong>{stats.artifacts}</strong>
                  </div>
                )}

                {stats.enchantments > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 6
                  }}>
                    <span>Encantamientos</span>
                    <strong>{stats.enchantments}</strong>
                  </div>
                )}

                {stats.instants > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 6
                  }}>
                    <span>Instantáneos</span>
                    <strong>{stats.instants}</strong>
                  </div>
                )}

                {stats.sorceries > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 6
                  }}>
                    <span>Hechizos</span>
                    <strong>{stats.sorceries}</strong>
                  </div>
                )}

                {stats.planeswalkers > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 6
                  }}>
                    <span>Planeswalkers</span>
                    <strong>{stats.planeswalkers}</strong>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Color Distribution */}
            {colorDistribution.length > 0 && (
              <motion.div
                style={{ marginBottom: 24 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 style={{
                  color: 'var(--mtg-gold, #ffd700)',
                  marginBottom: 16,
                  fontSize: 18,
                  fontWeight: 'bold'
                }}>
                  Distribución por Color
                </h3>

                <div style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap'
                }}>
                  {colorDistribution.map(({ color, count, percentage, name }) => (
                    <div
                      key={color}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: 12,
                        borderRadius: 8,
                        flex: 1,
                        minWidth: 120,
                        textAlign: 'center',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <div style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        marginBottom: 4,
                        color: {
                          'W': '#f5f5dc',
                          'U': '#4a90e2',
                          'B': '#2c2c2c',
                          'R': '#d32f2f',
                          'G': '#388e3c',
                          'C': '#9e9e9e'
                        }[color] || '#ccc'
                      }}>
                        {color}
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: '#ccc',
                        marginBottom: 2
                      }}>
                        {name}
                      </div>
                      <div style={{
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: 'white'
                      }}>
                        {count}
                      </div>
                      <div style={{
                        fontSize: 10,
                        color: 'var(--mtg-blue, #4fc3f7)'
                      }}>
                        {percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Mana Curve */}
            {manaCurve.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 style={{
                  color: 'var(--mtg-gold, #ffd700)',
                  marginBottom: 16,
                  fontSize: 18,
                  fontWeight: 'bold'
                }}>
                  Curva de Maná
                </h3>

                <div style={{
                  display: 'flex',
                  alignItems: 'end',
                  gap: 8,
                  height: 120,
                  padding: '0 8px'
                }}>
                  {manaCurve.map(({ cmc, count, percentage }) => (
                    <motion.div
                      key={cmc}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ delay: 0.5 + parseInt(cmc) * 0.1 }}
                    >
                      <div style={{
                        background: 'linear-gradient(to top, var(--mtg-blue, #4fc3f7), var(--mtg-teal, #1f7a8c))',
                        width: '100%',
                        height: `${(count / Math.max(...manaCurve.map(c => c.count))) * 100}%`,
                        borderRadius: '4px 4px 0 0',
                        position: 'relative',
                        minHeight: 4
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: -20,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: 10,
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {count}
                        </div>
                      </div>

                      <div style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: '#ccc',
                        textAlign: 'center'
                      }}>
                        {cmc === '0' ? '0' : cmc}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}