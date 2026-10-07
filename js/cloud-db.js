/**
 * Students Parliament Nigeria - Cloud & Local Database Layer
 * Powered by Supabase Cloud Database (PostgreSQL) with offline LocalStorage fallback
 */

(function () {
  'use strict';

  const SUPABASE_URL = 'https://iooacyhvvwqcwvkfxmjt.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvb2FjeWh2dndxY3d2a2Z4bWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMTQ2MzIsImV4cCI6MjEwNjg5MDYzMn0.1vfrl4ZbdPIDlHqdi_PZxy-FGMOItKq91QFyMrbFXEs';
  const PAYSTACK_PUBLIC_KEY = 'pk_live_732d9b62cd035b8dad96e981d7f6982540342e80';
  const DEFAULT_PAYMENT_EMAIL = 'we.are.danithuga@gmail.com';
  const DEFAULT_PRICE_NGN = 1500;

  const STORAGE_KEYS = {
    RECORDS: 'spa_card_records',
    PRICE: 'spa_card_price_ngn',
    PAYWALL_ENABLED: 'spa_paywall_enabled',
    SCHOOLS: 'spa_schools_branches'
  };

  // No hardcoded ready-made schools. Only schools created by the Admin are shown.
  const DEFAULT_SCHOOLS = [];

  /**
   * Universal Supabase REST helper using PostgREST endpoints
   */
  async function supabaseRequest(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const res = await fetch(url, {
      ...options,
      headers
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Supabase error (${res.status}): ${errText}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    return null;
  }

  /**
   * Convert client camelCase card record to Supabase snake_case row
   */
  function toRow(c) {
    let savedIso = new Date().toISOString();
    try {
      if (c.savedAt || c.saved_at) {
        const d = new Date(c.savedAt || c.saved_at);
        if (!isNaN(d.getTime())) savedIso = d.toISOString();
      }
    } catch (e) {}

    let paidIso = null;
    try {
      if (c.paidAt || c.paid_at) {
        const d = new Date(c.paidAt || c.paid_at);
        if (!isNaN(d.getTime())) paidIso = d.toISOString();
      }
    } catch (e) {}

    const isFree = (c.amountPaid === 0 || c.paymentRef === 'FREE_ISSUANCE');
    const amountVal = isFree ? 0 : (c.amountPaid != null ? Number(c.amountPaid) : DEFAULT_PRICE_NGN);

    return {
      id: c.id,
      name: c.name || 'UNKNOWN',
      school: c.school || '',
      category: (c.category || 'STUDENT').toUpperCase(),
      state: c.state || '',
      date_issued: c.dateIssued || c.date_issued || '',
      status: c.status || 'ACTIVE',
      photo: c.photo || '',
      is_paid: !!(c.isPaid || c.is_paid),
      payment_ref: c.paymentRef || c.payment_ref || null,
      amount_paid: amountVal,
      payer_email: c.payerEmail || c.payer_email || null,
      paid_at: paidIso,
      saved_at: savedIso,
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Convert Supabase snake_case row to client camelCase card record
   */
  function fromRow(r) {
    const isFree = (r.amount_paid === 0 || r.payment_ref === 'FREE_ISSUANCE');
    return {
      id: r.id,
      name: r.name,
      school: r.school || '',
      category: (r.category || 'STUDENT').toUpperCase(),
      state: r.state || '',
      dateIssued: r.date_issued || '',
      status: r.status || 'ACTIVE',
      photo: r.photo || '',
      isPaid: !!r.is_paid,
      paymentRef: r.payment_ref || '',
      amountPaid: isFree ? 0 : (r.amount_paid != null ? Number(r.amount_paid) : DEFAULT_PRICE_NGN),
      payerEmail: r.payer_email || '',
      paidAt: r.paid_at || '',
      savedAt: r.saved_at || r.created_at || new Date().toISOString()
    };
  }

  const CloudDB = {
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    paystackPublicKey: PAYSTACK_PUBLIC_KEY,
    defaultPaymentEmail: DEFAULT_PAYMENT_EMAIL,

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

      try {
        await supabaseRequest('app_settings', {
          method: 'POST',
          headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify({
            key: 'card_price_ngn',
            value: p.toString(),
            updated_at: new Date().toISOString()
          })
        });
      } catch (err) {
        console.warn('[CloudDB] Supabase price sync skipped/deferred:', err);
      }

      return p;
    },

    // Paywall Gate Settings (Enabled / Disabled)
    isPaywallEnabled() {
      const stored = localStorage.getItem(STORAGE_KEYS.PAYWALL_ENABLED);
      if (stored !== null) {
        return stored !== 'false';
      }
      return true; // Default: Enabled (compulsory fee)
    },

    async setPaywallEnabled(enabled) {
      const isEnabled = !!enabled;
      localStorage.setItem(STORAGE_KEYS.PAYWALL_ENABLED, isEnabled ? 'true' : 'false');

      try {
        await supabaseRequest('app_settings', {
          method: 'POST',
          headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify({
            key: 'payment_wall_enabled',
            value: isEnabled ? 'true' : 'false',
            updated_at: new Date().toISOString()
          })
        });
      } catch (err) {
        console.warn('[CloudDB] Supabase paywall sync skipped/deferred:', err);
      }

      return isEnabled;
    },

    // -----------------------------------------------------------------------
    // Schools / Chapters / Branches Management
    // -----------------------------------------------------------------------
    getLocalSchools() {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.SCHOOLS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {}
      return DEFAULT_SCHOOLS.slice();
    },

    saveLocalSchools(schools) {
      localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
    },

    async getSchoolsByCategory(category) {
      const allSchools = await this.loadSchools();
      if (!category || category === 'ALL') return allSchools;
      const targetCat = category.toUpperCase().trim();
      return allSchools.filter(s => {
        const cats = (s.category || '').toUpperCase().split(',').map(c => c.trim());
        return cats.includes(targetCat);
      });
    },

    async loadSchools() {
      try {
        const res = await supabaseRequest('schools?select=*&order=name.asc');
        if (Array.isArray(res)) {
          const cloudMapped = res.map(r => ({
            id: r.id,
            name: r.name,
            category: (r.category || 'STUDENT').toUpperCase(),
            createdAt: r.created_at
          }));

          // Cloud database is the authoritative source of truth.
          // Directly overwrite local storage so deletions and factory resets take effect immediately.
          this.saveLocalSchools(cloudMapped);
          return cloudMapped;
        }
      } catch (err) {
        console.warn('[CloudDB] Supabase schools fetch deferred, using local cache:', err);
      }
      return this.getLocalSchools();
    },

    async addSchool(name, categories) {
      const cleanName = (name || '').trim().toUpperCase();
      let catsArray = Array.isArray(categories) ? categories : (categories ? String(categories).split(',') : ['STUDENT']);
      catsArray = catsArray.map(c => c.trim().toUpperCase()).filter(Boolean);
      if (catsArray.length === 0) catsArray = ['STUDENT'];
      const cleanCat = catsArray.join(', ');

      if (!cleanName) throw new Error('School/Chapter name is required');

      let current = this.getLocalSchools();
      const existingIdx = current.findIndex(s => s.name.toUpperCase() === cleanName);
      if (existingIdx >= 0) {
        const existing = current[existingIdx];
        if (existing.category.toUpperCase() !== cleanCat) {
          existing.category = cleanCat;
          this.saveLocalSchools(current);
          try {
            if (existing.id && !existing.id.startsWith('sch-')) {
              await supabaseRequest(`schools?id=eq.${encodeURIComponent(existing.id)}`, {
                method: 'PATCH',
                headers: { 'Prefer': 'return=representation' },
                body: JSON.stringify({ category: cleanCat })
              });
            }
          } catch (err) {
            console.warn('[CloudDB] Supabase school update deferred:', err);
          }
        }
        return existing;
      }

      const tempItem = {
        id: 'sch-' + Date.now(),
        name: cleanName,
        category: cleanCat,
        createdAt: new Date().toISOString()
      };

      current.push(tempItem);
      this.saveLocalSchools(current);

      try {
        const res = await supabaseRequest('schools', {
          method: 'POST',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify({
            name: cleanName,
            category: cleanCat
          })
        });
        if (Array.isArray(res) && res[0]) {
          // Replace temp id with real db id
          const idx = current.findIndex(s => s.id === tempItem.id);
          if (idx >= 0) {
            current[idx].id = res[0].id;
            this.saveLocalSchools(current);
          }
          return res[0];
        }
      } catch (err) {
        console.warn('[CloudDB] Supabase school creation deferred:', err);
      }

      return tempItem;
    },

    async updateSchool(idOrOldName, newName, categories) {
      const cleanName = (newName || '').trim().toUpperCase();
      let catsArray = Array.isArray(categories) ? categories : (categories ? String(categories).split(',') : ['STUDENT']);
      catsArray = catsArray.map(c => c.trim().toUpperCase()).filter(Boolean);
      if (catsArray.length === 0) catsArray = ['STUDENT'];
      const cleanCat = catsArray.join(', ');

      if (!cleanName) throw new Error('School/Chapter name cannot be empty');

      let current = this.getLocalSchools();
      const targetIdx = current.findIndex(s => s.id === idOrOldName || s.name.toUpperCase() === String(idOrOldName).toUpperCase());
      if (targetIdx === -1) {
        throw new Error('School/Chapter not found to update');
      }

      const nameConflict = current.find((s, idx) => idx !== targetIdx && s.name.toUpperCase() === cleanName);
      if (nameConflict) {
        throw new Error(`Another school/chapter with the name "${cleanName}" already exists.`);
      }

      const existing = current[targetIdx];
      const oldSchoolName = existing.name;
      existing.name = cleanName;
      existing.category = cleanCat;
      this.saveLocalSchools(current);

      try {
        if (existing.id && !existing.id.startsWith('sch-')) {
          await supabaseRequest(`schools?id=eq.${encodeURIComponent(existing.id)}`, {
            method: 'PATCH',
            headers: { 'Prefer': 'return=representation' },
            body: JSON.stringify({ name: cleanName, category: cleanCat })
          });
        } else {
          await supabaseRequest(`schools?name=eq.${encodeURIComponent(oldSchoolName)}`, {
            method: 'PATCH',
            headers: { 'Prefer': 'return=representation' },
            body: JSON.stringify({ name: cleanName, category: cleanCat })
          });
        }
      } catch (err) {
        console.warn('[CloudDB] Supabase school update deferred:', err);
      }

      return current;
    },

    async deleteSchool(idOrName) {
      let current = this.getLocalSchools();
      const toDelete = current.find(s => s.id === idOrName || s.name === idOrName);
      current = current.filter(s => s.id !== idOrName && s.name !== idOrName);
      this.saveLocalSchools(current);

      try {
        if (toDelete && toDelete.id && !toDelete.id.startsWith('sch-')) {
          await supabaseRequest(`schools?id=eq.${encodeURIComponent(toDelete.id)}`, {
            method: 'DELETE'
          });
        } else if (toDelete) {
          await supabaseRequest(`schools?name=eq.${encodeURIComponent(toDelete.name)}`, {
            method: 'DELETE'
          });
        }
      } catch (err) {
        console.warn('[CloudDB] Supabase school deletion deferred:', err);
      }

      return current;
    },

    // Local Storage Helpers
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

    isCardPaid(id) {
      if (!id) return false;
      const cards = this.getLocalCards();
      const card = cards.find(c => c.id === id);
      return !!(card && card.isPaid);
    },

    /**
     * Save or update a card record in LocalStorage and Supabase
     */
    async saveCard(record) {
      if (!record || !record.id) return;
      const cards = this.getLocalCards();
      const idx = cards.findIndex(c => c.id === record.id);

      let savedRecord;
      if (idx >= 0) {
        const existing = cards[idx];
        if (existing.isPaid) {
          record.isPaid = true;
          if (!record.paymentRef) record.paymentRef = existing.paymentRef;
          if (record.amountPaid === undefined || record.amountPaid === null) record.amountPaid = existing.amountPaid;
          if (!record.paidAt) record.paidAt = existing.paidAt;
        }
        Object.keys(record).forEach(k => {
          if (record[k] === undefined) delete record[k];
        });
        cards[idx] = { ...existing, ...record };
        savedRecord = cards[idx];
      } else {
        cards.unshift(record);
        savedRecord = record;
      }

      this.saveLocalCards(cards);

      // Async sync to Supabase
      try {
        await supabaseRequest('cards', {
          method: 'POST',
          headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify(toRow(savedRecord))
        });
      } catch (err) {
        console.warn('[CloudDB] Supabase card save deferred:', err);
      }
      return savedRecord;
    },

    /**
     * Mark a card as paid after Paystack success
     */
    async markCardPaid(id, paymentInfo = {}) {
      const cards = this.getLocalCards();
      const idx = cards.findIndex(c => c.id === id);
      const nowIso = new Date().toISOString();
      const paidData = {
        isPaid: true,
        paymentRef: paymentInfo.reference || `PAY-${Date.now()}`,
        amountPaid: paymentInfo.amount != null ? Number(paymentInfo.amount) : this.getPrice(),
        paidAt: nowIso,
        payerEmail: paymentInfo.email || ''
      };

      let fullRecord;
      if (idx >= 0) {
        cards[idx] = { ...cards[idx], ...paidData };
        fullRecord = cards[idx];
      } else {
        fullRecord = {
          id,
          ...paidData,
          savedAt: nowIso
        };
        cards.unshift(fullRecord);
      }

      this.saveLocalCards(cards);

      // Async sync payment update to Supabase
      try {
        await supabaseRequest(`cards?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify({
            is_paid: true,
            payment_ref: paidData.paymentRef,
            amount_paid: paidData.amountPaid,
            payer_email: paidData.payerEmail || null,
            paid_at: paidData.paidAt,
            updated_at: new Date().toISOString()
          })
        });
      } catch (err) {
        console.warn('[CloudDB] Supabase payment sync deferred:', err);
      }

      return fullRecord;
    },

    /**
     * Delete a card record locally and from Supabase
     */
    async deleteCard(id) {
      let cards = this.getLocalCards();
      cards = cards.filter(c => c.id !== id);
      this.saveLocalCards(cards);

      try {
        await supabaseRequest(`cards?id=eq.${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.warn('[CloudDB] Supabase delete deferred:', err);
      }

      return cards;
    },

    /**
     * Bulk save all local cards to Supabase (used for manual sync or initial migration)
     */
    async saveToCloud() {
      const localCards = this.getLocalCards();
      if (localCards.length > 0) {
        const rows = localCards.map(toRow);
        await supabaseRequest('cards', {
          method: 'POST',
          headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify(rows)
        });
      }

      await this.setPrice(this.getPrice());
    },

    /**
     * Load latest cards and settings from Supabase and merge with LocalStorage
     */
    async loadFromCloud() {
      try {
        // 1. Sync Settings (Price & Paywall Gate)
        const settingsRes = await supabaseRequest('app_settings?select=*').catch(() => null);
        if (Array.isArray(settingsRes)) {
          settingsRes.forEach(s => {
            if (s.key === 'card_price_ngn' && s.value) {
              const cloudPrice = parseInt(s.value, 10);
              if (!isNaN(cloudPrice)) {
                localStorage.setItem(STORAGE_KEYS.PRICE, cloudPrice.toString());
              }
            } else if (s.key === 'payment_wall_enabled' && s.value !== undefined) {
              localStorage.setItem(STORAGE_KEYS.PAYWALL_ENABLED, s.value === 'false' ? 'false' : 'true');
            }
          });
        }

        // 2. Fetch Cards from Supabase
        const cloudRows = await supabaseRequest('cards?select=*&order=saved_at.desc');
        if (Array.isArray(cloudRows)) {
          const cloudCards = cloudRows.map(fromRow);
          this.saveLocalCards(cloudCards);
          return cloudCards;
        }
      } catch (err) {
        console.warn('[CloudDB] Supabase load deferred, using local cache:', err);
      }

      return this.getLocalCards();
    },

    /**
     * Complete Factory Reset:
     * - Clears all cards/members in LocalStorage and Supabase
     * - Clears all schools/chapters/branches in LocalStorage and Supabase
     * - Resets card counter in LocalStorage
     * - Resets card price to DEFAULT_PRICE_NGN (1500) in LocalStorage and Supabase
     * - Restores payment wall to enabled
     */
    async factoryReset() {
      // 1. Wipe local storage
      localStorage.removeItem(STORAGE_KEYS.RECORDS);
      localStorage.removeItem(STORAGE_KEYS.SCHOOLS);
      localStorage.removeItem('spa_card_counter');
      localStorage.setItem(STORAGE_KEYS.PRICE, DEFAULT_PRICE_NGN.toString());
      localStorage.setItem(STORAGE_KEYS.PAYWALL_ENABLED, 'true');

      // 2. Wipe Supabase Cloud records
      try {
        await supabaseRequest('cards?id=not.is.null', { method: 'DELETE' });
      } catch (err) {
        console.warn('[CloudDB] Factory reset cards deletion error:', err);
      }

      try {
        await supabaseRequest('schools?id=not.is.null', { method: 'DELETE' });
      } catch (err) {
        console.warn('[CloudDB] Factory reset schools deletion error:', err);
      }

      try {
        await supabaseRequest('app_settings?key=eq.card_price_ngn', {
          method: 'PATCH',
          body: JSON.stringify({
            value: DEFAULT_PRICE_NGN.toString(),
            updated_at: new Date().toISOString()
          })
        });
      } catch (err) {
        console.warn('[CloudDB] Factory reset price update error:', err);
      }

      try {
        await supabaseRequest('app_settings?key=eq.payment_wall_enabled', {
          method: 'PATCH',
          body: JSON.stringify({
            value: 'true',
            updated_at: new Date().toISOString()
          })
        });
      } catch (err) {
        console.warn('[CloudDB] Factory reset paywall update error:', err);
      }

      return {
        cards: [],
        schools: [],
        price: DEFAULT_PRICE_NGN,
        paywallEnabled: true
      };
    }
  };

  window.CloudDB = CloudDB;
})();
