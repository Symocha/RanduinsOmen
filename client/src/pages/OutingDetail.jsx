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
  const [myRestaurants, setMyRestaurants] = useState([])
  const [friends, setFriends] = useState([])
  const [error, setError] = useState('')
  const [proposing, setProposing] = useState(false)
  const [proposeSearch, setProposeSearch] = useState('')

  useEffect(() => {
    Promise.all([
      api.get(`/outings/${id}`),
      api.get('/restaurants'),
      api.get('/friends'),
    ])
      .then(([o, r, f]) => {
        setOuting(o.data)
        setMyRestaurants(r.data)
        setFriends(f.data)
      })
      .catch(() => setError('Could not load outing'))
      .finally(() => setLoading(false))
  }, [id])

  const isCreator = outing?.creatorId === user?.id
  const myMembership = outing?.members.find(m => m.userId === user?.id)
  const isParty = isCreator || !!myMembership

  const handleRsvp = async (status) => {
    const { data } = await api.patch(`/outings/${id}/rsvp`, { status })
    setOuting(prev => ({
      ...prev,
      members: prev.members.map(m => m.userId === user.id ? { ...m, rsvp: data.rsvp } : m),
    }))
  }

  const handlePropose = async (restaurantId) => {
    try {
      const { data } = await api.post(`/outings/${id}/proposals`, { restaurantId })
      setOuting(prev => {
        if (prev.proposals.some(p => p.id === data.id)) return prev
        return { ...prev, proposals: [...prev.proposals, data] }
      })
      setProposing(false)
      setProposeSearch('')
    } catch (err) {
      alert(err.response?.data?.error || 'Could not propose restaurant')
    }
  }

  const handleRemoveProposal = async (proposalId) => {
    await api.delete(`/outings/${id}/proposals/${proposalId}`)
    setOuting(prev => ({ ...prev, proposals: prev.proposals.filter(p => p.id !== proposalId) }))
  }

  const handleVote = async (proposalId) => {
    const hasVote = outing.proposals.find(p => p.id === proposalId)?.votes.some(v => v.userId === user.id)
    if (hasVote) {
      await api.post(`/outings/${id}/vote`, { proposalId })
      setOuting(prev => ({
        ...prev,
        proposals: prev.proposals.map(p =>
          p.id === proposalId ? { ...p, votes: p.votes.filter(v => v.userId !== user.id) } : p
        ),
      }))
    } else {
      const { data } = await api.post(`/outings/${id}/vote`, { proposalId })
      setOuting(prev => ({
        ...prev,
        proposals: prev.proposals.map(p =>
          p.id === proposalId ? { ...p, votes: [...p.votes, data] } : p
        ),
      }))
    }
  }

  const handleInvite = async (userId) => {
    const { data } = await api.post(`/outings/${id}/invite`, { userId })
    setOuting(prev => {
      if (prev.members.some(m => m.id === data.id)) return prev
      return { ...prev, members: [...prev.members, data] }
    })
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
    onVoteToggle: ({ userId: uid, proposalId, added }) => {
      if (uid === user?.id) return
      setOuting(prev => ({
        ...prev,
        proposals: prev.proposals.map(p =>
          p.id === proposalId
            ? {
                ...p,
                votes: added
                  ? [...p.votes, { userId: uid, proposalId }]
                  : p.votes.filter(v => v.userId !== uid),
              }
            : p
        ),
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
      setOuting(prev => {
        if (prev.members.some(m => m.id === member.id)) return prev
        return { ...prev, members: [...prev.members, member] }
      })
    },
    onOutingUpdated: (updated) => {
      setOuting(updated)
    },
    onProposalAdded: (proposal) => {
      setOuting(prev => {
        if (prev.proposals.some(p => p.id === proposal.id)) return prev
        return { ...prev, proposals: [...prev.proposals, proposal] }
      })
    },
    onProposalRemoved: ({ proposalId }) => {
      setOuting(prev => ({ ...prev, proposals: prev.proposals.filter(p => p.id !== proposalId) }))
    },
  })

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>
  if (error || !outing) return <p className="text-red-500 text-sm">{error || 'Outing not found'}</p>

  const memberUserIds = new Set(outing.members.map(m => m.userId))
  const invitableFriends = friends.filter(f => f.id !== outing.creatorId && !memberUserIds.has(f.id))
  const proposedRestaurantIds = new Set(outing.proposals.map(p => p.restaurantId))
  const proposableRestaurants = myRestaurants.filter(r => !proposedRestaurantIds.has(r.id))

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

        {/* Proposals */}
        <section className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">
              {outing.restaurant ? 'Chosen restaurant' : 'Proposals'}
            </h2>
            {isParty && !proposing && proposableRestaurants.length > 0 && (
              <button
                onClick={() => setProposing(true)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
              >
                + Propose
              </button>
            )}
          </div>

          {outing.restaurant && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-100">
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
          )}

          {outing.proposals.length === 0 && !proposing ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No proposals yet — be the first to propose a restaurant
            </p>
          ) : (
            <ul className="space-y-2">
              {outing.proposals.map(p => {
                const myVote = p.votes.some(v => v.userId === user.id)
                const voteCount = p.votes.length
                const canRemove = p.proposedBy === user.id || isCreator
                return (
                  <li key={p.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => handleVote(p.id)}
                      className={`text-xs px-2 py-1 rounded transition-colors shrink-0 ${
                        myVote ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {voteCount > 0 ? `${voteCount} ` : ''}{myVote ? '▲' : '△'}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-800">{p.restaurant.name}</span>
                      <span className="text-xs text-gray-400 ml-1.5">by {p.proposer.name}</span>
                    </div>
                    {isCreator && (
                      <button
                        onClick={() => handleSetRestaurant(p.restaurantId)}
                        className="text-xs text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        title="Pick this restaurant"
                      >
                        ✓ Pick
                      </button>
                    )}
                    {canRemove && (
                      <button
                        onClick={() => handleRemoveProposal(p.id)}
                        className="text-xs text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        title="Remove proposal"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Propose modal */}
      {proposing && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={e => { if (e.target === e.currentTarget) { setProposing(false); setProposeSearch('') } }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Propose a restaurant</h3>
              <input
                autoFocus
                type="text"
                value={proposeSearch}
                onChange={e => setProposeSearch(e.target.value)}
                placeholder="Search your restaurants…"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
            <ul className="overflow-y-auto max-h-64">
              {proposableRestaurants
                .filter(r => r.name.toLowerCase().includes(proposeSearch.toLowerCase()))
                .map(r => (
                  <li key={r.id}>
                    <button
                      onClick={() => handlePropose(r.id)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium">{r.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{r.cuisineType}</span>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{'$'.repeat(r.priceRange)}</span>
                    </button>
                  </li>
                ))}
              {proposableRestaurants.filter(r => r.name.toLowerCase().includes(proposeSearch.toLowerCase())).length === 0 && (
                <li className="px-4 py-6 text-sm text-gray-400 text-center">
                  {proposableRestaurants.length === 0
                    ? 'No restaurants to propose — add some on the Restaurants page.'
                    : 'No results'}
                </li>
              )}
            </ul>
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => { setProposing(false); setProposeSearch('') }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
