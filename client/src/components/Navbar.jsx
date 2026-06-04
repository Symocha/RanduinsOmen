import { Link, NavLink as RouterNavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function NavLink({ to, children }) {
  return (
    <RouterNavLink
      to={to}
      end
      className={({ isActive }) =>
        `text-sm transition-colors ${isActive ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'}`
      }
    >
      {children}
    </RouterNavLink>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-semibold text-lg text-gray-900">
            RestaurantApp
          </Link>
          {user && (
            <NavLink to="/">Restaurants</NavLink>
          )}
          {user && (
            <NavLink to="/outings">Outings</NavLink>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-gray-600">{user.name}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
