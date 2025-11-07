import { useEffect, useState } from "react";
import { fetchBlogPostById } from "../lib/api";
import type { BlogPost } from "../types/blog";

export default function BlogPostPage({ postId }: { postId: string }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  useEffect(()=>{ if (!postId) return; fetchBlogPostById(postId).then(setPost); }, [postId]);
  if (!post) return <div className="container mx-auto px-4 py-10">Cargando…</div>;
  return (
    <div className="container mx-auto px-4 py-10">
      <article className="prose prose-invert max-w-none">
        <h1>{post.title}</h1>
        <p><em>por {post.author}</em></p>
        {post.cover && <img src={post.cover} alt="" />}
        <div dangerouslySetInnerHTML={{ __html: post.content || "" }} />
      </article>
    </div>
  );
}
