import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadSession } from './store/authSlice.js';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Spinner from './components/Spinner.jsx';
import Background from './components/Background.jsx';
import CursorGlow from './components/CursorGlow.jsx';
import { Toaster } from './components/Toast.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import ProductForm from './pages/ProductForm.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Vault from './pages/Vault.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  const dispatch = useDispatch();
  const { bootstrapped } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(loadSession());
  }, [dispatch]);

  if (!bootstrapped) return <Spinner full />;

  return (
    <>
      <Background />
      <CursorGlow />
      <Toaster />
      <Routes>
        <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/products/:id/edit" element={<ProductForm />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
