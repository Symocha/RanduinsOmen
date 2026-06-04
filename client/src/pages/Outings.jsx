import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const STATUS_STYLES = {
  planning:  'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  done:      'bg-gray-100 text-gray-500',
}

const EMPTY_FORM = { name: '', date: '' }

export default function Outings() {
  const [outings, setOutings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/outings')
      .then(res => setOutings(res.data))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      const { data } = await api.post('/outings', {
        name: form.name,
        date: form.date || undefined,
      })
      setOutings(prev => [data, ...prev])
      setShowAdd(false)
      setForm(EMPTY_FORM)
      navigate(`/outings/${data.id}`)
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create outing')
    } finally {
      setSubmitting(false)
    }
  }

  const closeModal = () => {
    setShowAdd(false)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Outings</h1>
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg shadow-black/20 transition-transform hover:-translate-y-1 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        aria-label="Add outing"
      >
        <i className="fa-solid fa-plus text-lg" aria-hidden="true" />
      </button>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : outings.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-lg font-medium">No outings yet</p>
          <p className="text-sm mt-1">Create one and invite your friends</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {outings.map(o => (
            <OutingCard key={o.id} outing={o} onClick={() => navigate(`/outings/${o.id}`)} />
          ))}
        </div>
      )}

      {showAdd && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold mb-4">New outing</h2>
            {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Friday dinner"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border border-gray-300 rounded py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gray-900 text-white rounded py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function OutingCard({ outing, onClick }) {
  const memberCount = outing._count?.members ?? 0

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-gray-900">{outing.name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLES[outing.status]}`}>
          {outing.status}
        </span>
      </div>
      {outing.restaurant && (
        <p className="text-sm text-gray-500 mt-1">{outing.restaurant.name}</p>
      )}
      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
        {outing.date && (
          <span>{new Date(outing.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
        )}
        <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
        <span>by {outing.creator.name}</span>
      </div>
    </div>
  )
}
