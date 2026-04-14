import { Router } from "express";
import * as learnController from "./learn.controller";

const router = Router();

// Lista resumida de todos os conceitos Docker (para cards/navegação)
router.get("/concepts", learnController.getConcepts);

// Detalhe completo de um conceito (analogia, comandos, tips, etc.)
router.get("/concepts/:slug", learnController.getConcept);

// Perguntas do quiz — filtráveis por ?conceptSlug=container
router.get("/quiz", learnController.getQuiz);

// Valida resposta: POST { questionId, answerIndex }
router.post("/quiz/answer", learnController.checkAnswer);

// Dicas personalizadas baseadas no ambiente Docker atual do usuário
router.get("/context", learnController.getContext);

export default router;
