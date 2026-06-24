import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import api from '../../services/api';
import './Gallery.css';

const AlbumView = () => {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullscreenImage, setFullscreenImage] = useState(null);

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

  if (loading) {
    return (
      <div className="gallery-page">
        <Navbar />
        <div className="gallery-loading" style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Loading album...
        </div>
        <Footer />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="gallery-page">
        <Navbar />
        <div className="gallery-empty" style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
          <h2>Album not found</h2>
          <Link to="/gallery" className="btn-primary">Back to Gallery</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="gallery-page">
      <Navbar />
      <div className="gallery-header album-specific-header">
        <div className="back-link-container">
          <Link to="/gallery" className="back-link"><FaArrowLeft /> Back to Albums</Link>
        </div>
        <h1>{album.title}</h1>
        {album.description && <p>{album.description}</p>}
      </div>

      <div className="gallery-container">
        {album.images && album.images.length > 0 ? (
          <div className="album-images-grid">
            {album.images.map((img, idx) => (
              <div 
                key={img._id} 
                className="album-image-card"
                onClick={() => setFullscreenImage(img.imageURL)}
                style={{ animationDelay: `${(idx % 8) * 0.1}s` }}
              >
                <img src={img.imageURL} alt={img.caption || `Image ${idx + 1}`} loading="lazy" />
              </div>
            ))}
          </div>
        ) : (
          <div className="gallery-empty" style={{ padding: '100px 0' }}>
            No images in this album yet.
          </div>
        )}
      </div>
      <Footer />


      {fullscreenImage && (
        <div className="fullscreen-overlay" onClick={() => setFullscreenImage(null)}>
          <button className="close-fullscreen" onClick={() => setFullscreenImage(null)}>&times;</button>
          <img src={fullscreenImage} alt="Fullscreen" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default AlbumView;
