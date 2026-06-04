import { Link, NavLink as RouterNavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Pastille({ to, label }) {
  return (
    <RouterNavLink
      to={to}
      end
      className={({ isActive }) =>
        `px-5 py-2 rounded-full text-sm font-medium transition-colors ${
          isActive ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
        }`
      }
    >
      {label}
    </RouterNavLink>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <>
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link to="/" className="font-semibold text-gray-900">RestaurantApp</Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-500">{user.name}</span>
                <button
                  onClick={logout}
                  className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">Login</Link>
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

      {user && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-white rounded-full shadow-lg border border-gray-100 flex items-center gap-1 p-1.5">
            <Pastille to="/" label="Restaurants" />
            <Pastille to="/outings" label="Outings" />
            <Pastille to="/friends" label="Friends" />
          </div>
        </div>
      )}
    </>
  )
}
