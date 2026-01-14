import type { ReactNode } from 'react';

interface ChartDemoProps {
  title: string;
  badge?: string;
  badgeColor?: 'cyan' | 'magenta' | 'yellow' | 'green';
  children: ReactNode;
  footer?: ReactNode;
}

function ChartDemo({
  title,
  badge,
  badgeColor = 'cyan',
  children,
  footer,
}: ChartDemoProps) {
  return (
    <div className="chart-demo__container">
      <div className="chart-demo__header">
        <h3 className="chart-demo__title">{title}</h3>
        {badge && (
          <span className={`chart-demo__badge cyber-badge--${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>

      <div className="chart-demo__chart">{children}</div>

      {footer && <div className="chart-demo__footer">{footer}</div>}
    </div>
  );
}

export default ChartDemo;
