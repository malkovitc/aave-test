import { memo } from 'react';
import { cn } from '@/shared/lib/utils';
import usdcLogo from '@/assets/usdc.png';
import usdtLogo from '@/assets/usdt.png';
import linkLogo from '@/assets/link.png';
import wbtcLogo from '@/assets/wbtc.png';
import daiLogo from '@/assets/dai.png';
import aaveLogo from '@/assets/aave.png';
import eursLogo from '@/assets/eurs.png';

interface TokenIconProps {
	symbol: string;
	size?: number;
	className?: string;
}

/**
 * Token configuration type
 */
interface TokenConfig {
	type: 'image' | 'svg' | 'gradient';
	src?: string;
	alt: string;
	objectFit?: 'contain' | 'cover';
	rounded?: boolean;
	renderCustom?: (size: number, className?: string) => React.ReactElement;
}

/**
 * Token registry - Single source of truth for all token icons
 * Following Open/Closed Principle - open for extension, closed for modification
 */
const TOKEN_REGISTRY: Record<string, TokenConfig> = {
	USDC: {
		type: 'image',
		src: usdcLogo,
		alt: 'USDC',
		rounded: true,
	},
	USDT: {
		type: 'image',
		src: usdtLogo,
		alt: 'USDT',
		rounded: true,
	},
	LINK: {
		type: 'image',
		src: linkLogo,
		alt: 'LINK',
		objectFit: 'contain',
	},
	WBTC: {
		type: 'image',
		src: wbtcLogo,
		alt: 'WBTC',
		objectFit: 'cover',
		rounded: true,
	},
	DAI: {
		type: 'image',
		src: daiLogo,
		alt: 'DAI',
		objectFit: 'contain',
	},
	AAVE: {
		type: 'image',
		src: aaveLogo,
		alt: 'AAVE',
		objectFit: 'contain',
	},
	EURS: {
		type: 'image',
		src: eursLogo,
		alt: 'EURS',
		objectFit: 'contain',
	},
	WETH: {
		type: 'gradient',
		alt: 'WETH',
		renderCustom: (size: number, className?: string) => (
			<div
				className={cn('rounded-full flex items-center justify-center flex-shrink-0 gradient-weth', className)}
				style={{ width: size, height: size }}
			>
				<svg width={size * 0.5} height={size * 0.8} viewBox="0 0 16 26" fill="none">
					<path d="M8 0L0 13.2L8 18L16 13.2L8 0Z" fill="white" fillOpacity="0.6" />
					<path d="M8 0L8 18L16 13.2L8 0Z" fill="white" fillOpacity="0.8" />
					<path d="M0 14.7L8 26V19.5L0 14.7Z" fill="white" fillOpacity="0.6" />
					<path d="M8 19.5V26L16 14.7L8 19.5Z" fill="white" fillOpacity="0.8" />
				</svg>
			</div>
		),
	},
};

/**
 * Renders a standard image-based token icon
 * Single Responsibility Principle - handles only image rendering
 */
function ImageTokenIcon({
	src,
	alt,
	size,
	className,
	objectFit = 'cover',
	rounded = false,
}: {
	src: string;
	alt: string;
	size: number;
	className?: string;
	objectFit?: 'contain' | 'cover';
	rounded?: boolean;
}) {
	return (
		<img
			src={src}
			alt={alt}
			width={size}
			height={size}
			className={cn('flex-shrink-0', rounded && 'rounded-full', className)}
			style={{ width: size, height: size, objectFit }}
		/>
	);
}

/**
 * Renders a fallback icon for unknown tokens
 * Single Responsibility Principle - handles only fallback rendering
 */
function FallbackTokenIcon({ size, className }: { size: number; className?: string }) {
	return (
		<div
			className={cn('rounded-full flex items-center justify-center flex-shrink-0 bg-fallback-token', className)}
			style={{ width: size, height: size }}
		>
			<svg width={size * 0.5} height={size * 0.5} viewBox="0 0 32 32" fill="none">
				<circle cx="16" cy="16" r="14" stroke="white" strokeWidth="2.5" fill="none" />
			</svg>
		</div>
	);
}

/**
 * TokenIcon component
 * Displays token icons matching Figma design
 *
 * Design specs from Figma:
 * - USDC, USDT: Real logo images (circular)
 * - WETH: Gradient purple circle with Ethereum diamond SVG
 * - LINK, WBTC, DAI, AAVE, EURS: Real logo images
 *
 * Architecture:
 * - Uses TOKEN_REGISTRY as single source of truth (Open/Closed Principle)
 * - Delegates rendering to specialized components (Single Responsibility)
 * - Easy to extend with new tokens without modifying existing code
 *
 * Performance:
 * - Memoized to prevent unnecessary re-renders
 * - Explicit width/height attributes to prevent CLS (Cumulative Layout Shift)
 */
function TokenIconComponent({ symbol, size = 40, className }: TokenIconProps) {
	const upperSymbol = symbol.toUpperCase();
	const tokenConfig = TOKEN_REGISTRY[upperSymbol];

	// Unknown token - use fallback
	if (!tokenConfig) {
		return <FallbackTokenIcon size={size} className={className} />;
	}

	// Custom rendering (e.g., WETH gradient)
	if (tokenConfig.renderCustom) {
		return tokenConfig.renderCustom(size, className);
	}

	// Image-based tokens
	if (tokenConfig.type === 'image' && tokenConfig.src) {
		return (
			<ImageTokenIcon
				src={tokenConfig.src}
				alt={tokenConfig.alt}
				size={size}
				className={className}
				objectFit={tokenConfig.objectFit}
				rounded={tokenConfig.rounded}
			/>
		);
	}

	// Fallback for misconfigured tokens
	return <FallbackTokenIcon size={size} className={className} />;
}

// Export memoized version to prevent unnecessary re-renders
export const TokenIcon = memo(TokenIconComponent);
