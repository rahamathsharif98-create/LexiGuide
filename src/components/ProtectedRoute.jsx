import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ allowedRoles = [], loginPath = '/parent/login', children }) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Authenticated with wrong role — redirect to their own portal dashboard
    if (role === 'parent') {
      return <Navigate to="/parent/dashboard" replace />
    }
    if (role === 'teacher') {
      return <Navigate to="/teacher/dashboard" replace />
    }
    return <Navigate to="/" replace />
  }

  return children ? children : <Outlet />
}

export default ProtectedRoute
