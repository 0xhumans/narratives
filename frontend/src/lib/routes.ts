/** Base path for the authenticated workspace (post-landing). */
export const APP = "/app";

export function appPath(sub = ""): string {
  if (!sub || sub === "/") return APP;
  return `${APP}${sub.startsWith("/") ? sub : `/${sub}`}`;
}
