// backend/src/routes/api.js
import express from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';
import TrainingSystem from '../game-engine/trainingSystem.js';
import DeckImportService from '../services/deckImportService.js';

const cache = new NodeCache({ stdTTL: 60 * 60 }); // Cache 1 hora
const router = express.Router();

// Inicialización de servicios
const trainingSystem = new TrainingSystem();
const deckImportService = new DeckImportService();

/* =========================================================
   🃏 BOT DECK — Endpoint para devolver el mazo del bot (stático)
   =========================================================
*/
router.get('/deck/bot', async (req, res) => {
  // Texto del mazo del bot (el tuyo proporcionado)
  const botDeckText = `
1 Abrupt Decay
1 Accursed Marauder
1 Animate Dead
1 Arbor Elf
1 Arid Mesa
1 Badlands
1 Barrowgoyf
1 Bayou
1 Birds of Paradise
1 Birthing Pod
1 Blackcleave Cliffs
1 Blazemire Verge
1 Blood Crypt
1 Bloodstained Mire
1 Blooming Marsh
1 Boseiju, Who Endures
1 Broadside Bombardiers
1 Cankerbloom
1 Carnage, Crimson Chaos
1 Chaos Defiler
1 Command Tower
1 Commercial District
1 Copperline Gorge
1 Deadpool, Trading Card
1 Deathrite Shaman
1 Delighted Halfling
1 Demonic Tutor
1 Detective's Phoenix
1 Dismember
1 Eldritch Evolution
1 Elves of Deep Shadow
1 Elvish Mystic
1 Elvish Spirit Guide
1 Emperor of Bones
1 Endurance
1 Fable of the Mirror-Breaker
1 Fatal Push
1 Flare of Malice
1 Forest
1 Frenzied Baloth
1 Fury
1 Fyndhorn Elves
1 Goblin Bombardment
1 Grief
1 Grove of the Burnwillows
1 Headliner Scarlett
1 Ignoble Hierarch
1 Karplusan Forest
1 Keen-Eyed Curator
1 Laelia, the Blade Reforged
1 Lazotep Quarry
1 Lightning Bolt
1 Lively Dirge
1 Llanowar Elves
1 Llanowar Wastes
1 Magus of the Moon
1 Mana Confluence
1 Marsh Flats
1 Mawloc
1 Metamorphosis Fanatic
1 Minsc & Boo, Timeless Heroes
1 Misty Rainforest
1 Mountain
1 Oliphaunt
1 Opposition Agent
1 Orcish Bowmasters
1 Overgrown Tomb
1 Pendelhaven
1 Phyrexian Tower
1 Polluted Delta
1 Prismatic Vista
1 Pyrogoyf
1 Scalding Tarn
1 Simian Spirit Guide
1 Skullclamp
1 Spider-Punk
1 Starting Town
1 Stomping Ground
1 Sulfurous Springs
1 Survival of the Fittest
1 Swamp
1 Taiga
1 Tainted Pact
1 Tarmogoyf
1 Tersa Lightshatter
1 Thoughtseize
1 Troll of Khazad-dûm
1 Umbral Collar Zealot
1 Underground Mortuary
1 Unearth
1 Utopia Sprawl
1 Verdant Catacombs
1 Wastewood Verge
1 Wight of the Reliquary
1 Wild Growth
1 Windswept Heath
1 Wooded Foothills
1 Worldly Tutor
1 Yavimaya, Cradle of Growth

1 Slimefoot and Squee
  `.trim();

  try {
    const result = await deckImportService.importFromText(botDeckText);

    if (!result || !result.cards) {
      return res.status(500).json({ success: false, message: 'Failed to build bot deck' });
    }

    // Resultado: cards es mainboard (incluye comandante como última línea -> Slimefoot and Squee)
    // Para tu UI necesitamos que el bot tenga 99 cartas en la library y 1 commander en command zone.
    // Si la lista total es N (incluyendo Slimefoot), separaremos el último elemento como commander.
    const cards = result.cards.slice();
    // Intentar localizar la carta 'Slimefoot and Squee' por nombre (case-insensitive)
    const commanderIndex = cards.findIndex(c => (c.name || '').toLowerCase().includes('slimefoot') && (c.name || '').toLowerCase().includes('squee'));
    let commander = null;
    if (commanderIndex !== -1) {
      commander = cards.splice(commanderIndex, 1)[0];
    } else {
      // fallback: tomar la última carta
      commander = cards.pop();
    }

    // Asegurarnos que la biblioteca tenga 99 cartas (si vienen menos o más, ajustamos: si más -> recortamos; si menos -> duplicamos simple)
    let library = cards.slice();
    // remove tokens / empties already handled upstream; simple adjust:
    if (library.length > 99) library = library.slice(0, 99);
    while (library.length < 99) {
      // duplicar aleatoriamente para llenar hasta 99 (no ideal pero mantiene la UI funcional)
      library.push({ ...library[library.length % (library.length || 1)] || { name: 'Placeholder', id: `placeholder_${library.length}` , image: `/api/card-image-placeholder?name=Placeholder` } });
      if (library.length === 0) break;
    }

    // shuffle library server-side for reproducible starting state
    for (let i = library.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [library[i], library[j]] = [library[j], library[i]];
    }

    res.json({
      success: true,
      source: 'bot-static',
      totalCards: library.length,
      library,
      commander: commander ? commander : null
    });
  } catch (err) {
    console.error('[api] /deck/bot error:', err);
    res.status(500).json({ success: false, message: err.message || 'Unknown error' });
  }
});

/* =========================================================
   RUTAS RESTANTES (card image, deck import por texto, preview...)
   =========================================================
*/

// Route: /card/:name (devuelve imagen Scryfall o placeholder)
router.get('/card/:name', async (req, res) => {
  let rawName = req.params.name || '';
  const cleanName = rawName.replace(/%20/g, ' ').replace(/\b(commander|bot|ai)\b/gi, '').trim();

  const cacheKey = `card:${cleanName.toLowerCase()}`;
  const acceptsJson = (req.get('Accept') || '').includes('application/json');

  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`[api] /card cached: "${cleanName}" -> ${cached}`);
    return acceptsJson ? res.json({ name: cleanName, image: cached, cached: true }) : res.redirect(cached);
  }

  try {
    console.log(`[api] /card lookup: "${cleanName}"`);
    const r = await axios.get(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cleanName)}`, {
      timeout: 10000,
      headers: { 'User-Agent': 'MTG-Duel-Commander/1.0 (+https://github.com/your-repo)' }
    });

    const imageUrl = r?.data?.image_uris?.normal || r?.data?.card_faces?.[0]?.image_uris?.normal || null;

    if (imageUrl) {
      cache.set(cacheKey, imageUrl);
      console.log(`[api] /card found: "${cleanName}" -> ${imageUrl}`);
      return acceptsJson ? res.json({ name: r.data.name, image: imageUrl }) : res.redirect(imageUrl);
    }

    const placeholder = `/api/card-image-placeholder?name=${encodeURIComponent(cleanName)}`;
    return acceptsJson ? res.json({ name: cleanName, image: placeholder }) : res.redirect(placeholder);
  } catch (err) {
    console.error(`[api] /card error for "${cleanName}":`, err?.message || err);
    const placeholder = `/api/card-image-placeholder?name=${encodeURIComponent(cleanName)}`;
    return acceptsJson ? res.status(500).json({ name: cleanName, image: placeholder, error: err.message }) : res.redirect(placeholder);
  }
});

// Deck import (solo por texto)
router.post('/deck/import', async (req, res) => {
  try {
    const result = await deckImportService.importDeck(req.body);
    if (!result.cards || result.cards.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se encontraron cartas en el mazo importado.',
        cards: [],
      });
    }
    console.log(`[api] ✅ Deck importado con ${result.cards.length} cartas.`);
    return res.json({
      success: true,
      message: `✅ Importadas ${result.cards.length} cartas.`,
      cards: result.cards,
      sideboard: result.sideboard || [],
      totalCards: result.cards.length,
      warnings: result.warnings || [],
      validationErrors: result.validationErrors || [],
    });
  } catch (error) {
    console.error('❌ Deck import error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Deck preview
router.post('/deck/preview', async (req, res) => {
  try {
    const result = await deckImportService.importDeck(req.body);
    res.json({
      success: true,
      previewCount: 20,
      cards: result.cards.slice(0, 20),
      totalCards: result.cards.length,
    });
  } catch (error) {
    console.error('Deck preview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Card image placeholder
router.get('/card-image-placeholder', (req, res) => {
  const name = req.query.name || 'Unknown';
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(`
    <svg width="300" height="420" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#111" stroke="#444" stroke-width="3"/>
      <text x="50%" y="10%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="Arial" font-size="20" font-weight="bold">
        ${name.substring(0, 24)}
      </text>
      <text x="50%" y="50%" text-anchor="middle" fill="#777" font-family="Arial" font-size="60">🎴</text>
      <text x="50%" y="95%" text-anchor="middle" fill="#666" font-family="Arial" font-size="12">Image not available</text>
    </svg>
  `);
});

export default router;
