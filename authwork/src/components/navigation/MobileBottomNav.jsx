import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Archive, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileBottomNav() {
  const location = useLocation();
  const currentPage = location.pathname.split('/').pop() || 'Accueil';

  const navItems = [
    { label: 'Accueil', icon: Home, page: 'Accueil' },
    { label: 'Collectes', icon: Archive, page: 'MesCollectes' },
    { label: 'Rapports', icon: FileText, page: 'RapportCollecte' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-[9999] pointer-events-auto"
      style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}>
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                'flex flex-col items-center justify-center w-1/3 py-2.5 text-xs transition-colors',
                isActive
                  ? 'text-blue-800 border-t-2 border-blue-800'
                  : 'text-slate-500'
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="line-clamp-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}