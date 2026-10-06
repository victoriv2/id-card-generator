/**
 * Students Parliament Nigeria - Administration Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const loginWrapper = document.getElementById('adminLoginWrapper');
  const dashboardWrapper = document.getElementById('adminDashboardWrapper');
  const loginForm = document.getElementById('adminLoginForm');
  const loginErrorMsg = document.getElementById('loginErrorMsg');
  const btnLogout = document.getElementById('btnAdminLogout');

  // Stats Elements
  const statTotalRegistered = document.getElementById('statTotalRegistered');
  const statTotalPaid = document.getElementById('statTotalPaid');
  const statTotalPending = document.getElementById('statTotalPending');
  const statTotalRevenue = document.getElementById('statTotalRevenue');
  const categoryPillsList = document.getElementById('categoryPillsList');

  // Controls Elements
  const inputPrice = document.getElementById('inputAdminPrice');
  const btnSavePrice = document.getElementById('btnSavePrice');
  const btnManualSync = document.getElementById('btnManualSyncCloud');
  const btnExportCSV = document.getElementById('btnExportCSV');
  const syncStatus = document.getElementById('cloudSyncStatus');

  const searchInput = document.getElementById('adminSearchInput');
  const filterCategory = document.getElementById('filterCategory');
  const filterPayment = document.getElementById('filterPayment');
  const sortOrder = document.getElementById('sortOrder');
  const tableBody = document.getElementById('adminTableBody');

  // -------------------------------------------------------------------------
  // Authentication (admin / admin123)
  // -------------------------------------------------------------------------
  function isAuthenticated() {
    return sessionStorage.getItem('spn_admin_session') === 'active';
  }

  function setAuthenticated(status) {
    if (status) {
      sessionStorage.setItem('spn_admin_session', 'active');
      loginWrapper.style.display = 'none';
      dashboardWrapper.style.display = 'block';
      loadDashboard();
    } else {
      sessionStorage.removeItem('spn_admin_session');
      loginWrapper.style.display = 'flex';
      dashboardWrapper.style.display = 'none';
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = document.getElementById('adminUsername').value.trim();
      const p = document.getElementById('adminPassword').value.trim();

      if (u === 'admin' && p === 'admin123') {
        if (loginErrorMsg) loginErrorMsg.style.display = 'none';
        setAuthenticated(true);
      } else {
        if (loginErrorMsg) loginErrorMsg.style.display = 'block';
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      setAuthenticated(false);
    });
  }

  // Check initial state
  if (isAuthenticated()) {
    setAuthenticated(true);
  } else {
    setAuthenticated(false);
  }

  // -------------------------------------------------------------------------
  // Dashboard Data Loading & Filtering
  // -------------------------------------------------------------------------
  function formatNaira(amount) {
    return new Intl.NumberFormat('en-NG').format(amount || 0);
  }

  let allCards = [];

  async function loadDashboard() {
    // 1. Load current price
    if (inputPrice) {
      inputPrice.value = CloudDB.getPrice();
    }

    // 2. Load cards from local + cloud
    allCards = CloudDB.getLocalCards();
    updateStatsAndRender();

    // Trigger background cloud sync
    try {
      if (syncStatus) syncStatus.textContent = '● Syncing with Cloud...';
      allCards = await CloudDB.loadFromCloud();
      if (syncStatus) syncStatus.textContent = '● Online & Synchronized';
      updateStatsAndRender();
    } catch (e) {
      if (syncStatus) syncStatus.textContent = '● Offline / Local Storage';
    }
  }

  function updateStatsAndRender() {
    const total = allCards.length;
    let paidCount = 0;
    let revenueSum = 0;
    const catMap = {};

    allCards.forEach(c => {
      const cat = (c.category || 'MEMBER').toUpperCase();
      catMap[cat] = (catMap[cat] || 0) + 1;

      if (c.isPaid) {
        paidCount++;
        revenueSum += (parseInt(c.amountPaid, 10) || CloudDB.getPrice());
      }
    });

    const pendingCount = total - paidCount;

    if (statTotalRegistered) statTotalRegistered.textContent = total.toLocaleString();
    if (statTotalPaid) statTotalPaid.textContent = paidCount.toLocaleString();
    if (statTotalPending) statTotalPending.textContent = pendingCount.toLocaleString();
    if (statTotalRevenue) statTotalRevenue.textContent = '₦' + formatNaira(revenueSum);

    // Category Pills
    if (categoryPillsList) {
      categoryPillsList.innerHTML = '';
      const defaultCats = ['STUDENT', 'TEACHER', 'EXECUTIVE', 'PARENT', 'OFFICIAL'];
      const allKnownCats = Array.from(new Set([...defaultCats, ...Object.keys(catMap)]));

      allKnownCats.forEach(cat => {
        const count = catMap[cat] || 0;
        const pill = document.createElement('div');
        pill.className = 'admin-cat-pill';
        pill.innerHTML = `<span>${cat}</span> <span class="count">${count}</span>`;
        categoryPillsList.appendChild(pill);
      });
    }

    renderTable();
  }

  function getFilteredAndSortedCards() {
    const query = (searchInput ? searchInput.value : '').trim().toUpperCase();
    const catFilter = filterCategory ? filterCategory.value : 'ALL';
    const payFilter = filterPayment ? filterPayment.value : 'ALL';
    const sortVal = sortOrder ? sortOrder.value : 'newest';

    return allCards.filter(c => {
      // Search
      const matchSearch = !query ||
        (c.name && c.name.toUpperCase().includes(query)) ||
        (c.id && c.id.toUpperCase().includes(query)) ||
        (c.school && c.school.toUpperCase().includes(query)) ||
        (c.state && c.state.toUpperCase().includes(query)) ||
        (c.paymentRef && c.paymentRef.toUpperCase().includes(query));

      if (!matchSearch) return false;

      // Category filter
      if (catFilter !== 'ALL') {
        const cat = (c.category || 'MEMBER').toUpperCase();
        if (cat !== catFilter) return false;
      }

      // Payment filter
      if (payFilter === 'PAID' && !c.isPaid) return false;
      if (payFilter === 'PENDING' && c.isPaid) return false;

      return true;
    }).sort((a, b) => {
      if (sortVal === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sortVal === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      if (sortVal === 'id_asc') return (a.id || '').localeCompare(b.id || '');
      if (sortVal === 'oldest') return (new Date(a.savedAt || 0)) - (new Date(b.savedAt || 0));
      // default newest
      return (new Date(b.savedAt || 0)) - (new Date(a.savedAt || 0));
    });
  }

  function renderTable() {
    if (!tableBody) return;
    const cards = getFilteredAndSortedCards();
    tableBody.innerHTML = '';

    if (cards.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 40px; color: #64748b;">
            <svg width="40" height="40" fill="currentColor" viewBox="0 0 24 24" style="opacity: 0.35; margin-bottom: 8px;"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
            <p style="margin: 0; font-weight: 600;">No member cards found matching current filters.</p>
          </td>
        </tr>
      `;
      return;
    }

    cards.forEach(card => {
      const tr = document.createElement('tr');
      const avatarSrc = card.photo && !card.photo.includes('[cached_locally]')
        ? card.photo
        : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="%2394a3b8"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

      const isPaid = !!card.isPaid;
      const statusBadge = isPaid
        ? `<span class="badge-paid"><svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> PAID</span>`
        : `<span class="badge-pending"><svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg> UNPAID</span>`;

      const paymentMeta = isPaid && card.paymentRef
        ? `<div style="font-size: 0.72rem; color: #64748b; margin-top: 3px;">Ref: ${card.paymentRef.substring(0, 14)}...</div>`
        : '';

      const amountDisplay = isPaid
        ? `₦${formatNaira(card.amountPaid || CloudDB.getPrice())}`
        : '—';

      tr.innerHTML = `
        <td><img src="${avatarSrc}" alt="Avatar" class="table-avatar"></td>
        <td>
          <div style="font-weight: 700; color: #0f172a;">${card.name || 'Unnamed'}</div>
          ${card.payerEmail ? `<div style="font-size: 0.75rem; color: #64748b;">${card.payerEmail}</div>` : ''}
        </td>
        <td><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${card.id || 'N/A'}</code></td>
        <td><span class="badge-category">${card.category || 'MEMBER'}</span></td>
        <td>${card.state || 'N/A'}</td>
        <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${card.school || ''}">${card.school || 'N/A'}</td>
        <td>${statusBadge}${paymentMeta}</td>
        <td><strong>${amountDisplay}</strong></td>
        <td style="white-space: nowrap; color: #64748b; font-size: 0.8rem;">${card.dateIssued || card.savedAt || 'N/A'}</td>
        <td>
          <div class="table-actions">
            <button type="button" class="btn-table-action btn-load-card" title="Load card in generator" data-id="${card.id}">
              Load
            </button>
            ${!isPaid ? `<button type="button" class="btn-table-action btn-mark-paid" title="Manually verify payment" data-id="${card.id}" style="color: #15803d; border-color: #86efac;">Mark Paid</button>` : ''}
            <button type="button" class="btn-table-action btn-table-delete btn-del-card" title="Delete record" data-id="${card.id}">
              Delete
            </button>
          </div>
        </td>
      `;

      // Bind actions
      const btnLoad = tr.querySelector('.btn-load-card');
      if (btnLoad) {
        btnLoad.addEventListener('click', () => {
          sessionStorage.setItem('spa_load_card', JSON.stringify(card));
          window.location.href = 'generator.html';
        });
      }

      const btnMarkPaid = tr.querySelector('.btn-mark-paid');
      if (btnMarkPaid) {
        btnMarkPaid.addEventListener('click', async () => {
          const ok = await showModalConfirm(`Mark ID Card "${card.id}" as PAID manually?`, {
            title: 'Verify Payment',
            confirmText: 'Yes, Mark Paid',
            type: 'warning'
          });
          if (ok) {
            await CloudDB.markCardPaid(card.id, {
              reference: `MANUAL-ADMIN-${Date.now()}`,
              amount: CloudDB.getPrice()
            });
            allCards = CloudDB.getLocalCards();
            updateStatsAndRender();
            showModalAlert(`Card ${card.id} has been marked as officially PAID.`, { type: 'success' });
          }
        });
      }

      const btnDel = tr.querySelector('.btn-del-card');
      if (btnDel) {
        btnDel.addEventListener('click', async () => {
          const ok = await showModalConfirm(`Are you sure you want to delete the record for ${card.name} (${card.id})? This cannot be undone.`, {
            title: 'Delete Card Record',
            confirmText: 'Yes, Delete',
            type: 'error'
          });
          if (ok) {
            allCards = await CloudDB.deleteCard(card.id);
            updateStatsAndRender();
            showModalAlert('Record deleted successfully.', { type: 'info' });
          }
        });
      }

      tableBody.appendChild(tr);
    });
  }

  // -------------------------------------------------------------------------
  // Filter & Search Event Listeners
  // -------------------------------------------------------------------------
  if (searchInput) searchInput.addEventListener('input', renderTable);
  if (filterCategory) filterCategory.addEventListener('change', renderTable);
  if (filterPayment) filterPayment.addEventListener('change', renderTable);
  if (sortOrder) sortOrder.addEventListener('change', renderTable);

  // -------------------------------------------------------------------------
  // Adjust Price
  // -------------------------------------------------------------------------
  if (btnSavePrice && inputPrice) {
    btnSavePrice.addEventListener('click', async () => {
      const newPrice = parseInt(inputPrice.value, 10);
      if (isNaN(newPrice) || newPrice < 100) {
        showModalAlert('Please enter a valid price (minimum ₦100).', { type: 'warning' });
        return;
      }

      await CloudDB.setPrice(newPrice);
      showModalAlert(`The official card issuance fee has been updated to ₦${formatNaira(newPrice)}. All generator downloads now reflect this price.`, {
        title: 'Price Updated',
        type: 'success'
      });
      loadDashboard();
    });
  }

  // -------------------------------------------------------------------------
  // Manual Cloud Sync
  // -------------------------------------------------------------------------
  if (btnManualSync) {
    btnManualSync.addEventListener('click', async () => {
      if (syncStatus) syncStatus.textContent = '● Syncing now...';
      try {
        await CloudDB.saveToCloud();
        allCards = await CloudDB.loadFromCloud();
        updateStatsAndRender();
        if (syncStatus) syncStatus.textContent = '● Online & Synchronized';
        showModalAlert('Database synchronized successfully with JSONBin Cloud!', { type: 'success' });
      } catch (err) {
        if (syncStatus) syncStatus.textContent = '● Sync error';
        showModalAlert('Could not synchronize: ' + (err.message || String(err)), { type: 'error' });
      }
    });
  }

  // -------------------------------------------------------------------------
  // Export to CSV
  // -------------------------------------------------------------------------
  if (btnExportCSV) {
    btnExportCSV.addEventListener('click', () => {
      if (allCards.length === 0) {
        showModalAlert('No records available to export.', { type: 'warning' });
        return;
      }

      const headers = ['Full Name', 'ID Number', 'Category', 'State', 'School', 'Payment Status', 'Amount Paid', 'Paystack Ref', 'Date Issued'];
      const rows = allCards.map(c => [
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${(c.id || '').replace(/"/g, '""')}"`,
        `"${(c.category || 'MEMBER').replace(/"/g, '""')}"`,
        `"${(c.state || '').replace(/"/g, '""')}"`,
        `"${(c.school || '').replace(/"/g, '""')}"`,
        `"${c.isPaid ? 'PAID' : 'UNPAID'}"`,
        `"${c.amountPaid || ''}"`,
        `"${(c.paymentRef || '').replace(/"/g, '""')}"`,
        `"${(c.dateIssued || c.savedAt || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `SPN-Card-Records-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
});
