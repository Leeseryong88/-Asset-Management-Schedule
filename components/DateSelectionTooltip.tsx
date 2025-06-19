import React, { useEffect, useState } from 'react';
import { DateSelectionTooltipData } from '../types';

interface DateSelectionTooltipProps {
  tooltipData: DateSelectionTooltipData | null;
}

const DateSelectionTooltip: React.FC<DateSelectionTooltipProps> = ({ tooltipData }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (tooltipData) {
      const { x, y } = tooltipData;
      let newTop = y + 20;
      let newLeft = x + 20;

      const tooltipEl = document.getElementById('date-selection-tooltip');
      const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 300;
      const tooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 50;

      if (newLeft + tooltipWidth > window.innerWidth) {
        newLeft = x - tooltipWidth - 20;
      }
      if (newTop + tooltipHeight > window.innerHeight) {
        newTop = y - tooltipHeight - 20;
      }
      if (newLeft < 0) newLeft = 10;
      if (newTop < 0) newTop = 10;

      setPosition({ top: newTop, left: newLeft });
    }
  }, [tooltipData]);

  if (!tooltipData) return null;

  return (
    <div
      id="date-selection-tooltip"
      className="fixed py-2 px-3 bg-gray-900 bg-opacity-75 backdrop-blur-md border border-gray-700 rounded-md text-sm text-gray-100 shadow-lg z-50 pointer-events-none"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <span>{tooltipData.text}</span>
      <span className="text-gray-400 ml-2">(취소: Esc)</span>
    </div>
  );
};

export default DateSelectionTooltip; 