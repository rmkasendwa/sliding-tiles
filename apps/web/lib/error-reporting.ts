export function reportApplicationError(error: unknown, context: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[web] ${context}`, error);
  }

  if (typeof window === 'undefined' || typeof window.reportError !== 'function') {
    return;
  }

  try {
    window.reportError(error);
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[web] ${context} could not be reported.`, error);
    }
  }
}
