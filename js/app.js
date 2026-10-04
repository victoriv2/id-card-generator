/**
 * Students Parliament Nigeria - Front ID Card Generator
 * Real-time overlay on official blank template (id-card front.png)
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
  const photoPanYRange = document.getElementById('photoPanYRange');
  const scaleLabel = document.getElementById('scaleLabel');

  // --- Overlay View Elements ---
  const viewName = document.getElementById('viewName');
  const viewSchool = document.getElementById('viewSchool');
  const viewId = document.getElementById('viewId');
  const viewCategory = document.getElementById('viewCategory');
  const viewDateIssued = document.getElementById('viewDateIssued');
  const viewValidUntil = document.getElementById('viewValidUntil');
  const viewStatusBadge = document.getElementById('viewStatusBadge');
  const qrBox = document.getElementById('qrBox');
  const qrEmptyHint = document.getElementById('qrEmptyHint');
  const cardStage = document.getElementById('cardStage');

  // --- Action Buttons ---
  const btnDownloadFront = document.getElementById('btnDownloadFront');
  const btnPrintCard = document.getElementById('btnPrintCard');
  const toastNotice = document.getElementById('toastNotice');

  let currentScale = 1;
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
    passportImg.style.transform = `scale(${currentScale}) translateY(${currentPanY}px)`;
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
      qrBox.innerHTML = '<div class="qr-empty-hint">QR CODE</div>';
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
      if (photoAdjustBox) photoAdjustBox.style.display = 'grid';

      // Reset zoom and pan
      currentScale = 1;
      currentPanY = 0;
      if (photoScaleRange) photoScaleRange.value = 100;
      if (scaleLabel) scaleLabel.textContent = '100%';
      if (photoPanYRange) photoPanYRange.value = 0;

      applyPhotoTransform();
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

  if (photoPanYRange) {
    photoPanYRange.addEventListener('input', (e) => {
      currentPanY = parseInt(e.target.value, 10);
      applyPhotoTransform();
    });
  }

  // -------------------------------------------------------------------------
  // Reset Form
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
      passportImg.src = '';
      passportImg.style.display = 'none';
      if (passportEmptyHint) passportEmptyHint.style.display = 'flex';
      if (photoAdjustBox) photoAdjustBox.style.display = 'none';

      syncOverlay();
      notify('All inputs cleared.');
    });
  }

  // -------------------------------------------------------------------------
  // High-Resolution Card Download (PNG)
  // -------------------------------------------------------------------------
  if (btnDownloadFront && cardStage) {
    btnDownloadFront.addEventListener('click', async () => {
      if (typeof html2canvas === 'undefined') {
        alert('Rendering library is loading. Please wait a moment.');
        return;
      }

      notify('Generating high-resolution card...');

      try {
        const canvas = await html2canvas(cardStage, {
          scale: 3, // 3x high DPI render for print quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: null
        });

        const id = (inputId.value.trim() || 'student').replace(/[\/\\]/g, '-');
        const link = document.createElement('a');
        link.download = `Front-ID-${id}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        notify('Download ready!');
      } catch (err) {
        console.error('Download error:', err);
        alert('Could not render image. Please try again.');
      }
    });
  }

  // Print Card
  if (btnPrintCard) {
    btnPrintCard.addEventListener('click', () => {
      window.print();
    });
  }

  // Initial blank sync
  syncOverlay();
});
