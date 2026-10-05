/**
 * Students Parliament Nigeria - Portal Logic
 * Handles Card Retrieval and Navigation
 */

document.addEventListener('DOMContentLoaded', () => {
  const btnShowRetrieve = document.getElementById('btnShowRetrieve');
  const retrieveSection = document.getElementById('retrieveSection');
  const btnCloseRetrieve = document.getElementById('btnCloseRetrieve');
  const searchInput = document.getElementById('portalSearchInput');
  const resultsContainer = document.getElementById('portalResultsList');
  const emptyState = document.getElementById('portalEmptyState');

  function getRecords() {
    try {
      return JSON.parse(localStorage.getItem('spa_card_records') || '[]');
    } catch (e) {
      return [];
    }
  }

  function renderRecords(query = '') {
    const records = getRecords();
    const q = query.trim().toUpperCase();

    const filtered = q
      ? records.filter(r => (r.id && r.id.toUpperCase().includes(q)) || (r.name && r.name.toUpperCase().includes(q)))
      : records;

    if (!resultsContainer) return;
    resultsContainer.innerHTML = '';

    if (filtered.length === 0) {
      if (emptyState) {
        emptyState.style.display = 'block';
        if (q) {
          emptyState.querySelector('p').textContent = `No cards found matching "${query}". Try searching by ID number or name.`;
        } else {
          emptyState.querySelector('p').textContent = 'No ID cards have been generated yet. Click "Generate New ID Card" to issue your first card.';
        }
      }
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    filtered.forEach(record => {
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

  // Retrieve Modal Controls
  const retrieveModal = document.getElementById('retrieveModal') || document.getElementById('retrieveSection');

  function openRetrieveModal() {
    if (!retrieveModal) return;
    renderRecords();
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

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderRecords(searchInput.value);
    });
  }
});
