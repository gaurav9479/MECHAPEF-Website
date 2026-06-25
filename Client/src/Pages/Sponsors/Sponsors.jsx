import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaArrowRight,
  FaBullhorn,
  FaEnvelope,
  FaHandshake,
  FaLayerGroup,
  FaMedal,
  FaUsers,
} from 'react-icons/fa';
import * as FaIcons from 'react-icons/fa';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { sponsorService, sponsorConfigService } from '../../services/services';
import './Sponsors.css';

const fallbackSponsors = [
  {
    _id: 'platinum-1',
    companyName: 'Industry Partner',
    tier: 'Platinum',
    description: 'Flagship collaboration partner supporting innovation, workshops, and student-led engineering initiatives.',
  },
  {
    _id: 'gold-1',
    companyName: 'Tech Partner',
    tier: 'Gold',
    description: 'Supporting flagship events, technical sessions, and community outreach.',
  },
  {
    _id: 'silver-1',
    companyName: 'Community Partner',
    tier: 'Silver',
    description: 'Helping MechaPEF create stronger student experiences across the department.',
  },
];

const DynamicIcon = ({ name }) => {
  const IconComponent = FaIcons[name] || FaIcons.FaMedal;
  return <IconComponent />;
};

const SponsorLogo = ({ sponsor }) => {
  const initials = sponsor.companyName
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  const content = sponsor.logoURL && !sponsor.logoURL.includes('placeholder.com') ? (
    <img
      src={sponsor.logoURL}
      alt={`${sponsor.companyName} logo`}
      onError={e => { e.target.style.display='none'; e.target.nextSibling && (e.target.nextSibling.style.display='flex'); }}
    />
  ) : (
    <span>{initials || 'MP'}</span>
  );

  if (sponsor.websiteURL) {
    return (
      <a className="sponsor-logo-card" href={sponsor.websiteURL} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return <div className="sponsor-logo-card">{content}</div>;
};

const SponsorCard = ({ sponsor, index }) => (
  <motion.article
    className={`sponsor-card tier-${(sponsor.tier || '').toLowerCase()}`}
    initial={{ opacity: 0, y: 22 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.25 }}
    transition={{ duration: 0.45, delay: index * 0.06 }}
  >
    <div className="sponsor-card-logo">
      {sponsor.logoURL && !sponsor.logoURL.includes('placeholder.com') ? (
        <img
          src={sponsor.logoURL}
          alt={`${sponsor.companyName} logo`}
          onError={e => { e.target.style.display='none'; e.target.nextSibling && (e.target.nextSibling.style.display='flex'); }}
        />
      ) : (
        <span>{sponsor.companyName?.charAt(0) || 'M'}</span>
      )}
    </div>
    <div>
      <p className="sponsor-tier">{sponsor.tier}</p>
      <h3>{sponsor.companyName}</h3>
      {sponsor.description && <p className="sponsor-desc">{sponsor.description}</p>}
    </div>
  </motion.article>
);

const Sponsors = () => {
  const [sponsors, setSponsors] = useState([]);
  const [config, setConfig] = useState({ tiers: [], deliverables: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    Promise.all([
      sponsorService.getAll(),
      sponsorConfigService.getConfig()
    ]).then(([sponsorsRes, configRes]) => {
      const data = sponsorsRes.data.data?.sponsors || sponsorsRes.data.data || [];
      const activeSponsors = data
        .filter(sponsor => sponsor.isActive !== false || sponsor.isPastSponsor)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setSponsors(activeSponsors);
      
      const configData = configRes.data.data || { tiers: [], deliverables: [] };
      configData.tiers.sort((a, b) => a.order - b.order);
      configData.deliverables.sort((a, b) => a.order - b.order);
      setConfig(configData);
    })
    .catch(() => setSponsors([]))
    .finally(() => setLoading(false));
  }, []);

  const visibleSponsors = sponsors.length > 0 ? sponsors : fallbackSponsors;
  const currentSponsors = visibleSponsors.filter(s => !s.isPastSponsor);
  const pastSponsors = visibleSponsors.filter(s => s.isPastSponsor);
  
  const sponsorsByTier = useMemo(() => {
    const grouped = {};
    config.tiers.forEach(t => { grouped[t.name] = []; });
    currentSponsors.forEach(sponsor => {
      const t = sponsor.tier || 'Silver';
      if (!grouped[t]) grouped[t] = [];
      grouped[t].push(sponsor);
    });
    return grouped;
  }, [currentSponsors, config]);

  return (
    <div className="sponsors-page">
      <Navbar />

      <main>
        <section className="sponsors-hero">
          <motion.div
            className="sponsors-hero-content"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="sponsor-eyebrow">
              <span></span> Partnerships
            </div>
            <h1>Our Sponsors</h1>
            <p>
              Partners who help MechaPEF build sharper events, stronger communities, and better engineering experiences for MNNIT students.
            </p>
            <a className="sponsor-primary-btn" href="mailto:mechapef@mnnit.ac.in">
              Become a Sponsor <FaArrowRight />
            </a>
          </motion.div>
        </section>

        <section className="sponsor-showcase">
          <div className="sponsor-section-header">
            <p>Showcase</p>
            <h2>Sponsor Logo Grid</h2>
          </div>
          {loading ? (
            <div className="sponsor-loading">Loading sponsors...</div>
          ) : (
            <div className="sponsor-logo-grid">
              {currentSponsors.map(sponsor => (
                <SponsorLogo key={sponsor._id || sponsor.companyName} sponsor={sponsor} />
              ))}
            </div>
          )}
        </section>

        {config.tiers.map((tierConfig) => {
          const tier = tierConfig.name;
          const tierSponsors = sponsorsByTier[tier] || [];
          return (
            <section className="sponsor-tier-section" key={tier}>
              <div className="sponsor-section-header tier-header">
                <div className="tier-icon"><DynamicIcon name={tierConfig.icon} /></div>
                <div>
                  <p>{tier} Sponsors</p>
                  <h2>{tierConfig.description}</h2>
                </div>
              </div>
              <div className="sponsor-card-grid">
                {tierSponsors.length > 0 ? (
                  tierSponsors.map((sponsor, index) => (
                    <SponsorCard key={sponsor._id || sponsor.companyName} sponsor={sponsor} index={index} />
                  ))
                ) : (
                  <div className="sponsor-empty-card">Partnership slots are open for this tier.</div>
                )}
              </div>
            </section>
          );
        })}

        {pastSponsors.length > 0 && (
          <section className="sponsor-tier-section" style={{ marginTop: '40px' }}>
            <div className="sponsor-section-header tier-header">
              <div className="tier-icon"><DynamicIcon name="FaHistory" /></div>
              <div>
                <p>Past Partners</p>
                <h2>Our Legacy Sponsors</h2>
              </div>
            </div>
            <div className="sponsor-card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {pastSponsors.map((sponsor, index) => (
                <SponsorCard key={sponsor._id || sponsor.companyName} sponsor={sponsor} index={index} />
              ))}
            </div>
          </section>
        )}

        <section className="sponsor-benefits">
          <div className="sponsor-section-header">
            <p>Partnership Benefits</p>
            <h2>Why Partner With MechaPEF</h2>
          </div>
          <div className="benefits-grid">
            {config.deliverables.map((benefit, index) => {
              return (
                <motion.div
                  className="benefit-card"
                  key={benefit.title}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                >
                  <DynamicIcon name={benefit.icon} />
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="sponsor-cta-section">
          <div className="sponsor-cta">
            <div>
              <p>Become a Sponsor</p>
              <h2>Build the next chapter of engineering culture with us.</h2>
            </div>
            <a className="sponsor-primary-btn" href="mailto:mechapef@mnnit.ac.in">
              Start Partnership <FaArrowRight />
            </a>
          </div>
        </section>

        <section className="sponsor-contact">
          <div className="contact-card">
            <FaEnvelope />
            <div>
              <p>Contact Information</p>
              <h2>mechapef@mnnit.ac.in</h2>
              <span>MechaPEF, Mechanical and Production Engineering, MNNIT Allahabad</span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Sponsors;
