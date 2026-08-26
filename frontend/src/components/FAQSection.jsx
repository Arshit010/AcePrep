import { useState } from "react";
import "./FAQSection.css";
import Meteors from "./ui/Meteors";

function FAQSplitItem({ q, a }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`faq-split-item ${open ? "open" : ""}`}>
      <button className="faq-split-question" onClick={() => setOpen(!open)}>
        <span className="faq-toggle-icon" />
        <span className="faq-question-text">{q}</span>
      </button>
      <div className="faq-split-answer-wrap">
        <p className="faq-split-answer-text">{a}</p>
      </div>
    </div>
  );
}

export default function FAQSection({
  title = ["Frequently", "Asked", "Questions"],
  items = [],
  showMeteors = true
}) {
  const titleWords = Array.isArray(title)
    ? title
    : typeof title === "string"
    ? title.split(/[\n\s]+/).filter(Boolean)
    : [title];

  return (
    <section className="faq-split-container">
      {showMeteors && <Meteors number={25} />}
      <div className="faq-split-left">
        <h2 className="faq-split-title">
          {titleWords.map((word, i) => (
            <span key={i} className="faq-title-word">
              {word}
            </span>
          ))}
        </h2>
      </div>

      <div className="faq-split-right">
        <div className="faq-split-list">
          {items.map((item, idx) => (
            <FAQSplitItem key={idx} q={item.q || item.title || item.question} a={item.a || item.desc || item.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
