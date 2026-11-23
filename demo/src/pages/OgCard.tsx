import TelemetryDeck from '../components/TelemetryDeck';

/**
 * Source of demo/public/og.png: demo/scripts/make-og.mjs screenshots this
 * route at 1200 by 630. Not linked from the site and not in the sitemap.
 */
function OgCard() {
  return (
    <div className="site-og">
      <div className="site-og__copy">
        <p className="cyber-nav__brand">
          Cybercore <span className="site-brand__sub">Charts</span>
        </p>
        <p className="site-og__title">
          Neon charts in <span className="site-hero__accent">plain SVG</span>
        </p>
        <p className="site-og__lead">
          Line, bar, donut, gauge, sparkline. Zero dependencies. React and Ember adapters.
        </p>
      </div>
      <div className="site-og__panel">
        <TelemetryDeck live={false} />
      </div>
    </div>
  );
}

export default OgCard;
