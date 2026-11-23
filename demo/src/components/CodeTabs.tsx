import { useId, useRef, useState } from 'react';

import CodeBlock from './CodeBlock';

import type { CodeLanguage } from './CodeBlock';
import type { KeyboardEvent } from 'react';

export interface CodeTab {
  id: string;
  label: string;
  language: CodeLanguage;
  code: string;
  /** One line under the code: what to know before pasting it. */
  note?: string;
}

interface CodeTabsProps {
  /** Names the tab list for screen readers: "Install method". */
  label: string;
  tabs: CodeTab[];
}

/**
 * Code samples as tabs, built from the cybercore-css tab classes with the
 * WAI-ARIA tabs keyboard pattern (arrows, Home, End; one tab stop).
 */
function CodeTabs({ label, tabs }: CodeTabsProps) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const found = tabs.findIndex((tab) => tab.id === activeId);
  const active = found === -1 ? 0 : found;

  const select = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    setActiveId(tabs[next]?.id);
    tabsRef.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const target = moves[event.key];
    if (target !== undefined) {
      event.preventDefault();
      select(target);
    }
  };

  return (
    <div className="site-tabs">
      <div className="cyber-tabs" role="tablist" aria-label={label}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(element) => {
              tabsRef.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${tab.id}`}
            className={index === active ? 'cyber-tab cyber-tab--active' : 'cyber-tab'}
            aria-selected={index === active}
            aria-controls={`${id}-panel-${tab.id}`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => setActiveId(tab.id)}
            onKeyDown={onKeyDown}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${id}-panel-${tab.id}`}
          aria-labelledby={`${id}-tab-${tab.id}`}
          hidden={index !== active}
          className="site-tabs__panel"
        >
          <CodeBlock code={tab.code} language={tab.language} title={tab.label} />
          {tab.note ? <p className="site-tabs__note">{tab.note}</p> : null}
        </div>
      ))}
    </div>
  );
}

export default CodeTabs;
