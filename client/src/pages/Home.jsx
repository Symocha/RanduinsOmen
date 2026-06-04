import { useState, useEffect } from 'react'
import api from '../services/api'

const EMPTY_FORM = { name: '', address: '', cuisineType: '', priceRange: 2 }

export default function Home() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    api.get('/restaurants')
      .then(res => setRestaurants(res.data))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      const { data } = await api.post('/restaurants', form)
      setRestaurants(prev => [data, ...prev])
      setShowAdd(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to add restaurant')
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Restaurants</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          + Add restaurant
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-lg font-medium">No restaurants yet</p>
          <p className="text-sm mt-1">Add one to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants.map(r => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}

      {showAdd && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Add restaurant</h2>
            {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
            <form onSubmit={handleAdd} className="space-y-3">
              <Field
                label="Name"
                value={form.name}
                onChange={v => setForm({ ...form, name: v })}
                required
              />
              <Field
                label="Address"
                value={form.address}
                onChange={v => setForm({ ...form, address: v })}
                required
              />
              <Field
                label="Cuisine type"
                value={form.cuisineType}
                onChange={v => setForm({ ...form, cuisineType: v })}
                placeholder="e.g. Italian, Japanese"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price range</label>
                <select
                  value={form.priceRange}
                  onChange={e => setForm({ ...form, priceRange: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value={1}>$ — Budget</option>
                  <option value={2}>$$ — Mid-range</option>
                  <option value={3}>$$$ — Upscale</option>
                  <option value={4}>$$$$ — Fine dining</option>
                </select>
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
                  {submitting ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function RestaurantCard({ restaurant }) {
  const price = '$'.repeat(restaurant.priceRange)
  const reviewCount = restaurant._count?.reviews ?? 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{restaurant.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{restaurant.cuisineType}</p>
        </div>
        <span className="text-sm text-gray-400 font-medium shrink-0">{price}</span>
      </div>
      <p className="text-xs text-gray-400 mt-2 truncate">{restaurant.address}</p>
      <p className="text-xs text-gray-400 mt-1">
        {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
      </p>
    </div>
  )
}

function Field({ label, value, onChange, required, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        required={required}
      />
    </div>
  )
}
