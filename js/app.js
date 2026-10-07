/**
 * Students Parliament Nigeria - ID Card Generator
 * Real-time Front & Back generation with authentic templates
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Form Input Elements ---
  const inputName = document.getElementById('inputName');
  const inputSchool = document.getElementById('inputSchool');
  const inputId = document.getElementById('inputId');
  const inputCategory = document.getElementById('inputCategory');
  const inputState = document.getElementById('inputState');
  const inputDateIssued = document.getElementById('inputDateIssued');
  const inputStatus = document.getElementById('inputStatus');
  const btnResetAll = document.getElementById('btnResetAll');

  // --- Category Simple Modal Elements ---
  const categoryTrigger = document.getElementById('categoryTrigger');
  const selectedCategoryText = document.getElementById('selectedCategoryText');
  const categoryModal = document.getElementById('categoryModal');
  const btnCloseCategoryModal = document.getElementById('btnCloseCategoryModal');
  const simpleModalOptions = document.querySelectorAll('.simple-modal-option[data-cat]');

  // --- School / Chapter Modal Elements ---
  const schoolTrigger = document.getElementById('schoolTrigger');
  const selectedSchoolText = document.getElementById('selectedSchoolText');
  const schoolModal = document.getElementById('schoolModal');
  const schoolModalTitle = document.getElementById('schoolModalTitle');
  const btnCloseSchoolModal = document.getElementById('btnCloseSchoolModal');
  const schoolSearchInput = document.getElementById('schoolSearchInput');
  const btnSchoolSearchClear = document.getElementById('btnSchoolSearchClear');
  const schoolOptionsList = document.getElementById('schoolOptionsList');
  const schoolEmptyState = document.getElementById('schoolEmptyState');

  // --- State Simple Modal Elements (with Search) ---
  const stateTrigger = document.getElementById('stateTrigger');
  const selectedStateText = document.getElementById('selectedStateText');
  const stateModal = document.getElementById('stateModal');
  const btnCloseStateModal = document.getElementById('btnCloseStateModal');
  const stateSearchInput = document.getElementById('stateSearchInput');
  const btnStateSearchClear = document.getElementById('btnStateSearchClear');
  const stateOptionsList = document.getElementById('stateOptionsList');
  const stateEmptyState = document.getElementById('stateEmptyState');
  const stateModalOptions = document.querySelectorAll('.state-modal-option');

  // --- Photo Upload & Controls ---
  const dropzone = document.getElementById('dropzone');
  const passportFile = document.getElementById('passportFile');
  const passportImg = document.getElementById('passportImg');
  const passportEmptyHint = document.getElementById('passportEmptyHint');
  const photoAdjustBox = document.getElementById('photoAdjustBox');
  const photoScaleRange = document.getElementById('photoScaleRange');
  const photoPanXRange = document.getElementById('photoPanXRange');
  const photoPanYRange = document.getElementById('photoPanYRange');
  const scaleLabel = document.getElementById('scaleLabel');
  const btnResetPhoto = document.getElementById('btnResetPhoto');

  // --- Overlay View Elements (Front Card Stage) ---
  const viewName = document.getElementById('viewName');
  const viewSchool = document.getElementById('viewSchool');
  const viewId = document.getElementById('viewId');
  const viewCategory = document.getElementById('viewCategory');
  const viewDateIssued = document.getElementById('viewDateIssued');
  const viewState = document.getElementById('viewState');
  const viewStatusBadge = document.getElementById('viewStatusBadge');
  const qrBox = document.getElementById('qrBox');
  const cardStageFront = document.getElementById('cardStageFront');
  const cardStageBack = document.getElementById('cardStageBack');

  // --- Columns & View Toggles ---
  const colFront = document.getElementById('colFront');
  const colBack = document.getElementById('colBack');
  const tabBoth = document.getElementById('tabBoth');
  const tabFront = document.getElementById('tabFront');
  const tabBack = document.getElementById('tabBack');

  // --- Action Buttons ---
  const btnDownloadFrontPNG = document.getElementById('btnDownloadFrontPNG');
  const btnDownloadBackPNG = document.getElementById('btnDownloadBackPNG');
  const btnDownloadFrontJPEG = document.getElementById('btnDownloadFrontJPEG');
  const btnDownloadBackJPEG = document.getElementById('btnDownloadBackJPEG');
  const btnDownloadBothPDF = document.getElementById('btnDownloadBothPDF');
  const btnPrintCard = document.getElementById('btnPrintCard');
  const toastNotice = document.getElementById('toastNotice');

  // --- Category Code Mapping ---
  const CATEGORY_CODES = {
    'STUDENT': 'STU',
    'TEACHER': 'TEA',
    'EXECUTIVE': 'EXE',
    'PARENT': 'PAR',
    'OFFICIAL': 'OFF'
  };

  let currentScale = 1;
  let currentPanX = 0;
  let currentPanY = 0;
  let hasPassport = false;

  // -------------------------------------------------------------------------
  // Automatic Credential System (Dates, Category-Linked ID, Sequential Counter)
  // -------------------------------------------------------------------------
  function getSystemDates() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateIssued = `${day}/${month}/${year}`;
    const year2Digits = String(year).slice(-2);
    return { dateIssued, year2Digits };
  }

  function getCardSequenceNumber() {
    const saved = localStorage.getItem('spa_card_counter');
    const num = saved ? parseInt(saved, 10) : 1;
    return isNaN(num) || num < 1 ? 1 : num;
  }

  function advanceCardSequence() {
    const current = getCardSequenceNumber();
    const next = current + 1;
    localStorage.setItem('spa_card_counter', next.toString());
  }

  function advanceCardSequenceIfCurrent(cardId) {
    if (!cardId) return;
    const currentSeqStr = String(getCardSequenceNumber()).padStart(3, '0');
    if (cardId.endsWith(`/${currentSeqStr}`)) {
      advanceCardSequence();
    }
  }

  function updateAutoCredentials() {
    const { dateIssued, year2Digits } = getSystemDates();
    const cat = inputCategory ? inputCategory.value.trim() : '';

    if (inputDateIssued) {
      if (activeVerifiedCard && normalizeField(activeVerifiedCard.category) === normalizeField(cat) && activeVerifiedCard.dateIssued) {
        inputDateIssued.value = activeVerifiedCard.dateIssued;
      } else {
        inputDateIssued.value = dateIssued;
      }
    }

    if (inputId) {
      if (activeVerifiedCard && normalizeField(activeVerifiedCard.category) === normalizeField(cat) && activeVerifiedCard.id) {
        inputId.value = activeVerifiedCard.id;
      } else if (cat && CATEGORY_CODES[cat]) {
        const catCode = CATEGORY_CODES[cat];
        const seq = String(getCardSequenceNumber()).padStart(3, '0');
        inputId.value = `SPA/ID/${catCode}/${year2Digits}/${seq}`;
      } else {
        inputId.value = '';
      }
    }
  }

  // -------------------------------------------------------------------------
  // Toast Helper
  // -------------------------------------------------------------------------
  function notify(text) {
    if (!toastNotice) return;
    toastNotice.textContent = text;
    toastNotice.classList.add('show');
    setTimeout(() => toastNotice.classList.remove('show'), 2600);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // -------------------------------------------------------------------------
  // Photo Transform (Zoom & Pan) with Aspect-Ratio Protection
  // -------------------------------------------------------------------------
  function fitPassportImage(imgElement) {
    if (!imgElement || !imgElement.naturalWidth || !imgElement.naturalHeight) return;
    const nw = imgElement.naturalWidth;
    const nh = imgElement.naturalHeight;
    const imgAR = nw / nh;
    // Box on official card is 2160 x 2480 = 0.871
    const boxAR = 2160 / 2480;

    if (imgAR >= boxAR) {
      // Photo is wider than box: fill height (100%), width auto (extends evenly, centered)
      imgElement.style.width = 'auto';
      imgElement.style.height = '100%';
      imgElement.style.maxWidth = 'none';
      imgElement.style.maxHeight = 'none';
    } else {
      // Photo is taller than box: fill width (100%), height auto (extends evenly, centered)
      imgElement.style.width = '100%';
      imgElement.style.height = 'auto';
      imgElement.style.maxWidth = 'none';
      imgElement.style.maxHeight = 'none';
    }
  }

  function applyPhotoTransform() {
    if (!passportImg || !hasPassport) return;
    passportImg.style.transform = `translate(calc(-50% + ${currentPanX}px), calc(-50% + ${currentPanY}px)) scale(${currentScale})`;
  }

  function resetPhotoFraming() {
    currentScale = 1;
    currentPanX = 0;
    currentPanY = 0;
    if (photoScaleRange) photoScaleRange.value = 100;
    if (scaleLabel) scaleLabel.textContent = '100%';
    if (photoPanXRange) photoPanXRange.value = 0;
    if (photoPanYRange) photoPanYRange.value = 0;
    applyPhotoTransform();
  }

  if (btnResetPhoto) {
    btnResetPhoto.addEventListener('click', () => {
      resetPhotoFraming();
      notify('Photo framing reset to default');
    });
  }

  // -------------------------------------------------------------------------
  // Dynamic QR Code Generation (Lower-Right White Box)
  // -------------------------------------------------------------------------
  function renderQrCode() {
    if (!qrBox) return;

    const idVal = inputId ? inputId.value.trim() : '';
    const nameVal = inputName ? inputName.value.trim() : '';
    const catVal = inputCategory ? inputCategory.value.trim() : '';
    const stateVal = inputState ? inputState.value.trim() : '';
    const statusVal = inputStatus ? inputStatus.value : 'ACTIVE';

    if (!idVal && !nameVal) {
      qrBox.innerHTML = '<div class="qr-empty-hint"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 2h2v3h-2v-3zm2 3h2v3h-2v-3zm3-1h3v2h-3v-2zm0 3h3v2h-3v-2zm-5 0h2v2h-2v-2z"/></svg><span>QR CODE</span></div>';
      return;
    }

    qrBox.innerHTML = '';
    const qrText = `STUDENTS PARLIAMENT NIGERIA\nID: ${idVal || 'N/A'}\nName: ${nameVal || 'N/A'}\nCategory: ${catVal || 'N/A'}\nState: ${stateVal || 'N/A'}\nStatus: ${statusVal}`;

    try {
      if (typeof QRCode !== 'undefined') {
        new QRCode(qrBox, {
          text: qrText,
          width: 120,
          height: 120,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    } catch (err) {
      console.warn('QR Code error:', err);
    }
  }

  // -------------------------------------------------------------------------
  // Auto-Fitting Typography for Bearer Name and School (Same Font Size)
  // -------------------------------------------------------------------------
  function autoFitBearerText() {
    const bearerBlock = document.getElementById('bearerBlock');
    if (!bearerBlock || !viewName || !viewSchool) return;

    const hasSchool = !!(viewSchool.textContent && viewSchool.textContent.trim().length > 0);
    let nameSize = hasSchool ? 3.35 : 3.85;
    let schoolSize = 2.35;

    viewName.style.fontSize = `${nameSize}cqw`;
    viewName.style.lineHeight = '1.1';
    viewSchool.style.fontSize = `${schoolSize}cqw`;
    viewSchool.style.lineHeight = '1.1';

    // Measure allocated bounds
    const maxH = bearerBlock.clientHeight;
    const maxW = bearerBlock.clientWidth;
    if (!maxH || !maxW) return;

    const blockStyle = window.getComputedStyle(bearerBlock);
    const gap = parseFloat(blockStyle.gap || blockStyle.rowGap || '0') || 0;

    // Only shrink if there is actual physical overflow of container height or width
    let attempts = 0;
    while (attempts < 30) {
      const currentH = (viewName.offsetHeight || 0) + (hasSchool ? (viewSchool.offsetHeight || 0) + gap : 0);
      const currentW = Math.max(viewName.scrollWidth || 0, hasSchool ? (viewSchool.scrollWidth || 0) : 0);

      if (currentH <= maxH && currentW <= maxW) {
        break; // Fits inside boundary!
      }

      if (nameSize > 1.8) {
        nameSize -= 0.08;
        viewName.style.fontSize = `${nameSize.toFixed(2)}cqw`;
        if (hasSchool && schoolSize > 1.4) {
          schoolSize -= 0.05;
          viewSchool.style.fontSize = `${schoolSize.toFixed(2)}cqw`;
        }
      } else {
        break;
      }
      attempts++;
    }
  }

  // -------------------------------------------------------------------------
  // Real-Time Overlay Sync
  // -------------------------------------------------------------------------
  function syncOverlay() {
    // 1. Full Name
    const name = inputName ? inputName.value.trim() : '';
    if (viewName) {
      viewName.textContent = name;
    }

    // 2. School / Branch (formatted as (NAME))
    const school = inputSchool ? inputSchool.value.trim() : '';
    if (viewSchool) {
      if (school) {
        const cleanSchool = school.replace(/^\(|\)$/g, '');
        viewSchool.textContent = `(${cleanSchool})`;
      } else {
        viewSchool.textContent = '';
      }
    }

    // Auto-fit typography to container space
    autoFitBearerText();

    // 3. ID Number
    if (viewId) {
      viewId.textContent = (inputId && inputId.value) ? inputId.value : '';
    }

    // 4. Category
    if (viewCategory) {
      viewCategory.textContent = (inputCategory && inputCategory.value) ? inputCategory.value : '';
    }

    // 5. Date Issued
    if (viewDateIssued && inputDateIssued) {
      viewDateIssued.textContent = inputDateIssued.value;
    }

    // 6. State
    if (viewState) {
      viewState.textContent = (inputState && inputState.value) ? inputState.value : '';
    }

    // 7. Status Badge (Always ACTIVE)
    if (viewStatusBadge) {
      viewStatusBadge.textContent = 'ACTIVE';
      viewStatusBadge.className = 'overlay-status-badge';
    }

    // 8. Dynamic QR Code
    renderQrCode();

    // 9. Real-Time Payment Wall Authorization Sync
    if (typeof updatePaywallState === 'function') {
      updatePaywallState();
    }
  }

  // Event listeners for inputs
  if (inputName) {
    inputName.addEventListener('input', syncOverlay);
  }
  if (inputSchool) {
    inputSchool.addEventListener('input', syncOverlay);
  }
  if (inputCategory) {
    inputCategory.addEventListener('change', () => {
      updateAutoCredentials();
      syncOverlay();
      notify(`Category updated to ${inputCategory.value}`);
    });
  }

  // --- Simple Category Modal Logic ---
  function openCategoryModal() {
    if (!categoryModal) return;
    categoryModal.style.display = 'flex';
  }

  function closeCategoryModal() {
    if (!categoryModal) return;
    categoryModal.style.display = 'none';
  }

  if (categoryTrigger) {
    categoryTrigger.addEventListener('click', openCategoryModal);
    categoryTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openCategoryModal();
      }
    });
  }

  if (btnCloseCategoryModal) {
    btnCloseCategoryModal.addEventListener('click', closeCategoryModal);
  }

  if (categoryModal) {
    categoryModal.addEventListener('click', (e) => {
      if (e.target === categoryModal) {
        closeCategoryModal();
      }
    });
  }

  // --- Simple State Modal Logic (Searchable) ---
  function openStateModal() {
    if (!stateModal) return;
    stateModal.style.display = 'flex';
    if (stateSearchInput) {
      stateSearchInput.value = '';
      setTimeout(() => stateSearchInput.focus(), 60);
    }
    if (btnStateSearchClear) btnStateSearchClear.style.display = 'none';
    if (stateEmptyState) stateEmptyState.style.display = 'none';
    if (stateModalOptions) {
      stateModalOptions.forEach(opt => opt.style.display = '');
    }
    const currentActive = stateOptionsList ? stateOptionsList.querySelector('.active') : null;
    if (currentActive) {
      currentActive.scrollIntoView({ block: 'nearest' });
    }
  }

  function closeStateModal() {
    if (!stateModal) return;
    stateModal.style.display = 'none';
  }

  if (stateTrigger) {
    stateTrigger.addEventListener('click', openStateModal);
    stateTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openStateModal();
      }
    });
  }

  if (btnCloseStateModal) {
    btnCloseStateModal.addEventListener('click', closeStateModal);
  }

  if (stateModal) {
    stateModal.addEventListener('click', (e) => {
      if (e.target === stateModal) {
        closeStateModal();
      }
    });
  }

  // --- Simple School Modal Logic (Filtered by Category & Searchable) ---
  let cachedSchoolsList = [];

  async function openSchoolModal() {
    if (!schoolModal) return;
    const cat = inputCategory ? inputCategory.value.trim().toUpperCase() : '';
    if (!cat) {
      showModalAlert('Please select your Category / Role first before choosing your School / Chapter / Branch.', {
        title: 'Select Category First',
        type: 'warning'
      });
      openCategoryModal();
      return;
    }

    if (schoolModalTitle) {
      schoolModalTitle.textContent = `Select ${cat} School / Chapter`;
    }

    schoolModal.style.display = 'flex';
    if (schoolSearchInput) {
      schoolSearchInput.value = '';
      setTimeout(() => schoolSearchInput.focus(), 60);
    }
    if (btnSchoolSearchClear) btnSchoolSearchClear.style.display = 'none';

    // Fetch and filter schools for selected category
    try {
      if (window.CloudDB && typeof CloudDB.getSchoolsByCategory === 'function') {
        cachedSchoolsList = await CloudDB.getSchoolsByCategory(cat);
      } else {
        cachedSchoolsList = [];
      }
    } catch (e) {
      cachedSchoolsList = [];
    }

    renderSchoolOptions('');
  }

  function closeSchoolModal() {
    if (!schoolModal) return;
    schoolModal.style.display = 'none';
  }

  function renderSchoolOptions(query) {
    if (!schoolOptionsList) return;
    const cleanQ = (query || '').trim().toUpperCase();
    const currentSelected = inputSchool ? inputSchool.value.trim().toUpperCase() : '';

    const matches = cachedSchoolsList.filter(s => {
      if (!cleanQ) return true;
      return (s.name || '').toUpperCase().includes(cleanQ);
    });

    if (matches.length === 0) {
      schoolOptionsList.innerHTML = '';
      if (schoolEmptyState) {
        schoolEmptyState.style.display = 'block';
        schoolEmptyState.textContent = cleanQ 
          ? `No school or chapter matching "${cleanQ}".`
          : 'No schools or chapters registered under this category yet. Contact Admin.';
      }
      return;
    }

    if (schoolEmptyState) schoolEmptyState.style.display = 'none';

    schoolOptionsList.innerHTML = matches.map(s => {
      const isAct = currentSelected === (s.name || '').toUpperCase() ? 'active' : '';
      return `<button type="button" class="simple-modal-option school-modal-option ${isAct}" data-school="${escapeHtml(s.name)}">${escapeHtml(s.name)}</button>`;
    }).join('');

    // Attach click handlers to rendered options
    schoolOptionsList.querySelectorAll('.school-modal-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const schName = btn.getAttribute('data-school');
        if (inputSchool) inputSchool.value = schName;
        if (selectedSchoolText) {
          selectedSchoolText.textContent = schName;
          selectedSchoolText.classList.remove('placeholder-text');
        }

        schoolOptionsList.querySelectorAll('.school-modal-option').forEach(o => o.classList.remove('active'));
        btn.classList.add('active');

        closeSchoolModal();
        syncOverlay();
        notify(`Selected: ${schName}`);
      });
    });
  }

  if (schoolTrigger) {
    schoolTrigger.addEventListener('click', openSchoolModal);
    schoolTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openSchoolModal();
      }
    });
  }

  if (btnCloseSchoolModal) {
    btnCloseSchoolModal.addEventListener('click', closeSchoolModal);
  }

  if (schoolModal) {
    schoolModal.addEventListener('click', (e) => {
      if (e.target === schoolModal) {
        closeSchoolModal();
      }
    });
  }

  if (schoolSearchInput) {
    schoolSearchInput.addEventListener('input', () => {
      const q = schoolSearchInput.value.trim();
      if (btnSchoolSearchClear) {
        btnSchoolSearchClear.style.display = q.length > 0 ? 'flex' : 'none';
      }
      renderSchoolOptions(q);
    });
  }

  if (btnSchoolSearchClear) {
    btnSchoolSearchClear.addEventListener('click', () => {
      if (schoolSearchInput) {
        schoolSearchInput.value = '';
        schoolSearchInput.focus();
      }
      btnSchoolSearchClear.style.display = 'none';
      renderSchoolOptions('');
    });
  }

  // Global Escape key to dismiss active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (categoryModal && categoryModal.style.display === 'flex') {
        closeCategoryModal();
      }
      if (schoolModal && schoolModal.style.display === 'flex') {
        closeSchoolModal();
      }
      if (stateModal && stateModal.style.display === 'flex') {
        closeStateModal();
      }
    }
  });

  // State Search Filter
  if (stateSearchInput) {
    stateSearchInput.addEventListener('input', () => {
      const query = stateSearchInput.value.trim().toUpperCase();
      if (btnStateSearchClear) {
        btnStateSearchClear.style.display = query.length > 0 ? 'flex' : 'none';
      }

      let matchCount = 0;
      if (stateModalOptions) {
        stateModalOptions.forEach(opt => {
          const text = opt.textContent.toUpperCase();
          if (text.includes(query)) {
            opt.style.display = '';
            matchCount++;
          } else {
            opt.style.display = 'none';
          }
        });
      }

      if (stateEmptyState) {
        stateEmptyState.style.display = matchCount === 0 ? 'block' : 'none';
      }
    });
  }

  // Clear search input
  if (btnStateSearchClear) {
    btnStateSearchClear.addEventListener('click', () => {
      if (stateSearchInput) {
        stateSearchInput.value = '';
        stateSearchInput.focus();
      }
      btnStateSearchClear.style.display = 'none';
      if (stateEmptyState) stateEmptyState.style.display = 'none';
      if (stateModalOptions) {
        stateModalOptions.forEach(opt => opt.style.display = '');
      }
    });
  }

  // State Option Selection
  if (stateModalOptions && stateModalOptions.length > 0) {
    stateModalOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        const st = opt.getAttribute('data-state');
        if (inputState) inputState.value = st;
        if (selectedStateText) {
          selectedStateText.textContent = st;
          selectedStateText.classList.remove('placeholder-text');
        }

        stateModalOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');

        closeStateModal();
        syncOverlay();
        notify(`State selected: ${st}`);
      });
    });
  }

  if (simpleModalOptions && simpleModalOptions.length > 0) {
    simpleModalOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        const cat = opt.getAttribute('data-cat');
        if (inputCategory) inputCategory.value = cat;
        if (selectedCategoryText) {
          selectedCategoryText.textContent = cat;
          selectedCategoryText.classList.remove('placeholder-text');
        }

        simpleModalOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');

        // Reset school or restore if switching back to verified card's registered category
        if (activeVerifiedCard && normalizeField(activeVerifiedCard.category) === normalizeField(cat) && activeVerifiedCard.school) {
          if (inputSchool) inputSchool.value = activeVerifiedCard.school;
          if (selectedSchoolText) {
            selectedSchoolText.textContent = activeVerifiedCard.school;
            selectedSchoolText.classList.remove('placeholder-text');
          }
        } else if (inputSchool && inputSchool.value) {
          inputSchool.value = '';
          if (selectedSchoolText) {
            selectedSchoolText.textContent = `Select ${cat} School / Chapter`;
            selectedSchoolText.classList.add('placeholder-text');
          }
        }

        closeCategoryModal();
        updateAutoCredentials();
        syncOverlay();
        notify(`Category selected: ${cat}`);
      });
    });
  }

  if (inputStatus) {
    inputStatus.addEventListener('change', syncOverlay);
  }

  // -------------------------------------------------------------------------
  // Passport Photo Upload Handler & Drag-and-Drop
  // -------------------------------------------------------------------------
  if (dropzone && passportFile) {
    dropzone.addEventListener('click', () => passportFile.click());

    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        processUploadedImage(files[0]);
      }
    });

    passportFile.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        processUploadedImage(e.target.files[0]);
      }
    });
  }

  function processUploadedImage(file) {
    if (!file.type.startsWith('image/')) {
      showModalAlert('Please upload a valid image file (JPG, PNG, WEBP).', {
        title: 'Invalid File Type',
        type: 'warning'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      passportImg.onload = () => {
        fitPassportImage(passportImg);
        resetPhotoFraming();
      };
      passportImg.src = e.target.result;
      passportImg.style.display = 'block';
      if (passportEmptyHint) passportEmptyHint.style.display = 'none';

      hasPassport = true;
      if (photoAdjustBox) photoAdjustBox.style.display = 'flex';

      notify('Passport photo added to card!');
    };
    reader.readAsDataURL(file);
  }

  // Zoom & Pan Sliders
  if (photoScaleRange) {
    photoScaleRange.addEventListener('input', (e) => {
      currentScale = parseInt(e.target.value, 10) / 100;
      if (scaleLabel) scaleLabel.textContent = `${e.target.value}%`;
      applyPhotoTransform();
    });
  }

  if (photoPanXRange) {
    photoPanXRange.addEventListener('input', (e) => {
      currentPanX = parseInt(e.target.value, 10);
      applyPhotoTransform();
    });
  }

  if (photoPanYRange) {
    photoPanYRange.addEventListener('input', (e) => {
      currentPanY = parseInt(e.target.value, 10);
      applyPhotoTransform();
    });
  }

  // -------------------------------------------------------------------------
  // View Tabs: Both Sides, Front, Back
  // -------------------------------------------------------------------------
  if (tabBoth && tabFront && tabBack) {
    tabBoth.addEventListener('click', () => {
      tabBoth.classList.add('active');
      tabFront.classList.remove('active');
      tabBack.classList.remove('active');
      if (colFront) colFront.style.display = 'flex';
      if (colBack) colBack.style.display = 'flex';
      autoFitBearerText();
    });

    tabFront.addEventListener('click', () => {
      tabFront.classList.add('active');
      tabBoth.classList.remove('active');
      tabBack.classList.remove('active');
      if (colFront) colFront.style.display = 'flex';
      if (colBack) colBack.style.display = 'none';
      autoFitBearerText();
    });

    tabBack.addEventListener('click', () => {
      tabBack.classList.add('active');
      tabBoth.classList.remove('active');
      tabFront.classList.remove('active');
      if (colFront) colFront.style.display = 'none';
      if (colBack) colBack.style.display = 'flex';
    });

    window.addEventListener('resize', autoFitBearerText);
  }

  // -------------------------------------------------------------------------
  // Reset Form (Clear Name & School, Reset Photo, Keep Auto Credentials)
  // -------------------------------------------------------------------------
  if (btnResetAll) {
    btnResetAll.addEventListener('click', async () => {
      if (typeof showModalConfirm === 'function') {
        const confirmed = await showModalConfirm('Are you sure you want to reset all form fields and start fresh?', {
          title: 'Reset Form',
          confirmText: 'Yes, Reset',
          cancelText: 'Cancel',
          type: 'warning'
        });
        if (!confirmed) return;
      }
      if (inputName) inputName.value = '';
      if (inputSchool) inputSchool.value = '';
      if (selectedSchoolText) {
        selectedSchoolText.textContent = 'Select School / Chapter / Branch';
        selectedSchoolText.classList.add('placeholder-text');
      }
      if (inputCategory) inputCategory.value = '';
      if (selectedCategoryText) {
        selectedCategoryText.textContent = 'Select Category';
        selectedCategoryText.classList.add('placeholder-text');
      }
      if (simpleModalOptions && simpleModalOptions.length > 0) {
        simpleModalOptions.forEach(o => o.classList.remove('active'));
      }
      if (inputState) inputState.value = '';
      if (selectedStateText) {
        selectedStateText.textContent = 'Select State';
        selectedStateText.classList.add('placeholder-text');
      }
      if (stateModalOptions && stateModalOptions.length > 0) {
        stateModalOptions.forEach(o => o.classList.remove('active'));
      }
      if (inputId) inputId.value = '';
      if (inputStatus) inputStatus.value = 'ACTIVE';

      hasPassport = false;
      resetPhotoFraming();

      passportImg.src = '';
      passportImg.style.display = 'none';
      if (passportEmptyHint) passportEmptyHint.style.display = 'flex';
      if (photoAdjustBox) photoAdjustBox.style.display = 'none';

      activeVerifiedCard = null;
      try { sessionStorage.removeItem('spa_active_verified_card'); } catch (e) {}

      updateAutoCredentials();
      syncOverlay();
      notify('Form cleared.');
    });
  }

  // -------------------------------------------------------------------------
  // Quality Selection State (Low, Standard, High)
  // -------------------------------------------------------------------------
  let selectedQuality = 'standard';
  const qualityPills = document.querySelectorAll('.quality-pill-btn');

  function setQuality(quality) {
    if (!quality) return;
    selectedQuality = quality.toLowerCase();

    // Update inline bar pills
    qualityPills.forEach(pill => {
      if (pill.dataset.quality === selectedQuality) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  // Handle inline quality bar pill clicks
  qualityPills.forEach(pill => {
    pill.addEventListener('click', () => {
      setQuality(pill.dataset.quality);
      const label = selectedQuality === 'high' ? 'HIGH (Ultra-HD)' : (selectedQuality === 'low' ? 'LOW (Fast / Web)' : 'STANDARD (High-Res)');
      notify(`Quality: ${label}`);
    });
  });

  // -------------------------------------------------------------------------
  // Base64 Pre-Encoded Card Templates Initialization
  // (Ensures 100% offline, zero-taint canvas download on file:// and web servers)
  // -------------------------------------------------------------------------
  const cardBgFront = document.getElementById('cardBgFront') || (cardStageFront ? cardStageFront.querySelector('.card-bg-template') : null);
  const cardBgBack = document.getElementById('cardBgBack') || (cardStageBack ? cardStageBack.querySelector('.card-bg-template') : null);

  function ensureTemplatesLoaded() {
    if (window.CARD_TEMPLATES) {
      if (cardBgFront && window.CARD_TEMPLATES.front && (!cardBgFront.src || !cardBgFront.src.startsWith('data:'))) {
        cardBgFront.src = window.CARD_TEMPLATES.front;
      }
      if (cardBgBack && window.CARD_TEMPLATES.back && (!cardBgBack.src || !cardBgBack.src.startsWith('data:'))) {
        cardBgBack.src = window.CARD_TEMPLATES.back;
      }
    }
  }
  ensureTemplatesLoaded();

  // -------------------------------------------------------------------------
  // High-Resolution Card Export Functions (PNG, JPEG, PDF, Print)
  // -------------------------------------------------------------------------
  function getSanitizedId() {
    return (inputId && inputId.value.trim() ? inputId.value.trim() : 'card').replace(/[\/\\]/g, '-');
  }

  function getRawId() {
    return inputId && inputId.value.trim() ? inputId.value.trim() : '';
  }

  function normalizeId(id) {
    return (id || '').trim().toUpperCase().replace(/[-_]/g, '/');
  }

  function getQualityParams(quality) {
    switch (quality) {
      case 'low':
        return { scale: 1.5, jpegQuality: 0.75, label: 'LOW' };
      case 'high':
        return { scale: 3.5, jpegQuality: 0.98, label: 'HIGH' };
      case 'standard':
      default:
        return { scale: 2.5, jpegQuality: 0.90, label: 'STANDARD' };
    }
  }

  function triggerDownload(dataUrl, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) link.parentNode.removeChild(link);
    }, 300);
  }

  async function renderStageToCanvas(stageElement, scale, isJpeg) {
    if (!stageElement) throw new Error('Target card element not found');

    ensureTemplatesLoaded();
    if (hasPassport && passportImg) {
      fitPassportImage(passportImg);
      applyPhotoTransform();
    }

    // If the stage's column is hidden (tab view), temporarily unhide offscreen
    const col = stageElement.closest('.card-column');
    const wasHidden = col && (window.getComputedStyle(col).display === 'none');
    const savedStyles = {};

    if (wasHidden) {
      ['display', 'position', 'left', 'top', 'visibility', 'opacity'].forEach(prop => {
        savedStyles[prop] = col.style[prop];
      });
      Object.assign(col.style, {
        display: 'flex',
        position: 'fixed',
        left: '-9999px',
        top: '0px',
        visibility: 'visible',
        opacity: '1'
      });
      // Force layout recalculation
      col.offsetHeight;
    }

    try {
      const canvas = await html2canvas(stageElement, {
        scale: scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: isJpeg ? '#ffffff' : null
      });
      return canvas;
    } finally {
      if (wasHidden && col) {
        Object.keys(savedStyles).forEach(prop => {
          col.style[prop] = savedStyles[prop];
        });
      }
    }
  }

  async function exportCardAsImage(element, filename, format = 'png') {
    if (typeof html2canvas === 'undefined') {
      showModalAlert('Rendering library is loading. Please wait a moment and try again.', {
        title: 'Rendering Initializing',
        type: 'info'
      });
      return;
    }

    const { scale, jpegQuality, label } = getQualityParams(selectedQuality);
    notify(`Rendering ${format.toUpperCase()} (${label})...`);

    try {
      const canvas = await renderStageToCanvas(element, scale, format === 'jpeg');
      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const dataUrl = canvas.toDataURL(mimeType, jpegQuality);

      if (!dataUrl || dataUrl === 'data:,') {
        throw new Error('Canvas export produced empty data');
      }

      triggerDownload(dataUrl, filename);
      notify(`Download complete: ${filename}`);
    } catch (err) {
      console.error('[ID Card] Download error:', err);
      showModalAlert('Could not render image: ' + (err.message || String(err)), {
        title: 'Export Failed',
        type: 'error'
      });
    }
  }

  async function exportCardAsPdf() {
    if (typeof html2canvas === 'undefined' || !window.jspdf) {
      showModalAlert('PDF Export libraries are initializing. Please wait a moment.', {
        title: 'PDF Initializing',
        type: 'info'
      });
      return;
    }

    const { scale, jpegQuality, label } = getQualityParams(selectedQuality);
    notify(`Generating PDF (${label})...`);

    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [54, 85.6]
      });

      // 1. Render Front Side
      const canvasFront = await renderStageToCanvas(cardStageFront, scale, true);
      const imgFront = canvasFront.toDataURL('image/jpeg', jpegQuality);
      pdf.addImage(imgFront, 'JPEG', 0, 0, 54, 85.6);

      // 2. Render Back Side
      pdf.addPage([54, 85.6], 'portrait');
      const canvasBack = await renderStageToCanvas(cardStageBack, scale, true);
      const imgBack = canvasBack.toDataURL('image/jpeg', jpegQuality);
      pdf.addImage(imgBack, 'JPEG', 0, 0, 54, 85.6);

      const id = getSanitizedId();
      const filename = `ID-Card-${id}-${selectedQuality}.pdf`;
      pdf.save(filename);
      notify(`PDF Download complete: ${filename}`);
    } catch (err) {
      console.error('[ID Card] PDF export error:', err);
      showModalAlert('Could not export PDF: ' + (err.message || String(err)), {
        title: 'PDF Export Failed',
        type: 'error'
      });
    }
  }

  function printCards() {
    notify(`Opening print dialog (${selectedQuality.toUpperCase()})...`);
    // Ensure both sides are visible for printing
    if (colFront) colFront.style.display = 'flex';
    if (colBack) colBack.style.display = 'flex';
    if (tabBoth) {
      tabBoth.classList.add('active');
      if (tabFront) tabFront.classList.remove('active');
      if (tabBack) tabBack.classList.remove('active');
    }
    setTimeout(() => {
      window.print();
    }, 250);
  }

  // -------------------------------------------------------------------------
  // Card Record Persistence & Real-Time Verified Card State
  // -------------------------------------------------------------------------
  let activeVerifiedCard = null;

  try {
    const rawActive = sessionStorage.getItem('spa_active_verified_card');
    if (rawActive) {
      activeVerifiedCard = JSON.parse(rawActive);
    }
  } catch (e) {}

  function normalizeField(val) {
    return (val || '').trim().replace(/\s+/g, ' ').toUpperCase();
  }

  function getActiveVerifiedCard() {
    const currentId = getRawId();
    if (!currentId) return null;
    const cleanId = normalizeId(currentId);

    if (activeVerifiedCard && activeVerifiedCard.id && normalizeId(activeVerifiedCard.id) === cleanId) {
      return activeVerifiedCard;
    }
    if (window.CloudDB && typeof CloudDB.getCardById === 'function') {
      const found = CloudDB.getCardById(cleanId);
      if (found && (found.isPaid || found.paymentRef === 'FREE_ISSUANCE' || found.amountPaid === 0 || found.amountPaid === '0')) {
        return found;
      }
    } else if (window.CloudDB && typeof CloudDB.getLocalCards === 'function') {
      const cards = CloudDB.getLocalCards() || [];
      const found = cards.find(c => c.id && normalizeId(c.id) === cleanId && (c.isPaid || c.paymentRef === 'FREE_ISSUANCE' || c.amountPaid === 0 || c.amountPaid === '0'));
      if (found) return found;
    }
    return null;
  }

  /**
   * Evaluates if the current form card matches an authorized registered card.
   * If any detail (e.g. removing 'l' from 'Daniel') is modified, authorization is revoked
   * and the payment wall immediately returns until the exact registered data is restored.
   */
  function checkCardAuthorization() {
    const isPaywallActive = window.CloudDB && typeof CloudDB.isPaywallEnabled === 'function'
      ? CloudDB.isPaywallEnabled()
      : true;

    // When payment wall is globally disabled by Admin, issuance is free for all
    if (!isPaywallActive) {
      return { isAuthorized: true, isFreeMode: true, card: null };
    }

    const verifiedCard = getActiveVerifiedCard();
    if (!verifiedCard) {
      return { isAuthorized: false, isFreeMode: false, card: null };
    }

    const formName = normalizeField(inputName ? inputName.value : '');
    const registeredName = normalizeField(verifiedCard.name);

    if (!formName || formName !== registeredName) {
      // Name was altered (e.g. Daniel -> Danie)! Re-lock behind paywall
      return { isAuthorized: false, isFreeMode: false, card: verifiedCard, mismatch: 'name' };
    }

    const formCat = normalizeField(inputCategory ? inputCategory.value : '');
    const registeredCat = normalizeField(verifiedCard.category);
    if (formCat !== registeredCat) {
      return { isAuthorized: false, isFreeMode: false, card: verifiedCard, mismatch: 'category' };
    }

    const formSchool = normalizeField(inputSchool ? inputSchool.value : '');
    const registeredSchool = normalizeField(verifiedCard.school);
    if (formSchool !== registeredSchool) {
      return { isAuthorized: false, isFreeMode: false, card: verifiedCard, mismatch: 'school' };
    }

    const formState = normalizeField(inputState ? inputState.value : '');
    const registeredState = normalizeField(verifiedCard.state);
    if (formState !== registeredState) {
      return { isAuthorized: false, isFreeMode: false, card: verifiedCard, mismatch: 'state' };
    }

    return { isAuthorized: true, isFreeMode: false, card: verifiedCard };
  }

  function saveCardRecord() {
    const id = inputId ? inputId.value.trim() : '';
    const name = inputName ? inputName.value.trim() : '';
    if (!id && !name) return;

    const school = inputSchool ? inputSchool.value.trim() : '';
    const category = inputCategory ? inputCategory.value.trim() : '';
    const state = inputState ? inputState.value.trim() : '';
    const dateIssued = inputDateIssued ? inputDateIssued.value.trim() : '';
    const photo = hasPassport && passportImg ? passportImg.src : '';

    const isPaywallActive = window.CloudDB && typeof CloudDB.isPaywallEnabled === 'function'
      ? CloudDB.isPaywallEnabled()
      : true;

    const existingCard = getActiveVerifiedCard();
    const existingPaid = !!(existingCard && (existingCard.isPaid || existingCard.paymentRef === 'FREE_ISSUANCE' || existingCard.amountPaid === 0 || existingCard.amountPaid === '0'));
    const isFreeMode = !isPaywallActive;
    const isPaid = existingPaid || isFreeMode;

    let paymentRef = null;
    let amountPaid = undefined;
    let paidAt = null;

    if (existingPaid) {
      paymentRef = existingCard.paymentRef || null;
      amountPaid = existingCard.amountPaid;
      paidAt = existingCard.paidAt || null;
    } else if (isFreeMode) {
      paymentRef = 'FREE_ISSUANCE';
      amountPaid = 0;
      paidAt = new Date().toISOString();
    }

    const record = {
      id: id || `SPA/ID/${Date.now()}`,
      name: name || 'UNKNOWN',
      school,
      category,
      state,
      dateIssued,
      status: 'ACTIVE',
      photo,
      isPaid: isPaid,
      paymentRef: paymentRef,
      amountPaid: amountPaid,
      paidAt: paidAt,
      savedAt: new Date().toISOString()
    };

    if (isPaid) {
      activeVerifiedCard = { ...record };
      try {
        sessionStorage.setItem('spa_active_verified_card', JSON.stringify(record));
      } catch (e) {}
    }

    advanceCardSequenceIfCurrent(record.id);

    if (window.CloudDB) {
      CloudDB.saveCard(record);
    } else {
      try {
        let records = JSON.parse(localStorage.getItem('spa_card_records') || '[]');
        const idx = records.findIndex(r => r.id === record.id);
        if (idx >= 0) {
          records[idx] = record;
        } else {
          records.unshift(record);
        }
        if (records.length > 50) records = records.slice(0, 50);
        localStorage.setItem('spa_card_records', JSON.stringify(records));
      } catch (e) {
        console.warn('Could not save card to localStorage:', e);
      }
    }
  }

  function loadCardFromStorage() {
    const raw = sessionStorage.getItem('spa_load_card');
    if (!raw) return;
    try {
      const card = JSON.parse(raw);
      sessionStorage.removeItem('spa_load_card');

      const isFree = (card.amountPaid === 0 || card.amountPaid === '0' || card.paymentRef === 'FREE_ISSUANCE');
      const isPaid = (card.isPaid === true || card.isPaid === 'true' || card.isPaid === 1 || card.isPaid === '1' || isFree);
      if (isPaid) {
        card.isPaid = true;
        if (isFree && !card.paymentRef) card.paymentRef = 'FREE_ISSUANCE';
        activeVerifiedCard = { ...card };
        try {
          sessionStorage.setItem('spa_active_verified_card', JSON.stringify(card));
        } catch (e) {}
      }

      if (window.CloudDB && typeof CloudDB.saveLocalCards === 'function') {
        const local = CloudDB.getLocalCards() || [];
        const targetNorm = normalizeId(card.id);
        const idx = local.findIndex(c => c.id && normalizeId(c.id) === targetNorm);
        if (idx >= 0) local[idx] = { ...local[idx], ...card };
        else local.unshift(card);
        CloudDB.saveLocalCards(local);
      }

      if (card.name !== undefined && inputName) inputName.value = card.name || '';
      if (card.school !== undefined && inputSchool) {
        inputSchool.value = card.school || '';
        if (selectedSchoolText) {
          if (card.school) {
            selectedSchoolText.textContent = card.school;
            selectedSchoolText.classList.remove('placeholder-text');
          } else {
            selectedSchoolText.textContent = 'Select School / Chapter / Branch';
            selectedSchoolText.classList.add('placeholder-text');
          }
        }
      }
      if (card.category !== undefined && inputCategory) {
        inputCategory.value = card.category || '';
        if (selectedCategoryText) {
          if (card.category) {
            selectedCategoryText.textContent = card.category;
            selectedCategoryText.classList.remove('placeholder-text');
          } else {
            selectedCategoryText.textContent = 'Select Category';
            selectedCategoryText.classList.add('placeholder-text');
          }
        }
      }
      if (card.state !== undefined && inputState) {
        inputState.value = card.state || '';
        if (selectedStateText) {
          if (card.state) {
            selectedStateText.textContent = card.state;
            selectedStateText.classList.remove('placeholder-text');
          } else {
            selectedStateText.textContent = 'Select State';
            selectedStateText.classList.add('placeholder-text');
          }
        }
      }
      if (card.id && inputId) inputId.value = card.id;
      if (card.dateIssued && inputDateIssued) inputDateIssued.value = card.dateIssued;
      if (card.photo && passportImg && !card.photo.includes('[cached_locally]')) {
        passportImg.onload = () => {
          fitPassportImage(passportImg);
          resetPhotoFraming();
        };
        passportImg.src = card.photo;
        passportImg.style.display = 'block';
        if (passportEmptyHint) passportEmptyHint.style.display = 'none';
        hasPassport = true;
        if (photoAdjustBox) photoAdjustBox.style.display = 'flex';
      }
      syncOverlay();
      updatePaywallState();
      notify(`Loaded ID card: ${card.id || card.name}`);
    } catch (e) {
      console.warn('Error loading card from storage:', e);
    }
  }

  // -------------------------------------------------------------------------
  // Paystack Payment Gate & Download Lock Controller
  // -------------------------------------------------------------------------
  const paywallBox = document.getElementById('paywallBox');
  const paywallVerifiedBox = document.getElementById('paywallVerifiedBox');
  const paywallAmountDisplay = document.getElementById('paywallAmountDisplay');
  const btnPayAmountDisplay = document.getElementById('btnPayAmountDisplay');
  const btnPaystackPayNow = document.getElementById('btnPaystackPayNow');
  const exportButtonsGroup = document.getElementById('exportButtonsGroup');
  const paywallVerifiedRef = document.getElementById('paywallVerifiedRef');
  const paywallVerifiedAmount = document.getElementById('paywallVerifiedAmount');
  const downloadsLockBanner = document.getElementById('downloadsLockBanner');
  const paywallFreeBanner = document.getElementById('paywallFreeBanner');

  function updatePaywallState() {
    const isPaywallActive = window.CloudDB && typeof CloudDB.isPaywallEnabled === 'function'
      ? CloudDB.isPaywallEnabled()
      : true;

    if (!isPaywallActive) {
      if (paywallBox) paywallBox.style.display = 'none';
      if (downloadsLockBanner) downloadsLockBanner.style.display = 'none';
      if (paywallVerifiedBox) paywallVerifiedBox.style.display = 'none';
      if (paywallFreeBanner) paywallFreeBanner.style.display = 'flex';
      if (exportButtonsGroup) exportButtonsGroup.classList.remove('downloads-locked');
      return;
    }

    if (paywallFreeBanner) paywallFreeBanner.style.display = 'none';

    const auth = checkCardAuthorization();
    const price = window.CloudDB ? CloudDB.getPrice() : 1000;
    const formattedPrice = new Intl.NumberFormat('en-NG').format(price);

    if (paywallAmountDisplay) paywallAmountDisplay.textContent = formattedPrice;
    if (btnPayAmountDisplay) btnPayAmountDisplay.textContent = `₦${formattedPrice}`;

    if (auth.isAuthorized) {
      if (paywallBox) paywallBox.style.display = 'none';
      if (downloadsLockBanner) downloadsLockBanner.style.display = 'none';
      if (paywallVerifiedBox) {
        paywallVerifiedBox.style.display = 'block';
        const card = auth.card;
        if (card) {
          const isFree = (card.amountPaid === 0 || card.amountPaid === '0' || card.paymentRef === 'FREE_ISSUANCE');
          if (paywallVerifiedRef) {
            paywallVerifiedRef.textContent = isFree ? 'FREE_ISSUANCE (Verified)' : (card.paymentRef || 'VERIFIED');
          }
          if (paywallVerifiedAmount) {
            paywallVerifiedAmount.textContent = isFree ? '₦0 (Free Registration)' : `₦${new Intl.NumberFormat('en-NG').format(card.amountPaid || price)}`;
          }
        }
      }
      if (exportButtonsGroup) exportButtonsGroup.classList.remove('downloads-locked');
    } else {
      if (paywallBox) paywallBox.style.display = 'block';
      if (downloadsLockBanner) downloadsLockBanner.style.display = 'flex';
      if (paywallVerifiedBox) paywallVerifiedBox.style.display = 'none';
      if (exportButtonsGroup) exportButtonsGroup.classList.add('downloads-locked');
    }
  }

  function requirePaymentGate() {
    const isPaywallActive = window.CloudDB && typeof CloudDB.isPaywallEnabled === 'function'
      ? CloudDB.isPaywallEnabled()
      : true;

    if (!isPaywallActive) {
      return true; // Payment wall disabled by Admin; allow immediate free download/print!
    }

    const auth = checkCardAuthorization();
    if (auth.isAuthorized) return true;

    const price = window.CloudDB ? CloudDB.getPrice() : 1000;
    const formattedPrice = new Intl.NumberFormat('en-NG').format(price);

    let message = `Official payment of ₦${formattedPrice} is required before downloading or printing your ID card. Please click "Pay Now" to complete issuance.`;
    if (auth.mismatch === 'name') {
      message = `Member details have been modified. Official payment of ₦${formattedPrice} is required to issue an ID card with modified details, or restore the original registered name to proceed.`;
    }

    showModalAlert(message, {
      title: 'Payment Required',
      type: 'warning'
    });

    if (paywallBox) {
      paywallBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return false;
  }

  if (btnPaystackPayNow) {
    btnPaystackPayNow.addEventListener('click', () => {
      const id = getSanitizedId();
      const name = inputName ? inputName.value.trim() : '';
      if (!name) {
        showModalAlert('Please enter the Full Name on the card before proceeding with payment.', {
          title: 'Name Required',
          type: 'warning'
        });
        if (inputName) inputName.focus();
        return;
      }

      // Default backend administrative email
      const email = (window.CloudDB && CloudDB.defaultPaymentEmail) ? CloudDB.defaultPaymentEmail : 'we.are.danithuga@gmail.com';

      if (typeof PaystackPop === 'undefined') {
        showModalAlert('Paystack gateway is currently initializing. Please check your internet connection and try again.', {
          title: 'Gateway Connecting',
          type: 'warning'
        });
        return;
      }

      const price = window.CloudDB ? CloudDB.getPrice() : 1000;
      const ref = 'SPN-' + id.replace(/[^a-zA-Z0-9]/g, '') + '-' + Date.now();

      const handler = PaystackPop.setup({
        key: window.CloudDB ? CloudDB.paystackPublicKey : 'pk_live_732d9b62cd035b8dad96e981d7f6982540342e80',
        email: email,
        amount: price * 100, // Paystack amount is in Kobo
        currency: 'NGN',
        ref: ref,
        metadata: {
          custom_fields: [
            { display_name: 'Member Name', variable_name: 'member_name', value: name },
            { display_name: 'Card ID', variable_name: 'card_id', value: id },
            { display_name: 'Category', variable_name: 'category', value: inputCategory ? inputCategory.value : 'MEMBER' },
            { display_name: 'State', variable_name: 'state', value: inputState ? inputState.value : '' }
          ]
        },
        callback: async function (response) {
          saveCardRecord();
          if (window.CloudDB) {
            await CloudDB.markCardPaid(id, {
              reference: response.reference,
              amount: price,
              email: email
            });
          }
          const verifiedRecord = {
            id,
            name,
            school: inputSchool ? inputSchool.value.trim() : '',
            category: inputCategory ? inputCategory.value.trim() : 'STUDENT',
            state: inputState ? inputState.value.trim() : '',
            dateIssued: inputDateIssued ? inputDateIssued.value.trim() : '',
            isPaid: true,
            paymentRef: response.reference,
            amountPaid: price,
            paidAt: new Date().toISOString()
          };
          activeVerifiedCard = verifiedRecord;
          try {
            sessionStorage.setItem('spa_active_verified_card', JSON.stringify(verifiedRecord));
          } catch (e) {}

          updatePaywallState();
          const formattedPrice = new Intl.NumberFormat('en-NG').format(price);
          showModalAlert(`Official card issuance fee of ₦${formattedPrice} confirmed (Ref: ${response.reference}). Your ID card is now completely unlocked for unlimited high-resolution download and printing!`, {
            title: 'Payment Successful!',
            type: 'success'
          });
        },
        onClose: function () {
          notify('Payment window closed.');
        }
      });

      handler.openIframe();
    });
  }

  // Real-time synchronization for all form inputs
  if (inputId) inputId.addEventListener('input', updatePaywallState);
  if (inputCategory) inputCategory.addEventListener('change', updatePaywallState);
  if (inputName) inputName.addEventListener('input', updatePaywallState);
  if (inputSchool) inputSchool.addEventListener('input', updatePaywallState);
  if (inputState) inputState.addEventListener('change', updatePaywallState);

  // --- Attach Direct Export Triggers (Guarded by Paywall) ---

  // 1. Front (PNG)
  if (btnDownloadFrontPNG && cardStageFront) {
    btnDownloadFrontPNG.addEventListener('click', () => {
      if (!requirePaymentGate()) return;
      saveCardRecord();
      exportCardAsImage(cardStageFront, `Front-${getSanitizedId()}-${selectedQuality}.png`, 'png');
    });
  }

  // 2. Back (PNG)
  if (btnDownloadBackPNG && cardStageBack) {
    btnDownloadBackPNG.addEventListener('click', () => {
      if (!requirePaymentGate()) return;
      saveCardRecord();
      exportCardAsImage(cardStageBack, `Back-${getSanitizedId()}-${selectedQuality}.png`, 'png');
    });
  }

  // 3. Front (JPEG)
  if (btnDownloadFrontJPEG && cardStageFront) {
    btnDownloadFrontJPEG.addEventListener('click', () => {
      if (!requirePaymentGate()) return;
      saveCardRecord();
      exportCardAsImage(cardStageFront, `Front-${getSanitizedId()}-${selectedQuality}.jpg`, 'jpeg');
    });
  }

  // 4. Back (JPEG)
  if (btnDownloadBackJPEG && cardStageBack) {
    btnDownloadBackJPEG.addEventListener('click', () => {
      if (!requirePaymentGate()) return;
      saveCardRecord();
      exportCardAsImage(cardStageBack, `Back-${getSanitizedId()}-${selectedQuality}.jpg`, 'jpeg');
    });
  }

  // 5. Download Both as PDF
  if (btnDownloadBothPDF && cardStageFront && cardStageBack) {
    btnDownloadBothPDF.addEventListener('click', () => {
      if (!requirePaymentGate()) return;
      saveCardRecord();
      exportCardAsPdf();
    });
  }

  // 6. Print Cards
  if (btnPrintCard) {
    btnPrintCard.addEventListener('click', () => {
      if (!requirePaymentGate()) return;
      saveCardRecord();
      printCards();
    });
  }

  // Initialize auto credentials, real-time sync, check for retrieval payload, and update paywall state
  updateAutoCredentials();
  syncOverlay();
  loadCardFromStorage();
  updatePaywallState();

  // If pre-filled card is not in local cache, perform background single-card cloud verification
  const startupId = getRawId();
  if (startupId && !getActiveVerifiedCard() && window.CloudDB && typeof CloudDB.verifyCardFromCloud === 'function') {
    CloudDB.verifyCardFromCloud(startupId).then(cloudCard => {
      if (cloudCard && (cloudCard.isPaid || cloudCard.paymentRef === 'FREE_ISSUANCE' || cloudCard.amountPaid === 0 || cloudCard.amountPaid === '0')) {
        activeVerifiedCard = cloudCard;
        updatePaywallState();
      }
    }).catch(() => {});
  }

  // Lightweight background settings sync (price & paywall status) - does NOT download full cards table
  if (window.CloudDB && typeof CloudDB.syncSettings === 'function') {
    CloudDB.syncSettings().then(() => {
      updatePaywallState();
    }).catch(err => console.warn('[App] Settings sync deferred:', err));
  }
});
