// frontend/src/components/DeckControls.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useGameStore } from '../store/gameStore';

export default function DeckControls() {
  const { state, setState } = useGameStore();
  const [deckText, setDeckText] = useState('');
  const [status, setStatus] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [validatedCards, setValidatedCards] = useState([]);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const validateDeckText = (text) => {
    if (!text.trim()) return { valid: [], invalid: [] };

    const lines = text.split('\n').filter(line => line.trim());
    const valid = [];
    const invalid = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      // Basic pattern: "Quantity Card Name" or "Quantity x Card Name"
      const match = trimmed.match(/^(\d+)\s*(?:x\s*)?(.+)$/i);

      if (match) {
        const [, quantity, cardName] = match;
        valid.push({
          name: cardName.trim(),
          quantity: parseInt(quantity),
          line: trimmed
        });
      } else if (trimmed) {
        invalid.push({
          line: trimmed,
          reason: 'Formato inválido. Usa: "1 Card Name" o "1x Card Name"'
        });
      }
    });

    return { valid, invalid };
  };

  // Real-time validation
  useEffect(() => {
    const validation = validateDeckText(deckText);
    setValidatedCards(validation.valid);
  }, [deckText]);

  const handleImportText = async () => {
    const validation = validateDeckText(deckText);

    if (validation.valid.length === 0) {
      setStatus('❌ No se encontraron cartas válidas en el texto');
      return;
    }

    if (validation.invalid.length > 0) {
      setStatus(`⚠️ ${validation.invalid.length} líneas con formato inválido`);
    }

    try {
      setIsImporting(true);
      setStatus('⏳ Importando mazo...');
      setImportProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const res = await axios.post('/api/deck/import', { deckText });
      clearInterval(progressInterval);

      const data = res.data;
      if (!data.success) {
        setStatus(`❌ ${data.message || 'Error al importar'}`);
        setIsImporting(false);
        setImportProgress(0);
        return;
      }

      const importedCards = data.cards || [];
      setImportProgress(100);

      // Update game state with imported cards
      const player = state.players[0];
      const updatedPlayer = {
        ...player,
        library: importedCards,
        hand: [],
        battlefield: [],
        graveyard: [],
        commandZone: player.commandZone || []
      };

      const newState = {
        ...state,
        players: [updatedPlayer, state.players[1]]
      };

      setState(newState);

      // Show success animation
      setShowSuccessAnimation(true);
      setStatus(`✅ ${importedCards.length} cartas importadas exitosamente`);

      setTimeout(() => {
        setShowSuccessAnimation(false);
        setIsImporting(false);
        setImportProgress(0);
      }, 3000);

    } catch (err) {
      console.error('Import error:', err);
      setStatus('❌ Error de conexión al importar el mazo');
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const handleClear = () => {
    setDeckText('');
    setStatus('');
    setValidatedCards([]);
    setImportProgress(0);
  };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.35)',
      padding: 16,
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.06)',
      position: 'relative'
    }}>
      <motion.div
        style={{ fontSize: 16, marginBottom: 12 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <strong style={{ color: '#ffd700' }}>📜 Importar Mazo Magic</strong>
      </motion.div>

      {/* Validation indicator */}
      {deckText && (
        <motion.div
          style={{
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: validatedCards.length > 0 ? '#2a9d8f' : '#e76f51'
          }} />
          <span style={{ fontSize: 12, color: '#ccc' }}>
            {validatedCards.length} cartas válidas detectadas
          </span>
        </motion.div>
      )}

      {/* Text input */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <textarea
          value={deckText}
          onChange={e => setDeckText(e.target.value)}
          rows={8}
          placeholder="Ejemplo:&#10;1 Sol Ring&#10;4 Lightning Bolt&#10;2 Mountain&#10;1x Dark Ritual"
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 8,
            background: '#0b0b0b',
            color: 'white',
            border: '1px solid #333',
            resize: 'vertical',
            fontSize: 14,
            fontFamily: 'monospace',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#1f7a8c'}
          onBlur={(e) => e.target.style.borderColor = '#333'}
        />
      </motion.div>

      {/* Progress bar */}
      <AnimatePresence>
        {isImporting && (
          <motion.div
            style={{
              marginTop: 12,
              height: 6,
              background: '#1a1a1a',
              borderRadius: 3,
              overflow: 'hidden'
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 6 }}
            exit={{ opacity: 0, height: 0 }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #1f7a8c, #2a9d8f)',
                borderRadius: 3
              }}
              initial={{ width: 0 }}
              animate={{ width: `${importProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <motion.div
        style={{
          marginTop: 12,
          display: 'flex',
          gap: 10
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.button
          onClick={handleImportText}
          disabled={isImporting || validatedCards.length === 0}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 8,
            background: (isImporting || validatedCards.length === 0) ? '#333' : '#1f7a8c',
            color: 'white',
            border: 'none',
            cursor: (isImporting || validatedCards.length === 0) ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 'bold',
            opacity: (isImporting || validatedCards.length === 0) ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
          whileHover={!isImporting && validatedCards.length > 0 ? {
            scale: 1.02,
            background: '#2a8a9c',
            boxShadow: '0 4px 12px rgba(31, 122, 140, 0.3)'
          } : {}}
          whileTap={!isImporting && validatedCards.length > 0 ? { scale: 0.98 } : {}}
        >
          {isImporting ? '⏳ Importando...' : '🚀 Importar Mazo'}
        </motion.button>

        <motion.button
          onClick={handleClear}
          disabled={isImporting}
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            background: isImporting ? '#333' : '#555',
            color: 'white',
            border: 'none',
            cursor: isImporting ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 'bold',
            opacity: isImporting ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
          whileHover={!isImporting ? {
            scale: 1.02,
            background: '#666',
            boxShadow: '0 4px 12px rgba(85, 85, 85, 0.3)'
          } : {}}
          whileTap={!isImporting ? { scale: 0.98 } : {}}
        >
          🗑️ Limpiar
        </motion.button>
      </motion.div>

      {/* Status message */}
      <AnimatePresence>
        {status && (
          <motion.div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 6,
              fontSize: 13,
              textAlign: 'center',
              background: status.includes('✅') ? 'rgba(42, 157, 143, 0.1)' :
                         status.includes('❌') ? 'rgba(231, 111, 81, 0.1)' :
                         'rgba(244, 162, 97, 0.1)',
              border: `1px solid ${
                status.includes('✅') ? '#2a9d8f' :
                status.includes('❌') ? '#e76f51' :
                '#f4a261'
              }`,
              color: status.includes('✅') ? '#2a9d8f' :
                      status.includes('❌') ? '#e76f51' :
                      '#f4a261'
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {status}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success animation overlay */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(42, 157, 143, 0.1)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #2a9d8f',
              pointerEvents: 'none'
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <motion.div
              style={{
                textAlign: 'center',
                color: '#2a9d8f'
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
            >
              <div style={{ fontSize: 48 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 'bold', marginTop: 8 }}>
                ¡Mazo Importado!
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
