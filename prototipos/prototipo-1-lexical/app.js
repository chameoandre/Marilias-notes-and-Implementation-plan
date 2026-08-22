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

// Iniciar mensagem de boas-vindas inteligente
function iniciarChat() {
  const user = IFSC_Session.getCurrentUser();
  const chat = document.getElementById("chat-messages");
  chat.innerHTML = "";

  if (user) {
    appendBotMessage(`Olá, <strong>${user.nome.split(" ")[0]}</strong>! 👋<br>Reconheci seu acesso no SIGAA (Matrícula: <code>${user.matricula}</code> - ${user.curso}).<br><br>Como posso te ajudar hoje na Secretaria do IFSC Garopaba?`);
  } else {
    appendBotMessage(`Olá! Sou o assistente digital da <strong>Secretaria Acadêmica do IFSC Garopaba</strong>.<br><br>Você pode tirar dúvidas rápidas sobre o câmpus ou emitir documentos acadêmicos oficiais. Se preferir, informe seu <strong>CPF ou Matrícula</strong> a qualquer momento para atendimento personalizado.`);
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

  // 1. Verificar se a entrada é uma Matrícula ou CPF
  const cleanId = IFSC_Session.sanitize(text);
  if ((cleanId.length === 11 || cleanId.length === 10 || cleanId.length === 12) && /^\d+$/.test(cleanId) && currentFlowState === "IDLE") {
    const student = IFSC_Session.findStudent(cleanId);
    if (student) {
      IFSC_Session.setCurrentUser(student);
      appendBotMessage(`Identificação confirmada! ✅<br>Bem-vindo(a), <strong>${student.nome}</strong> (${student.curso} • ${student.fase}). Seus dados foram validados junto ao SIGAA.`);
      document.getElementById("debug-info").innerText = `Aluno Identificado via SIGAA: ${student.nome}`;
      return;
    } else {
      // Iniciar fluxo de cadastro de novo aluno
      currentFlowState = "REG_AWAITING_NOME";
      pendingData = {
        matricula: cleanId.length === 10 ? cleanId : "2026" + cleanId.slice(-6),
        cpf: cleanId.length === 11 ? cleanId.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "111.222.333-44"
      };
      appendBotMessage(`Matrícula/CPF <code>${text}</code> não foi localizado na base ativa do SIGAA.<br><br>💡 <strong>Deseja realizar seu primeiro cadastro no sistema?</strong><br>Por favor, digite seu <strong>Nome Completo</strong>:`);
      document.getElementById("debug-info").innerText = `Iniciando fluxo de auto-cadastro para id: ${cleanId}`;
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

    appendBotMessage(`Cadastro concluído com sucesso no SIGAA! 🎉<br><br>Bem-vindo(a), <strong>${novoAluno.nome}</strong>!<br><strong>Matrícula:</strong> <code>${novoAluno.matricula}</code> | <strong>Curso:</strong> ${novoAluno.curso} (${novoAluno.fase})<br><br>Agora você já pode emitir atestados e registrar requerimentos normalmente.`);
    document.getElementById("debug-info").innerText = `Novo aluno cadastrado e salvo: ${novoAluno.nome} (${novoAluno.matricula})`;
    return;
  }

  // 2. Máquina de Estados de Fluxos Guiados (Categoria B)
  if (currentFlowState === "AWAITING_JUSTIFICATION_MOTIVO") {
    const user = IFSC_Session.getCurrentUser();
    currentFlowState = "IDLE";
    
    // Registrar demanda para o Ramon
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

    appendBotMessage(`Requerimento de <strong>Justificativa de Falta</strong> registrado com sucesso! 📝<br><br><strong>Protocolo:</strong> <code>${req.id}</code><br><strong>Motivo declarado:</strong> "${text}"<br><br>A solicitação foi enviada para a fila de atendimento da Secretaria Acadêmica (Ramon).${emailButton}`);
    document.getElementById("debug-info").innerText = `Protocolo ${req.id} registrado no log da Secretaria. Notificação pronta para ${user ? user.email : 'aluno'}.`;
    return;
  }

  // 3. Processamento de Busca Lexical (Fuse.js)
  processarBuscaLexical(text);
}

// Processador Lexical P1
function processarBuscaLexical(query) {
  const startTime = performance.now();
  const results = fuseEngine.search(query);
  const elapsed = (performance.now() - startTime).toFixed(2);

  // Verificar intenção direta de emissão de atestado
  const queryLower = query.toLowerCase();

  // 1. Consulta de Pendências Acadêmicas / Documentais
  if (queryLower.includes("pendencia") || queryLower.includes("pendência") || queryLower.includes("debito") || queryLower.includes("débito") || queryLower.includes("documentos pendentes")) {
    const user = IFSC_Session.getCurrentUser();
    if (!user) {
      appendBotMessage(`Para consultar se você possui <strong>pendências documentais ou acadêmicas</strong> no SIGAA, por favor informe seu <strong>CPF ou Matrícula</strong>:`);
      document.getElementById("debug-info").innerText = `Consulta de pendências solicitada. Aguardando identificação.`;
      return;
    }

    const pendencias = IFSC_Session.getStudentPendencies(user.matricula);
    const mailtoLink = IFSC_Session.generatePendenciesMailtoLink(user, pendencias);
    const emailBtn = `
      <div style="margin-top: 0.75rem;">
        <a href="${mailtoLink}" target="_blank" class="btn-chip" style="background: rgba(167, 139, 250, 0.2); border-color: #a78bfa; color: #a78bfa; display: inline-flex; align-items: center; gap: 0.4rem; text-decoration: none; padding: 0.4rem 0.75rem;">
          <i class="bi bi-envelope-paper-fill"></i> Enviar Relatório de Pendências para Meu E-mail (${user.email})
        </a>
      </div>
    `;

    if (!pendencias.length) {
      appendBotMessage(`Ótimas notícias, <strong>${user.nome.split(" ")[0]}</strong>! 🎉<br><br>Você <strong>não possui nenhuma pendência</strong> documental, acadêmica ou na Biblioteca registrada no SIGAA. Sua situação está 100% regular.${emailBtn}`);
    } else {
      let pendListHtml = pendencias.map(p => `
        <li style="margin-bottom: 0.4rem;">
          <strong style="color: var(--accent-amber);">[${p.tipo}]</strong> ${p.descricao}<br>
          <small style="color: var(--text-muted);"><i class="bi bi-clock-history"></i> Prazo: ${p.prazo} | Setor: ${p.setor}</small>
        </li>
      `).join("");

      appendBotMessage(`Localizei <strong>${pendencias.length} pendência(s)</strong> no seu cadastro do SIGAA: ⚠️<br><ul style="margin: 0.5rem 0 0.5rem 1.25rem; padding: 0;">${pendListHtml}</ul>${emailBtn}`);
    }
    document.getElementById("debug-info").innerText = `Pendências consultadas para ${user.nome} (${pendencias.length} encontradas).`;
    return;
  }

  // 2. Consulta de Status / Parecer de Requerimentos Anteriores
  if (queryLower.includes("status") || queryLower.includes("solicitac") || queryLower.includes("solicitaç") || queryLower.includes("protocolo") || queryLower.includes("parecer") || queryLower.includes("andamento") || queryLower.includes("retorno") || queryLower.includes("meus pedidos")) {
    const user = IFSC_Session.getCurrentUser();
    if (!user) {
      appendBotMessage(`Para consultar o <strong>andamento e o parecer da Secretaria</strong> sobre suas solicitações, por favor digite seu <strong>CPF ou Matrícula</strong>:`);
      document.getElementById("debug-info").innerText = `Consulta de status solicitada. Aguardando identificação.`;
      return;
    }

    const demands = IFSC_Session.getStudentDemands(user.matricula);
    if (!demands.length) {
      appendBotMessage(`Olá, <strong>${user.nome.split(" ")[0]}</strong>! Você ainda não possui requerimentos ou atestados registrados nesta sessão.`);
      document.getElementById("debug-info").innerText = `Nenhum requerimento encontrado para ${user.matricula}.`;
      return;
    }

    let demandsHtml = demands.map(d => {
      const returnMailto = IFSC_Session.generateReturnMailtoLink(user, d);
      const parecerBlock = d.parecer ? `
        <div style="margin-top: 0.4rem; padding: 0.4rem 0.6rem; background: rgba(255,255,255,0.04); border-left: 2px solid var(--accent-blue); font-size: 0.8rem;">
          <strong>Despacho do Atendente (Ramon):</strong> "${d.parecer}"<br>
          <small style="color: var(--text-muted);">${d.dataParecer || ''}</small>
          <div style="margin-top: 0.35rem;">
            <a href="${returnMailto}" target="_blank" style="color: #a78bfa; text-decoration: none; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.25rem;">
              <i class="bi bi-envelope-at"></i> Abrir Notificação Oficial por E-mail
            </a>
          </div>
        </div>
      ` : `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">Aguardando despacho do atendente Ramon.</div>`;

      return `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; margin-bottom: 0.6rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: var(--accent-blue); font-size: 0.85rem;"><code>${d.id}</code> — ${d.tipo}</strong>
            <span style="font-size: 0.75rem; font-weight: 600; color: ${d.status.includes('Deferido') ? 'var(--ifsc-green-light)' : d.status.includes('Indeferido') ? '#f87171' : 'var(--accent-amber)'};">${d.status}</span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Data: ${d.dataHora} • ${d.detalhes}</div>
          ${parecerBlock}
        </div>
      `;
    }).join("");

    appendBotMessage(`Encontrei <strong>${demands.length} solicitação(ões)</strong> em seu histórico: 📋<br><br>${demandsHtml}`);
    document.getElementById("debug-info").innerText = `Listando ${demands.length} solicitações para ${user.nome}.`;
    return;
  }

  // 3. Emissão de Declaração
  if (queryLower.includes("declaração") || queryLower.includes("declaracao") || queryLower.includes("atestado") || queryLower.includes("matricula") || queryLower.includes("comprovante")) {
    const user = IFSC_Session.getCurrentUser();
    if (!user) {
      currentFlowState = "AWAITING_ID_FOR_CERTIFICATE";
      appendBotMessage(`Para emitir sua <strong>Declaração de Matrícula oficial com autenticação digital</strong>, por favor, digite seu <strong>número de matrícula ou CPF</strong>.`);
      document.getElementById("debug-info").innerText = `Fluxo Transacional P04 ativado. Aguardando CPF/Matrícula. (${elapsed}ms)`;
      return;
    } else {
      processarEmissaoAtestado(user, "Fins acadêmicos e comprovação de passe escolar");
      return;
    }
  }

  if (queryLower.includes("falta") || queryLower.includes("justificar") || queryLower.includes("atestado medico")) {
    const user = IFSC_Session.getCurrentUser();
    if (!user) {
      appendBotMessage(`Para abrir um <strong>Requerimento de Justificativa de Falta</strong>, primeiro identifique-se digitando sua matrícula ou CPF.`);
      return;
    }
    currentFlowState = "AWAITING_JUSTIFICATION_MOTIVO";
    appendBotMessage(`Entendido, <strong>${user.nome.split(" ")[0]}</strong>. Por favor, descreva brevemente o <strong>motivo e a data da ausência</strong> que deseja justificar:`);
    document.getElementById("debug-info").innerText = `Fluxo Transacional P06: Coletando motivo da falta.`;
    return;
  }

  // Resultado de FAQ Lexical
  if (results.length > 0 && results[0].score < 0.45) {
    const item = results[0].item;
    appendBotMessage(`<strong>${item.titulo}</strong><br><br>${item.resposta}`);
    document.getElementById("debug-info").innerText = `Fuse.js Match: "${item.id}" (Score: ${(1 - results[0].score).toFixed(2)}, Latência: ${elapsed}ms)`;
  } else {
    appendBotMessage(`Não encontrei uma resposta exata para sua busca no catálogo lexical.<br><br>💡 Você pode consultar <em>pendências, status de pedidos, rematrícula, horários</em> ou digitar sua dúvida.`);
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
