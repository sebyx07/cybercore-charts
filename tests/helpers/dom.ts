/**
 * Shared helpers for DOM-backed chart tests (happy-dom environment)
 */

/** Creates a sized container attached to the document body */
export function mount(width = 400, height = 300): HTMLDivElement {
  const el = document.createElement('div');
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;
  document.body.appendChild(el);
  return el;
}

/** Removes everything the previous test left in the document */
export function resetDocument(): void {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-motion');
  document.documentElement.removeAttribute('data-contrast');
}

/** Serialized markup of an element, for "no NaN anywhere" style assertions */
export function markup(el: Element): string {
  return el.outerHTML;
}

/** All numeric values of an attribute across matching elements */
export function numbers(root: ParentNode, selector: string, attr: string): number[] {
  return Array.from(root.querySelectorAll(selector)).map((el) =>
    parseFloat(el.getAttribute(attr) ?? 'NaN')
  );
}

/** Text content of every element matching a selector */
export function texts(root: ParentNode, selector: string): string[] {
  return Array.from(root.querySelectorAll(selector)).map((el) => el.textContent ?? '');
}

/** Dispatches a keyboard event on an element */
export function press(el: Element, key: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}
