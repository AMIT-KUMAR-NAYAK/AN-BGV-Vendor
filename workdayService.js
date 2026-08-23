// workdayService.js

/**
 * Securely fetch a temporary Bearer Access Token using Client Credentials
 */
async function getWorkdayAccessToken() {
    const credentials = Buffer.from(`${process.env.WD_CLIENT_ID}:${process.env.WD_CLIENT_SECRET}`).toString('base64');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials'); // Switched to client_credentials grant

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
