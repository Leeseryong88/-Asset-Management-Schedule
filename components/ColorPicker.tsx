import React from 'react';
import { getColorCategory } from '../constants';

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
  colors: string[];
}

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onSelectColor, colors }) => {
  return (
    <div className="flex flex-wrap gap-3">
      {colors.map(color => {
        const category = getColorCategory(color);
        return (
          <div key={color} className="flex flex-col items-center">
            <button
              type="button"
              className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ${
                selectedColor === color ? 'border-white ring-2 ring-offset-2 ring-offset-slate-800 ring-white scale-110' : 'border-transparent hover:border-slate-400'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => onSelectColor(color)}
              aria-label={`색상 ${color} 선택`}
            />
            {category && (
              <span className="text-xs text-slate-400 mt-1 text-center">
                {category}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ColorPicker;