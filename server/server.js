const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = [
  "http://localhost:3000",
  "https://sat-prep-uaya.onrender.com"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());

// --- Helper: Load question JSON ---
function loadAllQuestions(subject) {
  const dirPath = path.join(__dirname, "split", subject.toLowerCase());
  if (!fs.existsSync(dirPath)) return [];

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith(".json"));
  let allData = [];

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    try {
      const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
      allData = allData.concat(content);
    } catch (err) {
      console.error(`Error reading ${filePath}:`, err);
    }
  }

  return allData;
}

// --- API routes ---

app.get('/api/math', (req, res) => {
  res.json(loadAllQuestions("math"));
});

app.get('/api/reading', (req, res) => {
  res.json(loadAllQuestions("reading"));
});

app.get('/api/math-random', (req, res) => {
  const data = loadAllQuestions("math");
  res.json(data[Math.floor(Math.random() * data.length)]);
});

app.get('/api/reading-random', (req, res) => {
  const data = loadAllQuestions("reading");
  res.json(data[Math.floor(Math.random() * data.length)]);
});

function getDifficultyWeights(difficulty) {
  // Clamp to [1, 3]
  const d = Math.min(Math.max(difficulty, 1), 3);

  // Interpolate linearly:
  // 1 → [easy=0.8, med=0.2, hard=0.0]
  // 2 → [easy=0.2, med=0.6, hard=0.2]
  // 3 → [easy=0.0, med=0.3, hard=0.7]

  const easy = Math.max(0, 0.8 - 0.6 * (d - 1));   // drops from 0.8 → 0.2 → 0
  const med  = Math.max(0, 0.2 + 0.4 * Math.abs(2 - d)); // peaks around mid
  const hard = Math.max(0, 0.7 * (d - 1) / 2);     // rises from 0 → 0.35 → 0.7

  // Normalize so they sum to 1
  const total = easy + med + hard;
  return {
    easy: easy / total,
    med: med / total,
    hard: hard / total,
  };
}

function pickWeightedQuestions(easyQs, medQs, hardQs, count, weights) {
  const easyCount = Math.floor(count * weights.easy);
  const medCount = Math.floor(count * weights.med);
  let hardCount = count - easyCount - medCount; // fill remainder to hit total exactly

  const selected = [];
  selected.push(...pickRandom(easyQs, easyCount));
  selected.push(...pickRandom(medQs, medCount));
  selected.push(...pickRandom(hardQs, hardCount));

  return selected;
}

// helper for random selection
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

app.get('/api/test', (req, res) => {
  const { subject = 'math', domain, count = 10, difficulty = 2 } = req.query;

  if (!['math', 'reading'].includes(subject.toLowerCase())) {
    return res.status(400).json({ error: `Invalid subject (${subject}). Use math or reading.` });
  }

  const subjectDir = path.join(__dirname, 'split', subject.toLowerCase());
  let domainList = [];

  if (Array.isArray(domain)) {
    domainList = domain.map(d => d.toLowerCase());
  } else if (typeof domain === 'string') {
    domainList = domain.split(',').map(d => d.trim().toLowerCase());
  }

  // If no domains specified, use all .json files
  const filesToRead = domainList.length
    ? domainList.map(d => path.join(subjectDir, d.replace(/\s+/g, '_') + '.json'))
    : fs.readdirSync(subjectDir).map(f => path.join(subjectDir, f));

  let allData = [];

  try {
    for (const filePath of filesToRead) {
      if (!fs.existsSync(filePath)) continue;

      // Instead of reading the entire file, parse and take a small random subset
      const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const sampleSize = Math.min(200, json.length); // only take up to 200 random questions per domain
      const sample = json.sort(() => 0.5 - Math.random()).slice(0, sampleSize);
      allData = allData.concat(sample);
    }
  } catch (err) {
    console.error("Error reading JSON files:", err);
    return res.status(500).json({ error: "Error reading question files." });
  }

  if (!allData.length) {
    return res.status(404).json({ error: 'No questions found for the selected domains.' });
  }

  // Shuffle and pick by difficulty weights
  const shuffled = [...allData].sort(() => 0.5 - Math.random());
  const weights = getDifficultyWeights(parseFloat(difficulty));
  const easyQs = shuffled.filter(q => q.difficulty === 'Easy');
  const medQs  = shuffled.filter(q => q.difficulty === 'Medium');
  const hardQs = shuffled.filter(q => q.difficulty === 'Hard');

  const selected = pickWeightedQuestions(easyQs, medQs, hardQs, count, weights);

  res.json({
    subject,
    domains: domainList.length ? domainList : ['All Domains'],
    total: selected.length,
    questions: selected,
  });
});


app.listen(PORT, () => {
  console.log(`✅ Server running on ${PORT}`);
});