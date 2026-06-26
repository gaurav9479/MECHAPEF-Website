import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
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
    api.get('/announcements').then(res => {
      const items   = res.data.data?.announcements || res.data.data || [];
      const banners = items.filter(n => n.isActive && (n.bannerURL || n.targetType === 'Event'));
      banners.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setSlides(banners);
    }).catch(() => {});

    api.get('/sponsors').then(res => {
      const all = res.data.data?.sponsors || res.data.data || [];
      setSponsors(all.filter(s => !s.isPastSponsor && s.isActive));
      setPastSponsors(all.filter(s => s.isPastSponsor));
    }).catch(() => {});

    api.get('/upload/sections').then(res => {
      const map = {};
      (res.data.data?.images || []).forEach(img => { map[img.sectionKey] = img; });
      const mk = (prefix, label) =>
        Array.from({ length: 10 }, (_, i) =>
          map[`${prefix}_${i + 1}`] || { name: `Member ${i + 1}`, regNo: label });
      
      setTeam({
        fy: mk('hero_fy', 'Final Year'),
        sy: mk('hero_sy', 'Pre-Final'),
        ty: mk('hero_ty', '2nd Year'),
      });
      setLoading(false);
    }).catch(() => setLoading(false));
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
