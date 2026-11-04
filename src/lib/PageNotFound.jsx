import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function PageNotFound() {
  const location = useLocation();
  const { user } = useAuth();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-7xl font-light text-slate-300">404</h1>
        <div className="h-0.5 w-16 bg-slate-200 mx-auto" />
        <h2 className="text-2xl font-medium text-slate-800">Page Not Found</h2>
        <p className="text-slate-600">
          The page <strong>{pageName}</strong> could not be found.
        </p>

        {user && (
          <p className="text-sm text-slate-500">
            Signed in as {user.email}
          </p>
        )}

        <Link to="/chat"
          className="inline-flex items-center px-5 py-3 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-700">
          Go to SK GPT Chat
        </Link>
      </div>
    </div>
  );
}
