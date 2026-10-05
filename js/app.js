/**
 * Students Parliament Nigeria - ID Card Generator
 * Real-time Front & Back generation with authentic templates
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Form Input Elements ---
  const inputName = document.getElementById('inputName');
  const inputSchool = document.getElementById('inputSchool');
  const btnResetAll = document.getElementById('btnResetAll');

  // --- Category Elements & Modal ---
  const btnOpenCategoryModal = document.getElementById('btnOpenCategoryModal');
  const btnCloseCategoryModal = document.getElementById('btnCloseCategoryModal');
  const categoryModal = document.getElementById('categoryModal');
  const selectedCategoryName = document.getElementById('selectedCategoryName');
  const selectedCategoryCode = document.getElementById('selectedCategoryCode');
  const categoryIconPill = document.getElementById('categoryIconPill');
  const categoryOptionItems = document.querySelectorAll('.category-option-item');

  // --- Automatic System Credential Badges ---
  const badgeAutoId = document.getElementById('badgeAutoId');
  const badgeDateIssued = document.getElementById('badgeDateIssued');
  const badgeValidUntil = document.getElementById('badgeValidUntil');

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
  const viewValidUntil = document.getElementById('viewValidUntil');
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
  const btnDownloadFront = document.getElementById('btnDownloadFront');
  const btnDownloadBack = document.getElementById('btnDownloadBack');
  const btnDownloadBothPDF = document.getElementById('btnDownloadBothPDF');
  const btnPrintCard = document.getElementById('btnPrintCard');
  const toastNotice = document.getElementById('toastNotice');

  // --- Categories Configuration & Mapping ---
  const CATEGORY_MAP = {
    'STUDENT': {
      code: 'STU',
      icon: '<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>'
    },
    'TEACHER': {
      code: 'TEA',
      icon: '<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2H0c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2h-4zM4 5h16v11H4V5zm8 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>'
    },
    'EXECUTIVE': {
      code: 'EXE',
      icon: '<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
    },
    'PARENT': {
      code: 'PAR',
      icon: '<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>'
    },
    'OFFICIAL': {
      code: 'OFF',
      icon: '<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>'
    }
  };

  let selectedCategory = 'STUDENT';
  let currentScale = 1;
  let currentPanX = 0;
  let currentPanY = 0;
  let hasPassport = false;

  // -------------------------------------------------------------------------
  // Automatic Credential Generators (ID, Dates, Sequential Counter)
  // -------------------------------------------------------------------------
  function getSystemDates() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateIssued = `${day}/${month}/${year}`;
    const validUntil = `${day}/${month}/${year + 1}`;
    const year2Digits = String(year).slice(-2);
    return { dateIssued, validUntil, year2Digits };
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

  function generateAutoId() {
    const { year2Digits } = getSystemDates();
    const catCode = CATEGORY_MAP[selectedCategory]?.code || 'STU';
    const seq = String(getCardSequenceNumber()).padStart(3, '0');
    return `SPA/ID/${catCode}/${year2Digits}/${seq}`;
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
  // Minimal Category Modal Open / Close Logic
  // -------------------------------------------------------------------------
  function openCategoryModal() {
    if (categoryModal) categoryModal.style.display = 'flex';
  }

  function closeCategoryModal() {
    if (categoryModal) categoryModal.style.display = 'none';
  }

  if (btnOpenCategoryModal) {
    btnOpenCategoryModal.addEventListener('click', openCategoryModal);
  }

  if (btnCloseCategoryModal) {
    btnCloseCategoryModal.addEventListener('click', closeCategoryModal);
  }

  if (categoryModal) {
    categoryModal.addEventListener('click', (e) => {
      if (e.target === categoryModal) closeCategoryModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && categoryModal && categoryModal.style.display === 'flex') {
      closeCategoryModal();
    }
  });

  categoryOptionItems.forEach(item => {
    item.addEventListener('click', () => {
      const cat = item.getAttribute('data-cat');
      if (cat && CATEGORY_MAP[cat]) {
        selectedCategory = cat;
        categoryOptionItems.forEach(opt => opt.classList.remove('active'));
        item.classList.add('active');

        if (selectedCategoryName) selectedCategoryName.textContent = cat;
        if (selectedCategoryCode) selectedCategoryCode.textContent = 'Code: ' + CATEGORY_MAP[cat].code;
        if (categoryIconPill) categoryIconPill.innerHTML = CATEGORY_MAP[cat].icon;

        closeCategoryModal();
        syncOverlay();
        notify(`Category set to ${cat}`);
      }
    });
  });

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
  function renderQrCode(idVal, dateIssued, validUntil) {
    if (!qrBox) return;

    const nameVal = inputName ? inputName.value.trim() : '';

    if (!nameVal) {
      qrBox.innerHTML = '<div class="qr-empty-hint"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 2h2v3h-2v-3zm2 3h2v3h-2v-3zm3-1h3v2h-3v-2zm0 3h3v2h-3v-2zm-5 0h2v2h-2v-2z"/></svg><span>QR CODE</span></div>';
      return;
    }

    qrBox.innerHTML = '';
    const qrText = `STUDENTS PARLIAMENT NIGERIA\nID: ${idVal}\nName: ${nameVal}\nCategory: ${selectedCategory}\nStatus: ACTIVE\nIssued: ${dateIssued}\nValid: ${validUntil}`;

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
  // Real-Time Overlay Sync
  // -------------------------------------------------------------------------
  function syncOverlay() {
    const { dateIssued, validUntil } = getSystemDates();
    const currentId = generateAutoId();

    // 1. Update Form Badges (Auto-credentials)
    if (badgeAutoId) badgeAutoId.textContent = currentId;
    if (badgeDateIssued) badgeDateIssued.textContent = dateIssued;
    if (badgeValidUntil) badgeValidUntil.textContent = validUntil;

    // 2. Full Name
    const name = inputName ? inputName.value.trim() : '';
    if (viewName) viewName.textContent = name;

    // 3. School / Branch (formatted as (NAME))
    const school = inputSchool ? inputSchool.value.trim() : '';
    if (viewSchool) {
      if (school) {
        const cleanSchool = school.replace(/^\(|\)$/g, '');
        viewSchool.textContent = `(${cleanSchool})`;
      } else {
        viewSchool.textContent = '';
      }
    }

    // 4. Overlays: ID, Category, Dates, Status
    if (viewId) viewId.textContent = currentId;
    if (viewCategory) viewCategory.textContent = selectedCategory;
    if (viewDateIssued) viewDateIssued.textContent = dateIssued;
    if (viewValidUntil) viewValidUntil.textContent = validUntil;
    if (viewStatusBadge) {
      viewStatusBadge.textContent = 'ACTIVE';
      viewStatusBadge.className = 'overlay-status-badge';
    }

    // 5. Dynamic QR Code
    renderQrCode(currentId, dateIssued, validUntil);
  }

  // Attach live input listeners for real-time reactivity
  if (inputName) {
    inputName.addEventListener('input', syncOverlay);
  }
  if (inputSchool) {
    inputSchool.addEventListener('input', syncOverlay);
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
    });

    tabFront.addEventListener('click', () => {
      tabFront.classList.add('active');
      tabBoth.classList.remove('active');
      tabBack.classList.remove('active');
      if (colFront) colFront.style.display = 'flex';
      if (colBack) colBack.style.display = 'none';
    });

    tabBack.addEventListener('click', () => {
      tabBack.classList.add('active');
      tabBoth.classList.remove('active');
      tabFront.classList.remove('active');
      if (colFront) colFront.style.display = 'none';
      if (colBack) colBack.style.display = 'flex';
    });
  }

  // -------------------------------------------------------------------------
  // Reset Form (Clear Inputs & Reset Photo)
  // -------------------------------------------------------------------------
  if (btnResetAll) {
    btnResetAll.addEventListener('click', () => {
      if (inputName) inputName.value = '';
      if (inputSchool) inputSchool.value = '';

      hasPassport = false;
      resetPhotoFraming();

      passportImg.src = '';
      passportImg.style.display = 'none';
      if (passportEmptyHint) passportEmptyHint.style.display = 'flex';
      if (photoAdjustBox) photoAdjustBox.style.display = 'none';

      syncOverlay();
      notify('Form cleared.');
    });
  }

  // -------------------------------------------------------------------------
  // High-Resolution Card Export Functions
  // -------------------------------------------------------------------------
  async function exportCardAsImage(element, filename) {
    if (typeof html2canvas === 'undefined') {
      alert('Rendering library is loading. Please wait a moment.');
      return;
    }

    notify('Rendering high-resolution image...');

    try {
      const canvas = await html2canvas(element, {
        scale: 3, // 3x high DPI render for print quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      notify('Download complete: ' + filename);

      // Advance sequence counter for next generation
      advanceCardSequence();
      syncOverlay();
    } catch (err) {
      console.error('Download error:', err);
      alert('Could not render image. Please try again.');
    }
  }

  // Download Front (PNG)
  if (btnDownloadFront && cardStageFront) {
    btnDownloadFront.addEventListener('click', () => {
      const currentId = generateAutoId().replace(/[\/\\]/g, '-');
      exportCardAsImage(cardStageFront, `Front-${currentId}.png`);
    });
  }

  // Download Back (PNG)
  if (btnDownloadBack && cardStageBack) {
    btnDownloadBack.addEventListener('click', () => {
      const currentId = generateAutoId().replace(/[\/\\]/g, '-');
      exportCardAsImage(cardStageBack, `Back-${currentId}.png`);
    });
  }

  // Download Both as PDF
  if (btnDownloadBothPDF && cardStageFront && cardStageBack) {
    btnDownloadBothPDF.addEventListener('click', async () => {
      if (typeof html2canvas === 'undefined' || !window.jspdf) {
        alert('PDF Export libraries are initializing. Please wait a moment.');
        return;
      }

      notify('Generating high-resolution 2-page PDF...');

      try {
        const { jsPDF } = window.jspdf;
        // Standard CR80 card dimensions (54mm x 85.6mm)
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [54, 85.6]
        });

        // 1. Render Front Side
        const canvasFront = await html2canvas(cardStageFront, { scale: 3, useCORS: true, backgroundColor: null });
        const imgFront = canvasFront.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgFront, 'JPEG', 0, 0, 54, 85.6);

        // 2. Render Back Side
        pdf.addPage([54, 85.6], 'portrait');
        const canvasBack = await html2canvas(cardStageBack, { scale: 3, useCORS: true, backgroundColor: null });
        const imgBack = canvasBack.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgBack, 'JPEG', 0, 0, 54, 85.6);

        const currentId = generateAutoId().replace(/[\/\\]/g, '-');
        pdf.save(`ID-Card-${currentId}.pdf`);
        notify('PDF Download complete!');

        // Advance sequence counter for next generation
        advanceCardSequence();
        syncOverlay();
      } catch (err) {
        console.error('PDF export error:', err);
        alert('Could not export PDF. Please try again.');
      }
    });
  }

  // Print Cards
  if (btnPrintCard) {
    btnPrintCard.addEventListener('click', () => {
      window.print();
    });
  }

  // Initial sync
  syncOverlay();
});
