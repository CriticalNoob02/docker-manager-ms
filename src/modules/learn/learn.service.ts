// ──────────────────────────────────────────────────────────────
// learn.service.ts — Combina conteúdo estático com contexto
//   dinâmico do ambiente Docker atual
// ──────────────────────────────────────────────────────────────

import docker from "../../config/docker";
import { concepts, quizQuestions, swarmConcepts, swarmQuiz } from "./learn.data";

const allConcepts = [...concepts, ...swarmConcepts];
const allQuizQuestions = [...quizQuestions, ...swarmQuiz];

// ─── Conceitos ───────────────────────────────────────────────

export function listConcepts() {
  return allConcepts.map(({ slug, title, emoji, summary, relatedConcepts }) => ({
    slug,
    title,
    emoji,
    summary,
    relatedConcepts,
  }));
}

export function getConceptBySlug(slug: string) {
  return allConcepts.find((c) => c.slug === slug) ?? null;
}

// ─── Quiz ─────────────────────────────────────────────────────

export function getQuiz(conceptSlug?: string) {
  const questions = conceptSlug
    ? allQuizQuestions.filter((q) => q.conceptSlug === conceptSlug)
    : allQuizQuestions;

  // Retorna as perguntas sem o correctIndex exposto — o frontend
  // submete a resposta e o backend valida (ver checkAnswer)
  return questions.map(({ id, question, options, conceptSlug: cs }) => ({
    id,
    question,
    options,
    conceptSlug: cs,
  }));
}

export function checkAnswer(questionId: string, answerIndex: number) {
  const question = allQuizQuestions.find((q) => q.id === questionId);
  if (!question) return null;

  const correct = answerIndex === question.correctIndex;
  return {
    correct,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
  };
}

// ─── Contexto dinâmico ────────────────────────────────────────

/**
 * Retorna dicas personalizadas baseadas no estado atual do
 * ambiente Docker do usuário. Lê dados do daemon via Dockerode.
 */
export async function getEnvironmentContext() {
  const dockerAny = docker as any;

  const [allContainers, allImages, allVolumes, allNetworks] = await Promise.all([
    dockerAny.listContainers({ all: true }),
    docker.listImages({ all: false }),
    docker.listVolumes(),
    docker.listNetworks(),
  ]);

  const running = (allContainers as any[]).filter((c: any) => c.State === "running");
  const stopped = (allContainers as any[]).filter((c: any) => c.State !== "running");
  const volumes = (allVolumes as any).Volumes ?? [];
  const customNetworks = (allNetworks as any[]).filter(
    (n: any) => !["bridge", "host", "none"].includes(n.Name)
  );
  const composeNetworks = (allNetworks as any[]).filter(
    (n: any) => n.Labels?.["com.docker.compose.project"]
  );
  const composeProjects = [
    ...new Set(
      composeNetworks.map((n: any) => n.Labels["com.docker.compose.project"])
    ),
  ];

  // Imagens sem tag (dangling)
  const danglingImages = (allImages as any[]).filter(
    (img: any) => !img.RepoTags || img.RepoTags[0] === "<none>:<none>"
  );

  const tips: Array<{ title: string; body: string; conceptSlug: string }> = [];

  // ── Dicas baseadas em containers ──────────────────────────

  if (running.length === 0 && stopped.length === 0) {
    tips.push({
      title: "Nenhum container encontrado",
      body: "Você ainda não tem containers. Experimente: docker run -d -p 8080:80 nginx para subir um servidor web.",
      conceptSlug: "container",
    });
  }

  if (stopped.length > 3) {
    tips.push({
      title: `${stopped.length} containers parados`,
      body: `Você tem ${stopped.length} containers parados. Containers parados ainda ocupam espaço em disco. Se não precisar mais deles, rode: docker container prune`,
      conceptSlug: "container",
    });
  }

  if (running.length > 0) {
    tips.push({
      title: `${running.length} container${running.length > 1 ? "s" : ""} em execução`,
      body: `Containers em execução têm seu próprio sistema de arquivos, rede e processos isolados do host. Use "docker exec -it <id> sh" para entrar em qualquer um deles.`,
      conceptSlug: "container",
    });
  }

  // ── Dicas baseadas em imagens ──────────────────────────────

  if (danglingImages.length > 0) {
    tips.push({
      title: `${danglingImages.length} imagem${danglingImages.length > 1 ? "s" : ""} sem tag (dangling)`,
      body: "Imagens sem tag são restos de builds anteriores. Elas ocupam espaço mas não podem ser usadas diretamente. Limpe com: docker image prune",
      conceptSlug: "image",
    });
  }

  if (allImages.length > 10) {
    tips.push({
      title: `${allImages.length} imagens locais`,
      body: "Muitas imagens acumuladas podem consumir bastante espaço em disco. Use 'docker system df' para ver o uso total e 'docker image prune -a' para remover imagens não usadas por nenhum container.",
      conceptSlug: "image",
    });
  }

  // ── Dicas baseadas em volumes ──────────────────────────────

  if (volumes.length === 0) {
    tips.push({
      title: "Nenhum volume criado",
      body: "Volumes são a forma recomendada de persistir dados de containers (bancos de dados, uploads, etc.). Sem volumes, todos os dados de um container são perdidos ao removê-lo.",
      conceptSlug: "volume",
    });
  }

  // ── Dicas baseadas em redes ────────────────────────────────

  if (composeProjects.length > 0) {
    tips.push({
      title: `${composeProjects.length} projeto${composeProjects.length > 1 ? "s" : ""} do Compose ativo${composeProjects.length > 1 ? "s" : ""}`,
      body: `Projetos detectados: ${composeProjects.join(", ")}. Dentro de cada projeto, os serviços se comunicam pelo nome do serviço como hostname (ex.: "db:5432") graças ao DNS interno do Docker.`,
      conceptSlug: "compose",
    });
  }

  if (customNetworks.length === 0 && running.length > 1) {
    tips.push({
      title: "Containers usando a rede bridge padrão",
      body: "Com múltiplos containers rodando, considere criar redes customizadas para isolá-los. Na rede bridge padrão, todos os containers se enxergam. Com redes customizadas você controla quem fala com quem.",
      conceptSlug: "network",
    });
  }

  return {
    summary: {
      containersRunning: running.length,
      containersStopped: stopped.length,
      totalImages: allImages.length,
      danglingImages: danglingImages.length,
      totalVolumes: volumes.length,
      totalNetworks: allNetworks.length,
      customNetworks: customNetworks.length,
      composeProjects: composeProjects as string[],
    },
    tips,
  };
}
