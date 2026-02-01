import mongoose from "mongoose";
import { Quiz } from "../models/Quiz.js";
import { Attempt } from "../models/Attempt.js";

export async function quizAnalytics(req, res, next) {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const isOwner = String(quiz.ownerId) === String(req.user.id);
    if (!(req.user.role === "admin" || isOwner)) return res.status(403).json({ error: "Forbidden" });

    const quizId = new mongoose.Types.ObjectId(req.params.id);

    const data = await Attempt.aggregate([
      { $match: { quizId, submittedAt: { $ne: null } } },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: "$quizId",
                totalAttempts: { $sum: 1 },
                avgScore: { $avg: "$score" },
                maxScore: { $max: "$score" },
                minScore: { $min: "$score" },
                avgDuration: { $avg: "$durationSec" }
              }
            }
          ],
          byDay: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" } },
                attempts: { $sum: 1 },
                avgScore: { $avg: "$score" }
              }
            },
            { $sort: { _id: 1 } },
            { $limit: 14 }
          ],
          top: [
            { $sort: { score: -1, durationSec: 1 } },
            { $limit: 5 },
            { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
            { $project: { _id: 0, score: 1, durationSec: 1, user: { name: "$user.name", email: "$user.email" } } }
          ]
        }
      },
      { $project: { summary: { $ifNull: [{ $arrayElemAt: ["$summary", 0] }, {}] }, byDay: 1, top: 1 } }
    ]);

    res.json({ quiz: { id: String(quiz._id), title: quiz.title }, analytics: data[0] || { summary: {}, byDay: [], top: [] } });
  } catch (e) {
    next(e);
  }
}
