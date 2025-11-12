import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ Base URL del backend (usa variable de entorno o localhost:4000 por defecto)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function AnimatedCard({
  card,
  onClick,
  onDoubleClick,
  small = false,
  isSelected = false,
  isTapped = false,
  isAttacking = false,
  isBlocking = false,
  showPowerToughness = true,
  animationType = 'none',
  className = '',
  style = {},
  ...props
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 🔧 Imagen: preferimos la URL absoluta del backend
  const getImageUrlForCard = (cardObj, imageErrorFlag) => {
    if (!cardObj) return `${API_BASE_URL}/api/card-image-placeholder?name=Unknown`;

    if (typeof cardObj.image === 'string' && cardObj.image.trim() !== '') {
      const v = cardObj.image.trim();
      if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/')) {
        return v;
      }
    }

    if (imageErrorFlag) {
      return `${API_BASE_URL}/api/card-image-placeholder?name=${encodeURIComponent(cardObj.name || 'Unknown')}`;
    }

    return `${API_BASE_URL}/api/card/${encodeURIComponent(cardObj.name || '')}`;
  };

  const imageUrl = getImageUrlForCard(card, imageError);

  // 🔥 Tamaño ajustado (más grande y proporcionado a una carta real)
  const cardDimensions = {
    width: small ? 140 : 240,
    height: small ? 200 : 335
  };

  // --- Variantes de animación ---
  const cardVariants = {
    initial: { scale: 1, rotate: 0, opacity: 1 },
    hover: { scale: 1.05, y: -10, filter: 'brightness(1.1)' },
    selected: { scale: 1.08, y: -15, filter: 'brightness(1.2)' },
    tapped: { rotate: 90, scale: 0.9, opacity: 0.8 },
    attacking: { x: 30, rotate: -5, scale: 1.05 },
    blocking: { x: -30, rotate: 5, scale: 1.05 },
    damage: {
      x: [-5, 5, -3, 3, 0],
      backgroundColor: [
        'rgba(255, 0, 0, 0)',
        'rgba(255, 0, 0, 0.3)',
        'rgba(255, 0, 0, 0.5)',
        'rgba(255, 0, 0, 0.3)',
        'rgba(255, 0, 0, 0)'
      ],
      transition: { duration: 0.5, times: [0, 0.25, 0.5, 0.75, 1] }
    },
    heal: {
      backgroundColor: [
        'rgba(0, 255, 0, 0)',
        'rgba(0, 255, 0, 0.3)',
        'rgba(0, 255, 0, 0.5)',
        'rgba(0, 255, 0, 0.3)',
        'rgba(0, 255, 0, 0)'
      ],
      scale: [1, 1.1, 1.05, 1.02, 1],
      transition: { duration: 0.6, times: [0, 0.25, 0.5, 0.75, 1] }
    }
  };

  const getAnimationVariant = () => {
    if (animationType === 'damage') return 'damage';
    if (animationType === 'heal') return 'heal';
    if (isSelected) return 'selected';
    if (isTapped) return 'tapped';
    if (isAttacking) return 'attacking';
    if (isBlocking) return 'blocking';
    return 'initial';
  };

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          className={`animated-card ${className}`}
          variants={cardVariants}
          initial="initial"
          animate={getAnimationVariant()}
          exit="exit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          style={{
            width: cardDimensions.width,
            height: cardDimensions.height,
            position: 'relative',
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: isSelected
              ? '0 20px 40px rgba(255, 215, 0, 0.6)'
              : '0 8px 18px rgba(0,0,0,0.45)',
            background: '#000',
            transition: 'all 0.2s ease-in-out',
            margin: '8px',
            ...style
          }}
          {...props}
        >
          {/* Imagen de la carta */}
          <motion.img
            src={imageUrl}
            alt={card.name}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              console.warn('❌ Falló imagen:', imageUrl, '→ usando placeholder');
              setImageError(true);
              e.currentTarget.src = `${API_BASE_URL}/api/card-image-placeholder?name=${encodeURIComponent(card?.name || 'Unknown')}`;
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: imageLoaded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',  // ✅ se ve completa, sin recorte
              objectPosition: 'center',
              display: 'block',
              borderRadius: 10
            }}
          />

          {/* Spinner de carga */}
          {!imageLoaded && (
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(45deg, #2a2a2a 25%, #3a3a3a 25%, #3a3a3a 50%, #2a2a2a 50%, #2a2a2a 75%, #3a3a3a 75%, #3a3a3a)',
                backgroundSize: '20px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              animate={{ backgroundPosition: ['0px 0px', '20px 20px'] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <motion.div
                style={{
                  width: 40,
                  height: 40,
                  border: '3px solid #666',
                  borderTop: '3px solid #fff',
                  borderRadius: '50%'
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
          )}

          {/* Poder / Resistencia */}
          {showPowerToughness && card.type?.includes('Creature') && !small && (
            <motion.div
              style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '3px 7px',
                borderRadius: 5,
                fontSize: 16,
                fontWeight: 'bold'
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {card.power || 0}/{card.toughness || 0}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// === Subcomponentes especializados ===
export const SpellCastingCard = ({ card, ...props }) => (
  <AnimatedCard
    {...props}
    card={card}
    animationType="cast-from-hand"
    style={{ ...props.style, zIndex: 100 }}
  />
);

export const CreatureTokenCard = ({ card, ...props }) => (
  <AnimatedCard
    {...props}
    card={card}
    style={{
      ...props.style,
      border: '2px dashed rgba(255,255,255,0.5)',
      opacity: 0.9
    }}
  />
);

export const DamagedCard = ({ card, ...props }) => (
  <AnimatedCard
    {...props}
    card={card}
    animationType="damage"
    style={{
      ...props.style,
      filter: 'brightness(0.8) saturate(1.2)'
    }}
  />
);

export const HealedCard = ({ card, ...props }) => (
  <AnimatedCard
    {...props}
    card={card}
    animationType="heal"
    style={{
      ...props.style,
      filter: 'brightness(1.2) saturate(0.8)'
    }}
  />
);
