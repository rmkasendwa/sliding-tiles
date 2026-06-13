'use client';

export const STORAGE_CONSENT_KEY = 'sliding-tiles:cookie-consent';
export const STORAGE_CONSENT_EVENT =
  'sliding-tiles:cookie-consent-changed';

export function hasStorageConsent() {
  try {
    return window.localStorage.getItem(STORAGE_CONSENT_KEY) === 'accepted';
  } catch {
    return false;
  }
}

export function subscribeToStorageConsent(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(STORAGE_CONSENT_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(STORAGE_CONSENT_EVENT, onStoreChange);
  };
}

export function acceptStorageConsent() {
  try {
    window.localStorage.setItem(STORAGE_CONSENT_KEY, 'accepted');
  } finally {
    window.dispatchEvent(new Event(STORAGE_CONSENT_EVENT));
  }
}
