import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeadingGearIcon, Reveal, GearSVG } from './MobileShared';
import { apiGetCached } from '../../utils/apiCache';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';

const MobileTeam = ({ team }) => {
  const [specialSponsor, setSpecialSponsor] = useState(null);
  const [activeTab, setActiveTab] = useState('al');

  useEffect(() => {
    apiGetCached('/special-sponsor/active', (data) => {
      if (data?.data) setSpecialSponsor(data.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!team[activeTab] || team[activeTab].length === 0) {
      if (team.al && team.al.length > 0) setActiveTab('al');
      else if (team.fy && team.fy.length > 0) setActiveTab('fy');
      else if (team.sy && team.sy.length > 0) setActiveTab('sy');
      else if (team.ty && team.ty.length > 0) setActiveTab('ty');
    }
  }, [team]);

  const tabDefs = [
    { key: 'al', label: 'Notable Alumni' },
    { key: 'fy', label: 'Final Year' },
    { key: 'sy', label: 'Pre-Final'  },
    { key: 'ty', label: '2nd Year'   },
  ];

  return (
    <section className="mh-section mh-team" id="mh-team">
      <Reveal>
        <div className="mh-sec-hd">
          <span className="mh-tag">THE PEOPLE</span>
          <h2 className="mh-sec-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            OUR TEAM
            {specialSponsor?.logoURL && specialSponsor?.showTeamTitleCoBranding !== false && (
              <span className="mobile-team-heading-cobrand" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '2px' }}>
                <span 
                  style={{ 
                    color: specialSponsor?.brandColor || '#ff1f01', 
                    fontWeight: '900', 
                    fontSize: '1.4rem', 
                    fontFamily: 'sans-serif',
                    lineHeight: 1 
                  }}
                >
                  ×
                </span>
                <img 
                  src={getOptimizedImageUrl(specialSponsor.logoURL)} 
                  alt={specialSponsor.name} 
                  style={{ 
                    height: '32px', 
                    maxWidth: '110px', 
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.25))'
                  }} 
                />
              </span>
            )}
            <HeadingGearIcon size={26} />
          </h2>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mh-tabs">
          {tabDefs.map(t => (
            <button key={t.key}
              className={`mh-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </Reveal>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} className="mh-team-track"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0   }}
          exit={{    opacity: 0, x: -30  }}
          transition={{ duration: 0.3 }}>
          {(team[activeTab] && team[activeTab].length > 0) ? (
            team[activeTab].map((m, i) => (
              <div key={i} className="mh-team-card" style={{ position: 'relative' }}>
                {specialSponsor?.logoURL && specialSponsor?.showTeamCardsLogo !== false && (
                  <div 
                    className="mobile-team-sponsor-badge"
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      zIndex: 10,
                      background: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(8px)',
                      padding: '3px 6px',
                      borderRadius: '16px',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(0,0,0,0.08)'
                    }}
                  >
                    <img 
                      src={getOptimizedImageUrl(specialSponsor.logoURL)} 
                      alt={specialSponsor.name} 
                      style={{ height: '16px', maxWidth: '50px', objectFit: 'contain' }} 
                    />
                  </div>
                )}
                <div className="mh-team-img">
                  {m.imageURL
                    ? <img src={getOptimizedImageUrl(m.imageURL)} alt={m.name} loading="lazy" decoding="async" />
                    : <div className="mh-team-ph">
                        <GearSVG size={38} speed={12 + (i % 6)} reverse={i % 2 === 0} />
                      </div>
                  }
                </div>
                <div className="mh-team-info">
                  <h4>{m.name || `Member ${i + 1}`}</h4>
                  <p>{m.regNo}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="mh-no-members" style={{ width: '100%', textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.5)', border: '1px solid #1a0000', borderRadius: '12px', background: '#0d0000' }}>
              No members added yet.
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default MobileTeam;
