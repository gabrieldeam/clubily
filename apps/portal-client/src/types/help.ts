// src/types/help.ts

// Categoria de suporte
export interface HelpCategory {
  id: string;
  name: string;
  parent_id: string | null;
  children: HelpCategory[];
}
export interface HelpCategoryCreate {
  name: string;
  parent_id?: string | null;
}
export type HelpCategoryUpdate = HelpCategoryCreate;

// Blocos de artigo de suporte
export interface TextHelpBlock {
  id: string;
  position: number;
  type: "text";
  content: { html: string };
}
export interface ImageHelpBlock {
  id: string;
  position: number;
  type: "image";
  content: { url: string };
}

// União discriminada para leitura
export type HelpBlock = TextHelpBlock | ImageHelpBlock;

// Criação de blocos (sem id)
export interface TextHelpBlockCreate {
  position: number;
  type: "text";
  content: { html: string };
}
export interface ImageHelpBlockCreate {
  position: number;
  type: "image";
  content: { url: string };
}
export type HelpBlockCreate = TextHelpBlockCreate | ImageHelpBlockCreate;

// Post de suporte
export interface HelpPost {
  id: string;
  title: string;
  slug: string;
  categories: HelpCategory[];
  blocks: HelpBlock[];
  created_at: string;
  updated_at: string;
}

export interface HelpPostCreate {
  title: string;
  slug: string;
  category_ids: string[];
  blocks: HelpBlockCreate[];
}
export interface HelpPostUpdate {
  title?: string;
  slug?: string;
  category_ids?: string[];
  blocks?: HelpBlockCreate[];
}

// Paginação
export interface HelpPostPage {
  items: HelpPost[];
  page: number;
  page_size: number;
  total: number;
}

// Aliases para uso no front
export type BlockType = HelpBlockCreate["type"];        // "text" | "image"
export type BlockCreate = HelpBlockCreate;               // blocos sem id
export type BlockRead   = HelpBlock;                     // blocos com id