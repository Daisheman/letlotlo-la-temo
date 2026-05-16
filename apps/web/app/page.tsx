import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <h1>Letlotlo la Temo</h1>
        <p>AI farming assistant, secure accounts, and Tshimo Community for Botswana.</p>
      </section>
      <div className="card">
        <Link className="btn" href="/community">Open Community</Link>{" "}
        <Link className="btn gold" href="/verify-email">Verify Email</Link>
      </div>
    </main>
  );
}
