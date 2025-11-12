// frontend/src/components/DeckView.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from './Card';

export default function DeckView({ player, limit = null }) {
  // Abrir por defecto (petición previa tuya)
  const [open, setOpen] = useState(true);
  const [cards, setCards] = useState([]);

  useEffect(() => {
    if (!player) {
      setCards([]);
      return;
    }

    // Si el player tiene library (ya importado), usamos eso
    if (player.library && player.library.length) {
      const lib = [...player.library].slice().reverse(); // top-of-deck = last element; invierto para mostrar top primero
      setCards(limit ? lib.slice(0, limit) : lib);
      return;
    }

    // Si no hay library localmente, intentamos pedir preview al backend (si existe)
    // Nota: este es fallback genérico, no obligatorio.
    const fetchPreview = async () => {
      try {
        const res = await axios.post('/api/deck/preview', { deckText: player?.deckText || '' });
        if (res?.data?.cards) {
          setCards(res.data.cards);
        }
      } catch (err) {
        // ignore
      }
    };

    if (open) fetchPreview();
  }, [player, open, limit]);

  if (!player) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <div>🂠 Mazo: {player.library ? player.library.length : 0} cartas</div>
        <button onClick={()=> setOpen(o=>!o)}>{open ? 'Cerrar mazo' : 'Ver mazo (top)'}</button>
      </div>

      {open && (
        <div style={{ marginTop: 8, display:'flex', gap:8, flexWrap:'wrap' }}>
          {cards.length ? (
            cards.map(c => <Card key={c.id} card={c} small />)
          ) : (
            <div style={{ padding: 12, color: '#ccc' }}>No hay cartas en el mazo para mostrar.</div>
          )}
        </div>
      )}
    </div>
  );
}
