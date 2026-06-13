import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Candles from './pages/Candles';
import Analytics from './pages/Analytics';
import DataHealth from './pages/DataHealth';
import ApiExplorer from './pages/ApiExplorer';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="candles" element={<Candles />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="health" element={<DataHealth />} />
          <Route path="api" element={<ApiExplorer />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
