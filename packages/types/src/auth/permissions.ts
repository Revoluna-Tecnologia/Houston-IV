export const PERMISSIONS = {
  HOSPITAIS: {
    SELECT: 'hospitais.select',
    INSERT: 'hospitais.insert',
    UPDATE: 'hospitais.update',
    DELETE: 'hospitais.delete',
  },
  MEDICOS: {
    SELECT: 'medicos.select',
    INSERT: 'medicos.insert',
    UPDATE: 'medicos.update',
    DELETE: 'medicos.delete',
  },
  VAGAS: {
    SELECT: 'vagas.select',
    INSERT: 'vagas.insert',
    UPDATE: 'vagas.update',
    DELETE: 'vagas.delete',
  },
  CANDIDATURAS: {
    SELECT: 'candidaturas.select',
    INSERT: 'candidaturas.insert',
    UPDATE: 'candidaturas.update',
    DELETE: 'candidaturas.delete',
  },
  GRUPOS: {
    SELECT: 'grupos.select',
    INSERT: 'grupos.insert',
    UPDATE: 'grupos.update',
    DELETE: 'grupos.delete',
  },
  ESCALISTAS: {
    SELECT: 'escalistas.select',
    INSERT: 'escalistas.insert',
    UPDATE: 'escalistas.update',
    DELETE: 'escalistas.delete',
  },
} as const

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS][keyof (typeof PERMISSIONS)[keyof typeof PERMISSIONS]]
