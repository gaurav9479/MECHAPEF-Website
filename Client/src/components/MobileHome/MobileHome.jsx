import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { apiGetCached } from '../../utils/apiCache';
import HeroTicker from '../HeroTicker/HeroTicker';
import PastEventsStack from '../PastEventsStack/PastEventsStack';
import './MobileHome.css';
import LearningLogos from '../LearningLogos/LearningLogos';
// Extracted Subcomponents
import MobileHero from './MobileHero';
import MobileStats from './MobileStats';
import MobileAbout from './MobileAbout';
import MobileLiveEvents from './MobileLiveEvents';
import MobileTeam from './MobileTeam';
import MobileCTA from './MobileCTA';

const MobileHome = () => {
  const navigate = useNavigate();

  const [slides, setSlides]             = useState([]);
  const [sponsors, setSponsors]         = useState([]);
  const [pastSponsors, setPastSponsors] = useState([]);
  const [team, setTeam]                 = useState({ fy: [], sy: [], ty: [] });
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    let announcementsLoaded = false;
    let sponsorsLoaded = false;
    let teamLoaded = false;

    const checkLoading = () => {
      if (announcementsLoaded && sponsorsLoaded && teamLoaded) {
        setLoading(false);
      }
    };

    apiGetCached('/announcements', (data) => {
      const items   = data.data?.announcements || data.data || [];
      const banners = items.filter(n => n.isActive);
      banners.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setSlides(banners);
      announcementsLoaded = true;
      checkLoading();
    }).catch(() => {
      announcementsLoaded = true;
      checkLoading();
    });

    apiGetCached('/sponsors', (data) => {
      const all = data.data?.sponsors || data.data || [];
      setSponsors(all.filter(s => !s.isPastSponsor && s.isActive));
      setPastSponsors(all.filter(s => s.isPastSponsor));
      sponsorsLoaded = true;
      checkLoading();
    }).catch(() => {
      sponsorsLoaded = true;
      checkLoading();
    });

    apiGetCached('/upload/sections', (data) => {
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
        fy: mk('team_ty', 'Final Year'),
        sy: mk('team_sy', 'Pre-Final'),
        ty: mk('team_fy', '2nd Year'),
      });
      teamLoaded = true;
      checkLoading();
    }).catch(() => {
      teamLoaded = true;
      checkLoading();
    });
  }, []);

  if (loading) return null;

  return (
    <div className="mh-root">
      <MobileHero navigate={navigate} />
      <MobileStats />
      <MobileAbout />
      <LearningLogos />
      <PastEventsStack />
      <MobileLiveEvents slides={slides} navigate={navigate} />
      <HeroTicker />
      <MobileTeam team={team} />
      <MobileCTA navigate={navigate} />
    </div>
  );
};

export default MobileHome;
