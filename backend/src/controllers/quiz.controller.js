import { Quiz } from "../models/Quiz.js";
import { Attempt } from "../models/Attempt.js";

function parsePaging(q) {
  const page = Math.max(1, Number(q.page || 1));
  const limit = Math.min(50, Math.max(1, Number(q.limit || 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export async function createQuiz(req, res, next) {
  try {
    const { title, description, category, tags, timeLimitSec } = req.body || {};
    if (!title) return res.status(400).json({ error: "Title required" });

    const quiz = await Quiz.create({
      ownerId: req.user.id,
      title: String(title),
      description: String(description || ""),
      category: String(category || "General"),
      tags: Array.isArray(tags) ? tags.map(String) : [],
      timeLimitSec: timeLimitSec == null ? null : Number(timeLimitSec),
      isPublished: false,
      questions: []
    });

    res.status(201).json(quiz);
  } catch (e) {
    next(e);
  }
}

export async function listQuizzes(req, res, next) {
  try {
    const { page, limit, skip } = parsePaging(req.query);
    const { category, search, sort } = req.query;

    const filter = { isPublished: true };
    if (category) filter.category = String(category);

    if (search) {
      const s = String(search);
      filter.$or = [{ title: { $regex: s, $options: "i" } }, { description: { $regex: s, $options: "i" } }];
    }

    const sortObj = {};
    if (sort === "createdAt") sortObj.createdAt = 1;
    else sortObj.createdAt = -1;

    const [items, total] = await Promise.all([
      Quiz.find(filter).select("_id title description category tags isPublished attemptCount createdAt ownerId").sort(sortObj).skip(skip).limit(limit),
      Quiz.countDocuments(filter)
    ]);

    res.json({ page, limit, total, items });
  } catch (e) {
    next(e);
  }
}

export async function listMyQuizzes(req, res, next) {
  try {
    const { page, limit, skip } = parsePaging(req.query);
    const filter = { ownerId: req.user.id };
    const [items, total] = await Promise.all([
      Quiz.find(filter).select("_id title description category tags isPublished attemptCount createdAt").sort({ createdAt: -1 }).skip(skip).limit(limit),
      Quiz.countDocuments(filter)
    ]);
    res.json({ page, limit, total, items });
  } catch (e) {
    next(e);
  }
}

export async function getQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const isOwner = req.user && String(quiz.ownerId) === String(req.user.id);
    if (!quiz.isPublished && !(req.user?.role === "admin" || isOwner)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json(quiz);
  } catch (e) {
    next(e);
  }
}

export async function updateQuiz(req, res, next) {
  try {
    const { title, description, category, tags, timeLimitSec } = req.body || {};
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const isOwner = String(quiz.ownerId) === String(req.user.id);
    if (!(req.user.role === "admin" || isOwner)) return res.status(403).json({ error: "Forbidden" });

    if (title != null) quiz.title = String(title);
    if (description != null) quiz.description = String(description);
    if (category != null) quiz.category = String(category);
    if (tags != null) quiz.tags = Array.isArray(tags) ? tags.map(String) : [];
    if (timeLimitSec !== undefined) quiz.timeLimitSec = timeLimitSec == null ? null : Number(timeLimitSec);

    await quiz.save();
    res.json(quiz);
  } catch (e) {
    next(e);
  }
}

export async function deleteQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const isOwner = String(quiz.ownerId) === String(req.user.id);
    if (!(req.user.role === "admin" || isOwner)) return res.status(403).json({ error: "Forbidden" });

    await Promise.all([Attempt.deleteMany({ quizId: quiz._id }), Quiz.deleteOne({ _id: quiz._id })]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function publishQuiz(req, res, next) {
  try {
    const { isPublished } = req.body || {};
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const isOwner = String(quiz.ownerId) === String(req.user.id);
    if (!(req.user.role === "admin" || isOwner)) return res.status(403).json({ error: "Forbidden" });

    quiz.isPublished = Boolean(isPublished);
    await quiz.save();
    res.json(quiz);
  } catch (e) {
    next(e);
  }
}

export async function addQuestion(req, res, next) {
  try {
    const { type, text, options, correctOptionIds, points } = req.body || {};
    if (!type || !text) return res.status(400).json({ error: "Missing fields" });

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const isOwner = String(quiz.ownerId) === String(req.user.id);
    if (!(req.user.role === "admin" || isOwner)) return res.status(403).json({ error: "Forbidden" });

    const opts = Array.isArray(options) ? options.map((x) => ({ text: String(x.text || x) })) : [];
    const q = {
      type: type === "multi" ? "multi" : "single",
      text: String(text),
      options: opts,
      correctOptionIds: Array.isArray(correctOptionIds) ? correctOptionIds : [],
      points: points == null ? 1 : Number(points)
    };

    quiz.questions.push(q);
    await quiz.save();
    res.status(201).json(quiz);
  } catch (e) {
    next(e);
  }
}

export async function updateQuestion(req, res, next) {
  try {
    const { text, type, options, correctOptionIds, points } = req.body || {};
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const isOwner = String(quiz.ownerId) === String(req.user.id);
    if (!(req.user.role === "admin" || isOwner)) return res.status(403).json({ error: "Forbidden" });

    const q = quiz.questions.id(req.params.qid);
    if (!q) return res.status(404).json({ error: "Question not found" });

    if (text != null) q.text = String(text);
    if (type != null) q.type = type === "multi" ? "multi" : "single";
    if (options != null) q.options = Array.isArray(options) ? options.map((x) => ({ text: String(x.text || x) })) : [];
    if (correctOptionIds != null) q.correctOptionIds = Array.isArray(correctOptionIds) ? correctOptionIds : [];
    if (points != null) q.points = Number(points);

    await quiz.save();
    res.json(quiz);
  } catch (e) {
    next(e);
  }
}

export async function deleteQuestion(req, res, next) {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const isOwner = String(quiz.ownerId) === String(req.user.id);
    if (!(req.user.role === "admin" || isOwner)) return res.status(403).json({ error: "Forbidden" });

    const q = quiz.questions.id(req.params.qid);
    if (!q) return res.status(404).json({ error: "Question not found" });

    q.deleteOne();
    await quiz.save();
    res.json(quiz);
  } catch (e) {
    next(e);
  }
}
