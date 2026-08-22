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
    ira: "8.75"
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
    ira: "9.10"
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
    ira: "8.40"
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
    ira: "7.80"
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
    ira: "9.50"
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

// 3. Funções de Consulta e Reconhecimento do Aluno (Sessão Persistente)
const IFSC_Session = {
  // Limpar pontuação para comparação
  sanitize(text) {
    return String(text || "").replace(/\D/g, "");
  },

  // Consulta por Matrícula ou CPF
  findStudent(identifier) {
    if (!identifier) return null;
    const cleanId = this.sanitize(identifier);
    return SIGAA_DATABASE.find(s => 
      this.sanitize(s.matricula) === cleanId || 
      this.sanitize(s.cpf) === cleanId ||
      s.matricula.toLowerCase() === String(identifier).trim().toLowerCase()
    ) || null;
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

  // Exportar todas as demandas para CSV
  exportDemandsCSV() {
    const demands = this.getAllDemands();
    if (!demands.length) return null;

    const headers = ["Protocolo", "Data/Hora", "Matricula", "Nome do Aluno", "Curso", "Tipo de Demanda", "Detalhes/Finalidade", "Status", "Arquivo Gerado"];
    const rows = demands.map(d => [
      d.id,
      `"${d.dataHora}"`,
      `"${d.matricula || ''}"`,
      `"${d.nome || ''}"`,
      `"${d.curso || ''}"`,
      `"${d.tipo || ''}"`,
      `"${(d.detalhes || '').replace(/"/g, '""')}"`,
      `"${d.status || 'Concluído'}"`,
      `"${d.arquivo || 'Sim'}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");
    return csvContent;
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
