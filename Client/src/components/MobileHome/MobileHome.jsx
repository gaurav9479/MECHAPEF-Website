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
import MobileSponsors from './MobileSponsors';
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
      const banners = items.filter(n => n.isActive && (n.bannerURL || n.targetType === 'Event'));
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
      const mk = (prefix, label) =>
        Array.from({ length: 10 }, (_, i) => {
          const img = map[`${prefix}_${i + 1}`];
          return img ? {
            name: img.name,
            regNo: img.regNo,
            imageURL: img.imageURL
          } : { name: `Member ${i + 1}`, regNo: label };
        });
      
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
      <MobileSponsors sponsors={sponsors} navigate={navigate} />
      <MobileCTA navigate={navigate} />
    </div>
  );
};

export default MobileHome;
