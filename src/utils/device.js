import { v4 as uuidv4 } from 'uuid';

/**
 * Gets the persistent device ID from localStorage or generates a new one.
 */
export const getDeviceId = () => {
  let deviceId = localStorage.getItem('medease_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID ? crypto.randomUUID() : uuidv4();
    localStorage.setItem('medease_device_id', deviceId);
  }
  return deviceId;
};

/**
 * Returns a human-readable name for the current browser/OS.
 */
export const getDeviceName = () => {
  const ua = navigator.userAgent;
  let browser = "Unknown Browser";
  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  let os = "Unknown OS";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "MacOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return `${browser} on ${os}`;
};
