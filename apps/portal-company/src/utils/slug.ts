/**
 * Gera um slug “amigável” a partir de um texto qualquer:
 * - Remove acentos
 * - Converte para minúsculas
 * - Substitui tudo que não for [a-z0-9] por hífen
 * - Remove hífens duplicados e nas extremidades
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')                // separa letras e diacríticos
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
    .toLowerCase()                   // minúsculas
    .trim()                          // sem espaços nas pontas
    .replace(/[^a-z0-9]+/g, '-')     // não alfanum. → hífen
    .replace(/^-+|-+$/g, '');        // remove hífens do início/fim
}

/**
 * Valida se uma string é um slug bem formado:
 * - começa e termina com [a-z0-9]
 * - pode ter hífens internos
 */
export function validateSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
