import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Friends() {
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

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Friends</h1>

      <section className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Add a friend</h2>
        <form onSubmit={handleAdd}>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter their email"
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
            <button
              type="submit"
              disabled={sending}
              className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
          </div>
          {addError && <p className="text-red-500 text-sm mt-2">{addError}</p>}
          {addSuccess && <p className="text-green-600 text-sm mt-2">{addSuccess}</p>}
        </form>
      </section>

      {requests.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Pending requests
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-normal">
              {requests.length}
            </span>
          </h2>
          <ul className="space-y-3">
            {requests.map(r => (
              <li key={r.id} className="flex items-center gap-3">
                <Avatar name={r.requester.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{r.requester.name}</p>
                  <p className="text-xs text-gray-400">{r.requester.email}</p>
                </div>
                <button
                  onClick={() => handleAccept(r)}
                  className="text-sm text-green-600 hover:text-green-800 font-medium"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(r.id)}
                  className="text-sm text-gray-400 hover:text-red-500"
                >
                  Decline
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          My friends {friends.length > 0 && <span className="text-gray-400 font-normal">({friends.length})</span>}
        </h2>
        {friends.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No friends yet — add someone above</p>
        ) : (
          <ul className="space-y-3">
            {friends.map(f => (
              <li key={f.id} className="flex items-center gap-3 group">
                <Avatar name={f.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{f.name}</p>
                  <p className="text-xs text-gray-400">{f.email}</p>
                </div>
                <button
                  onClick={() => handleRemove(f)}
                  className="text-sm text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove friend"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Avatar({ name }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
      {initials}
    </div>
  )
}
