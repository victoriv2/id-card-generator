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
  const btnExportExcel = document.getElementById('btnExportExcel');

  const searchInput = document.getElementById('adminSearchInput');
  const filterCategory = document.getElementById('filterCategory');
  const filterPayment = document.getElementById('filterPayment');
  const sortOrder = document.getElementById('sortOrder');
  const tableBody = document.getElementById('adminTableBody');

  // School / Chapter Directory Elements
  const formAddSchool = document.getElementById('formAddSchool');
  const inputNewSchoolName = document.getElementById('inputNewSchoolName');
  const selectNewSchoolCategory = document.getElementById('selectNewSchoolCategory');
  const filterSchoolCat = document.getElementById('filterSchoolCat');
  const adminSchoolsTableBody = document.getElementById('adminSchoolsTableBody');
  const schoolDirectoryCount = document.getElementById('schoolDirectoryCount');

  // Navigation Tabs Elements
  const tabButtons = document.querySelectorAll('.admin-tab-btn[data-tab]');
  const tabPanels = document.querySelectorAll('.admin-tab-panel');
  const tabBadgeRecords = document.getElementById('tabBadgeRecords');
  const tabBadgeSchools = document.getElementById('tabBadgeSchools');

  function switchTab(targetTabId) {
    tabButtons.forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === targetTabId;
      btn.classList.toggle('active', isTarget);
      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    tabPanels.forEach(panel => {
      const isTarget = panel.id === `tabPanel-${targetTabId}`;
      panel.classList.toggle('active', isTarget);
    });

    sessionStorage.setItem('spn_admin_active_tab', targetTabId);
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Restore active tab or default to overview
  const savedTab = sessionStorage.getItem('spn_admin_active_tab') || 'overview';
  switchTab(savedTab);

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
    btnLogout.addEventListener('click', async () => {
      const ok = await showModalConfirm('Are you sure you want to sign out of the Admin Panel?', {
        title: 'Sign Out',
        confirmText: 'Yes, Sign Out',
        cancelText: 'Stay',
        type: 'warning'
      });
      if (ok) {
        setAuthenticated(false);
      }
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

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
    await loadSchoolsDirectory();

    // Trigger background cloud sync
    try {
      if (syncStatus) syncStatus.textContent = '● Syncing with Cloud...';
      allCards = await CloudDB.loadFromCloud();
      if (syncStatus) syncStatus.textContent = '● Online & Synchronized';
      updateStatsAndRender();
      await loadSchoolsDirectory();
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
    if (tabBadgeRecords) tabBadgeRecords.textContent = total.toLocaleString();

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
  // Filter & Search Event Listeners & Modals
  // -------------------------------------------------------------------------
  if (searchInput) searchInput.addEventListener('input', renderTable);

  function setupAdminSelectModal(config) {
    const trigger = document.getElementById(config.triggerId);
    const textEl = document.getElementById(config.textId);
    const hiddenInput = document.getElementById(config.hiddenInputId);
    const modal = document.getElementById(config.modalId);
    const closeBtn = document.getElementById(config.closeBtnId);
    const optionsList = document.getElementById(config.optionsListId);
    if (!trigger || !modal) return;

    function openModal() {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }

    trigger.addEventListener('click', openModal);
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    if (optionsList) {
      optionsList.querySelectorAll('.simple-modal-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const val = btn.getAttribute('data-val');
          const label = btn.textContent.trim();
          optionsList.querySelectorAll('.simple-modal-option').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          if (hiddenInput) hiddenInput.value = val;
          if (textEl) textEl.textContent = label;

          closeModal();
          if (typeof config.onChange === 'function') {
            config.onChange(val);
          }
        });
      });
    }
  }

  // Records Category Filter Modal
  setupAdminSelectModal({
    triggerId: 'filterCategoryTrigger',
    textId: 'filterCategoryText',
    hiddenInputId: 'filterCategory',
    modalId: 'adminCatFilterModal',
    closeBtnId: 'btnCloseAdminCatFilterModal',
    optionsListId: 'adminCatFilterList',
    onChange: () => renderTable()
  });

  // Records Payment Filter Modal
  setupAdminSelectModal({
    triggerId: 'filterPaymentTrigger',
    textId: 'filterPaymentText',
    hiddenInputId: 'filterPayment',
    modalId: 'adminPayFilterModal',
    closeBtnId: 'btnCloseAdminPayFilterModal',
    optionsListId: 'adminPayFilterList',
    onChange: () => renderTable()
  });

  // Records Sort Order Modal
  setupAdminSelectModal({
    triggerId: 'sortOrderTrigger',
    textId: 'sortOrderText',
    hiddenInputId: 'sortOrder',
    modalId: 'adminSortModal',
    closeBtnId: 'btnCloseAdminSortModal',
    optionsListId: 'adminSortList',
    onChange: () => renderTable()
  });

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
  // Export Member Records to Excel Spreadsheet (.xlsx)
  // -------------------------------------------------------------------------
  if (btnExportExcel) {
    btnExportExcel.addEventListener('click', () => {
      const records = getFilteredAndSortedCards();
      if (!records || records.length === 0) {
        showModalAlert('No member records available to export with the current filter settings.', { type: 'warning' });
        return;
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `SPN-Member-Records-${timestamp}.xlsx`;

      // 1. Primary: SheetJS binary .xlsx export
      if (window.XLSX) {
        try {
          const excelData = records.map((c, i) => ({
            'S/N': i + 1,
            'Full Name': c.name || 'Unnamed',
            'ID Number': c.id || 'N/A',
            'Category': (c.category || 'MEMBER').toUpperCase(),
            'State': c.state || 'N/A',
            'School / Chapter / Branch': c.school || 'N/A',
            'Payment Status': c.isPaid ? 'PAID' : 'UNPAID',
            'Amount Paid (₦)': c.isPaid ? (parseInt(c.amountPaid, 10) || CloudDB.getPrice()) : 0,
            'Paystack Reference': c.paymentRef || 'N/A',
            'Payer Email': c.payerEmail || '',
            'Date Issued': c.dateIssued || c.savedAt || 'N/A'
          }));

          const worksheet = XLSX.utils.json_to_sheet(excelData);
          worksheet['!cols'] = [
            { wch: 6 },
            { wch: 28 },
            { wch: 18 },
            { wch: 14 },
            { wch: 16 },
            { wch: 34 },
            { wch: 16 },
            { wch: 18 },
            { wch: 24 },
            { wch: 28 },
            { wch: 20 }
          ];

          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Registered Members');
          XLSX.writeFile(workbook, filename);
          showModalAlert(`Successfully exported ${records.length} record(s) to Excel (.xlsx)!`, {
            title: 'Export Successful',
            type: 'success'
          });
          return;
        } catch (err) {
          console.warn('[ExportExcel] Error generating xlsx, falling back to CSV:', err);
        }
      }

      // 2. High-fidelity CSV Fallback with UTF-8 BOM (Excel opens directly with proper formatting)
      const headers = ['S/N', 'Full Name', 'ID Number', 'Category', 'State', 'School / Chapter / Branch', 'Payment Status', 'Amount Paid (NGN)', 'Paystack Reference', 'Payer Email', 'Date Issued'];
      const rows = records.map((c, i) => [
        i + 1,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${(c.id || '').replace(/"/g, '""')}"`,
        `"${(c.category || 'MEMBER').replace(/"/g, '""')}"`,
        `"${(c.state || '').replace(/"/g, '""')}"`,
        `"${(c.school || '').replace(/"/g, '""')}"`,
        `"${c.isPaid ? 'PAID' : 'UNPAID'}"`,
        `"${c.isPaid ? (c.amountPaid || CloudDB.getPrice()) : 0}"`,
        `"${(c.paymentRef || 'N/A').replace(/"/g, '""')}"`,
        `"${(c.payerEmail || '').replace(/"/g, '""')}"`,
        `"${(c.dateIssued || c.savedAt || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `SPN-Member-Records-${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showModalAlert(`Successfully exported ${records.length} record(s) to Excel spreadsheet format!`, {
        title: 'Export Successful',
        type: 'success'
      });
    });
  }

  // -------------------------------------------------------------------------
  // School / Chapter / Branch Directory Manager
  // -------------------------------------------------------------------------
  let allSchools = [];

  async function loadSchoolsDirectory() {
    if (!adminSchoolsTableBody) return;
    try {
      allSchools = await CloudDB.loadSchools();
    } catch (e) {
      allSchools = CloudDB.getLocalSchools();
    }
    renderSchoolsTable();
  }

  function renderSchoolsTable() {
    if (!adminSchoolsTableBody) return;
    const catFilter = filterSchoolCat ? filterSchoolCat.value : 'ALL';
    const filtered = allSchools.filter(s => {
      if (catFilter === 'ALL') return true;
      const cats = (s.category || '').toUpperCase().split(',').map(c => c.trim());
      return cats.includes(catFilter.toUpperCase());
    });

    if (schoolDirectoryCount) {
      schoolDirectoryCount.textContent = `${filtered.length} / ${allSchools.length} Total`;
    }
    if (tabBadgeSchools) {
      tabBadgeSchools.textContent = allSchools.length.toString();
    }

    if (filtered.length === 0) {
      adminSchoolsTableBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; color: #94a3b8; padding: 24px;">
            No schools or chapters found for the selected category.
          </td>
        </tr>
      `;
      return;
    }

    adminSchoolsTableBody.innerHTML = filtered.map(s => {
      const rawCat = (s.category || 'STUDENT').toUpperCase();
      const catList = rawCat.split(',').map(c => c.trim()).filter(Boolean);
      const badgesHtml = catList.map(c => {
        const badgeClass = c.toLowerCase();
        return `<span class="admin-school-cat-badge ${escapeHtml(badgeClass)}">${escapeHtml(c)}</span>`;
      }).join(' ');
      const idParam = s.id || s.name;
      return `
        <tr>
          <td style="font-weight: 700; color: #0f172a;">${escapeHtml(s.name)}</td>
          <td><div style="display: flex; flex-wrap: wrap; gap: 4px;">${badgesHtml}</div></td>
          <td style="text-align: center; white-space: nowrap;">
            <div style="display: inline-flex; gap: 6px; align-items: center; justify-content: center;">
              <button type="button" class="btn-edit-school" data-school-id="${escapeHtml(idParam)}" data-school-name="${escapeHtml(s.name)}" data-school-category="${escapeHtml(s.category || '')}" title="Edit school / chapter">
                Edit
              </button>
              <button type="button" class="btn-del-school" data-school-id="${escapeHtml(idParam)}" data-school-name="${escapeHtml(s.name)}" title="Delete from directory">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach edit listeners
    adminSchoolsTableBody.querySelectorAll('.btn-edit-school').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-school-id');
        const name = btn.getAttribute('data-school-name');
        const cat = btn.getAttribute('data-school-category');
        const target = allSchools.find(s => (s.id && s.id === id) || s.name === name) || { id, name, category: cat };
        openEditSchoolModal(target);
      });
    });

    // Attach delete listeners
    adminSchoolsTableBody.querySelectorAll('.btn-del-school').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-school-id');
        const name = btn.getAttribute('data-school-name');
        const ok = await showModalConfirm(`Are you sure you want to remove "${name}" from the directory?`, {
          title: 'Delete School / Chapter',
          confirmText: 'Yes, Remove',
          type: 'warning'
        });
        if (!ok) return;

        try {
          allSchools = await CloudDB.deleteSchool(id);
          renderSchoolsTable();
          showModalAlert(`"${name}" was successfully removed from the directory.`, { type: 'success' });
        } catch (err) {
          showModalAlert('Could not delete school: ' + (err.message || String(err)), { type: 'error' });
        }
      });
    });
  }

  // School Directory Category Filter Modal
  setupAdminSelectModal({
    triggerId: 'filterSchoolCatTrigger',
    textId: 'filterSchoolCatText',
    hiddenInputId: 'filterSchoolCat',
    modalId: 'adminSchoolCatFilterModal',
    closeBtnId: 'btnCloseAdminSchoolCatFilterModal',
    optionsListId: 'adminSchoolCatFilterList',
    onChange: () => renderSchoolsTable()
  });

  // -------------------------------------------------------------------------
  // Multi-Category Selection Modal (For Adding School / Chapter)
  // -------------------------------------------------------------------------
  const selectNewSchoolCategoryTrigger = document.getElementById('selectNewSchoolCategoryTrigger');
  const selectedNewSchoolCategoryText = document.getElementById('selectedNewSchoolCategoryText');
  const adminMultiCatModal = document.getElementById('adminMultiCatModal');
  const btnCloseAdminMultiCatModal = document.getElementById('btnCloseAdminMultiCatModal');
  const btnApplyAdminMultiCat = document.getElementById('btnApplyAdminMultiCat');
  const multiCatCheckboxes = document.querySelectorAll('#adminMultiCatOptionsList input[type="checkbox"]');

  function openMultiCatModal() {
    if (!adminMultiCatModal) return;
    const currentVal = (selectNewSchoolCategory ? selectNewSchoolCategory.value : 'STUDENT').toUpperCase();
    const currentCats = currentVal.split(',').map(c => c.trim());
    multiCatCheckboxes.forEach(cb => {
      cb.checked = currentCats.includes(cb.value.toUpperCase());
    });
    adminMultiCatModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeMultiCatModal() {
    if (adminMultiCatModal) adminMultiCatModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const allAdminModals = document.querySelectorAll('.modal-backdrop');
      allAdminModals.forEach(m => {
        m.style.display = 'none';
      });
      document.body.style.overflow = '';
    }
  });

  if (selectNewSchoolCategoryTrigger) {
    selectNewSchoolCategoryTrigger.addEventListener('click', openMultiCatModal);
    selectNewSchoolCategoryTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMultiCatModal();
      }
    });
  }

  if (btnCloseAdminMultiCatModal) {
    btnCloseAdminMultiCatModal.addEventListener('click', closeMultiCatModal);
  }

  if (adminMultiCatModal) {
    adminMultiCatModal.addEventListener('click', (e) => {
      if (e.target === adminMultiCatModal) closeMultiCatModal();
    });
  }

  if (btnApplyAdminMultiCat) {
    btnApplyAdminMultiCat.addEventListener('click', () => {
      const selected = Array.from(multiCatCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value.toUpperCase());

      if (selected.length === 0) {
        showModalAlert('Please select at least one category.', { type: 'warning' });
        return;
      }

      const combined = selected.join(', ');
      if (selectNewSchoolCategory) selectNewSchoolCategory.value = combined;
      if (selectedNewSchoolCategoryText) selectedNewSchoolCategoryText.textContent = combined;
      closeMultiCatModal();
    });
  }

  function resetNewSchoolForm() {
    if (inputNewSchoolName) inputNewSchoolName.value = '';
    if (selectNewSchoolCategory) selectNewSchoolCategory.value = 'STUDENT';
    if (selectedNewSchoolCategoryText) selectedNewSchoolCategoryText.textContent = 'STUDENT';
    multiCatCheckboxes.forEach(cb => {
      cb.checked = cb.value.toUpperCase() === 'STUDENT';
    });
  }

  if (formAddSchool) {
    formAddSchool.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (inputNewSchoolName ? inputNewSchoolName.value : '').trim().toUpperCase();
      const category = (selectNewSchoolCategory ? selectNewSchoolCategory.value : 'STUDENT').trim();

      if (!name) {
        showModalAlert('Please enter the School / Chapter name.', { type: 'warning' });
        if (inputNewSchoolName) inputNewSchoolName.focus();
        return;
      }

      try {
        await CloudDB.addSchool(name, category);
        resetNewSchoolForm();
        allSchools = await CloudDB.loadSchools();
        renderSchoolsTable();
        showModalAlert(`Successfully added "${name}" under [${category}]! Members will now see this in the ID card generator.`, {
          title: 'School Added',
          type: 'success'
        });
      } catch (err) {
        showModalAlert(err.message || 'Error adding school', { type: 'error' });
      }
    });
  }

  // -------------------------------------------------------------------------
  // Edit School / Chapter Modal Logic
  // -------------------------------------------------------------------------
  const adminEditSchoolModal = document.getElementById('adminEditSchoolModal');
  const btnCloseAdminEditSchoolModal = document.getElementById('btnCloseAdminEditSchoolModal');
  const btnCancelEditSchool = document.getElementById('btnCancelEditSchool');
  const btnSaveEditSchool = document.getElementById('btnSaveEditSchool');
  const inputEditSchoolName = document.getElementById('inputEditSchoolName');
  const editSchoolId = document.getElementById('editSchoolId');
  const editSchoolOldName = document.getElementById('editSchoolOldName');
  const editSchoolMultiCatCheckboxes = document.querySelectorAll('#editSchoolMultiCatOptionsList input[type="checkbox"]');

  function openEditSchoolModal(school) {
    if (!adminEditSchoolModal) return;
    const sId = school.id || school.name;
    const sName = school.name || '';
    const sCat = school.category || 'STUDENT';

    if (editSchoolId) editSchoolId.value = sId;
    if (editSchoolOldName) editSchoolOldName.value = sName;
    if (inputEditSchoolName) inputEditSchoolName.value = sName;

    const cats = sCat.toUpperCase().split(',').map(c => c.trim());
    editSchoolMultiCatCheckboxes.forEach(cb => {
      cb.checked = cats.includes(cb.value.toUpperCase());
    });

    adminEditSchoolModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    if (inputEditSchoolName) {
      setTimeout(() => {
        inputEditSchoolName.focus();
        inputEditSchoolName.select();
      }, 50);
    }
  }

  function closeEditSchoolModal() {
    if (adminEditSchoolModal) adminEditSchoolModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (btnCloseAdminEditSchoolModal) {
    btnCloseAdminEditSchoolModal.addEventListener('click', closeEditSchoolModal);
  }
  if (btnCancelEditSchool) {
    btnCancelEditSchool.addEventListener('click', closeEditSchoolModal);
  }
  if (adminEditSchoolModal) {
    adminEditSchoolModal.addEventListener('click', (e) => {
      if (e.target === adminEditSchoolModal) closeEditSchoolModal();
    });
  }

  async function handleSaveSchoolEdit() {
    const sId = editSchoolId ? editSchoolId.value : '';
    const oldName = editSchoolOldName ? editSchoolOldName.value : '';
    const newName = (inputEditSchoolName ? inputEditSchoolName.value : '').trim().toUpperCase();

    if (!newName) {
      showModalAlert('Please enter the School / Chapter name.', { type: 'warning' });
      if (inputEditSchoolName) inputEditSchoolName.focus();
      return;
    }

    const selectedCats = Array.from(editSchoolMultiCatCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value.toUpperCase());

    if (selectedCats.length === 0) {
      showModalAlert('Please select at least one category.', { type: 'warning' });
      return;
    }

    try {
      allSchools = await CloudDB.updateSchool(sId || oldName, newName, selectedCats);
      closeEditSchoolModal();
      renderSchoolsTable();
      showModalAlert(`"${newName}" was successfully updated!`, {
        title: 'School Updated',
        type: 'success'
      });
    } catch (err) {
      showModalAlert(err.message || 'Error updating school', { type: 'error' });
    }
  }

  if (btnSaveEditSchool) {
    btnSaveEditSchool.addEventListener('click', handleSaveSchoolEdit);
  }
  if (inputEditSchoolName) {
    inputEditSchoolName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveSchoolEdit();
      }
    });
  }
});

