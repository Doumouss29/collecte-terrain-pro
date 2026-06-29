import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function BackButton({ 
  to, 
  label = 'Retour',
  type = 'simple', // 'simple' ou 'home'
  onClick,
  className = ''
}) {
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  if (type === 'home') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className="h-10 w-10 rounded-full bg-white hover:bg-slate-50 text-black"
      >
        <Home className="w-5 h-5" />
      </Button>
    );
  }

  // Simple return button with arrow in square
  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className="bg-blue-800 hover:bg-blue-900 text-white rounded-lg px-3 py-2 h-10 gap-2 flex-shrink-0 border-2 border-white"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Button>
  );
}