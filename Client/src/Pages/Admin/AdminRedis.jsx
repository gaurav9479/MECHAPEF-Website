import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FaServer, FaCheckCircle, FaCog } from 'react-icons/fa';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import api from '../../services/api';
import './AdminDashboard.css'; // Re-use general admin styles

const AdminRedis = () => {
  const [redisModeType, setRedisModeType] = useState('AUTO');
  const [enableDualRedis, setEnableDualRedis] = useState(false);
  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(23);
  const [redisLoading, setRedisLoading] = useState(false);
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const [shutdownMinutesRemaining, setShutdownMinutesRemaining] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSystemConfig = async () => {
    try {
      const res = await api.get('/system/config');
      const conf = res.data.data?.config || {};
      setRedisModeType(conf.redisModeType || 'AUTO');
      setEnableDualRedis(conf.enableDualRedis || false);
      setStartHour(conf.startHour ?? 10);
      setEndHour(conf.endHour ?? 23);
      setIsShuttingDown(Boolean(conf.isShuttingDown));
      setShutdownMinutesRemaining(conf.shutdownMinutesRemaining || 0);
    } catch {

    }
  };

  useEffect(() => {
    fetchSystemConfig();
    const interval = setInterval(fetchSystemConfig, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateSystemConfig = async (updates) => {
    setRedisLoading(true);
    try {
      const res = await api.put('/system/config', updates);
      const conf = res.data.data?.config || {};
      if (conf.redisModeType) setRedisModeType(conf.redisModeType);
      if (conf.enableDualRedis !== undefined) setEnableDualRedis(conf.enableDualRedis);
      if (conf.startHour !== undefined) setStartHour(conf.startHour);
      if (conf.endHour !== undefined) setEndHour(conf.endHour);
      setIsShuttingDown(Boolean(conf.turnOffEffectiveAt && new Date() < new Date(conf.turnOffEffectiveAt)));
      showToast(res.data?.message || 'System Config updated');
      fetchSystemConfig();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update system config', 'error');
    } finally {
      setRedisLoading(false);
    }
  };

  return (
    <div className="admin-layout">
      <Helmet>
        <title>Redis Settings | Admin Portal</title>
      </Helmet>
      <AdminSidebar />
      
      <main className="admin-main">
        {toast && (
          <div className={`toast-notification ${toast.type}`}>
            {toast.msg}
          </div>
        )}
        
        <div className="admin-header">
          <h1><FaServer style={{ marginRight: '15px' }} /> Redis Infrastructure</h1>
        </div>

        <div className="admin-system-settings" style={{ maxWidth: '800px', margin: '0 auto', marginTop: '30px' }}>
          <p style={{ color: '#aaa', marginBottom: '20px', fontSize: '0.95rem' }}>
            Manage backend scaling and caching directly. Enable Dual Redis for peak load situations to safely shard user registrations across two distinct memory instances without data collision.
          </p>

          <div style={{ background: '#111', padding: '24px', borderRadius: '12px', border: '1px solid #333', marginBottom: '24px' }}>
            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaCog style={{ color: '#ff1f01' }} /> Queue Mode Selection
            </h3>
            
            <div style={{ display: 'flex', gap: '10px', background: '#050505', padding: '6px', borderRadius: '10px', border: '1px solid #222', width: 'fit-content', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={redisLoading}
                onClick={() => updateSystemConfig({ redisModeType: 'AUTO' })}
                style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: redisModeType === 'AUTO' && !isShuttingDown ? '#ff1f01' : 'transparent', color: redisModeType === 'AUTO' && !isShuttingDown ? '#fff' : '#aaa', transition: 'all 0.2s ease' }}
              >
                🤖 AUTO
              </button>
              <button
                type="button"
                disabled={redisLoading}
                onClick={() => updateSystemConfig({ redisModeType: 'ALWAYS_ON' })}
                style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: redisModeType === 'ALWAYS_ON' && !isShuttingDown ? '#00c864' : 'transparent', color: redisModeType === 'ALWAYS_ON' && !isShuttingDown ? '#000' : '#aaa', transition: 'all 0.2s ease' }}
              >
                ⚡ ALWAYS ON
              </button>
              <button
                type="button"
                disabled={redisLoading}
                onClick={() => updateSystemConfig({ redisModeType: 'ALWAYS_OFF' })}
                style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: redisModeType === 'ALWAYS_OFF' || isShuttingDown ? '#ffaa00' : 'transparent', color: redisModeType === 'ALWAYS_OFF' || isShuttingDown ? '#000' : '#aaa', transition: 'all 0.2s ease' }}
              >
                {isShuttingDown ? '⏳ SHUTTING DOWN (15m)' : '⚪ TURN OFF (15m Buffer)'}
              </button>
            </div>

            {isShuttingDown && (
              <div style={{ background: 'rgba(255, 170, 0, 0.1)', border: '1px solid rgba(255, 170, 0, 0.3)', borderRadius: '8px', padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h4 style={{ color: '#ffaa00', margin: '0 0 6px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⏳ 15-Minute Grace Period Active
                  </h4>
                  <p style={{ color: '#ccc', margin: 0, fontSize: '0.88rem' }}>
                    Redis is remaining active for ongoing tasks. It will disconnect in <strong>~{shutdownMinutesRemaining} min(s)</strong>.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    disabled={redisLoading}
                    onClick={() => updateSystemConfig({ cancelShutdown: true })}
                    style={{ background: '#00c864', color: '#000', border: 'none', padding: '7px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Keep Redis ON (Cancel)
                  </button>
                  <button
                    type="button"
                    disabled={redisLoading}
                    onClick={() => updateSystemConfig({ redisModeType: 'ALWAYS_OFF', immediate: true })}
                    style={{ background: '#333', color: '#ff4444', border: '1px solid #555', padding: '7px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Force Turn OFF Now
                  </button>
                </div>
              </div>
            )}


            {redisModeType === 'AUTO' && (
              <div style={{ display: 'flex', gap: '24px', marginTop: '20px', background: '#0a0a0a', padding: '20px', borderRadius: '8px', border: '1px solid #222', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label style={{ display: 'block', color: '#ccc', marginBottom: '8px', fontSize: '0.9rem' }}>Activation Start Hour (0-23)</label>
                  <input 
                    type="range" min="0" max="23" 
                    value={startHour} 
                    onChange={(e) => setStartHour(parseInt(e.target.value))}
                    onMouseUp={() => updateSystemConfig({ startHour })}
                    onTouchEnd={() => updateSystemConfig({ startHour })}
                    style={{ width: '100%', accentColor: '#ff1f01' }}
                  />
                  <div style={{ textAlign: 'right', color: '#ff1f01', fontWeight: 'bold', marginTop: '5px' }}>{startHour}:00 (IST)</div>
                </div>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label style={{ display: 'block', color: '#ccc', marginBottom: '8px', fontSize: '0.9rem' }}>Deactivation End Hour (0-23)</label>
                  <input 
                    type="range" min="0" max="23" 
                    value={endHour} 
                    onChange={(e) => setEndHour(parseInt(e.target.value))}
                    onMouseUp={() => updateSystemConfig({ endHour })}
                    onTouchEnd={() => updateSystemConfig({ endHour })}
                    style={{ width: '100%', accentColor: '#ff1f01' }}
                  />
                  <div style={{ textAlign: 'right', color: '#ff1f01', fontWeight: 'bold', marginTop: '5px' }}>{endHour}:00 (IST)</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ background: '#111', padding: '24px', borderRadius: '12px', border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaCheckCircle style={{ color: enableDualRedis ? '#00c864' : '#555' }} /> Dual Redis Hashing (Sharding)
                </h3>
                <p style={{ color: '#aaa', fontSize: '0.9rem', maxWidth: '600px', lineHeight: '1.5', margin: 0 }}>
                  When enabled, registrations are safely sharded across two independent Redis connections using a deterministic User ID hash. This avoids data collision and doubles throughput capabilities during peak times.
                </p>
              </div>
              <div className="toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                <input
                  type="checkbox"
                  id="dual-redis-toggle"
                  checked={enableDualRedis}
                  onChange={(e) => updateSystemConfig({ enableDualRedis: e.target.checked })}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <label 
                  htmlFor="dual-redis-toggle" 
                  className="slider"
                  style={{ 
                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: enableDualRedis ? '#00c864' : '#ccc', transition: '.4s', borderRadius: '34px' 
                  }}
                >
                  <span style={{
                    position: 'absolute', content: '""', height: '26px', width: '26px', left: '4px', bottom: '4px', 
                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                    transform: enableDualRedis ? 'translateX(26px)' : 'none'
                  }} />
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminRedis;
