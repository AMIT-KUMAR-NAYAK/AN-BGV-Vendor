// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let transactionCounter = 2; 

// In-memory Database simulating candidate records
let candidates = [
  {
    bgvTransactionId: "BGV-2026-0001",
    candidateId: "AN0001",
    name: "Amit Kumar Nayak",
    applicantId: "APP-5521",
    jobRequisitionId: "REQ-101",
    vendorId: "EM-0001",
    recruiterName: "Jane Doe",
    overallStatus: "Initiated",
    criminalStatus: "Pending",
    educationStatus: "Pending",
    addressStatus: "Pending",
    isSubmitted: false,
    updatedAt: new Date().toISOString()
  }
];

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. GET: Provide all candidate data (Submitted or not)
app.get('/api/candidates', (req, res) => {
  res.status(200).json(candidates);
});

// 2. GET (DEQUEUE): Provide submitted candidates and remove them from memory
app.get('/api/candidates/submitted', (req, res) => {
  const submittedCandidates = candidates.filter(c => c.isSubmitted === true);
  candidates = candidates.filter(c => c.isSubmitted === false);
  res.status(200).json(submittedCandidates);
});

// 3. POST: Accept candidate data and load into BGV
app.post('/api/candidates', (req, res) => {
  const payloadItems = Array.isArray(req.body) ? req.body : [req.body];
  const hasRestrictedField = payloadItems.some(item => item.bgvTransactionId !== undefined);
  
  if (hasRestrictedField) {
    return res.status(400).json({
      error: "Validation Error: 'bgvTransactionId' cannot be passed in the request body."
    });
  }

  const ingestedCandidates = [];

  payloadItems.forEach(body => {
    const uniqueBvgId = `BGV-2026-${String(transactionCounter++).padStart(4, '0')}`;

    const newCandidate = {
      bgvTransactionId: uniqueBvgId,
      candidateId: body["Candidate ID"] || body.candidateId || "N/A",
      name: body["Name"] || body.name || "Unknown Candidate",
      applicantId: body["Applicant ID"] || body.applicantId || `APP-${Math.floor(1000 + Math.random() * 9000)}`,
      jobRequisitionId: body["Job Requisition ID"] || body.jobRequisitionId || "REQ-N/A",
      vendorId: body["BGV_Vendor_ID"] || body.vendorId || "EM-0001",
      recruiterName: body["Recruiter Name"] || body.recruiterName || "Workday System",
      overallStatus: body.overallStatus || "Initiated",
      criminalStatus: body.criminalStatus || "Pending",
      educationStatus: body.educationStatus || "Pending",
      addressStatus: body.addressStatus || "Pending",
      isSubmitted: false,
      updatedAt: new Date().toISOString()
    };

    candidates.push(newCandidate);
    ingestedCandidates.push(newCandidate);
  });

  res.status(201).json({
    message: `Processed ${ingestedCandidates.length} record(s).`,
    data: ingestedCandidates.length === 1 ? ingestedCandidates[0] : ingestedCandidates
  });
});

// 4. PUT: Local update for BGV review
app.put('/api/candidates/:id', (req, res) => {
  const { id } = req.params;
  const index = candidates.findIndex(c => c.bgvTransactionId === id || c.candidateId === id);

  if (index !== -1) {
    // Update local database (safely merges the isSubmitted boolean from the frontend payload)
    candidates[index] = {
      ...candidates[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.status(200).json({
      message: req.body.isSubmitted ? "Candidate marked as submitted and queued for pickup." : "Candidate verification progress saved.",
      data: candidates[index]
    });
  } else {
    res.status(404).json({ error: "Candidate record not found." });
  }
});

app.listen(PORT, () => {
  console.log(`Emicon BGV Server running on http://localhost:${PORT}`);
});
