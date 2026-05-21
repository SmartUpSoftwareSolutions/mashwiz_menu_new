// // src/components/ProtectedRoute.tsx
// import React, { ReactNode } from 'react';
// import { Navigate } from 'react-router-dom';

// interface ProtectedRouteProps {
//   children: ReactNode;
// }

// const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
//   const isAuthenticated =localStorage.getItem('isLoggedIn') === 'true';
//   return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
// };

// export default ProtectedRoute;
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

export default ProtectedRoute;
