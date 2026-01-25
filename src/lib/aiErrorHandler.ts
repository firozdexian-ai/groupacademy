/**
 * Centralized AI error handling utility
 * Provides consistent, user-friendly error messages for AI service failures
 */

export interface AIErrorResult {
  message: string;
  suggestion?: string;
  isAIUnavailable: boolean;
}

/**
 * Parse AI-related errors and return user-friendly messages
 */
export function handleAIError(error: any, statusCode?: number): AIErrorResult {
  const errorMessage = error?.message?.toLowerCase() || '';
  
  // AI quota/balance issues (402 Payment Required)
  if (statusCode === 402 || errorMessage.includes('quota') || errorMessage.includes('payment_required') || errorMessage.includes('not enough credits')) {
    return {
      message: "AI features are temporarily unavailable.",
      suggestion: "Please try the manual process or check back later.",
      isAIUnavailable: true
    };
  }
  
  // Rate limiting (429 Too Many Requests)
  if (statusCode === 429 || errorMessage.includes('rate limit')) {
    return {
      message: "Too many requests. Please wait a moment.",
      suggestion: "Try again in a few seconds.",
      isAIUnavailable: false
    };
  }
  
  // Timeout errors
  if (errorMessage.includes('timeout') || error?.name === 'AbortError') {
    return {
      message: "Request timed out.",
      suggestion: "Please try again or use manual entry.",
      isAIUnavailable: false
    };
  }
  
  // Server errors (5xx)
  if (statusCode === 500 || statusCode === 502 || statusCode === 503 || statusCode === 504) {
    return {
      message: "AI service is currently unavailable.",
      suggestion: "Please try the manual process or check back later.",
      isAIUnavailable: true
    };
  }
  
  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('failed to fetch')) {
    return {
      message: "Network connection issue.",
      suggestion: "Please check your internet connection and try again.",
      isAIUnavailable: false
    };
  }
  
  // Default fallback
  return {
    message: error?.message || "Something went wrong.",
    suggestion: "Please try again.",
    isAIUnavailable: false
  };
}

/**
 * Standard toast content for AI unavailable scenarios
 */
export function getAIUnavailableToast(): { title: string; description: string } {
  return {
    title: "AI Features Unavailable",
    description: "Sorry, AI features are not available right now. Please try the manual process or check back later."
  };
}

/**
 * Check if an error response indicates AI is unavailable
 */
export function isAIServiceError(response: Response | null): boolean {
  if (!response) return false;
  return response.status === 402 || response.status === 429 || response.status >= 500;
}
