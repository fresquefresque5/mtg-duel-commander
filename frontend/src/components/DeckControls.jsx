// frontend/src/components/DeckControls.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useGameStore } from '../store/gameStore';

export default function DeckControls() {
  const { state, setState } = useGameStore();
  const [deckText, setDeckText] = useState('');
  const [status, setStatus] = useState('');

  const handleImportText = async () => {
    try {
      setStatus('⏳ Importando mazo...');
      const res = await axios.post('/api/deck/import', { deckText });
      const data = res.data;
      if (!data.success) {
        setStatus(`❌ ${data.message || 'Error'}`);
        return;
      }

      const importedCards = data.cards || [];
      // Poner las cartas en library del jugador (sin alterar command zone)
      const player = state.players[0];
      const updatedPlayer = {
        ...player,
        library: importedCards,
        // si quieres, vaciamos mano/battlefield para nueva partida:
        // hand: [], battlefield: [], commandZone: player.commandZone || []
      };

      const newState = {
        ...state,
        players: [updatedPlayer, state.players[1]]
      };

      setState(newState);
      setStatus(`✅ Importadas ${importedCards.length} cartas en tu biblioteca.`);
    } catch (err) {
      console.error('Import error:', err);
      setStatus('❌ Error al importar el mazo');
    }
  };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.35)',
      padding: 14,
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
      <div style={{ fontSize: 14, marginBottom: 8 }}><strong>Importar mazo (texto)</strong></div>
      <textarea
        value={deckText}
        onChange={e => setDeckText(e.target.value)}
        rows={6}
        placeholder="Pega el decklist aquí, una carta por línea: 1 Sol Ring"
        style={{
          width: '100%',
          padding: 8,
          borderRadius: 8,
          background: '#0b0b0b',
          color: 'white',
          border: '1px solid #222',
          resize: 'vertical'
        }}
      />
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={handleImportText} style={{
          padding: '8px 12px',
          borderRadius: 8,
          background: '#1f7a8c',
          color: 'white',
          border: 'none',
          cursor: 'pointer'
        }}>
          Importar desde texto
        </button>
        <button onClick={() => { setDeckText(''); setStatus(''); }} style={{
          padding: '8px 12px',
          borderRadius: 8,
          background: '#333',
          color: 'white',
          border: 'none',
          cursor: 'pointer'
        }}>
          Limpiar
        </button>
      </div>

      {status && <div style={{ marginTop: 10, color: '#ccc', fontSize: 13 }}>{status}</div>}
    </div>
  );
}
