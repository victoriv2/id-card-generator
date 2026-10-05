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

  function updateAutoCredentials() {
    const { dateIssued, year2Digits } = getSystemDates();
    const cat = inputCategory ? inputCategory.value.trim() : '';

    if (inputDateIssued) {
      inputDateIssued.value = dateIssued;
    }

    if (inputId) {
      if (cat && CATEGORY_CODES[cat]) {
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

  // -------------------------------------------------------------------------
  // Photo Transform (Zoom & Pan)
  // -------------------------------------------------------------------------
  function applyPhotoTransform() {
    if (!passportImg || !hasPassport) return;
    passportImg.style.transform = `scale(${currentScale}) translate(${currentPanX}px, ${currentPanY}px)`;
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

    // Both text sizes start identical
    let textSize = 2.55;

    viewName.style.fontSize = `${textSize}cqw`;
    viewName.style.lineHeight = '1.12';
    viewSchool.style.fontSize = `${textSize}cqw`;
    viewSchool.style.lineHeight = '1.12';

    // Measure allocated bounds
    const maxH = bearerBlock.clientHeight;
    const maxW = bearerBlock.clientWidth;
    if (!maxH || !maxW) return;

    const blockStyle = window.getComputedStyle(bearerBlock);
    const gap = parseFloat(blockStyle.gap || blockStyle.rowGap || '0') || 0;

    // Only shrink if there is actual physical overflow of container height or width
    let attempts = 0;
    while (attempts < 25) {
      const currentH = (viewName.offsetHeight || 0) + (viewSchool.offsetHeight || 0) + gap;
      const currentW = Math.max(viewName.scrollWidth || 0, viewSchool.scrollWidth || 0);

      if (currentH <= maxH && currentW <= maxW) {
        break; // Fits inside boundary!
      }

      if (textSize > 1.35) {
        textSize -= 0.06;
        viewName.style.fontSize = `${textSize.toFixed(2)}cqw`;
        viewSchool.style.fontSize = `${textSize.toFixed(2)}cqw`;
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

    // 7. Status Badge
    if (viewStatusBadge && inputStatus) {
      const status = inputStatus.value;
      viewStatusBadge.textContent = status;
      viewStatusBadge.className = 'overlay-status-badge';
      if (status === 'PENDING') viewStatusBadge.classList.add('pending');
      if (status === 'EXPIRED') viewStatusBadge.classList.add('expired');
    }

    // 8. Dynamic QR Code
    renderQrCode();
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

  // Global Escape key to dismiss active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (categoryModal && categoryModal.style.display === 'flex') {
        closeCategoryModal();
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
      alert('Please upload an image file (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      passportImg.src = e.target.result;
      passportImg.style.display = 'block';
      if (passportEmptyHint) passportEmptyHint.style.display = 'none';

      hasPassport = true;
      if (photoAdjustBox) photoAdjustBox.style.display = 'flex';

      resetPhotoFraming();
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
    btnResetAll.addEventListener('click', () => {
      if (inputName) inputName.value = '';
      if (inputSchool) inputSchool.value = '';
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
  // Pre-load card background images as base64 data URLs
  // This fixes html2canvas failing on file:// protocol (cross-origin taint error)
  // -------------------------------------------------------------------------
  function imgSrcToDataURL(src) {
    return new Promise((resolve) => {
      if (!src || src.startsWith('data:')) return resolve(src || null);

      // Use XHR to load the image as a blob, then FileReader to base64 encode it
      // This works on file:// protocol where CORS canvas approach fails
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', src, true);
        xhr.responseType = 'blob';

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 0) {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(xhr.response);
          } else {
            resolve(null);
          }
        };

        xhr.onerror = () => resolve(null);
        xhr.send();
      } catch (e) {
        resolve(null);
      }
    });
  }

  async function preloadCardImages() {
    const frontBg = cardStageFront ? cardStageFront.querySelector('.card-bg-template') : null;
    const backBg = cardStageBack ? cardStageBack.querySelector('.card-bg-template') : null;

    const [frontDataUrl, backDataUrl] = await Promise.all([
      frontBg ? imgSrcToDataURL(frontBg.src) : Promise.resolve(null),
      backBg ? imgSrcToDataURL(backBg.src) : Promise.resolve(null)
    ]);

    if (frontDataUrl && frontBg) frontBg.src = frontDataUrl;
    if (backDataUrl && backBg) backBg.src = backDataUrl;
  }

  // Kick off pre-load (store promise so exports can await it if user clicks quickly)
  const cardImagesReady = preloadCardImages().catch(() => {});

  // -------------------------------------------------------------------------
  // High-Resolution Card Export Helper Functions
  // -------------------------------------------------------------------------
  function getSanitizedId() {
    return (inputId && inputId.value.trim() ? inputId.value.trim() : 'card').replace(/[\/\\]/g, '-');
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
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    }, 250);
  }

  async function renderStageToCanvas(stageElement, scale, isJpeg) {
    if (!stageElement) {
      throw new Error('Target card element not found');
    }

    // If the stage's column is hidden (due to tab view "Front" or "Back"),
    // temporarily unhide it offscreen so html2canvas can measure and render it
    const col = stageElement.closest('.card-column');
    const wasHidden = col && (window.getComputedStyle(col).display === 'none');
    const prevStyle = col ? {
      display: col.style.display,
      position: col.style.position,
      left: col.style.left,
      top: col.style.top,
      visibility: col.style.visibility,
      opacity: col.style.opacity
    } : null;

    if (wasHidden) {
      col.style.display = 'flex';
      col.style.position = 'fixed';
      col.style.left = '-9999px';
      col.style.top = '0px';
      col.style.visibility = 'visible';
      col.style.opacity = '1';
    }

    try {
      const canvas = await html2canvas(stageElement, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: isJpeg ? '#ffffff' : null
      });
      return canvas;
    } finally {
      if (wasHidden && col) {
        col.style.display = prevStyle.display;
        col.style.position = prevStyle.position;
        col.style.left = prevStyle.left;
        col.style.top = prevStyle.top;
        col.style.visibility = prevStyle.visibility;
        col.style.opacity = prevStyle.opacity;
      }
    }
  }

  async function exportCardAsImage(element, filename, format = 'png') {
    if (typeof html2canvas === 'undefined') {
      alert('Rendering library is loading. Please wait a moment.');
      return;
    }

    const { scale, jpegQuality, label } = getQualityParams(selectedQuality);
    notify(`Rendering ${format.toUpperCase()} (${label})...`);

    try {
      // Ensure card background images are fully converted to base64 first
      await cardImagesReady;
      const canvas = await renderStageToCanvas(element, scale, format === 'jpeg');
      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const dataUrl = canvas.toDataURL(mimeType, jpegQuality);

      triggerDownload(dataUrl, filename);
      notify(`Download complete: ${filename}`);
    } catch (err) {
      console.error('Download error:', err);
      alert('Could not render image. Please try again.');
    }
  }

  async function exportCardAsPdf() {
    if (typeof html2canvas === 'undefined' || !window.jspdf) {
      alert('PDF Export libraries are initializing. Please wait a moment.');
      return;
    }

    const { scale, jpegQuality, label } = getQualityParams(selectedQuality);
    notify(`Generating PDF (${label})...`);

    try {
      // Ensure card background images are fully converted to base64 first
      await cardImagesReady;
      const { jsPDF } = window.jspdf;
      // Standard CR80 card dimensions (54mm x 85.6mm)
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
      console.error('PDF export error:', err);
      alert('Could not export PDF. Please try again.');
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

  // --- Attach Direct Export Triggers ---

  // 1. Front (PNG)
  if (btnDownloadFrontPNG && cardStageFront) {
    btnDownloadFrontPNG.addEventListener('click', () => {
      exportCardAsImage(cardStageFront, `Front-${getSanitizedId()}-${selectedQuality}.png`, 'png');
    });
  }

  // 2. Back (PNG)
  if (btnDownloadBackPNG && cardStageBack) {
    btnDownloadBackPNG.addEventListener('click', () => {
      exportCardAsImage(cardStageBack, `Back-${getSanitizedId()}-${selectedQuality}.png`, 'png');
    });
  }

  // 3. Front (JPEG)
  if (btnDownloadFrontJPEG && cardStageFront) {
    btnDownloadFrontJPEG.addEventListener('click', () => {
      exportCardAsImage(cardStageFront, `Front-${getSanitizedId()}-${selectedQuality}.jpg`, 'jpeg');
    });
  }

  // 4. Back (JPEG)
  if (btnDownloadBackJPEG && cardStageBack) {
    btnDownloadBackJPEG.addEventListener('click', () => {
      exportCardAsImage(cardStageBack, `Back-${getSanitizedId()}-${selectedQuality}.jpg`, 'jpeg');
    });
  }

  // 5. Download Both as PDF
  if (btnDownloadBothPDF && cardStageFront && cardStageBack) {
    btnDownloadBothPDF.addEventListener('click', () => {
      exportCardAsPdf();
    });
  }

  // 6. Print Cards
  if (btnPrintCard) {
    btnPrintCard.addEventListener('click', () => {
      printCards();
    });
  }

  // Initialize auto credentials and real-time sync
  updateAutoCredentials();
  syncOverlay();
});
