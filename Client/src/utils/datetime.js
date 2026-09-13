/**
 * Frontend Datetime & Timezone Utilities for IST (Asia/Kolkata)
 */

/**
 * Converts datetime-local input string ("YYYY-MM-DDTHH:mm") to an ISO UTC string,
 * interpreting the local input as Asia/Kolkata (IST, UTC+5:30).
 *
 * @param {string} localStr - datetime-local input string
 * @returns {string|null} - ISO string in UTC or null
 */
export const localInputToISO = (localStr) => {
  if (!localStr) return null;
  if (typeof localStr === 'string' && localStr.endsWith('Z')) return localStr;
  
  let trimmed = typeof localStr === 'string' ? localStr.trim() : '';
  if (!trimmed) return null;

  // If format is YYYY-MM-DDTHH:mm, append seconds
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    trimmed = `${trimmed}:00`;
  }

  // If format is YYYY-MM-DDTHH:mm:ss without timezone, append IST offset
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    trimmed = `${trimmed}+05:30`;
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

/**
 * Converts an ISO date string into "YYYY-MM-DDTHH:mm" in IST (Asia/Kolkata)
 * suitable for populating an <input type="datetime-local">.
 *
 * @param {string|Date} isoString - ISO date string or Date object
 * @returns {string} - "YYYY-MM-DDTHH:mm" in IST
 */
export const isoToLocalInput = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  let hour = get('hour');
  if (hour === '24') hour = '00';

  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
};

/**
 * Formats an event date and time string in IST (Asia/Kolkata).
 * e.g., "15 Mar 2026, 10:00 AM" or custom options.
 *
 * @param {string|Date} isoString
 * @param {Intl.DateTimeFormatOptions} options
 * @returns {string}
 */
export const formatEventDateTime = (isoString, options = {}) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '—';

  const defaultOptions = {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options
  };

  return d.toLocaleString('en-IN', defaultOptions);
};

/**
 * Formats an event date in IST (Asia/Kolkata).
 * e.g., "15 Mar 2026"
 *
 * @param {string|Date} isoString
 * @param {Intl.DateTimeFormatOptions} options
 * @returns {string}
 */
export const formatEventDate = (isoString, options = {}) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '—';

  const defaultOptions = {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options
  };

  return d.toLocaleDateString('en-IN', defaultOptions);
};

/**
 * Formats an event time in IST (Asia/Kolkata).
 * e.g., "10:00 AM"
 *
 * @param {string|Date} isoString
 * @param {Intl.DateTimeFormatOptions} options
 * @returns {string}
 */
export const formatEventTime = (isoString, options = {}) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '—';

  const defaultOptions = {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options
  };

  return d.toLocaleTimeString('en-IN', defaultOptions);
};
