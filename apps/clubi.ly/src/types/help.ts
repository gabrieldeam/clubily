// src/types/help.ts

export interface HelpCategory {
  id: string;
  name: string;
  parent_id: string | null;
  children: HelpCategory[];
}

// Bloco de texto, conteúdo é string pura ou objeto com HTML
export interface HelpTextBlock {
  id: string;
  position: number;
  type: "text";
  content: string | { html: string };
}

// Bloco de imagem, conteúdo é objeto com url, caption opcional e link opcional
export interface HelpImageBlock {
  id: string;
  position: number;
  type: "image";
  content: {
    url: string;
    caption?: string;
    link?: string;
  };
}

// União de todos os blocos
export type HelpBlock = HelpTextBlock | HelpImageBlock;

// Para criação, omitimos o `id`
export type HelpBlockCreate = Omit<HelpBlock, 'id'>;

export interface HelpPost {
  id: string;
  title: string;
  slug: string;
  categories: HelpCategory[];
  blocks: HelpBlock[];
  created_at: string;
  updated_at: string;
}

export interface HelpPostPage {
  items: HelpPost[];
  page: number;
  page_size: number;
  total: number;
}

export interface HelpCategoryTree {
  id: string;
  name: string;
  parent_id: string | null;
  posts: HelpPost[];
  children: HelpCategoryTree[];
}
