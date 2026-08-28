"use client";

export type Question = {
  id: string;
  type: "single" | "multiple" | "boolean";
  prompt: string;
  options: { id: string; label: string }[];
};
type Answer = string | string[] | undefined;

export function QuestionRenderer({
  question,
  answer,
  onAnswer,
}: {
  question: Question;
  answer: Answer;
  onAnswer: (answer: Answer) => void;
}) {
  const multiple = question.type === "multiple";
  const selected = (id: string) =>
    Array.isArray(answer) ? answer.includes(id) : answer === id;
  const choose = (id: string) => {
    if (!multiple) return onAnswer(id);
    const current = Array.isArray(answer) ? answer : [];
    onAnswer(
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  };
  return (
    <section className="question-panel" aria-live="polite">
      <p className="question-count">Question</p>
      <h1>{question.prompt}</h1>
      <div
        className="answer-list"
        role={multiple ? "group" : "radiogroup"}
        aria-label="Answer options"
      >
        {question.options.map((option) => (
          <label
            className={`answer-option ${selected(option.id) ? "chosen" : ""}`}
            key={option.id}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={question.id}
              checked={selected(option.id)}
              onChange={() => choose(option.id)}
            />
            <span className="control" aria-hidden="true" />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
