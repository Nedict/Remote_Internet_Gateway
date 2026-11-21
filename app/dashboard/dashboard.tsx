"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type ProfileResponse = { data: { user: { id: string; name: string; email: string; image: string | null }; profile: { id: string; displayName: string | null; timezone: string } } };
type Gateway = { id: string; name: string; status: string; lastSeenAt: string | null; permission: string };
type ApiError = { error?: { message?: string } };

const panelStyle = { border: "1px solid #30372d", borderRadius: 14, background: "#151914", padding: 22 } as const;
const fieldStyle = { width: "100%", padding: "11px 12px", marginTop: 6, color: "#f2f3ee", border: "1px solid #3b4336", borderRadius: 7, background: "#10130f" } as const;

export default function Dashboard() {
  const [profile, setProfile] = useState<ProfileResponse["data"] | null>(null);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [profileResponse, gatewayResponse] = await Promise.all([
        fetch("/api/v1/profile", { cache: "no-store" }),
        fetch("/api/v1/gateways", { cache: "no-store" }),
      ]);
      if (profileResponse.status === 401 || gatewayResponse.status === 401) {
        window.location.assign("/login?next=%2Fdashboard");
        return;
      }
      const profileBody = await profileResponse.json() as ProfileResponse & ApiError;
      const gatewayBody = await gatewayResponse.json() as { data: Gateway[] } & ApiError;
      if (!profileResponse.ok) throw new Error(profileBody.error?.message || "Could not load your profile.");
      if (!gatewayResponse.ok) throw new Error(gatewayBody.error?.message || "Could not load gateways.");
      setProfile(profileBody.data);
      setDisplayName(profileBody.data.profile.displayName || profileBody.data.user.name);
      setTimezone(profileBody.data.profile.timezone || "UTC");
      setGateways(gatewayBody.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to connect to the RIG backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, timezone }),
      });
      const body = await response.json() as { data?: { displayName: string; timezone: string } } & ApiError;
      if (!response.ok) throw new Error(body.error?.message || "Could not save your profile.");
      setProfile((current) => current ? { ...current, profile: { ...current.profile, displayName: body.data!.displayName, timezone: body.data!.timezone } } : current);
      setNotice("Profile saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", padding: "32px 18px 70px", color: "#f2f3ee", background: "#0c0e0d" }}>
      <div style={{ width: "min(100%, 900px)", margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 36 }}>
          <Link href="/" style={{ color: "#eef3e7", textDecoration: "none", fontSize: 20, fontWeight: 700 }}>rig<span style={{ color: "#a9cb71" }}>.</span></Link>
          <button onClick={() => void loadData()} disabled={loading} style={{ color: "#dce7cf", border: "1px solid #394333", borderRadius: 7, background: "#1b2118", padding: "9px 13px", cursor: "pointer" }}>{loading ? "Refreshing…" : "Refresh data"}</button>
        </header>
        <p style={{ color: "#a9cb71", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>Account dashboard</p>
        <h1 style={{ margin: "7px 0", fontSize: "clamp(28px, 5vw, 42px)", letterSpacing: -1.5 }}>Your RIG, in one place.</h1>
        <p style={{ color: "#a4aa9e", marginBottom: 26 }}>{profile ? `Signed in as ${profile.user.email}` : "Loading your secure account…"}</p>

        {error && <p role="alert" style={{ ...panelStyle, color: "#ffc2b2", borderColor: "#77483d" }}>{error}</p>}
        {notice && <p role="status" style={{ color: "#b6d887" }}>{notice}</p>}

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))" }}>
          <section style={panelStyle}>
            <h2 style={{ marginTop: 0, fontSize: 17 }}>Profile preferences</h2>
            <p style={{ color: "#9ba294", fontSize: 13 }}>Saved securely to your account.</p>
            <form onSubmit={saveProfile} style={{ display: "grid", gap: 15 }}>
              <label style={{ color: "#d3d8cc", fontSize: 12 }}>Display name<input style={fieldStyle} value={displayName} onChange={(event) => setDisplayName(event.target.value)} required minLength={1} maxLength={80} disabled={loading || saving} /></label>
              <label style={{ color: "#d3d8cc", fontSize: 12 }}>Timezone<input style={fieldStyle} value={timezone} onChange={(event) => setTimezone(event.target.value)} required maxLength={100} placeholder="Europe/London" disabled={loading || saving} /></label>
              <button type="submit" disabled={loading || saving} style={{ padding: 11, color: "#10130f", border: 0, borderRadius: 7, background: "#a9cb71", fontWeight: 700, cursor: "pointer" }}>{saving ? "Saving…" : "Save profile"}</button>
            </form>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0, fontSize: 17 }}>Your gateways</h2>
            <p style={{ color: "#9ba294", fontSize: 13 }}>Gateway records linked to your account.</p>
            {loading ? <p style={{ color: "#9ba294" }}>Loading gateways…</p> : gateways.length === 0 ? <div style={{ padding: 14, borderRadius: 9, background: "#10130f" }}><strong>No gateways linked yet</strong><p style={{ color: "#9ba294", fontSize: 13, lineHeight: 1.6 }}>Gateway enrollment will be added after the secure device-pairing protocol is designed. No setup code is sent or stored in this preview.</p></div> : <ul style={{ display: "grid", gap: 10, padding: 0, listStyle: "none" }}>{gateways.map((gateway) => <li key={gateway.id} style={{ padding: 13, borderRadius: 9, background: "#10130f" }}><strong>{gateway.name}</strong><p style={{ margin: "6px 0 0", color: "#9ba294", fontSize: 12 }}>{gateway.status} · {gateway.permission}{gateway.lastSeenAt ? ` · Last seen ${new Date(gateway.lastSeenAt).toLocaleString()}` : ""}</p></li>)}</ul>}
          </section>
        </div>

        <section style={{ ...panelStyle, marginTop: 16 }}>
          <h2 style={{ marginTop: 0, fontSize: 17 }}>VPN connectivity</h2>
          <p style={{ color: "#9ba294", fontSize: 13, lineHeight: 1.7 }}>This phase connects account data and gateway inventory to the backend. VPN tunneling and connection controls are intentionally deferred to a later stage; this dashboard never claims a tunnel is active.</p>
        </section>
        <p style={{ marginTop: 22, color: "#71786d", fontSize: 10 }}>RIG DEVELOPMENT PREVIEW · Backend data is served from your configured PostgreSQL database.</p>
      </div>
    </main>
  );
}
