export interface BlogPost {
  id: string;
  title: string;
  author: string;
  excerpt?: string;
  content?: string;
  cover?: string;
  tags?: string[];
  category?: string;
  publishedAt?: string;
}
