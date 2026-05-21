import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { logout } from './lib/auth.ts';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Clear all session data
    navigate('/admin/login');
  };

  return (
    <div>
      <header>
        <h2>Admin Panel</h2>
        <button onClick={handleLogout}>Logout</button>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
