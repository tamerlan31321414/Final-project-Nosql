import { Router } from "express";
import { auth, roleGuard } from "../middlewares/auth.js";
import {
  addQuestion,
  createQuiz,
  deleteQuestion,
  deleteQuiz,
  getQuiz,
  listMyQuizzes,
  listQuizzes,
  publishQuiz,
  updateQuestion,
  updateQuiz
} from "../controllers/quiz.controller.js";
import { submitAttempt } from "../controllers/attempt.controller.js";
import { quizAnalytics } from "../controllers/analytics.controller.js";

const router = Router();

router.get("/", listQuizzes);
router.get("/mine", auth, roleGuard("admin"), listMyQuizzes);
router.get("/:id", auth, getQuiz);

router.post("/", auth, roleGuard("admin"), createQuiz);
router.patch("/:id", auth, updateQuiz);
router.delete("/:id", auth, deleteQuiz);

router.patch("/:id/publish", auth, publishQuiz);

router.post("/:id/questions", auth, addQuestion);
router.patch("/:id/questions/:qid", auth, updateQuestion);
router.delete("/:id/questions/:qid", auth, deleteQuestion);

router.post("/:id/attempts", auth, submitAttempt);
router.get("/:id/analytics", auth, quizAnalytics);

export default router;
