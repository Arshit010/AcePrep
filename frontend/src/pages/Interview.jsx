import { useLocation } from "react-router-dom";

export default function Interview() {
  const location = useLocation();
  const questions = location.state?.questions || [];

  return (
    <div style={{ padding: "40px", color: "white" }}>
      <h1>Interview Questions</h1>

      {questions.length === 0 ? (
        <p>No questions received</p>
      ) : (
        <ol>
          {questions.split("\n").map((q, i) => (
            <li key={i} style={{ marginBottom: "10px" }}>
              {q}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
