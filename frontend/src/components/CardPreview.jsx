// frontend/src/components/CardPreview.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCard from './AnimatedCard.jsx';

export default function CardPreview({ card, isVisible, position = 'fixed', onClose }) {
  if (!card || !isVisible) return null;

  const previewStyle = {
    position: position === 'fixed' ? 'fixed' : 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000,
    pointerEvents: 'auto'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop overlay */}
          {position === 'fixed' && (
            <motion.div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                zIndex: 999,
                backdropFilter: 'blur(2px)'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
          )}

          {/* Card preview */}
          <motion.div
            style={previewStyle}
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 5 }}
            transition={{
              type: 'spring',
              damping: 15,
              stiffness: 300
            }}
          >
            <motion.div
              style={{
                position: 'relative',
                cursor: position === 'fixed' ? 'pointer' : 'default'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
            >
              <AnimatedCard card={card} animationType="glow" />

              {/* Card information overlay */}
              <motion.div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                  color: 'white',
                  padding: '16px 12px 12px',
                  borderRadius: '0 0 10px 10px'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  marginBottom: 4,
                  color: 'var(--mtg-gold, #ffd700)'
                }}>
                  {card.name}
                </div>

                <div style={{
                  fontSize: 12,
                  color: '#ccc',
                  marginBottom: 6
                }}>
                  {card.type}
                </div>

                {card.manaCost && (
                  <div style={{
                    fontSize: 16,
                    marginBottom: 6
                  }}>
                    {card.manaCost}
                  </div>
                )}

                {card.type?.includes('Creature') && (
                  <div style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>Poder: {card.power || 0}</span>
                    <span>Resistencia: {card.toughness || 0}</span>
                  </div>
                )}

                {position === 'fixed' && (
                  <div style={{
                    textAlign: 'center',
                    marginTop: 8,
                    fontSize: 11,
                    color: 'var(--mtg-blue, #4fc3f7)',
                    fontStyle: 'italic'
                  }}>
                    Clic para cerrar
                  </div>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook for managing card preview state
export const useCardPreview = () => {
  const [previewCard, setPreviewCard] = React.useState(null);
  const [isPreviewVisible, setIsPreviewVisible] = React.useState(false);

  const showPreview = React.useCallback((card) => {
    setPreviewCard(card);
    setIsPreviewVisible(true);
  }, []);

  const hidePreview = React.useCallback(() => {
    setIsPreviewVisible(false);
    setTimeout(() => setPreviewCard(null), 300); // Clear card after exit animation
  }, []);

  const togglePreview = React.useCallback((card) => {
    if (isPreviewVisible && previewCard?.id === card.id) {
      hidePreview();
    } else {
      showPreview(card);
    }
  }, [isPreviewVisible, previewCard, showPreview, hidePreview]);

  return {
    previewCard,
    isPreviewVisible,
    showPreview,
    hidePreview,
    togglePreview
  };
};