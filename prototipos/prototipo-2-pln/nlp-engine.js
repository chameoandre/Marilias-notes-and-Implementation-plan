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
  "consultar_pendencias": [
    "tenho alguma pendencia no sigaa",
    "quais documentos estao pendentes",
    "verificar pendencias na biblioteca ou secretaria",
    "meus debitos documentais",
    "minha situacao tem pendencia",
    "relatorio de pendencias"
  ],
  "consultar_status_solicitacao": [
    "qual o status do meu requerimento",
    "o ramon ja deu parecer",
    "ver andamento da minha justificativa",
    "consultar protocolo req",
    "como esta meu pedido",
    "retorno da secretaria e despacho"
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
    "onde fica a secretaria e telefone de contato",
    "contato whatsapp da secretaria e registro academico"
  ],
  "consultar_cursos": [
    "quais cursos tem no campus garopaba",
    "o que posso estudar no ifsc em garopaba",
    "tem sistemas para internet informatica ou administracao",
    "quais sao os cursos tecnicos e superior",
    "tem mestrado ou pos graduacao"
  ],
  "consultar_ingresso": [
    "como entrar no ifsc",
    "quando abre o vestibular unificado",
    "como funciona o sisu e o sorteio publico",
    "processos seletivos e editais abertos",
    "cadastro de interesse para novas vagas"
  ],
  "consultar_faltas_atestado": [
    "qual o prazo para entregar atestado medico",
    "quantos dias tenho para justificar falta no rdp",
    "regras de justificativa de ausencia por doenca"
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
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  window.addEventListener("ifsc_user_changed", () => {
    renderUserStatus();
    renderMainMenuP2(false);
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
        <i class="bi bi-incognito"></i> Aluno não identificado (Acesso Visitante / Comunidade)
      </span>
    `;
  }
}

function iniciarChat() {
  const chat = document.getElementById("chat-messages");
  chat.innerHTML = "";
  renderMainMenuP2(true);
}

let p2ActiveMenuItems = [];

function renderMainMenuP2(showGreeting = false) {
  const user = IFSC_Session.getCurrentUser();
  const saudacao = user 
    ? `Olá, <strong>${user.nome.split(" ")[0]}</strong>! 👋 (Matrícula: <code>${user.matricula}</code> - ${user.curso})`
    : `Olá! Sou o <strong>Chatbot Inteligente com PLN</strong> da Secretaria Acadêmica do IFSC Garopaba.`;

  p2ActiveMenuItems = IFSC_Session.getAvailableMenuItems();

  const optionsHtml = p2ActiveMenuItems.map((item, index) => {
    const num = index + 1;
    const badge = item.badge ? `<span style="background: rgba(239, 68, 68, 0.2); color: #f87171; font-size: 0.75rem; padding: 0.15rem 0.4rem; border-radius: 4px; margin-left: 0.4rem; border: 1px solid rgba(239,68,68,0.3);">${item.badge}</span>` : "";
    return `<strong>[${num}]</strong> ${item.titulo}${badge}`;
  }).join("<br>");

  const menuHtml = `
    ${showGreeting ? `${saudacao}<br><br>` : ""}
    <strong>Menu de Atendimento (PLN & Atalhos Numéricos):</strong><br>
    Você pode falar/digitar em linguagem natural ou escolher um <strong>número</strong>:<br><br>
    
    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; font-size: 0.88rem; line-height: 1.7;">
      ${optionsHtml}
      <hr style="border: none; border-top: 1px solid var(--border-color); margin: 0.5rem 0;">
      <strong>[9]</strong> 🚪 Sair / Encerrar Atendimento
    </div>
  `;

  appendBotMessage(menuHtml);
  renderQuickRepliesP2();
  document.getElementById("pln-details").innerHTML = `Menu Dinâmico Ativo (${p2ActiveMenuItems.length} opções disponíveis) • Digite um número [1-${p2ActiveMenuItems.length}] ou frase livre`;
}

// Renderizar Botões de Atalhos Rápidos Dinâmicos no P2
function renderQuickRepliesP2() {
  const container = document.getElementById("quick-replies");
  if (!container) return;

  const chips = p2ActiveMenuItems.map((item, index) => {
    const num = index + 1;
    let icon = "bi-arrow-right-circle";
    if (item.action.includes("DECLARACAO")) icon = "bi-file-earmark-pdf";
    else if (item.action.includes("PENDENCIAS")) icon = "bi-exclamation-triangle";
    else if (item.action.includes("PARECER")) icon = "bi-card-checklist";
    else if (item.action.includes("REQUERIMENTO")) icon = "bi-pencil-square";
    else if (item.action.includes("FAQ")) icon = "bi-question-circle";
    else if (item.action.includes("ATENDENTE")) icon = "bi-person-headset";
    else if (item.action.includes("LOGIN")) icon = "bi-key-fill";

    const labelCurto = item.titulo.replace(/^[^\w\s]+/, '').trim().split(" ")[0];
    return `<button class="btn-chip" onclick="handleQuickReply('${num}')"><i class="bi ${icon}"></i> [${num}] ${labelCurto}</button>`;
  });

  chips.push(`<button class="btn-chip" onclick="handleQuickReply('0')"><i class="bi bi-house-door"></i> [0] Início</button>`);
  chips.push(`<button class="btn-chip" onclick="handleQuickReply('9')"><i class="bi bi-box-arrow-right"></i> [9] Sair</button>`);

  container.innerHTML = chips.join(" ");
}

function renderAtendenteP2() {
  const user = IFSC_Session.getCurrentUser();
  const mailtoRamon = `mailto:secretaria.gpb@ifsc.edu.br?subject=Mensagem Direta de Atendimento - ${user ? user.nome : 'Visitante'}&body=Olá Equipe da Secretaria,%0D%0A%0D%0AGostaria de tirar uma dúvida sobre atendimento acadêmico:%0D%0A`;

  appendBotMessage(`
    👤 <strong>Atendimento Humano — Secretaria Acadêmica:</strong><br><br>
    • <strong>Local:</strong> Bloco Administrativo (Câmpus Garopaba)<br>
    • <strong>Horário:</strong> Segunda a Sexta, das <strong>08h00 às 12h00</strong> e das <strong>13h00 às 19h00</strong><br>
    • <strong>WhatsApp / Fone:</strong> (48) 3254-7336<br>
    • <strong>E-mails:</strong> <code>secretaria.gpb@ifsc.edu.br</code> | <code>ra.gpb@ifsc.edu.br</code><br><br>
    <div style="margin-bottom: 0.5rem;">
      <a href="${mailtoRamon}" target="_blank" class="btn-chip" style="background: rgba(56, 189, 248, 0.2); border-color: var(--accent-blue); color: var(--accent-blue); display: inline-flex; align-items: center; gap: 0.4rem; text-decoration: none; padding: 0.45rem 0.8rem;">
        <i class="bi bi-envelope-paper-heart-fill"></i> Abrir E-mail para a Secretaria
      </a>
    </div>
    <small style="color:var(--text-muted);">[0] Voltar ao Início | [9] Sair</small>
  `);
}

function renderEncerrarP2() {
  appendBotMessage(`
    🚪 <strong>Atendimento Finalizado!</strong><br><br>
    Obrigado por utilizar o assistente PLN da Secretaria Acadêmica do IFSC Garopaba. Tenha um ótimo dia! 👋<br><br>
    <small style="color:var(--text-muted);">Digite <strong>[0]</strong> para iniciar um novo atendimento.</small>
  `);
}

// Processar Mensagem do Usuário no P2
async function sendMessage() {
  const input = document.getElementById("user-input");
  const text = input.value.trim();
  if (!text) return;

  appendUserMessage(text);
  input.value = "";
  input.focus();

  const textLower = text.toLowerCase();

  // Navegação Universal
  if (text === "0" || textLower === "voltar" || textLower === "inicio" || textLower === "início" || textLower === "menu") {
    p2CurrentIntent = null;
    p2ActiveSlots = {};
    renderMainMenuP2(false);
    return;
  }

  if (text === "9" || textLower === "sair" || textLower === "encerrar" || textLower === "tchau") {
    renderEncerrarP2();
    return;
  }

  // Atalhos Numéricos Dinâmicos do Menu
  const selectedNum = parseInt(text, 10);
  if (!isNaN(selectedNum) && selectedNum >= 1 && selectedNum <= p2ActiveMenuItems.length && !p2CurrentIntent) {
    const item = p2ActiveMenuItems[selectedNum - 1];
    executeP2MenuItem(item);
    return;
  }

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
      status: "Pendente de Documento ⚠️",
      parecer: "Aguardando entrega de ementa e histórico oficial.",
      arquivo: "Formulario_Validacao.docx"
    });

    const mailtoLink = currentUser ? IFSC_Session.generateMailtoLink(currentUser, req.id, "Aproveitamento de Estudos", `Disciplina: ${p2ActiveSlots.disciplina || "Geral"}`) : null;
    const emailButton = mailtoLink ? `
      <div style="margin-top: 0.75rem;">
        <a href="${mailtoLink}" target="_blank" class="btn-chip" style="background: rgba(56, 189, 248, 0.2); border-color: var(--accent-blue); color: var(--accent-blue); display: inline-flex; align-items: center; gap: 0.4rem; text-decoration: none; padding: 0.4rem 0.75rem;">
          <i class="bi bi-envelope-arrow-up-fill"></i> Abrir Comprovante de Solicitação por E-mail
        </a>
      </div>
    ` : "";

    appendBotMessage(`Olá, ${userMsg}! Para dar entrada no pedido de <strong>aproveitamento/validação ${disc}</strong>, registrei o protocolo <code>${req.id}</code>.<br><br>📋 <strong>Próximo passo:</strong> Entregue o histórico oficial e a ementa da instituição de origem na Secretaria Acadêmica (Ramon).${emailButton}`);
    p2ActiveSlots = {};
    return;
  }

  // --- INTENÇÃO: CONSULTAR PENDÊNCIAS ACADÊMICAS / DOCUMENTAIS ---
  if (classification.intent === "consultar_pendencias") {
    if (!currentUser) {
      appendBotMessage(`Para checar suas <strong>pendências no SIGAA</strong>, por favor informe sua <strong>matrícula ou CPF</strong>:`);
      return;
    }

    const pendencias = IFSC_Session.getStudentPendencies(currentUser.matricula);
    const mailtoLink = IFSC_Session.generatePendenciesMailtoLink(currentUser, pendencias);
    const emailBtn = `
      <div style="margin-top: 0.75rem;">
        <a href="${mailtoLink}" target="_blank" class="btn-chip" style="background: rgba(167, 139, 250, 0.2); border-color: #a78bfa; color: #a78bfa; display: inline-flex; align-items: center; gap: 0.4rem; text-decoration: none; padding: 0.4rem 0.75rem;">
          <i class="bi bi-envelope-paper-fill"></i> Encaminhar Quadro de Pendências para Meu E-mail (${currentUser.email})
        </a>
      </div>
    `;

    if (!pendencias.length) {
      appendBotMessage(`Tudo em dia, <strong>${currentUser.nome.split(" ")[0]}</strong>! 🎉<br><br>O motor de PLN consultou o SIGAA e não identificou nenhuma pendência ativa para sua matrícula <code>${currentUser.matricula}</code>.${emailBtn}`);
    } else {
      const items = pendencias.map(p => `<li><strong style="color: var(--accent-amber);">[${p.tipo}]</strong> ${p.descricao} (Setor: ${p.setor} | Prazo: ${p.prazo})</li>`).join("");
      appendBotMessage(`Atenção, <strong>${currentUser.nome.split(" ")[0]}</strong>! Constam <strong>${pendencias.length} pendência(s)</strong> no seu cadastro do SIGAA: ⚠️<br><ul style="margin: 0.5rem 0 0.5rem 1.25rem;">${items}</ul>${emailBtn}`);
    }
    return;
  }

  // --- INTENÇÃO: CONSULTAR STATUS / RETORNO DE SOLICITAÇÃO ---
  if (classification.intent === "consultar_status_solicitacao") {
    if (!currentUser) {
      appendBotMessage(`Para consultar o <strong>parecer e andamento</strong> de suas solicitações, digite sua <strong>matrícula ou CPF</strong>:`);
      return;
    }

    const demands = IFSC_Session.getStudentDemands(currentUser.matricula);
    if (!demands.length) {
      appendBotMessage(`Olá, <strong>${currentUser.nome.split(" ")[0]}</strong>! Nenhuma solicitação ativa vinculada à matrícula <code>${currentUser.matricula}</code> no momento.`);
      return;
    }

    const demandsHtml = demands.map(d => {
      const returnMailto = IFSC_Session.generateReturnMailtoLink(currentUser, d);
      const parecerBlock = d.parecer ? `
        <div style="margin-top: 0.35rem; padding: 0.35rem 0.5rem; background: rgba(255,255,255,0.03); border-left: 2px solid var(--accent-blue); font-size: 0.8rem;">
          <strong>Parecer Ramon:</strong> "${d.parecer}" (${d.dataParecer || 'Hoje'})
          <div style="margin-top: 0.25rem;">
            <a href="${returnMailto}" target="_blank" style="color: #a78bfa; font-size: 0.75rem; text-decoration: none;">
              <i class="bi bi-envelope-at"></i> Abrir Parecer por E-mail
            </a>
          </div>
        </div>
      ` : `<div style="font-size: 0.75rem; color: var(--text-muted);">Aguardando parecer do servidor Ramon.</div>`;

      return `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.6rem; margin-bottom: 0.5rem;">
          <div style="display: flex; justify-content: space-between;">
            <strong style="color: var(--accent-blue); font-size: 0.85rem;">${d.id} — ${d.tipo}</strong>
            <span style="font-size: 0.75rem; font-weight: 600;">${d.status}</span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${d.detalhes}</div>
          ${parecerBlock}
        </div>
      `;
    }).join("");

    appendBotMessage(`Aqui está o status das suas <strong>solicitações registradas</strong>: 📋<br><br>${demandsHtml}`);
    return;
  }

  // --- INTENÇÕES INFORMATIVAS (CATEGORIA A) ---
  if (classification.confidence >= 0.35) {
    const topicId = classification.intent.replace("consultar_", "");
    const faqMatch = SECRETARIA_FAQ.find(f => f.id === topicId) || SECRETARIA_FAQ[0];
    appendBotMessage(`<strong>${faqMatch.titulo}</strong><br><br>${faqMatch.resposta.replace(/\n/g, '<br>')}`);
  } else {
    appendBotMessage(`Não compreendi com clareza suficiente sua mensagem (Confiança PLN: ${confidencePercent}%).<br><br>💡 Você pode tentar reformular com termos mais diretos (ex: <em>"atestado de matrícula"</em>, <em>"justificar falta médica"</em>, <em>"consultar pendências"</em>, <em>"status do pedido"</em>, <em>"cursos ofertados"</em>).`);
  }
}

function formatBotReply(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/•/g, "&bull;")
    .replace(/\n/g, "<br>");
}

// Executar ação selecionada no menu numérico do P2
function executeP2MenuItem(item) {
  const user = IFSC_Session.getCurrentUser();

  switch (item.action) {
    case "FLOW_DECLARACAO":
      if (!user) {
        appendBotMessage(`Para emitir sua <strong>Declaração de Matrícula</strong>, por favor informe sua <strong>Matrícula ou CPF</strong>:`);
        return;
      }
      processarEmissaoAtestadoP2(user, "Fins Acadêmicos");
      break;

    case "FLOW_PENDENCIAS":
      if (!user) {
        appendBotMessage(`Para consultar suas <strong>pendências</strong>, por favor digite sua <strong>Matrícula ou CPF</strong>:`);
        return;
      }
      const pendencias = IFSC_Session.getStudentPendencies(user.matricula);
      const mailto = IFSC_Session.generatePendenciesMailtoLink(user, pendencias);
      const btn = `<div style="margin-top:0.5rem;"><a href="${mailto}" target="_blank" class="btn-chip" style="color:#a78bfa; text-decoration:none;"><i class="bi bi-envelope-paper"></i> Enviar Pendências ao Meu E-mail</a></div>`;
      if (!pendencias.length) {
        appendBotMessage(`Situação Regular! 🎉 Nenhuma pendência documental ou acadêmica ativa.${btn}<br><small style="color:var(--text-muted);">[0] Voltar | [9] Sair</small>`);
      } else {
        const items = pendencias.map(p => `<li><strong style="color:var(--accent-amber);">[${p.tipo}]</strong> ${p.descricao} (Prazo: ${p.prazo})</li>`).join("");
        appendBotMessage(`Constam <strong>${pendencias.length} pendência(s)</strong> no SIGAA: ⚠️<br><ul style="margin:0.5rem 0 0.5rem 1.25rem;">${items}</ul>${btn}<br><small style="color:var(--text-muted);">[0] Voltar | [9] Sair</small>`);
      }
      break;

    case "FLOW_CONSULTA_PARECER":
      if (!user) {
        appendBotMessage(`Para rastrear o <strong>status e parecer</strong> de suas solicitações, digite sua <strong>Matrícula ou CPF</strong>:`);
        return;
      }
      const demands = IFSC_Session.getStudentDemands(user.matricula);
      if (!demands.length) {
        appendBotMessage(`Nenhuma solicitação encontrada no momento.<br><small style="color:var(--text-muted);">[0] Voltar | [9] Sair</small>`);
        return;
      }
      const htmlDemands = demands.map(d => `<div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:0.6rem; margin-bottom:0.5rem;"><strong>${d.id} — ${d.tipo}</strong>: ${d.status}<br><small>${d.detalhes}</small>${d.parecer ? `<br><strong>Parecer:</strong> "${d.parecer}"` : ''}</div>`).join("");
      appendBotMessage(`Status dos seus pedidos: 📋<br><br>${htmlDemands}<br><small style="color:var(--text-muted);">[0] Voltar | [9] Sair</small>`);
      break;

    case "SUBMENU_REQUERIMENTOS":
      appendBotMessage(`📝 <strong>Abertura de Requerimentos:</strong><br>Você pode digitar frases como:<br>• <em>"Quero justificar falta de consulta médica"</em><br>• <em>"Pedir aproveitamento da matéria de banco de dados"</em><br><br><small style="color:var(--text-muted);">[0] Voltar ao Menu</small>`);
      break;

    case "SUBMENU_FAQ":
    case "FLOW_FAQ_TOPIC":
      const topicId = item.payload || "horario";
      const faqItem = SECRETARIA_FAQ.find(f => f.id === topicId) || SECRETARIA_FAQ[0];
      appendBotMessage(`<strong>${faqItem.titulo}</strong><br><br>${formatBotReply(faqItem.resposta)}<br><br><small style="color:var(--text-muted);">[0] Voltar ao Menu</small>`);
      break;

    case "FLOW_ATENDENTE":
      renderAtendenteP2();
      break;

    case "FLOW_LOGIN":
      appendBotMessage(`Para identificar sua matrícula e consultar dados pessoais no SIGAA, por favor digite sua <strong>Matrícula ou CPF</strong>:`);
      break;

    default:
      renderMainMenuP2(false);
      break;
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
