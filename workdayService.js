// workdayService.js

/**
 * Generates an OAuth token using Workday Core Tenant Refresh Token 
 * and pushes the BGV status payload directly to the Workday Orchestration.
 */
async function triggerOrchestration(payload) {
    try {
        // 1. Perfectly encode the payload for Workday using URLSearchParams
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', process.env.WD_REFRESH_TOKEN);
        params.append('client_id', process.env.WD_EXTEND_CLIENT_ID);
        params.append('client_secret', process.env.WD_EXTEND_CLIENT_SECRET);

        // 2. Request the Bearer Token from the Workday Core Tenant
        // (URLSearchParams automatically sets the 'application/x-www-form-urlencoded' header)
        const tokenResponse = await fetch(process.env.WD_EXTEND_TOKEN_URL, {
            method: 'POST',
            body: params
        });

        if (!tokenResponse.ok) {
            const err = await tokenResponse.text();
            throw new Error(`Extend Token Auth Failed: ${tokenResponse.status} - ${err}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 3. POST the payload to the Orchestration Launch URL
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
