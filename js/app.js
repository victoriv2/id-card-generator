/**
 * Students Parliament Nigeria - ID Card Generator
 * Real-time Front & Back generation with authentic templates
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Input Elements ---
  const inputName = document.getElementById('inputName');
  const inputSchool = document.getElementById('inputSchool');
  const inputId = document.getElementById('inputId');
  const inputCategory = document.getElementById('inputCategory');
  const inputDateIssued = document.getElementById('inputDateIssued');
  const inputValidUntil = document.getElementById('inputValidUntil');
  const inputStatus = document.getElementById('inputStatus');
  const btnGenId = document.getElementById('btnGenId');
  const btnResetAll = document.getElementById('btnResetAll');

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

  // --- Overlay View Elements (Front) ---
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

  let currentScale = 1;
  let currentPanX = 0;
  let currentPanY = 0;
  let hasPassport = false;

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

  // -------------------------------------------------------------------------
  // Reset Photo Framing
  // -------------------------------------------------------------------------
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

    const idVal = inputId.value.trim();
    const nameVal = inputName.value.trim();
    const validVal = inputValidUntil.value.trim();

    if (!idVal && !nameVal) {
      qrBox.innerHTML = '<div class="qr-empty-hint"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 2h2v3h-2v-3zm2 3h2v3h-2v-3zm3-1h3v2h-3v-2zm0 3h3v2h-3v-2zm-5 0h2v2h-2v-2z"/></svg><span>QR CODE</span></div>';
      return;
    }

    qrBox.innerHTML = '';
    const qrText = `STUDENTS PARLIAMENT NIGERIA\nID: ${idVal || 'N/A'}\nName: ${nameVal || 'N/A'}\nCategory: ${inputCategory.value || 'N/A'}\nStatus: ${inputStatus.value}\nValid: ${validVal || 'N/A'}`;

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
    // 1. Full Name
    const name = inputName.value.trim();
    viewName.textContent = name;

    // 2. School / Branch (formatted as (NAME))
    const school = inputSchool.value.trim();
    if (school) {
      const cleanSchool = school.replace(/^\(|\)$/g, '');
      viewSchool.textContent = `(${cleanSchool})`;
    } else {
      viewSchool.textContent = '';
    }

    // 3. ID Number
    viewId.textContent = inputId.value.trim();

    // 4. Category
    viewCategory.textContent = inputCategory.value || '';

    // 5. Date Issued
    viewDateIssued.textContent = inputDateIssued.value.trim();

    // 6. Valid Until
    viewValidUntil.textContent = inputValidUntil.value.trim();

    // 7. Status Badge
    const status = inputStatus.value;
    viewStatusBadge.textContent = status;
    viewStatusBadge.className = 'overlay-status-badge';
    if (status === 'PENDING') viewStatusBadge.classList.add('pending');
    if (status === 'EXPIRED') viewStatusBadge.classList.add('expired');

    // 8. QR Code
    renderQrCode();
  }

  // Attach live input listeners for real-time reactivity
  const liveInputs = [
    inputName, inputSchool, inputId, inputCategory,
    inputDateIssued, inputValidUntil, inputStatus
  ];

  liveInputs.forEach(elem => {
    if (elem) {
      elem.addEventListener('input', syncOverlay);
      elem.addEventListener('change', syncOverlay);
    }
  });

  // -------------------------------------------------------------------------
  // Auto ID Generator Button
  // -------------------------------------------------------------------------
  if (btnGenId) {
    btnGenId.addEventListener('click', () => {
      const random3 = String(Math.floor(Math.random() * 900) + 100);
      const catCode = (inputCategory.value || 'STU').substring(0, 3).toUpperCase();
      const yr = new Date().getFullYear().toString().slice(-2);
      inputId.value = `SPA/ID/${catCode}/${yr}/${random3}`;
      syncOverlay();
      notify('Generated: ' + inputId.value);
    });
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
  // Reset Form (Clear to Blank)
  // -------------------------------------------------------------------------
  if (btnResetAll) {
    btnResetAll.addEventListener('click', () => {
      inputName.value = '';
      inputSchool.value = '';
      inputId.value = '';
      inputCategory.selectedIndex = 0;
      inputDateIssued.value = '';
      inputValidUntil.value = '';
      inputStatus.selectedIndex = 0;

      hasPassport = false;
      resetPhotoFraming();

      passportImg.src = '';
      passportImg.style.display = 'none';
      if (passportEmptyHint) passportEmptyHint.style.display = 'flex';
      if (photoAdjustBox) photoAdjustBox.style.display = 'none';

      syncOverlay();
      notify('All inputs cleared.');
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
    } catch (err) {
      console.error('Download error:', err);
      alert('Could not render image. Please try again.');
    }
  }

  // Download Front (PNG)
  if (btnDownloadFront && cardStageFront) {
    btnDownloadFront.addEventListener('click', () => {
      const id = (inputId.value.trim() || 'student').replace(/[\/\\]/g, '-');
      exportCardAsImage(cardStageFront, `Front-ID-${id}.png`);
    });
  }

  // Download Back (PNG)
  if (btnDownloadBack && cardStageBack) {
    btnDownloadBack.addEventListener('click', () => {
      const id = (inputId.value.trim() || 'student').replace(/[\/\\]/g, '-');
      exportCardAsImage(cardStageBack, `Back-ID-${id}.png`);
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

        const id = (inputId.value.trim() || 'student').replace(/[\/\\]/g, '-');
        pdf.save(`ID-Card-${id}.pdf`);
        notify('PDF Download complete!');
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

  // Initial blank sync
  syncOverlay();
});
