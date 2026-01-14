import { Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import Home from './pages/Home';
import LineCharts from './pages/LineCharts';
import BarCharts from './pages/BarCharts';
import RadialCharts from './pages/RadialCharts';
import Realtime from './pages/Realtime';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="line-charts" element={<LineCharts />} />
        <Route path="bar-charts" element={<BarCharts />} />
        <Route path="radial-charts" element={<RadialCharts />} />
        <Route path="realtime" element={<Realtime />} />
      </Route>
    </Routes>
  );
}

export default App;
