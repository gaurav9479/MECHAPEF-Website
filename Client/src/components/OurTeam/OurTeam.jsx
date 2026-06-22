import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import EditableImage from '../EditableImage/EditableImage';
import './OurTeam.css';

const OurTeam = () => {
  // Generate 10 placeholder cards for each layer
  const cards = Array.from({ length: 10 }, (_, i) => i + 1);

  const [imagesMap, setImagesMap] = useState({});

  const fetchSectionImages = async () => {
    try {
      const res = await api.get('/upload/sections');
      const imgMap = {};
      if (res.data.data?.images) {
        res.data.data.images.forEach(img => {
          imgMap[img.sectionKey] = img.imageURL;
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
      
      {/* 
        This wrapper is the main horizontal scroller. 
        It allows the user to swipe/scroll horizontally 
        to reveal the 10 cards across all 3 layers simultaneously. 
      */}
      <div className="team-scroll-container">
        
        {/* Layer 1: Final Year Seniors */}
        <div className="team-layer">
          <h3 className="layer-title">Final Year Seniors</h3>
          <div className="layer-track">
            {cards.map(num => (
              <div key={`fy-${num}`} className="team-card">
                <EditableImage 
                  className="card-img-placeholder" 
                  sectionKey={`team_fy_${num}`} 
                  label={`Senior ${num}`} 
                  currentImage={imagesMap[`team_fy_${num}`]} 
                  onUploadSuccess={fetchSectionImages}
                >
                  {!imagesMap[`team_fy_${num}`] && <span className="placeholder-text">Image {num}</span>}
                </EditableImage>
                <div className="card-info">
                  <h4>Name {num}</h4>
                  <p>Senior Member</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Layer 2: Pre-final Year */}
        <div className="team-layer">
          <h3 className="layer-title">Pre-final Year</h3>
          <div className="layer-track">
            {cards.map(num => (
              <div key={`pf-${num}`} className="team-card">
                <EditableImage 
                  className="card-img-placeholder" 
                  sectionKey={`team_pf_${num}`} 
                  label={`Core ${num}`} 
                  currentImage={imagesMap[`team_pf_${num}`]} 
                  onUploadSuccess={fetchSectionImages}
                >
                  {!imagesMap[`team_pf_${num}`] && <span className="placeholder-text">Image {num}</span>}
                </EditableImage>
                <div className="card-info">
                  <h4>Name {num}</h4>
                  <p>Core Member</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Layer 3: Second Year */}
        <div className="team-layer">
          <h3 className="layer-title">Second Year</h3>
          <div className="layer-track">
            {cards.map(num => (
              <div key={`sy-${num}`} className="team-card">
                <EditableImage 
                  className="card-img-placeholder" 
                  sectionKey={`team_sy_${num}`} 
                  label={`Junior ${num}`} 
                  currentImage={imagesMap[`team_sy_${num}`]} 
                  onUploadSuccess={fetchSectionImages}
                >
                  {!imagesMap[`team_sy_${num}`] && <span className="placeholder-text">Image {num}</span>}
                </EditableImage>
                <div className="card-info">
                  <h4>Name {num}</h4>
                  <p>Junior Member</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default OurTeam;
