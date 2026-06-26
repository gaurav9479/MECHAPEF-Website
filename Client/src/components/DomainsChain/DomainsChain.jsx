import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import './DomainsChain.css';

const DomainsChain = () => {
  const [imagesMap, setImagesMap] = useState({});

  useEffect(() => {
    const fetchImages = async () => {
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
    fetchImages();
  }, []);

  const domains = [
    { key: 'domain_1', title: 'Automobile / SAE', subtitle: '(Baja, Go-Kart)' },
    { key: 'domain_2', title: 'Robotics & Automation', subtitle: '(Arduino, Sensors)' },
    { key: 'domain_3', title: 'Design & CAD', subtitle: '(SolidWorks, AutoCAD)' },
    { key: 'domain_4', title: 'Core Manufacturing', subtitle: '(Machining, Welding)' },
  ];

  return (
    <section className="domains-chain-section">
      <div className="chain-header">
        <h2>Our Core Domains</h2>
        <p>The pillars of our engineering legacy</p>
      </div>

      <div className="chain-container">
        {/* The horizontal main chain line */}
        <div className="main-horizontal-chain"></div>

        <div className="domains-hanging-grid">
          {domains.map((domain, index) => (
            <motion.div 
              className="hanging-domain-node" 
              key={domain.key}
              initial={{ opacity: 0, y: -50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: index * 0.2, type: "spring", stiffness: 100 }}
            >
              {/* Vertical chain link dropping from main chain */}
              <div className="vertical-drop-chain"></div>

              <div className="domain-card-glow">
                <div className="domain-card-inner">
                  <div className="domain-logo-circle">
                    {imagesMap[domain.key] ? (
                      <img src={imagesMap[domain.key]} alt={domain.title} className="domain-img" />
                    ) : (
                      <div className="domain-placeholder">⚙️</div>
                    )}
                  </div>
                  <h3>{domain.title}</h3>
                  <p>{domain.subtitle}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DomainsChain;
