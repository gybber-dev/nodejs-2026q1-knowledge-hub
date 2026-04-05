export interface Article {
  id: string;
  title: string;
  content: string;
  categoryId?: string;
  status?: string;
  authorId?: string;
  tags?: string[];
  createdAt?: number;
  updatedAt?: number;
}
