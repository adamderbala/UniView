import { useState } from "react";

export default function App() {
  const [isMapView, setIsMapView] = useState(false);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* NAV */}
      <nav>
        <div className="nav-container">
          <div className="logo">
            Uni<span className="logo-red">View</span>
          </div>
          <div className="nav-links">
            <a onClick={() => scrollToSection("hero")}>Home</a>
            <a onClick={() => scrollToSection("features")}>Features</a>
            <a onClick={() => scrollToSection("dashboard")}>Dashboard</a>
            <a onClick={() => scrollToSection("footer")}>Contact</a>
            <a className="cta-button">Get Started</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              Smart Parking for{" "}
              <span className="gradient-text">Every Campus</span>
            </h1>
            <p>
              Real-time parking availability across universities nationwide.
              Find your spot in seconds, not minutes.
            </p>
            <div className="hero-buttons">
              <a
                className="primary-btn"
                onClick={() => scrollToSection("dashboard")}
              >
                View Dashboard
              </a>
              <a className="secondary-btn">Learn More</a>
            </div>
          </div>

          <div className="hero-visual">
            <div className="universities-preview">
              <div className="preview-header">
                <div className="preview-title">Available Universities</div>
                <div className="preview-subtitle">
                  Growing nationwide coverage
                </div>
              </div>

              <div className="university-mini-cards">
                <div className="mini-uni-card">
                  <div className="mini-uni-info">
                    <div className="mini-uni-icon">🎓</div>
                    <div className="mini-uni-name">Rutgers University</div>
                  </div>
                  <div className="mini-uni-badge">LIVE</div>
                </div>

                <div className="mini-uni-card">
                  <div className="mini-uni-info">
                    <div className="mini-uni-icon">🎯</div>
                    <div className="mini-uni-name">
                      Princeton University
                    </div>
                  </div>
                  <div className="mini-uni-badge">SOON</div>
                </div>

                <div className="mini-uni-card">
                  <div className="mini-uni-info">
                    <div className="mini-uni-icon">🏛️</div>
                    <div className="mini-uni-name">NJIT</div>
                  </div>
                  <div className="mini-uni-badge">SOON</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="features-container">
          <div className="section-header">
            <div className="section-tag">FEATURES</div>
            <h2 className="section-title">Why Choose UniView?</h2>
            <p className="section-description">
              Cutting-edge technology meets intuitive design to revolutionize
              campus parking.
            </p>
          </div>

          <div className="features-grid">
            {[
              ["⚡", "Real-Time Updates", "Live parking data refreshed every 30 seconds."],
              ["🗺️", "Interactive Maps", "Detailed campus maps with precise lot locations."],
              ["📱", "Mobile First", "Fully responsive on any device."],
              ["🎯", "Smart Search", "Instantly find specific lots."],
              ["📊", "Analytics", "Historical trends to plan ahead."],
              ["🔐", "Secure & Private", "Enterprise-grade security."]
            ].map(([icon, title, desc]) => (
              <div className="feature-card" key={title}>
                <span className="feature-icon">{icon}</span>
                <h3 className="feature-title">{title}</h3>
                <p className="feature-description">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD */}
      <section className="dashboard-section" id="dashboard">
        <div className="dashboard-container">
          <div className="section-header">
            <div className="section-tag">LIVE DASHBOARD</div>
            <h2 className="section-title">Find Your Parking Now</h2>
            <p className="section-description">
              Select your university and browse real-time parking availability.
            </p>
          </div>

          <div className="dashboard-app">
            <div className="app-header">
              <div className="app-title">Parking Dashboard</div>
              <div className="view-toggle">
                <button
                  className={!isMapView ? "active" : ""}
                  onClick={() => setIsMapView(false)}
                >
                  Browse
                </button>
                <button
                  className={isMapView ? "active" : ""}
                  onClick={() => setIsMapView(true)}
                >
                  Map View
                </button>
              </div>
            </div>

            {!isMapView && (
              <div className="university-view active">
                <div className="university-grid">
                  {/* Rutgers */}
                  <div className="university-card">
                    <div className="university-icon">🎓</div>
                    <div className="university-name">Rutgers University</div>
                    <div className="university-location">
                      New Brunswick, NJ
                    </div>
                    <div className="university-badge">Available Now</div>
                  </div>

                  {/* Princeton */}
                  <div
                    className="university-card"
                    style={{ opacity: 0.6, cursor: "not-allowed" }}
                  >
                    <div className="university-icon">🎯</div>
                    <div className="university-name">
                      Princeton University
                    </div>
                    <div className="university-location">Princeton, NJ</div>
                    <div
                      className="university-badge"
                      style={{ background: "#e0e0e0", color: "#666" }}
                    >
                      Coming Soon
                    </div>
                  </div>

                  {/* NJIT */}
                  <div
                    className="university-card"
                    style={{ opacity: 0.6, cursor: "not-allowed" }}
                  >
                    <div className="university-icon">🏛️</div>
                    <div className="university-name">NJIT</div>
                    <div className="university-location">Newark, NJ</div>
                    <div
                      className="university-badge"
                      style={{ background: "#e0e0e0", color: "#666" }}
                    >
                      Coming Soon
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isMapView && (
              <div className="map-view active">
                <div id="map" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="footer">
        <div className="footer-bottom">
          © 2026 UniView. All rights reserved.
        </div>
      </footer>
    </>
  );
}
