import Link from "next/link";
import { apiFetch } from "../../lib/api";

export default async function CommunityPage({ searchParams }: { searchParams: { category?: string; district?: string; search?: string } }) {
  let posts: any[] = [];
  try {
    const query = new URLSearchParams(searchParams as Record<string, string>).toString();
    posts = (await apiFetch(`/community/posts?${query}`)).posts;
  } catch {}
  return (
    <main className="shell">
      <section className="hero"><h1>Tshimo Community</h1><p>Farmers sharing local knowledge in English and Setswana.</p></section>
      <div className="grid">
        <aside className="card">
          <h3>Filters</h3>
          {["ALL","CROPS","LIVESTOCK","SOIL","QUESTIONS","MARKET_PRICES","SUCCESS_STORIES"].map((cat) => <Link key={cat} className="chip" href={`/community?category=${cat}`}>{cat.replace("_"," ")}</Link>)}
          <p><Link className="btn gold" href="/community/new">+ Post</Link></p>
          <p><Link className="btn" href="/community/market-prices">Market Prices</Link></p>
        </aside>
        <section>
          {posts.map((post) => (
            <Link key={post.id} href={`/community/${post.id}`}>
              <article className="card" style={{ marginBottom: 12 }}>
                <span className="chip">{post.category}</span>{post.isVerified && <span className="chip">Expert Verified</span>}
                <h2>{post.title}</h2>
                <p className="muted">{post.content}</p>
                <small>{post.district ?? "Botswana"} - {post.viewCount} views</small>
              </article>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
