import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const allItems: BreadcrumbItem[] = [
    { label: 'Bosh sahifa', href: '/' },
    ...items
  ];

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center flex-wrap gap-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider" itemScope itemType="https://schema.org/BreadcrumbList">
        {allItems.map((item, index) => (
          <li
            key={index}
            className="flex items-center gap-1"
            itemScope
            itemProp="itemListElement"
            itemType="https://schema.org/ListItem"
          >
            {index > 0 && <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />}
            {item.href && !item.isCurrent ? (
              <Link
                to={item.href}
                className="flex items-center gap-1 hover:text-[#E8192C] transition-colors"
                itemProp="item"
              >
                {index === 0 && <Home className="w-3 h-3" />}
                <span itemProp="name">{item.label}</span>
              </Link>
            ) : (
              <>
                {item.href && <meta itemProp="item" content={`https://educontest.uz${item.href}`} />}
                <span
                  className="flex items-center gap-1 text-slate-900 dark:text-white truncate max-w-[200px]"
                  itemProp="name"
                  aria-current="page"
                >
                  {item.label}
                </span>
              </>
            )}
            <meta itemProp="position" content={String(index + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
