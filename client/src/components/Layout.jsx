import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import FriendsList from './FriendsList'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-6 items-start">
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
        <FriendsList />
      </div>
    </div>
  )
}
