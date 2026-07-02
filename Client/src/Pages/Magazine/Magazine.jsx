import React, { useState, useEffect } from 'react';
import { apiGetCached } from '../../utils/apiCache';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './Magazine.css';

const Magazine = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    apiGetCached('/magazine', (res) => {
      setData(res.data?.magazine || null);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load magazine", err);
      setLoading(false);
    });
  }, []);

  // Update SEO Meta Tags
  useEffect(() => {
    if (data?.seo) {
      document.title = data.seo.pageTitle || 'MechaPEF Magazine';
      
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = data.seo.metaDescription || '';

      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.name = "keywords";
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.content = data.seo.keywords || '';
    }
  }, [data]);

  if (loading || !data) return <div style={{height: '100vh', background: '#f5f4ef'}}></div>;

  const hero = data.heroStory || {};
  const featured = data.featuredStories || [];
  const news = data.newsCards || [];
  const sidebar = data.sidebarArticles || [];
  const ad = data.advertisement || {};

  const publishDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f4ef' }}>
      <Navbar variant="vertical" />
      <div className="magazine-page" style={{ flex: 1, paddingLeft: 0, paddingRight: 0 }}>
        <header className="np-masthead">
        <div className="np-masthead-top">
          <span>{publishDateStr}</span>
          <span>{data.volumeNumber} | {data.issueNumber}</span>
        </div>
        <h1 className="np-masthead-title">{data.title || 'THE MECHAPEF TIMES'}</h1>
        <div className="np-masthead-links">
          {data.categories && data.categories.map((cat, idx) => (
            <span key={idx}>{cat}</span>
          ))}
          {(!data.categories || data.categories.length === 0) && (
            <>
              <span>News</span>
              <span>Politics</span>
              <span>Technology</span>
              <span>Education</span>
              <span>Sports</span>
            </>
          )}
        </div>
      </header>

      <main className="np-main-container">
        {/* LEFT COLUMN */}
        <div className="np-left-col">
          
          {/* Lead Story (Hero Story) */}
          <article className="np-lead-story">
            <div className="np-red-tag">LATEST NEWS</div>
            <h2 className="np-headline">{hero.heading || 'Space reserved for Hero Heading (Max 80 chars)'}</h2>
            {hero.imageURL ? (
              <img src={hero.imageURL} alt="Lead" className="np-lead-image" />
            ) : (
              <div className="np-lead-image" style={{ background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#666', fontSize: '0.8rem' }}>SPACE RESERVED FOR HERO IMAGE</span>
              </div>
            )}
            <p className="np-subtext" style={{ fontWeight: 600, fontSize: '1rem', color: '#111' }}>{hero.subHeading}</p>
            <p className="np-subtext">{hero.description || 'Space reserved for Hero Description (Max 500 chars).'}</p>
          </article>

          {/* Subgrid Articles (Featured Stories) */}
          <div className="np-subgrid">
            {featured.map((item, index) => {
              const layoutClass = item.layoutType === 'left-right' ? 'np-layout-left-right' : 'np-layout-top-down';
              return (
                <article className={`np-layout-wrapper ${layoutClass}`} key={index} style={{ borderBottom: 'none' }}>
                  <div className="np-layout-img-container">
                    {item.date && <div className="np-date-badge">{item.date}</div>}
                    {item.imageURL ? (
                      <img src={item.imageURL} alt="Article" />
                    ) : (
                      <div style={{ width: '100%', height: '150px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#888', fontSize: '0.7rem' }}>NO IMAGE</span>
                      </div>
                    )}
                  </div>
                  <div className="np-layout-text">
                    <div className="np-red-tag">{item.category || 'CATEGORY'}</div>
                    <h3 className="np-headline">{item.heading || 'Featured Heading (Max 70 chars)'}</h3>
                    <p className="np-subtext">{item.shortDescription || 'Featured Description (Max 250 chars).'}</p>
                  </div>
                </article>
              );
            })}
          </div>
          
        </div>

        {/* RIGHT COLUMN */}
        <div className="np-right-col">
          
          {/* Advertisement / Poster */}
          {ad.isEnabled && (
            <div 
              className="np-poster" 
              style={{ 
                backgroundImage: ad.bannerImageURL ? `url(${ad.bannerImageURL})` : 'none',
                backgroundColor: ad.bannerImageURL ? 'transparent' : '#b31b1b',
                cursor: ad.redirectLink ? 'pointer' : 'default'
              }}
              onClick={() => {
                if (ad.redirectLink) window.open(ad.redirectLink, '_blank');
              }}
            >
              <div className="np-poster-content">
                <h2 className="np-poster-large">
                  {!ad.bannerImageURL && (
                    <>AD<br/>SPACE</>
                  )}
                </h2>
                <div className="np-poster-sub">
                  {!ad.bannerImageURL && 'Banner Ad Placeholder'}
                </div>
              </div>
            </div>
          )}

          {/* Sidebar List (News Cards) */}
          <div className="np-sidebar-list">
            <h3 style={{ fontFamily: 'var(--font-head)', marginBottom: '15px', borderBottom: '2px solid #333', paddingBottom: '5px' }}>News Highlights</h3>
            {news.map((item, index) => (
              <article className="np-sidebar-article" key={`news-${index}`}>
                {item.imageURL ? (
                  <img src={item.imageURL} alt="Thumbnail" />
                ) : (
                  <div style={{ width: '120px', height: '90px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', flexShrink: 0 }}>
                     <span style={{ color: '#888', fontSize: '0.6rem' }}>IMAGE (NEWS)</span>
                  </div>
                )}
                <div className="np-sidebar-content">
                  <div className="np-red-tag">{item.category || 'CATEGORY'}</div>
                  <h4 className="np-headline">{item.heading || 'News Card Heading (Max 60 chars)'}</h4>
                </div>
              </article>
            ))}
          </div>

          {/* Sidebar Articles (Text Only) */}
          <div className="np-sidebar-list" style={{ marginTop: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-head)', marginBottom: '15px', borderBottom: '2px solid #333', paddingBottom: '5px' }}>Quick Reads</h3>
            {sidebar.map((item, index) => (
              <article className="np-sidebar-article" key={`side-${index}`} style={{ display: 'block' }}>
                <div className="np-sidebar-content">
                  <h4 className="np-headline" style={{ fontSize: '1.2rem' }}>{item.heading || 'Sidebar Heading (Max 60 chars)'}</h4>
                  <p className="np-subtext" style={{ fontSize: '0.9rem' }}>{item.smallDescription || 'Sidebar Description (Max 150 chars).'}</p>
                </div>
              </article>
            ))}
          </div>
          
        </div>
      </main>

      {/* SECTION 2: IN-DEPTH ANALYSIS */}
      <section className="np-analysis-container">
        <div className="np-analysis-header">
          <h2 className="np-headline">{data.inDepthAnalysis?.heading || 'Space reserved for In-Depth Heading (Max 100 chars)'}</h2>
        </div>
        <div className="np-analysis-content">
          <div className="np-analysis-text">
            <span className="np-analysis-author">By {data.inDepthAnalysis?.author || 'Author Name'}</span>
            <p>{data.inDepthAnalysis?.description || 'Space reserved for In-Depth Description. Write a detailed analysis or essay here (Max 800 chars).'}</p>
          </div>
          <div className="np-analysis-image">
            {data.inDepthAnalysis?.imageURL ? (
              <img src={data.inDepthAnalysis.imageURL} alt="Analysis" />
            ) : (
              <div style={{ width: '100%', height: '400px', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#777' }}>SPACE RESERVED (ANALYSIS IMAGE)</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3: OPINION & EDITORIAL */}
      <section className="np-opinions-container">
        <h2 className="np-opinions-title">Opinion & Editorial</h2>
        <div className="np-opinions-grid">
          {(data.opinionColumns && data.opinionColumns.length > 0 ? data.opinionColumns : [{}, {}, {}, {}]).map((item, index) => (
            <div className="np-opinion-col" key={`op-${index}`}>
              <span className="np-author">{item.author || 'AUTHOR NAME'}</span>
              <h3 className="np-headline">{item.heading || 'Opinion Column Heading (Max 60 chars)'}</h3>
              <p>{item.content || 'Space reserved for Opinion Content (Max 300 chars). Write your editorial thoughts here.'}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: THE LONG FEED (MIXED ARTICLES) */}
      <section className="np-mixed-feed-container">
        <div className="np-mixed-feed-main">
          {data.mixedArticles && data.mixedArticles.map((item, index) => {
            const layoutClass = item.layoutType === 'left-right' ? 'np-layout-left-right' : 'np-layout-top-down';
            return (
              <article className={`np-layout-wrapper ${layoutClass}`} key={`mixed-${index}`}>
                <div className="np-layout-img-container">
                  {item.date && <div className="np-date-badge">{item.date}</div>}
                  {item.imageURL ? (
                    <img src={item.imageURL} alt="Article" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', minHeight: '200px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#888', fontSize: '0.8rem' }}>NO IMAGE</span>
                    </div>
                  )}
                </div>
                <div className="np-layout-text">
                  <div className="np-red-tag">{item.category || 'CATEGORY'}</div>
                  <h3 className="np-headline" style={{ fontSize: '1.8rem' }}>{item.heading || 'Mixed Feed Heading (Max 100 chars)'}</h3>
                  <p className="np-subtext" style={{ fontSize: '1.05rem' }}>{item.description || 'Mixed Feed Description (Max 500 chars).'}</p>
                </div>
              </article>
            );
          })}
        </div>
        <div className="np-mixed-feed-side">
          <div className="np-sidebar-list">
            <h3 style={{ fontFamily: 'var(--font-head)', marginBottom: '15px', borderBottom: '2px solid #333', paddingBottom: '5px' }}>More Updates</h3>
            {sidebar.map((item, index) => (
              <article className="np-sidebar-article" key={`side2-${index}`} style={{ display: 'block' }}>
                <div className="np-sidebar-content">
                  <h4 className="np-headline" style={{ fontSize: '1.2rem' }}>{item.heading || 'Sidebar Heading (Max 60 chars)'}</h4>
                  <p className="np-subtext" style={{ fontSize: '0.9rem' }}>{item.smallDescription || 'Sidebar Description (Max 150 chars).'}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

        <Footer />
      </div>
    </div>
  );
};

export default Magazine;
