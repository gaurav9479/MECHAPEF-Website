import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './OurTeam.css';

const OurTeam = () => {
  const cards = Array.from({ length: 10 }, (_, i) => i + 1);
  const [imagesMap, setImagesMap] = useState({});

  const fetchSectionImages = async () => {
    try {
      const res = await api.get('/upload/sections');
      const imgMap = {};
      if (res.data.data?.images) {
        res.data.data.images.forEach(img => {
          imgMap[img.sectionKey] = {
            url: img.imageURL,
            name: img.name,
            regNo: img.regNo
          };
        });
      }
      setImagesMap(imgMap);
    } catch (error) {
      console.error("Failed to load section images:", error);
    }
  };

  useEffect(() => {
    fetchSectionImages();
  }, []);

  return (
    <section id="our-team" className="our-team-section">
      <h1 className="team-heading">OUR TEAM</h1>
      
      <div className="team-scroll-container">
        {/* Layer 1: Final Year Seniors */}
        <div className="team-layer">
          <h3 className="layer-title">Final Year Seniors</h3>
          <div className="layer-track">
            {cards.map(num => {
              const data = imagesMap[`team_fy_${num}`];
              return (
                <div key={`fy-${num}`} className="team-card">
                  <div className="card-img-placeholder" style={{ overflow: 'hidden' }}>
                    {data?.url ? (
                      <img src={data.url} alt={`Senior ${num}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span className="placeholder-text" style={{ fontSize: '1.2rem', color: '#555' }}>Image {num}</span>
                    )}
                  </div>
                  <div className="card-info">
                    <h4>{data?.name || `Name ${num}`}</h4>
                    <p>{data?.regNo || 'Senior Member'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Layer 2: Pre-final Year */}
        <div className="team-layer">
          <h3 className="layer-title">Pre-final Year</h3>
          <div className="layer-track">
            {cards.map(num => {
              const data = imagesMap[`team_sy_${num}`]; // sy maps to second level
              return (
                <div key={`sy-${num}`} className="team-card">
                  <div className="card-img-placeholder" style={{ overflow: 'hidden' }}>
                    {data?.url ? (
                      <img src={data.url} alt={`Core ${num}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span className="placeholder-text" style={{ fontSize: '1.2rem', color: '#555' }}>Image {num}</span>
                    )}
                  </div>
                  <div className="card-info">
                    <h4>{data?.name || `Name ${num}`}</h4>
                    <p>{data?.regNo || 'Core Member'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Layer 3: Second Year */}
        <div className="team-layer">
          <h3 className="layer-title">Second Year</h3>
          <div className="layer-track">
            {cards.map(num => {
              const data = imagesMap[`team_ty_${num}`]; // ty maps to third level
              return (
                <div key={`ty-${num}`} className="team-card">
                  <div className="card-img-placeholder" style={{ overflow: 'hidden' }}>
                    {data?.url ? (
                      <img src={data.url} alt={`Junior ${num}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span className="placeholder-text" style={{ fontSize: '1.2rem', color: '#555' }}>Image {num}</span>
                    )}
                  </div>
                  <div className="card-info">
                    <h4>{data?.name || `Name ${num}`}</h4>
                    <p>{data?.regNo || 'Junior Member'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OurTeam;
