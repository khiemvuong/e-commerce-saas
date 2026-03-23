/**
 * Recommendation Action Tracker
 * 
 * Fire-and-forget utility to track user actions for realtime score updates.
 * Sends actions to the recommendation-service which triggers WebSocket score updates.
 */

import axiosInstance from '../../utils/axiosInstance';

export type TrackableAction =
  | 'product_view'
  | 'add_to_cart'
  | 'add_to_wishlist'
  | 'purchase'
  | 'remove_from_cart'
  | 'remove_from_wishlist'
  | 'search_intent';

interface TrackActionParams {
  userId: string;
  action: TrackableAction;
  productId?: string;
  productTitle?: string;
  keyword?: string;
}

/**
 * Track a user action — fire-and-forget.
 * This sends the action to the recommendation-service which:
 * 1. Stores it in userAnalytics.actions[]
 * 2. Emits a realtime score update via WebSocket
 * 
 * Usage:
 *   trackAction({ userId: user.id, action: 'product_view', productId: '123', productTitle: 'iPhone 15' });
 *   trackAction({ userId: user.id, action: 'add_to_cart', productId: '123', productTitle: 'iPhone 15' });
 *   trackAction({ userId: user.id, action: 'search_intent', keyword: 'wireless headphones' });
 */
export function trackAction(params: TrackActionParams): void {
  if (!params.userId || !params.action) return;

  // Fire-and-forget — never block the UI
  axiosInstance
    .post('/ai-chat/api/chat/track-action', params)
    .catch(() => {}); // silently ignore errors
}

export default trackAction;
