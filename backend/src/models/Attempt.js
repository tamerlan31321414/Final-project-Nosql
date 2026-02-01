import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedOptionIds: { type: [mongoose.Schema.Types.ObjectId], default: [] }
  },
  { _id: false }
);

const AttemptSchema = new mongoose.Schema(
  {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    answers: { type: [AnswerSchema], default: [] },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    startedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null, index: true },
    durationSec: { type: Number, default: 0 }
  },
  { timestamps: true }
);

AttemptSchema.index({ quizId: 1, submittedAt: -1 });
AttemptSchema.index({ userId: 1, submittedAt: -1 });

export const Attempt = mongoose.model("Attempt", AttemptSchema);
