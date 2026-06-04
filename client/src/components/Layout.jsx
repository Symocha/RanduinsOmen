import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import FriendsList from './FriendsList'

export default function Layout() {
  const [friendsOpen, setFriendsOpen] = useState(() => window.innerWidth >= 1024)
  const [friendsPendingCount, setFriendsPendingCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onFriendsToggle={() => setFriendsOpen(o => !o)}
        friendsOpen={friendsOpen}
        friendsPendingCount={friendsPendingCount}
      />
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-24 flex flex-col lg:flex-row gap-6 items-start">
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
        <FriendsList open={friendsOpen} onPendingCount={setFriendsPendingCount} />
      </div>
    </div>
  )
}
