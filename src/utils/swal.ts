import Swal from 'sweetalert2';

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

/**
 * Show success message
 */
export const showSuccess = (message: string, title: string = 'Success!') => {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    confirmButtonColor: colors.primary,
    confirmButtonText: 'OK',
    timer: 3000,
    timerProgressBar: true
  });
};

/**
 * Show error message
 */
export const showError = (message: string, title: string = 'Error!') => {
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonColor: colors.primary,
    confirmButtonText: 'OK'
  });
};

/**
 * Show warning message
 */
export const showWarning = (message: string, title: string = 'Warning!') => {
  return Swal.fire({
    icon: 'warning',
    title,
    text: message,
    confirmButtonColor: colors.primary,
    confirmButtonText: 'OK'
  });
};

/**
 * Show info message
 */
export const showInfo = (message: string, title: string = 'Info') => {
  return Swal.fire({
    icon: 'info',
    title,
    text: message,
    confirmButtonColor: colors.primary,
    confirmButtonText: 'Got it'
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
    confirmButtonColor: colors.primary,
    cancelButtonColor: '#6c757d',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText
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
    }
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
