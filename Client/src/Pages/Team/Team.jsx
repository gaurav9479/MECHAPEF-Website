import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaUserGraduate, FaUsers, FaCog, FaChevronRight } from 'react-icons/fa';
import TopNavbar from '../../components/Navbar/TopNavbar';
import Footer from '../../components/Footer/Footer';
import { apiGetCached } from '../../utils/apiCache';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import './Team.css';

const TeamCard = ({ member, index, fallbackRole, specialSponsor }) => {
  return (
    <motion.div
      className="team-page-card"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: 'easeOut' }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
    >
      {/* Corner Bracket Accents */}
      <span className="card-bracket bracket-tl" />
      <span className="card-bracket bracket-tr" />
      <span className="card-bracket bracket-bl" />
      <span className="card-bracket bracket-br" />

      {/* Special Sponsor Logo Badge */}
      {specialSponsor?.logoURL && specialSponsor?.showTeamCardsLogo !== false && (
        <div className="card-sponsor-tag">
          <img 
            src={getOptimizedImageUrl(specialSponsor.logoURL)} 
            alt={specialSponsor.name} 
          />
        </div>
      )}

      <div className={`card-image-wrapper ${member.category === 'team_fy' || member.category === 'team_sy' ? 'ratio-square' : 'ratio-portrait'}`}>
        {member.url ? (
          <img
            src={getOptimizedImageUrl(member.url)}
            alt={member.name}
            className="card-profile-img"
            loading="lazy"
          />
        ) : (
          <div className="card-profile-placeholder">
            <FaCog className="gear-spin-placeholder" />
            <span>IMAGE PENDING</span>
          </div>
        )}
      </div>

      {/* Tech Info Panel */}
      <div className="card-details">
        <h3 className="card-member-name">{member.name || 'Team Member'}</h3>
        <div className="card-role-band">
          <span className="tech-indicator"></span>
          <span className="card-member-role">{member.regNo || fallbackRole}</span>
        </div>
      </div>
    </motion.div>
  );
};

const Team = () => {
  const [imagesMap, setImagesMap] = useState({});
  const [specialSponsor, setSpecialSponsor] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Search states
  const [activeTab, setActiveTab] = useState('team_al'); // 'team_al', 'team_ty', 'team_sy', 'team_fy'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTeamData = () => {
    setLoading(true);
    apiGetCached('/upload/sections?device=desktop', (data) => {
      const imgMap = {};
      if (data.data?.images) {
        data.data.images.forEach(img => {
          imgMap[img.sectionKey] = {
            url: img.imageURL,
            name: img.name,
            regNo: img.regNo,
            order: img.order,
          };
        });
      }
      setImagesMap(imgMap);
      setLoading(false);
    }, { cacheDuration: 2 * 60 * 60 * 1000 }).catch(error => {
      console.error('Failed to load section images:', error);
      setLoading(false);
    });

    apiGetCached('/special-sponsor/active', (data) => {
      if (data?.data) setSpecialSponsor(data.data);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchTeamData();
    window.scrollTo(0, 0);
  }, []);

  const tabDefs = [
    { key: 'team_al', label: 'Alumni Network', icon: <FaUserGraduate /> },
    { key: 'team_ty', label: 'Final Year', icon: <FaUserGraduate /> },
    { key: 'team_sy', label: 'Pre-Final', icon: <FaCog /> },
    { key: 'team_fy', label: '2nd Year', icon: <FaCog /> },
  ];

  const fallbackMap = {
    team_fy: 'Junior Member',
    team_sy: 'Core Member',
    team_ty: 'Senior Member',
    team_al: 'Notable Alumni',
  };

  // Helper to extract and sort members for a prefix
  const getSortedMembers = (prefix) => {
    return Object.keys(imagesMap)
      .filter(k => k.startsWith(prefix + '_') && imagesMap[k].url)
      .sort((a, b) => {
        const defaultOrderA = parseInt(a.replace(prefix + '_', '')) || 0;
        const defaultOrderB = parseInt(b.replace(prefix + '_', '')) || 0;
        const orderA = imagesMap[a].order || defaultOrderA;
        const orderB = imagesMap[b].order || defaultOrderB;
        if (orderA !== orderB) return orderA - orderB;
        return defaultOrderA - defaultOrderB;
      })
      .map(key => ({
        ...imagesMap[key],
        category: prefix,
        fallbackRole: fallbackMap[prefix] || 'Member'
      }));
  };

  // Build full list of active members
  const allSeniors = getSortedMembers('team_ty');
  const allPreFinals = getSortedMembers('team_sy');
  const allSophomores = getSortedMembers('team_fy');
  const allAlumni = getSortedMembers('team_al');

  const getFilteredList = () => {
    const baseList = getSortedMembers(activeTab);

    if (!searchQuery.trim()) return baseList;

    const query = searchQuery.toLowerCase();
    return baseList.filter(m => 
      (m.name && m.name.toLowerCase().includes(query)) ||
      (m.regNo && m.regNo.toLowerCase().includes(query)) ||
      (m.fallbackRole && m.fallbackRole.toLowerCase().includes(query))
    );
  };

  const filteredMembers = getFilteredList();

  // Helper to get category count badge
  const getCount = (tabKey) => {
    return getSortedMembers(tabKey).length;
  };

  return (
    <div className="team-page-root">
      <TopNavbar />

      {/* Premium Tech Parallax Background */}
      <div className="team-bg-grid" />
      <div className="team-ambient-glow" />
      
      {/* Decorative Rotating Mechanical Gears */}
      <div className="gear-bg-layer">
        <svg className="bg-gear bg-gear-1" viewBox="0 0 100 100">
          <path fill="none" stroke="rgba(255, 31, 1, 0.03)" strokeWidth="1.5" d="M50,30 A20,20 0 1,1 50,70 A20,20 0 1,1 50,30 M50,15 L50,25 M50,75 L50,85 M15,50 L25,50 M75,50 L85,50 M25,25 L32,32 M68,68 L75,75 M25,75 L32,68 M68,32 L75,25" />
        </svg>
        <svg className="bg-gear bg-gear-2" viewBox="0 0 100 100">
          <path fill="none" stroke="rgba(255, 31, 1, 0.02)" strokeWidth="1.2" d="M50,35 A15,15 0 1,1 50,65 A15,15 0 1,1 50,35 M50,20 L50,28 M50,72 L50,80 M20,50 L28,50 M72,50 L80,50" />
        </svg>
      </div>

      <div className="team-page-container">
        
        {/* Futuristic Section Header */}
        <div className="team-page-header">
          <div className="header-eyebrow">
            <span className="accent-bar"></span>
            <span>MECHAPEF CREW DIRECTORY</span>
          </div>
          
          <h1 className="header-title">
            Meet the <span>Engineers</span>
            {specialSponsor?.logoURL && (
              <span className="header-co-brand">
                <span className="cross-symbol" style={{ color: specialSponsor?.brandColor || '#ff1f01' }}>×</span>
                <img src={getOptimizedImageUrl(specialSponsor.logoURL)} alt={specialSponsor.name} />
              </span>
            )}
          </h1>
          <p className="header-desc">
            The core coordinators, dynamic creators, and legacy holders of the MECHAPEF society.
          </p>
        </div>

        {/* Filters and Search Dashboard Panel */}
        <div className="filter-dashboard">
          
          {/* Futuristic Search bar */}
          <div className="search-box-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search member by name, role or reg no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>

          {/* Premium Selector Tabs */}
          <div className="tab-menu-scroller">
            <div className="tab-menu-track">
              {tabDefs.map((tab) => {
                const count = getCount(tab.key);
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`tab-menu-btn ${activeTab === tab.key ? 'active' : ''}`}
                  >
                    <span className="tab-btn-icon">{tab.icon}</span>
                    <span className="tab-btn-label">{tab.label}</span>
                    <span className="tab-btn-badge">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Staggered Grid Presentation */}
        <div className="members-grid-wrapper">
          {loading ? (
            <div className="team-loading-state">
              <FaCog className="loading-gear-spin" />
              <p>Loading Team...</p>
            </div>
          ) : filteredMembers.length > 0 ? (
            <motion.div layout className="members-grid">
              <AnimatePresence mode="popLayout">
                {filteredMembers.map((member, idx) => (
                  <TeamCard
                    key={member.url + idx}
                    member={member}
                    index={idx}
                    fallbackRole={member.fallbackRole}
                    specialSponsor={specialSponsor}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="no-results-panel"
            >
              <FaCog className="dead-gear-icon" />
              <h3>No Engineers Found</h3>
              <p>No matches found for "{searchQuery}". Try modifying your query.</p>
            </motion.div>
          )}
        </div>

      </div>

      <Footer />
    </div>
  );
};

export default Team;
