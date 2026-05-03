/**
 * 🛡️ [VANGUARD] Stable Fingerprinting & Clock Sync (Admin v32.0)
 */

let clientTimeOffset = 0; // ms difference between client and server

/**
 * Returns a stable device ID for the current browser instance.
 * Persists across sessions in localStorage.
 */
export const getDeviceId = (): string => {
  const STORAGE_KEY = 'vanguard_device_id';
  let deviceId = localStorage.getItem(STORAGE_KEY);
  
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  
  return deviceId;
};

/**
 * Synchronizes the local clock with the server's authoritative time.
 * @param serverTime authoritative timestamp from server response headers
 */
export const syncClock = (serverTime: number) => {
  clientTimeOffset = serverTime - Date.now();
  console.info(`[VANGUARD_CLOCK_SYNC] Offset adjusted to: ${clientTimeOffset}ms`);
};

/**
 * Returns the current synchronized server time.
 */
export const getSynchronizedTime = (): string => {
  return (Date.now() + clientTimeOffset).toString();
};
