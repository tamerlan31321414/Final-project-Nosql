import mongoose from "mongoose";

const OptionSchema = new mongoose.Schema(
  { text: { type: String, required: true, trim: true } },
  { _id: true }
);

const QuestionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["single", "multi"], required: true },
    text: { type: String, required: true, trim: true },
    options: { type: [OptionSchema], default: [] },
    correctOptionIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    points: { type: Number, default: 1, min: 0 }
  },
  { _id: true }
);

const QuizSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    category: { type: String, default: "General", index: true },
    tags: { type: [String], default: [] },
    isPublished: { type: Boolean, default: false, index: true },
    timeLimitSec: { type: Number, default: null },
    questions: { type: [QuestionSchema], default: [] },
    attemptCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

QuizSchema.index({ ownerId: 1, createdAt: -1 });
QuizSchema.index({ isPublished: 1, category: 1, createdAt: -1 });

export const Quiz = mongoose.model("Quiz", QuizSchema);
