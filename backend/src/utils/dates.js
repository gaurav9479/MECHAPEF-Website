/**
 * Timezone & Date Normalization Utility for IST (Asia/Kolkata / UTC+5:30)
 * Prevents offset-less datetime-local strings from shifting across timezones.
 */

/**
 * Converts any date representation into a Date object in IST (+05:30)
 * if no explicit timezone/offset is present.
 *
 * @param {string|Date|null|undefined} dateInput
 * @returns {Date|null}
 */
export const toIST = (dateInput) => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return null;

    // Pattern: YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss without timezone offset (no Z, no +/-HH:mm)
    const offsetlessMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)$/);
    if (offsetlessMatch) {
      const date = new Date(`${trimmed}+05:30`);
      return isNaN(date.getTime()) ? null : date;
    }

    // Pattern: YYYY-MM-DD (date only)
    const dateOnlyMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})$/);
    if (dateOnlyMatch) {
      const date = new Date(`${trimmed}T00:00:00+05:30`);
      return isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(trimmed);
    return isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(dateInput);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Normalizes event date fields in the request body to ensure
 * they are correctly parsed as IST and stored as standard UTC Dates.
 *
 * @param {Object} body
 * @returns {Object}
 */
export const normalizeEventDates = (body) => {
  if (!body || typeof body !== 'object') return body;

  const dateFields = [
    'startTime',
    'endTime',
    'registrationStartDate',
    'registrationDeadline'
  ];

  dateFields.forEach((field) => {
    if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
      // A date-only end date means the whole local calendar day, not midnight.
      const raw = String(body[field]).trim();
      const parsed = field === 'endTime' && /^\d{4}-\d{2}-\d{2}$/.test(raw)
        ? toIST(`${raw}T23:59:59`)
        : toIST(body[field]);
      if (parsed) {
        body[field] = parsed;
      }
    }
  });

  return body;
};
