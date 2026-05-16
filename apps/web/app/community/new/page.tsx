"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";

export default function NewCommunityPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("QUESTIONS");
  const [district, setDistrict] = useState("North-East District");
  async function submit() {
    const data = await apiFetch("/community/posts", { method: "POST", body: JSON.stringify({ title, content, category, district, tags: [], photoUrls: [], isAnonymous: false }) });
    router.push(`/community/${data.post.id}`);
  }
  return (
    <main className="shell" style={{ maxWidth: 720 }}>
      <div className="card">
        <h1>Create post</h1>
        <p className="muted">Share real farming experiences from Botswana. Be respectful, no spam, and direct serious animal disease issues to DVS Botswana +267 3950500.</p>
        <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <p><select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>{["CROPS","LIVESTOCK","SOIL","WEATHER","EQUIPMENT","MARKET_PRICES","SUCCESS_STORIES","QUESTIONS","GENERAL"].map((c) => <option key={c}>{c}</option>)}</select></p>
        <p><input className="input" placeholder="District" value={district} onChange={(e) => setDistrict(e.target.value)} /></p>
        <textarea className="input" rows={8} placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} />
        <p><button className="btn gold" disabled={title.length < 4 || content.length < 20} onClick={submit}>Post to Community</button></p>
      </div>
    </main>
  );
}
