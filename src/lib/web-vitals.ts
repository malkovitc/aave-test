import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Web Vitals Monitoring
 *
 * Tracks Core Web Vitals metrics for performance monitoring:
 * - CLS (Cumulative Layout Shift): Visual stability
 * - INP (Interaction to Next Paint): Interactivity (replaces FID)
 * - FCP (First Contentful Paint): Perceived load speed
 * - LCP (Largest Contentful Paint): Load performance
 * - TTFB (Time to First Byte): Server response time
 *
 * Note: INP replaced FID in web-vitals v3+
 *
 * In production, these metrics can be sent to analytics services
 * like Google Analytics, Vercel Analytics, or custom endpoints.
 *
 * @see https://web.dev/vitals/
 */

/**
 * Handles web vitals metrics
 * In development: Logs to console
 * In production: Could send to analytics service
 */
function handleMetric(metric: Metric): void {
	// Development: Log to console with formatting
	if (process.env.NODE_ENV === 'development') {
		console.log(`[Web Vitals] ${metric.name}:`, {
			value: metric.value,
			rating: metric.rating,
			delta: metric.delta,
			id: metric.id,
		});
	}

	// Production: Send to analytics
	// Example with Google Analytics:
	// if (window.gtag) {
	//   window.gtag('event', metric.name, {
	//     value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
	//     event_category: 'Web Vitals',
	//     event_label: metric.id,
	//     non_interaction: true,
	//   });
	// }

	// Example with custom analytics endpoint:
	// fetch('/api/analytics', {
	//   method: 'POST',
	//   body: JSON.stringify(metric),
	//   headers: { 'Content-Type': 'application/json' },
	// });
}

/**
 * Initialize Web Vitals monitoring
 * Call this once when the app starts
 */
export function initWebVitals(): void {
	// Track all Core Web Vitals
	onCLS(handleMetric);
	onINP(handleMetric); // Replaced FID in web-vitals v3+
	onFCP(handleMetric);
	onLCP(handleMetric);
	onTTFB(handleMetric);

	if (process.env.NODE_ENV === 'development') {
		console.log('[Web Vitals] Monitoring initialized');
	}
}
