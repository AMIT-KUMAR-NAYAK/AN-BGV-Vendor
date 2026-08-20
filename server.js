const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory Database simulating candidate data from Workday
let candidates = [
  {
    bgvTransactionId: "BGV-2026-000125",
    candidateId: "C-1001",
    applicantId: "APP-5521",
    jobRequisitionId: "REQ-101",
    vendorId: "V-EMICON",
    recruiterName: "Jane Doe",
    overallStatus: "Initiated",
    criminalStatus: "Pending",
    educationStatus: "Pending",
    addressStatus: "Pending"
  }
];

// --- API ENDPOINTS (Testable via Postman) ---

// 1. GET: Fetch all candidates for the UI -- http://localhost:3000/api/candidates
app.get('/api/candidates', (req, res) => {
  res.json(candidates);
});

// 2. POST: Receive new candidate data from Extend App -- http://localhost:3000/api/extend/receive
app.post('/api/extend/receive', (req, res) => {
  const newCandidate = {
    bgvTransactionId: req.body.bgvTransactionId || `BGV-2026-${Math.floor(Math.random() * 10000)}`,
    candidateId: req.body.candidateId,
    applicantId: req.body.applicantId,
    jobRequisitionId: req.body.jobRequisitionId,
    vendorId: req.body.vendorId,
    recruiterName: req.body.recruiterName,
    overallStatus: req.body.overallStatus || "Initiated",
    criminalStatus: req.body.criminalStatus || "Pending",
    educationStatus: req.body.educationStatus || "Pending",
    addressStatus: req.body.addressStatus || "Pending"
  };
  candidates.push(newCandidate);
  res.status(201).json({ message: "Success: Received from Extend", data: newCandidate });
});

// 3. PUT: Update candidate from the UI & simulate POSTing back to Workday
app.put('/api/candidates/:id', (req, res) => {
  const index = candidates.findIndex(c => c.bgvTransactionId === req.params.id);
  if (index !== -1) {
    candidates[index] = { ...candidates[index], ...req.body };
    
    // Simulate Outbound POST back to Workday Extend integration[cite: 2]
    console.log(`\n[POST TO EXTEND APP] Returning Verification Result:`);
    console.log(JSON.stringify(candidates[index], null, 2));
    
    res.json({ message: "Success: Updated & POSTed to Extend", data: candidates[index] });
  } else {
    res.status(404).json({ error: "Candidate not found" });
  }
});

app.listen(PORT, () => {
  console.log(`Emicon BGV Server running on http://localhost:${PORT}`);
});