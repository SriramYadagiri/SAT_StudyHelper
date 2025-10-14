import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Container } from "react-bootstrap";

function decodeEntities(str) {
  if (!str) return str;
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

export default function Practice() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { state } = loc;
  const { testType = "Math", selectedDomains = [], testLength = 10, numQuestions = 10 } = state || {};

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // store index or text
  const [timeLeft, setTimeLeft] = useState(testLength * 60);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const domainList = useMemo(() => selectedDomains, [selectedDomains]);

  // Fetch questions matching chosen type/domains
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        subject: testType.toLowerCase() === "math" ? "math" : "reading",
        count: numQuestions.toString(),
        difficulty: (state?.difficulty || 2).toString(), // default medium
      });
      selectedDomains.forEach(d => query.append("domain", d));

      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/test?${query.toString()}`)
      const data = await res.json();

      setQuestions(data.questions);
    } catch (err) {
      console.error("Error loading questions:", err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [testType, domainList, numQuestions]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Timer
  useEffect(() => {
    if (loading) return;
    if (timeLeft <= 0) {
      setAutoSubmitted(true);
      handleSubmit();
      return;
    }
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, loading]);

  // handle selecting an answer (index for MCQ, text for free response)
  const handleAnswer = (value) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: value }));
    console.log(answers);
  };

  const handleSubmit = () => {
    // send user to results page with questions + answers
    navigate("/results", { state: { questions, answers, timeLeft, testType, autoSubmitted } });
  };

  if (!state) {
    // no setup state -> redirect back to home/setup
    return (
      <Container className="mt-5">
        <p>No test options provided. Go to <Link to="/setup">Test Setup</Link>.</p>
      </Container>
    );
  }

  if (loading) return <Container className="mt-5">Loading questions...</Container>;
  if (!questions.length) return <Container className="mt-5">No questions found for those filters.</Container>;

  const q = questions[currentIndex];

  return (
    <Container className="mt-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h5 className="mb-0">{testType} — {selectedDomains.join(", ") || "All Domains"}</h5>
          <small className="text-muted">Question {currentIndex + 1} / {questions.length}</small>
        </div>
        <div>
          <h4 className="mb-0">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </h4>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          {/* Render prompt and question (scraped HTML) */}
          {q.prompt && (
            <div className="mb-2" dangerouslySetInnerHTML={{ __html: decodeEntities(q.prompt) }} />
          )}
          {q.question && (
            <div className="mb-2" dangerouslySetInnerHTML={{ __html: decodeEntities(q.question) }} />
          )}

          {/* Answer area: MCQ or free response */}
          {q.choices && q.choices.length > 0 ? (
            <ul className="list-group mt-2">
              {q.choices.map((c, i) => (
                <li className="list-group-item" key={i}>
                  <label className="d-flex align-items-start gap-2">
                    <input
                      type="radio"
                      name={`q${currentIndex}`}
                      checked={answers[currentIndex] === i}
                      onChange={() => handleAnswer(i)}
                      className="mt-1"
                    />
                    <div dangerouslySetInnerHTML={{ __html: decodeEntities(c) }} />
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3">
              <label className="form-label"><strong>Your Answer</strong></label>
              <input
                type="text"
                className="form-control"
                placeholder="Type your answer"
                value={answers[currentIndex] ?? ""}
                onChange={(e) => handleAnswer(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="d-flex justify-content-between">
        <button
          className="btn btn-outline-primary"
          onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
          disabled={currentIndex === 0}
        >
          Previous
        </button>

        <div>
          <button
            className="btn btn-secondary me-2"
            onClick={() => {
              // quick jump to review unanswered
              const nextUnanswered = questions.findIndex((_, idx) => answers[idx] === undefined);
              if (nextUnanswered !== -1) setCurrentIndex(nextUnanswered);
            }}
          >
            Jump to Unanswered
          </button>

          {currentIndex < questions.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setCurrentIndex((i) => i + 1)}>
              Next
            </button>
          ) : (
            <button className="btn btn-success" onClick={handleSubmit}>
              Submit Test
            </button>
          )}
        </div>
      </div>
    </Container>
  );
}