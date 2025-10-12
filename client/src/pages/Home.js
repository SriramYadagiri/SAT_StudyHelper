import { Container } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <Container className="text-center mt-5">
      <h1 className="display-6 fw-bold mb-3">Welcome to SAT StudyHelper</h1>
      <p className="lead">
        Personalized timed SAT practice. Choose a section, pick domains, then take a timed practice quiz.
      </p>
      <div className="d-flex justify-content-center gap-2 mt-3">
        <Link to="/setup" className="btn btn-primary btn-lg">
          Start Practicing
        </Link>
        <Link to="/about" className="btn btn-outline-secondary btn-lg">
          Learn More
        </Link>
      </div>
    </Container>
  );
}