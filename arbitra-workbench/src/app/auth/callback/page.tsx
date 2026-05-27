"use client";

import { useEffect, useState } from "react";
import { setZkLoginUser, parseJwtEmail, deriveAddressFromJwt } from "@/lib/authStore";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing login...");

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const idToken = params.get("id_token");

    if (!idToken) {
      setStatus("Login failed. No token received.");
      setTimeout(() => router.push("/connect"), 2000);
      return;
    }

    sessionStorage.setItem("zklogin_jwt", idToken);
    const email = parseJwtEmail(idToken);
    const address = deriveAddressFromJwt(idToken);
    setZkLoginUser(address, email);
    setStatus("Login successful. Redirecting...");
    setTimeout(() => router.push("/"), 1000);
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "#060a10", color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
      <div style={{ width: 48, height: 48, background: "linear-gradient(135deg,#1a2d4a,#0f1e36)", border: "1px solid #2a4a7a", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <i className="ti ti-shield-bolt" style={{ fontSize: 26, color: "#60a5fa" }} />
      </div>
      <p style={{ fontSize: 14, color: "#94a3b8" }}>{status}</p>
    </div>
  );
}
