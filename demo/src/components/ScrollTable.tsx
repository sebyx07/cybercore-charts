import type { ReactNode } from 'react';

interface ScrollTableProps {
  /** Names the scrollable region for screen readers. */
  label: string;
  children: ReactNode;
}

/**
 * The cybercore-css table wrapper: scrolls sideways on narrow screens. A
 * scrollable region has to be reachable by keyboard, so it takes a tab stop
 * and a name.
 */
function ScrollTable({ label, children }: ScrollTableProps) {
  return (
    <div
      className="cyber-table-wrapper"
      // eslint-disable-next-line jsx-a11y-x/no-noninteractive-tabindex -- scroll container
      tabIndex={0}
      role="region"
      aria-label={label}
    >
      {children}
    </div>
  );
}

export default ScrollTable;
