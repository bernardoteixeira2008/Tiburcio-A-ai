/**
 * ============================================================
 *  TIBURCIO AÇAÍ — ARQUIVO DE CONFIGURAÇÃO
 * ============================================================
 *  Este é o ÚNICO arquivo que você precisa editar no dia a dia
 *  para atualizar produtos, preços, bairros, taxas de entrega
 *  e o número de WhatsApp da loja.
 *
 *  Nada disso está espalhado pelo resto do código — tudo lê
 *  daqui (js/app.js só usa os dados abaixo).
 * ============================================================
 */

const CONFIG = {

  // ------------------------------------------------------------
  // 1) WHATSAPP DA LOJA
  // ------------------------------------------------------------
  // Troque APENAS o valor abaixo pelo número real da loja.
  // Formato: código do país + DDD + número, SOMENTE dígitos.
  // Exemplo real (NÃO é o número da loja, é só o formato):
  //   "5527996438936"  =>  55 (Brasil) + 27 (DDD) + 996438936
  WHATSAPP_NUMBER: "+5527996438936", // <-- SUBSTITUA AQUI

  // ------------------------------------------------------------
  // 2) IDENTIDADE / TEXTOS GERAIS
  // ------------------------------------------------------------
  BRAND: {
    nome: "Tiburcio Açaí",
    slogan: "Energia, Sabor e Conexão",
    cidade: "Vila Velha - ES",
    regiaoAtendimento: "Região 5 - Barra Mares, Vila Velha - ES",
    horario: "Todos os dias, das 12h às 22h",
    instagram: "@tiburcioacai",
  },

  // ------------------------------------------------------------
  // 3) ENTREGA — 3 faixas de taxa por região de Vila Velha
  // ------------------------------------------------------------
  // - Região 5 (Grande Jucu): entrega GRÁTIS
  // - Regiões próximas (área de Itaparica/Jockey): taxa fixa R$ 4,00
  // - Demais regiões (mais distantes, ex: Praia da Costa): taxa fixa R$ 8,00
  ENTREGA: {
    taxaRegiao5: 0,
    taxaProxima: 4,
    taxaDistante: 8,
  },

  // Região 5 — Grande Jucu (entrega GRÁTIS).
  // Baseado na divisão administrativa da Lei Municipal nº 4.707/2008.
  BAIRROS_REGIAO5: [
    "Barra do Jucu",
    "Balneário Ponta da Fruta",
    "Barramares",
    "Brunela",
    "Cidade da Barra",
    "Interlagos",
    "Interlagos I",
    "Interlagos II",
    "Jabaeté",
    "João Goulart",
    "Morada da Barra",
    "Morada do Sol",
    "Morro da Lagoa",
    "Normília da Cunha",
    "Nova Ponta da Fruta",
    "Ponta da Fruta",
    "Praia dos Recifes",
    "Riviera da Barra",
    "Santa Paula I",
    "Santa Paula II",
    "São Conrado",
    "Terra Vermelha",
    "Ulisses Guimarães",
    "Vinte e Três de Maio",
  ],

  // Bairros PRÓXIMOS da Região 5 — área de Itaparica/Jockey (taxa R$ 4,00).
  BAIRROS_PROXIMOS: [
    "Coqueiral de Itaparica",
    "Ilha dos Ayres",
    "Itapuã",
    "Jaburuna",
    "Jockey de Itaparica",
    "Nova Itaparica",
    "Residencial Coqueiral",
  ],

  // Demais bairros de Vila Velha — mais distantes (taxa R$ 8,00).
  BAIRROS_DISTANTES: [
    // Região 1 — Centro
    "Boa Vista I",
    "Boa Vista II",
    "Centro de Vila Velha",
    "Cristóvão Colombo",
    "Divino Espírito Santo",
    "Glória",
    "Olaria",
    "Praia da Costa",
    "Praia das Gaivotas",
    "Praia de Itaparica",
    "Soteco",
    "Vista da Penha",
    // Região 2 — Grande Ibes
    "Ibes",
    "Araçás",
    "Brisamar",
    "Cocal",
    "Darly Santos",
    "Guaranhuns",
    "Ilha dos Bentos",
    "Jardim Asteca",
    "Jardim Colorado",
    "Jardim Guadalajara",
    "Jardim Guaranhuns",
    "Nossa Senhora da Penha",
    "Novo México",
    "Pontal das Garças",
    "Santa Inês",
    "Santa Mônica Popular",
    "Santa Mônica",
    "Santos Dumont",
    "Vila Guaranhuns",
    "Vila Nova",
    // Região 3 — Grande Aribiri
    "Aribiri",
    "Argolas",
    "Ataíde",
    "Cavalieri",
    "Chácara do Conde",
    "Dom João Batista",
    "Garoto",
    "Ilha da Conceição",
    "Ilha das Flores",
    "Paul",
    "Pedra dos Búzios",
    "Primeiro de Maio",
    "Sagrada Família",
    "Santa Rita",
    "Vila Batista",
    "Vila Garrido",
    "Zumbi dos Palmares",
    // Região 4 — Grande Cobilândia
    "Alecrim",
    "Alvorada",
    "Cobi de Baixo",
    "Cobi de Cima",
    "Cobilândia",
    "Industrial",
    "Jardim do Vale",
    "Jardim Marilândia",
    "Nova América",
    "Planalto",
    "Polo Empresarial Novo México",
    "Rio Marinho",
    "Santa Clara",
    "São Torquato",
    "Vale Encantado",
  ],

  // ------------------------------------------------------------
  // 4) CATEGORIAS (abas do cardápio, na ordem em que aparecem)
  // ------------------------------------------------------------
  CATEGORIAS: ["Açaí", "Sorvetes", "Sander", "Picolés"],

  // ------------------------------------------------------------
  // 5) GRUPOS DE COMPLEMENTOS DO AÇAÍ (Completos / Coberturas / Frutas)
  // ------------------------------------------------------------
  // No açaí, todos os itens abaixo são INCLUSOS no preço do copo
  // (sem cobrança extra) — o cliente escolhe quantos quiser de
  // cada grupo. Se um dia algum item passar a ser cobrado à
  // parte, é só adicionar "preco: 2.00" nele (o padrão é 0).
  GRUPOS_COMPLEMENTOS_ACAI: [
    {
      grupo: "Completos",
      itens: [
        { id: "leite-po", nome: "Leite em pó" },
        { id: "granola", nome: "Granola" },
        { id: "leite-cond", nome: "Leite condensado" },
        { id: "pacoca", nome: "Paçoca" },
        { id: "flocos-arroz", nome: "Flocos de arroz" },
        { id: "sucrilhos", nome: "Sucrilhos" },
        { id: "ovomaltine", nome: "Ovomaltine" },
        { id: "neston", nome: "Neston" },
        { id: "gotas-chocolate", nome: "Gotas de chocolate" },
        { id: "amendoim", nome: "Amendoim" },
      ],
    },
    {
      grupo: "Coberturas",
      itens: [
        { id: "cob-morango", nome: "Morango" },
        { id: "cob-chocolate", nome: "Chocolate" },
        { id: "cob-leite-cond", nome: "Leite condensado" },
        { id: "cob-maracuja", nome: "Maracujá" },
        { id: "cob-limao", nome: "Limão" },
        { id: "cob-caramelo", nome: "Caramelo" },
        { id: "cob-uva", nome: "Uva" },
      ],
    },
    {
      grupo: "Frutas",
      itens: [
        { id: "fruta-uva", nome: "Uva" },
        { id: "fruta-morango", nome: "Morango" },
        { id: "fruta-kiwi", nome: "Kiwi" },
        { id: "fruta-manga", nome: "Manga" },
        { id: "fruta-abacaxi", nome: "Abacaxi" },
        { id: "fruta-banana", nome: "Banana" },
      ],
    },
  ],

  // ------------------------------------------------------------
  // 6) PROMOÇÃO — brinde ao comprar um açaí
  // ------------------------------------------------------------
  // Se "ativa" for true, o cliente escolhe o sabor da bolinha de
  // sorvete grátis ao montar qualquer açaí. Pra desativar a
  // promoção, é só trocar para false.
  PROMOCAO_BRINDE_ACAI: {
    ativa: true,
    titulo: "Promoção: ganhe uma bola de sorvete grátis!",
    sabores: [
      { nome: "Baunilha", imagem: "brinde-baunilha.png" },
      { nome: "Morango", imagem: "brinde-morango.png" },
      { nome: "Chocolate", imagem: "brinde-chocolate.png" },
    ],
  },

  // ------------------------------------------------------------
  // 7) PRODUTOS
  // ------------------------------------------------------------
  // Cada produto tem um "tipo":
  //
  //  "montavel"    -> o cliente monta o copo escolhendo itens dos
  //                   GRUPOS_COMPLEMENTOS_ACAI (usado no Açaí).
  //
  //  "sabor-unico" -> o produto já vem pronto (sorvete em pote,
  //                   sander, picolé) e o cliente só escolhe o
  //                   sabor na lista "sabores".
  //
  PRODUTOS: [
    // ---------------- AÇAÍ ----------------
    {
      id: "acai-300",
      categoria: "Açaí",
      tipo: "montavel",
      nome: "Açaí 300ml",
      descricao: "Copo tradicional, ideal para uma pausa rápida.",
      preco: 18.0,
      imagem: "acai.png",
      destaque: false,
    },
    {
      id: "acai-500",
      categoria: "Açaí",
      tipo: "montavel",
      nome: "Açaí 500ml",
      descricao: "O queridinho da galera — tamanho perfeito.",
      preco: 23.99,
      imagem: "acai.png",
      destaque: true,
    },
    {
      id: "acai-700",
      categoria: "Açaí",
      tipo: "montavel",
      nome: "Açaí 700ml",
      descricao: "Pra quem não brinca em serviço.",
      preco: 29.50,
      imagem: "acai.png",
      destaque: true,
    },
    {
      id: "acai-1000",
      categoria: "Açaí",
      tipo: "montavel",
      nome: "Açaí 1000ml",
      descricao: "Ideal para compartilhar (ou não).",
      preco: 35.50,
      imagem: "acai.png",
      destaque: false,
    },

    // ---------------- SORVETES 1 LITRO ----------------
    {
      id: "sorvete-1l",
      categoria: "Sorvetes",
      tipo: "sabor-unico",
      nome: "Sorvete 1 Litro",
      descricao: "Pote de 1 litro, escolha o sabor.",
      preco: 25.0,
      imagem: "sorvete-1l.png",
      maxSabores: 1,
      sabores: [
        { nome: "Ninho Trufado", imagem: "sabor-ninho-trufado.png" },
        { nome: "Napolitano", imagem: "sabor-napolitano.png" },
        { nome: "Nutella", imagem: "sabor-nutella.png" },
        { nome: "Ninho com Pistache", imagem: "sabor-ninho-pistache.png" },
        { nome: "Açaí", imagem: "sabor-acai.png" },
        { nome: "Kinderovo", imagem: "sabor-kinderovo.png" },
        { nome: "Frutas Vermelhas", imagem: "sabor-frutas-vermelhas.png" },
      ],
      destaque: true,
    },

    // ---------------- SANDER ----------------
    {
      id: "sander",
      categoria: "Sander",
      tipo: "sabor-unico",
      nome: "Sander",
      descricao: "Copo de sander, escolha o sabor.",
      preco: 8.0,
      imagem: "sander.png",
      maxSabores: 1,
      sabores: [
        { nome: "Morango", imagem: "sabor-sander-morango.png" },
        { nome: "Açaí com Ninho", imagem: "sabor-sander-acai-ninho.png" },
        { nome: "Brigadeiro", imagem: "sabor-sander-brigadeiro.png" },
        { nome: "Coco", imagem: "sabor-sander-coco.png" },
      ],
      destaque: false,
    },

    // ---------------- PICOLÉS PREMIUM ----------------
    {
      id: "picole-premium",
      categoria: "Picolés",
      tipo: "sabor-unico",
      nome: "Picolé Premium",
      descricao: "Picolé premium, escolha o sabor.",
      preco: 6.0,
      imagem: "picole-premium.png",
      maxSabores: 1,
      sabores: [
        { nome: "Brigadeiro", imagem: "sabor-picole-brigadeiro.png" },
        { nome: "Esquimó", imagem: "sabor-picole-esquimo.png" },
        { nome: "Tentação", imagem: "sabor-picole-tentacao.png" },
        { nome: "Pé de Moleque", imagem: "sabor-picole-pe-de-moleque.png" },
      ],
      destaque: false,
    },
  ],

  // ------------------------------------------------------------
  // 8) FORMAS DE PAGAMENTO
  // ------------------------------------------------------------
  FORMAS_PAGAMENTO: [
    { id: "pix", nome: "PIX" },
    { id: "credito", nome: "Cartão de crédito" },
    { id: "debito", nome: "Cartão de débito" },
    { id: "dinheiro", nome: "Dinheiro" },
  ],
};
