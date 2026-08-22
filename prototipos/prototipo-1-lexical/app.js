/**
 * Protótipo 1 — Lógica de Busca Lexical & Formulário Guiado
 * Projeto TCC — Marília Stefenon
 */

// Estado da Conversação
let currentFlowState = "IDLE"; 
let pendingData = {};

// Instância do Fuse.js para Busca Lexical
const fuseOptions = {
  includeScore: true,
  threshold: 0.4, // Tolerância a pequenos erros de digitação (typos)
  keys: ["titulo", "tags", "resposta"]
};
const fuseEngine = new Fuse(SECRETARIA_FAQ, fuseOptions);

// Inicialização da Página
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
        <i class="bi bi-incognito"></i> Aluno não identificado (Acesso Visitante)
      </span>
    `;
  }
}

// Iniciar mensagem de boas-vindas inteligente com Menu Principal
function iniciarChat() {
  const user = IFSC_Session.getCurrentUser();
  const chat = document.getElementById("chat-messages");
  chat.innerHTML = "";
  currentFlowState = "IDLE";
  pendingData = {};

  renderMainMenu(true);
}

// Renderizar Menu Principal
function renderMainMenu(showGreeting = false) {
  const user = IFSC_Session.getCurrentUser();
  const saudacao = user 
    ? `Olá, <strong>${user.nome.split(" ")[0]}</strong>! 👋 (Matrícula: <code>${user.matricula}</code> - ${user.curso})`
    : `Olá! Sou o assistente virtual da <strong>Secretaria Acadêmica do IFSC Garopaba</strong>.`;

  const menuHtml = `
    ${showGreeting ? `${saudacao}<br><br>` : ""}
    <strong>Menu de Atendimento:</strong><br>
    Digite o <strong>número</strong> da opção desejada ou escreva sua dúvida:<br><br>
    
    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; font-size: 0.88rem; line-height: 1.6;">
      <strong>[1]</strong> 📜 Emitir Declaração de Matrícula (com Chave Digital)<br>
      <strong>[2]</strong> ⚠️ Consultar Pendências no SIGAA (Documental / Biblioteca)<br>
      <strong>[3]</strong> 📋 Consultar Status & Parecer de Requerimentos Anteriores<br>
      <strong>[4]</strong> 📝 Abertura de Requerimento (Falta / Aproveitamento)<br>
      <strong>[5]</strong> ℹ️ Dúvidas Frequentes (Horário, Rematrícula, Trancamento, Carteirinha)<br>
      <strong>[8]</strong> 👤 Falar com um Atendente (Servidor Ramon)<br>
      <strong>[9]</strong> 🚪 Sair / Encerrar Atendimento
    </div>
  `;

  appendBotMessage(menuHtml);
  document.getElementById("debug-info").innerText = `Menu Principal ativo. Aguardando seleção [1-9] ou texto livre.`;
}

// Submenu de Requerimentos [4]
function renderSubmenuRequerimentos() {
  currentFlowState = "MENU_REQUERIMENTOS";
  const html = `
    📝 <strong>Abertura de Requerimentos — Secretaria:</strong><br>
    Selecione o tipo de solicitação:<br><br>
    
    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; font-size: 0.88rem; line-height: 1.6;">
      <strong>[1]</strong> Justificativa de Falta / Ausência por Atestado<br>
      <strong>[2]</strong> Aproveitamento / Validação de Estudos<br>
      <strong>[3]</strong> Requerimento Geral da Secretaria<br>
      <hr style="border: none; border-top: 1px solid var(--border-color); margin: 0.4rem 0;">
      <strong>[0]</strong> ⬅️ Voltar ao Menu Principal<br>
      <strong>[9]</strong> 🚪 Sair / Encerrar
    </div>
  `;
  appendBotMessage(html);
  document.getElementById("debug-info").innerText = `Submenu Requerimentos ativo. Digite [1, 2, 3] ou [0] voltar.`;
}

// Submenu de FAQ [5]
function renderSubmenuFAQ() {
  currentFlowState = "MENU_FAQ";
  const html = `
    ℹ️ <strong>Dúvidas Frequentes da Secretaria Acadêmica:</strong><br>
    Selecione o tópico de consulta:<br><br>
    
    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; font-size: 0.88rem; line-height: 1.6;">
      <strong>[1]</strong> Prazos e Procedimentos de Rematrícula<br>
      <strong>[2]</strong> Regras de Trancamento de Matrícula (RDP)<br>
      <strong>[3]</strong> Horário de Atendimento e Contatos da Secretaria<br>
      <strong>[4]</strong> Carteirinha de Estudante e Passe Escolar (DNE / Paulotur)<br>
      <strong>[5]</strong> Regras de Aproveitamento / Validação de Disciplinas<br>
      <hr style="border: none; border-top: 1px solid var(--border-color); margin: 0.4rem 0;">
      <strong>[0]</strong> ⬅️ Voltar ao Menu Principal<br>
      <strong>[9]</strong> 🚪 Sair / Encerrar
    </div>
  `;
  appendBotMessage(html);
  document.getElementById("debug-info").innerText = `Submenu FAQ ativo. Digite [1-5] ou [0] voltar.`;
}

// Falar com Atendente Humano [8]
function renderAtendenteHumano() {
  const user = IFSC_Session.getCurrentUser();
  const mailtoRamon = `mailto:secretaria.gpb@ifsc.edu.br?subject=Mensagem Direta de Atendimento - ${user ? user.nome : 'Estudante'}&body=Olá Ramon,%0D%0A%0D%0AGostaria de tirar uma dúvida sobre atendimento acadêmico:%0D%0A`;
  
  const html = `
    👤 <strong>Atendimento Humano — Servidor Ramon:</strong><br><br>
    A Secretaria Acadêmica do Câmpus Garopaba funciona presencialmente no Bloco Administrativo:<br>
    • <strong>Horário:</strong> Segunda a Sexta, das 08h00 às 20h30 (ininterrupto)<br>
    • <strong>Telefone / WhatsApp:</strong> (48) 3254-7336<br>
    • <strong>E-mail Direto:</strong> <code>secretaria.gpb@ifsc.edu.br</code><br><br>
    
    <div style="margin-bottom: 0.75rem;">
      <a href="${mailtoRamon}" target="_blank" class="btn-chip" style="background: rgba(56, 189, 248, 0.2); border-color: var(--accent-blue); color: var(--accent-blue); display: inline-flex; align-items: center; gap: 0.4rem; text-decoration: none; padding: 0.45rem 0.8rem;">
        <i class="bi bi-envelope-paper-heart-fill"></i> Escrever e-mail direto para o Ramon
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
  const html = `
    🚪 <strong>Atendimento Encerrado!</strong><br><br>
    Obrigado por utilizar o assistente digital da Secretaria Acadêmica do IFSC Garopaba.<br>
    Seus protocolos e documentos foram devidamente sincronizados.<br><br>
    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.6rem; font-size: 0.85rem;">
      Digite <strong>[0]</strong> ou <strong>[início]</strong> a qualquer momento para abrir um novo atendimento.
    </div>
  `;
  appendBotMessage(html);
  document.getElementById("debug-info").innerText = `Sessão finalizada. Digite [0] para reiniciar.`;
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

  if (currentFlowState === "CLOSED") {
    currentFlowState = "IDLE";
    renderMainMenu(true);
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

  // --- SUBMENU FAQ ---
  if (currentFlowState === "MENU_FAQ") {
    let faqKey = null;
    if (text === "1") faqKey = "rematricula";
    else if (text === "2") faqKey = "trancamento";
    else if (text === "3") faqKey = "horario";
    else if (text === "4") faqKey = "carteirinha";
    else if (text === "5") faqKey = "aproveitamento_regras";

    if (faqKey) {
      const item = SECRETARIA_FAQ.find(f => f.id === faqKey);
      appendBotMessage(`<strong>${item.titulo}</strong><br><br>${item.resposta}<br><br><small style="color:var(--text-muted);">[0] Voltar ao Menu Principal | [9] Sair</small>`);
      currentFlowState = "IDLE";
      return;
    }
  }

  // --- MENU ATENDENTE HUMANO [8] ---
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

  // --- VERIFICAÇÃO DE MATRÍCULA OU CPF ---
  if ((cleanId.length === 11 || cleanId.length === 10 || cleanId.length === 12) && /^\d+$/.test(cleanId) && currentFlowState === "IDLE") {
    const student = IFSC_Session.findStudent(cleanId);
    if (student) {
      IFSC_Session.setCurrentUser(student);
      appendBotMessage(`Identificação confirmada! ✅<br>Bem-vindo(a), <strong>${student.nome}</strong> (${student.curso} • ${student.fase}). Seus dados foram validados junto ao SIGAA.<br><br>Digite o número da opção desejada no menu:<br><br>[1] Declaração | [2] Pendências | [3] Meus Pedidos | [4] Requerimento | [8] Falar com Ramon | [9] Sair`);
      document.getElementById("debug-info").innerText = `Aluno Identificado via SIGAA: ${student.nome}`;
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

  // --- SELEÇÃO DE NÚMEROS DO MENU PRINCIPAL [1 a 8] ---
  if (text === "1") {
    const user = IFSC_Session.getCurrentUser();
    if (!user) {
      currentFlowState = "AWAITING_ID_FOR_CERTIFICATE";
      appendBotMessage(`Para emitir sua <strong>Declaração de Matrícula oficial</strong>, por favor informe seu <strong>número de matrícula ou CPF</strong>:<br><br><small style="color:var(--text-muted);">[0] Voltar</small>`);
      return;
    }
    processarEmissaoAtestado(user, "Fins acadêmicos e comprovação de passe");
    return;
  }

  if (text === "2") {
    const user = IFSC_Session.getCurrentUser();
    if (!user) {
      appendBotMessage(`Para consultar suas <strong>pendências no SIGAA</strong>, digite sua <strong>Matrícula ou CPF</strong>:`);
      return;
    }
    const pendencias = IFSC_Session.getStudentPendencies(user.matricula);
    const mailto = IFSC_Session.generatePendenciesMailtoLink(user, pendencias);
    const btn = `<div style="margin-top:0.5rem;"><a href="${mailto}" target="_blank" class="btn-chip" style="color:#a78bfa; text-decoration:none;"><i class="bi bi-envelope-paper"></i> Enviar Pendências ao Meu E-mail</a></div>`;
    
    if (!pendencias.length) {
      appendBotMessage(`Parabéns, <strong>${user.nome.split(" ")[0]}</strong>! Você <strong>não possui pendências ativas</strong> no SIGAA.${btn}<br><br><small style="color:var(--text-muted);">[0] Voltar ao Menu | [9] Sair</small>`);
    } else {
      const items = pendencias.map(p => `<li><strong style="color:var(--accent-amber);">[${p.tipo}]</strong> ${p.descricao} (Setor: ${p.setor} | Prazo: ${p.prazo})</li>`).join("");
      appendBotMessage(`Constam <strong>${pendencias.length} pendência(s)</strong> no seu cadastro: ⚠️<br><ul style="margin:0.5rem 0 0.5rem 1.25rem;">${items}</ul>${btn}<br><small style="color:var(--text-muted);">[0] Voltar ao Menu | [9] Sair</small>`);
    }
    return;
  }

  if (text === "3") {
    const user = IFSC_Session.getCurrentUser();
    if (!user) {
      appendBotMessage(`Para rastrear o <strong>status e parecer</strong> de suas solicitações, digite sua <strong>Matrícula ou CPF</strong>:`);
      return;
    }
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
    return;
  }

  if (text === "4") {
    renderSubmenuRequerimentos();
    return;
  }

  if (text === "5") {
    renderSubmenuFAQ();
    return;
  }

  if (text === "8") {
    renderAtendenteHumano();
    return;
  }

  // --- SE NÃO FOR NÚMERO, EXECUTA BUSCA LEXICAL / FUZZY MATCH ---
  processarBuscaLexical(text);
}

// Processador Lexical P1
function processarBuscaLexical(query) {
  const startTime = performance.now();
  const results = fuseEngine.search(query);
  const elapsed = (performance.now() - startTime).toFixed(2);
  const queryLower = query.toLowerCase();

  if (queryLower.includes("atendente") || queryLower.includes("humano") || queryLower.includes("ramon")) {
    renderAtendenteHumano();
    return;
  }

  if (queryLower.includes("sair") || queryLower.includes("encerrar")) {
    renderEncerrarSessao();
    return;
  }

  // Resultado de FAQ Lexical
  if (results.length > 0 && results[0].score < 0.45) {
    const item = results[0].item;
    appendBotMessage(`<strong>${item.titulo}</strong><br><br>${item.resposta}<br><br><small style="color:var(--text-muted);">[0] Voltar ao Menu Principal | [9] Sair</small>`);
    document.getElementById("debug-info").innerText = `Fuse.js Match: "${item.id}" (Score: ${(1 - results[0].score).toFixed(2)}, Latência: ${elapsed}ms)`;
  } else {
    appendBotMessage(`Não encontrei uma resposta exata para sua busca lexical.<br><br>💡 Digite <strong>[0]</strong> para ver o Menu de Opções ou selecione uma opção abaixo.`);
    document.getElementById("debug-info").innerText = `Fuse.js Sem Match relevante (Score > 0.45, Latência: ${elapsed}ms)`;
  }
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
