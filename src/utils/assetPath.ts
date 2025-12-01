/**
 * Helper to resolve asset URLs that honor Vite's base path.
 * This keeps bundled/public assets working when the app is served from a subdirectory.
 */
export const assetPath = (relativePath: string): string => {
  const base = import.meta.env.BASE_URL ?? '/';
  const normalized = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${base}${normalized}`;
};

/**
 * Resolve background image URLs so builds served from a subdirectory still work.
 * BASE_URL is injected by Vite to prefix assets when the game isn't hosted at the root.
 */
export function bgPath(fileName: string) {
  return `${import.meta.env.BASE_URL}assets/bg/${fileName}`;
}
