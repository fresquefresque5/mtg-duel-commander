// backend/src/game-engine/engine.js
import { v4 as uuid } from 'uuid';
import AdvancedBot from './advancedBot.js';
import { starterDecks, createDeckFromNames, BOT_DECK_LIST } from './cards.js';

const GAMES = new Map();

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function createGame({ playerName, socketId, io }) {
  const id = uuid();
  const game = new Game(id, io);
  game.addPlayer({ playerName, socketId, isHuman: true, starter: 'A' });
  game.addPlayer({ playerName: 'BOT', socketId: null, isHuman: false, starter: 'CUSTOM', customDeckNames: BOT_DECK_LIST });
  GAMES.set(id, game);
  return game;
}

export function getGameById(id) { return GAMES.get(id); }

class Game {
  constructor(id, io) {
    this.id = id;
    this.io = io;
    this.players = [];
    this.activePlayerIndex = 0;
    this.phase = 'begin';
    this.turn = 1;
    this.stack = [];
    this.bot = new AdvancedBot(this);
  }

  addPlayer({ playerName, socketId, isHuman, starter='A', customDeckNames = null }) {
    let base;
    if (starter === 'CUSTOM' && Array.isArray(customDeckNames)) {
      base = createDeckFromNames(customDeckNames);
    } else {
      const { deckA, deckB } = starterDecks();
      base = (starter === 'A') ? deckA.slice() : deckB.slice();
    }
    const library = shuffleArray(base.slice());
    const commander = library.find(c => c.isCommander) || library[0];

    const p = {
      id: uuid(),
      name: playerName,
      socketId,
      life: 20,
      library,
      hand: [],
      battlefield: [],
      graveyard: [],
      commandZone: commander ? [commander] : [],
      commanderTaxCount: 0,
      landsPlayedThisTurn: 0,
      manaPool: { total: 0, colors: { white: 0, blue: 0, black: 0, red: 0, green: 0 } },
      isHuman
    };

    for (let i = 0; i < 7; i++) if (p.library.length) p.hand.push(p.library.pop());
    this.players.push(p);
  }

  findPlayerBySocket(socketId) {
    return this.players.find(p => p.socketId === socketId);
  }

  // 🔹 Estado público para el frontend
  getPublicState() {
    return {
      id: this.id,
      phase: this.phase,
      turn: this.turn,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        life: p.life,
        handCount: p.hand.length,
        battlefield: p.battlefield,
        graveyard: p.graveyard,
        commandZone: p.commandZone
      })),
      stack: this.stack
    };
  }

  async applyAction(action, socketId) {
    const player = this.findPlayerBySocket(socketId);
    if (!player) throw new Error('Player not found');

    switch (action.type) {
      case 'shuffle':
        player.library = shuffleArray(player.library);
        break;

      case 'draw':
        const count = action.count || 1;
        for (let i = 0; i < count; i++) {
          if (player.library.length > 0) {
            player.hand.push(player.library.pop());
          }
        }
        break;

      case 'import-deck':
        await this.handleDeckImport(player, action);
        break;

      case 'play-land':
        this.handlePlayLand(player, action);
        break;

      case 'cast':
        this.handleCastSpell(player, action);
        break;

      case 'pass':
        this.advancePhase();
        break;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  async handleDeckImport(player, action) {
    try {
      // Dynamically import the DeckImportService
      const { default: DeckImportService } = await import('../services/deckImportService.js');
      const deckImportService = new DeckImportService();

      // Import the deck using the service
      const deckData = await deckImportService.importDeck({
        deckText: action.deckText,
        deckUrl: action.deckUrl
      });

      // Replace player's library with imported cards
      if (deckData && deckData.cards && deckData.cards.length > 0) {
        player.library = shuffleArray(deckData.cards);
        
        // Clear hand and draw new hand
        player.hand = [];
        for (let i = 0; i < 7; i++) {
          if (player.library.length > 0) {
            player.hand.push(player.library.pop());
          }
        }

        // Update commander if present in the new deck
        const newCommander = deckData.cards.find(c => c.isCommander);
        if (newCommander) {
          player.commandZone = [newCommander];
        }
      } else {
        throw new Error('No cards imported');
      }
    } catch (error) {
      throw new Error(`Failed to import deck: ${error.message}`);
    }
  }

  handlePlayLand(player, action) {
    // Find card in hand
    const cardIndex = player.hand.findIndex(c => c.id === action.cardId);
    if (cardIndex === -1) throw new Error('Card not in hand');

    // Check if player can play land
    if (player.landsPlayedThisTurn >= 1) throw new Error('Already played a land this turn');
    if (this.phase !== 'main1' && this.phase !== 'main2') throw new Error('Can only play lands during main phase');

    const card = player.hand[cardIndex];
    if (!card.type.toLowerCase().includes('land')) throw new Error('Card is not a land');

    // Move card to battlefield
    player.hand.splice(cardIndex, 1);
    player.battlefield.push({ ...card, tapped: false });
    player.landsPlayedThisTurn++;
  }

  handleCastSpell(player, action) {
    // Simplified casting logic
    const cardIndex = player.hand.findIndex(c => c.id === action.cardId);
    if (cardIndex === -1) throw new Error('Card not in hand');

    const card = player.hand[cardIndex];
    
    // Move card to battlefield (simplified - doesn't handle instants/sorceries properly)
    player.hand.splice(cardIndex, 1);
    if (card.type.toLowerCase().includes('creature') || card.type.toLowerCase().includes('artifact') || card.type.toLowerCase().includes('enchantment')) {
      player.battlefield.push({ ...card, tapped: false });
    } else {
      // For instants/sorceries, resolve and move to graveyard
      player.graveyard.push(card);
    }
  }

  advancePhase() {
    const phases = ['untap', 'upkeep', 'draw', 'main1', 'combat', 'main2', 'end'];
    const currentIndex = phases.indexOf(this.phase);
    
    if (currentIndex === phases.length - 1) {
      // End of turn
      this.phase = phases[0];
      this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
      this.turn++;
      
      // Reset lands played
      const activePlayer = this.players[this.activePlayerIndex];
      if (activePlayer) {
        activePlayer.landsPlayedThisTurn = 0;
      }
    } else {
      this.phase = phases[currentIndex + 1];
    }
  }

  shouldBotAct() {
    const activePlayer = this.players[this.activePlayerIndex];
    return activePlayer && !activePlayer.isHuman;
  }

  runBotTurn() {
    return this.bot.decideTurn(this.players[this.activePlayerIndex]);
  }
}