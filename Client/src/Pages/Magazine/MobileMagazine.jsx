import React from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './MobileMagazine.css';

const MobileMagazine = ({ data }) => {
  const hero = data.heroStory || {};
  const featured = data.featuredStories || [];
  const news = data.newsCards || [];
  const sidebar = data.sidebarArticles || [];
  const opinions = data.opinions || [];
  const ad = data.advertisement || {};

  const publishDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const renderMastheadTitle = (title) => {
    const t = title || 'The MechaPEF Times';
    const parts = t.split(/(MECHAPEF)/i);
    return parts.map((part, i) => 
      part.toUpperCase() === 'MECHAPEF' ? <span key={i} style={{color: 'var(--np-red)'}}>MechaPEF</span> : part
    );
  };

  return (
    <div className="mobile-magazine-root">
      <Navbar /> {/* Default horizontal navbar with mobile hamburger */}
      
      <div className="mobile-magazine-content">
        {/* Mobile Masthead */}
        <header className="mm-masthead">
          <div className="mm-masthead-meta">
            <span>{publishDateStr}</span>
            <span>{data.volumeNumber} | {data.issueNumber}</span>
          </div>
          <h1 className="mm-masthead-title">{renderMastheadTitle(data.title)}</h1>
          <div className="mm-masthead-categories">
            {data.categories && data.categories.length > 0 ? (
              data.categories.map((cat, idx) => <span key={idx}>{cat}</span>)
            ) : (
              <>
                <span>News</span>
                <span>Tech</span>
                <span>Events</span>
              </>
            )}
          </div>
        </header>

        {/* Hero Story - Edge to Edge */}
        <article className="mm-hero-story">
          <h2 className="mm-sticky-heading">{hero.heading || 'Latest News'}</h2>
          
          <div className="mm-hero-image-container">
            {hero.imageURL ? (
              <img src={hero.imageURL} alt="Hero" className="mm-hero-img" />
            ) : (
              <div className="mm-hero-placeholder">HERO IMAGE</div>
            )}
            {hero.dateBadge && <div className="mm-date-badge">{hero.dateBadge}</div>}
          </div>
          
          <div className="mm-hero-text">
            <div className="mm-tag">LATEST NEWS</div>
            <h3>{hero.subHeading}</h3>
            <p>{hero.description}</p>
          </div>
        </article>

        {/* Featured Stories Feed */}
        {featured.length > 0 && (
          <section className="mm-feed-section">
            <div className="mm-section-divider"><span>FEATURED</span></div>
            {featured.map((story, i) => (
              <article key={i} className="mm-feed-card">
                <h3 className="mm-sticky-heading">{story.heading}</h3>
                <div className="mm-feed-img-container">
                  {story.imageURL && <img src={story.imageURL} alt="Featured" />}
                  {story.dateBadge && <div className="mm-date-badge">{story.dateBadge}</div>}
                </div>
                <div className="mm-feed-text">
                  <p>{story.description}</p>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* Ad Banner */}
        {ad.show && ad.imageURL && (
          <div className="mm-ad-banner" onClick={() => ad.redirectLink && window.open(ad.redirectLink, '_blank')}>
            <span className="mm-ad-label">ADVERTISEMENT</span>
            <img src={ad.imageURL} alt="Advertisement" />
          </div>
        )}

        {/* Long Feed / News Cards */}
        {news.length > 0 && (
          <section className="mm-feed-section">
            <div className="mm-section-divider"><span>THE FEED</span></div>
            {news.map((item, i) => (
              <article key={i} className="mm-feed-card">
                <h3 className="mm-sticky-heading">{item.heading}</h3>
                <div className="mm-feed-img-container">
                  {item.imageURL && <img src={item.imageURL} alt="News" />}
                  {item.dateBadge && <div className="mm-date-badge">{item.dateBadge}</div>}
                </div>
                <div className="mm-feed-text">
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* Sidebar Articles / More Stories */}
        {sidebar.length > 0 && (
          <section className="mm-feed-section">
            <div className="mm-section-divider"><span>MORE STORIES</span></div>
            {sidebar.map((item, i) => (
              <article key={i} className="mm-feed-card">
                <h3 className="mm-sticky-heading">{item.heading}</h3>
                <div className="mm-feed-img-container">
                  {item.imageURL && <img src={item.imageURL} alt="Story" />}
                  {item.dateBadge && <div className="mm-date-badge">{item.dateBadge}</div>}
                </div>
                <div className="mm-feed-text">
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* Opinions / Columns */}
        {opinions.length > 0 && (
          <section className="mm-opinions-section">
            <div className="mm-section-divider"><span>OPINIONS & COLUMNS</span></div>
            <div className="mm-opinions-list">
              {opinions.map((op, i) => (
                <article key={i} className="mm-opinion-card">
                  <span className="mm-author">{op.author || 'GUEST COLUMN'}</span>
                  <h4>{op.heading}</h4>
                  <p>{op.description}</p>
                </article>
              ))}
            </div>
          </section>
        )}

      </div>
      <Footer />
    </div>
  );
};

export default MobileMagazine;
