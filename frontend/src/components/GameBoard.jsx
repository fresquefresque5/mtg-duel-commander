import React, { useEffect, useState } from 'react';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useGameStore } from '../store/gameStore';
import CardDraggable from './CardDraggable.jsx';
import BotDeckZone from './BotDeckZone.jsx';
import PlayerDeckZone from './PlayerDeckZone.jsx';
import AnimatedCard from './AnimatedCard.jsx';

export default function GameBoard() {
  const { state, setState } = useGameStore();
  const [library, setLibrary] = useState([]);
  const [hand, setHand] = useState([]);
  const [battlefield, setBattlefield] = useState([]);
  const [botLibrary, setBotLibrary] = useState([]);
  const [botHand, setBotHand] = useState([]);
  const [botCommander, setBotCommander] = useState(null);

  // Cargar mazo del bot
  useEffect(() => {
    axios.get('/api/deck/bot').then(res => {
      if (res.data.success) {
        const all = res.data.cards;
        const commander = all.find(c => c.name === 'Slimefoot and Squee');
        const deck = all.filter(c => c.name !== 'Slimefoot and Squee');
        setBotLibrary(deck);
        setBotCommander(commander);
      }
    });
  }, []);

  // Zona para soltar cartas
  const [, dropRef] = useDrop(() => ({
    accept: 'CARD',
    drop: (item) => playCard(item.card)
  }));

  const shuffleDeck = () => {
    const shuffled = [...library].sort(() => Math.random() - 0.5);
    setLibrary(shuffled);
  };

  const drawOne = () => {
    if (library.length === 0) return;
    const newLib = [...library];
    const drawn = newLib.pop();
    setLibrary(newLib);
    setHand([...hand, drawn]);
  };

  const drawSeven = () => {
    const newLib = [...library];
    const drawn = newLib.splice(-7);
    setLibrary(newLib);
    setHand([...hand, ...drawn]);
  };

  const playCard = (card) => {
    setBattlefield([...battlefield, card]);
    setHand(hand.filter(c => c.id !== card.id));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <motion.div
        className="game-board"
        style={{
          minHeight: '100vh',
          background: '#0b0f13',
          color: '#fff',
          padding: 24
        }}
      >
        <h2 style={{ textAlign: 'center' }}>Duel Commander</h2>

        {/* Bot Zone */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <BotDeckZone
            library={botLibrary}
            commander={botCommander}
            handCount={botHand.length}
          />
        </div>

        {/* Battlefield */}
        <div
          ref={dropRef}
          style={{
            minHeight: 200,
            border: '2px dashed rgba(255,255,255,0.2)',
            borderRadius: 12,
            margin: '24px auto',
            width: '80%',
            background: 'rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8
          }}
        >
          {battlefield.map((card) => (
            <AnimatedCard key={card.id} card={card} />
          ))}
        </div>

        {/* Player Deck + Hand */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48 }}>
          <PlayerDeckZone
            library={library}
            onShuffle={shuffleDeck}
            onDrawOne={drawOne}
            onDrawSeven={drawSeven}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: 600 }}>
            {hand.map((card) => (
              <CardDraggable key={card.id} card={card} onPlay={playCard} />
            ))}
          </div>
        </div>
      </motion.div>
    </DndProvider>
  );
}
