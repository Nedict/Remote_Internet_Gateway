"use client";

import { FormEvent, useEffect, useState } from "react";

type Tab = "Home" | "Devices" | "Activity" | "Settings";
type IconName = "grid" | "router" | "settings" | "plus" | "power" | "shield" | "arrow" | "wifi" | "globe" | "clock" | "download" | "upload" | "check" | "close" | "lock" | "bell" | "chevron" | "signal";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const base = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  const art: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></>,
    router: <><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M7 9V5m10 4V5M8 14h.01M12 14h.01M16 14h.01M8 17h8"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.3a1.7 1.7 0 1 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9h-.3a1.7 1.7 0 1 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2v-.3a1.7 1.7 0 1 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.3a1.7 1.7 0 1 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>, power: <><path d="M12 2v10"/><path d="M5.5 5.5a9 9 0 1 0 13 0"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10"/></>, wifi: <><path d="M5 12.5a10 10 0 0 1 14 0M8 15.5a6 6 0 0 1 8 0M11 18.5a2 2 0 0 1 2 0"/><path d="M12 21h.01"/></>,
    globe: <><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>, download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>, close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>, signal: <><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 20V4"/></>,
  };
  return <svg {...base}>{art[name]}</svg>;
}

const tabs: { name: Tab; icon: IconName }[] = [
  { name: "Home", icon: "grid" }, { name: "Devices", icon: "router" }, { name: "Activity", icon: "clock" }, { name: "Settings", icon: "settings" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("Home");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [mode, setMode] = useState<"all" | "home">("all");
  const [networkLock, setNetworkLock] = useState(true);
  const [pairingOpen, setPairingOpen] = useState(false);
  const [pairCode, setPairCode] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!connected || startedAt === null) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [connected, startedAt]);

  const toggleConnection = () => {
    if (connected) {
      setConnected(false); setConnecting(false); setStartedAt(null); setElapsed(0); return;
    }
    if (connecting) return;
    setConnecting(true);
    window.setTimeout(() => { setStartedAt(Date.now()); setConnected(true); setConnecting(false); }, 1000);
  };

  const duration = `${String(Math.floor(elapsed / 3600)).padStart(2, "0")}:${String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const addGateway = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(pairCode.trim().length >= 4 ? "This preview isn’t connected to the RIG service yet. Your code hasn’t been sent." : "Enter the setup code shown on your gateway.");
  };
  const showNotice = () => { setNotice("You’re all caught up."); window.setTimeout(() => setNotice(""), 2400); };

  return (
    <main className="rig-app">
      <aside className="side-rail">
        <a className="rig-brand" href="#home" onClick={(event) => { event.preventDefault(); setTab("Home"); }} aria-label="RIG home"><span className="rig-mark"><span/></span><span className="rig-wordmark">rig<span>.</span></span></a>
        <p className="nav-caption">YOUR SPACE</p>
        <nav className="primary-nav" aria-label="Main navigation">{tabs.map(({ name, icon }) => <button key={name} onClick={() => setTab(name)} className={`nav-link ${tab === name ? "selected" : ""}`} aria-current={tab === name ? "page" : undefined}><Icon name={icon} size={18}/><span>{name}</span>{name === "Devices" && <small>1</small>}</button>)}</nav>
        <div className="rail-spacer"/>
        <div className="rail-status"><span className="status-pulse"/><span><strong>Gateway online</strong><small>Home · Last seen now</small></span></div>
        <button className="account-button" onClick={() => setTab("Settings")}><span className="account-avatar">N</span><span className="account-copy"><strong>Nedict</strong><small>Personal account</small></span><span className="account-more">···</span></button>
      </aside>

      <section className="app-main">
        <header className="app-header"><div className="mobile-brand"><span className="rig-mark"><span/></span><span className="rig-wordmark">rig<span>.</span></span></div><div className="header-context"><span>Personal space</span><Icon name="chevron" size={13}/><strong>{tab}</strong></div><div className="header-actions"><span className="preview-pill"><i/> Preview</span><button className="icon-button" onClick={showNotice} aria-label="Notifications"><Icon name="bell" size={18}/><i className="notification-dot"/></button></div></header>

        {tab === "Home" && <div className="page-content">
          <div className="welcome-row"><div><p className="kicker">YOUR PRIVATE NETWORK</p><h1>Welcome home<span>.</span></h1><p className="welcome-subtitle">Your home connection, ready when you are.</p></div><button className="add-gateway-button" onClick={() => { setPairingOpen(true); setMessage(""); }}><Icon name="plus" size={17}/><span>Add gateway</span></button></div>

          <section className={`connect-panel ${connected ? "live" : ""}`} aria-label="Home connection">
            <div className="connect-panel-top"><div className="home-device"><span className="device-glyph"><Icon name="router" size={19}/></span><div><strong>Home gateway</strong><span><i className="online-dot"/> Online <b>·</b> Home</span></div></div><button className="gateway-menu" onClick={() => setTab("Devices")} aria-label="Gateway details">···</button></div>
            <div className={`signal-art ${connected ? "signal-live" : ""} ${connecting ? "signal-connecting" : ""}`} aria-hidden="true"><div className="signal-wave wave-outer"/><div className="signal-wave wave-inner"/><div className="signal-core"><Icon name="power" size={27}/></div><span className="signal-star star-a"/><span className="signal-star star-b"/><span className="signal-star star-c"/></div>
            <div className="connect-copy"><p className={`connection-label ${connected ? "connected-label" : ""}`}><i/>{connecting ? "Setting up your secure connection…" : connected ? "You’re connected to home" : "Your home is just one tap away"}</p><button className={`connect-cta ${connected ? "disconnect-cta" : ""}`} onClick={toggleConnection} disabled={connecting}>{connecting ? <><span className="spinner"/> Connecting</> : <><Icon name="power" size={17}/>{connected ? "Disconnect" : "Connect to home"}</>}</button><p className="connect-caption">{connected ? `Protected session · ${duration}` : "Browse with your home internet connection."}</p></div>
            <div className="connect-card-foot"><span><Icon name="shield" size={14}/> Encrypted connection</span><span>DEMO GATEWAY <b>·</b> RIG-01</span></div>
          </section>

          <div className="quick-stats"><div className="quick-stat"><span className="stat-icon"><Icon name="wifi" size={17}/></span><div><small>HOME NETWORK</small><strong>Excellent signal</strong></div><span className="mini-bars"><i/><i/><i/><i/></span></div><div className="quick-stat"><span className="stat-icon"><Icon name="clock" size={17}/></span><div><small>RESPONSE TIME</small><strong>24 <em>ms</em></strong></div><span className="stat-trend"><Icon name="arrow" size={13}/></span></div><div className="quick-stat"><span className="stat-icon"><Icon name="globe" size={17}/></span><div><small>ROUTE MODE</small><strong>{mode === "all" ? "Full internet" : "Home devices"}</strong></div><span className="route-ready"><Icon name="check" size={13}/></span></div></div>

          <div className="lower-grid"><section className="section-card mode-card"><div className="section-heading"><div><p className="kicker">MAKE IT YOURS</p><h2>Choose your connection</h2><p>Decide what goes through your home.</p></div><span className="heading-art"><Icon name="globe" size={17}/></span></div><div className="route-choices"><button className={`route-choice ${mode === "all" ? "active" : ""}`} onClick={() => setMode("all")}><span className="route-check">{mode === "all" && <Icon name="check" size={12}/>}</span><span className="route-copy"><strong>All internet traffic</strong><small>Your apps browse through home.</small></span><Icon name="globe" size={17}/></button><button className={`route-choice ${mode === "home" ? "active" : ""}`} onClick={() => setMode("home")}><span className="route-check">{mode === "home" && <Icon name="check" size={12}/>}</span><span className="route-copy"><strong>Home devices only</strong><small>Keep other browsing local.</small></span><Icon name="router" size={17}/></button></div><div className="mode-footnote"><Icon name="lock" size={13}/>{mode === "all" ? "Your connection exits through your home internet." : "Only home-network traffic uses the connection."}</div></section>

            <section className="section-card gateway-card"><div className="section-heading"><div><p className="kicker">YOUR HARDWARE</p><h2>Home gateway</h2><p>Everything looks good at home.</p></div><span className="healthy-pill"><i/> Online</span></div><div className="gateway-summary"><span className="gateway-art"><Icon name="router" size={21}/><i/></span><div className="gateway-summary-copy"><strong>RIG-01</strong><span>Raspberry Pi · Home</span></div><button className="arrow-button" onClick={() => setTab("Devices")} aria-label="View gateway"><Icon name="chevron" size={17}/></button></div><div className="gateway-foot"><span><Icon name="signal" size={14}/> Strong connection</span><span>Updated just now</span></div></section></div>

          <div className="privacy-banner"><span className="privacy-icon"><Icon name="shield" size={18}/></span><div><strong>Your network stays yours.</strong><p>This is a visual preview. No VPN tunnel is created and no traffic leaves this page.</p></div><button onClick={() => setTab("Settings")}>Privacy details <Icon name="arrow" size={14}/></button></div>
          <p className="prototype-disclaimer">RIG APP PREVIEW <span>·</span> Sample gateway data is shown for demonstration.</p>
        </div>}

        {tab === "Devices" && <div className="page-content secondary-content"><div className="welcome-row"><div><p className="kicker">YOUR HARDWARE</p><h1>Your gateways<span>.</span></h1><p className="welcome-subtitle">Manage the devices connected to your home network.</p></div><button className="add-gateway-button" onClick={() => { setPairingOpen(true); setMessage(""); }}><Icon name="plus" size={17}/><span>Add gateway</span></button></div><section className="section-card device-page-card"><div className="gateway-art large"><Icon name="router" size={26}/><i/></div><div className="device-page-info"><span className="healthy-pill"><i/> Online · Demo</span><h2>Home gateway</h2><p>RIG-01 · Raspberry Pi</p><div className="device-tags"><span>Home network</span><span>Connected to Wi-Fi</span><span>Last seen just now</span></div></div><button className="arrow-button" onClick={() => setTab("Home")} aria-label="Back to dashboard"><Icon name="chevron" size={18}/></button></section><div className="privacy-banner"><span className="privacy-icon"><Icon name="lock" size={18}/></span><div><strong>Not your gateway yet?</strong><p>Pairing is a UI preview. Real device setup will be added with the RIG service.</p></div><button onClick={() => setPairingOpen(true)}>Pair device <Icon name="arrow" size={14}/></button></div></div>}

        {tab === "Activity" && <div className="page-content secondary-content"><div className="welcome-row"><div><p className="kicker">CONNECTION HISTORY</p><h1>Your activity<span>.</span></h1><p className="welcome-subtitle">A simple view of your recent RIG sessions.</p></div></div><section className="section-card activity-card"><span className="empty-art"><Icon name="clock" size={24}/></span><h2>No sessions yet</h2><p>{connected ? `Your current demo session began ${duration} ago.` : "When you connect to your home gateway, your sessions will appear here."}</p>{connected && <div className="activity-row"><span className="activity-dot"/><div><strong>Connected to Home</strong><small>Demo session · In progress</small></div><span className="activity-time">{duration}</span></div>}</section><p className="prototype-disclaimer">Activity is stored locally for this preview only.</p></div>}

        {tab === "Settings" && <div className="page-content secondary-content"><div className="welcome-row"><div><p className="kicker">YOUR PREFERENCES</p><h1>Settings<span>.</span></h1><p className="welcome-subtitle">Make RIG work the way you want.</p></div></div><section className="section-card settings-list"><div className="setting-item"><span className="setting-icon"><Icon name="lock" size={17}/></span><div><strong>Network lock</strong><p>Block traffic if the connection drops.</p></div><button className={`switch ${networkLock ? "on" : ""}`} role="switch" aria-checked={networkLock} aria-label="Network lock" onClick={() => setNetworkLock(!networkLock)}><i/></button></div><div className="setting-item"><span className="setting-icon"><Icon name="globe" size={17}/></span><div className="setting-text"><strong>Default route</strong><p>Choose the default traffic mode.</p></div><div className="segmented"><button className={mode === "all" ? "current" : ""} onClick={() => setMode("all")}>All internet</button><button className={mode === "home" ? "current" : ""} onClick={() => setMode("home")}>Home only</button></div></div><div className="setting-item"><span className="setting-icon"><Icon name="shield" size={17}/></span><div><strong>Privacy</strong><p>No traffic is routed or collected in this preview.</p></div><span className="privacy-status"><Icon name="check" size={14}/> Preview safe</span></div></section><p className="prototype-disclaimer">Account, subscription, and notification settings will be connected to the RIG backend later.</p></div>}
      </section>

      <nav className="mobile-nav" aria-label="Bottom navigation">{tabs.map(({ name, icon }) => <button key={name} className={tab === name ? "active" : ""} onClick={() => setTab(name)} aria-current={tab === name ? "page" : undefined}><Icon name={icon} size={19}/><span>{name}</span></button>)}</nav>
      {notice && <div className="toast" role="status"><Icon name="check" size={16}/>{notice}</div>}
      {pairingOpen && <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPairingOpen(false); }}><section className="pair-dialog" role="dialog" aria-modal="true" aria-labelledby="pair-title"><button className="dialog-close" onClick={() => setPairingOpen(false)} aria-label="Close dialog"><Icon name="close" size={18}/></button><span className="dialog-mark"><Icon name="router" size={22}/></span><p className="kicker">ADD A GATEWAY</p><h2 id="pair-title">Bring your home online.</h2><p className="dialog-description">Enter the one-time setup code from your RIG gateway to pair it with your account.</p><form onSubmit={addGateway}><label htmlFor="pair-code">Setup code</label><input id="pair-code" value={pairCode} onChange={(event) => { setPairCode(event.target.value); setMessage(""); }} placeholder="e.g. RIG-7K2P" autoFocus/><button className="connect-cta dialog-submit" type="submit">Continue <Icon name="arrow" size={15}/></button></form>{message && <p className="dialog-message" role="status">{message}</p>}<div className="dialog-foot"><Icon name="lock" size={13}/> Preview only · your code is not sent or stored</div></section></div>}
    </main>
  );
}
