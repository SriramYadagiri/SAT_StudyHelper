const puppeteer = require('puppeteer');
const { setTimeout } = require ("timers/promises");
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // show browser so you can debug
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1200 });

  // 1. Go to the SAT bank page
  await page.goto('https://satsuitequestionbank.collegeboard.org/digital/search', { waitUntil: 'networkidle2' });

  // 2. Select a dropdown option (adjust selector + value for your site)
  await page.select('#selectAssessmentType', '99'); // Select "SAT Suite"
  await page.waitForSelector('#selectTestType', { visible: true }); // wait for next dropdown to appear
  await page.select('#selectTestType', '1'); // Select "Reading and Writing / Math"
  await page.waitForSelector('.banner-close-button', { visible: true }); // wait for accept cookies banner close button to appear
  await page.click('.banner-close-button'); // close the accept cookies banner
  await setTimeout(2000);

  // Check all the domains
  await page.waitForSelector('.cb-checkbox input[type="checkbox"]', { visible: true });
  const checkboxes = await page.$$('.cb-checkbox input[type="checkbox"]');
  for (let i = 0; i < 4; i++) {
    const checkbox = checkboxes[i];
    await checkbox.click();
  }
  
  await setTimeout(1000); // wait for search button to be clickable
  await page.click('button.cb-btn.cb-btn-primary'); ; // click search button

  // 3. Scrape questions
  await page.waitForSelector('#results-table', { visible: true }); // adjust selector to match questions
  const pageSizeButtons = await page.$$('.page-size button');
  const lastButton = pageSizeButtons[pageSizeButtons.length - 1]; // Get the last button (e.g., 100)
  await lastButton.click(); // Expand to biggest question number size

  
  let questionButtons = await page.$$('.view-question-button');

  let allQuestions = [];
  for (let pgNo = 0; pgNo < 31; pgNo++) {
    for (let i = 0; i < questionButtons.length; i++) {
      questionButtons = await page.$$('.view-question-button')
      const btn = questionButtons[i];

      const questionId = await page.evaluate(el => el.innerText, btn);
      console.log("Question Number:", i, "Page:", pgNo, "Question ID:", questionId);

      await btn.click();
      await page.waitForSelector('.question-info', { visible: true }); // adjust selector to match question content

      const svgHTML = await page.evaluate(() => {
        const fig = document.querySelector("figure.image");
        const svg = fig?.querySelector("svg");
        if (!svg) return null;
        return svg.outerHTML;
      });

      if (svgHTML) {
        const filename = `stimulus_images/${questionId}.svg`;
        fs.writeFileSync(filename, svgHTML);

        // Replace figure with <img> in the page
        await page.evaluate((file) => {
          const fig = document.querySelector("figure.image");
          if (fig) {
            const img = document.createElement("img");
            img.src = file;
            img.alt = "Stimulus Image";
            fig.replaceWith(img);
          }
        }, filename);
      }

      // After opening modal
      const questionData = await page.evaluate((questionId) => {

        document.querySelectorAll("mjx-container").forEach(mjx => {
          const svg = mjx.querySelector("mjx-container svg");
          if (svg) {
            // Replace the whole container with just the MathML
            mjx.replaceWith(svg.cloneNode(true));
          }
        });

        const prompt = document.querySelector('.prompt');
        let isPrompt = prompt.children.length > 0;

        const question = document.querySelector('.question').outerHTML.replaceAll("\n", "");
        question.replaceAll("blank", "");
        question.replaceAll("<br>", "");

        const domain = document.querySelectorAll('.col-content')[2].textContent;
        const skill = document.querySelectorAll('.col-content')[3].textContent;
        const choicesDiv = Array.from(document.querySelectorAll('.answer-choices li'));

        const rationale = document.querySelectorAll('.rationale p')
        const difficulty = document.querySelector('.col-content .tqdifficulty').getAttribute("aria-label") || null;

        let choices = choicesDiv.map((el) => el.innerHTML.replaceAll("\n", ""));
        let answer = "ABCD".indexOf(rationale[0].innerText.charAt(7));

        let explanation = document.querySelector('.rationale div').innerHTML.replaceAll("\n", "<br>");

        return { id: questionId, prompt: isPrompt ? prompt.outerHTML.replaceAll("\n", "<br>") : null, question, domain, skill, difficulty, choices, answer, explanation };
      });

      if (!questionData) {
        console.log("Skipping question due to missing answer:", questionId);
        await page.click('.cb-glyph.cb-x-mark'); // close modal
        continue;
      }

      // Add the filename reference to your object
      allQuestions.push(questionData);

      // Close the modal
      await page.click('.cb-glyph.cb-x-mark'); // adjust selector
    }

    // Go to next page
    const nextButton = await page.$('#undefined_next');
    await nextButton.click();
  }

  // 4. Save to JSON
  fs.writeFileSync('reading-questions.json', JSON.stringify(allQuestions, null, 2));

  await browser.close();
})();
