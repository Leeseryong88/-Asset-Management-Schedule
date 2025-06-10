
import React from 'react';

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
  colors: string[];
}

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onSelectColor, colors }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map(color => (
        <button
          key={color}
          type="button"
          className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ${
            selectedColor === color ? 'border-white ring-2 ring-offset-2 ring-offset-slate-800 ring-white scale-110' : 'border-transparent hover:border-slate-400'
          }`}
          style={{ backgroundColor: color }}
          onClick={() => onSelectColor(color)}
          aria-label={`색상 ${color} 선택`}
        />
      ))}
    </div>
  );
};

export default ColorPicker;