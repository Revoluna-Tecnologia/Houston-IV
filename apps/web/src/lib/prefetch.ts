import { ReadonlyURLSearchParams } from 'next/navigation';

export function prefetchPage(href: string): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);

  setTimeout(() => {
    document.head.removeChild(link);
  }, 5000);
}

export function prefetchPages(hrefs: string[]): void {
  hrefs.forEach(href => prefetchPage(href));
}

export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function parseQueryParams(searchParams: ReadonlyURLSearchParams): Record<string, string> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}
