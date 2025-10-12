import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";

const testDomains = {
  Math: [
    "Algebra",
    "Advanced Math",
    "Problem-Solving and Data Analysis",
    "Geometry and Trigonometry",
  ],
  "Reading & Writing": [
    "Information and Ideas",
    "Craft and Structure",
    "Expression of Ideas",
    "Standard English Conventions",
  ],
};

export default function Setup() {
  const navigate = useNavigate();
  const [testType, setTestType] = useState("");
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [testLength, setTestLength] = useState(10);
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState(2); // 1-Easy, 2-Medium, 3-Hard

  const handleDomainChange = (domain) =>
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );

  const startTest = () => {
    if (!testType || selectedDomains.length === 0) {
      alert("Please select a test type and at least one domain.");
      return;
    }
    // Navigate to practice page, pass options via state
    navigate("/practice", {
      state: { testType, selectedDomains, testLength, numQuestions, difficulty },
    });
  };

  return (
    <Container className="mt-4">
      <h2>Quiz Setup</h2>
      <div className="card p-3 mt-3">
        <div className="mb-3">
          <label className="form-label"><strong>Test Type</strong></label>
          <select
            className="form-select"
            value={testType}
            onChange={(e) => {
              setTestType(e.target.value);
              setSelectedDomains([]);
            }}
          >
            <option value="">-- Choose Test Type --</option>
            <option value="Math">Math</option>
            <option value="Reading & Writing">Reading & Writing</option>
          </select>
        </div>

        {testType && (
          <div className="mb-3">
            <label className="form-label"><strong>Domains</strong></label>
            <div>
              {testDomains[testType].map((d) => (
                <div className="form-check" key={d}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`dom-${d}`}
                    checked={selectedDomains.includes(d)}
                    onChange={() => handleDomainChange(d)}
                  />
                  <label className="form-check-label" htmlFor={`dom-${d}`}>
                    {d}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label"><strong>Test Duration</strong></label>
            <select
              className="form-select"
              value={testLength}
              onChange={(e) => setTestLength(Number(e.target.value))}
            >
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
            </select>
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label"><strong>Number of Questions</strong></label>
            <select
              className="form-select"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
          </div>
        </div>

        {/* Difficulty Slider */}
        <div className="mb-4">
          <label className="form-label">
            <strong>Difficulty: </strong>
            <span className="ms-2">{difficulty}</span>
          </label>
          <input
            type="range"
            className="form-range"
            min="1"
            max="3"
            step="0.05"
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
          />
          <div className="d-flex justify-content-between small text-muted">
            <span>Easy</span>
            <span>Medium</span>
            <span>Hard</span>
          </div>
        </div>

        <div className="d-flex justify-content-end">
          <button className="btn btn-primary" onClick={startTest}>
            Start Test
          </button>
        </div>
      </div>
    </Container>
  );
}