/**
 * Students Parliament Nigeria - Portal Logic
 * Handles Card Retrieval and Navigation (Free-Tier Supabase Quota Optimized)
 */

document.addEventListener('DOMContentLoaded', () => {
  const btnShowRetrieve = document.getElementById('btnShowRetrieve');
  const btnCloseRetrieve = document.getElementById('btnCloseRetrieve');
  const searchInput = document.getElementById('portalSearchInput');
  const btnPortalSearch = document.getElementById('btnPortalSearch');
  const resultsContainer = document.getElementById('portalResultsList');
  const emptyState = document.getElementById('portalEmptyState');
  const retrieveModal = document.getElementById('retrieveModal') || document.getElementById('retrieveSection');

  function showInitialPrompt() {
    if (!resultsContainer) return;
    resultsContainer.innerHTML = `
      <div style="text-align: center; padding: 42px 18px; color: #64748b;">
        <svg width="46" height="46" fill="#94a3b8" viewBox="0 0 24 24" style="margin-bottom: 12px; display: inline-block;">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <h4 style="color: #1e293b; font-size: 1.05rem; font-weight: 700; margin-bottom: 6px;">Search Issued ID Cards</h4>
        <p style="font-size: 0.88rem; max-width: 360px; margin: 0 auto; line-height: 1.45; color: #64748b;">
          Type a member's Full Name or ID Number above, then click <strong>Search</strong> or hit Enter to look up their record.
        </p>
      </div>
    `;
    if (emptyState) emptyState.style.display = 'none';
  }

  function renderRecords(records = [], query = '', errorMsg = '') {
    if (!resultsContainer) return;
    resultsContainer.innerHTML = '';

    if (errorMsg) {
      if (emptyState) {
        emptyState.style.display = 'block';
        emptyState.querySelector('p').textContent = errorMsg;
      }
      return;
    }

    if (!records || records.length === 0) {
      if (emptyState) {
        emptyState.style.display = 'block';
        if (query) {
          emptyState.querySelector('p').textContent = `No cards found matching "${query}". Check the spelling or ID Number and try again.`;
        } else {
          emptyState.querySelector('p').textContent = 'Please enter a name or ID number to search.';
        }
      }
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    records.forEach(record => {
      const item = document.createElement('div');
      item.className = 'portal-record-item';

      const avatarSrc = record.photo || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="%2394a3b8"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

      item.innerHTML = `
        <div class="portal-record-info">
          <img src="${avatarSrc}" alt="Photo" class="portal-record-avatar">
          <div class="portal-record-details">
            <h4>${record.name || 'Unnamed Bearer'}</h4>
            <div class="portal-record-meta">
              <span class="portal-record-badge">${record.category || 'MEMBER'}</span>
              <span><strong>ID:</strong> ${record.id || 'N/A'}</span>
              <span><strong>State:</strong> ${record.state || 'N/A'}</span>
              <span><strong>Issued:</strong> ${record.dateIssued || 'N/A'}</span>
            </div>
          </div>
        </div>
        <div class="portal-record-actions">
          <button type="button" class="portal-record-btn portal-record-btn-load" data-id="${record.id}">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
            Load in Generator
          </button>
        </div>
      `;

      const btnLoad = item.querySelector('.portal-record-btn-load');
      btnLoad.addEventListener('click', () => {
        sessionStorage.setItem('spa_load_card', JSON.stringify(record));
        window.location.href = 'generator.html';
      });

      resultsContainer.appendChild(item);
    });
  }

  // Explicit On-Demand Search (Triggered ONLY when user clicks Search or presses Enter)
  async function executeSearch() {
    const q = (searchInput ? searchInput.value : '').trim();
    if (!q) {
      renderRecords([], '', 'Please type a Full Name or ID Number in the box above.');
      if (searchInput) searchInput.focus();
      return;
    }

    // Display targeted loading state
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 16px; color: #475569;">
          <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid #cbd5e1; border-top-color: #0b3d23; border-radius: 50%; animation: portalSpin 0.7s linear infinite; margin-bottom: 12px;"></div>
          <div style="font-weight: 700; color: #0f172a; font-size: 0.95rem;">Searching Database...</div>
          <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">Looking up records matching "${q}"</div>
        </div>
      `;
    }
    if (emptyState) emptyState.style.display = 'none';

    if (btnPortalSearch) {
      btnPortalSearch.disabled = true;
      btnPortalSearch.innerHTML = 'Searching...';
    }

    try {
      let records = [];
      if (window.CloudDB && typeof CloudDB.searchCards === 'function') {
        records = await CloudDB.searchCards(q);
      } else {
        const local = JSON.parse(localStorage.getItem('spa_card_records') || '[]');
        const qUpper = q.toUpperCase();
        records = local.filter(r => (r.id && r.id.toUpperCase().includes(qUpper)) || (r.name && r.name.toUpperCase().includes(qUpper)));
      }

      renderRecords(records, q);
    } catch (err) {
      console.warn('[Portal] Search query error:', err);
      renderRecords([], q, 'Could not complete search. Please verify your connection and try again.');
    } finally {
      if (btnPortalSearch) {
        btnPortalSearch.disabled = false;
        btnPortalSearch.innerHTML = `
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          Search
        `;
      }
    }
  }

  // Retrieve Modal Controls
  function openRetrieveModal() {
    if (!retrieveModal) return;
    showInitialPrompt();
    retrieveModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    if (searchInput) {
      searchInput.value = '';
      setTimeout(() => searchInput.focus(), 120);
    }
  }

  function closeRetrieveModal() {
    if (!retrieveModal) return;
    retrieveModal.classList.remove('is-open');
    document.body.style.overflow = '';
    if (btnShowRetrieve) {
      btnShowRetrieve.focus();
    }
  }

  if (btnShowRetrieve) {
    btnShowRetrieve.addEventListener('click', openRetrieveModal);
  }

  if (btnCloseRetrieve) {
    btnCloseRetrieve.addEventListener('click', closeRetrieveModal);
  }

  if (retrieveModal) {
    retrieveModal.addEventListener('click', (e) => {
      if (e.target === retrieveModal) {
        closeRetrieveModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && retrieveModal && retrieveModal.classList.contains('is-open')) {
      e.preventDefault();
      closeRetrieveModal();
    }
  });

  // Attach search triggers (Search button and Enter key) - NO real-time keystroke searching!
  if (btnPortalSearch) {
    btnPortalSearch.addEventListener('click', executeSearch);
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeSearch();
      }
    });
  }
});
