/**
 * Protótipo 1 — Lógica de Busca Lexical & Formulário Guiado
 * Projeto TCC — Marília Stefenon
 */

// Estado da Conversação
let currentFlowState = "IDLE"; 
let pendingData = {};

// Menu Ativo na Sessão Corrente
let currentActiveMenuItems = [];

// Instância do Fuse.js para Busca Lexical (alimentada com a base oficial)
const fuseOptions = {
  includeScore: true,
  threshold: 0.55,
  ignoreLocation: true,
  keys: [
    { name: "tags", weight: 0.5 },
    { name: "titulo", weight: 0.3 },
    { name: "resposta", weight: 0.2 }
  ]
};
let fuseEngine = new Fuse(SECRETARIA_FAQ, fuseOptions);

// Inicialização da Página
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
    renderMainMenu(false);
  });
});

// Renderizar status do usuário no topo
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

// Iniciar mensagem de boas-vindas inteligente com Menu Principal
function iniciarChat() {
  const chat = document.getElementById("chat-messages");
  chat.innerHTML = "";
  currentFlowState = "IDLE";
  pendingData = {};

  renderMainMenu(true);
}

// Renderizar Menu Principal Categorizado e Humanizado
function renderMainMenu(showGreeting = false) {
  currentFlowState = "IDLE";
  const user = IFSC_Session.getCurrentUser();
  const timeGreeting = IFSC_Session.getTimeGreeting();
  const empathyNote = user ? IFSC_Session.getEmpathyNote(user, "saudacao") : "";
  
  const saudacao = user 
    ? `${timeGreeting}, <strong>${user.nome.split(" ")[0]}</strong>! 👋 Que bom ter você por aqui.<br>Identifiquei seu vínculo regular no <strong>${user.curso}</strong> (${user.fase} • Matrícula: <code>${user.matricula}</code>).${empathyNote}`
    : `${timeGreeting}! Seja muito bem-vindo(a) ao <strong>IFSC Câmpus Garopaba</strong>! 🌿<br>Sou o assistente virtual da Secretaria Acadêmica e estou aqui para te ajudar com informações sobre nossos cursos, processos seletivos e serviços acadêmicos.`;

  currentActiveMenuItems = IFSC_Session.getAvailableMenuItems();

  // Agrupar itens por categoria
  const categories = {};
  currentActiveMenuItems.forEach((item, index) => {
    const cat = item.category || "Opções Gerais";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push({ ...item, menuIndex: index + 1 });
  });

  let categoryBlocksHtml = "";
  for (const [catName, items] of Object.entries(categories)) {
    const itemsList = items.map(it => {
      const badge = it.badge ? `<span style="background: rgba(239, 68, 68, 0.2); color: #f87171; font-size: 0.75rem; padding: 0.15rem 0.4rem; border-radius: 4px; margin-left: 0.4rem; border: 1px solid rgba(239,68,68,0.3);">${it.badge}</span>` : "";
      return `<strong>[${it.menuIndex}]</strong> ${it.titulo}${badge}`;
    }).join("<br>");

    categoryBlocksHtml += `
      <div style="margin-top: 0.5rem; margin-bottom: 0.35rem;">
        <span style="color: var(--accent-blue); font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">${catName}</span><br>
        ${itemsList}
      </div>
    `;
  }

  const menuHtml = `
    ${showGreeting ? `${saudacao}<br><br>` : ""}
    <strong>Como posso te orientar agora?</strong><br>
    Escolha uma opção pelo <strong>número</strong> ou digite sua dúvida com suas próprias palavras:<br>
    
    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; font-size: 0.88rem; line-height: 1.7;">
      ${categoryBlocksHtml}
      <hr style="border: none; border-top: 1px solid var(--border-color); margin: 0.5rem 0;">
      <strong>[9]</strong> 🚪 Sair / Encerrar Atendimento
    </div>
  `;

  appendBotMessage(menuHtml);
  renderQuickReplies();
  document.getElementById("debug-info").innerText = `Menu Categorizado Carregado (${currentActiveMenuItems.length} opções disponíveis para ${user ? 'Aluno' : 'Visitante'}).`;
}

// Renderizar Botões de Atalhos Rápidos Dinâmicos
function renderQuickReplies() {
  const container = document.getElementById("quick-replies");
  if (!container) return;

  const chips = currentActiveMenuItems.map((item, index) => {
    const num = index + 1;
    let icon = "bi-arrow-right-circle";
    if (item.action.includes("DECLARACAO")) icon = "bi-file-earmark-pdf";
    else if (item.action.includes("PENDENCIAS")) icon = "bi-exclamation-triangle";
    else if (item.action.includes("PARECER")) icon = "bi-card-checklist";
    else if (item.action.includes("REQUERIMENTO")) icon = "bi-pencil-square";
    else if (item.action.includes("FAQ")) icon = "bi-question-circle";
    else if (item.action.includes("ATENDENTE")) icon = "bi-person-headset";
    else if (item.action.includes("LOGIN")) icon = "bi-key-fill";

    const labelCurto = item.titulo.replace(/^[^\w\s]+/, '').trim().split(" ").slice(0, 2).join(" ");
    return `<button class="btn-chip" onclick="handleQuickReply('${num}')"><i class="bi ${icon}"></i> [${num}] ${labelCurto}</button>`;
  });

  chips.push(`<button class="btn-chip" onclick="handleQuickReply('0')"><i class="bi bi-house-door"></i> [0] Início</button>`);
  chips.push(`<button class="btn-chip" onclick="handleQuickReply('9')"><i class="bi bi-box-arrow-right"></i> [9] Sair</button>`);

  container.innerHTML = chips.join(" ");
}

// Submenu de Requerimentos
function renderSubmenuRequerimentos() {
  currentFlowState = "MENU_REQUERIMENTOS";
  const html = `
    📝 <strong>Abertura de Requerimentos — Secretaria Acadêmica:</strong><br>
    Selecione o tipo de solicitação:<br><br>
    
    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; font-size: 0.88rem; line-height: 1.6;">
      <strong>[1]</strong> Justificativa de Falta / Ausência por Atestado (RDP Art. 98)<br>
      <strong>[2]</strong> Aproveitamento / Validação de Estudos (75%+ compatibilidade)<br>
      <strong>[3]</strong> Requerimento Geral da Secretaria<br>
      <hr style="border: none; border-top: 1px solid var(--border-color); margin: 0.4rem 0;">
      <strong>[0]</strong> ⬅️ Voltar ao Menu Principal<br>
      <strong>[9]</strong> 🚪 Sair / Encerrar
    </div>
  `;
  appendBotMessage(html);
  document.getElementById("debug-info").innerText = `Submenu Requerimentos ativo. Digite [1, 2, 3] ou [0] voltar.`;
}

// Submenu de FAQ Dinâmico
function renderSubmenuFAQ() {
  currentFlowState = "MENU_FAQ";
  const faqItems = SECRETARIA_FAQ.map((f, i) => `<strong>[${i+1}]</strong> ${f.titulo}`).join("<br>");
  const html = `
    ℹ️ <strong>Dúvidas Frequentes da Secretaria Acadêmica:</strong><br>
    Selecione o tópico de consulta ou digite sua pergunta:<br><br>
    
    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; font-size: 0.88rem; line-height: 1.6;">
      ${faqItems}
      <hr style="border: none; border-top: 1px solid var(--border-color); margin: 0.4rem 0;">
      <strong>[0]</strong> ⬅️ Voltar ao Menu Principal<br>
      <strong>[9]</strong> 🚪 Sair / Encerrar
    </div>
  `;
  appendBotMessage(html);
  document.getElementById("debug-info").innerText = `Submenu FAQ ativo. Digite [1-${SECRETARIA_FAQ.length}] ou [0] voltar.`;
}

// Falar com Atendente Humano
function renderAtendenteHumano() {
  const user = IFSC_Session.getCurrentUser();
  const mailtoRamon = `mailto:secretaria.gpb@ifsc.edu.br?subject=Mensagem Direta de Atendimento - ${user ? user.nome : 'Visitante'}&body=Olá Equipe da Secretaria,%0D%0A%0D%0AGostaria de tirar uma dúvida sobre atendimento acadêmico:%0D%0A`;
  
  const html = `
    👤 <strong>Atendimento Humano — Secretaria Acadêmica (Ramon / RA):</strong><br><br>
    A Secretaria Acadêmica do Câmpus Garopaba funciona no Bloco Administrativo:<br>
    • <strong>Horário:</strong> Segunda a Sexta, das <strong>08h00 às 12h00</strong> e das <strong>13h00 às 19h00</strong><br>
    • <strong>WhatsApp / Fone:</strong> (48) 3254-7336<br>
    • <strong>E-mails:</strong> <code>secretaria.gpb@ifsc.edu.br</code> | <code>ra.gpb@ifsc.edu.br</code><br><br>
    
    <div style="margin-bottom: 0.75rem;">
      <a href="${mailtoRamon}" target="_blank" class="btn-chip" style="background: rgba(56, 189, 248, 0.2); border-color: var(--accent-blue); color: var(--accent-blue); display: inline-flex; align-items: center; gap: 0.4rem; text-decoration: none; padding: 0.45rem 0.8rem;">
        <i class="bi bi-envelope-paper-heart-fill"></i> Escrever e-mail para a Secretaria
      </a>
    </div>

    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.6rem; font-size: 0.85rem;">
      <strong>[1]</strong> Deixar recado registrado na fila do painel<br>
      <strong>[0]</strong> ⬅️ Voltar ao Menu Principal<br>
      <strong>[9]</strong> 🚪 Sair / Encerrar Atendimento
    </div>
  `;
  currentFlowState = "MENU_ATENDENTE";
  appendBotMessage(html);
  document.getElementById("debug-info").innerText = `Atendimento Humano exibido. Opção [1] registrar recado, [0] voltar.`;
}

// Encerrar Atendimento [9]
function renderEncerrarSessao() {
  currentFlowState = "CLOSED";
  const user = IFSC_Session.getCurrentUser();
  const nomeUser = user ? user.nome.split(" ")[0] : "você";
  const greeting = IFSC_Session.getTimeGreeting();

  const feedbackHtml = `
    <div class="feedback-box">
      <div style="font-weight: 600; font-size: 0.85rem; color: var(--accent-amber);">
        <i class="bi bi-star-fill"></i> Como foi sua experiência de atendimento hoje?
      </div>
      <div class="feedback-options" id="feedback-options-container">
        <button class="feedback-btn" onclick="submitFeedback('Excelente', this)">😍 Excelente</button>
        <button class="feedback-btn" onclick="submitFeedback('Boa', this)">😊 Boa</button>
        <button class="feedback-btn" onclick="submitFeedback('Regular', this)">😐 Regular</button>
        <button class="feedback-btn" onclick="submitFeedback('Precisa Melhorar', this)">🙁 Precisa Melhorar</button>
      </div>
    </div>
  `;

  const html = `
    🚪 <strong>Atendimento Encerrado!</strong><br><br>
    ${greeting}! Foi um prazer atender ${nomeUser}. Seus protocolos e solicitações foram devidamente registrados no sistema.<br><br>
    Tenha um excelente dia! 🌱
    ${feedbackHtml}
    <br>
    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.6rem; font-size: 0.85rem;">
      Para iniciar uma nova conversa a qualquer momento, digite <strong>[0]</strong> ou clique no botão abaixo.
    </div>
  `;
  appendBotMessage(html, { withTyping: true, withTTS: true, delay: 300 });

  // Atualizar Quick Replies para exibir apenas opção de reiniciar
  const container = document.getElementById("quick-replies");
  if (container) {
    container.innerHTML = `<button class="btn-chip" onclick="handleQuickReply('0')"><i class="bi bi-arrow-clockwise"></i> [0] Iniciar Novo Atendimento</button>`;
  }

  document.getElementById("debug-info").innerText = `Sessão finalizada. Digite [0] para reiniciar.`;
}

function submitFeedback(score, btn) {
  IFSC_Session.saveSatisfactionRating(score);
  const container = document.getElementById("feedback-options-container");
  if (container) {
    container.innerHTML = `<span style="color: var(--ifsc-green-light); font-size: 0.82rem;"><i class="bi bi-check-circle-fill"></i> Obrigado pela sua avaliação (${score})! Sua opinião nos ajuda a evoluir.</span>`;
  }
}

// Enviar Mensagem do Usuário
async function sendMessage() {
  const input = document.getElementById("user-input");
  const text = input.value.trim();
  if (!text) return;

  appendUserMessage(text);
  input.value = "";
  input.focus();

  const textLower = text.toLowerCase();
  const cleanId = IFSC_Session.sanitize(text);

  // Se a sessão estiver encerrada
  if (currentFlowState === "CLOSED") {
    if (text === "0" || textLower === "inicio" || textLower === "início" || textLower === "voltar" || textLower === "menu" || textLower === "oi" || textLower === "olá") {
      currentFlowState = "IDLE";
      renderMainMenu(true);
    } else {
      appendBotMessage(`O atendimento anterior foi finalizado. 😊<br>Digite <strong>[0]</strong> ou clique no botão abaixo para iniciar uma nova conversa.`);
      const container = document.getElementById("quick-replies");
      if (container) {
        container.innerHTML = `<button class="btn-chip" onclick="handleQuickReply('0')"><i class="bi bi-arrow-clockwise"></i> [0] Iniciar Novo Atendimento</button>`;
      }
    }
    return;
  }

  // --- NAVEGAÇÃO UNIVERSAL EM TODOS OS NÍVEIS ---
  if (text === "0" || textLower === "voltar" || textLower === "inicio" || textLower === "início" || textLower === "menu") {
    currentFlowState = "IDLE";
    pendingData = {};
    renderMainMenu(false);
    return;
  }

  if (text === "9" || textLower === "sair" || textLower === "encerrar" || textLower === "tchau" || textLower === "fechar") {
    renderEncerrarSessao();
    return;
  }

  // --- SUBMENU REQUERIMENTOS ---
  if (currentFlowState === "MENU_REQUERIMENTOS") {
    if (text === "1" || textLower.includes("falta") || textLower.includes("justificativa")) {
      const user = IFSC_Session.getCurrentUser();
      if (!user) {
        currentFlowState = "AWAITING_ID_FOR_JUSTIFICATION";
        appendBotMessage(`Para abrir uma <strong>Justificativa de Falta</strong>, digite sua <strong>Matrícula ou CPF</strong>:`);
        return;
      }
      currentFlowState = "AWAITING_JUSTIFICATION_MOTIVO";
      appendBotMessage(`Entendido, <strong>${user.nome.split(" ")[0]}</strong>. Por favor, digite o <strong>motivo e a data da ausência</strong> (ex: <em>Consulta médica dia 15/10</em>):<br><br><small style="color:var(--text-muted);">[0] Voltar | [9] Sair</small>`);
      return;
    }

    if (text === "2" || textLower.includes("aproveitamento") || textLower.includes("validacao")) {
      const user = IFSC_Session.getCurrentUser();
      const req = IFSC_Session.saveDemand({
        matricula: user ? user.matricula : "Não informado",
        nome: user ? user.nome : "Estudante",
        curso: user ? user.curso : "Geral",
        tipo: "Aproveitamento de Estudos",
        detalhes: "Solicitação iniciada via Menu Numérico",
        status: "Pendente de Documento ⚠️",
        parecer: "Apresentar histórico oficial e ementa na Secretaria.",
        arquivo: "Formulario_Validacao.docx"
      });

      appendBotMessage(`Requerimento de <strong>Aproveitamento de Estudos</strong> iniciado! Protocolo: <code>${req.id}</code>.<br><br>Entregue o histórico e plano de ensino na Secretaria (Ramon).<br><br><small style="color:var(--text-muted);">[0] Voltar ao Menu | [9] Sair</small>`);
      currentFlowState = "IDLE";
      return;
    }

    if (text === "3" || textLower.includes("geral")) {
      currentFlowState = "AWAITING_REQUERIMENTO_GERAL";
      appendBotMessage(`Digite o <strong>assunto e a descrição do seu requerimento geral</strong> para encaminhamento à Secretaria:<br><br><small style="color:var(--text-muted);">[0] Voltar | [9] Sair</small>`);
      return;
    }
  }

  if (currentFlowState === "AWAITING_REQUERIMENTO_GERAL") {
    const user = IFSC_Session.getCurrentUser();
    currentFlowState = "IDLE";
    const req = IFSC_Session.saveDemand({
      matricula: user ? user.matricula : "Não identificado",
      nome: user ? user.nome : "Estudante",
      curso: user ? user.curso : "Geral",
      tipo: "Requerimento Geral",
      detalhes: text,
      status: "Pendente de Análise (Ramon)",
      arquivo: "Requerimento_Geral.pdf"
    });

    const mailto = user ? IFSC_Session.generateMailtoLink(user, req.id, "Requerimento Geral", text) : null;
    const btn = mailto ? `<div style="margin-top:0.5rem;"><a href="${mailto}" target="_blank" class="btn-chip" style="color:var(--accent-blue); text-decoration:none;"><i class="bi bi-envelope-at"></i> Enviar Comprovante ao Meu E-mail</a></div>` : "";
    appendBotMessage(`Requerimento protocolado com sucesso! Protocolo: <code>${req.id}</code>.${btn}<br><br><small style="color:var(--text-muted);">[0] Voltar ao Menu | [9] Sair</small>`);
    return;
  }

  // --- SUBMENU FAQ DINÂMICO ---
  if (currentFlowState === "MENU_FAQ") {
    const faqIdx = parseInt(text, 10) - 1;
    if (!isNaN(faqIdx) && faqIdx >= 0 && faqIdx < SECRETARIA_FAQ.length) {
      const item = SECRETARIA_FAQ[faqIdx];
      appendBotMessage(`<strong>${item.titulo}</strong><br><br>${item.resposta.replace(/\n/g, '<br>')}<br><br><small style="color:var(--text-muted);">[0] Voltar ao Menu Principal | [9] Sair</small>`);
      currentFlowState = "IDLE";
      return;
    }
  }

  // --- MENU ATENDENTE HUMANO ---
  if (currentFlowState === "MENU_ATENDENTE" && (text === "1" || textLower.includes("recado") || textLower.includes("mensagem"))) {
    currentFlowState = "AWAITING_RECADO_RAMON";
    appendBotMessage(`Por favor, digite a <strong>mensagem ou dúvida</strong> que deseja registrar para o servidor Ramon:<br><br><small style="color:var(--text-muted);">[0] Voltar | [9] Sair</small>`);
    return;
  }

  if (currentFlowState === "AWAITING_RECADO_RAMON") {
    const user = IFSC_Session.getCurrentUser();
    currentFlowState = "IDLE";
    const req = IFSC_Session.saveDemand({
      matricula: user ? user.matricula : "Não identificado",
      nome: user ? user.nome : "Estudante",
      curso: user ? user.curso : "Geral",
      tipo: "Recado para Atendente Humano",
      detalhes: text,
      status: "Pendente de Análise (Ramon)",
      arquivo: "Recado_Atendimento.txt"
    });

    appendBotMessage(`Sua mensagem foi registrada na fila do Ramon sob o protocolo <code>${req.id}</code>! Ele analisará seu recado e retornará pelo e-mail institucional.<br><br><small style="color:var(--text-muted);">[0] Voltar ao Menu | [9] Sair</small>`);
    return;
  }

  // --- SELEÇÃO DE NÚMEROS DO MENU PRINCIPAL DINÂMICO (1 até N) ---
  const selectedNum = parseInt(text, 10);
  if (!isNaN(selectedNum) && selectedNum >= 1 && selectedNum <= currentActiveMenuItems.length && currentFlowState === "IDLE") {
    const selectedItem = currentActiveMenuItems[selectedNum - 1];
    executeMenuItemAction(selectedItem);
    return;
  }

  // --- VERIFICAÇÃO DE MATRÍCULA OU CPF ---
  if ((cleanId.length === 11 || cleanId.length === 10 || cleanId.length === 12) && /^\d+$/.test(cleanId) && currentFlowState === "IDLE") {
    const student = IFSC_Session.findStudent(cleanId);
    if (student) {
      IFSC_Session.setCurrentUser(student);
      appendBotMessage(`Identificação confirmada! ✅<br>Bem-vindo(a), <strong>${student.nome}</strong> (${student.curso} • ${student.fase}). Seus dados foram validados junto ao SIGAA.<br><br>Selecione uma opção no menu de atendimento:`);
      document.getElementById("debug-info").innerText = `Aluno Identificado via SIGAA: ${student.nome}`;
      renderMainMenu(false);
      return;
    } else {
      currentFlowState = "REG_AWAITING_NOME";
      pendingData = {
        matricula: cleanId.length === 10 ? cleanId : "2026" + cleanId.slice(-6),
        cpf: cleanId.length === 11 ? cleanId.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "111.222.333-44"
      };
      appendBotMessage(`Matrícula/CPF <code>${text}</code> não foi localizado na base ativa do SIGAA.<br><br>💡 <strong>Deseja realizar seu primeiro cadastro no sistema?</strong><br>Por favor, digite seu <strong>Nome Completo</strong>:<br><br><small style="color:var(--text-muted);">[0] Cancelar e Voltar</small>`);
      return;
    }
  }

  // --- MÁQUINA DE ESTADOS: CADASTRO DE NOVO ALUNO ---
  if (currentFlowState === "REG_AWAITING_NOME") {
    pendingData.nome = text;
    currentFlowState = "REG_AWAITING_CURSO";
    appendBotMessage(`Prazer, <strong>${text}</strong>! Agora informe seu <strong>Curso no IFSC</strong> (ex: <em>Sistemas para Internet, Informática, Administração</em>):`);
    return;
  }

  if (currentFlowState === "REG_AWAITING_CURSO") {
    pendingData.curso = text.toUpperCase().includes("SPI") || text.toLowerCase().includes("sistemas") ? "CST Sistemas para Internet" :
                        text.toLowerCase().includes("info") ? "Técnico Integrado em Informática" :
                        text.toLowerCase().includes("adm") ? "Técnico Integrado em Administração" : text;
    currentFlowState = "REG_AWAITING_FASE";
    appendBotMessage(`Anotado: <strong>${pendingData.curso}</strong>.<br>Qual a sua <strong>Fase ou Ano</strong> atual (ex: <em>1ª Fase, 2º Ano, 4ª Fase</em>)?`);
    return;
  }

  if (currentFlowState === "REG_AWAITING_FASE") {
    pendingData.fase = text;
    currentFlowState = "REG_AWAITING_EMAIL";
    appendBotMessage(`Perfeito! Por fim, digite seu <strong>E-mail de contato</strong>:`);
    return;
  }

  if (currentFlowState === "REG_AWAITING_EMAIL") {
    pendingData.email = text;
    const novoAluno = IFSC_Session.registerNewStudent(pendingData);
    currentFlowState = "IDLE";
    pendingData = {};

    appendBotMessage(`Cadastro concluído com sucesso no SIGAA! 🎉<br><br>Bem-vindo(a), <strong>${novoAluno.nome}</strong>!<br><strong>Matrícula:</strong> <code>${novoAluno.matricula}</code> | <strong>Curso:</strong> ${novoAluno.curso} (${novoAluno.fase})<br><br>Agora você já pode utilizar todas as opções do menu.`);
    renderMainMenu(false);
    return;
  }

  // --- ATENDIMENTO DE JUSTIFICATIVA ---
  if (currentFlowState === "AWAITING_JUSTIFICATION_MOTIVO") {
    const user = IFSC_Session.getCurrentUser();
    currentFlowState = "IDLE";
    
    const req = IFSC_Session.saveDemand({
      matricula: user ? user.matricula : "Não identificado",
      nome: user ? user.nome : "Estudante",
      curso: user ? user.curso : "Geral",
      tipo: "Justificativa de Falta",
      detalhes: `Motivo: ${text}`,
      status: "Pendente de Análise (Ramon)",
      arquivo: "Requerimento Formal"
    });

    const mailtoLink = user ? IFSC_Session.generateMailtoLink(user, req.id, "Justificativa de Falta", `Motivo: ${text}`) : null;
    const emailButton = mailtoLink ? `
      <div style="margin-top: 0.75rem;">
        <a href="${mailtoLink}" target="_blank" class="btn-chip" style="background: rgba(56, 189, 248, 0.2); border-color: var(--accent-blue); color: var(--accent-blue); display: inline-flex; align-items: center; gap: 0.4rem; text-decoration: none; padding: 0.4rem 0.75rem;">
          <i class="bi bi-envelope-arrow-up-fill"></i> Abrir e Enviar Comprovante para Meu E-mail (${user.email})
        </a>
      </div>
    ` : "";

    appendBotMessage(`Requerimento de <strong>Justificativa de Falta</strong> registrado com sucesso! 📝<br><br><strong>Protocolo:</strong> <code>${req.id}</code><br><strong>Motivo declarado:</strong> "${text}"<br><br>A solicitação foi enviada para a fila do Ramon.${emailButton}<br><br><small style="color:var(--text-muted);">[0] Voltar ao Menu | [9] Sair</small>`);
    return;
  }

  // --- SE NÃO FOR NÚMERO, EXECUTA BUSCA LEXICAL / FUZZY MATCH ---
  processarBuscaLexical(text);
}

// Executar Ação Selecionada no Menu Dinâmico
function executeMenuItemAction(item) {
  const user = IFSC_Session.getCurrentUser();

  switch (item.action) {
    case "FLOW_DECLARACAO":
      if (!user) {
        currentFlowState = "AWAITING_ID_FOR_CERTIFICATE";
        appendBotMessage(`Para emitir sua <strong>Declaração de Matrícula oficial</strong>, por favor informe sua <strong>Matrícula ou CPF</strong>:<br><br><small style="color:var(--text-muted);">[0] Voltar</small>`);
        return;
      }
      processarEmissaoAtestado(user, "Fins acadêmicos e comprovação de passe");
      break;

    case "FLOW_PENDENCIAS":
      if (!user) {
        appendBotMessage(`Para consultar suas <strong>pendências no SIGAA</strong>, digite sua <strong>Matrícula ou CPF</strong>:`);
        return;
      }
      exibirPendenciasAluno(user);
      break;

    case "FLOW_CONSULTA_PARECER":
      if (!user) {
        appendBotMessage(`Para rastrear o <strong>status e parecer</strong> de suas solicitações, digite sua <strong>Matrícula ou CPF</strong>:`);
        return;
      }
      exibirHistoricoSolicitacoes(user);
      break;

    case "SUBMENU_REQUERIMENTOS":
      renderSubmenuRequerimentos();
      break;

    case "SUBMENU_FAQ":
      renderSubmenuFAQ();
      break;

    case "FLOW_FAQ_TOPIC":
      const topic = SECRETARIA_FAQ.find(f => f.id === item.payload);
      if (topic) {
        appendBotMessage(`<strong>${topic.titulo}</strong><br><br>${topic.resposta.replace(/\n/g, '<br>')}<br><br><small style="color:var(--text-muted);">[0] Voltar ao Menu Principal | [9] Sair</small>`);
      }
      break;

    case "FLOW_ATENDENTE":
      renderAtendenteHumano();
      break;

    case "FLOW_LOGIN":
      appendBotMessage(`Para acessar suas informações acadêmicas e serviços do SIGAA, por favor digite sua <strong>Matrícula ou CPF</strong>:<br><br><small style="color:var(--text-muted);">[0] Voltar</small>`);
      break;

    default:
      renderMainMenu(false);
      break;
  }
}

// Exibir pendências acadêmicas do aluno
function exibirPendenciasAluno(user) {
  const pendencias = IFSC_Session.getStudentPendencies(user.matricula);
  const mailto = IFSC_Session.generatePendenciesMailtoLink(user, pendencias);
  const btn = `<div style="margin-top:0.5rem;"><a href="${mailto}" target="_blank" class="btn-chip" style="color:#a78bfa; text-decoration:none;"><i class="bi bi-envelope-paper"></i> Enviar Pendências ao Meu E-mail</a></div>`;
  
  if (!pendencias.length) {
    appendBotMessage(`Parabéns, <strong>${user.nome.split(" ")[0]}</strong>! Você <strong>não possui pendências ativas</strong> no SIGAA.${btn}<br><br><small style="color:var(--text-muted);">[0] Voltar ao Menu | [9] Sair</small>`);
  } else {
    const items = pendencias.map(p => `<li><strong style="color:var(--accent-amber);">[${p.tipo}]</strong> ${p.descricao} (Setor: ${p.setor} | Prazo: ${p.prazo})</li>`).join("");
    appendBotMessage(`Constam <strong>${pendencias.length} pendência(s)</strong> no seu cadastro: ⚠️<br><ul style="margin:0.5rem 0 0.5rem 1.25rem;">${items}</ul>${btn}<br><small style="color:var(--text-muted);">[0] Voltar ao Menu | [9] Sair</small>`);
  }
}

// Exibir histórico de requerimentos do aluno
function exibirHistoricoSolicitacoes(user) {
  const demands = IFSC_Session.getStudentDemands(user.matricula);
  if (!demands.length) {
    appendBotMessage(`Nenhuma solicitação encontrada para sua matrícula no momento.<br><br><small style="color:var(--text-muted);">[0] Voltar ao Menu | [9] Sair</small>`);
    return;
  }

  const htmlDemands = demands.map(d => {
    const returnMailto = IFSC_Session.generateReturnMailtoLink(user, d);
    const parecer = d.parecer ? `<div style="margin-top:0.25rem; font-size:0.8rem; border-left:2px solid var(--accent-blue); padding-left:0.4rem;"><strong>Parecer Ramon:</strong> "${d.parecer}"</div>` : "";
    return `<div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:0.6rem; margin-bottom:0.5rem;"><strong>${d.id} — ${d.tipo}</strong>: ${d.status}<br><small>${d.detalhes}</small>${parecer}</div>`;
  }).join("");

  appendBotMessage(`Seu histórico de solicitações: 📋<br><br>${htmlDemands}<br><small style="color:var(--text-muted);">[0] Voltar ao Menu | [9] Sair</small>`);
}

// Formatador de Markdown/HTML para mensagens do bot
function formatBotReply(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/•/g, "&bull;")
    .replace(/\n/g, "<br>");
}

// Processador Lexical P1 (Fuse.js + Fallback de Tags)
function processarBuscaLexical(query) {
  const startTime = performance.now();
  const queryLower = query.toLowerCase();

  if (queryLower.includes("atendente") || queryLower.includes("humano") || queryLower.includes("ramon")) {
    renderAtendenteHumano();
    return;
  }

  if (queryLower.includes("sair") || queryLower.includes("encerrar") || queryLower.includes("tchau")) {
    renderEncerrarSessao();
    return;
  }

  // Atalhos de serviços diretos por palavras-chave
  if (queryLower.includes("declaração") || queryLower.includes("declaracao") || queryLower.includes("atestado de matricula")) {
    executeMenuItemAction({ action: "FLOW_DECLARACAO" });
    return;
  }
  if (queryLower.includes("pendencia") || queryLower.includes("pendência") || queryLower.includes("debito")) {
    executeMenuItemAction({ action: "FLOW_PENDENCIAS" });
    return;
  }
  if (queryLower.includes("meus pedidos") || queryLower.includes("parecer") || queryLower.includes("meu requerimento")) {
    executeMenuItemAction({ action: "FLOW_CONSULTA_PARECER" });
    return;
  }

  // 1. Busca Lexical via Fuse.js
  const results = fuseEngine.search(query);
  const elapsed = (performance.now() - startTime).toFixed(2);

  if (results.length > 0 && results[0].score < 0.6) {
    const item = results[0].item;
    appendBotMessage(`<strong>${item.titulo}</strong><br><br>${formatBotReply(item.resposta)}<br><br><small style="color:var(--text-muted);">[0] Voltar ao Menu Principal | [9] Sair</small>`);
    document.getElementById("debug-info").innerText = `Fuse.js Match: "${item.id}" (Score: ${(1 - results[0].score).toFixed(2)}, Latência: ${elapsed}ms)`;
    return;
  }

  // 2. Fallback por correspondência direta em tags do FAQ
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  const tagMatch = SECRETARIA_FAQ.find(f => 
    f.tags.some(t => queryLower.includes(t)) ||
    queryWords.some(w => f.tags.includes(w) || f.titulo.toLowerCase().includes(w))
  );

  if (tagMatch) {
    appendBotMessage(`<strong>${tagMatch.titulo}</strong><br><br>${formatBotReply(tagMatch.resposta)}<br><br><small style="color:var(--text-muted);">[0] Voltar ao Menu Principal | [9] Sair</small>`);
    document.getElementById("debug-info").innerText = `Fallback Keyword Match: "${tagMatch.id}" (Latência: ${elapsed}ms)`;
    return;
  }

  appendBotMessage(`Não encontrei uma resposta exata para sua busca lexical.<br><br>💡 Digite <strong>[0]</strong> para ver o Menu de Opções ou selecione uma das opções abaixo.`);
  document.getElementById("debug-info").innerText = `Fuse.js Sem Match relevante (Score > 0.6, Latência: ${elapsed}ms)`;
}

// Emitir Declaração em PDF na hora
async function processarEmissaoAtestado(student, finalidade) {
  appendBotMessage(`Gerando sua <strong>Declaração de Matrícula oficial</strong> junto ao SIGAA com autenticação digital... ⏳`);
  document.getElementById("debug-info").innerText = `Iniciando montagem de PDF com pdf-lib no cliente...`;

  try {
    const { pdfBytes, codAutenticacao } = await gerarDeclaracaoMatriculaPDF(student, finalidade);
    
    // Registrar Demanda
    const req = IFSC_Session.saveDemand({
      matricula: student.matricula,
      nome: student.nome,
      curso: student.curso,
      tipo: "Emissão de Declaração de Matrícula",
      detalhes: `Código Autenticação: ${codAutenticacao} (${finalidade})`,
      status: "Emitido Automaticamente",
      arquivo: "Declaracao_Matricula.pdf"
    });

    // Criar link para download do Blob
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const cardHtml = `
      Sua declaração foi gerada com sucesso! 🎉<br>
      <strong>Código de Autenticação:</strong> <code>${codAutenticacao}</code>
      <div class="document-card">
        <div class="document-info">
          <i class="bi bi-file-earmark-pdf-fill document-icon"></i>
          <div>
            <div style="font-weight: 700; font-size: 0.9rem;">Declaracao_Matricula_${student.matricula}.pdf</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">PDF Oficial IFSC • Válido com Chave Digital</div>
          </div>
        </div>
        <a href="${url}" download="Declaracao_Matricula_${student.matricula}.pdf" class="btn-download">
          <i class="bi bi-download"></i> Baixar PDF
        </a>
      </div>
    `;

    appendBotMessage(cardHtml);
    document.getElementById("debug-info").innerText = `PDF gerado com sucesso (${(blob.size/1024).toFixed(1)} KB). Protocolo: ${req.id}`;
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    appendBotMessage(`Ocorreu um erro ao compilar o PDF da declaração. Por favor, tente novamente.`);
  }
}

// Botões de Ação Rápida
function handleQuickReply(text) {
  const input = document.getElementById("user-input");
  input.value = text;
  sendMessage();
}

// Simulações de Login/Logout
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

// Utilitários de Interface
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

function appendBotMessage(html, options = { withTyping: true, withTTS: true, delay: 350 }) {
  const chat = document.getElementById("chat-messages");
  if (!chat) return;

  const shouldType = options && options.withTyping !== false;
  const delayMs = (options && options.delay) ? options.delay : 350;
  const showTTS = !options || options.withTTS !== false;

  if (shouldType) {
    const typingRow = document.createElement("div");
    typingRow.className = "message-row bot typing-temp-row";
    typingRow.innerHTML = `
      <div class="avatar avatar-bot"><i class="bi bi-robot"></i></div>
      <div class="bubble bubble-bot">
        <div class="typing-indicator">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    `;
    chat.appendChild(typingRow);
    chat.scrollTop = chat.scrollHeight;

    setTimeout(() => {
      typingRow.remove();
      renderActualBotMessage(chat, html, showTTS);
    }, delayMs);
  } else {
    renderActualBotMessage(chat, html, showTTS);
  }
}

function renderActualBotMessage(chat, html, withTTS = true) {
  const row = document.createElement("div");
  row.className = "message-row bot";
  const msgId = "msg-" + Math.random().toString(36).substring(2, 7);

  const ttsBtn = withTTS ? `
    <div class="msg-footer">
      <span><i class="bi bi-robot"></i> Assistente IFSC</span>
      <button class="btn-tts" onclick="IFSC_Session.speakText(document.getElementById('${msgId}').innerText, this)" title="Ouvir mensagem falada em português">
        <i class="bi bi-volume-up-fill"></i> Ouvir
      </button>
    </div>
  ` : "";

  row.innerHTML = `
    <div class="avatar avatar-bot"><i class="bi bi-robot"></i></div>
    <div class="bubble bubble-bot">
      <div id="${msgId}">${html}</div>
      ${ttsBtn}
    </div>
  `;
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}
