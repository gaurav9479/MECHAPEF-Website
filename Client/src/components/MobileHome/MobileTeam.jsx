import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeadingGearIcon, Reveal, GearSVG } from './MobileShared';

const MobileTeam = ({ team }) => {
  const [activeTab, setActiveTab] = useState('fy');

  const tabDefs = [
    { key: 'fy', label: 'Final Year' },
    { key: 'sy', label: 'Pre-Final'  },
    { key: 'ty', label: '2nd Year'   },
  ];

  return (
    <section className="mh-section mh-team" id="mh-team">
      <Reveal>
        <div className="mh-sec-hd">
          <span className="mh-tag">THE PEOPLE</span>
          <h2 className="mh-sec-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            OUR TEAM
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
          {(team[activeTab] || []).map((m, i) => (
            <div key={i} className="mh-team-card">
              <div className="mh-team-img">
                {m.imageURL
                  ? <img src={m.imageURL} alt={m.name} />
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
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default MobileTeam;
