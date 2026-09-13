import React from 'react';

const TeamDetailView = ({ registration, event }) => {
  if (!registration) {
    return <div style={{ color: '#aaa', padding: '16px' }}>No registration data available.</div>;
  }

  const { teamName, registeredBy, teamMembers = [], customData = {} } = registration;
  const allParticipants = [
    { ...registeredBy, isLeader: true },
    ...teamMembers.filter(m => m.status === 'Confirmed'),
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      border: '1px solid rgba(0, 200, 100, 0.3)',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '16px',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid #222', paddingBottom: '14px' }}>
        <span style={{ fontSize: '1.3rem' }}>✅</span>
        <div>
          <h3 style={{ margin: 0, color: '#00c864', fontSize: '1rem' }}>Registration Finalized</h3>
          <p style={{ margin: '2px 0 0', color: '#aaa', fontSize: '0.82rem' }}>{event.title}</p>
        </div>
      </div>

      {/* Team name (if team event) */}
      {teamName && (
        <div style={{ marginBottom: '14px' }}>
          <span style={{ color: '#888', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Name</span>
          <p style={{ margin: '4px 0 0', color: '#fff', fontWeight: '600', fontSize: '0.95rem' }}>{teamName}</p>
        </div>
      )}

      {/* Participants */}
      <div style={{ marginBottom: '16px' }}>
        <span style={{ color: '#888', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Participants ({allParticipants.length})
        </span>
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {allParticipants.map((p, i) => (
            <div key={p.userId || i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#111', borderRadius: '8px', padding: '8px 12px',
              border: '1px solid #222'
            }}>
              <div>
                <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>{p.name}</span>
                <span style={{ color: '#555', fontSize: '0.8rem', marginLeft: '8px' }}>{p.collegeRegNo}</span>
              </div>
              {p.isLeader && (
                <span style={{
                  fontSize: '0.7rem', fontWeight: 'bold', color: '#00c864',
                  background: 'rgba(0,200,100,0.12)', padding: '2px 8px', borderRadius: '10px',
                  border: '1px solid rgba(0,200,100,0.25)'
                }}>Leader</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Custom form field answers */}
      {event.customFormFields?.length > 0 && Object.keys(customData).length > 0 && (
        <div>
          <span style={{ color: '#888', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Submitted Details
          </span>
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {event.customFormFields.map((field, idx) => (
              <div key={idx} style={{ background: '#111', borderRadius: '8px', padding: '10px 12px', border: '1px solid #222' }}>
                <p style={{ margin: '0 0 4px', color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {field.fieldName}{field.isRequired && ' *'}
                </p>
                <p style={{ margin: 0, color: '#e5e7eb', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                  {customData[field.fieldName] !== undefined && customData[field.fieldName] !== ''
                    ? (typeof customData[field.fieldName] === 'boolean'
                      ? (customData[field.fieldName] ? 'Yes' : 'No')
                      : customData[field.fieldName])
                    : <span style={{ color: '#555', fontStyle: 'italic' }}>Not provided</span>
                  }
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked notice */}
      <div style={{ marginTop: '16px', textAlign: 'center', color: '#555', fontSize: '0.75rem' }}>
        🔒 Registration is permanently locked. No further changes allowed.
      </div>
    </div>
  );
};

export default TeamDetailView;

