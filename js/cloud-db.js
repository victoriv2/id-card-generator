/**
 * Students Parliament Nigeria - Cloud & Local Database Layer
 * Synchronizes card records and pricing settings between LocalStorage and JSONBin.io
 */

(function () {
  'use strict';

  const JSONBIN_MASTER_KEY = '$2a$10$nnSfeJQZY9FjkKghjfzlPuWFrIe/JV46TLSQbnho77T3kkmx/mMvK';
  const PAYSTACK_PUBLIC_KEY = 'pk_live_732d9b62cd035b8dad96e981d7f6982540342e80';
  const DEFAULT_PRICE_NGN = 1500;

  const STORAGE_KEYS = {
    RECORDS: 'spa_card_records',
    BIN_ID: 'spa_jsonbin_id',
    PRICE: 'spa_card_price_ngn',
    PAYSTACK_KEY: 'spa_paystack_key'
  };

  const CloudDB = {
    // Keys
    masterKey: JSONBIN_MASTER_KEY,
    paystackPublicKey: PAYSTACK_PUBLIC_KEY,

    getBinId() {
      return localStorage.getItem(STORAGE_KEYS.BIN_ID) || '';
    },

    setBinId(id) {
      if (id) localStorage.setItem(STORAGE_KEYS.BIN_ID, id.trim());
    },

    // Price Settings
    getPrice() {
      const stored = localStorage.getItem(STORAGE_KEYS.PRICE);
      if (stored && !isNaN(stored)) {
        return parseInt(stored, 10);
      }
      return DEFAULT_PRICE_NGN;
    },

    async setPrice(price) {
      const p = parseInt(price, 10) || DEFAULT_PRICE_NGN;
      localStorage.setItem(STORAGE_KEYS.PRICE, p.toString());
      await this.saveToCloud();
      return p;
    },

    // Local Card Records
    getLocalCards() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECORDS) || '[]');
      } catch (e) {
        return [];
      }
    },

    saveLocalCards(cards) {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(cards));
    },

    /**
     * Check if a card is paid
     * @param {string} id - Card ID
     * @returns {boolean}
     */
    isCardPaid(id) {
      if (!id) return false;
      const cards = this.getLocalCards();
      const card = cards.find(c => c.id === id);
      return !!(card && card.isPaid);
    },

    /**
     * Save or update a card record
     */
    async saveCard(record) {
      if (!record || !record.id) return;
      const cards = this.getLocalCards();
      const idx = cards.findIndex(c => c.id === record.id);
      
      if (idx >= 0) {
        // Preserve payment status if existing card was already paid
        if (cards[idx].isPaid && !record.isPaid) {
          record.isPaid = true;
          record.paymentRef = cards[idx].paymentRef || record.paymentRef;
          record.amountPaid = cards[idx].amountPaid || record.amountPaid;
          record.paidAt = cards[idx].paidAt || record.paidAt;
        }
        cards[idx] = { ...cards[idx], ...record };
      } else {
        cards.unshift(record);
      }

      this.saveLocalCards(cards);
      // Asynchronously trigger cloud backup
      this.saveToCloud().catch(err => console.warn('[CloudDB] Cloud sync skipped/failed:', err));
    },

    /**
     * Mark a card as paid after Paystack success
     */
    async markCardPaid(id, paymentInfo = {}) {
      const cards = this.getLocalCards();
      const idx = cards.findIndex(c => c.id === id);
      const paidData = {
        isPaid: true,
        paymentRef: paymentInfo.reference || `PAY-${Date.now()}`,
        amountPaid: paymentInfo.amount || this.getPrice(),
        paidAt: new Date().toLocaleString(),
        payerEmail: paymentInfo.email || ''
      };

      if (idx >= 0) {
        cards[idx] = { ...cards[idx], ...paidData };
      } else {
        cards.unshift({
          id,
          ...paidData,
          savedAt: new Date().toLocaleString()
        });
      }

      this.saveLocalCards(cards);
      await this.saveToCloud();
      return cards.find(c => c.id === id);
    },

    /**
     * Delete a card record
     */
    async deleteCard(id) {
      let cards = this.getLocalCards();
      cards = cards.filter(c => c.id !== id);
      this.saveLocalCards(cards);
      await this.saveToCloud();
      return cards;
    },

    // -----------------------------------------------------------------------
    // Cloud Synchronization via JSONBin.io v3
    // -----------------------------------------------------------------------

    /**
     * Save all local cards and current settings to JSONBin
     */
    async saveToCloud() {
      const binId = this.getBinId();
      const payload = {
        settings: {
          price: this.getPrice(),
          currency: 'NGN',
          updatedAt: new Date().toISOString()
        },
        cards: this.getLocalCards().map(c => {
          // Keep cloud payload lightweight: strip full high-res base64 photo if too big (>50KB)
          // to conserve JSONBin storage limit, but keep preview thumbnail
          if (c.photo && c.photo.length > 60000) {
            return { ...c, photo: c.photo.substring(0, 100) + '...[cached_locally]' };
          }
          return c;
        })
      };

      if (!binId) {
        // Create new bin
        try {
          const res = await fetch('https://api.jsonbin.io/v3/b', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Master-Key': this.masterKey,
              'X-Bin-Name': 'spn_id_cards_db',
              'X-Bin-Private': 'true'
            },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const data = await res.json();
            if (data.metadata && data.metadata.id) {
              this.setBinId(data.metadata.id);
              console.log('[CloudDB] New Cloud Bin Created:', data.metadata.id);
            }
          }
        } catch (e) {
          console.warn('[CloudDB] Could not create new bin:', e);
        }
      } else {
        // Update existing bin
        try {
          await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Master-Key': this.masterKey
            },
            body: JSON.stringify(payload)
          });
        } catch (e) {
          console.warn('[CloudDB] Cloud update failed:', e);
        }
      }
    },

    /**
     * Fetch latest cards and settings from JSONBin and merge with local storage
     */
    async loadFromCloud() {
      const binId = this.getBinId();
      if (!binId) return this.getLocalCards();

      try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
          method: 'GET',
          headers: {
            'X-Master-Key': this.masterKey
          }
        });

        if (res.ok) {
          const data = await res.json();
          const cloudRecord = data.record || {};

          // Sync price setting if found
          if (cloudRecord.settings && cloudRecord.settings.price) {
            localStorage.setItem(STORAGE_KEYS.PRICE, cloudRecord.settings.price.toString());
          }

          // Merge cloud cards with local cards
          const cloudCards = Array.isArray(cloudRecord.cards) ? cloudRecord.cards : [];
          const localCards = this.getLocalCards();
          const mergedMap = new Map();

          // Add local first
          localCards.forEach(c => mergedMap.set(c.id, c));

          // Merge cloud (giving priority to paid status and newest info)
          cloudCards.forEach(c => {
            if (!mergedMap.has(c.id)) {
              mergedMap.set(c.id, c);
            } else {
              const existing = mergedMap.get(c.id);
              mergedMap.set(c.id, {
                ...c,
                ...existing,
                isPaid: existing.isPaid || c.isPaid,
                paymentRef: existing.paymentRef || c.paymentRef,
                // Preserve local photo if cloud was stripped
                photo: (existing.photo && !existing.photo.includes('[cached_locally]')) ? existing.photo : c.photo
              });
            }
          });

          const finalCards = Array.from(mergedMap.values());
          this.saveLocalCards(finalCards);
          return finalCards;
        }
      } catch (err) {
        console.warn('[CloudDB] Could not load from cloud:', err);
      }

      return this.getLocalCards();
    }
  };

  // Export globally
  window.CloudDB = CloudDB;
})();
