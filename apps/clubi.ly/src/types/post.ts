import type { Author } from './author'
import type { Category } from './categoryBlog'

export type BlockType = 'text' | 'image' | 'video' // adicione outros se tiver

export interface Block {
  id: string
  position: number
  type: BlockType
  content: string
}

export interface BlockCreate {
  position: number
  type: BlockType
  content: string
}

export interface Post {
  id: string
  title: string
  slug: string
  author: Author
  categories: Category[]
  blocks: Block[]
  created_at: string
  updated_at: string
  thumbnail_url?: string
}

export interface PostPage {
  items: Post[];
  page: number;
  page_size: number;
  total: number;
}
