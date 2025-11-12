// frontend/src/components/ShufflePile.jsx
import React from 'react';

export default function ShufflePile({ count = 0, onShuffle = () => {}, onDraw = () => {} }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 180, height: 260, margin: '0 auto', position: 'relative' }}>
        <div style={{
          width: '100%', height: '100%', borderRadius: 10,
          background: 'linear-gradient(180deg,#111,#000)', boxShadow:'0 10px 30px rgba(0,0,0,0.7)',
          display:'flex', alignItems:'center', justifyContent:'center', color:'#fff'
        }}
        onClick={onDraw}
        onDoubleClick={onShuffle}
        title="Click = Draw, Double Click = Shuffle">
          <div>
            <div style={{ fontSize: 48 }}>🂠</div>
            <div style={{ fontSize: 14 }}>{count} cards</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Double click to shuffle</div>
          </div>
        </div>
      </div>
    </div>
  );
}
