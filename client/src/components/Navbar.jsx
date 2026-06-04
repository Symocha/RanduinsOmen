import { Link, NavLink as RouterNavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Pastille({ to, label, icon }) {
  return (
    <RouterNavLink
      to={to}
      end
      aria-label={label}
      title={label}
      className={({ isActive }) =>
        `w-11 h-11 inline-flex items-center justify-center rounded-full text-lg transition-colors ${
          isActive ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
        }`
      }
    >
      <i className={icon} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </RouterNavLink>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <>
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link to="/" className="font-semibold text-gray-900 inline-flex items-center gap-2" aria-label="RestaurantApp home">
            <i className="fa-solid fa-utensils text-gray-900" aria-hidden="true" />
            <span className="sr-only">RestaurantApp</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-500">{user.name}</span>
                <button
                  onClick={logout}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-label="Logout"
                  title="Logout"
                >
                  <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
                  <span className="sr-only">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  aria-label="Login"
                  title="Login"
                >
                  <i className="fa-solid fa-right-to-bracket" aria-hidden="true" />
                  <span className="sr-only">Login</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition-colors"
                  aria-label="Register"
                  title="Register"
                >
                  <i className="fa-solid fa-user-plus" aria-hidden="true" />
                  <span className="sr-only">Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {user && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-white rounded-full shadow-lg border border-gray-100 flex items-center gap-1 p-1.5">
            <Pastille to="/" label="Restaurants" icon="fa-solid fa-utensils" />
            <Pastille to="/outings" label="Outings" icon="fa-solid fa-calendar-day" />
            <Pastille to="/friends" label="Friends" icon="fa-solid fa-user-group" />
          </div>
        </div>
      )}
    </>
  )
}
