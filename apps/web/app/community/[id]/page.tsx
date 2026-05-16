import { apiFetch } from "../../../lib/api";

export default async function CommunityDetailPage({ params }: { params: { id: string } }) {
  let post: any = null;
  try { post = (await apiFetch(`/community/posts/${params.id}`)).post; } catch {}
  if (!post) return <main className="shell"><div className="card">Post not found or login required.</div></main>;
  return (
    <main className="shell">
      <article className="card">
        <span className="chip">{post.category}</span>{post.isVerified && <span className="chip">Expert Verified</span>}
        <h1>{post.title}</h1>
        <p>{post.content}</p>
        <p className="muted">{post.district ?? "Botswana"} - {post.viewCount} views</p>
      </article>
      <section style={{ marginTop: 16 }}>
        <h2>Comments</h2>
        {post.comments?.map((comment: any) => <div key={comment.id} className="card" style={{ marginBottom: 10 }}><b>{comment.isBestAnswer ? "Best answer: " : ""}{comment.author?.name}</b><p>{comment.content}</p></div>)}
      </section>
    </main>
  );
}
