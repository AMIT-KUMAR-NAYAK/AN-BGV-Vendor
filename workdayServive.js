// workdayService.js

/**
 * Securely fetch a temporary Bearer Access Token from Workday
 */
async function getWorkdayAccessToken() {
    const credentials = Buffer.from(`${process.env.WD_CLIENT_ID}:${process.env.WD_CLIENT_SECRET}`).toString('base64');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', process.env.WD_REFRESH_TOKEN);

    const response = await fetch(process.env.WD_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Workday Auth Failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.access_token; 
}

/**
 * Push the updated BGV status back to AN Company's Workday tenant
 */
async function updateCandidateBGVStatus(candidateId, updatedFields) {
    try {
        const accessToken = await getWorkdayAccessToken();
        
        // NOTE: Modify the final part of this URL based on the exact REST endpoint required by your Workday configuration
        const workdayEndpoint = `${process.env.WD_API_BASE}/candidates/${candidateId}/backgroundCheckEvents`;

        const response = await fetch(workdayEndpoint, {
            method: 'PATCH', 
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                overallStatus: updatedFields.overallStatus,
                criminalStatus: updatedFields.criminalStatus,
                educationStatus: updatedFields.educationStatus,
                addressStatus: updatedFields.addressStatus,
                updatedAt: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Workday API Update Failed: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error pushing to Workday:", error);
        throw error; 
    }
}

module.exports = { updateCandidateBGVStatus };
