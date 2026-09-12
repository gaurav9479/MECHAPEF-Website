import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaVoteYea } from 'react-icons/fa';
import api from '../../services/api';

const LivePoll = () => {
    const { eventId, questionId } = useParams();
    const navigate = useNavigate();
    const [question, setQuestion] = useState(null);
    const [selectedOption, setSelectedOption] = useState('');
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [settlementSeconds, setSettlementSeconds] = useState(0);
    const [result, setResult] = useState(null);
    const [message, setMessage] = useState('Loading live poll...');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const getAttendeeId = () => {
        const storageKey = 'mechapef_live_attendee_id';
        let attendeeId = localStorage.getItem(storageKey);
        if (!attendeeId) {
            attendeeId = window.crypto?.randomUUID?.() || `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            localStorage.setItem(storageKey, attendeeId);
        }
        return attendeeId;
    };

    useEffect(() => {
        api.get('/events/live/active')
            .then(res => (res.data.questions || []).find(item => item.eventId === eventId && item.questionId === questionId))
            .catch(() => null)
            .then(active => {
                if (active) {
                    setQuestion(active);
                    setMessage('');
                    return;
                }
                return api.get(`/events/${eventId}/live/poll/${questionId}`)
                    .then(res => {
                        setQuestion(res.data.question);
                        setMessage(res.data.expired ? 'Voting has ended. Results are visible below.' : '');
                    });
            })
            .catch(error => setMessage(error.response?.data?.message || 'Unable to load this live poll.'));
    }, [eventId, questionId]);

    useEffect(() => {
        if (!question) return undefined;
        const updateTimer = () => {
            const end = new Date(question.questionStartTime).getTime() + question.timeLimitSeconds * 1000;
            const now = Date.now();
            setRemainingSeconds(Math.max(0, Math.ceil((end - now) / 1000)));
            setSettlementSeconds(Math.max(0, Math.ceil((end + 5000 - now) / 1000)));
        };
        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [question]);

    useEffect(() => {
        if (!question || remainingSeconds > 0 || result) return;
        const fetchResults = () => api.get(`/events/${eventId}/live/results`, { params: { pollId: questionId } })
            .then(res => setResult(res.data))
            .catch(error => setMessage(error.response?.data?.message || 'Results are being processed...'));
        fetchResults();
        const retryTimer = setInterval(() => {
            if (!result) fetchResults();
        }, 2000);
        return () => clearInterval(retryTimer);
    }, [eventId, questionId, question, remainingSeconds, result]);

    const submitVote = async () => {
        if (!selectedOption || remainingSeconds === 0 || submitted || submitting) return;
        setSubmitting(true);
        try {
            await api.post(`/events/${eventId}/live/vote`, {
                pollId: questionId,
                selectedOption,
                userId: getAttendeeId()
            });
            setSubmitted(true);
            setMessage('Vote recorded. Results will appear when the timer ends.');
        } catch (error) {
            setSubmitting(false);
            setMessage(error.response?.data?.message || 'Unable to submit vote.');
        }
    };

    return (
        <main style={{ minHeight: '100vh', background: '#101014', color: '#fff', padding: 'clamp(24px, 6vw, 80px)' }}>
            <button type="button" onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid #444', color: '#fff', padding: '10px 16px', cursor: 'pointer' }}>
                <FaArrowLeft /> Back to notices
            </button>

            <section style={{ maxWidth: '760px', margin: '48px auto', padding: 'clamp(24px, 5vw, 52px)', border: '1px solid #00c864', background: '#181820' }}>
                <div style={{ color: '#00c864', fontWeight: 'bold', letterSpacing: '1px' }}><FaVoteYea /> LIVE POLL</div>
                {question ? (
                    <>
                        <p style={{ color: '#aaa' }}>{question.eventTitle}</p>
                        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.6rem)', lineHeight: 1.25 }}>{question.title}</h1>
                        <div style={{ color: remainingSeconds > 0 ? '#ffaa00' : '#ff4444', fontWeight: 'bold', margin: '20px 0' }}>
                            {remainingSeconds > 0 ? `${remainingSeconds} seconds remaining` : 'Voting closed'}
                        </div>

                        {result ? (
                            <div>
                                {Object.entries(result.breakdown || {}).map(([option, data]) => (
                                    <div key={option} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', padding: '14px 0' }}>
                                        <span>{question.options.find(item => item.key === option)?.text || option}</span>
                                        <strong>{data.percentage}%</strong>
                                    </div>
                                ))}
                                <p style={{ color: '#aaa' }}>Total votes: {result.totalVotes || 0}</p>
                            </div>
                        ) : remainingSeconds === 0 ? (
                            <div style={{ textAlign: 'center', padding: '28px 12px', border: '1px solid rgba(255, 170, 0, 0.35)', background: 'rgba(255, 170, 0, 0.06)' }}>
                                <style>{`@keyframes livePollSpin { to { transform: rotate(360deg); } } @keyframes livePollPulse { 0%, 100% { opacity: .45; } 50% { opacity: 1; } }`}</style>
                                <div style={{ width: '42px', height: '42px', margin: '0 auto 16px', border: '4px solid #444', borderTopColor: '#ffaa00', borderRadius: '50%', animation: 'livePollSpin .8s linear infinite' }} />
                                <strong style={{ color: '#ffaa00', display: 'block', fontSize: '1.1rem', animation: 'livePollPulse 1.2s ease-in-out infinite' }}>
                                    Final results processing...
                                </strong>
                                <span style={{ display: 'block', color: '#aaa', marginTop: '8px' }}>
                                    Clearing the voting queue. Results in {settlementSeconds || 1}s
                                </span>
                                <div style={{ height: '5px', background: '#333', marginTop: '18px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: '#ffaa00', width: `${Math.max(8, ((5 - settlementSeconds) / 5) * 100)}%`, transition: 'width 1s linear' }} />
                                </div>
                            </div>
                        ) : (
                            <>
                                {question.options.map(option => (
                                    <label key={option.key} style={{ display: 'block', padding: '14px', margin: '10px 0', border: '1px solid #444', cursor: remainingSeconds > 0 && !submitted ? 'pointer' : 'default' }}>
                                        <input type="radio" name="live-poll-option" value={option.key} checked={selectedOption === option.key} disabled={remainingSeconds === 0 || submitted || submitting} onChange={e => setSelectedOption(e.target.value)} />{' '}
                                        {option.text}
                                    </label>
                                ))}
                                <button type="button" onClick={submitVote} disabled={!selectedOption || remainingSeconds === 0 || submitted || submitting} style={{ marginTop: '16px', padding: '12px 22px', background: '#00c864', border: 0, fontWeight: 'bold', cursor: 'pointer' }}>
                                    {submitted ? 'Vote Submitted' : submitting ? 'Submitting...' : 'Submit Vote'}
                                </button>
                            </>
                        )}
                        {message && <p style={{ color: '#ffaa00' }}>{message}</p>}
                    </>
                ) : (
                    <p>{message}</p>
                )}
            </section>
        </main>
    );
};

export default LivePoll;
