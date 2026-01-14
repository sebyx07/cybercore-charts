import { useState, useCallback } from 'react';
import { Highlight, themes, type Language } from 'prism-react-renderer';

// Custom cyberpunk theme based on dark theme with neon colors
const cyberTheme = {
  ...themes.vsDark,
  plain: {
    color: '#e0e0e8',
    backgroundColor: '#08080c',
  },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: {
        color: '#606078',
        fontStyle: 'italic' as const,
      },
    },
    {
      types: ['namespace'],
      style: {
        opacity: 0.7,
      },
    },
    {
      types: ['string', 'attr-value', 'template-string'],
      style: {
        color: '#00ff88', // cyber-green
      },
    },
    {
      types: ['punctuation', 'operator'],
      style: {
        color: '#8888a0', // cyber-chrome-400
      },
    },
    {
      types: [
        'entity',
        'url',
        'symbol',
        'number',
        'boolean',
        'variable',
        'constant',
        'property',
        'regex',
        'inserted',
      ],
      style: {
        color: '#f0ff00', // cyber-yellow
      },
    },
    {
      types: ['atrule', 'keyword', 'attr-name'],
      style: {
        color: '#ff00aa', // cyber-magenta
      },
    },
    {
      types: ['function', 'deleted', 'tag'],
      style: {
        color: '#00f0ff', // cyber-cyan
      },
    },
    {
      types: ['function-variable'],
      style: {
        color: '#00f0ff', // cyber-cyan
      },
    },
    {
      types: ['selector', 'important', 'builtin', 'char'],
      style: {
        color: '#ff00aa', // cyber-magenta
      },
    },
    {
      types: ['class-name'],
      style: {
        color: '#00f0ff', // cyber-cyan
      },
    },
  ],
};

interface CodeBlockProps {
  code: string;
  language?: Language;
  title?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({
  code,
  language = 'typescript',
  title,
  showLineNumbers = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [code]);

  return (
    <div className="code-block">
      <div className="code-block__header">
        <div className="code-block__dots">
          <span className="code-block__dot code-block__dot--red" />
          <span className="code-block__dot code-block__dot--yellow" />
          <span className="code-block__dot code-block__dot--green" />
        </div>
        {title && <span className="code-block__title">{title}</span>}
        <span className="code-block__language">{language.toUpperCase()}</span>
        <button
          className={`code-block__copy ${copied ? 'code-block__copy--copied' : ''}`}
          onClick={handleCopy}
          type="button"
          aria-label={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              COPIED
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              COPY
            </>
          )}
        </button>
      </div>
      <div className="code-block__content">
        <Highlight theme={cyberTheme} code={code.trim()} language={language}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={className} style={style}>
              {tokens.map((line, i) => {
                const lineProps = getLineProps({ line, key: i });
                return (
                  <div key={i} {...lineProps} className="code-block__line">
                    {showLineNumbers && <span className="code-block__line-number">{i + 1}</span>}
                    <span className="code-block__line-content">
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token, key })} />
                      ))}
                    </span>
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>
      </div>
      <div className="code-block__glow" />
    </div>
  );
}

export default CodeBlock;
