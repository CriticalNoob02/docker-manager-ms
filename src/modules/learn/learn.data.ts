// ──────────────────────────────────────────────────────────────
// learn.data.ts — Conteúdo estático dos conceitos Docker e quiz
// ──────────────────────────────────────────────────────────────

export interface DockerConcept {
  slug: string;
  title: string;
  emoji: string;
  /** Resumo de 1-2 frases para exibir em cards */
  summary: string;
  /** Explicação mais detalhada */
  explanation: string;
  /** Analogia do mundo real para fixar o conceito */
  analogy: string;
  /** Comandos Docker relevantes */
  commands: Array<{ cmd: string; desc: string }>;
  /** Dicas práticas (pro-tips) */
  tips: string[];
  /** Slugs de conceitos relacionados */
  relatedConcepts: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  conceptSlug: string;
}

// ─── Conceitos ───────────────────────────────────────────────

export const concepts: DockerConcept[] = [
  {
    slug: "container",
    title: "Container",
    emoji: "📦",
    summary:
      "Um processo isolado que roda em seu próprio sistema de arquivos, rede e espaço de nomes, mas compartilha o kernel do host.",
    explanation:
      "Containers são instâncias em execução de uma imagem Docker. Cada container possui seu próprio sistema de arquivos (layer de escrita), interface de rede virtual e lista de processos. Ao contrário de VMs, containers não emulam hardware — eles usam recursos do kernel (namespaces e cgroups) para criar isolamento leve. Isso os torna extremamente rápidos para iniciar (milissegundos) e muito eficientes em memória.",
    analogy:
      "Pense num container como um apartamento num prédio: cada apartamento tem suas próprias paredes, móveis e chave, mas todos compartilham a mesma fundação (kernel do host) e a mesma rede elétrica (hardware).",
    commands: [
      { cmd: "docker run nginx", desc: "Cria e inicia um container da imagem nginx" },
      { cmd: "docker ps", desc: "Lista containers em execução" },
      { cmd: "docker ps -a", desc: "Lista todos os containers, incluindo parados" },
      { cmd: "docker stop <id>", desc: "Para um container graciosamente (SIGTERM)" },
      { cmd: "docker rm <id>", desc: "Remove um container parado" },
      { cmd: "docker exec -it <id> sh", desc: "Abre um shell interativo dentro do container" },
      { cmd: "docker inspect <id>", desc: "Exibe todos os detalhes de configuração do container" },
    ],
    tips: [
      "Use a flag --rm no docker run para que o container seja removido automaticamente ao parar.",
      "A flag -d (detached) inicia o container em segundo plano — perfeito para servidores.",
      "Containers são efêmeros por design: qualquer dado gravado dentro deles é perdido ao remover o container. Use Volumes para persistir dados.",
      "O ID do container pode ser abreviado — os 4-6 primeiros caracteres já bastam na maioria dos comandos.",
    ],
    relatedConcepts: ["image", "volume", "network", "dockerfile"],
  },
  {
    slug: "image",
    title: "Image",
    emoji: "🖼️",
    summary:
      "Template somente-leitura e em camadas que define o sistema de arquivos, dependências e comando de entrada do container.",
    explanation:
      "Uma imagem Docker é construída a partir de uma série de camadas (layers), onde cada instrução do Dockerfile cria uma nova camada. Camadas são compartilhadas entre imagens que têm a mesma base, economizando espaço em disco e largura de banda durante pulls. Imagens são imutáveis — quando você inicia um container, o Docker adiciona uma camada de escrita temporária por cima. Imagens são identificadas por repositório, tag (ex.: nginx:1.25) e digest SHA256.",
    analogy:
      "Uma imagem é como a planta de um apartamento decorado de um condomínio: ela define exatamente como cada unidade vai ser construída, mas não é o apartamento em si. O container é a unidade habitada.",
    commands: [
      { cmd: "docker pull nginx:alpine", desc: "Baixa a imagem nginx com a tag alpine" },
      { cmd: "docker images", desc: "Lista todas as imagens locais" },
      { cmd: "docker rmi <id>", desc: "Remove uma imagem local" },
      { cmd: "docker build -t minha-app:1.0 .", desc: "Constrói uma imagem a partir do Dockerfile no diretório atual" },
      { cmd: "docker image history <id>", desc: "Mostra as camadas de uma imagem" },
      { cmd: "docker image prune", desc: "Remove imagens sem tag (dangling)" },
    ],
    tips: [
      "Prefira imagens alpine ou slim: são menores, têm menos superfície de ataque e sobem mais rápido.",
      "O cache de build do Docker reutiliza camadas que não mudaram — coloque instruções que mudam pouco (como RUN apt-get install) no início do Dockerfile.",
      "Faça docker image ls --filter dangling=true para ver imagens orphaned que ocupam espaço desnecessário.",
      "Use tags semânticas (ex.: 1.0.0) em produção em vez de :latest para garantir reprodutibilidade.",
    ],
    relatedConcepts: ["container", "dockerfile", "layers"],
  },
  {
    slug: "volume",
    title: "Volume",
    emoji: "💾",
    summary:
      "Mecanismo nativo do Docker para persistir dados fora do ciclo de vida dos containers.",
    explanation:
      "Volumes são diretórios gerenciados pelo Docker Engine, armazenados em /var/lib/docker/volumes/ no host. Diferentemente de bind mounts (que mapeiam um diretório do host), volumes são totalmente portáteis e não dependem da estrutura do sistema de arquivos do host. Volumes podem ser compartilhados entre múltiplos containers simultaneamente. O Docker cuida de permissões, backup e remoção. Dados em volumes sobrevivem à remoção e recriação de containers.",
    analogy:
      "Um volume é como um pen drive que você conecta ao container: o container pode ser formatado e recriado, mas o pen drive com seus dados continua intacto.",
    commands: [
      { cmd: "docker volume create meu-volume", desc: "Cria um volume nomeado" },
      { cmd: "docker volume ls", desc: "Lista todos os volumes" },
      { cmd: "docker volume inspect meu-volume", desc: "Exibe detalhes (mountpoint, driver, etc.)" },
      { cmd: "docker volume rm meu-volume", desc: "Remove um volume" },
      { cmd: "docker run -v meu-volume:/app/data nginx", desc: "Monta o volume em /app/data dentro do container" },
      { cmd: "docker volume prune", desc: "Remove todos os volumes não utilizados" },
    ],
    tips: [
      "Nunca armazene dados de banco de dados dentro do container sem um volume — você perderá tudo ao recriar o container.",
      "Volumes têm melhor performance do que bind mounts no Docker Desktop (Mac/Windows) porque ficam na VM Linux interna.",
      "Para fazer backup de um volume: docker run --rm -v meu-volume:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data",
      "Use --volumes-from para que um container herde todos os volumes de outro.",
    ],
    relatedConcepts: ["container", "dockerfile"],
  },
  {
    slug: "network",
    title: "Network",
    emoji: "🌐",
    summary:
      "Rede virtual que permite containers se comunicarem entre si e com o mundo externo de forma controlada.",
    explanation:
      "O Docker cria redes virtuais (virtual switches) que containers podem ingressar. Há três drivers principais: bridge (padrão, para containers no mesmo host), host (o container usa a rede do host diretamente, sem isolamento) e overlay (para Docker Swarm, comunicação multi-host). Containers na mesma rede bridge customizada podem se resolver por nome (DNS interno do Docker). Containers em redes diferentes são isolados por padrão — isso é fundamental para segurança. O Docker Compose cria automaticamente uma rede bridge por projeto, conectando todos os serviços do stack.",
    analogy:
      "Redes Docker são como VLANs num switch gerenciável: você pode criar redes isoladas, controlar quem fala com quem e expor apenas as portas necessárias para o mundo externo.",
    commands: [
      { cmd: "docker network create minha-rede", desc: "Cria uma rede bridge customizada" },
      { cmd: "docker network ls", desc: "Lista todas as redes" },
      { cmd: "docker network inspect minha-rede", desc: "Exibe containers conectados, gateway, subnet, etc." },
      { cmd: "docker network connect minha-rede <container>", desc: "Conecta um container a uma rede" },
      { cmd: "docker network disconnect minha-rede <container>", desc: "Desconecta um container de uma rede" },
      { cmd: "docker run --network minha-rede nginx", desc: "Inicia container já conectado à rede" },
    ],
    tips: [
      "Nunca use a rede bridge padrão (docker0) em produção — ela não tem DNS interno e expõe todos os containers entre si.",
      "Em Docker Compose, serviços se comunicam pelo nome do serviço (ex.: db, redis) como hostname — isso é resolvido pelo DNS interno do Docker.",
      "Use múltiplas redes para isolar tiers: frontend fala com backend, backend fala com database, mas frontend não fala diretamente com database.",
      "docker network prune remove redes que não têm nenhum container conectado.",
    ],
    relatedConcepts: ["container", "compose"],
  },
  {
    slug: "compose",
    title: "Docker Compose",
    emoji: "🎼",
    summary:
      "Ferramenta para definir e gerenciar aplicações multi-container usando um arquivo YAML declarativo.",
    explanation:
      "O Docker Compose permite descrever toda a infraestrutura de uma aplicação — serviços, redes e volumes — num único arquivo docker-compose.yml. Com um único comando (docker compose up) você sobe todos os serviços, suas dependências e configurações. O Compose gerencia a ordem de inicialização (depends_on), variáveis de ambiente, mapeamento de portas e volumes. Cada conjunto de serviços é chamado de stack ou projeto. O Compose é ideal para desenvolvimento local e ambientes de staging.",
    analogy:
      "Se containers individuais são instrumentistas, o Docker Compose é o maestro que define a partitura completa: quem toca o quê, em que ordem, como se comunicam e o que precisam.",
    commands: [
      { cmd: "docker compose up -d", desc: "Sobe todos os serviços em modo detached" },
      { cmd: "docker compose down", desc: "Para e remove containers, redes (mas mantém volumes)" },
      { cmd: "docker compose down -v", desc: "Remove também os volumes nomeados" },
      { cmd: "docker compose logs -f", desc: "Acompanha os logs de todos os serviços" },
      { cmd: "docker compose ps", desc: "Lista o status dos serviços" },
      { cmd: "docker compose build", desc: "Reconstrói as imagens dos serviços" },
      { cmd: "docker compose exec <service> sh", desc: "Abre shell num serviço em execução" },
    ],
    tips: [
      "Use depends_on com a condição service_healthy para garantir que o banco esteja pronto antes da API subir.",
      "Variáveis de ambiente no Compose podem vir de um arquivo .env na raiz do projeto — nunca commite segredos no docker-compose.yml.",
      "docker compose up --build reconstrói as imagens antes de subir — útil durante desenvolvimento.",
      "O arquivo pode se chamar compose.yml (sem o docker- prefixo) — é a convenção mais recente.",
    ],
    relatedConcepts: ["container", "network", "volume", "dockerfile"],
  },
  {
    slug: "dockerfile",
    title: "Dockerfile",
    emoji: "📄",
    summary:
      "Arquivo de texto com instruções passo a passo para construir uma imagem Docker de forma reprodutível.",
    explanation:
      "Um Dockerfile é o blueprint de uma imagem. Cada instrução cria uma nova camada na imagem final. As instruções mais comuns são: FROM (imagem base), RUN (executa comandos durante o build), COPY/ADD (copia arquivos para a imagem), ENV (define variáveis de ambiente), EXPOSE (documenta a porta exposta), CMD/ENTRYPOINT (define o processo principal do container). Boas práticas incluem usar multi-stage builds para reduzir o tamanho final da imagem, ordenar as instruções para maximizar o cache e evitar rodar como root.",
    analogy:
      "Um Dockerfile é como uma receita de bolo: lista os ingredientes (FROM, COPY), os passos de preparo (RUN) e como servir (CMD). Qualquer pessoa seguindo a receita obtém o mesmo resultado.",
    commands: [
      { cmd: "docker build -t minha-app .", desc: "Constrói a imagem usando o Dockerfile no diretório atual" },
      { cmd: "docker build --no-cache -t minha-app .", desc: "Força rebuild sem usar cache" },
      { cmd: "docker build -f outro.Dockerfile -t minha-app .", desc: "Especifica um Dockerfile alternativo" },
    ],
    tips: [
      "Multi-stage build: use uma imagem de build (com compiladores, etc.) e copie apenas o artefato final para uma imagem slim. Isso reduz drasticamente o tamanho.",
      "Combine múltiplos RUN num único usando && para reduzir o número de camadas.",
      "Crie um .dockerignore (similar ao .gitignore) para excluir node_modules, .git e outros arquivos desnecessários do contexto de build.",
      "Use COPY --chown=user:group para copiar arquivos já com o dono correto, evitando um RUN chown extra.",
    ],
    relatedConcepts: ["image", "layers", "container"],
  },
  {
    slug: "layers",
    title: "Camadas (Layers)",
    emoji: "🥞",
    summary:
      "Sistema de arquivos em camadas sobrepostas que compõem uma imagem Docker, permitindo compartilhamento e cache eficiente.",
    explanation:
      "Imagens Docker são compostas por camadas imutáveis empilhadas (Union File System). Cada instrução RUN, COPY ou ADD no Dockerfile cria uma nova camada com apenas o diff em relação à camada anterior. Quando você faz pull de uma imagem, o Docker baixa apenas as camadas que você não tem localmente. Ao iniciar um container, uma camada de escrita temporária é adicionada no topo — é onde todos os arquivos criados ou modificados pelo container vivem. Ao remover o container, essa camada é descartada.",
    analogy:
      "Camadas são como uma pilha de acetatos transparentes numa retroprojetora: cada acetato adiciona algo novo sobre os anteriores. O resultado final é a composição de todos os acetatos. Se você quiser mudar só um detalhe, troca apenas aquele acetato.",
    commands: [
      { cmd: "docker image history <imagem>", desc: "Mostra todas as camadas de uma imagem com tamanho" },
      { cmd: "docker image inspect <imagem>", desc: "JSON completo incluindo os IDs de cada camada" },
    ],
    tips: [
      "Camadas são compartilhadas: se nginx:alpine e minha-app:1.0 usam a mesma base alpine, essa camada é baixada uma única vez.",
      "Mudanças no início do Dockerfile invalidam o cache de todas as camadas seguintes — coloque o que muda menos (instalação de dependências) antes do que muda mais (código da aplicação).",
      "O comando docker system df mostra quanto espaço em disco está sendo usado por camadas, containers e volumes.",
    ],
    relatedConcepts: ["image", "dockerfile"],
  },
  {
    slug: "docker-socket",
    title: "Docker Socket",
    emoji: "🔌",
    summary:
      "Interface Unix (/var/run/docker.sock) pela qual aplicações se comunicam com o Docker Engine para controlar containers.",
    explanation:
      "O Docker Daemon (dockerd) expõe uma API REST via socket Unix em /var/run/docker.sock. Qualquer processo com acesso a esse socket pode controlar o Docker Engine — listar containers, criar imagens, iniciar e parar serviços. Isso é exatamente como este projeto (radar-docker-manager-ms) funciona: a biblioteca Dockerode se conecta ao socket e faz chamadas à API do daemon. Montar o socket num container (-v /var/run/docker.sock:/var/run/docker.sock) é uma técnica comum, mas dá ao container poder de root efetivo no host — use com cuidado.",
    analogy:
      "O Docker Socket é como a porta dos fundos de um restaurante: quem tem a chave pode entrar na cozinha e pedir qualquer coisa, mesmo sem usar o cardápio (CLI). Este projeto tem essa chave.",
    commands: [
      { cmd: "curl --unix-socket /var/run/docker.sock http://localhost/containers/json", desc: "Consulta a API REST do Docker diretamente via socket" },
      { cmd: "ls -la /var/run/docker.sock", desc: "Verifica permissões do socket" },
    ],
    tips: [
      "Este projeto (radar-docker-manager-ms) usa Dockerode que se conecta automaticamente ao socket em /var/run/docker.sock.",
      "Nunca exponha o socket Docker na internet — é equivalente a root no host.",
      "Alternativas mais seguras incluem Rootless Docker e sockets proxy (como Socket Proxy) que limitam quais operações podem ser feitas.",
    ],
    relatedConcepts: ["container", "image"],
  },
  {
    slug: "port-binding",
    title: "Port Binding",
    emoji: "🔗",
    summary:
      "Mapeamento de portas entre o host e o container, permitindo que serviços internos sejam acessíveis externamente.",
    explanation:
      "Containers têm sua própria interface de rede com IPs internos. Para acessar um serviço rodando dentro do container pelo host (ou pela internet), você precisa mapear uma porta do host para uma porta do container. Isso é feito com a flag -p host:container. Exemplo: -p 8080:80 mapeia a porta 80 do container para a porta 8080 do host. Sem esse mapeamento, o serviço é acessível apenas por outros containers na mesma rede Docker. No Compose, isso é feito com a chave ports.",
    analogy:
      "Port binding é como um serviço de recepção num prédio: o visitante chega à porta do prédio (porta do host), e a recepção encaminha para o andar e sala corretos (porta do container).",
    commands: [
      { cmd: "docker run -p 8080:80 nginx", desc: "Mapeia porta 80 do container para 8080 do host" },
      { cmd: "docker port <container>", desc: "Lista os mapeamentos de porta de um container" },
      { cmd: "docker run -p 127.0.0.1:8080:80 nginx", desc: "Expõe só para localhost (mais seguro)" },
    ],
    tips: [
      "Use -p 127.0.0.1:8080:80 em vez de -p 8080:80 para expor apenas localmente e não para toda a rede.",
      "A instrução EXPOSE no Dockerfile é apenas documentação — não mapeia nada automaticamente. O mapeamento real acontece com -p no docker run.",
      "Se omitir a porta do host (-p 80), o Docker escolhe uma porta aleatória disponível — use docker port para descobrir qual.",
    ],
    relatedConcepts: ["container", "network"],
  },
  {
    slug: "environment-variables",
    title: "Variáveis de Ambiente",
    emoji: "⚙️",
    summary:
      "Mecanismo principal para configurar containers sem alterar a imagem — separando configuração do código.",
    explanation:
      "Variáveis de ambiente são o jeito padrão de passar configurações para containers em runtime: credenciais de banco, endereços de serviços, feature flags, nível de log, etc. Podem ser definidas com -e no docker run, num arquivo .env, ou na chave environment do Compose. Seguindo o princípio 12-Factor App, a mesma imagem deve conseguir rodar em dev, staging e produção apenas mudando as variáveis de ambiente. O Docker também suporta secrets para variáveis sensíveis, que são montadas como arquivos em /run/secrets/.",
    analogy:
      "Variáveis de ambiente são como o painel de configurações do seu celular: o aplicativo (código) é o mesmo, mas você pode mudar idioma, notificações e comportamento sem reinstalar nada.",
    commands: [
      { cmd: "docker run -e DATABASE_URL=postgres://... myapp", desc: "Passa variável de ambiente na linha de comando" },
      { cmd: "docker run --env-file .env myapp", desc: "Carrega variáveis de um arquivo .env" },
      { cmd: "docker exec <id> env", desc: "Lista todas as variáveis de ambiente de um container em execução" },
    ],
    tips: [
      "Nunca commite arquivos .env com segredos no git. Use .env.example com valores fictícios como template.",
      "Para segredos em produção, prefira Docker Secrets (Swarm), Kubernetes Secrets ou serviços externos como Vault ou AWS Secrets Manager.",
      "Variáveis definidas com ENV no Dockerfile ficam gravadas na imagem e aparecem em docker inspect — evite colocar segredos lá.",
    ],
    relatedConcepts: ["container", "dockerfile", "compose"],
  },
];

// ─── Quiz ─────────────────────────────────────────────────────

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question: "O que diferencia um container de uma máquina virtual (VM)?",
    options: [
      "Containers têm seu próprio kernel, VMs compartilham o kernel do host",
      "Containers compartilham o kernel do host, VMs emulam hardware completo",
      "Containers só rodam em Linux, VMs são multiplataforma",
      "Containers são mais lentos para iniciar do que VMs",
    ],
    correctIndex: 1,
    explanation:
      "Containers compartilham o kernel do host usando namespaces e cgroups para isolamento, sem emular hardware. VMs emulam hardware completo e têm seu próprio kernel. Por isso containers iniciam em milissegundos enquanto VMs levam segundos ou minutos.",
    conceptSlug: "container",
  },
  {
    id: "q2",
    question: "Qual é a relação entre uma imagem e um container no Docker?",
    options: [
      "Uma imagem é um container em execução",
      "Um container é uma imagem comprimida",
      "Uma imagem é o template somente-leitura; um container é uma instância em execução da imagem",
      "São a mesma coisa com nomes diferentes",
    ],
    correctIndex: 2,
    explanation:
      "A imagem é o blueprint imutável (como um .exe ou .jar). O container é a instância em execução — como um processo iniciado a partir desse executável. Você pode ter múltiplos containers rodando a partir da mesma imagem.",
    conceptSlug: "image",
  },
  {
    id: "q3",
    question: "Por que dados salvos dentro de um container são perdidos quando ele é removido?",
    options: [
      "Porque o Docker não suporta persistência de dados",
      "Porque o container usa uma camada de escrita temporária que é descartada na remoção",
      "Porque o Docker criptografa os dados ao parar o container",
      "Isso não acontece — dados sempre persistem",
    ],
    correctIndex: 1,
    explanation:
      "Cada container tem uma camada de escrita (writable layer) temporária por cima das camadas imutáveis da imagem. Ao remover o container, essa camada é descartada. Para persistir dados, use Volumes ou bind mounts.",
    conceptSlug: "layers",
  },
  {
    id: "q4",
    question: "Qual driver de rede Docker permite que containers em hosts diferentes se comuniquem?",
    options: [
      "bridge",
      "host",
      "overlay",
      "macvlan",
    ],
    correctIndex: 2,
    explanation:
      "O driver overlay é usado em clusters Docker Swarm para criar redes que abrangem múltiplos hosts. O bridge é para containers no mesmo host. O host elimina o isolamento de rede. O macvlan atribui um endereço MAC real ao container.",
    conceptSlug: "network",
  },
  {
    id: "q5",
    question: "O que acontece se você fizer docker run nginx sem a flag -p?",
    options: [
      "O nginx não inicia porque precisa de uma porta mapeada",
      "O nginx sobe mas a porta 80 fica acessível apenas para outros containers na mesma rede",
      "O Docker automaticamente mapeia a porta 80 para o host",
      "O container para imediatamente por falta de configuração",
    ],
    correctIndex: 1,
    explanation:
      "Sem -p, o container sobe normalmente mas a porta 80 fica acessível apenas internamente (via rede Docker). Para acessar pelo host, você precisa de -p 8080:80 (por exemplo). A instrução EXPOSE no Dockerfile não faz o mapeamento automático.",
    conceptSlug: "port-binding",
  },
  {
    id: "q6",
    question: "Qual instrução do Dockerfile NÃO cria uma nova camada (layer) na imagem?",
    options: [
      "RUN",
      "COPY",
      "ENV",
      "ADD",
    ],
    correctIndex: 2,
    explanation:
      "ENV define metadados e variáveis de ambiente sem criar camadas de arquivo. RUN, COPY e ADD modificam o sistema de arquivos e criam novas camadas. Na prática, reduzir o número de instruções RUN (usando &&) é a principal otimização de camadas.",
    conceptSlug: "layers",
  },
  {
    id: "q7",
    question: "Qual é a principal vantagem de usar volumes Docker sobre escrever dados direto no container?",
    options: [
      "Volumes são mais rápidos que o sistema de arquivos do container",
      "Dados em volumes persistem independentemente do ciclo de vida do container",
      "Volumes são automaticamente replicados para outros hosts",
      "Apenas volumes podem ser compartilhados entre containers",
    ],
    correctIndex: 1,
    explanation:
      "A principal vantagem é a persistência: você pode remover e recriar o container sem perder os dados. Volumes também são mais fáceis de fazer backup, compartilhar entre containers e gerenciar com o Docker CLI.",
    conceptSlug: "volume",
  },
  {
    id: "q8",
    question: "No Docker Compose, como um serviço 'api' acessa o serviço 'db' que roda na mesma stack?",
    options: [
      "Usando o IP do host + a porta mapeada com -p",
      "Pelo hostname 'db' — o Compose configura DNS interno para isso",
      "Precisa usar o endereço IP do container, que muda a cada reinicialização",
      "Apenas via variáveis de ambiente passando o IP manualmente",
    ],
    correctIndex: 1,
    explanation:
      "O Compose cria uma rede bridge para cada projeto e registra cada serviço pelo seu nome (db, redis, api, etc.) no DNS interno do Docker. Então, dentro do container 'api', você pode usar 'db:5432' para se conectar ao banco — mesmo que o IP mude.",
    conceptSlug: "compose",
  },
  {
    id: "q9",
    question: "Por que montar /var/run/docker.sock num container é considerado um risco de segurança?",
    options: [
      "Porque o socket pode corromper o sistema de arquivos do container",
      "Porque dá ao container acesso de root efetivo ao host via API do Docker",
      "Porque causa conflitos de porta com o daemon do host",
      "Porque o socket usa muita memória RAM",
    ],
    correctIndex: 1,
    explanation:
      "Com acesso ao socket Docker, o container pode criar novos containers com volumes montando o sistema de arquivos do host, efetivamente ganhando acesso root. É uma escalada de privilégio conhecida. Esse é exatamente o funcionamento do radar-docker-manager-ms — que por isso deve rodar apenas localmente.",
    conceptSlug: "docker-socket",
  },
  {
    id: "q10",
    question: "O que é um multi-stage build no Dockerfile?",
    options: [
      "Um Dockerfile que suporta múltiplos sistemas operacionais",
      "Uma técnica para usar múltiplas imagens de base em etapas separadas, copiando apenas o artefato final",
      "Um recurso para fazer build em paralelo em múltiplos hosts",
      "Um modo de combinar múltiplos Dockerfiles num único arquivo",
    ],
    correctIndex: 1,
    explanation:
      "Multi-stage build usa FROM múltiplos vezes no mesmo Dockerfile. Estágios anteriores podem ter compiladores, dependências de dev, etc. O estágio final copia apenas o artefato (binário, bundle) para uma imagem slim. Resultado: imagens menores, mais seguras e sem ferramentas desnecessárias em produção.",
    conceptSlug: "dockerfile",
  },
];

// ─── Conceitos Swarm ─────────────────────────────────────────

export const swarmConcepts: DockerConcept[] = [
  {
    slug: "swarm",
    title: "Docker Swarm",
    emoji: "🐝",
    summary:
      "Orquestrador nativo do Docker que transforma um grupo de hosts em um único cluster gerenciado, com alta disponibilidade e escalonamento automático.",
    explanation:
      "Docker Swarm é o modo de orquestração embutido no Docker Engine. Com um simples `docker swarm init`, o host atual vira um nó manager de um cluster. Outros hosts podem entrar como workers ou managers adicionais. A partir daí, você não gerencia mais containers individuais — você declara serviços, e o Swarm decide em quais nós rodá-los. O Swarm cuida de reiniciar tasks falhas, distribuir carga entre réplicas e atualizar serviços sem downtime (rolling updates).",
    analogy:
      "Pense no Swarm como um gerente de RH de uma empresa com várias filiais: você diz 'preciso de 5 atendentes' e ele distribui esse pessoal entre as filiais disponíveis, substituindo quem falta e rebalanceando quando uma filial fecha.",
    commands: [
      { cmd: "docker swarm init", desc: "Inicializa um novo cluster Swarm neste host (vira manager)" },
      { cmd: "docker swarm init --advertise-addr <IP>", desc: "Inicializa especificando o IP para outros nós se conectarem" },
      { cmd: "docker swarm join --token <token> <ip>:<porta>", desc: "Adiciona este host ao cluster como worker" },
      { cmd: "docker swarm join-token worker", desc: "Exibe o comando e token para novos workers" },
      { cmd: "docker swarm join-token manager", desc: "Exibe o comando e token para novos managers" },
      { cmd: "docker swarm leave --force", desc: "Remove este host do cluster (--force necessário em managers)" },
      { cmd: "docker info | grep Swarm", desc: "Verifica se o Swarm está ativo neste host" },
    ],
    tips: [
      "Para alta disponibilidade, use número ímpar de managers (3 ou 5). Com 3 managers, o cluster tolera a falha de 1 sem perder quorum.",
      "Nunca passe um número par de managers — 4 managers têm o mesmo tolerância a falhas que 3, mas mais overhead de consenso (Raft).",
      "Em produção, managers não devem rodar workload. Use `docker node update --availability drain <manager>` para reservá-los só para gestão.",
      "O Swarm usa o algoritmo Raft para consenso entre managers. Se o quorum for perdido, o cluster entra em modo read-only para proteger o estado.",
    ],
    relatedConcepts: ["swarm-node", "swarm-service", "swarm-stack", "swarm-overlay-network"],
  },
  {
    slug: "swarm-node",
    title: "Swarm Node",
    emoji: "🖥️",
    summary:
      "Um host Docker participante do cluster. Nodes podem ser managers (controlam o cluster) ou workers (executam as tasks).",
    explanation:
      "Um cluster Swarm é composto por nós (nodes). Cada node roda o Docker Engine. Existem dois papéis: managers e workers. Managers mantêm o estado do cluster usando consenso Raft — eles aceitam comandos da CLI, schedulam tasks e monitoram a saúde do cluster. Workers apenas executam containers (tasks). Todo manager também é, por padrão, um worker. A disponibilidade de um node pode ser `active` (aceita tasks), `pause` (não recebe novas tasks) ou `drain` (tasks em execução são migradas para outros nodes).",
    analogy:
      "Managers são como supervisores de turno: tomam decisões, delegam trabalho e garantem que tudo está rodando. Workers são os operários: executam as tarefas recebidas sem se preocupar com a gestão geral.",
    commands: [
      { cmd: "docker node ls", desc: "Lista todos os nós do cluster com status e role" },
      { cmd: "docker node inspect <id>", desc: "Exibe detalhes de um nó específico" },
      { cmd: "docker node update --availability drain <id>", desc: "Coloca o nó em modo drain (migra tasks ativas)" },
      { cmd: "docker node update --availability active <id>", desc: "Reativa o nó para receber tasks" },
      { cmd: "docker node update --role manager <id>", desc: "Promove um worker a manager" },
      { cmd: "docker node update --role worker <id>", desc: "Rebaixa um manager a worker" },
      { cmd: "docker node rm <id>", desc: "Remove um nó do cluster (deve estar em estado down)" },
    ],
    tips: [
      "Antes de fazer manutenção num nó (atualização de OS, reinicialização), sempre coloque-o em `drain` para migrar os containers sem interrupção de serviço.",
      "O asterisco (*) em `docker node ls` indica o nó onde você está executando o comando.",
      "Para remover um manager, primeiro rebaixe-o para worker (`--role worker`), depois faça `docker swarm leave` no próprio host.",
      "Use labels nos nós (`docker node update --label-add tipo=banco <id>`) para criar restrições de placement e controlar em quais nós cada serviço roda.",
    ],
    relatedConcepts: ["swarm", "swarm-service", "swarm-task"],
  },
  {
    slug: "swarm-service",
    title: "Swarm Service",
    emoji: "⚙️",
    summary:
      "Unidade de deploy no Swarm. Define a imagem, número de réplicas, portas e política de atualização — o Swarm mantém esse estado desejado automaticamente.",
    explanation:
      "No Swarm, você não cria containers diretamente — você cria serviços. Um serviço é uma declaração de estado desejado: 'quero 3 instâncias do nginx:1.25 ouvindo na porta 80'. O Swarm traduz esse serviço em tasks (containers) e os distribui pelos nós disponíveis. Se um container cair, o Swarm automaticamente cria um novo para manter as 3 réplicas. Existem dois modos: `replicated` (número fixo de réplicas distribuídas pelos nós) e `global` (exatamente 1 instância em cada nó — útil para agentes de monitoramento).",
    analogy:
      "Um serviço é como uma vaga de emprego anunciada: você define o perfil ('3 desenvolvedores React sênior') e o RH (Swarm) recruta e mantém essas vagas preenchidas. Se um funcionário sai, ele é substituído automaticamente.",
    commands: [
      { cmd: "docker service create --name web --replicas 3 -p 80:80 nginx", desc: "Cria um serviço com 3 réplicas" },
      { cmd: "docker service ls", desc: "Lista todos os serviços com status de réplicas" },
      { cmd: "docker service ps <nome>", desc: "Lista as tasks (containers) de um serviço" },
      { cmd: "docker service scale web=5", desc: "Escala o serviço 'web' para 5 réplicas" },
      { cmd: "docker service update --image nginx:1.26 web", desc: "Atualiza a imagem do serviço (rolling update)" },
      { cmd: "docker service update --rollback web", desc: "Reverte para a versão anterior do serviço" },
      { cmd: "docker service rm web", desc: "Remove o serviço e todas as suas tasks" },
      { cmd: "docker service logs -f web", desc: "Acompanha os logs agregados de todas as réplicas" },
    ],
    tips: [
      "Prefira sempre especificar a tag exata da imagem (ex.: nginx:1.25.3) em vez de `latest`. Isso garante deploys reproduzíveis e facilita rollbacks.",
      "Configure `--update-parallelism` e `--update-delay` para controlar o ritmo do rolling update e evitar downtime durante atualizações.",
      "Use `--restart-condition on-failure` com `--restart-max-attempts 3` para evitar loops de restart infinitos em serviços com bugs.",
      "Serviços globais (`--mode global`) são ideais para ferramentas de observabilidade como Prometheus node-exporter ou Filebeat.",
    ],
    relatedConcepts: ["swarm", "swarm-node", "swarm-task", "swarm-stack", "swarm-overlay-network"],
  },
  {
    slug: "swarm-task",
    title: "Swarm Task",
    emoji: "🔧",
    summary:
      "Unidade atômica de trabalho do Swarm. Cada task é um container em execução em um nó específico, representando uma réplica de um serviço.",
    explanation:
      "Uma task é o menor objeto do Swarm: um container + sua especificação + o nó onde está rodando. Quando você cria um serviço com 3 réplicas, o Swarm cria 3 tasks, cada uma em um nó diferente (quando possível). Tasks têm um ciclo de vida: `new → pending → assigned → preparing → running`. Se uma task falha, ela transita para `failed` ou `shutdown`, e o Swarm automaticamente cria uma nova task para substituí-la. Tasks completadas ou falhas são mantidas por um tempo para fins de diagnóstico (o histórico aparece no `docker service ps`).",
    analogy:
      "Se o serviço é a vaga de emprego, a task é o funcionário específico que ocupa essa vaga. Quando ele é demitido (container falha), a vaga continua existindo e um novo funcionário é contratado (nova task criada) para preenchê-la.",
    commands: [
      { cmd: "docker service ps <serviço>", desc: "Lista tasks do serviço com estado atual e histórico" },
      { cmd: "docker service ps --filter 'desired-state=running' <serviço>", desc: "Mostra apenas tasks ativas" },
      { cmd: "docker inspect <task-id>", desc: "Inspeciona detalhes de uma task específica" },
      { cmd: "docker service ps --no-trunc <serviço>", desc: "Mostra erros sem truncar a mensagem" },
    ],
    tips: [
      "Quando um serviço está com problemas, use `docker service ps --no-trunc <serviço>` para ver a mensagem de erro completa das tasks falhas.",
      "Tasks não podem ser reiniciadas manualmente — para forçar um restart, escale para 0 e depois para o número original (`docker service scale web=0 && docker service scale web=3`).",
      "O scheduler do Swarm usa uma estratégia de spread por padrão: distribui tasks em nós com menos carga. Isso pode ser customizado com constraints e preferences.",
      "Tasks históricas (falhas, completadas) acumulam em `docker service ps`. Use `docker service ps --filter 'desired-state=shutdown'` para ver só as inativas.",
    ],
    relatedConcepts: ["swarm-service", "swarm-node"],
  },
  {
    slug: "swarm-stack",
    title: "Swarm Stack",
    emoji: "📚",
    summary:
      "Grupo de serviços relacionados deployados juntos via arquivo Compose. É o equivalente do `docker compose up` no Swarm.",
    explanation:
      "Uma stack é a unidade de deploy multi-serviço do Swarm. Você escreve um arquivo `docker-compose.yml` (com a chave `deploy` para configurações específicas de Swarm) e faz o deploy com `docker stack deploy`. O Swarm cria todos os serviços, redes overlay e volumes definidos. Stacks simplificam o gerenciamento de aplicações complexas: você atualiza o arquivo YAML e faz um novo deploy para aplicar mudanças. Todos os recursos criados por uma stack recebem o prefixo do nome da stack (`minha-app_web`, `minha-app_db`).",
    analogy:
      "Uma stack é como um kit de montagem de uma sala de estar: o arquivo compose descreve sofá, mesa e estante — peças que funcionam juntas. O `docker stack deploy` monta tudo de uma vez, e `docker stack rm` desmonta tudo junto.",
    commands: [
      { cmd: "docker stack deploy -c compose.yml minha-app", desc: "Deploy da stack a partir de um arquivo Compose" },
      { cmd: "docker stack ls", desc: "Lista todas as stacks com número de serviços" },
      { cmd: "docker stack services minha-app", desc: "Lista os serviços da stack" },
      { cmd: "docker stack ps minha-app", desc: "Lista as tasks de todos os serviços da stack" },
      { cmd: "docker stack rm minha-app", desc: "Remove a stack e todos os seus serviços" },
    ],
    tips: [
      "A chave `deploy` no Compose só é lida pelo Swarm (`docker stack deploy`) — o `docker compose up` ignora completamente essas configurações.",
      "Para atualizar uma stack, edite o arquivo compose e execute `docker stack deploy` novamente com o mesmo nome — o Swarm aplica as mudanças incrementalmente.",
      "Use `secrets` e `configs` do Swarm no lugar de variáveis de ambiente para dados sensíveis (senhas, certificados). Eles são injetados de forma segura nos containers.",
      "Versão mínima recomendada do Compose file para Swarm é `3.8`, que inclui suporte completo a `deploy.rollback_config` e `deploy.update_config`.",
    ],
    relatedConcepts: ["swarm", "swarm-service", "swarm-overlay-network", "compose"],
  },
  {
    slug: "swarm-overlay-network",
    title: "Overlay Network",
    emoji: "🕸️",
    summary:
      "Rede virtual que conecta containers em diferentes hosts físicos do cluster, como se estivessem na mesma LAN.",
    explanation:
      "O Docker Swarm usa redes do tipo `overlay` para permitir comunicação entre containers em nós diferentes. Uma overlay network encapsula o tráfego de rede usando VXLAN, criando um túnel entre os hosts. Do ponto de vista dos containers, eles estão todos na mesma rede local — podem se descobrir pelo nome do serviço (DNS interno) e se comunicar diretamente. O Swarm cria automaticamente a rede `ingress` para publicar portas ao mundo externo com load balancing interno. Você pode criar redes overlay customizadas para isolar grupos de serviços.",
    analogy:
      "Uma overlay network é como uma VPN corporativa: mesmo que os funcionários estejam em cidades diferentes, a VPN os coloca na mesma rede interna. Um funcionário pode ligar para o ramal de outro sem saber — e sem se importar — que estão fisicamente separados.",
    commands: [
      { cmd: "docker network create --driver overlay minha-rede", desc: "Cria uma rede overlay para serviços Swarm" },
      { cmd: "docker network create --driver overlay --attachable minha-rede", desc: "Overlay que também aceita containers standalone" },
      { cmd: "docker network ls", desc: "Lista todas as redes, incluindo as overlay do Swarm" },
      { cmd: "docker network inspect ingress", desc: "Inspeciona a rede ingress do Swarm" },
      { cmd: "docker service create --network minha-rede --name api minha-imagem", desc: "Cria serviço conectado à rede overlay" },
    ],
    tips: [
      "Serviços na mesma overlay network podem se comunicar usando o nome do serviço como hostname — o DNS interno do Swarm resolve automaticamente.",
      "A rede `ingress` é especial: ela implementa o routing mesh, que permite que qualquer nó do cluster receba tráfego na porta publicada, mesmo sem ter uma task rodando nele.",
      "Crie redes overlay separadas para diferentes camadas da aplicação (ex.: `frontend-net`, `backend-net`, `db-net`) para isolamento e segurança.",
      "Redes overlay só existem enquanto pelo menos um serviço que as usa estiver ativo. Após remover todos os serviços, a rede pode ser removida com `docker network rm`.",
    ],
    relatedConcepts: ["swarm", "swarm-service", "swarm-stack", "network"],
  },
];

export const swarmQuiz: QuizQuestion[] = [
  {
    id: "sq1",
    question: "Quantos nós manager são recomendados para um cluster Swarm com alta disponibilidade?",
    options: [
      "Sempre 1 — mais managers aumentam a latência sem benefício",
      "Um número ímpar (3 ou 5) para garantir quorum Raft",
      "Um número par para balancear a carga de gestão",
      "Pelo menos 10 para suportar grandes workloads",
    ],
    correctIndex: 1,
    explanation:
      "O algoritmo Raft exige maioria simples (quorum) para tomar decisões. Com 3 managers, o cluster suporta a falha de 1 (2 de 3 ainda formam maioria). Com 5, suporta 2 falhas. Número par é problemático: 4 managers têm a mesma tolerância a falhas que 3 (precisam de 3 votos), mas com mais overhead.",
    conceptSlug: "swarm",
  },
  {
    id: "sq2",
    question: "Qual a diferença fundamental entre um Swarm Service e um container standalone?",
    options: [
      "Serviços só rodam imagens do Docker Hub, containers rodam qualquer imagem",
      "Serviços são declarativos — o Swarm mantém o estado desejado automaticamente; containers são imperativos",
      "Serviços consomem menos memória que containers standalone",
      "Não há diferença prática, são apenas nomes diferentes para a mesma coisa",
    ],
    correctIndex: 1,
    explanation:
      "Um container standalone existe enquanto você não o remover. Um serviço Swarm declara um estado desejado (ex.: '3 réplicas rodando') e o orquestrador garante que esse estado seja mantido continuamente — recriando tasks falhas, redistribuindo em nós disponíveis e aplicando updates de forma controlada.",
    conceptSlug: "swarm-service",
  },
  {
    id: "sq3",
    question: "O que acontece quando você coloca um nó em modo `drain`?",
    options: [
      "O nó é removido permanentemente do cluster",
      "O nó para de aceitar novas tasks e as tasks existentes são migradas para outros nós",
      "O nó fica em modo somente-leitura e não pode mais executar comandos Docker",
      "Todos os containers do nó são pausados até o modo ser revertido",
    ],
    correctIndex: 1,
    explanation:
      "O modo `drain` é usado para manutenção segura: o Swarm para de agendar novas tasks no nó e ativa o processo de migração das tasks existentes para outros nós disponíveis. O nó permanece no cluster (aparece em `docker node ls`) mas sem executar workload. Para retomar, basta mudar a disponibilidade para `active`.",
    conceptSlug: "swarm-node",
  },
  {
    id: "sq4",
    question: "Qual é a diferença entre os modos `replicated` e `global` de um serviço Swarm?",
    options: [
      "Replicated roda em todos os nós, global roda num número fixo de nós",
      "Replicated define um número fixo de réplicas distribuídas; global roda exatamente 1 instância em cada nó do cluster",
      "Global é mais rápido que replicated para workloads de alta concorrência",
      "Não há diferença funcional, são configurações de nomenclatura",
    ],
    correctIndex: 1,
    explanation:
      "No modo `replicated`, você especifica um número de réplicas e o Swarm as distribui pelos nós de forma a balancear a carga. No modo `global`, o Swarm garante exatamente 1 instância em cada nó — quando novos nós entram no cluster, uma task é criada automaticamente neles. Global é ideal para agentes de monitoramento, log collectors e ferramentas que precisam rodar em toda a infraestrutura.",
    conceptSlug: "swarm-service",
  },
  {
    id: "sq5",
    question: "Como serviços em uma overlay network se descobrem e se comunicam entre si?",
    options: [
      "Precisam ser configurados manualmente com os IPs de cada nó do cluster",
      "Usam variáveis de ambiente injetadas automaticamente com os IPs dos outros serviços",
      "Pelo nome do serviço como hostname — o DNS interno do Swarm resolve automaticamente",
      "Apenas através da rede ingress, que faz proxy de todas as comunicações internas",
    ],
    correctIndex: 2,
    explanation:
      "O Swarm inclui um servidor DNS interno. Quando dois serviços estão na mesma overlay network, um pode se conectar ao outro usando o nome do serviço como endereço (ex.: `http://api:3000`). O DNS resolve para o IP virtual do serviço (VIP), que faz load balancing entre as réplicas. Isso elimina a necessidade de service discovery externo para comunicação interna.",
    conceptSlug: "swarm-overlay-network",
  },
  {
    id: "sq6",
    question: "O que é o routing mesh do Docker Swarm?",
    options: [
      "Um algoritmo para distribuir tasks de forma uniforme entre os nós",
      "Um sistema que permite que qualquer nó do cluster receba tráfego em portas publicadas, mesmo sem ter uma task daquele serviço",
      "Uma rede de backup usada quando a overlay network principal falha",
      "O protocolo de consenso usado pelos managers para sincronizar o estado do cluster",
    ],
    correctIndex: 1,
    explanation:
      "O routing mesh é implementado pela rede `ingress` do Swarm. Quando uma porta é publicada (ex.: `-p 80:80`), todos os nós do cluster passam a aceitar tráfego nessa porta — mesmo nós sem nenhuma task daquele serviço. O tráfego é roteado internamente para uma task ativa. Isso simplifica o load balancing externo: qualquer IP do cluster pode ser usado como entry point.",
    conceptSlug: "swarm-overlay-network",
  },
];
