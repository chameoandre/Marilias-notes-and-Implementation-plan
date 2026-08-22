/**
 * Protótipo 3 — IA Generativa com Function Calling & Áudio
 * Projeto TCC — Marília Stefenon
 */

// Estado e Ferramentas (Tools) da IA
const IFSC_AGENT_TOOLS = [
  {
    name: "consultarAlunoSIGAA",
    description: "Consulta situação cadastral, curso e dados de um estudante no SIGAA via Matrícula ou CPF.",
    execute: (params) => {
      const student = IFSC_Session.findStudent(params.identifier);
      if (student) IFSC_Session.setCurrentUser(student);
      return student ? { status: "sucesso", aluno: student } : { status: "nao_encontrado" };
    }
  },
  {
    name: "consultarPendenciasAcademicas",
    description: "Consulta pendências documentais, de biblioteca e cadastrais de um aluno no SIGAA.",
    execute: (params) => {
      const student = IFSC_Session.findStudent(params.matricula) || IFSC_Session.getCurrentUser();
      if (!student) return { status: "erro", mensagem: "Aluno não identificado." };
      const pendencias = IFSC_Session.getStudentPendencies(student.matricula);
      return { status: "sucesso", student, pendencias };
    }
  },
  {
    name: "consultarStatusRequerimentos",
    description: "Consulta o andamento, parecer e despacho emitido pela Secretaria Acadêmica (Ramon) para as solicitações do estudante.",
    execute: (params) => {
      const student = IFSC_Session.findStudent(params.matricula) || IFSC_Session.getCurrentUser();
      if (!student) return { status: "erro", mensagem: "Aluno não identificado." };
      const demands = IFSC_Session.getStudentDemands(student.matricula);
      return { status: "sucesso", student, demands };
    }
  },
  {
    name: "emitirDeclaracaoMatricula",
    description: "Gera automaticamente a Declaração de Matrícula oficial em PDF com código de autenticidade.",
    execute: async (params) => {
      const student = IFSC_Session.findStudent(params.matricula) || IFSC_Session.getCurrentUser();
      if (!student) return { status: "erro", mensagem: "Aluno não identificado." };
      const { pdfBytes, codAutenticacao } = await gerarDeclaracaoMatriculaPDF(student, params.finalidade || "Comprovação Geral");
      
      const req = IFSC_Session.saveDemand({
        matricula: student.matricula,
        nome: student.nome,
        curso: student.curso,
        tipo: "Emissão de Declaração (LLM Tool)",
        detalhes: `Autenticação: ${codAutenticacao} (${params.finalidade || "Geral"})`,
        status: "Deferido ✅",
        parecer: "Documento emitido automaticamente com validação digital.",
        arquivo: "Declaracao_Matricula.pdf"
      });

      return { status: "sucesso", pdfBytes, codAutenticacao, student, reqId: req.id };
    }
  },
  {
    name: "abrirRequerimentoSecretaria",
    description: "Abre um requerimento formal na fila de atendimento da Secretaria Acadêmica (Ramon).",
    execute: (params) => {
      const student = IFSC_Session.findStudent(params.matricula) || IFSC_Session.getCurrentUser();
      const req = IFSC_Session.saveDemand({
        matricula: student ? student.matricula : "Não identificado",
        nome: student ? student.nome : "Estudante",
        curso: student ? student.curso : "Geral",
        tipo: params.tipo || "Requerimento Geral",
        detalhes: params.motivo || "Solicitação via IA",
        status: "Pendente de Análise (Ramon)",
        parecer: "",
        arquivo: "Requerimento_Formal.pdf"
      });
      return { status: "sucesso", protocolo: req.id, req };
    }
  }
];

// Inicialização
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
  const chat = document.getElementById("chat-messages");
  chat.innerHTML = "";
  renderMainMenuP3(true);
}

function renderMainMenuP3(showGreeting = false) {
  const user = IFSC_Session.getCurrentUser();
  const saudacao = user 
    ? `Olá, <strong>${user.nome.split(" ")[0]}</strong>! 👋 (Matrícula: <code>${user.matricula}</code> - ${user.curso})`
    : `Olá! Sou o <strong>Assistente Generativo com IA & Function Calling</strong> da Secretaria Acadêmica do IFSC Garopaba.`;

  const menuHtml = `
    ${showGreeting ? `${saudacao}<br><br>` : ""}
    <strong>Menu Interativo de Atendimento:</strong><br>
    Você pode falar pelo microfone 🎙️, formular perguntas livres ou digitar um <strong>número</strong>:<br><br>
    
    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; font-size: 0.88rem; line-height: 1.6;">
      <strong>[1]</strong> 📜 Emitir Declaração de Matrícula (com Chave Digital)<br>
      <strong>[2]</strong> ⚠️ Auditar Pendências no SIGAA (Documental / Biblioteca)<br>
      <strong>[3]</strong> 📋 Rastrear Status & Pareceres de Requerimentos<br>
      <strong>[4]</strong> 📝 Requerimentos (Justificativa de Falta / Aproveitamento)<br>
      <strong>[5]</strong> ℹ️ RDP & Dúvidas (Destrancamento, Horários, Calendário)<br>
      <strong>[8]</strong> 👤 Falar com Atendente Humano (Servidor Ramon)<br>
      <strong>[9]</strong> 🚪 Sair / Encerrar Atendimento
    </div>
  `;

  appendBotMessage(menuHtml);
  document.getElementById("llm-details").innerHTML = `Menu Ativo • Pronto para entrada de voz, texto livre ou atalhos [1-9]`;
}

function renderAtendenteP3() {
  const user = IFSC_Session.getCurrentUser();
  const mailtoRamon = `mailto:secretaria.gpb@ifsc.edu.br?subject=Mensagem Direta de Atendimento - ${user ? user.nome : 'Estudante'}&body=Olá Ramon,%0D%0A%0D%0AGostaria de tirar uma dúvida sobre atendimento acadêmico:%0D%0A`;

  appendBotMessage(`
    👤 <strong>Atendimento Presencial e Direto — Servidor Ramon:</strong><br><br>
    • <strong>Local:</strong> Bloco Administrativo (Secretaria Acadêmica)<br>
    • <strong>Horário:</strong> 08h00 às 20h30 (Segunda a Sexta)<br>
    • <strong>Telefone / WhatsApp:</strong> (48) 3254-7336<br>
    • <strong>E-mail:</strong> <code>secretaria.gpb@ifsc.edu.br</code><br><br>
    <div style="margin-bottom: 0.5rem;">
      <a href="${mailtoRamon}" target="_blank" class="btn-chip" style="background: rgba(56, 189, 248, 0.2); border-color: var(--accent-blue); color: var(--accent-blue); display: inline-flex; align-items: center; gap: 0.4rem; text-decoration: none; padding: 0.45rem 0.8rem;">
        <i class="bi bi-envelope-paper-heart-fill"></i> Abrir E-mail para o Ramon
      </a>
    </div>
    <small style="color:var(--text-muted);">[0] Voltar ao Início | [9] Sair</small>
  `);
}

function renderEncerrarP3() {
  appendBotMessage(`
    🚪 <strong>Atendimento Concluído!</strong><br><br>
    Obrigado por utilizar o Agente Generativo da Secretaria Acadêmica do IFSC Garopaba. Tenha um excelente dia! 👋<br><br>
    <small style="color:var(--text-muted);">Digite <strong>[0]</strong> para reiniciar o menu a qualquer momento.</small>
  `);
}

// Processar Mensagem com IA
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
    renderMainMenuP3(false);
    return;
  }

  if (text === "9" || textLower === "sair" || textLower === "encerrar" || textLower === "tchau") {
    renderEncerrarP3();
    return;
  }

  if (text === "8" || textLower.includes("atendente") || textLower.includes("ramon") || textLower.includes("humano")) {
    renderAtendenteP3();
    return;
  }

  const startTime = performance.now();

  // Simulação de Raciocínio (Chain of Thought & Tool Call)
  document.getElementById("llm-latency").innerText = `Processando raciocínio... ⏳`;
  
  setTimeout(async () => {
    await executarRaciocinioIA(text, startTime);
  }, 350);
}

// Motor de Raciocínio e Function Calling Simulado
async function executarRaciocinioIA(prompt, startTime) {
  const promptLower = prompt.toLowerCase();
  const currentUser = IFSC_Session.getCurrentUser();

  // 1. Identificar se há Matrícula ou CPF no prompt
  const matMatch = prompt.match(/\b202[0-9]{7,9}\b/);
  const cpfMatch = prompt.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/);
  if (matMatch || cpfMatch) {
    const student = IFSC_Session.findStudent(matMatch ? matMatch[0] : cpfMatch[0]);
    if (student) IFSC_Session.setCurrentUser(student);
  }

  const activeStudent = IFSC_Session.getCurrentUser();

  // --- CENÁRIO 1: TOOL CALL DE DECLARAÇÃO DE MATRÍCULA ---
  if (promptLower.includes("declaração") || promptLower.includes("declaracao") || promptLower.includes("atestado") || promptLower.includes("comprovante")) {
    document.getElementById("llm-details").innerHTML = `Tool: <strong>emitirDeclaracaoMatricula()</strong> | Parâmetros: <code>{ matricula: "${activeStudent ? activeStudent.matricula : 'solicitar'}" }</code>`;
    
    if (!activeStudent) {
      const elapsed = (performance.now() - startTime).toFixed(0);
      document.getElementById("llm-latency").innerText = `Latência: ${elapsed}ms`;
      appendBotMessage(`Para emitir sua <strong>Declaração de Matrícula oficial</strong> com autenticação digital no SIGAA, preciso que você informe seu <strong>número de matrícula ou CPF</strong>.`);
      return;
    }

    const tool = IFSC_AGENT_TOOLS.find(t => t.name === "emitirDeclaracaoMatricula");
    const result = await tool.execute({ matricula: activeStudent.matricula, finalidade: "Comprovação e Estágio" });

    const elapsed = (performance.now() - startTime).toFixed(0);
    document.getElementById("llm-latency").innerText = `Latência: ${elapsed}ms`;

    const blob = new Blob([result.pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const botReply = `
      Consultei seus dados ativos no SIGAA para o curso <strong>${activeStudent.curso}</strong> (${activeStudent.fase}) e gerei sua declaração oficial com validade institucional.<br><br>
      <strong>Chave de Autenticação Digital:</strong> <code>${result.codAutenticacao}</code>
      <div class="document-card">
        <div class="document-info">
          <i class="bi bi-file-earmark-pdf-fill document-icon"></i>
          <div>
            <div style="font-weight: 700; font-size: 0.9rem;">Declaracao_Matricula_${activeStudent.matricula}.pdf</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Emitido por Tool Execution • Validade Nacional</div>
          </div>
        </div>
        <a href="${url}" download="Declaracao_Matricula_${activeStudent.matricula}.pdf" class="btn-download">
          <i class="bi bi-download"></i> Baixar PDF
        </a>
      </div>
    `;
    appendBotMessage(botReply);
    return;
  }

  // --- CENÁRIO 2: CENÁRIO COMPLEXO DE RDP (DESTRANCAMENTO / RETORNO) ---
  if (promptLower.includes("tranquei") || promptLower.includes("voltar") || promptLower.includes("destrancamento") || promptLower.includes("reabrir")) {
    document.getElementById("llm-details").innerHTML = `Tool: <strong>consultarRegulamentoRDP()</strong> + Análise Contextual`;
    const elapsed = (performance.now() - startTime).toFixed(0);
    document.getElementById("llm-latency").innerText = `Latência: ${elapsed}ms`;

    const respostaRDP = `
      Com base no <strong>Regulamento Didático-Pedagógico (RDP) do IFSC</strong>, eis a síntese das orientações para seu retorno aos estudos:<br><br>
      1. <strong>Prazo Máximo de Trancamento:</strong> O RDP autoriza o trancamento por até 4 semestres (2 anos letivos). Caso seu período de trancamento não tenha expirado, seu vínculo permanece preservado.<br>
      2. <strong>Procedimento de Retorno:</strong> O destrancamento deve ser solicitado no período de rematrícula oficial via SIGAA ou através de requerimento presencial na Secretaria com o servidor Ramon.<br>
      3. <strong>Matriz Curricular:</strong> Caso a matriz do curso tenha passado por reformulação durante o período de afastamento, a coordenação realizará o estudo de equivalência das disciplinas cursadas.<br><br>
      Deseja que eu abra uma solicitação de orientação junto à Secretaria Acadêmica?
    `;
    appendBotMessage(respostaRDP);
    return;
  }

  // --- CENÁRIO 3: TOOL CALL DE CONSULTA DE PENDÊNCIAS ---
  if (promptLower.includes("pendencia") || promptLower.includes("pendência") || promptLower.includes("debito") || promptLower.includes("débito") || promptLower.includes("documentos pendentes")) {
    document.getElementById("llm-details").innerHTML = `Tool: <strong>consultarPendenciasAcademicas()</strong> | Parâmetros: <code>{ matricula: "${activeStudent ? activeStudent.matricula : 'solicitar'}" }</code>`;
    
    if (!activeStudent) {
      const elapsed = (performance.now() - startTime).toFixed(0);
      document.getElementById("llm-latency").innerText = `Latência: ${elapsed}ms`;
      appendBotMessage(`Para consultar se há pendências no seu histórico do SIGAA, por favor informe sua <strong>matrícula ou CPF</strong>.`);
      return;
    }

    const tool = IFSC_AGENT_TOOLS.find(t => t.name === "consultarPendenciasAcademicas");
    const result = tool.execute({ matricula: activeStudent.matricula });

    const elapsed = (performance.now() - startTime).toFixed(0);
    document.getElementById("llm-latency").innerText = `Latência: ${elapsed}ms`;

    const mailtoLink = IFSC_Session.generatePendenciesMailtoLink(activeStudent, result.pendencias);
    const emailBtn = `
      <div style="margin-top: 0.75rem;">
        <a href="${mailtoLink}" target="_blank" class="btn-chip" style="background: rgba(167, 139, 250, 0.2); border-color: #a78bfa; color: #a78bfa; display: inline-flex; align-items: center; gap: 0.4rem; text-decoration: none; padding: 0.4rem 0.75rem;">
          <i class="bi bi-envelope-paper-fill"></i> Despachar Relatório de Pendências para Meu E-mail (${activeStudent.email})
        </a>
      </div>
    `;

    if (!result.pendencias.length) {
      appendBotMessage(`Excelente notícia, <strong>${activeStudent.nome.split(" ")[0]}</strong>! 🎉<br><br>Executei a ferramenta de auditoria de pendências no SIGAA e confirmo que seu vínculo com o curso <strong>${activeStudent.curso}</strong> está <strong>100% regular</strong>, sem débitos documentais ou de biblioteca.${emailBtn}`);
    } else {
      const pItems = result.pendencias.map(p => `<li><strong style="color: var(--accent-amber);">[${p.tipo}]</strong> ${p.descricao} (Setor: ${p.setor} | Prazo: ${p.prazo})</li>`).join("");
      appendBotMessage(`Identifiquei <strong>${result.pendencias.length} pendência(s)</strong> no seu registro acadêmico: ⚠️<br><ul style="margin: 0.5rem 0 0.5rem 1.25rem;">${pItems}</ul>${emailBtn}`);
    }
    return;
  }

  // --- CENÁRIO 4: TOOL CALL DE CONSULTA DE STATUS E RETORNO DA SECRETARIA ---
  if (promptLower.includes("status") || promptLower.includes("solicitac") || promptLower.includes("protocolo") || promptLower.includes("parecer") || promptLower.includes("retorno") || promptLower.includes("andamento") || promptLower.includes("meus pedidos")) {
    document.getElementById("llm-details").innerHTML = `Tool: <strong>consultarStatusRequerimentos()</strong> | Function Calling`;
    
    if (!activeStudent) {
      const elapsed = (performance.now() - startTime).toFixed(0);
      document.getElementById("llm-latency").innerText = `Latência: ${elapsed}ms`;
      appendBotMessage(`Para rastrear o andamento e o parecer da Secretaria sobre seus requerimentos, por favor informe sua <strong>matrícula ou CPF</strong>.`);
      return;
    }

    const tool = IFSC_AGENT_TOOLS.find(t => t.name === "consultarStatusRequerimentos");
    const result = tool.execute({ matricula: activeStudent.matricula });

    const elapsed = (performance.now() - startTime).toFixed(0);
    document.getElementById("llm-latency").innerText = `Latência: ${elapsed}ms`;

    if (!result.demands.length) {
      appendBotMessage(`Olá, <strong>${activeStudent.nome.split(" ")[0]}</strong>! Nenhuma solicitação ativa encontrada para a matrícula <code>${activeStudent.matricula}</code>.`);
      return;
    }

    const cards = result.demands.map(d => {
      const returnMailto = IFSC_Session.generateReturnMailtoLink(activeStudent, d);
      const parecerBlock = d.parecer ? `
        <div style="margin-top: 0.35rem; padding: 0.35rem 0.5rem; background: rgba(255,255,255,0.03); border-left: 2px solid var(--accent-blue); font-size: 0.8rem;">
          <strong>Despacho do Ramon:</strong> "${d.parecer}" (${d.dataParecer || 'Hoje'})
          <div style="margin-top: 0.25rem;">
            <a href="${returnMailto}" target="_blank" style="color: #a78bfa; font-size: 0.75rem; text-decoration: none;">
              <i class="bi bi-envelope-at"></i> Abrir Notificação Oficial por E-mail
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

    appendBotMessage(`Recuperei o status dos seus <strong>requerimentos na Secretaria</strong>: 📋<br><br>${cards}`);
    return;
  }

  // --- CENÁRIO 5: APROVEITAMENTO E VALIDAÇÃO ---
  if (promptLower.includes("aproveitamento") || promptLower.includes("validacao") || promptLower.includes("dispensa")) {
    document.getElementById("llm-details").innerHTML = `Tool: <strong>abrirRequerimentoSecretaria()</strong> | Contexto: RDP Art. 46`;
    const tool = IFSC_AGENT_TOOLS.find(t => t.name === "abrirRequerimentoSecretaria");
    const result = tool.execute({ matricula: activeStudent ? activeStudent.matricula : "", tipo: "Validação de Estudos", motivo: prompt });

    const elapsed = (performance.now() - startTime).toFixed(0);
    document.getElementById("llm-latency").innerText = `Latência: ${elapsed}ms`;

    appendBotMessage(`
      Analisei as diretrizes para aproveitamento de estudos do IFSC. Foi gerado o protocolo preliminar de atendimento <code>${result.protocolo}</code> para seu acompanhamento.<br><br>
      📌 <strong>Documentação necessária para deferimento:</strong><br>
      • Histórico escolar oficial assinado pela instituição de origem;<br>
      • Ementas das disciplinas cursadas com carga horária compatível ($\ge 75\\%$ de similaridade);<br>
      • Entrega física na Secretaria Acadêmica (Câmpus Garopaba).
    `);
    return;
  }

  // --- CENÁRIO 6: JUSTIFICATIVA DE FALTA ---
  if (promptLower.includes("falta") || promptLower.includes("justificar") || promptLower.includes("ausencia") || promptLower.includes("atestado medico")) {
    document.getElementById("llm-details").innerHTML = `Tool: <strong>abrirRequerimentoSecretaria()</strong> | Justificativa de Falta`;
    const tool = IFSC_AGENT_TOOLS.find(t => t.name === "abrirRequerimentoSecretaria");
    const result = tool.execute({ matricula: activeStudent ? activeStudent.matricula : "", tipo: "Justificativa de Falta (LLM)", motivo: prompt });

    const elapsed = (performance.now() - startTime).toFixed(0);
    document.getElementById("llm-latency").innerText = `Latência: ${elapsed}ms`;

    const mailtoLink = activeStudent ? IFSC_Session.generateMailtoLink(activeStudent, result.protocolo, "Justificativa de Falta", prompt) : null;
    const emailBtn = mailtoLink ? `
      <div style="margin-top: 0.75rem;">
        <a href="${mailtoLink}" target="_blank" class="btn-chip" style="background: rgba(56, 189, 248, 0.2); border-color: var(--accent-blue); color: var(--accent-blue); display: inline-flex; align-items: center; gap: 0.4rem; text-decoration: none; padding: 0.4rem 0.75rem;">
          <i class="bi bi-envelope-arrow-up-fill"></i> Abrir e Enviar Comprovante para Meu E-mail
        </a>
      </div>
    ` : "";

    appendBotMessage(`Requerimento de <strong>Justificativa de Ausência</strong> aberto com sucesso! ✅<br><br><strong>Protocolo:</strong> <code>${result.protocolo}</code><br><strong>Status:</strong> Pendente de Análise (Ramon)<br><br>Sua justificativa foi indexada e encaminhada para a mesa de atendimento da Secretaria Acadêmica.${emailBtn}`);
    return;
  }

  // Resposta Padrão com Síntese
  const elapsed = (performance.now() - startTime).toFixed(0);
  document.getElementById("llm-latency").innerText = `Latência: ${elapsed}ms`;
  document.getElementById("llm-details").innerHTML = `Raciocínio Generativo Direto (Sem Tool Call)`;

  appendBotMessage(`
    Entendi sua solicitação. Como assistente inteligente da Secretaria Acadêmica, posso te ajudar a emitir declarações de matrícula com autenticidade digital, consultar pendências no SIGAA, verificar o parecer do servidor Ramon sobre seus requerimentos ou orientar sobre as normas do RDP.<br><br>
    Como posso te ajudar agora?
  `);
}

// Reconhecimento de Voz (Web Speech API)
let isListening = false;
let recognition = null;

function toggleVoiceRecognition() {
  const btn = document.getElementById("btn-mic");
  
  if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
    alert("Seu navegador não suporta reconhecimento de voz. Recomendamos o Google Chrome.");
    return;
  }

  if (isListening) {
    if (recognition) recognition.stop();
    isListening = false;
    btn.style.background = "var(--bg-card)";
    btn.style.color = "var(--text-muted)";
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening = true;
    btn.style.background = "var(--ifsc-red)";
    btn.style.color = "white";
    document.getElementById("user-input").placeholder = "Ouvindo sua voz... Fale agora...";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById("user-input").value = transcript;
    sendMessage();
  };

  recognition.onend = () => {
    isListening = false;
    btn.style.background = "var(--bg-card)";
    btn.style.color = "var(--text-muted)";
    document.getElementById("user-input").placeholder = "Converse livremente ou use o microfone...";
  };

  recognition.onerror = (event) => {
    console.error("Erro no reconhecimento de voz:", event.error);
    isListening = false;
    btn.style.background = "var(--bg-card)";
    btn.style.color = "var(--text-muted)";
  };

  recognition.start();
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
    <div class="avatar avatar-bot" style="background: var(--accent-amber); color: #0b0f19;"><i class="bi bi-robot"></i></div>
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
