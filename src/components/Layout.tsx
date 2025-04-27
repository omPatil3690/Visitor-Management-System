import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { LogOut, Menu, User, Users, Home, ClipboardList } from 'lucide-react';

export function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            {/* Logo & Home Link */}
            <Link to="/" className="flex items-center text-gray-700 hover:text-gray-900">
              <Home className="h-6 w-6" aria-hidden="true" />
              <span className="ml-2 font-medium">Campus VMS</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="sm:hidden p-2 text-gray-700 hover:text-gray-900"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle navigation menu"
              title="Toggle navigation menu"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex sm:items-center sm:space-x-8">
              {user?.role === 'admin' && (
                <>
                  <Link to="/dashboard/users" className="flex items-center px-3 py-2 text-sm font-medium text-gray-900">
                    <Users className="h-5 w-5 mr-1" aria-hidden="true" />
                    Users
                  </Link>
                  <Link to="/dashboard/logs" className="flex items-center px-3 py-2 text-sm font-medium text-gray-900">
                    <ClipboardList className="h-5 w-5 mr-1" aria-hidden="true" />
                    Logs
                  </Link>
                </>
              )}

              {user?.role === 'guard' && (
                <Link to="/dashboard/register-visitor" className="flex items-center px-3 py-2 text-sm font-medium text-gray-900">
                  <User className="h-5 w-5 mr-1" aria-hidden="true" />
                  Register Visitor
                </Link>
              )}
            </div>

            {/* Logout Button */}
            {user && (
              <div className="hidden sm:flex items-center">
                <span className="text-sm font-medium text-gray-700 mr-4">
                  {user.name} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100"
                  aria-label="Logout"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5 mr-1" aria-hidden="true" />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="sm:hidden bg-white shadow-md rounded-md p-4 mt-2">
              {user?.role === 'admin' && (
                <>
                  <Link to="/dashboard/users" className="block px-3 py-2 text-sm font-medium text-gray-900">
                    Users
                  </Link>
                  <Link to="/dashboard/logs" className="block px-3 py-2 text-sm font-medium text-gray-900">
                    Logs
                  </Link>
                </>
              )}
              {user?.role === 'guard' && (
                <Link to="/dashboard/register-visitor" className="block px-3 py-2 text-sm font-medium text-gray-900">
                  Register Visitor
                </Link>
              )}
              {user && (
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-md"
                  aria-label="Logout"
                  title="Logout"
                >
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
