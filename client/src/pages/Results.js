import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Container, Button } from "react-bootstrap";

function decodeEntities(str) {
  if (!str) return str;
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

export default function Results() {
  const loc = useLocation();
  const { state } = loc || {};

  const [correct, setCorrect] = useState([]);
  const [wrong, setWrong] = useState([]);
  const [showExplanation, setShowExplanation] = useState({});
  const [showWrongOnly, setShowWrongOnly] = useState(false);

  const questions = state?.questions || [];
  const answers = state?.answers || {};
  const timeLeft = state?.timeLeft || 0;
  const testType = state?.testType || "Unknown Test";
  const autoSubmitted = state?.autoSubmitted || false;

  const links = {
    "Math": {
      "Algebra": "https://www.khanacademy.org/test-prep/v2-sat-math/x0fcc98a58ba3bea7:algebra-harder",
      "Advanced Math": "https://www.khanacademy.org/test-prep/v2-sat-math/x0fcc98a58ba3bea7:advanced-math-harder",
      "Problem-Solving and Data Analysis": "https://www.khanacademy.org/test-prep/v2-sat-math/x0fcc98a58ba3bea7:problem-solving-and-data-analysis-harder",
      "Geometry and Trigonometry": "https://www.khanacademy.org/test-prep/v2-sat-math/x0fcc98a58ba3bea7:geometry-and-trigonometry-harder",
    },
    "Reading & Writing": {
      "Information and Ideas": "https://www.khanacademy.org/test-prep/sat-reading-and-writing/x0d47bcec73eb6c4b:advanced-information-and-ideas",
      "Craft and Structure": "https://www.khanacademy.org/test-prep/v2-sat-english/x7f8b4f3a5a6d0e11:reading-craft-and-structure-harder",
      "Expression of Ideas": "https://www.khanacademy.org/test-prep/sat-reading-and-writing/x0d47bcec73eb6c4b:advanced-expression-of-ideas-and-standard-english-conventions",
      "Standard English Conventions": "https://www.khanacademy.org/test-prep/sat-reading-and-writing/x0d47bcec73eb6c4b:advanced-expression-of-ideas-and-standard-english-conventions"
    }
  };

  useEffect(() => {
    if (!questions.length) return;
    const c = [];
    const w = [];
    questions.forEach((q, idx) => {
      if (answers[idx] === undefined) {
        w.push(idx);
      } else {
        if (answers[idx] === q.answer) c.push(idx);
        else w.push(idx);
      }
    });
    setCorrect(c);
    setWrong(w);
  }, [questions, answers]);

  const toggleExplanation = (i) => {
    setShowExplanation((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  if (!state) {
    return (
      <Container className="mt-5">
        <p>No results to show. Take a test first.</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2>Results</h2>
      <div className="card p-3 mb-3">
        <p><strong>Test:</strong> {testType}</p>
        <p><strong>Score:</strong> {correct.length} / {questions.length}</p>
        <p><strong>Questions:</strong> {questions.length}</p>
        <p>
          <strong>Time Remaining at Submit:</strong>{" "}
          {Math.floor(timeLeft / 60)}:
          {String(timeLeft % 60).padStart(2, "0")}
        </p>
        {autoSubmitted && (
          <p className="text-warning">
            The test auto-submitted when the timer reached zero.
          </p>
        )}
      </div>

      <div className="d-flex justify-content-end mb-3">
        <Button
          variant={showWrongOnly ? "secondary" : "outline-secondary"}
          onClick={() => setShowWrongOnly(prev => !prev)}
        >
          {showWrongOnly ? "Show All Questions" : "Show Only Wrong Answers"}
        </Button>
      </div>

      <div>
        {questions.map((q, i) => {
          if (showWrongOnly && correct.includes(i)) return null;

          const isCorrect = !showWrongOnly && correct.includes(i);
          const isWrong = showWrongOnly || wrong.includes(i);
          return (
            <div
              className={`card mb-2 ${
                isCorrect
                  ? "bg-success bg-opacity-10"
                  : isWrong
                  ? "bg-danger bg-opacity-10"
                  : ""
              }`}
              key={i}
            >
              <div className="card-body">
                <h2 className="h5">Question {i + 1}</h2>
                <div className="mb-2">
                  {/* Question header info */}
                  <table
                    className="table mb-3"
                    style={{
                      tableLayout: "fixed",
                      width: "100%",
                      borderCollapse: "collapse",
                      backgroundColor: "transparent",
                    }}
                  >
                    <thead
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.05)",
                        backdropFilter: "blur(2px)",
                      }}
                    >
                      <tr>
                        <th style={{ width: "33%", textAlign: "center", backgroundColor: "rgba(255, 255, 255, 0.05)" }}>Domain</th>
                        <th style={{ width: "34%", textAlign: "center", backgroundColor: "rgba(255, 255, 255, 0.05)" }}>Skill</th>
                        <th style={{ width: "33%", textAlign: "center", backgroundColor: "rgba(255, 255, 255, 0.05)" }}>Difficulty</th>
                      </tr>
                    </thead>
                    <tbody
                      style={{
                        backgroundColor: "transparent",
                      }}
                    >
                      <tr>
                        <td
                          style={{
                            textAlign: "center",
                            backgroundColor: "transparent",
                          }}
                        >
                          <a style={{textDecoration: "none"}} href={links[testType][q.domain]} target="_blank">{q.domain || "N/A"}</a>
                        </td>
                        <td
                          style={{
                            textAlign: "center",
                            backgroundColor: "transparent",
                          }}
                        >
                          {q.skill || "N/A"}
                        </td>
                        <td
                          style={{
                            textAlign: "center",
                            backgroundColor: "transparent",
                            color:
                              q.difficulty === "Easy"
                                ? "MediumSeaGreen"
                                : q.difficulty === "Medium"
                                ? "#b58900"
                                : q.difficulty === "Hard"
                                ? "salmon"
                                : "inherit",
                            fontWeight: "bold",
                          }}
                        >
                          {q.difficulty ? q.difficulty : "N/A"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div
                  dangerouslySetInnerHTML={{
                    __html: decodeEntities(q.prompt || ""),
                  }}
                />
                <div
                  dangerouslySetInnerHTML={{
                    __html: decodeEntities(q.question || ""),
                  }}
                />
                <p>
                  <strong>Your answer:</strong>{" "}
                  {answers[i] === undefined
                    ? "(no response)"
                    : typeof answers[i] === "string"
                    ? answers[i]
                    : "ABCD".charAt(answers[i])}
                </p>
                <p>
                  <strong>Correct answer:</strong>{" "}
                  {typeof q.answer === "number"
                    ? String.fromCharCode(65 + q.answer)
                    : q.answer}
                </p>

                {q.explanation && (
                  <>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => toggleExplanation(i)}
                    >
                      {showExplanation[i] ? "Hide Explanation" : "Show Explanation"}
                    </Button>
                    {showExplanation[i] && (
                      <div className="mt-2">
                        <strong>Explanation:</strong>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: decodeEntities(q.explanation),
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  );
}