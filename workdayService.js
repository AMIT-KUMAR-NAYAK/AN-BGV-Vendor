// workdayService.js

/**
 * Push the updated BGV status directly to the Workday Orchestration endpoint using Basic Auth
 */
async function updateCandidateBGVStatus(candidateId, updatedFields) {
    try {
        const orchestrationEndpoint = process.env.WD_API_BASE;
        
        // Use your Workday ISU username and password stored in environment variables
        const isuUsername = process.env.WD_ISU_USERNAME;
        const isuPassword = process.env.WD_ISU_PASSWORD;

        const credentials = Buffer.from(`${isuUsername}:${isuPassword}`).toString('base64');

        const response = await fetch(orchestrationEndpoint, {
            method: 'POST', 
            headers: {
                'Authorization': `Basic ${credentials}`,
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
