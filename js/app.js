/**
 * Students Parliament Nigeria - ID Card Generator Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Form Elements ---
  const inputFullName = document.getElementById('inputFullName');
  const inputSchool = document.getElementById('inputSchool');
  const inputIdNumber = document.getElementById('inputIdNumber');
  const inputCategory = document.getElementById('inputCategory');
  const inputDateIssued = document.getElementById('inputDateIssued');
  const inputValidUntil = document.getElementById('inputValidUntil');
  const inputStatus = document.getElementById('inputStatus');
  const btnGenId = document.getElementById('btnGenId');

  // Photo Controls
  const uploadZone = document.getElementById('uploadZone');
  const passportInput = document.getElementById('passportInput');
  const photoScale = document.getElementById('photoScale');
  const photoOffsetY = document.getElementById('photoOffsetY');
  const scaleValue = document.getElementById('scaleValue');
  const passportPreviewImg = document.getElementById('passportPreviewImg');

  // Back Settings Inputs
  const inputDisclaimer = document.getElementById('inputDisclaimer');
  const inputPhone = document.getElementById('inputPhone');
  const inputEmail = document.getElementById('inputEmail');
  const inputSignatoryName = document.getElementById('inputSignatoryName');
  const inputSignatoryTitle = document.getElementById('inputSignatoryTitle');
  const inputPoliceNotice = document.getElementById('inputPoliceNotice');
  const btnToggleSettings = document.getElementById('btnToggleSettings');
  const accordionContent = document.getElementById('accordionContent');
  const accordionIcon = document.getElementById('accordionIcon');

  // --- Card Preview Elements (Front) ---
  const cardBearerName = document.getElementById('cardBearerName');
  const cardBearerSchool = document.getElementById('cardBearerSchool');
  const cardIdNumber = document.getElementById('cardIdNumber');
  const cardCategory = document.getElementById('cardCategory');
  const cardDateIssued = document.getElementById('cardDateIssued');
  const cardValidUntil = document.getElementById('cardValidUntil');
  const cardStatusBadge = document.getElementById('cardStatusBadge');
  const frontQrBox = document.getElementById('frontQrBox');
  const cardFront = document.getElementById('cardFront');

  // --- Card Preview Elements (Back) ---
  const cardDisclaimer = document.getElementById('cardDisclaimer');
  const cardPoliceNotice = document.getElementById('cardPoliceNotice');
  const cardPhone = document.getElementById('cardPhone');
  const cardEmail = document.getElementById('cardEmail');
  const cardSignatoryName = document.getElementById('cardSignatoryName');
  const cardSignatoryTitle = document.getElementById('cardSignatoryTitle');
  const barcodeCanvas = document.getElementById('barcodeCanvas');
  const cardBack = document.getElementById('cardBack');

  // --- Action Buttons ---
  const btnLoadDemo = document.getElementById('btnLoadDemo');
  const btnResetForm = document.getElementById('btnResetForm');
  const btnDownloadFront = document.getElementById('btnDownloadFront');
  const btnDownloadBack = document.getElementById('btnDownloadBack');
  const btnDownloadPDF = document.getElementById('btnDownloadPDF');
  const btnPrintCard = document.getElementById('btnPrintCard');

  // --- View Mode Controls ---
  const btnModeSide = document.getElementById('btnModeSide');
  const btnModeFlip = document.getElementById('btnModeFlip');
  const cardsDisplayArea = document.getElementById('cardsDisplayArea');
  const flipCardInner = document.getElementById('flipCardInner');
  const toast = document.getElementById('toast');

  let currentScale = 1;
  let currentOffsetY = 0;
  let qrCodeInstance = null;

  // -------------------------------------------------------------------------
  // Toast Helper
  // -------------------------------------------------------------------------
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // -------------------------------------------------------------------------
  // Photo Transform Helper
  // -------------------------------------------------------------------------
  function updatePhotoTransform() {
    if (!passportPreviewImg) return;
    passportPreviewImg.style.transform = `scale(${currentScale}) translateY(${currentOffsetY}px)`;
  }

  // -------------------------------------------------------------------------
  // QR Code Generation
  // -------------------------------------------------------------------------
  function updateQRCode() {
    if (!frontQrBox) return;
    frontQrBox.innerHTML = '';

    const id = inputIdNumber.value.trim() || 'SPA/ID/STU/26/061';
    const name = inputFullName.value.trim() || 'STUDENT';
    const valid = inputValidUntil.value.trim() || '28/09/2027';
    
    // QR Code data
    const qrData = `STUDENTS PARLIAMENT NIGERIA\nID: ${id}\nName: ${name}\nStatus: ${inputStatus.value}\nValid: ${valid}`;

    try {
      if (typeof QRCode !== 'undefined') {
        qrCodeInstance = new QRCode(frontQrBox, {
          text: qrData,
          width: 80,
          height: 80,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    } catch (e) {
      console.warn('QR Code generation fallback:', e);
    }
  }

  // -------------------------------------------------------------------------
  // Barcode Generation
  // -------------------------------------------------------------------------
  function updateBarcode() {
    if (!barcodeCanvas || typeof JsBarcode === 'undefined') return;
    const rawId = inputIdNumber.value.trim() || 'SPA/ID/STU/26/061';
    
    try {
      JsBarcode(barcodeCanvas, rawId, {
        format: 'CODE128',
        width: 1.4,
        height: 30,
        displayValue: false,
        margin: 2,
        lineColor: '#111827'
      });
    } catch (e) {
      console.warn('Barcode generation fallback:', e);
    }
  }

  // -------------------------------------------------------------------------
  // Live Sync Input to Preview
  // -------------------------------------------------------------------------
  function syncPreview() {
    // Front card bindings
    if (cardBearerName) cardBearerName.textContent = inputFullName.value.trim() || 'ADEOLA SEMILORE RODI';
    if (cardBearerSchool) cardBearerSchool.textContent = inputSchool.value.trim() || '(CSGS. GBERIGBE)';
    if (cardIdNumber) cardIdNumber.textContent = inputIdNumber.value.trim() || 'SPA/ID/STU/26/061';
    if (cardCategory) cardCategory.textContent = inputCategory.value || 'STUDENT';
    if (cardDateIssued) cardDateIssued.textContent = inputDateIssued.value.trim() || '28/09/2026';
    if (cardValidUntil) cardValidUntil.textContent = inputValidUntil.value.trim() || '28/09/2027';

    // Status styling
    if (cardStatusBadge) {
      const status = inputStatus.value;
      cardStatusBadge.textContent = status;
      cardStatusBadge.className = 'status-badge';
      if (status === 'PENDING') cardStatusBadge.classList.add('pending');
      if (status === 'EXPIRED') cardStatusBadge.classList.add('expired');
    }

    // Back card bindings
    if (cardDisclaimer) {
      const formattedDisclaimer = (inputDisclaimer.value || '').replace(/\n/g, '<br>');
      cardDisclaimer.innerHTML = formattedDisclaimer;
    }
    if (cardPoliceNotice) cardPoliceNotice.textContent = inputPoliceNotice.value.trim();
    if (cardPhone) cardPhone.textContent = inputPhone.value.trim();
    if (cardEmail) cardEmail.textContent = inputEmail.value.trim();
    if (cardSignatoryName) cardSignatoryName.textContent = inputSignatoryName.value.trim();
    if (cardSignatoryTitle) cardSignatoryTitle.textContent = inputSignatoryTitle.value.trim();

    // Re-generate Barcode & QR Code
    updateBarcode();
    updateQRCode();
  }

  // Attach live event listeners to all input fields
  const allInputs = [
    inputFullName, inputSchool, inputIdNumber, inputCategory,
    inputDateIssued, inputValidUntil, inputStatus, inputDisclaimer,
    inputPhone, inputEmail, inputSignatoryName, inputSignatoryTitle,
    inputPoliceNotice
  ];

  allInputs.forEach(input => {
    if (input) {
      input.addEventListener('input', syncPreview);
      input.addEventListener('change', syncPreview);
    }
  });

  // -------------------------------------------------------------------------
  // Auto ID Generator
  // -------------------------------------------------------------------------
  if (btnGenId) {
    btnGenId.addEventListener('click', () => {
      const randomNum = String(Math.floor(Math.random() * 900) + 100);
      const catCode = inputCategory.value.substring(0, 3).toUpperCase() || 'STU';
      const yearCode = new Date().getFullYear().toString().slice(-2);
      inputIdNumber.value = `SPA/ID/${catCode}/${yearCode}/${randomNum}`;
      syncPreview();
      showToast('New ID Generated: ' + inputIdNumber.value);
    });
  }

  // -------------------------------------------------------------------------
  // Passport Image Upload Handler & Drag-Drop
  // -------------------------------------------------------------------------
  if (uploadZone && passportInput) {
    uploadZone.addEventListener('click', () => passportInput.click());

    ['dragenter', 'dragover'].forEach(eventName => {
      uploadZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.remove('dragover');
      });
    });

    uploadZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        handleImageFile(files[0]);
      }
    });

    passportInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleImageFile(e.target.files[0]);
      }
    });
  }

  function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (passportPreviewImg) {
        passportPreviewImg.src = e.target.result;
        // Reset scale and offset
        currentScale = 1;
        currentOffsetY = 0;
        if (photoScale) photoScale.value = 100;
        if (scaleValue) scaleValue.textContent = '100%';
        if (photoOffsetY) photoOffsetY.value = 0;
        updatePhotoTransform();
        showToast('Passport photograph updated!');
      }
    };
    reader.readAsDataURL(file);
  }

  // Sliders for Photo Position
  if (photoScale) {
    photoScale.addEventListener('input', (e) => {
      currentScale = parseInt(e.target.value, 10) / 100;
      if (scaleValue) scaleValue.textContent = `${e.target.value}%`;
      updatePhotoTransform();
    });
  }

  if (photoOffsetY) {
    photoOffsetY.addEventListener('input', (e) => {
      currentOffsetY = parseInt(e.target.value, 10);
      updatePhotoTransform();
    });
  }

  // -------------------------------------------------------------------------
  // Accordion Toggle for Back Settings
  // -------------------------------------------------------------------------
  if (btnToggleSettings && accordionContent) {
    btnToggleSettings.addEventListener('click', () => {
      const isOpen = accordionContent.classList.contains('open');
      if (isOpen) {
        accordionContent.classList.remove('open');
        accordionIcon.style.transform = 'rotate(0deg)';
      } else {
        accordionContent.classList.add('open');
        accordionIcon.style.transform = 'rotate(180deg)';
      }
    });
  }

  // -------------------------------------------------------------------------
  // View Modes: Side-by-Side vs 3D Flip
  // -------------------------------------------------------------------------
  if (btnModeSide && btnModeFlip && cardsDisplayArea) {
    btnModeSide.addEventListener('click', () => {
      btnModeSide.classList.add('active');
      btnModeFlip.classList.remove('active');
      cardsDisplayArea.classList.remove('flip-mode');
      if (flipCardInner) flipCardInner.classList.remove('flipped');
    });

    btnModeFlip.addEventListener('click', () => {
      btnModeFlip.classList.add('active');
      btnModeSide.classList.remove('active');
      cardsDisplayArea.classList.add('flip-mode');
    });

    if (flipCardInner) {
      flipCardInner.addEventListener('click', () => {
        if (cardsDisplayArea.classList.contains('flip-mode')) {
          flipCardInner.classList.toggle('flipped');
        }
      });
    }
  }

  // -------------------------------------------------------------------------
  // Load Demo Data / Clear Form
  // -------------------------------------------------------------------------
  if (btnLoadDemo) {
    btnLoadDemo.addEventListener('click', () => {
      inputFullName.value = 'ADEOLA SEMILORE RODI';
      inputSchool.value = 'CSGS. GBERIGBE';
      inputIdNumber.value = 'SPA/ID/STU/26/061';
      inputCategory.value = 'STUDENT';
      inputDateIssued.value = '28/09/2026';
      inputValidUntil.value = '28/09/2027';
      inputStatus.value = 'ACTIVE';

      passportPreviewImg.src = 'image/sample-passport.jpg';
      currentScale = 1;
      currentOffsetY = 0;
      if (photoScale) photoScale.value = 100;
      if (scaleValue) scaleValue.textContent = '100%';
      if (photoOffsetY) photoOffsetY.value = 0;
      updatePhotoTransform();

      inputDisclaimer.value = "This is to certify that the bearer whose\nName and Passport appearing overleaf\nis a member of";
      inputPhone.value = '+2348088882028';
      inputEmail.value = 'info@studentparliament.africa';
      inputSignatoryName.value = 'PRINCE ITUEN UMANAH';
      inputSignatoryTitle.value = 'PRESIDENT, STUDENTS PARLIAMENT AFRICA';
      inputPoliceNotice.value = 'If found kindly report to the nearest Police station';

      syncPreview();
      showToast('Loaded sample student data!');
    });
  }

  if (btnResetForm) {
    btnResetForm.addEventListener('click', () => {
      inputFullName.value = '';
      inputSchool.value = '';
      inputIdNumber.value = '';
      inputDateIssued.value = '';
      inputValidUntil.value = '';
      syncPreview();
      showToast('Form fields cleared');
    });
  }

  // -------------------------------------------------------------------------
  // High-Resolution Card Export Functions
  // -------------------------------------------------------------------------
  async function downloadCardAsImage(cardElement, filename) {
    if (typeof html2canvas === 'undefined') {
      alert('html2canvas library is loading, please try again in a moment.');
      return;
    }

    showToast('Rendering high-resolution card...');

    try {
      const canvas = await html2canvas(cardElement, {
        scale: 3, // 3x high DPI render for print crispness
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fffdf9'
      });

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      showToast('Download complete: ' + filename);
    } catch (err) {
      console.error('Error rendering card:', err);
      alert('Unable to generate image. Please try again.');
    }
  }

  if (btnDownloadFront && cardFront) {
    btnDownloadFront.addEventListener('click', () => {
      const id = (inputIdNumber.value.trim() || 'student').replace(/[\/\\]/g, '-');
      downloadCardAsImage(cardFront, `ID-Front-${id}.png`);
    });
  }

  if (btnDownloadBack && cardBack) {
    btnDownloadBack.addEventListener('click', () => {
      const id = (inputIdNumber.value.trim() || 'student').replace(/[\/\\]/g, '-');
      downloadCardAsImage(cardBack, `ID-Back-${id}.png`);
    });
  }

  // Export Both Front & Back as PDF
  if (btnDownloadPDF) {
    btnDownloadPDF.addEventListener('click', async () => {
      if (typeof html2canvas === 'undefined' || !window.jspdf) {
        alert('Export libraries are initializing. Please wait a moment.');
        return;
      }

      showToast('Generating high-res PDF...');

      try {
        const { jsPDF } = window.jspdf;
        // Standard CR80 ID Card dimensions: 54mm x 85.6mm (portrait)
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [54, 85.6]
        });

        // Render Front
        const canvasFront = await html2canvas(cardFront, { scale: 3, useCORS: true, backgroundColor: '#fffdf9' });
        const imgFrontData = canvasFront.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgFrontData, 'JPEG', 0, 0, 54, 85.6);

        // Add Back page
        pdf.addPage([54, 85.6], 'portrait');
        const canvasBack = await html2canvas(cardBack, { scale: 3, useCORS: true, backgroundColor: '#fffdf9' });
        const imgBackData = canvasBack.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgBackData, 'JPEG', 0, 0, 54, 85.6);

        const id = (inputIdNumber.value.trim() || 'student').replace(/[\/\\]/g, '-');
        pdf.save(`ID-Card-${id}.pdf`);
        showToast('PDF Downloaded successfully!');
      } catch (err) {
        console.error('PDF export error:', err);
        alert('Could not export PDF. Please try again.');
      }
    });
  }

  // Print Action
  if (btnPrintCard) {
    btnPrintCard.addEventListener('click', () => {
      window.print();
    });
  }

  // Initialize display
  syncPreview();
});
