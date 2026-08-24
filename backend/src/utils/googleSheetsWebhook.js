

const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzPRCwHaYSh98X2Nin6iFvHtG1gzsduTWCtu38j3JF-vl9tACkBI8RRvhb0KAjuuKcAtw/exec';


export const syncWithGoogleSheet = async (user, eventTitle, registrationPayload) => {
    try {
        const teamMembersFormatted = Array.isArray(registrationPayload.teamMembers) 
            ? registrationPayload.teamMembers
                .filter(m => m.status === 'Confirmed' || !m.status)
                .map(m => `${m.name} [RegNo: ${m.collegeRegNo || 'N/A'}, Email: ${m.email || 'N/A'}]`)
                .join(' | ')
            : '';

        const data = {
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            eventName: eventTitle || 'N/A',
            leaderName: user?.name || 'N/A',
            leaderEmail: user?.email || 'N/A',
            leaderRegNo: user?.collegeRegNo || 'N/A',
            branch: user?.branch || 'N/A',
            yearOfStudy: user?.yearOfStudy || 'N/A',
            phoneNumber: user?.phoneNumber || 'N/A',
            registrationType: registrationPayload.registrationType || 'Solo',
            teamName: registrationPayload.teamName || 'N/A',
            endorsedMembers: teamMembersFormatted || 'None',
            customData: registrationPayload.customData || {}
        };


        fetch(WEBHOOK_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        }).catch(err => {
            console.error('[GoogleSheetWebhook] Request failed:', err.message);
        });
        
    } catch (error) {
        console.error('[GoogleSheetWebhook] Exception:', error.message);
    }
};
