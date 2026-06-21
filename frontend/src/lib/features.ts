/** Feature flags for production (Vercel) vs local full stack. */
export const STATIC_DATA = import.meta.env.VITE_STATIC_DATA === "true";
export const PIPELINE_ENABLED = import.meta.env.VITE_PIPELINE_ENABLED !== "false";
