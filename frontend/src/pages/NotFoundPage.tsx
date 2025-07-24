import React from 'react'
import { Link } from 'react-router-dom'

const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <h1 className="text-5xl font-bold mb-4">404</h1>
    <p className="text-lg mb-6">Sorry, the page you are looking for does not exist.</p>
    <Link to="/" className="btn btn-primary">Go Home</Link>
  </div>
)

export default NotFoundPage 