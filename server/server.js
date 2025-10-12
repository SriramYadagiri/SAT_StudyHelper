const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// --- Helper: Load question JSON ---
function loadQuestions(filename) {
  const filePath = path.join(__dirname, filename);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return [];
}

// --- Helper: Get random subset ---
function getRandomSubset(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// --- API routes ---

app.get('/api/math', (req, res) => {
  res.json(loadQuestions('math-questions.json'));
});

app.get('/api/reading', (req, res) => {
  res.json(loadQuestions('reading-questions.json'));
});

app.get('/api/math-random', (req, res) => {
  const data = loadQuestions('math-questions.json');
  res.json(data[Math.floor(Math.random() * data.length)]);
});

app.get('/api/reading-random', (req, res) => {
  const data = loadQuestions('reading-questions.json');
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
  const { subject = 'math', domain, count = 10, difficulty = 2} = req.query;

  // Map subject to file
  const fileMap = {
    math: 'math-questions.json',
    reading: 'reading-questions.json'
  };
  const filename = fileMap[subject.toLowerCase()];
  if (!filename) {
    return res.status(400).json({ error: 'Invalid subject. Use math or reading.' });
  }

  let data = loadQuestions(filename);

  // Support multiple domains
  // domain can be: ?domain=Algebra,Advanced%20Math or ?domain[]=Algebra&domain[]=Advanced%20Math
  let domainList = [];
  if (Array.isArray(domain)) {
    domainList = domain.map((d) => d.toLowerCase());
  } else if (typeof domain === "string") {
    domainList = domain.split(",").map((d) => d.trim().toLowerCase());
  }

  if (domainList.length > 0) {
    data = data.filter(
      (q) => q.domain && domainList.some((d) => q.domain.toLowerCase().includes(d))
    );
  }

  if (data.length === 0) {
    return res.status(404).json({ error: 'No questions found for the selected domains.' });
  }

  // Random subset
  const shuffled = [...data].sort(() => 0.5 - Math.random());

  // Difficulty-based selection
  const weights = getDifficultyWeights(parseFloat(difficulty));
  const easyQs = shuffled.filter(q => q.difficulty === 'Easy');
  const medQs = shuffled.filter(q => q.difficulty === 'Medium');
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
  console.log(`✅ Server running at http://localhost:${PORT}`);
});