import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaVoteYea } from 'react-icons/fa';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import { eventService } from '../../services/services';
import './AdminDashboard.css';

const AdminLivePolls = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        eventService.getAll({ limit: 50 })
            .then(res => setEvents(res.data.data?.events || []))
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main className="admin-form-page">
                <div className="admin-form-topbar">
                    <div>
                        <h1><FaVoteYea style={{ color: '#00c864', marginRight: '10px' }} /> Live Polls</h1>
                        <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.85rem' }}>
                            Create questions, configure options, broadcast one poll, and monitor results.
                        </p>
                    </div>
                </div>

                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Event</th><th>Polls</th><th>Live Status</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Loading events...</td></tr>
                            ) : events.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>No events found.</td></tr>
                            ) : events.map(event => {
                                const live = event.liveInteractive || {};
                                const questions = live.questions || [];
                                const isLive = Boolean(live.enabled && live.activeQuestionId && live.isAcceptingSubmissions);
                                return (
                                    <tr key={event._id}>
                                        <td><strong style={{ color: '#fff' }}>{event.title}</strong></td>
                                        <td>{questions.length}</td>
                                        <td>
                                            <span className="tag" style={{ background: isLive ? 'rgba(0, 200, 100, 0.15)' : 'rgba(255,255,255,0.06)', color: isLive ? '#00c864' : '#888' }}>
                                                {isLive ? 'LIVE NOW' : 'READY'}
                                            </span>
                                        </td>
                                        <td>
                                            <Link to={`/admin/events/${event._id}/edit?tab=live`} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '7px 12px' }}>
                                                <FaEdit /> Manage Polls
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default AdminLivePolls;
