export function getPublicCardUrl(cardId: string): string {
  const query = `cardId=${encodeURIComponent(cardId)}`;

  if (typeof window === 'undefined') {
    return `/?${query}`;
  }

  const url = new URL(window.location.href);
  url.hash = '';
  url.search = '';
  url.searchParams.set('cardId', cardId);
  return url.toString();
}
