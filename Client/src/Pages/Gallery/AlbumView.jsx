import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Masonry from 'react-layout-masonry';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import api from '../../services/api';
import './Gallery.css';

const AlbumView = () => {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get(`/gallery/${id}`).then(res => {
      setAlbum(res.data.data.album);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, [id]);

  // Deterministic random heights for the mosaic layout (between 250px and 500px)
  const getMosaicHeight = (index) => {
    const heights = [280, 420, 320, 480, 250, 380, 350, 450];
    return heights[index % heights.length];
  };

  const getRotation = (index) => {
    const rotations = [1, -2, 2, -1, 3, -3, 0.5, -1.5];
    return rotations[index % rotations.length];
  };

  if (loading) {
    return (
      <div className="gallery-page premium-dark-theme">
        <Navbar />
        <div className="gallery-header album-specific-header">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-text"></div>
        </div>
        <div className="gallery-container">
          <Masonry columns={{ 320: 1, 640: 2, 1024: 3, 1280: 4 }} gap={20}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item, index) => (
              <div 
                key={item} 
                className="skeleton mosaic-skeleton"
                style={{ height: `${getMosaicHeight(index)}px` }}
              ></div>
            ))}
          </Masonry>
        </div>
        <Footer />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="gallery-page premium-dark-theme">
        <Navbar />
        <div className="gallery-empty" style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
          <h2>Album not found</h2>
          <Link to="/gallery" className="btn-primary">Back to Gallery</Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Format images for Lightbox
  const lightboxSlides = album.images?.map(img => ({
    src: img.imageURL,
    alt: img.caption || 'MechaPEF Gallery Image'
  })) || [];

  return (
    <div className="gallery-page premium-dark-theme">
      <Navbar />
      <div className="gallery-header album-specific-header">
        <div className="back-link-container">
          <Link to="/gallery" className="back-link"><FaArrowLeft /> Back to Albums</Link>
        </div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {album.title}
        </motion.h1>
        {album.description && (
          <motion.p
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            {album.description}
          </motion.p>
        )}
      </div>

      <div className="gallery-container">
        {album.images && album.images.length > 0 ? (
          <div className="premium-mosaic-container">
            <Masonry columns={{ 320: 1, 640: 2, 1024: 3, 1400: 4, 1800: 5 }} gap={24}>
              {album.images.map((img, idx) => (
                <motion.div 
                  key={img._id} 
                  className="mosaic-image-wrapper"
                  style={{ height: `${getMosaicHeight(idx)}px` }}
                  // Initial scattered state
                  initial={{ 
                    opacity: 0, 
                    scale: 0.85, 
                    rotate: getRotation(idx), 
                    y: 50 
                  }}
                  // Scroll reveal with spring physics
                  whileInView={{ 
                    opacity: 1, 
                    scale: 1, 
                    rotate: 0, 
                    y: 0 
                  }}
                  viewport={{ once: true, margin: "50px" }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100, 
                    damping: 15,
                    delay: (idx % 6) * 0.08 // Stagger effect
                  }}
                  // Hover effects
                  whileHover={{ 
                    scale: 1.03, 
                    y: -8,
                    rotate: getRotation(idx) * 0.5, // Subtle return to rotation
                    transition: { duration: 0.3, ease: "easeOut" } 
                  }}
                  onClick={() => {
                    setLightboxIndex(idx);
                    setIsLightboxOpen(true);
                  }}
                >
                  <img src={img.imageURL} alt={img.caption || `Image ${idx + 1}`} loading="lazy" />
                  
                  {/* Glassmorphism Hover Overlay */}
                  <div className="mosaic-overlay">
                    <span className="mosaic-overlay-icon">+</span>
                  </div>
                </motion.div>
              ))}
            </Masonry>
          </div>
        ) : (
          <div className="gallery-empty" style={{ padding: '100px 0' }}>
            No images in this album yet.
          </div>
        )}
      </div>
      <Footer />

      {/* Premium Fullscreen Lightbox */}
      <Lightbox
        open={isLightboxOpen}
        close={() => setIsLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxSlides}
        plugins={[Zoom, Thumbnails]}
        animation={{ fade: 300, swipe: 250, zoom: 300 }}
        styles={{ 
          container: { backgroundColor: "rgba(0, 0, 0, 0.92)", backdropFilter: "blur(10px)" },
        }}
      />
    </div>
  );
};

export default AlbumView;
