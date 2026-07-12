export function getPublicCardUrl(publicId: string): string {
  const path = `/card/${encodeURIComponent(publicId)}`;

  if (typeof window === 'undefined') {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}
