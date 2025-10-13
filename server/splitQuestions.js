const fs = require('fs');
const path = require('path');

function splitByDomain(inputFile, outputDir, numParts = 4) {
  console.log(`📂 Splitting ${inputFile}...`);
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

  // Group by domain
  const byDomain = {};
  for (const item of data) {
    const domain = item.domain || "Unknown";
    if (!byDomain[domain]) byDomain[domain] = [];
    byDomain[domain].push(item);
  }

  // Create output directory if not exists
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Split into roughly equal parts (4 by default)
  const domains = Object.keys(byDomain);
  const chunkSize = Math.ceil(domains.length / numParts);

  for (let i = 0; i < numParts; i++) {
    const chunkDomains = domains.slice(i * chunkSize, (i + 1) * chunkSize);
    const chunkData = chunkDomains.flatMap(d => byDomain[d]);
    const outPath = path.join(outputDir, `part${i + 1}.json`);
    fs.writeFileSync(outPath, JSON.stringify(chunkData, null, 2));
    console.log(`✅ Wrote ${outPath} (${chunkData.length} items)`);
  }
}

splitByDomain('math-questions.json', 'split/math');
splitByDomain('reading-questions.json', 'split/reading');

console.log("🎉 Done! Files saved in ./split/math and ./split/reading");