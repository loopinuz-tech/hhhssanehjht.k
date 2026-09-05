import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex px-4 py-3 text-gray-700 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3 max-w-7xl mx-auto w-full">
        <li className="inline-flex items-center">
          <Link to="/tests" className="inline-flex items-center text-xs font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors">
            <Home className="w-3 h-3 mr-2" />
            Testlar
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const label = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

          return (
            <li key={to}>
              <div className="flex items-center">
                <ChevronRight className="w-3 h-3 text-gray-400" />
                {last ? (
                  <span className="ml-1 text-xs font-black uppercase tracking-widest text-emerald-600 md:ml-2">
                    {label}
                  </span>
                ) : (
                  <Link to={to} className="ml-1 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors md:ml-2">
                    {label}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
