import React from 'react'

export default function SearchBar({ value, onChange }) {
  return (
    <div className="input-group mb-3 search-input-group">
      <span className="input-group-text search-icon"><i className="fas fa-search"></i></span>
      <input className="form-control search-input" placeholder="Search by name, email, roll..." value={value} onChange={e=>onChange(e.target.value)} />
    </div>
  )
}
