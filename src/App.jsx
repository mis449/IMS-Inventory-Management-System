import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Settings from './pages/Settings';
import ItemDetails from './pages/Master/ItemDetails';
import InventoryForm from './pages/InventoryForm/InventoryForm';
import InventoryHistory from './pages/InventoryForm/InventoryHistory';
import Dasboard from './pages/Dashboard/Dasboard';

import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { initializeStorage } from './utils/storageManager';

const IndexRedirect = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  return <Navigate to={isAdmin ? "/dashboard" : "/create-indent"} replace />;
};

function App() {
  useEffect(() => {
    initializeStorage();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<IndexRedirect />} />
            <Route path="dashboard" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Dasboard />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="master" element={<ItemDetails />} />
            <Route path="create-indent" element={<InventoryForm />} />
            <Route path="indent-history" element={<InventoryHistory />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;