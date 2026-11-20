import "./globals.css";

export default function Home() {
  return (
    <main className="app-shell">
      <section className="gateway-card">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">R</div>
          <div>
            <p className="eyebrow">Remote Gateway</p>
            <h1>My Home</h1>
          </div>
        </div>

        <div className="status-row">
          <span className="status-dot" />
          <span>Gateway online</span>
        </div>

        <button className="connect-button" type="button">
          <span className="power-icon" aria-hidden="true">⏻</span>
          <span>Connect</span>
        </button>

        <dl className="details">
          <div>
            <dt>Location</dt>
            <dd>Home Network</dd>
          </div>
          <div>
            <dt>IP address</dt>
            <dd>192.168.1.42</dd>
          </div>
          <div>
            <dt>Latency</dt>
            <dd>24 ms</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
