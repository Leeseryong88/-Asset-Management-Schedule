export const PREDEFINED_COLORS: string[] = [
  '#4299E1', // blue-500
  '#48BB78', // green-500
  '#ED8936', // orange-500
  '#F56565', // red-500
  '#ECC94B', // yellow-500
  '#9F7AEA', // purple-500
  '#ED64A6', // pink-500
  '#A0AEC0', // gray-500
  '#38B2AC', // teal-500
  '#667EEA', // indigo-500
];

export const DEFAULT_SCHEDULE_COLOR: string = PREDEFINED_COLORS[0];

export const CALENDAR_BAR_HEIGHT = 20; // px
export const CALENDAR_BAR_VERTICAL_GAP = 2; // px
export const MAX_CALENDAR_LANES = 3; // Max number of stacked bars before showing "+N more"
export const DATE_NUMBER_HEIGHT_APPROX = 24; // Approximate height for the date number area in a cell

export const TEAM_OPTIONS: string[] = ['자산운영', '안전보건', '푸드컬쳐'];
// export const DIRECT_INPUT_TEAM_OPTION: string = '직접입력'; // Removed
export const ALL_TEAMS_FILTER_VALUE = 'ALL_TEAMS';

export const CATEGORY_OPTIONS: string[] = ['공사', '인허가', '행사', '회의', '직접입력'];
export const DEFAULT_CATEGORY: string = CATEGORY_OPTIONS[0];

export const CATEGORY_EMOJI_MAP: { [key: string]: string } = {
  '공사': '🏗️',
  '인허가': '📋',
  '행사': '🎉',
  '회의': '💼',
  '직접입력': '📝'
};

// 카테고리에 해당하는 이모티콘을 반환하는 헬퍼 함수
export const getCategoryEmoji = (category: string): string => {
  return CATEGORY_EMOJI_MAP[category] || '📝';
};

// 카테고리에 해당하는 이모티콘과 텍스트를 함께 반환하는 헬퍼 함수
export const getCategoryDisplay = (category: string): string => {
  const emoji = CATEGORY_EMOJI_MAP[category] || '📝';
  return `${emoji}[${category}]`;
};
