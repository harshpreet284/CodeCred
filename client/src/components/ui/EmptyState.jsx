import { Link } from 'react-router-dom';
import { Button } from './Button';

export function EmptyState({ title, description, actionText, actionTo }) {
  return (
    <div className="max-w-xl mx-auto py-12 text-center">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
        <h2 className="text-xl font-bold text-zinc-100 mb-2">{title}</h2>
        <p className="text-zinc-400 mb-6">{description}</p>
        {actionText && actionTo && (
          <Link to={actionTo}>
            <Button variant="primary">{actionText}</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
