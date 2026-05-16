"use client";
import { useState } from "react";
import { apiFetch } from "../../../lib/api";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [message, setMessage] = useState("");
  const code = digits.join("");
  async function verify() {
    const data = await apiFetch("/auth/verify-email", { method: "POST", body: JSON.stringify({ email, code }) });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    setMessage("Email verified. Welcome to Letlotlo la Temo.");
  }
  return (
    <main className="shell" style={{ maxWidth: 520 }}>
      <div className="hero"><h1>Letlotlo la Temo</h1><p>AI Farming Assistant</p></div>
      <div className="card">
        <h2>Verify your email</h2>
        <p className="muted">Enter the 6-digit code sent to your email.</p>
        <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div style={{ margin: "18px 0" }}>
          {digits.map((digit, index) => (
            <input key={index} className="otp" maxLength={1} value={digit} onChange={(e) => {
              const next = [...digits]; next[index] = e.target.value.replace(/\D/g, ""); setDigits(next);
            }} />
          ))}
        </div>
        <button className="btn gold" disabled={code.length !== 6} onClick={verify}>Verify</button>
        <button className="btn" style={{ marginLeft: 8 }} onClick={() => apiFetch("/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) }).then(() => setMessage("Code resent."))}>Resend Code</button>
        {message && <p>{message}</p>}
      </div>
    </main>
  );
}
