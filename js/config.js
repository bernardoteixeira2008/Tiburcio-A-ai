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
  WHATSAPP_NUMBER: "WHATSAPP_NUMBER", // <-- SUBSTITUA AQUI

  // ------------------------------------------------------------
  // 2) IDENTIDADE / TEXTOS GERAIS
  // ------------------------------------------------------------
  BRAND: {
    nome: "Tiburcio Açaí",
    slogan: "Energia, Sabor e Conexão",
    cidade: "Vila Velha - ES",
    regiaoAtendimento: "Região 5 de Vila Velha - ES",
    horario: "Todos os dias, das 12h às 22h",
    instagram: "@tiburcioacai",
  },

  // ------------------------------------------------------------
  // 3) BAIRROS ATENDIDOS + TAXA DE ENTREGA
  // ------------------------------------------------------------
  // Adicione, remova ou edite bairros e taxas livremente.
  // "taxa" em reais (número). Pedidos só avançam se o bairro
  // escolhido estiver nesta lista (Região 5).
  BAIRROS_ATENDIDOS: [
    { nome: "Ataíde de Souza", taxa: 5 },
    { nome: "Cristóvão Colombo", taxa: 5 },
    { nome: "Divino Espírito Santo", taxa: 6 },
    { nome: "Ilha das Flores", taxa: 6 },
    { nome: "Nossa Senhora de Fátima", taxa: 6 },
    { nome: "Nossa Senhora das Graças", taxa: 7 },
    { nome: "Nossa Senhora da Penha", taxa: 7 },
    { nome: "Novo México", taxa: 7 },
    { nome: "Órfãs", taxa: 5 },
    { nome: "Terra Vermelha", taxa: 8 },
  ],

  // ------------------------------------------------------------
  // 4) PRODUTOS — AÇAÍ (tamanhos e preços)
  // ------------------------------------------------------------
  // "complementosGratis" = quantas opções da lista de
  // COMPLEMENTOS o cliente pode escolher sem pagar a mais.
  // Complementos escolhidos além desse número usam o preço
  // definido em cada complemento (ver seção 5).
  PRODUTOS: [
    {
      id: "acai-300",
      categoria: "Açaí",
      nome: "Açaí 300ml",
      descricao: "Copo tradicional, ideal para uma pausa rápida.",
      preco: 14.0,
      complementosGratis: 3,
      imagem: "acai-300.jpg",
      destaque: false,
    },
    {
      id: "acai-500",
      categoria: "Açaí",
      nome: "Açaí 500ml",
      descricao: "O queridinho da galera — tamanho perfeito.",
      preco: 19.0,
      complementosGratis: 4,
      imagem: "acai-500.jpg",
      destaque: true,
    },
    {
      id: "acai-700",
      categoria: "Açaí",
      nome: "Açaí 700ml",
      descricao: "Pra quem não brinca em serviço.",
      preco: 24.0,
      complementosGratis: 5,
      imagem: "acai-700.jpg",
      destaque: true,
    },
    {
      id: "acai-1l",
      categoria: "Açaí",
      nome: "Açaí 1L",
      descricao: "Ideal para compartilhar (ou não).",
      preco: 32.0,
      complementosGratis: 6,
      imagem: "acai-1l.jpg",
      destaque: false,
    },
  ],

  // ------------------------------------------------------------
  // 5) COMPLEMENTOS / ADICIONAIS
  // ------------------------------------------------------------
  // "preco": 0 significa que ele nunca é cobrado.
  // Quando o cliente escolhe mais complementos do que o limite
  // grátis do produto, os excedentes são cobrados por este preço.
  COMPLEMENTOS: [
    { id: "leite-po", nome: "Leite em pó", preco: 2.0 },
    { id: "leite-cond", nome: "Leite condensado", preco: 2.0 },
    { id: "granola", nome: "Granola", preco: 2.0 },
    { id: "banana", nome: "Banana", preco: 2.0 },
    { id: "morango", nome: "Morango", preco: 3.0 },
    { id: "pacoca", nome: "Paçoca", preco: 2.0 },
    { id: "confetes", nome: "Confetes", preco: 2.0 },
    { id: "coco", nome: "Coco ralado", preco: 2.0 },
    { id: "nutella", nome: "Nutella", preco: 4.0 },
    { id: "leite-ninho", nome: "Leite Ninho", preco: 3.0 },
    { id: "kiwi", nome: "Kiwi", preco: 3.0 },
    { id: "uva", nome: "Uva", preco: 2.5 },
  ],

  // ------------------------------------------------------------
  // 6) FORMAS DE PAGAMENTO
  // ------------------------------------------------------------
  FORMAS_PAGAMENTO: [
    { id: "pix", nome: "PIX" },
    { id: "credito", nome: "Cartão de crédito" },
    { id: "debito", nome: "Cartão de débito" },
    { id: "dinheiro", nome: "Dinheiro" },
  ],
};
