// workdayService.js

async function triggerOrchestration(payload) {
    try {
        // 1. Get the Bearer Token using the Refresh Token flow
        const tokenResponse = await fetch(process.env.WD_EXTEND_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${process.env.WD_EXTEND_CLIENT_ID}:${process.env.WD_EXTEND_CLIENT_SECRET}`).toString('base64')
            },
            // THE FIX: Switch to refresh_token and pass the token variable
            body: `grant_type=refresh_token&refresh_token=${process.env.WD_REFRESH_TOKEN}`
        });

        if (!tokenResponse.ok) {
            const err = await tokenResponse.text();
            throw new Error(`Token Auth Failed: ${tokenResponse.status} - ${err}`);
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
