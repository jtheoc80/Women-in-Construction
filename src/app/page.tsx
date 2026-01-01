export default function Home() {
  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>Women in Construction</h1>
          <p style={styles.subtitle}>Find Your Perfect Roommate</p>
        </header>

        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h2 style={styles.heroTitle}>
              Building Connections, One Room at a Time
            </h2>
            <p style={styles.heroText}>
              A trusted community platform designed exclusively for women in the 
              construction industry to find compatible roommates. Whether you&apos;re 
              relocating for a new project or looking for long-term housing, 
              we&apos;ve got you covered.
            </p>
            <div style={styles.buttonGroup}>
              <button style={styles.primaryButton}>Find a Roommate</button>
              <button style={styles.secondaryButton}>Post a Listing</button>
            </div>
          </div>
        </section>

        <section style={styles.features}>
          <h3 style={styles.featuresTitle}>Why Choose Us?</h3>
          <div style={styles.featureGrid}>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🏗️</div>
              <h4 style={styles.featureCardTitle}>Industry-Focused</h4>
              <p style={styles.featureCardText}>
                Connect with women who understand your schedule and lifestyle in construction.
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🔒</div>
              <h4 style={styles.featureCardTitle}>Safe & Verified</h4>
              <p style={styles.featureCardText}>
                All members are verified to ensure a safe community experience.
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>📍</div>
              <h4 style={styles.featureCardTitle}>Location-Based</h4>
              <p style={styles.featureCardText}>
                Find roommates near your job site or preferred neighborhood.
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>💬</div>
              <h4 style={styles.featureCardTitle}>Easy Communication</h4>
              <p style={styles.featureCardText}>
                Send intro requests and connect when both parties are interested.
              </p>
            </div>
          </div>
        </section>

        <section style={styles.cta}>
          <h3 style={styles.ctaTitle}>Ready to Find Your Roommate?</h3>
          <p style={styles.ctaText}>
            Join hundreds of women in construction who have found their perfect living situation.
          </p>
          <button style={styles.ctaButton}>Get Started Today</button>
        </section>

        <footer style={styles.footer}>
          <p>© 2026 Women in Construction. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    minHeight: '100vh',
    padding: '20px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    padding: '40px 20px',
    color: 'white',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 700,
    marginBottom: '10px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
  },
  subtitle: {
    fontSize: '1.5rem',
    opacity: 0.9,
  },
  hero: {
    background: 'white',
    borderRadius: '20px',
    padding: '60px 40px',
    marginBottom: '40px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: '2.5rem',
    color: '#333',
    marginBottom: '20px',
    lineHeight: 1.3,
  },
  heroText: {
    fontSize: '1.2rem',
    color: '#666',
    lineHeight: 1.8,
    marginBottom: '30px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '15px 40px',
    fontSize: '1.1rem',
    borderRadius: '50px',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  secondaryButton: {
    background: 'transparent',
    color: '#667eea',
    border: '2px solid #667eea',
    padding: '15px 40px',
    fontSize: '1.1rem',
    borderRadius: '50px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  features: {
    padding: '40px 0',
  },
  featuresTitle: {
    textAlign: 'center',
    color: 'white',
    fontSize: '2rem',
    marginBottom: '40px',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '25px',
  },
  featureCard: {
    background: 'white',
    borderRadius: '15px',
    padding: '30px',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  },
  featureIcon: {
    fontSize: '3rem',
    marginBottom: '15px',
  },
  featureCardTitle: {
    fontSize: '1.3rem',
    color: '#333',
    marginBottom: '10px',
  },
  featureCardText: {
    color: '#666',
    lineHeight: 1.6,
  },
  cta: {
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '20px',
    padding: '60px 40px',
    textAlign: 'center',
    margin: '40px 0',
    backdropFilter: 'blur(10px)',
  },
  ctaTitle: {
    color: 'white',
    fontSize: '2rem',
    marginBottom: '15px',
  },
  ctaText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: '1.2rem',
    marginBottom: '30px',
  },
  ctaButton: {
    background: 'white',
    color: '#667eea',
    border: 'none',
    padding: '18px 50px',
    fontSize: '1.2rem',
    borderRadius: '50px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  footer: {
    textAlign: 'center',
    padding: '30px',
    color: 'rgba(255,255,255,0.7)',
  },
}
