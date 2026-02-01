import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { myAttempts } from "../controllers/attempt.controller.js";

const router = Router();

router.get("/attempts", auth, myAttempts);

export default router;
