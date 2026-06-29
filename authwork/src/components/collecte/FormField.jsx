import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLastEnteredValues } from './useLastEnteredValues';

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  options = [],
  placeholder,
  required = false,
  className,
  disabled = false,
  uppercase = false
}) {
  const { getLastValues } = useLastEnteredValues();
  const lastValues = getLastValues(name);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  const handleChange = (newValue) => {
    const finalValue = uppercase && typeof newValue === 'string' ? newValue.toUpperCase() : newValue;
    onChange({ target: { name, value: finalValue } });
  };

  const handleSelectSuggestion = (suggestion) => {
    handleChange(suggestion);
    setShowSuggestions(false);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    handleChange(newValue);
  };

  const clearField = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onChange({ target: { name, value: '' } });
    setShowSuggestions(false);
  };

  if (type === 'select') {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (isMobile) {
      return (
        <div className={cn("space-y-1", className)}>
          <Label htmlFor={name} className="text-xs sm:text-sm text-slate-700 font-medium">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
          <button
            type="button"
            onClick={() => setShowDrawer(true)}
            disabled={disabled}
            className="w-full h-9 sm:h-11 px-3 py-2 bg-white border border-slate-200 text-xs sm:text-sm text-left text-slate-700 rounded-md focus:border-blue-800 focus:ring-blue-800/20 disabled:opacity-50"
          >
            {value ? options.find(o => o.value === value)?.label : placeholder || `Sélectionner ${label.toLowerCase()}`}
          </button>
          <Drawer open={showDrawer} onOpenChange={setShowDrawer}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{label}</DrawerTitle>
              </DrawerHeader>
              <div className="space-y-2 p-4">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      handleChange(option.value);
                      setShowDrawer(false);
                    }}
                    className={cn(
                      "w-full p-3 text-left rounded-lg border-2 transition-colors text-sm",
                      value === option.value
                        ? "border-blue-800 bg-blue-50 text-blue-800 font-medium"
                        : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      );
    }

    return (
      <div className={cn("space-y-1", className)}>
        <Label htmlFor={name} className="text-xs sm:text-sm text-slate-700 font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Select value={value || ''} onValueChange={handleChange} disabled={disabled}>
         <SelectTrigger className="h-9 sm:h-11 bg-white border-slate-200 text-xs sm:text-sm focus:border-blue-800 focus:ring-blue-800/20">
           <SelectValue placeholder={placeholder || `Sélectionner ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent className="text-xs sm:text-sm">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (type === 'checkbox') {
    return (
      <div className={cn("flex items-center space-x-2 py-1", className)}>
        <Checkbox
          id={name}
          checked={value || false}
          onCheckedChange={(checked) => handleChange(checked)}
          disabled={disabled}
          className="h-4 w-4 border-slate-300 data-[state=checked]:bg-blue-800"
        />
        <Label htmlFor={name} className="text-xs sm:text-sm text-slate-700 font-medium cursor-pointer">
          {label}
        </Label>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className={cn("space-y-1", className)}>
        <Label htmlFor={name} className="text-xs sm:text-sm text-slate-700 font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="relative">
          <Textarea
            id={name}
            name={name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[80px] sm:min-h-[100px] text-sm bg-white border-slate-200 focus:border-blue-800 focus:ring-blue-800/20 pr-10"
            style={uppercase ? { textTransform: 'uppercase' } : undefined}
          />
          {value && value.toString().trim() && !disabled && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange({ target: { name, value: '' } });
              }}
              className="absolute right-2 top-2 p-1.5 hover:bg-red-50 rounded-full transition-colors z-20 cursor-pointer"
              tabIndex={-1}
            >
              <X className="w-4 h-4 text-slate-500 hover:text-red-600" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (type === 'number') {
    // Si c'est un montant (valeur locative, valeur vénale), on utilise un input text avec formatage
    if (name === 'bien_valeur_locative_mensuelle' || name === 'valeur_venale') {
      const formatCurrency = (val) => {
        if (!val) return '';
        const cleaned = val.replace(/\D/g, '');
        return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      };

      const handleCurrencyChange = (e) => {
        const input = e.target.value.replace(/\D/g, '');
        handleChange(input);
      };

      return (
        <div className={cn("space-y-1 relative", className)}>
          <Label htmlFor={name} className="text-xs sm:text-sm text-slate-700 font-medium">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
          <div className="relative">
            <Input
              id={name}
              name={name}
              type="text"
              value={formatCurrency(value?.toString() || '')}
              onChange={handleCurrencyChange}
              placeholder="000.000.000"
              disabled={disabled}
              inputMode="numeric"
              className="h-10 sm:h-12 text-sm bg-white border-slate-200 focus:border-blue-800 focus:ring-blue-800/20 pr-10"
              autoComplete="off"
            />
            {value && value.toString().trim() && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange({ target: { name, value: '' } });
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-red-50 rounded-full transition-colors z-20 cursor-pointer"
                tabIndex={-1}
              >
                <X className="w-4 h-4 text-slate-500 hover:text-red-600" />
              </button>
            )}
          </div>
        </div>
      );
    }

    // Pour les autres champs nombre (quantités)
    const numberOptions = Array.from({ length: 51 }, (_, i) => ({
      value: i.toString(),
      label: i.toString()
    }));

    return (
      <div className={cn("space-y-1", className)}>
        <Label htmlFor={name} className="text-xs sm:text-sm text-slate-700 font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Select value={value?.toString() || ''} onValueChange={handleChange} disabled={disabled}>
          <SelectTrigger className="h-9 sm:h-11 bg-white border-slate-200 text-xs sm:text-sm focus:border-blue-800 focus:ring-blue-800/20">
            <SelectValue placeholder={placeholder || `Sélectionner`} />
          </SelectTrigger>
          <SelectContent className="text-xs sm:text-sm max-h-48">
            {numberOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm py-1.5">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (type === 'date') {
    const handleDateFocus = (e) => {
      // Remplir avec la date du jour uniquement pour les champs de signature/collecte
      if (!value && (name === 'prop_signature_date' || name === 'date_collecte')) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const todayFormatted = `${year}-${month}-${day}`;
        handleChange(todayFormatted);
      }
    };

    const handleDateChange = (e) => {
      let inputValue = e.target.value;
      
      // Garder seulement les chiffres
      const digits = inputValue.replace(/\D/g, '');
      
      // Formater automatiquement: jj/mm/aaaa
      let formatted = '';
      if (digits.length > 0) {
        formatted = digits.slice(0, 2);
      }
      if (digits.length > 2) {
        formatted += '/' + digits.slice(2, 4);
      }
      if (digits.length > 4) {
        formatted += '/' + digits.slice(4, 8);
      }
      
      // Convertir au format yyyy-mm-dd si complet
      let dateValue = formatted;
      if (formatted.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = formatted.split('/');
        dateValue = `${year}-${month}-${day}`;
      }
      
      handleChange(dateValue);
    };

    // Convertir yyyy-mm-dd en jj/mm/aaaa pour l'affichage
    const displayValue = value ? (() => {
      const parts = value.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return value;
    })() : '';

    return (
      <div className={cn("space-y-1", className)}>
        <Label htmlFor={name} className="text-xs sm:text-sm text-slate-700 font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="relative">
          <Input
            id={name}
            name={name}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleDateChange}
            onFocus={handleDateFocus}
            placeholder="jj/mm/aaaa"
            disabled={disabled}
            className="h-10 sm:h-12 text-sm bg-white border-slate-200 focus:border-blue-800 focus:ring-blue-800/20 pr-10"
          />
          {value && value.toString().trim() && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange({ target: { name, value: '' } });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-red-50 rounded-full transition-colors z-20 cursor-pointer"
              tabIndex={-1}
            >
              <X className="w-4 h-4 text-slate-500 hover:text-red-600" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1 relative", className)}>
      <Label htmlFor={name} className="text-xs sm:text-sm text-slate-700 font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={type}
          value={value || ''}
          onChange={handleInputChange}
          onFocus={() => lastValues.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          className="h-10 sm:h-12 text-sm bg-white border-slate-200 focus:border-blue-800 focus:ring-blue-800/20 pr-10"
          style={uppercase ? { textTransform: 'uppercase' } : undefined}
          autoComplete="off"
        />
        {value && value.toString().trim() && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange({ target: { name, value: '' } });
              setShowSuggestions(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-red-50 rounded-full transition-colors z-20 cursor-pointer"
            tabIndex={-1}
          >
            <X className="w-4 h-4 text-slate-500 hover:text-red-600" />
          </button>
        )}
        {showSuggestions && lastValues.length > 0 && (
           <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-30 max-h-40 overflow-y-auto">
             {lastValues.slice(0, 3).map((suggestion, idx) => (
               <button
                 key={idx}
                 type="button"
                 onMouseDown={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   handleSelectSuggestion(suggestion);
                 }}
                 className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-50 text-slate-700 border-b border-slate-100 last:border-0 cursor-pointer"
                 tabIndex={-1}
               >
                 {suggestion}
               </button>
             ))}
           </div>
         )}
      </div>
    </div>
  );
}