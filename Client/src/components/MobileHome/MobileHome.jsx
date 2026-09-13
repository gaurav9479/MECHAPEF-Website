import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { apiGetCached } from '../../utils/apiCache';
import HeroTicker from '../HeroTicker/HeroTicker';
import PastEventsStack from '../PastEventsStack/PastEventsStack';
import './MobileHome.css';
import LearningLogos from '../LearningLogos/LearningLogos';
import MobileHero from './MobileHero';
import MobileStats from './MobileStats';
import MobileAbout from './MobileAbout';
import MobileLiveEvents from './MobileLiveEvents';
import PremiumSponsorPanel from '../LiveEventsSlider/PremiumSponsorPanel';
import MobileDepartmentStack from './MobileDepartmentStack';
import MobileTeam from './MobileTeam';
import MobileSponsors from './MobileSponsors';
import MobileCTA from './MobileCTA';

const MobileHome = () => {
  const navigate = useNavigate();

  const [slides, setSlides]             = useState([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  const [deptImages, setDeptImages]     = useState([]);
  const [team, setTeam]                 = useState({ fy: [], sy: [], ty: [] });
  const [sponsors, setSponsors]         = useState([]);

  useEffect(() => {

    apiGetCached('/past-events', () => {}).catch(() => {});


    apiGetCached('/announcements', (data) => {
      const items   = data.data?.announcements || data.data || [];
      const banners = items.filter(n => n.isActive);
      banners.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setSlides(banners);
    }, { cacheDuration: 2 * 60 * 1000 }).catch(() => {});


    apiGetCached('/sponsors', (data) => {
      const all = data.data?.sponsors || data.data || [];
      setSponsors(all);
    }).catch(() => {});


    apiGetCached('/upload/sections?device=mobile', (data) => {
      const map = {};
      (data.data?.images || []).forEach(img => { map[img.sectionKey] = img; });

      const mk = (prefix, label) => {
        return Object.keys(map)
          .filter(k => k.startsWith(prefix + '_') && map[k].imageURL)
          .sort((a, b) => {
            const defaultOrderA = parseInt(a.replace(prefix + '_', ''));
            const defaultOrderB = parseInt(b.replace(prefix + '_', ''));
            const orderA = map[a].order || defaultOrderA;
            const orderB = map[b].order || defaultOrderB;
            if (orderA !== orderB) return orderA - orderB;
            return defaultOrderA - defaultOrderB;
          })
          .map(k => {
            const img = map[k];
            return {
              name: img.name || `Member`,
              regNo: img.regNo || label,
              imageURL: img.imageURL
            };
          });
      };
      
      setTeam({
        al: mk('team_al', 'Notable Alumni'),
        fy: mk('team_ty', 'Final Year'),
        sy: mk('team_sy', 'Pre-Final'),
        ty: mk('team_fy', '2nd Year'),
      });

      const dImgs = Object.keys(map)
        .filter(k => k.startsWith('dept_') && k.endsWith('_mob') && map[k].imageURL)
        .sort((a, b) => {
          const numA = parseInt(a.replace('dept_', '').replace('_mob', '')) || 0;
          const numB = parseInt(b.replace('dept_', '').replace('_mob', '')) || 0;
          return numA - numB;
        })
        .map(k => map[k].imageURL);
        
      setDeptImages(dImgs);
    }, { cacheDuration: 0 }).catch(() => {});
  }, []);

  return (
    <div className="mh-root">
      <MobileHero navigate={navigate} />
      <MobileStats />
      <MobileAbout />
      {/* <LearningLogos /> */}
      <PastEventsStack />
      <MobileLiveEvents slides={slides} navigate={navigate} onActiveSlideChange={setActiveAnnouncement} />
      <HeroTicker />
      
      {activeAnnouncement?.targetType === 'Event' && activeAnnouncement?.eventSponsors?.length > 0 && (
        <div className="active-event-sponsors-section" style={{ padding: '20px 10px', backgroundColor: '#050505', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', overflow: 'hidden', marginBottom: '20px' }}>
          <h3 style={{ color: '#ff1f01', fontSize: '1rem', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>Event Endorsed Sponsors</h3>
          <div className="sponsors-chain-wrapper" style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div className="event-sponsors-horizontal-scroll" style={{ 
              display: 'flex', 
              gap: '15px', 
              overflowX: 'auto', 
              overflowY: 'hidden',
              padding: '5px 10px', 
              width: '100%', 
              scrollSnapType: 'x mandatory',
              zIndex: 1,
            }}>
              <div style={{ margin: 'auto' }} />
              {activeAnnouncement.eventSponsors.map((sp, idx) => (
                <div key={idx} style={{ flex: '0 0 auto', scrollSnapAlign: 'center', transform: 'scale(0.9)' }}>
                  <PremiumSponsorPanel sponsor={sp} />
                </div>
              ))}
              <div style={{ margin: 'auto' }} />
            </div>
          </div>
        </div>
      )}

      <MobileDepartmentStack images={deptImages} />
      <MobileSponsors sponsors={sponsors} navigate={navigate} />
      <MobileTeam team={team} />
      <MobileCTA navigate={navigate} />
    </div>
  );
};

export default MobileHome;
