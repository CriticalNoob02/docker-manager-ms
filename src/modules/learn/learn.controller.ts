import { Request, Response } from "express";
import * as learnService from "./learn.service";

export async function getConcepts(_req: Request, res: Response) {
  res.json(learnService.listConcepts());
}

export async function getConcept(req: Request, res: Response) {
  const concept = learnService.getConceptBySlug(String(req.params.slug));
  if (!concept) {
    res.status(404).json({ error: "Conceito não encontrado" });
    return;
  }
  res.json(concept);
}

export async function getQuiz(req: Request, res: Response) {
  const conceptSlug = req.query.conceptSlug as string | undefined;
  res.json(learnService.getQuiz(conceptSlug));
}

export async function checkAnswer(req: Request, res: Response) {
  const { questionId, answerIndex } = req.body as {
    questionId: string;
    answerIndex: number;
  };

  if (!questionId || answerIndex === undefined) {
    res.status(400).json({ error: "questionId e answerIndex são obrigatórios" });
    return;
  }

  const result = learnService.checkAnswer(questionId, Number(answerIndex));
  if (!result) {
    res.status(404).json({ error: "Pergunta não encontrada" });
    return;
  }

  res.json(result);
}

export async function getContext(_req: Request, res: Response) {
  const context = await learnService.getEnvironmentContext();
  res.json(context);
}
