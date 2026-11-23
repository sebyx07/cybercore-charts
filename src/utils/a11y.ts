/**
 * CyberCore Charts - Accessibility Helpers
 * Screen-reader data table fallback.
 */

/**
 * Tabular view of a chart's data. `rows[n][0]` is the row header.
 */
export interface ChartDataTable {
  caption: string;
  headers: string[];
  rows: string[][];
}

/** Rows rendered at most; beyond this a table stops being usable by ear */
export const MAX_TABLE_ROWS = 500;

const VISUALLY_HIDDEN =
  'position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;' +
  'overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;';

function cell(tag: 'th' | 'td', text: string, scope?: 'col' | 'row'): HTMLTableCellElement {
  const el = document.createElement(tag);
  if (scope) {
    el.setAttribute('scope', scope);
  }
  el.textContent = text;
  return el;
}

/**
 * Builds a visually hidden HTML table for assistive technology.
 * Long datasets are cut to MAX_TABLE_ROWS and the caption says so.
 */
export function createDataTable(data: ChartDataTable, className: string): HTMLTableElement {
  const table = document.createElement('table');
  table.className = className;
  table.style.cssText = VISUALLY_HIDDEN;

  const shown = data.rows.slice(0, MAX_TABLE_ROWS);
  const caption = document.createElement('caption');
  caption.textContent =
    shown.length < data.rows.length
      ? `${data.caption} (first ${shown.length} of ${data.rows.length} rows)`
      : data.caption;
  table.appendChild(caption);

  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  data.headers.forEach((header) => headRow.appendChild(cell('th', header, 'col')));
  head.appendChild(headRow);
  table.appendChild(head);

  const body = document.createElement('tbody');
  for (const row of shown) {
    const tr = document.createElement('tr');
    row.forEach((value, i) =>
      tr.appendChild(i === 0 ? cell('th', value, 'row') : cell('td', value))
    );
    body.appendChild(tr);
  }
  table.appendChild(body);

  return table;
}
