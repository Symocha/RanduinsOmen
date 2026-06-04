import { useState, useEffect } from 'react'
import api from '../services/api'

export default function FriendsList() {
  const [open, setOpen] = useState(() => window.innerWidth >= 1024)
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')

  useEffect(() => {
    api.get('/friends').then(res => setFriends(res.data)).catch(() => {})
    api.get('/friends/requests').then(res => setRequests(res.data)).catch(() => {})
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setSending(true)
    setAddError('')
    setAddSuccess('')
    try {
      await api.post('/friends', { email })
      setEmail('')
      setAddSuccess('Request sent')
      setTimeout(() => setAddSuccess(''), 3000)
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to send request')
    } finally {
      setSending(false)
    }
  }

  const handleAccept = async (friendship) => {
    try {
      const { data } = await api.patch(`/friends/${friendship.id}/accept`)
      setRequests(prev => prev.filter(r => r.id !== friendship.id))
      setFriends(prev => [...prev, data.requester])
    } catch {}
  }

  const handleDecline = async (id) => {
    try {
      await api.delete(`/friends/${id}`)
      setRequests(prev => prev.filter(r => r.id !== id))
    } catch {}
  }

  const handleRemove = async (friend) => {
    try {
      await api.delete(`/friends/${friend.friendshipId}`)
      setFriends(prev => prev.filter(f => f.id !== friend.id))
    } catch {}
  }

  const pendingCount = requests.length

  return (
    <aside className="w-full lg:w-64 lg:shrink-0">
      <div className="bg-white rounded-lg border border-gray-200 p-4 lg:sticky lg:top-6">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-0"
        >
          <span>
            Friends
            {pendingCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingCount}
              </span>
            )}
          </span>
          <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
        </button>

        {open && (
          <div className="mt-3">
            <form onSubmit={handleAdd} className="mb-4">
              <div className="flex gap-1">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Add by email"
                  className="flex-1 min-w-0 border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400"
                  required
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="bg-gray-900 text-white px-2 py-1.5 rounded text-xs font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  Add
                </button>
              </div>
              {addError && <p className="text-red-500 text-xs mt-1">{addError}</p>}
              {addSuccess && <p className="text-green-600 text-xs mt-1">{addSuccess}</p>}
            </form>

            {requests.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Requests ({requests.length})
                </p>
                <ul className="space-y-2">
                  {requests.map(r => (
                    <li key={r.id} className="flex items-center gap-2">
                      <Avatar name={r.requester.name} />
                      <span className="text-sm text-gray-700 flex-1 truncate">{r.requester.name}</span>
                      <button
                        onClick={() => handleAccept(r)}
                        className="text-xs text-green-600 hover:text-green-800 font-medium"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleDecline(r.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {friends.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No friends yet</p>
            ) : (
              <ul className="space-y-2">
                {friends.map(f => (
                  <li key={f.id} className="flex items-center gap-2 group">
                    <Avatar name={f.name} />
                    <span className="text-sm text-gray-700 flex-1 truncate">{f.name}</span>
                    <button
                      onClick={() => handleRemove(f)}
                      className="text-xs text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove friend"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

function Avatar({ name }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
      {initials}
    </div>
  )
}
