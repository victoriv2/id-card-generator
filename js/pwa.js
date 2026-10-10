/**
 * Students Parliament Nigeria - Progressive Web App (PWA) & Web Share Helper
 * Works across both iOS (Safari) and Android (Chrome, Samsung Internet, Edge, etc.)
 */

(function () {
  'use strict';

  // 1. Register Service Worker
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then((reg) => {
        console.log('[PWA] Service Worker registered with scope:', reg.scope);
      }).catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
    });
  }

  // Detect Standalone (already installed as Web App)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  let deferredInstallPrompt = null;

  // ---------------------------------------------------------------------------
  // 2. Android & Desktop Chrome/Edge Install Prompt Listener
  // ---------------------------------------------------------------------------
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default mini-infobar or automatic prompt
    e.preventDefault();
    deferredInstallPrompt = e;
    console.log('[PWA] beforeinstallprompt event captured');

    // Notify any install buttons on the page
    document.querySelectorAll('.btn-pwa-install, #btnPwaInstallHeader, #btnPwaInstallPortal').forEach((btn) => {
      btn.style.display = 'inline-flex';
    });

    // Optionally show floating install banner if not dismissed before
    showInstallBanner();
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] Application successfully installed!');
    deferredInstallPrompt = null;
    hideInstallBanner();
    document.querySelectorAll('.btn-pwa-install, #btnPwaInstallHeader, #btnPwaInstallPortal').forEach((btn) => {
      btn.style.display = 'none';
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Trigger Installation (Android vs iOS)
  // ---------------------------------------------------------------------------
  function triggerInstall() {
    if (deferredInstallPrompt) {
      // Android / Chromium
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] User accepted the installation');
          hideInstallBanner();
        } else {
          console.log('[PWA] User dismissed the installation');
        }
        deferredInstallPrompt = null;
      });
    } else if (isIOS) {
      // iOS Safari manual "Add to Home Screen" instructions
      showIOSInstallModal();
    } else {
      // Standard browser guidance
      if (typeof window.showModalAlert === 'function') {
        window.showModalAlert('To install this app on your phone, open your browser menu (⋮) and tap "Install app" or "Add to Home screen".', {
          title: 'Install SPN Portal',
          type: 'info'
        });
      } else {
        alert('To install this app, open your browser menu and tap "Add to Home screen" or "Install App".');
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 4. iOS Safari Add to Home Screen Instructions Modal
  // ---------------------------------------------------------------------------
  function showIOSInstallModal() {
    let modal = document.getElementById('iosInstallModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'iosInstallModal';
      modal.className = 'ios-install-modal-backdrop';
      modal.innerHTML = `
        <div class="ios-install-modal-card">
          <div class="ios-modal-header">
            <div class="ios-modal-title">
              <img src="icons/icon-192.png" alt="SPN Logo" style="width: 26px; height: 26px; border-radius: 6px;">
              <span>Install on iPhone / iPad</span>
            </div>
            <button type="button" class="btn-pwa-close" id="btnCloseIOSModal" aria-label="Close">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
          <ol class="ios-step-list">
            <li class="ios-step-item">
              <span class="ios-step-num">1</span>
              <span>Tap the <strong>Share</strong> button <span class="ios-icon-inline"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8m-4-6l-4-4m0 0L8 6m4-4v12"/></svg></span> at the bottom of Safari.</span>
            </li>
            <li class="ios-step-item">
              <span class="ios-step-num">2</span>
              <span>Scroll down and select <strong>"Add to Home Screen"</strong> <span class="ios-icon-inline"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg></span>.</span>
            </li>
            <li class="ios-step-item">
              <span class="ios-step-num">3</span>
              <span>Tap <strong>Add</strong> in the top-right corner to finish installing!</span>
            </li>
          </ol>
          <button type="button" class="btn-ios-got-it" id="btnDismissIOSModal">Got It</button>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#btnCloseIOSModal').addEventListener('click', hideIOSInstallModal);
      modal.querySelector('#btnDismissIOSModal').addEventListener('click', hideIOSInstallModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) hideIOSInstallModal();
      });
    }
    modal.style.display = 'flex';
  }

  function hideIOSInstallModal() {
    const modal = document.getElementById('iosInstallModal');
    if (modal) modal.style.display = 'none';
  }

  // ---------------------------------------------------------------------------
  // 5. Floating Install Banner
  // ---------------------------------------------------------------------------
  function showInstallBanner() {
    if (isStandalone) return;
    try {
      const dismissed = localStorage.getItem('spa_pwa_banner_dismissed');
      if (dismissed && Date.now() - parseInt(dismissed, 10) < 24 * 60 * 60 * 1000) {
        return; // dismissed within last 24h
      }
    } catch (e) {}

    let banner = document.getElementById('pwaInstallBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'pwaInstallBanner';
      banner.className = 'pwa-install-banner';
      banner.innerHTML = `
        <div class="pwa-banner-left">
          <img src="icons/icon-192.png" alt="SPN Logo" class="pwa-banner-icon">
          <div class="pwa-banner-text">
            <span class="pwa-banner-title">Students Parliament Nigeria</span>
            <span class="pwa-banner-desc">Install app on your phone for quick access</span>
          </div>
        </div>
        <div class="pwa-banner-actions">
          <button type="button" class="btn-pwa-install-now" id="btnPwaBannerInstall">
            <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>
            <span>Install</span>
          </button>
          <button type="button" class="btn-pwa-close" id="btnPwaBannerClose" title="Dismiss">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
      `;
      document.body.appendChild(banner);

      banner.querySelector('#btnPwaBannerInstall').addEventListener('click', triggerInstall);
      banner.querySelector('#btnPwaBannerClose').addEventListener('click', () => {
        hideInstallBanner();
        try {
          localStorage.setItem('spa_pwa_banner_dismissed', Date.now().toString());
        } catch (e) {}
      });
    }
    banner.style.display = 'flex';
  }

  function hideInstallBanner() {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.style.display = 'none';
  }

  // ---------------------------------------------------------------------------
  // 6. Native Share API (Both iOS & Android)
  // ---------------------------------------------------------------------------
  async function sharePortal() {
    const shareUrl = (window.location.origin && window.location.origin.startsWith('http')) 
      ? window.location.href.split('#')[0] 
      : 'https://students-parliament-id-generator-live.vercel.app/';
    const shareData = {
      title: 'Students Parliament Nigeria - ID & Membership Portal',
      text: 'Official identification portal for Students Parliament Nigeria. Generate or retrieve your digital ID card online!',
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log('[PWA] Shared successfully via native share sheet');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('[PWA] Share error:', err);
          fallbackCopyShare(shareData.url);
        }
      }
    } else {
      fallbackCopyShare(shareData.url);
    }
  }

  function fallbackCopyShare(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        if (typeof window.showModalAlert === 'function') {
          window.showModalAlert('Portal link copied to clipboard! You can now paste and share it on WhatsApp, Telegram, or social media.', {
            title: 'Link Copied',
            type: 'success'
          });
        } else {
          alert('Link copied to clipboard: ' + url);
        }
      }).catch(() => {
        prompt('Copy portal link to share:', url);
      });
    } else {
      prompt('Copy portal link to share:', url);
    }
  }

  // Expose global methods
  window.SPNPwa = {
    triggerInstall,
    sharePortal,
    isStandalone,
    isIOS
  };

  // Wire buttons on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    // Attach click to any install triggers
    document.querySelectorAll('.btn-pwa-install, #btnPwaInstallHeader, #btnPwaInstallPortal').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        triggerInstall();
      });
      // Show install button on iOS or if install prompt is already ready
      if (isIOS && !isStandalone) {
        btn.style.display = 'inline-flex';
      }
    });

    // Attach click to any share triggers
    document.querySelectorAll('.btn-pwa-share, #btnPwaShareHeader, #btnPwaSharePortal').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        sharePortal();
      });
    });

    // On iOS Safari, show prompt banner after 3 seconds if not in standalone mode
    if (isIOS && !isStandalone) {
      setTimeout(() => {
        showInstallBanner();
      }, 3500);
    }
  });
})();
