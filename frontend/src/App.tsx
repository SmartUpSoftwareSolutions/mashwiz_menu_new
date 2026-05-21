
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import './App.css';
import { adminRoutes } from './adminRoutes';
import { Toaster } from 'sonner';
import { useTheme } from './hooks/useTheme';
import { LanguageProvider } from './hooks/useLanguage';
import Index from './pages/Index';
import Menu from './pages/Menu';
import MenuItemDetail from './pages/MenuItemDetail';
import Promotions from './pages/Promotions';
import NotFound from './pages/NotFound';
import Locations from './pages/Locations';
import Register from './pages/Register';
import Survey from './pages/Survey';

function AppContent() {
  useTheme(); // Apply theme across the application
  
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/menu/item/:id" element={<MenuItemDetail />} />
        <Route path="/promotions" element={<Promotions />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/register" element={<Register />} />
        <Route path="/survey" element={<Survey />} />
        {adminRoutes}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
