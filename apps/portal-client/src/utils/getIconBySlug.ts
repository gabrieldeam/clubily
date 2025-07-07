// utils/getIconBySlug.ts
import * as Icons from 'lucide-react';

function toPascalCase(str: string) {
  return str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // remove acentos
    .split(/[\s-_]+/)                                 // divide por espaços, hífens ou underscores
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

export function getIconBySlug(slug: string) {
  const iconName = toPascalCase(slug);
  // @ts-ignore — acessa dinamicamente o componente
  return Icons[iconName] || Icons.Box;
}
