/**
 * Módulo Compartilhado: Simulação SIGAA & Gerenciamento de Sessão/Arquivos
 * Projeto TCC — Marília Stefenon | IFSC Câmpus Garopaba
 */

// 1. Base Simulada de Estudantes do SIGAA (IFSC Garopaba)
const SIGAA_DATABASE = [
  {
    matricula: "20241010045",
    cpf: "111.222.333-44",
    nome: "Mariana Silva de Souza",
    curso: "CST Sistemas para Internet",
    nivel: "Graduação / Superior",
    fase: "4ª Fase",
    anoIngresso: "2024/1",
    situacao: "Matriculado Regular",
    email: "mariana.silva@aluno.ifsc.edu.br",
    ira: "8.75",
    pendencias: [
      {
        id: "PEND-01",
        tipo: "Documental",
        descricao: "Comprovante de Quitação Eleitoral 2024 pendente de homologação na Secretaria.",
        prazo: "Até o encerramento do semestre",
        setor: "Secretaria Acadêmica"
      }
    ]
  },
  {
    matricula: "20232010012",
    cpf: "222.333.444-55",
    nome: "Lucas Pereira dos Santos",
    curso: "Técnico Integrado em Informática",
    nivel: "Técnico Integrado ao Ensino Médio",
    fase: "3º Ano",
    anoIngresso: "2023/1",
    situacao: "Matriculado Regular",
    email: "lucas.pereira@aluno.ifsc.edu.br",
    ira: "9.10",
    pendencias: [
      {
        id: "PEND-02",
        tipo: "Acadêmica",
        descricao: "Histórico Escolar do Ensino Fundamental original com carimbo para conferência.",
        prazo: "30 dias",
        setor: "Secretaria Acadêmica"
      }
    ]
  },
  {
    matricula: "20251010088",
    cpf: "333.444.555-66",
    nome: "Beatriz Lima Rocha",
    curso: "Técnico Integrado em Administração",
    nivel: "Técnico Integrado ao Ensino Médio",
    fase: "2º Ano",
    anoIngresso: "2025/1",
    situacao: "Matriculado Regular",
    email: "beatriz.rocha@aluno.ifsc.edu.br",
    ira: "8.40",
    pendencias: []
  },
  {
    matricula: "20221010003",
    cpf: "444.555.666-77",
    nome: "Rodrigo Guimarães",
    curso: "CST Sistemas para Internet",
    nivel: "Graduação / Superior",
    fase: "5ª Fase",
    anoIngresso: "2022/1",
    situacao: "Trancamento de Matrícula",
    email: "rodrigo.guimaraes@aluno.ifsc.edu.br",
    ira: "7.80",
    pendencias: [
      {
        id: "PEND-03",
        tipo: "Biblioteca",
        descricao: "Devolução de exemplar: 'Engenharia de Software (Pressman, 8ª ed.)' na Biblioteca do Câmpus.",
        prazo: "Imediato",
        setor: "Biblioteca do Câmpus Garopaba"
      },
      {
        id: "PEND-04",
        tipo: "Administrativa",
        descricao: "Assinatura do Termo de Trancamento Voluntário na Secretaria Acadêmica.",
        prazo: "15 dias",
        setor: "Secretaria Acadêmica"
      }
    ]
  },
  {
    matricula: "20242010099",
    cpf: "555.666.777-88",
    nome: "Camila Fagundes",
    curso: "Especialização em Gestão Escolar",
    nivel: "Pós-Graduação Lato Sensu",
    fase: "2º Semestre",
    anoIngresso: "2024/2",
    situacao: "Matriculado Regular",
    email: "camila.fagundes@aluno.ifsc.edu.br",
    ira: "9.50",
    pendencias: []
  }
];

// 2. Base de Conhecimento FAQ da Secretaria (Categoria A — Informativa)
const SECRETARIA_FAQ = [
  {
    id: "rematricula",
    titulo: "Prazos e Procedimentos de Rematrícula",
    categoria: "Informativa",
    tags: ["rematricula", "prazo", "data", "quando", "semestre", "calendario"],
    resposta: "A rematrícula para os cursos superiores e técnicos é realizada exclusivamente pelo SIGAA. Para o semestre atual, o período de solicitação ocorre conforme o Calendário Acadêmico oficial (normalmente na última semana do semestre letivo anterior). Dúvidas específicas de turmas podem ser tratadas na Secretaria com o servidor Ramon."
  },
  {
    id: "trancamento",
    titulo: "Trancamento de Matrícula",
    categoria: "Informativa",
    tags: ["trancamento", "trancar", "pausar", "parar", "afastamento", "semestre"],
    resposta: "Conforme o Regulamento Didático-Pedagógico (RDP), o estudante pode trancar sua matrícula por até 4 semestres (2 anos) ao longo do curso, não sendo permitido o trancamento no 1º semestre de ingresso. A solicitação deve ser feita via requerimento no SIGAA ou na Secretaria Acadêmica."
  },
  {
    id: "horario",
    titulo: "Horário de Atendimento da Secretaria",
    categoria: "Informativa",
    tags: ["horario", "atendimento", "aberto", "secretaria", "funcionamento", "presencial"],
    resposta: "A Secretaria Acadêmica do Câmpus Garopaba funciona de segunda a sexta-feira, das 08h00 às 20h30 ininterruptamente, no Bloco Administrativo. Telefone: (48) 3254-7336 | E-mail: secretaria.gpb@ifsc.edu.br."
  },
  {
    id: "carteirinha",
    titulo: "Carteirinha de Estudante (DNE)",
    categoria: "Informativa",
    tags: ["carteirinha", "estudante", "identificacao", "onibus", "passe", "dne"],
    resposta: "O atestado de matrícula emitido aqui no chatbot com autenticação digital é o documento oficial aceito pelas empresas de transporte da região (como a Paulotur). A carteirinha nacional pode ser solicitada diretamente pelo portal DNE com o comprovante de matrícula."
  },
  {
    id: "aproveitamento_regras",
    titulo: "Validação / Aproveitamento de Estudos",
    categoria: "Informativa",
    tags: ["validacao", "aproveitamento", "dispensa", "isencao", "equivalencia"],
    resposta: "Para validar disciplinas cursadas em outra instituição ou em outro curso do IFSC, o estudante deve abrir requerimento anexando o histórico e a ementa da disciplina. O processo é analisado pela coordenação do curso."
  }
];

// 3. Funções de Consulta, Reconhecimento e Cadastro Dinâmico de Alunos
const IFSC_Session = {
  // Obter todos os estudantes (Base Padrão + Estudantes Cadastrados Dinamicamente)
  getAllStudents() {
    try {
      const custom = localStorage.getItem("ifsc_custom_students");
      const customList = custom ? JSON.parse(custom) : [];
      return [...SIGAA_DATABASE, ...customList];
    } catch (e) {
      return SIGAA_DATABASE;
    }
  },

  // Limpar pontuação para comparação
  sanitize(text) {
    return String(text || "").replace(/\D/g, "");
  },

  // Consulta por Matrícula ou CPF
  findStudent(identifier) {
    if (!identifier) return null;
    const cleanId = this.sanitize(identifier);
    const all = this.getAllStudents();
    return all.find(s => 
      this.sanitize(s.matricula) === cleanId || 
      this.sanitize(s.cpf) === cleanId ||
      s.matricula.toLowerCase() === String(identifier).trim().toLowerCase()
    ) || null;
  },

  // Cadastrar Novo Aluno Dinamicamente (Persiste no LocalStorage)
  registerNewStudent(studentData) {
    try {
      const custom = localStorage.getItem("ifsc_custom_students");
      const customList = custom ? JSON.parse(custom) : [];
      
      const newStudent = {
        matricula: studentData.matricula || "2026" + Date.now().toString().slice(-6),
        cpf: studentData.cpf || "000.000.000-00",
        nome: studentData.nome || "Novo Estudante",
        curso: studentData.curso || "CST Sistemas para Internet",
        nivel: studentData.nivel || "Graduação / Superior",
        fase: studentData.fase || "1ª Fase",
        anoIngresso: studentData.anoIngresso || "2026/1",
        situacao: "Matriculado Regular",
        email: studentData.email || "aluno@ifsc.edu.br",
        ira: "8.50",
        pendencias: []
      };

      // Remover duplicatas anteriores com mesma matrícula
      const filtered = customList.filter(s => s.matricula !== newStudent.matricula && s.cpf !== newStudent.cpf);
      filtered.push(newStudent);
      localStorage.setItem("ifsc_custom_students", JSON.stringify(filtered));

      // Salvar como usuário ativo
      this.setCurrentUser(newStudent);
      return newStudent;
    } catch (e) {
      console.error("Erro ao registrar aluno:", e);
      return null;
    }
  },

  // Obter pendências de um aluno
  getStudentPendencies(identifier) {
    const student = this.findStudent(identifier);
    if (!student) return [];
    return student.pendencias || [];
  },

  // Obter usuário salvo na sessão do navegador
  getCurrentUser() {
    try {
      const data = localStorage.getItem("ifsc_chatbot_active_user");
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // Salvar usuário reconhecido
  setCurrentUser(student) {
    if (student) {
      localStorage.setItem("ifsc_chatbot_active_user", JSON.stringify(student));
    } else {
      localStorage.removeItem("ifsc_chatbot_active_user");
    }
    // Disparar evento para atualizar a interface
    window.dispatchEvent(new CustomEvent("ifsc_user_changed", { detail: student }));
  },

  // Registrar Demanda no Histórico da Secretaria
  saveDemand(demandData) {
    try {
      const demands = this.getAllDemands();
      const newDemand = {
        id: "REQ-" + Date.now().toString().slice(-6),
        dataHora: new Date().toLocaleString("pt-BR"),
        timestamp: Date.now(),
        status: "Pendente de Análise (Ramon)",
        parecer: "",
        atendente: "Ramon (Secretaria Acadêmica)",
        dataParecer: null,
        ...demandData
      };
      demands.unshift(newDemand);
      localStorage.setItem("ifsc_secretaria_demands", JSON.stringify(demands));
      return newDemand;
    } catch (e) {
      console.error("Erro ao salvar demanda:", e);
      return null;
    }
  },

  // Listar todas as demandas registradas
  getAllDemands() {
    try {
      const data = localStorage.getItem("ifsc_secretaria_demands");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // Obter demandas específicas de um aluno
  getStudentDemands(identifier) {
    if (!identifier) return [];
    const cleanId = this.sanitize(identifier);
    const demands = this.getAllDemands();
    return demands.filter(d => 
      this.sanitize(d.matricula) === cleanId || 
      (d.matricula && d.matricula.toLowerCase() === String(identifier).trim().toLowerCase())
    );
  },

  // Atualizar parecer e status de uma demanda pelo Atendente (Ramon)
  updateDemandStatus(demandId, status, parecer, atendente = "Ramon (Secretaria Acadêmica)") {
    try {
      const demands = this.getAllDemands();
      const index = demands.findIndex(d => d.id === demandId);
      if (index === -1) return null;

      demands[index].status = status;
      demands[index].parecer = parecer;
      demands[index].atendente = atendente;
      demands[index].dataParecer = new Date().toLocaleString("pt-BR");

      localStorage.setItem("ifsc_secretaria_demands", JSON.stringify(demands));
      return demands[index];
    } catch (e) {
      console.error("Erro ao atualizar status da demanda:", e);
      return null;
    }
  },

  // Exportar todas as demandas para CSV
  exportDemandsCSV() {
    const demands = this.getAllDemands();
    if (!demands.length) return null;

    const headers = ["Protocolo", "Data/Hora", "Matricula", "Nome do Aluno", "Curso", "Tipo de Demanda", "Detalhes/Finalidade", "Status", "Parecer do Atendente", "Data Parecer"];
    const rows = demands.map(d => [
      d.id,
      `"${d.dataHora}"`,
      `"${d.matricula || ''}"`,
      `"${d.nome || ''}"`,
      `"${d.curso || ''}"`,
      `"${d.tipo || ''}"`,
      `"${(d.detalhes || '').replace(/"/g, '""')}"`,
      `"${d.status || 'Concluído'}"`,
      `"${(d.parecer || '').replace(/"/g, '""')}"`,
      `"${d.dataParecer || ''}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");
    return csvContent;
  },

  // Gerar Link Mailto de Comprovante de Abertura de Solicitação
  generateMailtoLink(student, protocol, demandType, details) {
    const to = student.email || "aluno@ifsc.edu.br";
    const subject = encodeURIComponent(`[IFSC Garopaba] Comprovante de Solicitação - Protocolo ${protocol}`);
    const body = encodeURIComponent(
`INSTITUTO FEDERAL DE SANTA CATARINA — IFSC CÂMPUS GAROPABA
SECRETARIA ACADÊMICA — COMPROVANTE DE ABERTURA DIGITAL

Prezado(a) ${student.nome},

Sua solicitação foi registrada no sistema digital da Secretaria Acadêmica:

• Protocolo de Atendimento: ${protocol}
• Matrícula: ${student.matricula}
• Curso: ${student.curso} (${student.fase || 'Regular'})
• Tipo de Demanda: ${demandType}
• Detalhes da Solicitação: ${details}
• Data e Hora de Registro: ${new Date().toLocaleString("pt-BR")}
• Atendente Responsável: Ramon (Secretaria Acadêmica)

Para acompanhar ou sanar dúvidas sobre este protocolo, entre em contato:
E-mail: secretaria.gpb@ifsc.edu.br | Telefone: (48) 3254-7336

Documento emitido eletronicamente via Chatbot da Secretaria Acadêmica do IFSC Garopaba.`
    );

    return `mailto:${to}?cc=secretaria.gpb@ifsc.edu.br&subject=${subject}&body=${body}`;
  },

  // Gerar Link Mailto de RETORNO DE PARECER / PENDÊNCIA enviado pela Secretaria
  generateReturnMailtoLink(student, demand) {
    const to = student.email || "aluno@ifsc.edu.br";
    const subject = encodeURIComponent(`[IFSC Garopaba] Retorno de Solicitação / Parecer - Protocolo ${demand.id} (${demand.status})`);
    const body = encodeURIComponent(
`INSTITUTO FEDERAL DE SANTA CATARINA — IFSC CÂMPUS GAROPABA
SECRETARIA ACADÊMICA — RETORNO OFICIAL DE SOLICITAÇÃO

Prezado(a) ${student.nome},

Informamos o parecer emitido pela Secretaria Acadêmica referente ao seu requerimento:

• Protocolo: ${demand.id}
• Tipo de Solicitação: ${demand.tipo}
• Situação Atual: ${demand.status.toUpperCase()}
• Data do Parecer: ${demand.dataParecer || new Date().toLocaleString("pt-BR")}
• Atendente Responsável: ${demand.atendente || 'Ramon (Secretaria Acadêmica)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESPACHO / PARECER DA SECRETARIA:
"${demand.parecer || 'Solicitação processada e atualizada no sistema acadêmico.'}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Instruções Adicionais:
Caso haja pendências a regularizar, dirija-se à Secretaria Acadêmica no horário das 08h00 às 20h30 ou responda a este e-mail anexando a documentação solicitada.

Atenciosamente,
Secretaria Acadêmica — IFSC Câmpus Garopaba
E-mail: secretaria.gpb@ifsc.edu.br | Telefone: (48) 3254-7336`
    );

    return `mailto:${to}?cc=secretaria.gpb@ifsc.edu.br&subject=${subject}&body=${body}`;
  },

  // Gerar Link Mailto de Notificação de Pendências Ativas no SIGAA
  generatePendenciesMailtoLink(student, pendencias) {
    const to = student.email || "aluno@ifsc.edu.br";
    const subject = encodeURIComponent(`[IFSC Garopaba] Notificação de Pendências Acadêmicas - Matrícula ${student.matricula}`);
    
    let listaTxt = "";
    if (!pendencias || pendencias.length === 0) {
      listaTxt = "• Nenhuma pendência documental ou acadêmica ativa no momento. Situação Regular.";
    } else {
      listaTxt = pendencias.map((p, idx) => `• [${p.tipo}] ${p.descricao} (Setor: ${p.setor} | Prazo: ${p.prazo})`).join("\n");
    }

    const body = encodeURIComponent(
`INSTITUTO FEDERAL DE SANTA CATARINA — IFSC CÂMPUS GAROPABA
SECRETARIA ACADÊMICA — RELATÓRIO DE PENDÊNCIAS ACADÊMICAS

Prezado(a) ${student.nome} (Matrícula: ${student.matricula} - ${student.curso}),

Conforme consulta realizada junto aos registros acadêmicos do SIGAA, segue a situação de pendências ativas:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUADRO DE PENDÊNCIAS:
${listaTxt}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para regularizar qualquer pendência documental ou acadêmica:
1. Compareça à Secretaria Acadêmica (Segunda a Sexta, das 08h00 às 20h30);
2. Ou envie a documentação comprobatória respondendo a este e-mail.

Atenciosamente,
Secretaria Acadêmica — IFSC Câmpus Garopaba
E-mail: secretaria.gpb@ifsc.edu.br | Telefone: (48) 3254-7336`
    );

    return `mailto:${to}?cc=secretaria.gpb@ifsc.edu.br&subject=${subject}&body=${body}`;
  },

  // Disparo de E-mail Real via API de Webhook / EmailJS
  async sendEmailNotification(student, protocol, demandType, details) {
    console.log(`[E-mail Service] Despachando notificação de protocolo ${protocol} para ${student.email}...`);
    
    // Tentar envio via webhook público caso configurado ou simular envio com sucesso
    try {
      if (window.emailjs && window.IFSC_EMAILJS_SERVICE_ID) {
        await window.emailjs.send(window.IFSC_EMAILJS_SERVICE_ID, window.IFSC_EMAILJS_TEMPLATE_ID, {
          to_email: student.email,
          to_name: student.nome,
          protocol: protocol,
          demand_type: demandType,
          details: details
        });
        return { success: true, mode: "api_live" };
      }
    } catch (e) {
      console.warn("Erro ao disparar via EmailJS:", e);
    }

    return { success: true, mode: "mailto_fallback" };
  }
};

// 4. Gerador de Declaração de Matrícula Oficial em PDF (Direto no Navegador via PDF-Lib)
async function gerarDeclaracaoMatriculaPDF(aluno, finalidade = "Fins de Comprovação Acadêmica") {
  const { PDFDocument, rgb, StandardFonts } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 (pt)
  const { width, height } = page.getSize();
  
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const ifscGreen = rgb(0.196, 0.627, 0.255); // #32a041
  const darkGray = rgb(0.15, 0.15, 0.15);
  const lightGray = rgb(0.92, 0.94, 0.96);

  // Faixa de Cabeçalho Institucional
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: lightGray
  });

  page.drawRectangle({
    x: 0,
    y: height - 105,
    width: width,
    height: 5,
    color: ifscGreen
  });

  page.drawText("INSTITUTO FEDERAL DE SANTA CATARINA — IFSC", {
    x: 50,
    y: height - 45,
    size: 14,
    font: fontBold,
    color: ifscGreen
  });

  page.drawText("CÂMPUS GAROPABA — SECRETARIA ACADÊMICA", {
    x: 50,
    y: height - 65,
    size: 11,
    font: fontBold,
    color: darkGray
  });

  page.drawText("Rua Maria Aparecida Barbosa, 153, Campo D'Una, Garopaba - SC | Tel: (48) 3254-7336", {
    x: 50,
    y: height - 82,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4)
  });

  // Título do Documento
  page.drawText("DECLARAÇÃO DE MATRÍCULA E REGULARIDADE", {
    x: 105,
    y: height - 160,
    size: 13,
    font: fontBold,
    color: darkGray
  });

  // Linha divisória
  page.drawLine({
    start: { x: 50, y: height - 175 },
    end: { x: width - 50, y: height - 175 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8)
  });

  // Texto Formal
  const textoCorpo = `Declaramos, para os devidos fins e a pedido da pessoa interessada, que o(a) estudante abaixo identificado(a) encontra-se regularmente matriculado(a) e com vínculo ativo junto a esta instituição de ensino:`;
  page.drawText(textoCorpo, {
    x: 50,
    y: height - 210,
    size: 10.5,
    font: fontRegular,
    color: darkGray,
    lineHeight: 15,
    maxWidth: width - 100
  });

  // Quadro de Dados do Aluno
  const boxY = height - 370;
  page.drawRectangle({
    x: 50,
    y: boxY,
    width: width - 100,
    height: 135,
    borderColor: ifscGreen,
    borderWidth: 1.5,
    color: rgb(0.98, 0.99, 0.98)
  });

  const dados = [
    ["Nome Completo:", aluno.nome],
    ["Número de Matrícula:", aluno.matricula],
    ["CPF:", aluno.cpf],
    ["Curso:", aluno.curso],
    ["Nível / Modalidade:", aluno.nivel],
    ["Fase / Período Atual:", aluno.fase],
    ["Situação Cadastral:", aluno.situacao]
  ];

  let currentY = boxY + 115;
  dados.forEach(([label, valor]) => {
    page.drawText(label, { x: 65, y: currentY, size: 9.5, font: fontBold, color: darkGray });
    page.drawText(valor, { x: 200, y: currentY, size: 9.5, font: fontRegular, color: darkGray });
    currentY -= 16;
  });

  // Finalidade
  page.drawText(`Finalidade declarada: ${finalidade}`, {
    x: 50,
    y: height - 410,
    size: 10,
    font: fontItalic,
    color: darkGray
  });

  // Data e Local
  const dataExtenso = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date());
  page.drawText(`Garopaba (SC), ${dataExtenso}.`, {
    x: 50,
    y: height - 470,
    size: 10.5,
    font: fontRegular,
    color: darkGray
  });

  // Assinatura Digital Simulada
  page.drawLine({
    start: { x: 180, y: height - 560 },
    end: { x: 420, y: height - 560 },
    thickness: 1,
    color: darkGray
  });

  page.drawText("SECRETARIA ACADÊMICA — IFSC CÂMPUS GAROPABA", {
    x: 160,
    y: height - 575,
    size: 9,
    font: fontBold,
    color: darkGray
  });

  page.drawText("Sistema de Atendimento Digital / SIGAA IFSC", {
    x: 205,
    y: height - 588,
    size: 8,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5)
  });

  // Rodapé de Autenticação Digital
  const codAutenticacao = "IFSC-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + Date.now().toString().slice(-4);
  page.drawRectangle({
    x: 50,
    y: 50,
    width: width - 100,
    height: 45,
    color: lightGray
  });

  page.drawText(`Código de Autenticidade Digital: ${codAutenticacao}`, {
    x: 65,
    y: 78,
    size: 8.5,
    font: fontBold,
    color: ifscGreen
  });

  page.drawText("Documento emitido eletronicamente via Chatbot da Secretaria Acadêmica. Válido em todo território nacional.", {
    x: 65,
    y: 62,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4)
  });

  const pdfBytes = await pdfDoc.save();
  return { pdfBytes, codAutenticacao };
}
