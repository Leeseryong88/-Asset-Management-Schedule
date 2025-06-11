import React from 'react';
import { getColorCategory } from '../constants';

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
  colors: string[];
}

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onSelectColor, colors }) => {
  // 카테고리가 있는 색상과 없는 색상으로 분리
  const categorizedColors = colors.filter(color => getColorCategory(color));
  const uncategorizedColors = colors.filter(color => !getColorCategory(color));

  const renderColorButton = (color: string) => {
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
  };

  return (
    <div className="flex justify-between items-start gap-3">
      {/* 일반 색상들 - 왼쪽 */}
      <div className="flex flex-wrap gap-3">
        {uncategorizedColors.map(renderColorButton)}
      </div>
      
      {/* 카테고리별 지정 색상들 - 오른쪽 */}
      <div className="flex flex-wrap gap-3">
        {categorizedColors.map(renderColorButton)}
      </div>
    </div>
  );
};

export default ColorPicker;