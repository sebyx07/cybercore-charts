/**
 * Checks for data typed into a playground. Each returns a sentence saying
 * what is wrong, or null when the value can go to the chart as it is.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function nonEmptyArray(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return 'Expected an array: [ … ].';
  }
  return value.length === 0 ? 'The array is empty. Add at least one item.' : null;
}

function pointError(point: unknown, where: string): string | null {
  if (!isRecord(point)) {
    return `${where} is not an object like { "x": "Mon", "y": 12 }.`;
  }
  if (typeof point.x !== 'string' && !isNumber(point.x)) {
    return `${where} needs "x": a label or a number.`;
  }
  if (!isNumber(point.y)) {
    return `${where} needs "y": a number.`;
  }
  return null;
}

function firstError<T>(items: T[], check: (item: T, index: number) => string | null) {
  for (const [index, item] of items.entries()) {
    const error = check(item, index);
    if (error) {
      return error;
    }
  }
  return null;
}

/** An array of { x, y } points, or an array of { id, name, data } series. */
export function validatePointsOrSeries(value: unknown): string | null {
  const arrayError = nonEmptyArray(value);
  if (arrayError) {
    return arrayError;
  }
  const items = value as unknown[];
  const isSeries = isRecord(items[0]) && Array.isArray(items[0].data);
  if (!isSeries) {
    return firstError(items, (point, index) => pointError(point, `Point ${index + 1}`));
  }
  return firstError(items, (series, index) => {
    const where = `Series ${index + 1}`;
    if (!isRecord(series) || !Array.isArray(series.data)) {
      return `${where} needs "data": an array of points.`;
    }
    if (typeof series.id !== 'string' || typeof series.name !== 'string') {
      return `${where} needs an "id" and a "name".`;
    }
    return firstError(series.data, (point, at) => pointError(point, `${where}, point ${at + 1}`));
  });
}

/** An array of { label, value } segments. */
export function validateSegments(value: unknown): string | null {
  const arrayError = nonEmptyArray(value);
  if (arrayError) {
    return arrayError;
  }
  return firstError(value as unknown[], (segment, index) => {
    const where = `Segment ${index + 1}`;
    if (!isRecord(segment) || typeof segment.label !== 'string') {
      return `${where} needs a "label".`;
    }
    if (!isNumber(segment.value) || segment.value < 0) {
      return `${where} needs "value": a number, zero or more.`;
    }
    return null;
  });
}

/** An array of numbers. */
export function validateNumbers(value: unknown): string | null {
  const arrayError = nonEmptyArray(value);
  if (arrayError) {
    return arrayError;
  }
  const at = (value as unknown[]).findIndex((item) => !isNumber(item));
  return at === -1 ? null : `Item ${at + 1} is not a number.`;
}

const THEMES = ['cyan', 'magenta', 'green', 'yellow'];

/** An array of { value, theme | color } zones. An empty array means no zones. */
export function validateThresholds(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return 'Expected an array: [ … ]. Use [] for no zones.';
  }
  return firstError(value, (zone, index) => {
    const where = `Zone ${index + 1}`;
    if (!isRecord(zone) || !isNumber(zone.value)) {
      return `${where} needs "value": the number where the zone ends.`;
    }
    if (zone.theme !== undefined && !THEMES.includes(zone.theme as string)) {
      return `${where}: "theme" is one of ${THEMES.join(', ')}.`;
    }
    if (zone.theme === undefined && typeof zone.color !== 'string') {
      return `${where} needs a "theme" or a "color".`;
    }
    return null;
  });
}
