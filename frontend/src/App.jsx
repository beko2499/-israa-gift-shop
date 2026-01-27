import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Marketplace from './pages/Marketplace';
import MyGifts from './pages/MyGifts';
import SellGift from './pages/SellGift';
import Wallet from './pages/Wallet';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/gifts" element={<MyGifts />} />
          <Route path="/sell" element={<SellGift />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
