import { Link } from 'react-router';

import ChartGallery from '../components/ChartGallery';

function ChartIndex() {
  return (
    <article className="site-wrap site-page">
      <header className="site-page__header">
        <h1 className="site-page__title">Chart types</h1>
        <p className="site-page__lead">
          Five charts, one API shape. Each page is a playground: change the options, edit the data,
          and copy the code for vanilla JS, React or Ember.
        </p>
      </header>
      <ChartGallery as="h2" />
      <p className="site-band__foot">
        <Link to="/dashboard" className="site-more">
          See them composed into a dashboard
        </Link>
      </p>
    </article>
  );
}

export default ChartIndex;
