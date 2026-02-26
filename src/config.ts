/**
 * Application configuration
 */

export const CONFIG = {
  /** URL of the wb-diagram-board visual editor */
  boardUrl: import.meta.env.PROD 
    ? 'https://pplnvk.github.io/wb-diagram-board'
    : 'http://localhost:5179/wb-diagram-board/',
  
  /** Origin of the converter app (for postMessage security) */
  converterOrigin: import.meta.env.PROD
    ? 'https://pplnvk.github.io'
    : 'http://localhost:5173',
    
  /** Origin of the board app (for postMessage validation) */
  boardOrigin: import.meta.env.PROD
    ? 'https://pplnvk.github.io'
    : 'http://localhost:5179',
} as const;
