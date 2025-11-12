// backend/src/services/deckImportService.js
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export default class DeckImportService {
  constructor(options = {}) {
    this.userAgent = options.userAgent || 'MTG-Duel-Commander-Bot/1.0 (+https://github.com/your-repo)';
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 24 * 60 * 60 * 1000; // 1 día
    this.lastRequestTime = 0;
    this.minRequestDelay = options.minRequestDelay || 120; // ms
    this.cacheFile = path.join(process.cwd(), 'data', 'card-cache.json');

    this.loadPersistentCache();
  }

  /* --------------------------- CACHE PERSISTENTE --------------------------- */
  loadPersistentCache() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
        for (const [k, v] of Object.entries(data)) {
          this.cache.set(k, { data: v, timestamp: Date.now() });
        }
        console.log(`[DeckImportService] ✅ Loaded ${this.cache.size} cached cards`);
      }
    } catch (err) {
      console.warn('[DeckImportService] ⚠️ Could not load cache file:', err.message);
    }
  }

  savePersistentCache() {
    try {
      const data = {};
      for (const [k, v] of this.cache.entries()) data[k] = v.data;
      fs.mkdirSync(path.dirname(this.cacheFile), { recursive: true });
      fs.writeFileSync(this.cacheFile, JSON.stringify(data, null, 2));
    } catch (err) {
      console.warn('[DeckImportService] ⚠️ Could not save cache file:', err.message);
    }
  }

  async waitForRateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minRequestDelay) {
      await new Promise(res => setTimeout(res, this.minRequestDelay - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  /* --------------------------- ENTRADA PRINCIPAL: solo texto --------------------------- */
  async importDeck(source) {
    try {
      // Solo soporte deckText (pegado). Import por URL eliminado intencionalmente.
      if (source && source.deckText) return await this.importFromText(source.deckText);
      throw new Error('Import by URL disabled. Please provide deckText with the decklist (one card per line like "2 Sol Ring").');
    } catch (err) {
      console.error('[DeckImportService] ❌ importDeck error:', err);
      return { success: false, error: err.message, cards: [] };
    }
  }

  /* --------------------------- IMPORT DESDE TEXTO --------------------------- */
  async importFromText(deckText) {
    try {
      if (!deckText || typeof deckText !== 'string') {
        throw new Error('deckText must be a non-empty string');
      }

      const lines = deckText
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => this.isValidCardLine(l));

      if (!lines.length) {
        console.log('[DeckImportService] ℹ️ No valid lines found in deckText');
        return { success: false, error: 'No valid card lines found', cards: [] };
      }

      const parsed = lines.map(l => this.parseCardLine(l));
      const cards = await this.fetchCardsFromParsed(parsed);

      // persist cache
      this.savePersistentCache();

      const validation = await this.validateDeck(cards);
      const warnings = this.analyzeDeck(cards);

      console.log(`[DeckImportService] ✅ Importadas ${cards.length} cartas (texto).`);
      return {
        success: true,
        cards,
        sideboard: [],
        totalCards: cards.length,
        warnings,
        validationErrors: validation.errors || []
      };
    } catch (err) {
      console.error('[DeckImportService] ❌ Text import failed:', err.message || err);
      return { success: false, error: err.message || String(err), cards: [] };
    }
  }

  /* --------------------------- HELPERS: parse / limpiar / extraer --------------------------- */
  isValidCardLine(line) {
    if (!line || line.trim() === '') return false;
    if (line.startsWith('//')) return false;
    if (/sideboard/i.test(line)) return true; // permitir sección si aparece
    return /^\d+/.test(line);
  }

  parseCardLine(line) {
    const m = line.match(/^(\d+)\s*x?\s*(.+)$/i);
    if (m) return { quantity: parseInt(m[1], 10), name: m[2].trim() };
    return { quantity: 1, name: line.trim() };
  }

  /* --------------------------- Resolución de cartas (Scryfall) --------------------------- */
  async fetchCardsFromParsed(parsedEntries) {
    const cards = [];
    const BATCH_SIZE = 8;

    for (let i = 0; i < parsedEntries.length; i += BATCH_SIZE) {
      const batch = parsedEntries.slice(i, i + BATCH_SIZE);

      const results = await Promise.all(batch.map(async entry => {
        if (!entry || !entry.name) return null;
        const c = await this.fetchCardData(entry.name);
        return { entry, c };
      }));

      for (const r of results) {
        if (!r || !r.c) continue;
        const { entry, c } = r;

        const image =
          c.image_uris?.normal ||
          c.card_faces?.[0]?.image_uris?.normal ||
          c.image ||
          `/api/card-image-placeholder?name=${encodeURIComponent(c.name || entry.name)}`;

        for (let j = 0; j < (entry.quantity || 1); j++) {
          cards.push({
            id: `${(c.id || c.name).toString().replace(/\s+/g, '_')}_${Date.now()}_${j}`,
            name: c.name || entry.name,
            manaCost: c.mana_cost || c.cmc || 0,
            type: c.type_line || c.type || '',
            text: c.oracle_text || c.text || '',
            power: c.power || 0,
            toughness: c.toughness || 0,
            colors: c.colors || [],
            image,
            isSideboard: false
          });
        }
      }

      // pequeña pausa entre batches para no spamear Scryfall
      await new Promise(r => setTimeout(r, 200));
    }

    return cards;
  }

  async fetchCardData(cardName) {
    try {
      const cacheKey = cardName.toLowerCase();
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) return cached.data;
      }

      await this.waitForRateLimit();

      const apiUrl = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`;
      let response;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await axios.get(apiUrl, {
            timeout: 10000,
            headers: { 'User-Agent': this.userAgent, 'Accept': 'application/json' }
          });
          break;
        } catch (err) {
          if (attempt === 3) throw err;
          if (err.response?.status === 429) {
            console.warn(`[DeckImportService] ⚠️ Rate limited when fetching "${cardName}", retrying...`);
            await new Promise(r => setTimeout(r, 1000 * attempt));
          } else {
            await new Promise(r => setTimeout(r, 300));
          }
        }
      }

      const card = response?.data;
      if (!card || !card.name) throw new Error(`Invalid card data for "${cardName}"`);

      this.cache.set(cacheKey, { data: card, timestamp: Date.now() });
      return card;
    } catch (err) {
      console.warn(`[DeckImportService] Failed to fetch card "${cardName}": ${err.message || err}`);
      // devolvemos objeto mínimo para que el front muestre placeholder
      return {
        name: cardName,
        id: `missing-${cardName}`.replace(/\s+/g, '_'),
        type: 'Unknown',
        image: `/api/card-image-placeholder?name=${encodeURIComponent(cardName)}`
      };
    }
  }

  /* --------------------------- VALIDACIÓN Y ANÁLISIS --------------------------- */
  async validateDeck(cards) {
    if (!cards) return { valid: false, errors: ['No cards'] };
    if (cards.length < 60) return { valid: false, errors: [`Deck must have at least 60 cards (has ${cards.length})`] };

    const names = cards.map(c => (c.name || '').toLowerCase());
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
    const uniqueDuplicates = [...new Set(duplicates)];

    const errors = [];
    for (const d of uniqueDuplicates) {
      const count = names.filter(n => n === d).length;
      if (count > 4 && !this.isBasicLand(d)) {
        errors.push(`Too many copies of ${d} (${count}, max 4)`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  isBasicLand(name) {
    if (!name) return false;
    const basic = ['plains', 'island', 'swamp', 'mountain', 'forest'];
    return basic.includes(name.toLowerCase());
  }

  analyzeDeck(cards) {
    const warnings = [];
    if (!cards || cards.length === 0) return warnings;

    let landCount = 0, creatureCount = 0, totalCmc = 0;
    for (const c of cards) {
      const type = (c.type_line || c.type || '').toLowerCase();
      if (type.includes('land')) landCount++;
      if (type.includes('creature')) creatureCount++;
      totalCmc += c.cmc || c.manaCost || 0;
    }

    const avg = cards.length ? totalCmc / cards.length : 0;
    if (landCount < 15) warnings.push(`Low land count (${landCount}).`);
    if (landCount > 30) warnings.push(`High land count (${landCount}).`);
    if (creatureCount < 10) warnings.push(`Low creature count (${creatureCount}).`);
    if (avg > 4) warnings.push(`High average mana cost (${avg.toFixed(1)}).`);
    if (avg < 2) warnings.push(`Low average mana cost (${avg.toFixed(1)}).`);

    return warnings;
  }
}
