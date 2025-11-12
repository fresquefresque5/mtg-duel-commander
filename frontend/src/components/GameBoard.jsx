import React, { useEffect, useState } from 'react';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useGameStore } from '../store/gameStore';
import CardDraggable from './CardDraggable.jsx';
import BotDeckZone from './BotDeckZone.jsx';
import PlayerDeckZone from './PlayerDeckZone.jsx';
import AnimatedCard from './AnimatedCard.jsx';
import DeckControls from './DeckControls.jsx';
import DeckView from './DeckView.jsx';
import { DrawnCard, SpellCastingCard } from './AnimatedCard.jsx';

// Separate component for the battlefield drop zone to ensure proper DnD context
function BattlefieldDropZone({ children, onPlayCard }) {
  const [, dropRef] = useDrop(() => ({
    accept: 'CARD',
    drop: (item) => {
      if (item && item.card) {
        onPlayCard(item.card);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  return (
    <div
      ref={dropRef}
      style={{
        minHeight: 250,
        border: '3px dashed rgba(255,215,0,0.3)',
        borderRadius: 16,
        margin: '24px auto',
        width: '90%',
        maxWidth: 1200,
        background: 'rgba(255,255,255,0.03)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        padding: 20,
        position: 'relative',
        transition: 'all 0.3s ease'
      }}
    >
      {children}
    </div>
  );
}

export default function GameBoard() {
  const { state, setState } = useGameStore();
  const [showDeckImport, setShowDeckImport] = useState(false);
  const [showDeckView, setShowDeckView] = useState(false);

  // Initialize with game state or empty state
  const player = state?.players?.[0];
  const botPlayer = state?.players?.[1];

  const [library, setLibrary] = useState([]);
  const [hand, setHand] = useState([]);
  const [battlefield, setBattlefield] = useState([]);
  const [graveyard, setGraveyard] = useState([]);
  const [commander, setCommander] = useState(null);

  const [botLibrary, setBotLibrary] = useState([]);
  const [botHand, setBotHand] = useState([]);
  const [botCommander, setBotCommander] = useState(null);

  // Sync with game store when state changes
  useEffect(() => {
    try {
      if (state?.players && Array.isArray(state.players)) {
        const playerData = state.players[0] || {};
        const botData = state.players[1] || {};

        setLibrary(Array.isArray(playerData.library) ? playerData.library : []);
        setHand(Array.isArray(playerData.hand) ? playerData.hand : []);
        setBattlefield(Array.isArray(playerData.battlefield) ? playerData.battlefield : []);
        setGraveyard(Array.isArray(playerData.graveyard) ? playerData.graveyard : []);
        setCommander(Array.isArray(playerData.commandZone) && playerData.commandZone[0] ? playerData.commandZone[0] : null);

        setBotLibrary(Array.isArray(botData.library) ? botData.library : []);
        setBotHand(Array.isArray(botData.hand) ? botData.hand : []);
        setBotCommander(Array.isArray(botData.commandZone) && botData.commandZone[0] ? botData.commandZone[0] : null);
      }
    } catch (error) {
      console.error('Error syncing game state:', error);
    }
  }, [state]);

  // Load bot deck if not present
  useEffect(() => {
    if (botLibrary.length === 0) {
      axios.get('/api/deck/bot').then(res => {
        if (res.data.success) {
          const all = res.data.cards;
          const commander = all.find(c => c.name === 'Slimefoot and Squee');
          const deck = all.filter(c => c.name !== 'Slimefoot and Squee');

          setBotLibrary(deck);
          setBotCommander(commander);

          // Update game store with bot deck
          setState(prevState => {
            const newPlayers = [...prevState.players];
            newPlayers[1] = {
              ...newPlayers[1],
              library: deck,
              hand: [],
              battlefield: [],
              graveyard: [],
              commandZone: commander ? [commander] : []
            };
            return { ...prevState, players: newPlayers };
          });
        }
      });
    }
  }, [botLibrary.length, setState]);

  
  const playCard = (card) => {
    const newHand = hand.filter(c => c.id !== card.id);
    const newBattlefield = [...battlefield, card];

    setHand(newHand);
    setBattlefield(newBattlefield);

    // Update game store
    setState(prevState => {
      const newPlayers = [...prevState.players];
      newPlayers[0] = {
        ...newPlayers[0],
        hand: newHand,
        battlefield: newBattlefield
      };
      return { ...prevState, players: newPlayers };
    });
  };

  const handleCardDraw = (drawnCards) => {
    const newLibrary = library.slice(0, -drawnCards.length);
    const newHand = [...hand, ...drawnCards];

    setLibrary(newLibrary);
    setHand(newHand);

    // Update game store
    setState(prevState => {
      const newPlayers = [...prevState.players];
      newPlayers[0] = {
        ...newPlayers[0],
        library: newLibrary,
        hand: newHand
      };
      return { ...prevState, players: newPlayers };
    });
  };

  const handleDeckShuffle = (shuffledLibrary) => {
    setLibrary(shuffledLibrary);

    // Update game store
    setState(prevState => {
      const newPlayers = [...prevState.players];
      newPlayers[0] = {
        ...newPlayers[0],
        library: shuffledLibrary
      };
      return { ...prevState, players: newPlayers };
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <motion.div
        className="game-board"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0b0f13 0%, #1a2332 100%)',
          color: '#fff',
          padding: 16,
          position: 'relative'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Game Header */}
        <motion.div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            padding: '0 16px'
          }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 style={{
            margin: 0,
            color: 'var(--mtg-gold, #ffd700)',
            fontSize: 24,
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            ⚔️ Duel Commander
          </h2>

          <div style={{ display: 'flex', gap: 12 }}>
            <motion.button
              onClick={() => setShowDeckImport(!showDeckImport)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'var(--mtg-teal, #1f7a8c)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              📥 Importar Mazo
            </motion.button>

            <motion.button
              onClick={() => setShowDeckView(!showDeckView)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'var(--mtg-green, #2a9d8f)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🂠 Ver Mazo
            </motion.button>
          </div>
        </motion.div>

        {/* Deck Import Modal */}
        <AnimatePresence>
          {showDeckImport && (
            <motion.div
              style={{
                position: 'fixed',
                top: 80,
                right: 16,
                zIndex: 100,
                maxWidth: 400
              }}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
            >
              <DeckControls />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deck View Modal */}
        <AnimatePresence>
          {showDeckView && player && (
            <motion.div
              style={{
                position: 'fixed',
                top: 80,
                left: 16,
                zIndex: 100,
                maxWidth: 500,
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              <DeckView player={player} playerIndex={0} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bot Zone */}
        <motion.div
          style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <BotDeckZone
            library={botLibrary}
            commander={botCommander}
            handCount={botHand.length}
          />
        </motion.div>

        {/* Battlefield */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <BattlefieldDropZone onPlayCard={playCard}>
            {battlefield.length === 0 && (
              <div style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: 18,
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                Arrastra cartas aquí para jugarlas
              </div>
            )}

            <AnimatePresence>
              {battlefield.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 50 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <SpellCastingCard card={card} />
                </motion.div>
              ))}
            </AnimatePresence>
          </BattlefieldDropZone>
        </motion.div>

        {/* Player Zone */}
        <motion.div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 32,
            marginTop: 32
          }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Player Deck Zone */}
          <div style={{ flexShrink: 0 }}>
            <PlayerDeckZone playerIndex={0} />

            {/* Commander Zone */}
            {commander && (
              <motion.div
                style={{
                  marginTop: 20,
                  textAlign: 'center'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <div style={{
                  fontSize: 12,
                  color: 'var(--mtg-gold, #ffd700)',
                  marginBottom: 8,
                  fontWeight: 'bold'
                }}>
                  Comandante
                </div>
                <AnimatedCard card={commander} small />
              </motion.div>
            )}
          </div>

          {/* Player Hand */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            flex: 1,
            justifyContent: 'center',
            minHeight: 200,
            padding: 16,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 12,
            border: '2px solid rgba(255,255,255,0.1)'
          }}>
            <AnimatePresence>
              {hand.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.8, y: 100 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -100 }}
                  transition={{
                    delay: index * 0.15,
                    type: 'spring',
                    damping: 15
                  }}
                >
                  <CardDraggable
                    card={card}
                    onPlay={playCard}
                    animationType="drawFromDeck"
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {hand.length === 0 && (
              <div style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: 16,
                textAlign: 'center',
                width: '100%',
                fontStyle: 'italic'
              }}>
                Tu mano está vacía. Roba cartas para comenzar.
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </DndProvider>
  );
}
