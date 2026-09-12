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
    const [result, setResult] = useState(null);
    const [message, setMessage] = useState('Loading live poll...');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        api.get('/events/live/active')
            .then(res => {
                const active = (res.data.questions || []).find(item => item.eventId === eventId && item.questionId === questionId);
                if (!active) {
                    setMessage('This live poll is no longer active.');
                    return;
                }
                setQuestion(active);
                setMessage('');
            })
            .catch(() => setMessage('Unable to load this live poll.'));
    }, [eventId, questionId]);

    useEffect(() => {
        if (!question) return undefined;
        const updateTimer = () => {
            const end = new Date(question.questionStartTime).getTime() + question.timeLimitSeconds * 1000;
            setRemainingSeconds(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
        };
        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [question]);

    useEffect(() => {
        if (!question || remainingSeconds > 0 || result) return;
        api.get(`/events/${eventId}/live/results`, { params: { pollId: questionId } })
            .then(res => setResult(res.data))
            .catch(error => setMessage(error.response?.data?.message || 'Results are not available yet.'));
    }, [eventId, questionId, question, remainingSeconds, result]);

    const submitVote = async () => {
        if (!selectedOption || remainingSeconds === 0) return;
        try {
            await api.post(`/events/${eventId}/live/vote`, { pollId: questionId, selectedOption });
            setSubmitted(true);
            setMessage('Vote recorded. Results will appear when the timer ends.');
        } catch (error) {
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
                        ) : (
                            <>
                                {question.options.map(option => (
                                    <label key={option.key} style={{ display: 'block', padding: '14px', margin: '10px 0', border: '1px solid #444', cursor: remainingSeconds > 0 && !submitted ? 'pointer' : 'default' }}>
                                        <input type="radio" name="live-poll-option" value={option.key} checked={selectedOption === option.key} disabled={remainingSeconds === 0 || submitted} onChange={e => setSelectedOption(e.target.value)} />{' '}
                                        {option.text}
                                    </label>
                                ))}
                                <button type="button" onClick={submitVote} disabled={!selectedOption || remainingSeconds === 0 || submitted} style={{ marginTop: '16px', padding: '12px 22px', background: '#00c864', border: 0, fontWeight: 'bold', cursor: 'pointer' }}>
                                    {submitted ? 'Vote Submitted' : 'Submit Vote'}
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
