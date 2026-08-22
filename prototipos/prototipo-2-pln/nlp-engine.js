/**
 * Protótipo 2 — Motor de PLN Leve no Navegador (Intent Classifier & Slot Filling)
 * Projeto TCC — Marília Stefenon
 */

// 1. Dicionário de Stopwords em Português
const STOPWORDS_PT = new Set([
  "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "do", "da", "dos", "das",
  "em", "no", "na", "nos", "nas", "por", "para", "com", "sem", "e", "ou", "que",
  "como", "se", "eu", "ele", "ela", "nos", "eles", "elas", "meu", "minha", "seu",
  "sua", "sou", "estou", "estudo", "aqui", "gostaria", "preciso", "quero", "ola", "oi"
]);

// 2. Base de Treinamento de Intenções (Corpus PLN)
const INTENT_CORPUS = {
  "emitir_declaracao_matricula": [
    "preciso de uma declaracao de matricula",
    "como emitir atestado de matricula",
    "quero comprovante que estudo no ifsc",
    "atestado para passe escolar onibus transporte",
    "gerar declaracao de vinculo escolar",
    "preciso de atestado de frequencia para o estagio"
  ],
  "justificar_falta": [
    "quero justificar minhas faltas",
    "faltei na aula por motivo de doenca",
    "como entregar atestado medico de ausencia",
    "justificativa de falta da faculdade",
    "perdi aula preciso abonar a falta"
  ],
  "solicitar_aproveitamento": [
    "quero pedir aproveitamento de disciplina",
    "validar materia que fiz em outra faculdade",
    "dispensa de unidade curricular aproveitamento de estudos",
    "como validar cadeira e equivalencia"
  ],
  "consultar_rematricula": [
    "quando comeca a rematricula",
    "prazos de inscricao de disciplinas no sigaa",
    "calendario de rematricula do semestre",
    "datas de renovacao de matricula"
  ],
  "consultar_trancamento": [
    "como trancar o curso",
    "quantos semestres posso trancar",
    "regras de trancamento de matricula",
    "posso pausar minha faculdade"
  ],
  "consultar_horarios": [
    "qual o horario de atendimento da secretaria",
    "que horas a secretaria abre e fecha",
    "onde fica a secretaria e telefone de contato"
  ]
};

// 3. Normalizador e Tokenizador
function tokenizeAndClean(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^\w\s]/gi, " ")
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS_PT.has(t));
}

// 4. Classificador de Intenções via Similaridade de Cosseno (TF-IDF Leve)
function classifyIntent(text) {
  const inputTokens = tokenizeAndClean(text);
  if (inputTokens.length === 0) return { intent: "desconhecido", confidence: 0 };

  const inputSet = new Set(inputTokens);
  let bestIntent = "desconhecido";
  let maxScore = 0;

  for (const [intent, examples] of Object.entries(INTENT_CORPUS)) {
    for (const example of examples) {
      const exampleTokens = tokenizeAndClean(example);
      const exampleSet = new Set(exampleTokens);

      // Calcular interseção
      let matches = 0;
      for (const token of inputTokens) {
        if (exampleSet.has(token)) matches++;
      }

      // Jaccard / Cosseno aproximado
      const totalUnique = new Set([...inputTokens, ...exampleTokens]).size;
      const score = totalUnique > 0 ? (matches / Math.sqrt(inputTokens.length * exampleTokens.length)) : 0;

      if (score > maxScore) {
        maxScore = score;
        bestIntent = intent;
      }
    }
  }

  return { intent: bestIntent, confidence: Math.min(1, maxScore * 1.35) };
}

// 5. Extrator de Entidades / Slots (NER baseado em Padrões e Dicionários)
function extractEntities(text) {
  const entities = {};
  const clean = text.toLowerCase();

  // Matrícula (Padrão IFSC de 10 a 12 dígitos)
  const matMatch = text.match(/\b202[0-9]{7,9}\b/);
  if (matMatch) entities.matricula = matMatch[0];

  // CPF
  const cpfMatch = text.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/);
  if (cpfMatch) entities.cpf = cpfMatch[0];

  // Empresa de Transporte / Finalidade
  if (/paulotur|santo anjo|santa terezinha|catarinense|onibus|passe|transporte/.test(clean)) {
    entities.finalidade = "Passe Escolar / Transporte Regional";
  } else if (/estagio|empresa|trabalho|emprego/.test(clean)) {
    entities.finalidade = "Comprovação para Estágio/Trabalho";
  }

  // Disciplina
  const discMatch = clean.match(/banco de dados|algoritmos|programacao|redes|administracao|matematica|estatistica|ingles|quimica|fisica/);
  if (discMatch) entities.disciplina = discMatch[0].toUpperCase();

  // Motivo de falta
  if (/medico|atestado|doenca|saude|consulta|hospital/.test(clean)) {
    entities.motivo = "Motivo de Saúde / Atestado Médico";
  } else if (/trabalho|viagem|luto|familiar/.test(clean)) {
    entities.motivo = "Motivo de Força Maior / Trabalho";
  }

  return entities;
}

// 6. Gerenciamento do Diálogo e Preenchimento de Slots
let p2ActiveSlots = {};
let p2CurrentIntent = null;

document.addEventListener("DOMContentLoaded", () => {
  renderUserStatus();
  iniciarChat();

  const input = document.getElementById("user-input");
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  window.addEventListener("ifsc_user_changed", () => {
    renderUserStatus();
  });
});

function renderUserStatus() {
  const container = document.getElementById("user-status-container");
  const user = IFSC_Session.getCurrentUser();

  if (user) {
    container.innerHTML = `
      <span class="user-status-identified">
        <i class="bi bi-person-check-fill"></i> 
        ${user.nome} (${user.curso} • ${user.matricula})
      </span>
    `;
  } else {
    container.innerHTML = `
      <span class="user-status-anonymous">
        <i class="bi bi-incognito"></i> Aluno não identificado
      </span>
    `;
  }
}

function iniciarChat() {
  const user = IFSC_Session.getCurrentUser();
  const chat = document.getElementById("chat-messages");
  chat.innerHTML = "";

  if (user) {
    appendBotMessage(`Olá, <strong>${user.nome.split(" ")[0]}</strong>! 👋<br>Motor de PLN pronto. Você pode digitar ou falar sua demanda em linguagem natural (ex: pedir atestados, justificar faltas ou consultar regras).`);
  } else {
    appendBotMessage(`Olá! Sou o <strong>Chatbot Inteligente com PLN</strong> da Secretaria Acadêmica do IFSC Garopaba.<br><br>Você pode conversar comigo naturalmente como falaria com um atendente. Como posso te orientar hoje?`);
  }
}

// Processar Mensagem do Usuário no P2
async function sendMessage() {
  const input = document.getElementById("user-input");
  const text = input.value.trim();
  if (!text) return;

  appendUserMessage(text);
  input.value = "";
  input.focus();

  const startTime = performance.now();

  // 1. Extração de Entidades na Frase
  const extractedEntities = extractEntities(text);
  Object.assign(p2ActiveSlots, extractedEntities);

  // Se o aluno informou a matrícula ou CPF na frase, valida no SIGAA
  if (extractedEntities.matricula || extractedEntities.cpf) {
    const student = IFSC_Session.findStudent(extractedEntities.matricula || extractedEntities.cpf);
    if (student) {
      IFSC_Session.setCurrentUser(student);
      p2ActiveSlots.student = student;
    }
  }

  // 2. Classificação de Intenções
  const classification = classifyIntent(text);
  const elapsed = (performance.now() - startTime).toFixed(2);

  // Atualizar Debug Panel
  const confidencePercent = (classification.confidence * 100).toFixed(1);
  document.getElementById("pln-confidence").innerText = `Confiança: ${confidencePercent}% (${elapsed}ms)`;
  
  const entitiesList = Object.entries(p2ActiveSlots).map(([k, v]) => `<strong>${k}:</strong> ${typeof v === 'object' ? v.nome : v}`).join(", ") || "Nenhuma";
  document.getElementById("pln-details").innerHTML = `Intenção: <strong>${classification.intent}</strong> | Slots Ativos: ${entitiesList}`;

  // 3. Execução da Lógica de Negócio por Intenção
  const currentUser = IFSC_Session.getCurrentUser();

  // --- INTENÇÃO: EMITIR DECLARAÇÃO DE MATRÍCULA ---
  if (classification.intent === "emitir_declaracao_matricula" || p2CurrentIntent === "emitir_declaracao_matricula") {
    p2CurrentIntent = "emitir_declaracao_matricula";

    if (!currentUser) {
      appendBotMessage(`Identifiquei que você deseja emitir uma <strong>Declaração de Matrícula</strong> com autenticação digital. 📜<br><br>Por favor, informe seu <strong>número de matrícula ou CPF</strong> para eu consultar seus dados no SIGAA:`);
      return;
    }

    const finalidade = p2ActiveSlots.finalidade || "Comprovação de Vínculo Acadêmico";
    p2CurrentIntent = null;
    p2ActiveSlots = {};

    appendBotMessage(`Perfeito, <strong>${currentUser.nome.split(" ")[0]}</strong>! Processando sua solicitação para <em>${finalidade}</em>... ⏳`);
    processarEmissaoAtestadoP2(currentUser, finalidade);
    return;
  }

  // --- INTENÇÃO: JUSTIFICAR FALTA ---
  if (classification.intent === "justificar_falta" || p2CurrentIntent === "justificar_falta") {
    p2CurrentIntent = "justificar_falta";

    if (!currentUser) {
      appendBotMessage(`Identifiquei sua solicitação de <strong>Justificativa de Falta</strong>. Por favor, informe sua <strong>matrícula ou CPF</strong> para vincular ao requerimento:`);
      return;
    }

    if (!p2ActiveSlots.motivo) {
      appendBotMessage(`Entendido, <strong>${currentUser.nome.split(" ")[0]}</strong>. Qual foi o <strong>motivo ou período da ausência</strong> (ex.: atestado médico, trabalho, viagem)?`);
      return;
    }

    // Registrar demanda no sistema do Ramon
    const req = IFSC_Session.saveDemand({
      matricula: currentUser.matricula,
      nome: currentUser.nome,
      curso: currentUser.curso,
      tipo: "Justificativa de Falta (PLN)",
      detalhes: `Motivo extraído: ${p2ActiveSlots.motivo} (Texto: "${text}")`,
      status: "Pendente de Análise (Ramon)",
      arquivo: "Requerimento_Justificativa.pdf"
    });

    p2CurrentIntent = null;
    const motivoFinal = p2ActiveSlots.motivo;
    p2ActiveSlots = {};

    appendBotMessage(`Requerimento protocolado com sucesso! ✅<br><br><strong>Protocolo:</strong> <code>${req.id}</code><br><strong>Estudante:</strong> ${currentUser.nome}<br><strong>Motivo classificado:</strong> ${motivoFinal}<br><br>O servidor Ramon já recebeu sua demanda no painel da Secretaria.`);
    return;
  }

  // --- INTENÇÃO: SOLICITAR APROVEITAMENTO DE DISCIPLINA ---
  if (classification.intent === "solicitar_aproveitamento") {
    const disc = p2ActiveSlots.disciplina ? `da disciplina <strong>${p2ActiveSlots.disciplina}</strong>` : "de disciplinas";
    const userMsg = currentUser ? `<strong>${currentUser.nome.split(" ")[0]}</strong>` : "estudante";

    const req = IFSC_Session.saveDemand({
      matricula: currentUser ? currentUser.matricula : "Não informado",
      nome: currentUser ? currentUser.nome : "Estudante",
      curso: currentUser ? currentUser.curso : "Geral",
      tipo: "Aproveitamento de Estudos",
      detalhes: `Disciplina solicitada: ${p2ActiveSlots.disciplina || "Geral"}`,
      status: "Aguardando Ementas",
      arquivo: "Formulario_Validacao.docx"
    });

    appendBotMessage(`Olá, ${userMsg}! Para dar entrada no pedido de <strong>aproveitamento/validação ${disc}</strong>, foi gerado o protocolo <code>${req.id}</code>.<br><br>📋 <strong>Próximo passo:</strong> Entregue o histórico oficial e a ementa da instituição de origem na Secretaria Acadêmica.`);
    p2ActiveSlots = {};
    return;
  }

  // --- INTENÇÕES INFORMATIVAS (CATEGORIA A) ---
  if (classification.confidence >= 0.35) {
    const faqMatch = SECRETARIA_FAQ.find(f => f.id === classification.intent.replace("consultar_", "")) || SECRETARIA_FAQ[0];
    appendBotMessage(`<strong>${faqMatch.titulo}</strong><br><br>${faqMatch.resposta}`);
  } else {
    appendBotMessage(`Não compreendi com clareza suficiente sua mensagem (Confiança PLN: ${confidencePercent}%).<br><br>💡 Você pode tentar reformular com termos mais diretos (ex: <em>"atestado de matrícula"</em>, <em>"justificar falta médica"</em>, <em>"trancamento"</em>).`);
  }
}

async function processarEmissaoAtestadoP2(student, finalidade) {
  try {
    const { pdfBytes, codAutenticacao } = await gerarDeclaracaoMatriculaPDF(student, finalidade);
    
    const req = IFSC_Session.saveDemand({
      matricula: student.matricula,
      nome: student.nome,
      curso: student.curso,
      tipo: "Emissão de Declaração de Matrícula (PLN)",
      detalhes: `Código Autenticação: ${codAutenticacao} (${finalidade})`,
      status: "Emitido Automaticamente",
      arquivo: "Declaracao_Matricula.pdf"
    });

    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const cardHtml = `
      Declaração gerada com sucesso via motor de PLN! 🎉<br>
      <strong>Autenticação Digital:</strong> <code>${codAutenticacao}</code>
      <div class="document-card">
        <div class="document-info">
          <i class="bi bi-file-earmark-pdf-fill document-icon"></i>
          <div>
            <div style="font-weight: 700; font-size: 0.9rem;">Declaracao_Matricula_${student.matricula}.pdf</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">PDF Oficial IFSC • Reconhecido pelo SIGAA</div>
          </div>
        </div>
        <a href="${url}" download="Declaracao_Matricula_${student.matricula}.pdf" class="btn-download">
          <i class="bi bi-download"></i> Baixar PDF
        </a>
      </div>
    `;

    appendBotMessage(cardHtml);
  } catch (e) {
    console.error(e);
    appendBotMessage("Erro ao compilar documento PDF.");
  }
}

function handleQuickReply(text) {
  const input = document.getElementById("user-input");
  input.value = text;
  sendMessage();
}

function simularLogin(matricula) {
  const student = IFSC_Session.findStudent(matricula);
  if (student) {
    IFSC_Session.setCurrentUser(student);
    iniciarChat();
  }
}

function simularLogout() {
  IFSC_Session.setCurrentUser(null);
  iniciarChat();
}

function appendUserMessage(text) {
  const chat = document.getElementById("chat-messages");
  const row = document.createElement("div");
  row.className = "message-row user";
  row.innerHTML = `
    <div class="avatar avatar-user"><i class="bi bi-person-fill"></i></div>
    <div class="bubble bubble-user">${escapeHtml(text)}</div>
  `;
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
}

function appendBotMessage(html) {
  const chat = document.getElementById("chat-messages");
  const row = document.createElement("div");
  row.className = "message-row bot";
  row.innerHTML = `
    <div class="avatar avatar-bot"><i class="bi bi-robot"></i></div>
    <div class="bubble bubble-bot">${html}</div>
  `;
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}
