import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

export default function PhotoBuildingUpload({ label, fieldName, photoValue, onChange }) {
  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.onloadend = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 800;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (compressedData) => {
        onChange({ target: { name: fieldName, value: compressedData } });
      });
    }
  };

  const handleRemovePhoto = () => {
    onChange({ target: { name: fieldName, value: '' } });
  };

  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg border-2 border-dashed border-slate-300">
      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="file"
          id={`photo-building-camera-${fieldName}`}
          accept="image/*"
          capture="environment"
          onChange={handlePhotoUpload}
          className="hidden"
        />
        <input
          type="file"
          id={`photo-building-gallery-${fieldName}`}
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />
        <Button
          type="button"
          onClick={() => {
            const input = document.getElementById(`photo-building-camera-${fieldName}`);
            if (input) input.value = '';
            input?.click();
          }}
          variant="outline"
          className="w-full text-[11px] sm:text-xs h-9 sm:h-10 px-2"
        >
          <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          Photographier
        </Button>
        <Button
          type="button"
          onClick={() => {
            const input = document.getElementById(`photo-building-gallery-${fieldName}`);
            if (input) input.value = '';
            input?.click();
          }}
          variant="outline"
          className="w-full text-[11px] sm:text-xs h-9 sm:h-10 px-2"
        >
          <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          Galerie
        </Button>
      </div>
      {photoValue && (
        <div className="mt-3 relative">
          <img 
            src={photoValue} 
            alt={label} 
            className="max-h-32 sm:max-h-40 rounded-lg w-full object-cover"
          />
          <Button
            type="button"
            onClick={handleRemovePhoto}
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}