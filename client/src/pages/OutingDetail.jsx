import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { useOutingSocket } from '../hooks/useOutingSocket'

const STATUS_STYLES = {
  planning:  'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  done:      'bg-gray-100 text-gray-500',
}

const RSVP_STYLES = {
  going:     'text-green-600',
  not_going: 'text-red-400',
  pending:   'text-gray-400',
}

const RSVP_LABELS = { going: 'Going', not_going: 'Not going', pending: 'Pending' }

export default function OutingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [outing, setOuting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [restaurants, setRestaurants] = useState([])
  const [friends, setFriends] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get(`/outings/${id}`),
      api.get('/restaurants'),
      api.get('/friends'),
    ])
      .then(([o, r, f]) => {
        setOuting(o.data)
        setRestaurants(r.data)
        setFriends(f.data)
      })
      .catch(() => setError('Could not load outing'))
      .finally(() => setLoading(false))
  }, [id])

  const isCreator = outing?.creatorId === user?.id
  const myMembership = outing?.members.find(m => m.userId === user?.id)

  const handleRsvp = async (status) => {
    const { data } = await api.patch(`/outings/${id}/rsvp`, { status })
    setOuting(prev => ({
      ...prev,
      members: prev.members.map(m => m.userId === user.id ? { ...m, rsvp: data.rsvp } : m),
    }))
  }

  const handleVote = async (restaurantId) => {
    const hasVote = outing.votes.some(v => v.userId === user.id && v.restaurantId === restaurantId)
    if (hasVote) {
      await api.post(`/outings/${id}/vote`, { restaurantId })
      setOuting(prev => ({
        ...prev,
        votes: prev.votes.filter(v => !(v.userId === user.id && v.restaurantId === restaurantId)),
      }))
    } else {
      const { data } = await api.post(`/outings/${id}/vote`, { restaurantId })
      setOuting(prev => ({ ...prev, votes: [...prev.votes, data] }))
    }
  }

  const handleInvite = async (userId) => {
    const { data } = await api.post(`/outings/${id}/invite`, { userId })
    setOuting(prev => ({ ...prev, members: [...prev.members, data] }))
  }

  const handleStatusChange = async (status) => {
    const { data } = await api.patch(`/outings/${id}`, { status })
    setOuting(data)
  }

  const handleSetRestaurant = async (restaurantId) => {
    const { data } = await api.patch(`/outings/${id}`, { restaurantId })
    setOuting(data)
  }

  useOutingSocket(id, {
    onVoteToggle: ({ userId, restaurantId, added }) => {
      if (userId === user?.id) return
      setOuting(prev => ({
        ...prev,
        votes: added
          ? [...prev.votes, { userId, restaurantId }]
          : prev.votes.filter(v => !(v.userId === userId && v.restaurantId === restaurantId)),
      }))
    },
    onRsvpUpdate: ({ userId: uid, rsvp }) => {
      if (uid === user?.id) return
      setOuting(prev => ({
        ...prev,
        members: prev.members.map(m => m.userId === uid ? { ...m, rsvp } : m),
      }))
    },
    onMemberAdded: (member) => {
      setOuting(prev => ({ ...prev, members: [...prev.members, member] }))
    },
    onOutingUpdated: (updated) => {
      setOuting(updated)
    },
  })

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>
  if (error || !outing) return <p className="text-red-500 text-sm">{error || 'Outing not found'}</p>

  const memberUserIds = new Set(outing.members.map(m => m.userId))
  const invitableFriends = friends.filter(f => f.id !== outing.creatorId && !memberUserIds.has(f.id))
  const votesByRestaurant = outing.votes.reduce((acc, v) => {
    acc[v.restaurantId] = (acc[v.restaurantId] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/outings')}
          className="text-sm text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1"
        >
          ← Outings
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">{outing.name}</h1>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[outing.status]}`}>
            {outing.status}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
          {outing.date && (
            <span>{new Date(outing.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
          )}
          <span>Created by {outing.creator.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members */}
        <section className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Members</h2>
          <ul className="space-y-2 mb-4">
            <li className="flex items-center gap-2">
              <Avatar name={outing.creator.name} />
              <span className="text-sm text-gray-700 flex-1">{outing.creator.name}</span>
              <span className="text-xs text-gray-400">creator</span>
            </li>
            {outing.members.map(m => (
              <li key={m.id} className="flex items-center gap-2">
                <Avatar name={m.user.name} />
                <span className="text-sm text-gray-700 flex-1">{m.user.name}</span>
                {m.userId === user.id ? (
                  <select
                    value={m.rsvp}
                    onChange={e => handleRsvp(e.target.value)}
                    className="text-xs border border-gray-200 rounded px-1 py-0.5 focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="going">Going</option>
                    <option value="not_going">Not going</option>
                  </select>
                ) : (
                  <span className={`text-xs font-medium ${RSVP_STYLES[m.rsvp]}`}>
                    {RSVP_LABELS[m.rsvp]}
                  </span>
                )}
              </li>
            ))}
          </ul>

          {isCreator && invitableFriends.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Invite a friend</p>
              <div className="flex flex-wrap gap-2">
                {invitableFriends.map(f => (
                  <button
                    key={f.id}
                    onClick={() => handleInvite(f.id)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
                  >
                    + {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Restaurant & Voting */}
        <section className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Restaurant</h2>

          {outing.restaurant ? (
            <div className="mb-4">
              <p className="font-medium text-gray-900">{outing.restaurant.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{outing.restaurant.address}</p>
              {isCreator && (
                <button
                  onClick={() => handleSetRestaurant(null)}
                  className="text-xs text-gray-400 hover:text-red-400 mt-2"
                >
                  Remove
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-3">No restaurant selected yet — vote below</p>
          )}

          {restaurants.length > 0 && (
            <>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                {outing.restaurant ? 'Change restaurant' : 'Vote'}
              </p>
              <ul className="space-y-1.5">
                {restaurants.map(r => {
                  const votes = votesByRestaurant[r.id] || 0
                  const myVote = outing.votes.some(v => v.userId === user.id && v.restaurantId === r.id)
                  return (
                    <li key={r.id} className="flex items-center gap-2">
                      <button
                        onClick={() => handleVote(r.id)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          myVote
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {votes > 0 ? `${votes} ` : ''}{myVote ? '▲' : '△'}
                      </button>
                      <span className="text-sm text-gray-700 flex-1">{r.name}</span>
                      {isCreator && (
                        <button
                          onClick={() => handleSetRestaurant(r.id)}
                          className="text-xs text-gray-400 hover:text-gray-700"
                          title="Set as restaurant"
                        >
                          ✓ Pick
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </section>
      </div>

      {/* Creator actions */}
      {isCreator && (
        <div className="flex gap-2">
          {outing.status === 'planning' && (
            <button
              onClick={() => handleStatusChange('confirmed')}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Confirm outing
            </button>
          )}
          {outing.status === 'confirmed' && (
            <button
              onClick={() => handleStatusChange('done')}
              className="bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Mark as done
            </button>
          )}
          {outing.status !== 'planning' && (
            <button
              onClick={() => handleStatusChange('planning')}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-50 transition-colors"
            >
              Reopen
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Avatar({ name }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
      {initials}
    </div>
  )
}
