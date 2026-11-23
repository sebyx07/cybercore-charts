import { lazy, Suspense } from 'react';

import { Route, Routes } from 'react-router';

import Layout from './components/Layout';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

const ChartIndex = lazy(() => import('./pages/ChartIndex'));
const ChartPage = lazy(() => import('./pages/ChartPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Docs = lazy(() => import('./pages/Docs'));
const OgCard = lazy(() => import('./pages/OgCard'));

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="charts" element={<ChartIndex />} />
        <Route path="charts/:slug" element={<ChartPage />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="docs" element={<Docs />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route
        path="og"
        element={
          <Suspense fallback={null}>
            <OgCard />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default App;
