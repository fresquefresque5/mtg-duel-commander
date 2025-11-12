import React, { useState } from 'react';
import CardBack from './CardBack.jsx';

export default function PlayerDeckZone({ library = [], onShuffle, onDrawOne, onDrawSeven }) {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <div style={{ textAlign: 'center', position: 'relative' }}>
      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>Your Library</div>

      <div
        style={{ position: 'relative', width: 140, height: 196, cursor: 'pointer' }}
        onClick={() => setMenuVisible(!menuVisible)}
      >
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
            <CardBack />
          </div>
        ))}
        <div style={{ position: 'absolute', bottom: -20, left: 6, color: '#ccc', fontSize: 12 }}>
          {library.length}
        </div>
      </div>

      {menuVisible && (
        <div
          style={{
            position: 'absolute',
            top: 210,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(20,20,20,0.95)',
            border: '1px solid #555',
            borderRadius: 8,
            padding: 8,
            zIndex: 10
          }}
        >
          <button onClick={() => { onShuffle(); setMenuVisible(false); }}>🔀 Barajar</button>
          <button onClick={() => { onDrawOne(); setMenuVisible(false); }}>🃏 Robar 1</button>
          <button onClick={() => { onDrawSeven(); setMenuVisible(false); }}>🃏 Robar 7</button>
        </div>
      )}
    </div>
  );
}
