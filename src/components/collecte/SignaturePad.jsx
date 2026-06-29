import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export default function SignaturePad({ onChange, value, label, show, onToggle, required }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 160;

    // Set drawing style
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.touches ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = e.touches ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.touches ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = e.touches ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL('image/png');
    onChange(signatureData);
  };

  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-slate-700 font-medium text-sm">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onToggle && onToggle()}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Modifier
            </button>
          )}
        </div>
      )}
      
      {!value || show ? (
        <>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full border-2 border-slate-400 rounded-md bg-white cursor-crosshair touch-none"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex-1"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Effacer
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="flex-1 bg-blue-800 hover:bg-blue-900"
            >
              Valider
            </Button>
          </div>
        </>
      ) : (
        <div className="border-2 border-blue-800 rounded-md bg-white p-3 flex items-center justify-center" style={{height: '120px'}}>
          <img src={value} alt="Signature" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}