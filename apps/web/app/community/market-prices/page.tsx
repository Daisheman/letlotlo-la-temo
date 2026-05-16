import { apiFetch } from "../../../lib/api";

export default async function MarketPricesPage() {
  let prices: any[] = [];
  try { prices = (await apiFetch("/community/market-prices")).prices; } catch {}
  return (
    <main className="shell">
      <section className="hero"><h1>Market Prices</h1><p>Community-reported prices in BWP. Verify before trading.</p></section>
      <div className="card">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th align="left">Crop</th><th align="left">BWP/kg</th><th align="left">District</th><th align="left">Updated</th></tr></thead>
          <tbody>{prices.map((p) => <tr key={p.id}><td>{p.crop}</td><td>{p.pricePerKg}</td><td>{p.district}</td><td>{new Date(p.createdAt).toLocaleDateString()}</td></tr>)}</tbody>
        </table>
      </div>
    </main>
  );
}
