import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import api from '../../services/api';
import { apiGetCached } from '../../utils/apiCache';
import './Gallery.css';

const Gallery = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);

    apiGetCached('/gallery', (data) => {
      const albumsList = data.data?.albums || data.albums || [];
      setAlbums(albumsList);
      setLoading(false);
    }, { cacheDuration: 3 * 60 * 60 * 1000 }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="gallery-page">
      <Navbar />
      <div className="gallery-header">
        <h1>Photo <span>Gallery</span></h1>
        <p>Explore the moments we've captured over time</p>
      </div>

      <div className="gallery-container">
        {loading ? (
          <div className="gallery-loading">Loading albums...</div>
        ) : albums.length === 0 ? (
          <div className="gallery-empty">No albums available right now. Check back later!</div>
        ) : (
          <div className="albums-grid">
            {albums.map((album, idx) => (
              <div 
                key={album._id} 
                className="album-card" 
                onClick={() => navigate(`/gallery/${album._id}`)}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="album-cover">
                  {album.coverImageURL ? (
                    <img src={album.coverImageURL} alt={album.title} />
                  ) : album.images && album.images.length > 0 ? (
                    <img src={album.images[0].imageURL} alt={album.title} />
                  ) : (
                    <div className="album-no-cover">No Cover</div>
                  )}
                  <div className="album-overlay">
                    <span className="view-btn">View Album</span>
                  </div>
                </div>
                <div className="album-info">
                  <h2>{album.title}</h2>
                  <p>{album.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Gallery;
