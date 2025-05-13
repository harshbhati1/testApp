import { useState } from 'react';

export default function SearchBox({ onSearch }) {
  const [q, setQ] = useState('');
  return (
    <div className="form-control w-full">
      <label className="input-group">
        <input
          type="text"
          placeholder="Search company…"
          className="input input-bordered w-full"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearch(q)}
        />
        <button className="btn btn-secondary" onClick={() => onSearch(q)}>
          Go
        </button>
      </label>
    </div>
  );
} 