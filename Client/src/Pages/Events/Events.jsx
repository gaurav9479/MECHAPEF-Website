import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { eventService } from '../../services/services';
import './Events.css';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchEvents = async () => {
      try {
        const res = await eventService.getAll({ limit: 50 });
        setEvents(res.data.data.events);
      } catch (err) {
        console.error('Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <>
      <Navbar />
      <div className="events-page-wrapper">
        <div className="events-header">
          <h1>Events & Competitions</h1>
          <p>Join the best engineering events, workshops, and challenges.</p>
        </div>
        
        <div className="events-container">
          {loading ? (
            <div className="loading-text">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="loading-text">No upcoming events found.</div>
          ) : (
            <div className="events-grid">
              {events.map(ev => (
                <div key={ev._id} className="event-card">
                  <div className="event-card-pattern"></div>
                  <div className="event-card-content">
                    <div className="event-category">{ev.category}</div>
                    <h2>{ev.title}</h2>
                    <p className="event-date">
                      {new Date(ev.startTime).toLocaleDateString('en-IN', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                    <p className="event-venue">📍 {ev.venue}</p>
                    <p className="event-desc">{ev.description?.substring(0, 100)}...</p>
                    <Link to={`/events/${ev._id}`} className="primary-btn event-btn">
                      View Details & Register
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Events;
