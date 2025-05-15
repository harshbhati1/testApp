import { Link } from 'react-router-dom';
import UserAvatar from './UserAvatar';

export default function CompanyCard({ company }) {
  return (
    <div className="card bg-white shadow-lg border border-gray-200">
      <div className="card-body">
        <div className="flex items-center gap-4">          <UserAvatar
            name={company.name}
            image={company.logo}
            size="sm"
            background="consistent"
            className="shadow-sm"
          />
          <h2 className="card-title text-purple-600">{company.name}</h2>
        </div>
        <p className="text-gray-800 mt-2">{company.description}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {company.tags?.map(tag => (
            <span key={tag} className="badge bg-purple-100 text-purple-800">{tag}</span>
          ))}
        </div>
        <div className="card-actions justify-end mt-4">
          <Link to={`/vendor/${company.id}`} className="btn bg-purple-600 text-white hover:bg-purple-700">View Details</Link>
        </div>
      </div>
    </div>
  );
} 