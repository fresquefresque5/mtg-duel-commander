// frontend/src/components/BotDeckZone.jsx
import React from 'react';
import CardBack from './CardBack.jsx';
import AnimatedCard from './AnimatedCard.jsx';

export default function BotDeckZone({
  library = [],
  commander = null,
  onShuffle = () => {},
  onDraw = () => {},
  handCount = 0,
  revealTop = false,
  topCard = null
}) {
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', justifyContent: 'center' }}>
      {/* Library pile */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.8 }}>Bot Library</div>
        <div style={{ position: 'relative', width: 140, height: 196 }}>
          {Array.from({ length: Math.min(library.length, 8) }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: i * 2,
                left: i * 2,
                transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)`,
                zIndex: i
              }}
            >
              <CardBack size="normal" />
            </div>
          ))}

          {library.length === 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0
              }}
            >
              <div
                style={{
                  width: 140,
                  height: 196,
                  borderRadius: 8,
                  background: '#111',
                  border: '2px dashed #333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#777'
                }}
              >
                Empty
              </div>
            </div>
          )}

          {/* Buttons */}
          <div
            style={{
              position: 'absolute',
              right: -8,
              bottom: -22,
              display: 'flex',
              gap: 8
            }}
          >
            <button
              onClick={onShuffle}
              style={{
                padding: '6px 8px',
                borderRadius: 8,
                background: '#2a2a2a',
                color: 'white',
                border: '1px solid #444',
                cursor: 'pointer'
              }}
            >
              Barajar
            </button>
            <button
              onClick={onDraw}
              style={{
                padding: '6px 8px',
                borderRadius: 8,
                background: '#2a7a2a',
                color: 'white',
                border: '1px solid #2a2a2a',
                cursor: 'pointer'
              }}
            >
              Robar
            </button>
          </div>

          {/* Count */}
          <div
            style={{
              position: 'absolute',
              left: 6,
              bottom: -20,
              fontSize: 12,
              color: '#ccc'
            }}
          >
            {library.length}
          </div>
        </div>
      </div>

      {/* Commander */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.8 }}>Bot Commander</div>
        <div style={{ width: 140 }}>
          {commander ? (
            <AnimatedCard
              card={commander}
              style={{
                border: '2px solid gold',
                boxShadow: '0 0 16px rgba(255,215,0,0.3)',
                borderRadius: 8
              }}
            />
          ) : (
            <div
              style={{
                width: 140,
                height: 196,
                borderRadius: 8,
                background: '#111',
                border: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#777'
              }}
            >
              None
            </div>
          )}
        </div>
      </div>

      {/* Bot Hand (backs only) */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.8 }}>Bot Hand</div>
        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            width: 240,
            justifyContent: 'center'
          }}
        >
          {Array.from({ length: handCount }).map((_, idx) => (
            <div key={idx}>
              <CardBack size="small" />
            </div>
          ))}
        </div>
      </div>

      {/* optional reveal top card */}
      {revealTop && topCard && (
        <div style={{ textAlign: 'center', marginLeft: 8 }}>
          <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.8 }}>Bot Top Card (revealed)</div>
          <div style={{ width: 140 }}>
            <AnimatedCard card={topCard} />
          </div>
        </div>
      )}
    </div>
  );
}
