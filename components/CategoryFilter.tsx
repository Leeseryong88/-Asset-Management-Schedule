import React from 'react';
import { CATEGORY_OPTIONS, CATEGORY_ICON_MAP } from '../constants';
import { CheckBadgeIcon } from './Icons';

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ selectedCategories, onCategoryToggle }) => {
  const isAllSelected = selectedCategories.length === CATEGORY_OPTIONS.length;

  const renderCategoryButton = (category: string, isAllButton = false) => {
    const isSelected = isAllButton ? isAllSelected : selectedCategories.includes(category);
    const Icon = isAllButton ? CheckBadgeIcon : CATEGORY_ICON_MAP[category];
    const title = isAllButton ? (isSelected ? '전체 해제' : '전체 선택') : category;
    const onClickAction = isAllButton ? () => onCategoryToggle('all') : () => onCategoryToggle(category);

    const buttonClasses = `flex flex-col items-center justify-center rounded-md p-1 transition-all duration-200 transform hover:scale-105 w-14 h-12 text-center ${
      isSelected
        ? 'bg-sky-500 text-white shadow-md'
        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
    }`;

    return (
      <button
        key={category}
        onClick={onClickAction}
        className={buttonClasses}
        title={title}
      >
        {Icon && <Icon className="w-4 h-4 mb-1" />}
        <span className="text-[10px] leading-tight font-medium">{isAllButton ? '전체' : category}</span>
      </button>
    );
  };

  return (
    <div className="flex items-center space-x-1">
      {renderCategoryButton('all', true)}
      <div className="border-l border-slate-600 h-8 mx-1"></div>
      {CATEGORY_OPTIONS.map(category => renderCategoryButton(category))}
    </div>
  );
};

export default CategoryFilter; 