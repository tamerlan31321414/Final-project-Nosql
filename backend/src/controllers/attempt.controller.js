import { Quiz } from "../models/Quiz.js";
import { Attempt } from "../models/Attempt.js";
import { computeScore } from "../utils/score.js";

export async function submitAttempt(req, res, next) {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    if (!quiz.isPublished) return res.status(403).json({ error: "Quiz not published" });

    const { answers, startedAt, submittedAt } = req.body || {};
    const { score, maxScore } = computeScore(quiz, answers);

    const sAt = startedAt ? new Date(startedAt) : null;
    const subAt = submittedAt ? new Date(submittedAt) : new Date();
    const durationSec = sAt ? Math.max(0, Math.floor((subAt.getTime() - sAt.getTime()) / 1000)) : 0;

    const attempt = await Attempt.create({
      quizId: quiz._id,
      userId: req.user.id,
      answers: Array.isArray(answers) ? answers : [],
      score,
      maxScore,
      startedAt: sAt,
      submittedAt: subAt,
      durationSec
    });

    await Quiz.updateOne({ _id: quiz._id }, { $inc: { attemptCount: 1 } });

    res.status(201).json(attempt);
  } catch (e) {
    next(e);
  }
}

export async function myAttempts(req, res, next) {
  try {
    const items = await Attempt.find({ userId: req.user.id })
      .sort({ submittedAt: -1 })
      .limit(200)
      .populate("quizId", "title category");
    res.json(items);
  } catch (e) {
    next(e);
  }
}
