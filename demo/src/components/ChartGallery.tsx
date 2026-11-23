import { Link } from 'react-router';

import { CHART_ROUTES } from '../routes';

import ChartThumb from './ChartThumb';

/** One tile per chart type: a live thumbnail and a link to its playground. */
function ChartGallery({ as: Heading = 'h3' }: { as?: 'h2' | 'h3' }) {
  return (
    <ul className="site-gallery">
      {CHART_ROUTES.map((route) => (
        <li key={route.slug} className="site-tile">
          <div className="site-tile__preview" aria-hidden="true">
            <ChartThumb slug={route.slug} />
          </div>
          <div className="site-tile__body">
            <Heading className="site-tile__title">
              <Link to={route.path} className="site-tile__link">
                {route.name}
              </Link>
            </Heading>
            <p className="site-tile__text">{route.summary}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default ChartGallery;
