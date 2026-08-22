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
    situacao: "Matriculado Regular",
    email: "camila.fagundes@aluno.ifsc.edu.br",
    ira: "9.50",
    pendencias: []
  }
];

// 2. Matriz Oficial de Menus do IFSC Garopaba (Data-Driven com Prioridades, Perfis e Regras Temporais)
const MENU_REGISTRY = [
  // --- AVISO TEMPORÁRIO COM ALTA PRIORIDADE (Sazonal) ---
  {
    id: "rematricula_periodo",
    titulo: "🚨 Período de Rematrícula 2026/2 Aberto no SIGAA!",
    roles: ["aluno"],
    priority: 10,
    validity: { validFrom: "2026-07-01T00:00:00", validUntil: "2026-09-15T23:59:59" },
    badge: "Prazo: 15/Set",
    action: "FLOW_FAQ_TOPIC",
    payload: "rematricula"
  },
  {
    id: "inscricoes_vestibular",
    titulo: "📢 Inscrições Abertas: Cursos Técnicos e Vestibular Unificado",
    roles: ["visitante", "aluno"],
    priority: 15,
    validity: { validFrom: "2026-08-01T00:00:00", validUntil: "2026-10-31T23:59:59" },
    badge: "Editais Abertos",
    action: "FLOW_FAQ_TOPIC",
    payload: "ingresso"
  },

  // --- SERVIÇOS EXCLUSIVOS DO ALUNO IDENTIFICADO ---
  {
    id: "declaracao_matricula",
    titulo: "📜 Emitir Declaração de Matrícula (com Autenticação Digital)",
    roles: ["aluno"],
    priority: 20,
    action: "FLOW_DECLARACAO"
  },
  {
    id: "pendencias_sigaa",
    titulo: "⚠️ Consultar Pendências no SIGAA (Documental / Biblioteca)",
    roles: ["aluno"],
    priority: 30,
    action: "FLOW_PENDENCIAS"
  },
  {
    id: "requerimentos_aluno",
    titulo: "📝 Abertura de Requerimento (Faltas / Aproveitamento / Geral)",
    roles: ["aluno"],
    priority: 40,
    action: "SUBMENU_REQUERIMENTOS"
  },
  {
    id: "status_requerimentos",
    titulo: "📋 Consultar Pareceres e Histórico de Solicitações",
    roles: ["aluno"],
    priority: 50,
    action: "FLOW_CONSULTA_PARECER"
  },

  // --- INFORMAÇÕES PÚBLICAS PARA VISITANTES E ALUNOS ---
  {
    id: "cursos_garopaba",
    titulo: "📚 Conhecer os Cursos Ofertados no Câmpus Garopaba",
    roles: ["visitante", "aluno"],
    priority: 60,
    action: "FLOW_FAQ_TOPIC",
    payload: "cursos"
  },
  {
    id: "como_ingressar",
    titulo: "🎓 Como Ingressar no IFSC (Vestibular, SISU, Sorteios)",
    roles: ["visitante", "aluno"],
    priority: 70,
    action: "FLOW_FAQ_TOPIC",
    payload: "ingresso"
  },
  {
    id: "duvidas_frequentes",
    titulo: "ℹ️ Dúvidas Frequentes da Secretaria (RDP, Trancamento, Horários)",
    roles: ["visitante", "aluno"],
    priority: 80,
    action: "SUBMENU_FAQ"
  },
  {
    id: "atendente_humano",
    titulo: "👤 Falar com Atendente da Secretaria (Ramon / RA)",
    roles: ["visitante", "aluno"],
    priority: 90,
    action: "FLOW_ATENDENTE"
  },
  {
    id: "identificar_aluno",
    titulo: "🔐 Já sou aluno do IFSC (Identificar Matrícula / CPF)",
    roles: ["visitante"],
    priority: 95,
    action: "FLOW_LOGIN"
  }
];

// 3. Base de Conhecimento FAQ da Secretaria (Dados Oficiais do IFSC Câmpus Garopaba)
const SECRETARIA_FAQ = [
  {
    id: "cursos",
    titulo: "Cursos Ofertados no Câmpus Garopaba",
    categoria: "Institucional",
    tags: ["cursos", "oferta", "tecnico", "superior", "graduacao", "pos", "mestrado", "fic", "guia", "administracao", "informatica", "sistemas"],
    resposta: "O IFSC Câmpus Garopaba oferta os seguintes cursos gratuitos:\n\n• **Graduação / Superior:** CST Sistemas para a Internet (Presencial / Noturno);\n• **Pós-Graduação:** Mestrado Profissional em Clima e Ambiente (Stricto Sensu multicampi);\n• **Técnicos Integrados (Ensino Médio + Técnico):** Técnico em Administração e Técnico em Informática (Integral);\n• **Técnicos Subsequentes / PROEJA:** Guia de Turismo Regional (Subsequente) e Serviços de Restaurante e Bar (PROEJA);\n• **Qualificação (FIC) & Idiomas:** Cursos de Inglês, Espanhol e Formação Inicial e Continuada.\n\nTodos os cursos são 100% gratuitos."
  },
  {
    id: "ingresso",
    titulo: "Como Ingressar no IFSC (Formas de Ingresso)",
    categoria: "Institucional",
    tags: ["ingresso", "como entrar", "vestibular", "sisu", "sorteio", "edital", "inscricao", "cadastro de interesse"],
    resposta: "O ingresso no IFSC Câmpus Garopaba ocorre através de processos seletivos públicos e gratuitos:\n\n1. **Cursos Superiores:** Vestibular Unificado UFSC/IFSC ou SiSU (com nota do ENEM), além de editais de Transferência e Retorno de Graduados;\n2. **Técnicos Integrados:** Exame de Classificação ou Sorteio Público Eletrônico;\n3. **Técnicos Subsequentes e FIC:** Sorteio Público Eletrônico oficial;\n4. **Cadastro de Interesse:** Você pode se cadastrar no portal oficial (garopaba.ifsc.edu.br) para receber alertas por e-mail quando novos editais forem publicados."
  },
  {
    id: "horario",
    titulo: "Horário de Atendimento e Contatos da Secretaria",
    categoria: "Informativa",
    tags: ["horario", "atendimento", "aberto", "secretaria", "funcionamento", "presencial", "telefone", "whatsapp", "email", "ramon", "registro academico"],
    resposta: "A Secretaria Acadêmica e o Registro Acadêmico (RA) do Câmpus Garopaba atendem:\n\n• **Horário de Atendimento:** Segunda a sexta-feira, das **08h00 às 12h00** e das **13h00 às 19h00**;\n• **WhatsApp / Telefone:** (48) 3254-7336;\n• **E-mails:** `secretaria.gpb@ifsc.edu.br` e `ra.gpb@ifsc.edu.br`;\n• **Endereço:** Rua Maria Aparecida Barbosa, nº 153, Campo D'Una, Garopaba - SC;\n• **Serviços Online:** Atestados, históricos e requerimentos podem ser solicitados diretamente no SIGAA ou aqui pelo assistente virtual."
  },
  {
    id: "rematricula",
    titulo: "Prazos e Procedimentos de Rematrícula",
    categoria: "Informativa",
    tags: ["rematricula", "prazo", "data", "quando", "semestre", "calendario", "ajuste"],
    resposta: "A rematrícula para estudantes veteranos é realizada obrigatoriamente pelo SIGAA em período estabelecido no Calendário Acadêmico oficial (geralmente ao término do semestre letivo anterior). Após a rematrícula ordinária, ocorre a fase de ajuste de matrícula diretamente com a coordenação ou registro acadêmico."
  },
  {
    id: "trancamento",
    titulo: "Regras de Trancamento de Matrícula (RDP)",
    categoria: "Informativa",
    tags: ["trancamento", "trancar", "pausar", "parar", "afastamento", "semestre", "rdp"],
    resposta: "Conforme o Regulamento Didático-Pedagógico (RDP) do IFSC:\n\n• O estudante pode trancar a matrícula por até **4 semestres letivos** (ou 2 anos) ao longo do curso;\n• **Não é permitido o trancamento no 1º semestre de ingresso** (exceto motivos excepcionais amparados em lei);\n• A solicitação deve ser feita via requerimento no SIGAA ou formalizada junto à Secretaria Acadêmica."
  },
  {
    id: "faltas_atestado",
    titulo: "Justificativa de Faltas e Atestados Médicos",
    categoria: "Informativa",
    tags: ["falta", "faltas", "atestado", "medico", "justificativa", "ausencia", "prazo atestado", "doenca"],
    resposta: "De acordo com o RDP do IFSC (Art. 98), o estudante ou seu responsável tem o prazo de até **5 (cinco) dias úteis**, a contar do término do período de afastamento, para protocolar a justificativa de faltas com o atestado comprobatório (anexado via requerimento no SIGAA ou entregue na Secretaria)."
  },
  {
    id: "carteirinha",
    titulo: "Carteirinha de Estudante e Passe Escolar (Paulotur / DNE)",
    categoria: "Informativa",
    tags: ["carteirinha", "estudante", "identificacao", "onibus", "passe", "dne", "paulotur", "transporte"],
    resposta: "A declaração de matrícula emitida com autenticação digital pela Secretaria / Chatbot é o documento comprobatório oficial aceito pelas concessionárias de transporte intermunicipal (como a Paulotur e Santo Anjo) para requisição do passe escolar com desconto. A Carteira Nacional de Estudante (DNE) pode ser solicitada em `documentodoestudante.com.br` utilizando a mesma declaração."
  },
  {
    id: "aproveitamento_regras",
    titulo: "Validação / Aproveitamento de Estudos (Disciplinas)",
    categoria: "Informativa",
    tags: ["validacao", "aproveitamento", "dispensa", "isencao", "equivalencia", "unidade curricular"],
    resposta: "Para requerer aproveitamento de unidades curriculares já cursadas no IFSC ou em outras instituições de ensino:\n1. O conteúdo programático e a carga horária devem ter equivalência mínima de **75%**;\n2. É necessário abrir requerimento anexando o **Histórico Escolar Oficial** e o **Plano de Ensino / Ementa** autenticados pela instituição de origem;\n3. O processo é encaminhado para parecer da Coordenação do Curso."
  }
];

// 4. Funções de Consulta, Reconhecimento e Gerenciamento de Menus Dinâmicos
const IFSC_Session = {
  // Obter catálogo de menus filtrados por perfil, prioridade e intervalo de datas
  getAvailableMenuItems(currentTime = new Date()) {
    const user = this.getCurrentUser();
    const currentRole = user ? "aluno" : "visitante";

    return MENU_REGISTRY
      // Filtra por perfil
      .filter(item => item.roles.includes(currentRole) || item.roles.includes("ambos"))
      // Filtra por intervalo de datas se houver validade temporal
      .filter(item => {
        if (!item.validity) return true;
        const from = item.validity.validFrom ? new Date(item.validity.validFrom) : null;
        const until = item.validity.validUntil ? new Date(item.validity.validUntil) : null;

        if (from && currentTime < from) return false;
        if (until && currentTime > until) return false;
        return true;
      })
      // Ordena por prioridade (menor número = maior prioridade no menu)
      .sort((a, b) => a.priority - b.priority);
  },

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
