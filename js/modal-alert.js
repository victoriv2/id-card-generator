/**
 * Students Parliament Nigeria - Universal Modal Alert System
 * Replaces native browser alert() and confirm() with modern, accessible SPN modals.
 */

(function () {
  'use strict';

  // SVG Icons for different notification types
  const ICONS = {
    warning: `<svg width="34" height="34" fill="currentColor" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
    error: `<svg width="34" height="34" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`,
    success: `<svg width="34" height="34" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
    info: `<svg width="34" height="34" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`
  };

  let modalBackdrop = null;
  let modalDialog = null;
  let iconEl = null;
  let titleEl = null;
  let messageEl = null;
  let actionsEl = null;
  let activeResolve = null;

  function ensureModalDOM() {
    if (modalBackdrop) return;

    modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'spn-modal-alert-backdrop';
    modalBackdrop.setAttribute('role', 'dialog');
    modalBackdrop.setAttribute('aria-modal', 'true');
    modalBackdrop.setAttribute('aria-hidden', 'true');

    modalDialog = document.createElement('div');
    modalDialog.className = 'spn-modal-alert-dialog';

    iconEl = document.createElement('div');
    iconEl.className = 'spn-modal-alert-icon';

    titleEl = document.createElement('h3');
    titleEl.className = 'spn-modal-alert-title';

    messageEl = document.createElement('div');
    messageEl.className = 'spn-modal-alert-message';

    actionsEl = document.createElement('div');
    actionsEl.className = 'spn-modal-alert-actions';

    modalDialog.appendChild(iconEl);
    modalDialog.appendChild(titleEl);
    modalDialog.appendChild(messageEl);
    modalDialog.appendChild(actionsEl);
    modalBackdrop.appendChild(modalDialog);
    document.body.appendChild(modalBackdrop);

    // Close on backdrop click
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop && activeResolve) {
        closeModal(false);
      }
    });

    // Close on ESC key or Enter
    document.addEventListener('keydown', (e) => {
      if (!modalBackdrop.classList.contains('is-active')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal(false);
      }
    });
  }

  function closeModal(result) {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('is-active');
    modalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (typeof activeResolve === 'function') {
      const res = activeResolve;
      activeResolve = null;
      res(result);
    }
  }

  /**
   * Display a custom SPN modal alert
   * @param {string} message - Message text
   * @param {Object} [options] - Options { title, type: 'info'|'warning'|'error'|'success', btnText }
   * @returns {Promise<void>}
   */
  function showModalAlert(message, options = {}) {
    ensureModalDOM();

    return new Promise((resolve) => {
      activeResolve = resolve;

      const type = options.type || (message.toLowerCase().includes('error') ? 'error' : (message.toLowerCase().includes('wait') || message.toLowerCase().includes('please')) ? 'warning' : 'info');
      const title = options.title || (type === 'error' ? 'Error' : type === 'warning' ? 'Attention' : type === 'success' ? 'Success' : 'Notice');
      const btnText = options.btnText || 'OK';

      iconEl.className = `spn-modal-alert-icon ${type}`;
      iconEl.innerHTML = ICONS[type] || ICONS.info;

      titleEl.textContent = title;
      messageEl.textContent = message || '';

      actionsEl.innerHTML = '';
      const okBtn = document.createElement('button');
      okBtn.type = 'button';
      okBtn.className = 'spn-modal-alert-btn spn-modal-alert-btn-primary';
      okBtn.textContent = btnText;
      okBtn.addEventListener('click', () => closeModal(true));
      actionsEl.appendChild(okBtn);

      document.body.style.overflow = 'hidden';
      modalBackdrop.classList.add('is-active');
      modalBackdrop.setAttribute('aria-hidden', 'false');

      // Auto-focus OK button
      setTimeout(() => okBtn.focus(), 80);
    });
  }

  /**
   * Display a custom SPN modal confirmation
   * @param {string} message - Prompt text
   * @param {Object} [options] - Options { title, confirmText, cancelText, type }
   * @returns {Promise<boolean>}
   */
  function showModalConfirm(message, options = {}) {
    ensureModalDOM();

    return new Promise((resolve) => {
      activeResolve = resolve;

      const type = options.type || 'warning';
      const title = options.title || 'Please Confirm';
      const confirmText = options.confirmText || 'Confirm';
      const cancelText = options.cancelText || 'Cancel';

      iconEl.className = `spn-modal-alert-icon ${type}`;
      iconEl.innerHTML = ICONS[type] || ICONS.warning;

      titleEl.textContent = title;
      messageEl.textContent = message || '';

      actionsEl.innerHTML = '';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'spn-modal-alert-btn spn-modal-alert-btn-cancel';
      cancelBtn.textContent = cancelText;
      cancelBtn.addEventListener('click', () => closeModal(false));

      const confirmBtn = document.createElement('button');
      confirmBtn.type = 'button';
      confirmBtn.className = 'spn-modal-alert-btn spn-modal-alert-btn-primary';
      confirmBtn.textContent = confirmText;
      confirmBtn.addEventListener('click', () => closeModal(true));

      actionsEl.appendChild(cancelBtn);
      actionsEl.appendChild(confirmBtn);

      document.body.style.overflow = 'hidden';
      modalBackdrop.classList.add('is-active');
      modalBackdrop.setAttribute('aria-hidden', 'false');

      setTimeout(() => confirmBtn.focus(), 80);
    });
  }

  // Export methods globally
  window.showModalAlert = showModalAlert;
  window.showModalConfirm = showModalConfirm;

  // Seamlessly override native browser alert() so any alert() call renders the SPN modal
  window.alert = function (message) {
    return showModalAlert(message);
  };
})();
