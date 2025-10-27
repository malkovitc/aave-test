export const VERTICAL_SPACING = {
	FORM_FIELD: 'space-y-2',
	CARD_CONTENT: 'space-y-4',
	SECTION: 'space-y-6',
	PAGE_SECTION: 'space-y-8',
} as const;

export const HORIZONTAL_SPACING = {
	TIGHT: 'gap-2',
	MEDIUM: 'gap-3',
	LARGE: 'gap-4',
	XLARGE: 'gap-6',
} as const;

export const FLEX_PATTERNS = {
	ROW_TIGHT: 'flex gap-2',
	ROW_MEDIUM: 'flex gap-3',
	ROW_CENTER: 'flex items-center',
	ROW_CENTER_TIGHT: 'flex items-center gap-2',
	ROW_CENTER_MEDIUM: 'flex items-center gap-3',
	ROW_BETWEEN: 'flex items-center justify-between',
	ROW_BETWEEN_GAP: 'flex items-center justify-between gap-3',
} as const;

export const CONTAINER_PADDING = {
	HORIZONTAL: 'px-4 md:px-20',
	VERTICAL: 'py-4 md:py-8',
	COMBINED: 'px-4 md:px-20 py-4 md:py-8',
	CARD_HORIZONTAL: 'px-6',
	CARD_VERTICAL: 'py-6',
	CARD_TOP: 'pt-6',
	CARD_BOTTOM: 'pb-6',
} as const;

export const spacing = {
	vertical: (size: 2 | 4 | 6 | 8): string => `space-y-${size}`,
	gap: (size: 2 | 3 | 4 | 6): string => `gap-${size}`,
} as const;

export type VerticalSpacing = (typeof VERTICAL_SPACING)[keyof typeof VERTICAL_SPACING];
export type HorizontalSpacing = (typeof HORIZONTAL_SPACING)[keyof typeof HORIZONTAL_SPACING];
export type FlexPattern = (typeof FLEX_PATTERNS)[keyof typeof FLEX_PATTERNS];
export type ContainerPadding = (typeof CONTAINER_PADDING)[keyof typeof CONTAINER_PADDING];
