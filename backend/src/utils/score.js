export function computeScore(quiz, answers) {
  const map = new Map();
  for (const a of answers || []) map.set(String(a.questionId), a.selectedOptionIds || []);
  let score = 0;
  let maxScore = 0;

  for (const q of quiz.questions) {
    const pts = Number(q.points || 0);
    maxScore += pts;

    const selected = map.get(String(q._id)) || [];
    const selectedSet = new Set(selected.map(String));
    const correctSet = new Set((q.correctOptionIds || []).map(String));

    const ok = selectedSet.size === correctSet.size && [...selectedSet].every((x) => correctSet.has(x));
    if (ok) score += pts;
  }
  return { score, maxScore };
}
