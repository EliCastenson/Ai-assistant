import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const LoginPage = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email)
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
      <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-6 dark:bg-zinc-800 dark:border-zinc-700">
        <h1 className="text-2xl font-bold text-center dark:text-gray-100">Sign in to AI Assistant</h1>
        <input
          type="email"
          className="input"
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        {error && <div className="text-red-600 text-sm dark:text-red-400">{error}</div>}
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

export default LoginPage 