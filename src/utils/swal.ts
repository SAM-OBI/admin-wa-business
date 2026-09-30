import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';

// ShopVia Color System v2 confirm-button palette. SweetAlert2 renders through
// its own injected stylesheet outside our Tailwind/CSS-variable pipeline, so
// these stay literal hex (light-mode values) rather than sv-* token classes —
// see src/index.css for the canonical --sv-primary definition this mirrors.
const colors = {
  primary: '#0B4F3A',
  secondary: '#D8C3A5',
  dark: '#4A3728',
  light: '#F5F5DC'
};

// 🛡️ [MODAL-MOBILE-1] showConfirm/showLoading/celebrate (the blocking-modal
// category) target these classes via customClass + buttonsStyling:false —
// see index.css for the actual mobile-first sizing/touch-target/typography
// rules. showSuccess/showError/showWarning/showInfo below were converted
// from full centered modals to toasts (see their own comment) so they don't
// need this treatment.
const MODAL_CUSTOM_CLASS = {
  popup: 'sv-swal-popup',
  title: 'sv-swal-title',
  htmlContainer: 'sv-swal-html-container',
  actions: 'sv-swal-actions',
  input: 'sv-swal-input',
  confirmButton: 'sv-swal-confirm-btn',
  cancelButton: 'sv-swal-cancel-btn'
};

/**
 * Show success message
 *
 * 🛡️ [MODAL-MOBILE-1] Was a full centered modal (confirmButtonColor,
 * timerProgressBar, no toast:true) — the one place in the whole app where a
 * routine success notice popped as a large blocking dialog instead of the
 * small top-end toast every other success/error/warning/info uses (the main
 * app's own SweetAlertNotificationAdapter.ts, and this file's own
 * showToast() below). Confirmed safe to change: none of this function's 9
 * call sites await its return value or otherwise depend on a user clicking
 * a button before continuing — every one is fire-and-forget.
 */
export const showSuccess = (message: string, title: string = 'Success!') => {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title,
    text: message,
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true
  });
};

/**
 * Show error message
 */
export const showError = (message: string, title: string = 'Error!') => {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'error',
    title,
    text: message,
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true
  });
};

/**
 * Show warning message
 */
export const showWarning = (message: string, title: string = 'Warning!') => {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'warning',
    title,
    text: message,
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true
  });
};

/**
 * Show info message
 */
export const showInfo = (message: string, title: string = 'Info') => {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'info',
    title,
    text: message,
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true
  });
};

/**
 * Show confirmation dialog
 */
export const showConfirm = (
  message: string,
  title: string = 'Are you sure?',
  confirmText: string = 'Yes',
  cancelText: string = 'No'
) => {
  return Swal.fire({
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    buttonsStyling: false,
    customClass: MODAL_CUSTOM_CLASS
  });
};

/**
 * Show loading message
 */
export const showLoading = (message: string = 'Please wait...') => {
  Swal.fire({
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    willOpen: () => {
      Swal.showLoading();
    },
    customClass: { popup: 'sv-swal-popup', title: 'sv-swal-title' }
  });
};

/**
 * Close loading message
 */
export const closeLoading = () => {
  Swal.close();
};

/**
 * Show toast notification (small popup at top-right)
 */
export const showToast = (
  message: string,
  icon: 'success' | 'error' | 'warning' | 'info' = 'success'
) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  Toast.fire({
    icon,
    title: message
  });
};

/**
 * 🛡️ [MODAL-MOBILE-1] Modal + confetti celebration for a genuine success
 * moment — mirrors the main app's SweetAlertNotificationAdapter.celebrate(),
 * same brand-green/gold burst, this app's own primary color rather than the
 * main app's --color-primary token (separate palettes).
 */
export const celebrate = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    confirmButtonText: 'Awesome!',
    buttonsStyling: false,
    customClass: MODAL_CUSTOM_CLASS,
    didOpen: () => {
      const end = Date.now() + 1200;
      (function frame() {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: [colors.primary, '#C89B2C', '#ffffff'] });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: [colors.primary, '#C89B2C', '#ffffff'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
  });
};
