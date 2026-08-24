// workdayService.js

/**
 * Push the updated BGV status directly to the Workday Orchestration 
 * using the Extend App API Client credentials.
 */
async function triggerOrchestration(payload) {
    try {
        // 1. Get the Extend App Bearer Token
        const tokenResponse = await fetch(process.env.WD_EXTEND_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                // Basic Auth encoding of your Extend App Client ID and Secret
                'Authorization': 'Basic ' + Buffer.from(`${process.env.WD_EXTEND_CLIENT_ID}:${process.env.WD_EXTEND_CLIENT_SECRET}`).toString('base64')
            },
            body: 'grant_type=client_credentials'
        });

        if (!tokenResponse.ok) {
            const err = await tokenResponse.text();
            throw new Error(`Extend Token Auth Failed: ${tokenResponse.status} - ${err}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 2. POST the payload to the Orchestration Launch URL
        const orchResponse = await fetch(process.env.WD_ORCH_LAUNCH_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!orchResponse.ok) {
            const err = await orchResponse.text();
            throw new Error(`Orchestration Launch Failed: ${orchResponse.status} - ${err}`);
        }

        return await orchResponse.json();
    } catch (error) {
        console.error("Integration Error:", error);
        throw error;
    }
}

module.exports = { triggerOrchestration };
