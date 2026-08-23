// workdayService.js

/**
 * Securely fetch a temporary Bearer Access Token using Client Credentials
 */
async function getWorkdayAccessToken() {
    const clientId = process.env.WD_CLIENT_ID;
    const clientSecret = process.env.WD_CLIENT_SECRET;
    const tokenEndpoint = process.env.WD_TOKEN_ENDPOINT;

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    // Explicitly format as standard URL-encoded string to avoid 400 Invalid Request
    const details = {
        grant_type: 'client_credentials'
    };
    
    const formBody = Object.keys(details)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(details[key]))
        .join('&');

    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: formBody
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Workday Auth Failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.access_token; 
}

/**
 * Push the updated BGV status to the Workday Orchestration endpoint
 */
async function updateCandidateBGVStatus(candidateId, updatedFields) {
    try {
        const accessToken = await getWorkdayAccessToken();
        
        const orchestrationEndpoint = process.env.WD_API_BASE;

        const response = await fetch(orchestrationEndpoint, {
            method: 'POST', 
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                candidateId: candidateId,
                overallStatus: updatedFields.overallStatus,
                criminalStatus: updatedFields.criminalStatus,
                educationStatus: updatedFields.educationStatus,
                addressStatus: updatedFields.addressStatus,
                updatedAt: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Workday Orchestration Launch Failed: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error pushing to Workday Orchestration:", error);
        throw error; 
    }
}

module.exports = { updateCandidateBGVStatus };
