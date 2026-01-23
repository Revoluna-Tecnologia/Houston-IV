import { revalidateTag } from 'next/cache';

export const CacheTags = {
  CANDIDATURAS: 'candidaturas',
  MEDICOS: 'medicos',
  VAGAS: 'vagas',
  HOSPITAIS: 'hospitais',
  ESCALISTAS: 'escalistas',
  GRADES: 'grades',
  USERS: 'users',
  PAGAMENTOS: 'pagamentos',
} as const;

export type CacheTag = typeof CacheTags[keyof typeof CacheTags];

export function invalidateCache(tag: CacheTag) {
  if (typeof window === 'undefined') {
    revalidateTag(tag);
  }
}

export function invalidateCacheTags(tags: CacheTag[]) {
  if (typeof window === 'undefined') {
    tags.forEach(tag => revalidateTag(tag));
  }
}
