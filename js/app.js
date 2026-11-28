/**
 * ============================================================
 *  TIBURCIO AÇAÍ — LÓGICA DO SITE
 *  Lê tudo de CONFIG (js/config.js). Não altere preços/produtos
 *  aqui — edite js/config.js.
 * ============================================================
 */
(function () {
  "use strict";

  /* ---------------------------------------------------------
   * ESTADO GLOBAL
   * --------------------------------------------------------- */
  const state = {
    cart: [],
    categoriaAtiva: "Todos",
    promocoes: null,
    cupom: null,           // cupom aplicado no checkout
    modal: {
      produto: null,
      complementosSelecionados: new Set(), // usado no tipo "montavel"
      saborSelecionado: null,              // usado no tipo "sabor-unico"
      brindeSelecionado: null,             // sabor do brinde grátis (açaí)
      quantidade: 1,
    },
    entrega: {
      tipo: "entrega",
      bairro: null,
    },
    pagamento: null,
  };

  /* ---------------------------------------------------------
   * HELPERS
   * --------------------------------------------------------- */
  const $ = (sel) => document.querySelector(sel);
  const $all = (sel) => Array.from(document.querySelectorAll(sel));
  const formatBRL = (v) => "R$ " + v.toFixed(2).replace(".", ",");
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // Escapa texto vindo do banco antes de colocar em HTML (protege o site
  // caso alguém digite símbolos como < > " no nome de um produto).
  function esc(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  // Só aceita endereço de imagem "limpo" (sem aspas, espaços ou parênteses).
  function urlSegura(valor) {
    const v = String(valor ?? "").trim();
    return v && /^[A-Za-z0-9_\-./:%@?=&+~#]+$/.test(v) ? v : "";
  }

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("mostrar");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("mostrar"), 2600);
  }

  /* ---------------------------------------------------------
   * INICIALIZAÇÃO GERAL (textos/marca/whatsapp)
   * --------------------------------------------------------- */
  function initBrand() {
    document.title = `${CONFIG.BRAND.nome} | Peça pelo WhatsApp — ${CONFIG.BRAND.regiaoAtendimento}`;
    $("#footerRegiao").textContent = CONFIG.BRAND.regiaoAtendimento;
    $("#footerHorario").textContent = CONFIG.BRAND.horario;
    $("#footerInsta").textContent = CONFIG.BRAND.instagram;
    $("#anoAtual").textContent = new Date().getFullYear();

    const whatsLink = buildWhatsAppLink("Olá! Vim pelo site e gostaria de saber mais sobre a Tiburcio Açaí 🍇");
    $("#whatsFloat").href = whatsLink;
    $("#footerWhatsLink").href = whatsLink;
  }

  function buildWhatsAppLink(text) {
    return `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }

  /* ---------------------------------------------------------
   * PROMOÇÕES (Supabase, editáveis no painel admin.html)
   * Tipos: percentual | pacote_preco | leve_ganhe | upgrade | brinde | informativa
   * Regras: combos (pacote por preço e leve-ganhe) travam os itens que usam,
   * e entre os descontos em porcentagem só o MAIOR vale (eles não somam).
   * --------------------------------------------------------- */
  const SUPABASE_URL = "https://bmsgygpjubdzauxlztth.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtc2d5Z3BqdWJkemF1eGx6dHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjg3NTYsImV4cCI6MjEwNDgwNDc1Nn0.ppi8E0KH_wzoP2OsFgPkSAOgneDMJLKxWQ_Dmi9qMbw";

  // Regras "de fábrica": valem se a tabela ainda não tiver as colunas novas
  // (ou seja, antes de rodar o SQL da etapa 3a). São as mesmas regras de antes.
  const PROMOS_LEGADO = {
    "desconto-geral": { tipo: "percentual", escopo: "todos", alvos: [] },
    "desconto-cravejado": { tipo: "percentual", escopo: "produtos", alvos: ["acai-cravejado-500", "acai-cravejado-700", "acai-cravejado-1000"] },
    "trio-300-30": { tipo: "pacote_preco", escopo: "produtos", alvos: ["acai-300"], quantidade: 3 },
    "leve2ganhe1-700": { tipo: "leve_ganhe", escopo: "produtos", alvos: ["acai-700", "acai-cravejado-700"], quantidade: 2, brinde_quantidade: 1, alvos_brinde: ["acai-500", "acai-cravejado-500"] },
    "leve2ganhe1-500": { tipo: "leve_ganhe", escopo: "produtos", alvos: ["acai-500", "acai-cravejado-500"], quantidade: 2, brinde_quantidade: 1, alvos_brinde: ["acai-300"] },
    "upgrade-tamanho": { tipo: "upgrade", escopo: "produtos", alvos: ["acai-300"], alvos_brinde: ["acai-500"] },
  };

  function normalizarPromocao(p) {
    const legado = !p.tipo;
    const base = legado ? Object.assign({}, p, PROMOS_LEGADO[p.id] || { tipo: "informativa" }) : p;
    const lista = (v) => (Array.isArray(v) ? v : []);
    return {
      id: p.id,
      nome: p.nome || "Promoção",
      ativa: !!p.ativa,
      tipo: base.tipo,
      escopo: base.escopo || "todos",
      alvos: lista(base.alvos),
      alvos_brinde: lista(base.alvos_brinde),
      quantidade: Number(base.quantidade) || 0,
      brinde_quantidade: Number(base.brinde_quantidade) || 1,
      valor: base.valor === null || base.valor === undefined ? null : Number(base.valor),
      descricao: legado ? "" : p.descricao || "",
      brinde_titulo: base.brinde_titulo || "",
      brinde_item: base.brinde_item || "brinde",
      brinde_opcoes: lista(base.brinde_opcoes),
      inicio: base.inicio || null,
      fim: base.fim || null,
      ordem: Number(base.ordem) || 0,
    };
  }

  // <promocoes-motor>
  const arredonda = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  const moeda = (v) => "R$ " + arredonda(v).toFixed(2).replace(".", ",");
  const numero = (v) => String(v).replace(".", ",");

  function promocaoVigente(p, hoje) {
    if (!p || !p.ativa) return false;
    if (p.inicio && hoje < String(p.inicio).slice(0, 10)) return false;
    if (p.fim && hoje > String(p.fim).slice(0, 10)) return false;
    return true;
  }

  function unidadeNoEscopo(un, escopo, alvos) {
    const lista = Array.isArray(alvos) ? alvos : [];
    if (escopo === "todos") return true;
    if (escopo === "categorias") return lista.includes(un.categoriaId);
    if (escopo === "produtos") return lista.includes(un.produtoId);
    return false;
  }

  // Cada item do carrinho vira uma "unidade" (3 açaís iguais = 3 unidades).
  function expandirCarrinho(itens) {
    const unidades = [];
    itens.forEach((item) => {
      for (let k = 0; k < item.quantidade; k++) {
        unidades.push({ produtoId: item.produtoId, categoriaId: item.categoriaId || "", preco: Number(item.precoUnitario), travada: !!item.upgradeId });
      }
    });
    return unidades;
  }

  // Tenta aplicar um combo uma vez. Devolve null ou { economia, usadas }.
  function tentarCombo(promo, unidades) {
    const livres = unidades.filter((u) => !u.travada);
    if (promo.tipo === "pacote_preco") {
      const n = promo.quantidade;
      if (!(n >= 1) || promo.valor === null || promo.valor === undefined) return null;
      const elegiveis = livres.filter((u) => unidadeNoEscopo(u, promo.escopo, promo.alvos)).sort((a, b) => a.preco - b.preco);
      if (elegiveis.length < n) return null;
      const usadas = elegiveis.slice(0, n);
      const economia = arredonda(usadas.reduce((s, u) => s + u.preco, 0) - promo.valor);
      return economia > 0 ? { economia, usadas } : null;
    }
    if (promo.tipo === "leve_ganhe") {
      const n = promo.quantidade;
      const m = promo.brinde_quantidade;
      if (!(n >= 1) || !(m >= 1)) return null;
      const presentes = livres.filter((u) => unidadeNoEscopo(u, "produtos", promo.alvos_brinde)).sort((a, b) => a.preco - b.preco).slice(0, m);
      if (presentes.length < m) return null;
      const compra = livres.filter((u) => unidadeNoEscopo(u, promo.escopo, promo.alvos) && !presentes.includes(u)).sort((a, b) => a.preco - b.preco);
      if (compra.length < n) return null;
      const economia = arredonda(presentes.reduce((s, u) => s + u.preco, 0));
      return economia > 0 ? { economia, usadas: compra.slice(0, n).concat(presentes) } : null;
    }
    return null;
  }

  // Calcula todos os descontos do carrinho.
  function calcularPromocoes(itens, promocoes, hoje, opcoes) {
    const unidades = expandirCarrinho(itens);
    const subtotal = arredonda(unidades.reduce((s, u) => s + u.preco, 0));
    const ativas = promocoes.filter((p) => promocaoVigente(p, hoje));
    const combos = ativas.filter((p) => p.tipo === "pacote_preco" || p.tipo === "leve_ganhe");
    const aplicadas = {};
    let desconto = 0;

    // 1) combos: a cada rodada aplica o que dá mais economia; os itens usados ficam travados
    for (let guarda = 0; guarda <= unidades.length; guarda++) {
      let melhor = null;
      combos.forEach((p) => {
        const t = tentarCombo(p, unidades);
        if (t && (!melhor || t.economia > melhor.t.economia + 1e-9)) melhor = { p, t };
      });
      if (!melhor) break;
      melhor.t.usadas.forEach((u) => { u.travada = true; });
      desconto += melhor.t.economia;
      const a = aplicadas[melhor.p.id] || (aplicadas[melhor.p.id] = { id: melhor.p.id, nome: melhor.p.nome, tipo: melhor.p.tipo, vezes: 0, economia: 0 });
      a.vezes += 1;
      a.economia = arredonda(a.economia + melhor.t.economia);
    }
    const linhas = Object.values(aplicadas).map((a) => "🎉 " + a.nome + " (" + a.vezes + "x aplicado) — economia de " + moeda(a.economia));
    const resultado = Object.values(aplicadas);

    // 2) descontos que NÃO somam: vale o MAIOR entre as promoções em porcentagem e o cupom
    let melhorPct = null;
    ativas.filter((p) => p.tipo === "percentual" && p.valor > 0).forEach((p) => {
      const base = unidades.filter((u) => !u.travada && unidadeNoEscopo(u, p.escopo, p.alvos)).reduce((s, u) => s + u.preco, 0);
      const economia = arredonda((base * Math.min(p.valor, 100)) / 100);
      if (economia > 0 && (!melhorPct || economia > melhorPct.economia + 1e-9)) melhorPct = { id: p.id, nome: p.nome, tipo: "percentual", valor: p.valor, economia };
    });

    const opc = opcoes || {};
    const cupom = opc.cupom || null;
    const taxa = opc.taxaEntrega === null || opc.taxaEntrega === undefined ? null : Number(opc.taxaEntrega);
    let infoCupom = null;
    let descontoFrete = 0;

    if (cupom) {
      infoCupom = { codigo: cupom.codigo, efeito: cupom.efeito, status: "ok", economia: 0, motivo: "", usar: false };
      const minimo = Number(cupom.pedido_minimo) || 0;
      const recusa = (status, motivo) => { infoCupom.status = status; infoCupom.motivo = motivo; };
      if (minimo > 0 && subtotal < minimo) {
        recusa("minimo", "Este cupom vale para pedidos a partir de " + moeda(minimo) + ".");
      } else if (cupom.efeito === "frete_gratis") {
        if (opc.tipoEntrega === "retirada") recusa("sem_valor", "Este cupom é de frete grátis e não vale para retirada.");
        else if (taxa === null) recusa("aguardando", "Escolha o bairro de entrega: o frete grátis entra quando a taxa for conhecida.");
        else if (taxa <= 0) recusa("sem_valor", "A entrega para o seu bairro já é grátis.");
        else infoCupom.economia = arredonda(taxa);
      } else if (cupom.efeito === "percentual" || cupom.efeito === "valor_fixo") {
        const livres = unidades.filter((u) => !u.travada && unidadeNoEscopo(u, cupom.escopo, cupom.alvos));
        const base = livres.reduce((s, u) => s + u.preco, 0);
        const v = Number(cupom.valor) || 0;
        infoCupom.economia = cupom.efeito === "percentual" ? arredonda((base * Math.min(v, 100)) / 100) : arredonda(Math.min(v, base));
        if (livres.length === 0) recusa("sem_itens", "Este cupom não vale para os itens do seu carrinho (ou eles já estão em um combo).");
        else if (infoCupom.economia <= 0) recusa("sem_valor", "Este cupom não gera desconto neste pedido.");
      } else if (cupom.efeito !== "brinde") {
        recusa("sem_valor", "Este cupom não pode ser usado agora.");
      }
    }

    const cupomDisputa = infoCupom && infoCupom.status === "ok" && cupom.efeito !== "brinde";
    // o cupom só ganha se der MAIS desconto que a promoção (empate fica com a promoção)
    const cupomVence = cupomDisputa && (!melhorPct || infoCupom.economia > melhorPct.economia + 1e-9);

    if (cupomVence) {
      if (cupom.efeito === "frete_gratis") {
        descontoFrete = arredonda(Math.min(taxa, infoCupom.economia));
        linhas.push("🚚 Cupom " + cupom.codigo + " — frete grátis (economia de " + moeda(descontoFrete) + ")");
      } else {
        desconto += infoCupom.economia;
        linhas.push("🎟️ Cupom " + cupom.codigo + " — economia de " + moeda(infoCupom.economia));
      }
      resultado.push({ id: "cupom:" + cupom.codigo, nome: "Cupom " + cupom.codigo, tipo: "cupom", efeito: cupom.efeito, vezes: 1, economia: infoCupom.economia });
      infoCupom.status = "aplicado";
      infoCupom.usar = true;
    } else {
      if (cupomDisputa) {
        infoCupom.status = "perdeu";
        infoCupom.motivo = "Este cupom daria " + moeda(infoCupom.economia) + ", mas a promoção " + melhorPct.nome + " já dá " + moeda(melhorPct.economia) + ". Vale o maior desconto.";
      }
      if (melhorPct) {
        desconto += melhorPct.economia;
        linhas.push("🔥 " + melhorPct.nome + " (" + numero(melhorPct.valor) + "%) — economia de " + moeda(melhorPct.economia));
        resultado.push({ id: melhorPct.id, nome: melhorPct.nome, tipo: "percentual", vezes: 1, economia: melhorPct.economia });
      }
    }

    // cupom de brinde não disputa com ninguém: soma com o desconto que valer
    if (infoCupom && infoCupom.status === "ok" && cupom.efeito === "brinde") {
      infoCupom.status = "aplicado";
      infoCupom.usar = true;
      linhas.push("🎁 Cupom " + cupom.codigo + ": " + (cupom.brinde_texto || "brinde"));
      resultado.push({ id: "cupom:" + cupom.codigo, nome: "Cupom " + cupom.codigo, tipo: "cupom", efeito: "brinde", vezes: 1, economia: 0 });
    }

    return {
      subtotal,
      desconto: arredonda(Math.min(Math.max(desconto, 0), subtotal)),
      descontoFrete,
      linhas,
      aplicadas: resultado,
      cupom: infoCupom,
      travadas: unidades.filter((u) => u.travada).length,
    };
  }
  // </promocoes-motor>

  const hojeISO = () => {
    const d = new Date();
    const z = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
  };

  function slugId(texto) {
    return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  // Id da categoria do produto (produtos do config.js não têm: usa o nome sem acento)
  const categoriaIdDe = (produto) => (produto && (produto.categoriaId || slugId(produto.categoria))) || "";

  const promocoesVigentes = () => (state.promocoes || []).filter((p) => promocaoVigente(p, hojeISO()));

  function nomesDoEscopo(escopo, alvos) {
    if (escopo === "produtos") return alvos.map((id) => (CONFIG.PRODUTOS.find((p) => p.id === id) || {}).nome).filter(Boolean);
    if (escopo === "categorias") {
      return alvos.map((id) => (CONFIG.PRODUTOS.find((p) => categoriaIdDe(p) === id) || {}).categoria).filter(Boolean);
    }
    return [];
  }
  function juntarNomes(nomes, conjuncao) {
    if (nomes.length === 0) return "";
    if (nomes.length === 1) return nomes[0];
    if (nomes.length > 3) return "produtos selecionados";
    return nomes.slice(0, -1).join(", ") + " " + (conjuncao || "e") + " " + nomes[nomes.length - 1];
  }

  // Texto do cartão de promoção: o que o cliente escreveu no painel, ou um texto gerado
  // (sempre com os valores atuais).
  function descricaoPromocao(p) {
    if (p.descricao) return p.descricao;
    const onde = juntarNomes(nomesDoEscopo(p.escopo, p.alvos), "ou");
    const ganha = juntarNomes(nomesDoEscopo("produtos", p.alvos_brinde), "ou");
    switch (p.tipo) {
      case "percentual":
        return numero(p.valor) + "% de desconto " + (p.escopo === "todos" ? "em todos os pedidos" : "em " + (juntarNomes(nomesDoEscopo(p.escopo, p.alvos)) || "produtos selecionados")) + ".";
      case "pacote_preco":
        return "Leve " + p.quantidade + " " + (onde || "produtos") + " por " + formatBRL(p.valor) + ".";
      case "leve_ganhe":
        return "Compre " + p.quantidade + " " + (onde || "produtos") + " e ganhe " + p.brinde_quantidade + " " + (ganha || "produto") + " grátis.";
      case "upgrade":
        return "Troque seu " + (onde || "produto") + " pelo " + (ganha || "tamanho maior") + " pagando só +" + formatBRL(p.valor) + ".";
      case "brinde":
        return p.brinde_titulo || "Ganhe " + p.brinde_item + " grátis.";
      default:
        return "";
    }
  }

  async function initPromocoes() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/promocoes?select=*`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Falha ao buscar promoções");
      const linhas = await res.json();
      state.promocoes = linhas.map(normalizarPromocao).sort((a, b) => a.ordem - b.ordem || String(a.nome).localeCompare(String(b.nome)));
    } catch (e) {
      state.promocoes = []; // Supabase fora do ar ou ainda não configurado: segue sem promoção
    }
    renderBannerPromocao();
    renderCombos();
    atualizarValoresCarrinho();
  }

  function renderBannerPromocao() {
    const el = $("#bannerPromocao");
    if (!el) return;
    const melhor = promocoesVigentes()
      .filter((p) => p.tipo === "percentual" && p.escopo === "todos" && p.valor > 0)
      .sort((a, b) => b.valor - a.valor)[0];
    if (melhor) {
      el.innerHTML = `<strong>🔥 ${esc(numero(melhor.valor))}% de desconto</strong> em todos os pedidos!`;
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  }

  function renderCombos() {
    const section = $("#combosSection");
    const grid = $("#combosGrid");
    if (!section || !grid) return;
    const ativos = promocoesVigentes().filter((p) => p.tipo !== "informativa" || p.descricao);
    if (ativos.length === 0) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    grid.innerHTML = ativos
      .map((p) => `
      <div class="combo-card">
        <h3>${esc(p.nome)}</h3>
        <p>${esc(descricaoPromocao(p))}</p>
      </div>`)
      .join("");
  }

  // Desconto total do carrinho (usado no carrinho, no resumo e na mensagem do WhatsApp).
  function calcularDescontoTotal() {
    const itens = state.cart.map((i) => ({
      produtoId: i.produtoId,
      categoriaId: i.categoriaId || "",
      precoUnitario: i.precoUnitario,
      quantidade: i.quantidade,
      upgradeId: i.upgradeId || null,
    }));
    const r = calcularPromocoes(itens, state.promocoes || [], hojeISO(), {
      cupom: state.cupom,
      taxaEntrega: calcularTaxaEntrega(),
      tipoEntrega: state.entrega.tipo,
    });
    return { valor: r.desconto, linhas: r.linhas, frete: r.descontoFrete, cupom: r.cupom };
  }

  // Promoção de upgrade ativa para este produto (ex.: Açaí 300ml -> 500ml pagando a diferença).
  function promocaoUpgradeDoProduto(produto) {
    const hoje = hojeISO();
    for (const p of state.promocoes || []) {
      if (p.tipo !== "upgrade" || !promocaoVigente(p, hoje) || p.valor === null) continue;
      if (!unidadeNoEscopo({ produtoId: produto.id, categoriaId: categoriaIdDe(produto) }, p.escopo, p.alvos)) continue;
      const alvo = CONFIG.PRODUTOS.find((x) => x.id === p.alvos_brinde[0]);
      if (alvo && alvo.id !== produto.id) return { promo: p, alvo };
    }
    return null;
  }

  // Brinde (ex.: bola de sorvete) ativo para este produto.
  function brindeDoProduto(produto) {
    const hoje = hojeISO();
    const un = { produtoId: produto.id, categoriaId: categoriaIdDe(produto) };
    const p = (state.promocoes || []).find((x) => x.tipo === "brinde" && promocaoVigente(x, hoje) && x.brinde_opcoes.length && unidadeNoEscopo(un, x.escopo, x.alvos));
    if (p) return { titulo: p.brinde_titulo || "Ganhe " + p.brinde_item + " grátis!", item: p.brinde_item, opcoes: p.brinde_opcoes };
    // Antes de rodar o SQL da etapa 3a, o brinde ainda vem do config.js
    const migrou = (state.promocoes || []).some((x) => x.tipo === "brinde");
    const antigo = CONFIG.PROMOCAO_BRINDE_ACAI;
    if (!migrou && antigo && antigo.ativa && produtoAceitaBrinde(produto)) {
      return { titulo: antigo.titulo, item: "bola de sorvete", opcoes: antigo.sabores };
    }
    return null;
  }

  /* ---------------------------------------------------------
   * CATÁLOGO (Supabase: produtos, categorias, sabores)
   * Ordem de preferência: banco -> última cópia salva no aparelho
   * -> produtos do js/config.js. O site nunca fica sem cardápio.
   * --------------------------------------------------------- */
  const CHAVE_CACHE_CATALOGO = "tiburcioCatalogoV1";
  const ESPERA_MAXIMA_CATALOGO_MS = 3000;

  // <catalogo>
  // Transforma as linhas do banco no mesmo formato que o site já usava no config.js.
  function montarCatalogo(linhas) {
    const lista = (v) => (Array.isArray(v) ? v : []);
    const porOrdem = (a, b) => (a.ordem || 0) - (b.ordem || 0);

    const categoriasBanco = lista(linhas.categorias).filter((c) => c.ativa !== false).sort(porOrdem);
    const catPorId = new Map(categoriasBanco.map((c) => [c.id, c]));

    const opcoesPorGrupo = new Map();
    lista(linhas.opcoes)
      .filter((o) => o.ativa !== false)
      .sort(porOrdem)
      .forEach((o) => {
        if (!opcoesPorGrupo.has(o.grupo_id)) opcoesPorGrupo.set(o.grupo_id, []);
        opcoesPorGrupo.get(o.grupo_id).push(o);
      });

    const grupoPorId = new Map(lista(linhas.grupos).map((g) => [g.id, g]));

    const gruposPorProduto = new Map();
    lista(linhas.produto_grupos)
      .sort(porOrdem)
      .forEach((v) => {
        if (!gruposPorProduto.has(v.produto_id)) gruposPorProduto.set(v.produto_id, []);
        gruposPorProduto.get(v.produto_id).push(v.grupo_id);
      });

    const produtos = [];
    lista(linhas.produtos)
      .filter((p) => p.ativo !== false && catPorId.has(p.categoria_id))
      .sort((a, b) => {
        const diferencaCategoria = (catPorId.get(a.categoria_id).ordem || 0) - (catPorId.get(b.categoria_id).ordem || 0);
        return diferencaCategoria || porOrdem(a, b);
      })
      .forEach((p) => {
        const cat = catPorId.get(p.categoria_id);
        const base = {
          id: p.id,
          categoria: cat.nome,
          nome: p.nome,
          descricao: p.descricao || "",
          preco: Number(p.preco),
          imagem: p.imagem || "",
          destaque: !!p.destaque,
          categoriaId: cat.id,
        };
        if (!Number.isFinite(base.preco) || base.preco < 0) return;

        const gruposDoItem = (gruposPorProduto.get(p.id) || [])
          .map((gid) => grupoPorId.get(gid))
          .filter(Boolean)
          .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        if (cat.modelo === "monta") {
          const grupos = gruposDoItem
            .map((g) => ({
              grupo: g.nome,
              limite: g.maximo === null || g.maximo === undefined ? null : Number(g.maximo),
              itens: (opcoesPorGrupo.get(g.id) || []).map((o) => ({ id: o.id, nome: o.nome })),
            }))
            .filter((g) => g.itens.length > 0);
          produtos.push({ ...base, tipo: "montavel", grupos });
        } else if (cat.modelo === "sabores") {
          const g = gruposDoItem[0];
          const sabores = g ? (opcoesPorGrupo.get(g.id) || []).map((o) => ({ nome: o.nome, imagem: o.imagem || "" })) : [];
          if (sabores.length === 0) return; // produto de sabor sem nenhum sabor não dá pra pedir
          produtos.push({ ...base, tipo: "sabor-unico", maxSabores: Number(g.maximo) || 1, sabores });
        }
        // outros modelos (ainda não suportados) ficam de fora
      });

    const categorias = categoriasBanco.map((c) => c.nome).filter((nome) => produtos.some((p) => p.categoria === nome));
    return produtos.length > 0 ? { categorias, produtos } : null;
  }
  // </catalogo>

  function lerCacheCatalogo() {
    try {
      const c = JSON.parse(localStorage.getItem(CHAVE_CACHE_CATALOGO));
      return c && Array.isArray(c.produtos) && Array.isArray(c.categorias) && c.produtos.length ? c : null;
    } catch (e) {
      return null;
    }
  }

  function salvarCacheCatalogo(catalogo) {
    try {
      localStorage.setItem(CHAVE_CACHE_CATALOGO, JSON.stringify(catalogo));
    } catch (e) {
      /* sem espaço no aparelho: tudo bem, só não guarda a cópia */
    }
  }

  function aplicarCatalogo(catalogo) {
    CONFIG.CATEGORIAS = catalogo.categorias;
    CONFIG.PRODUTOS = catalogo.produtos;
  }

  async function buscarCatalogoDoBanco() {
    const tabelas = ["categorias", "produtos", "grupos", "opcoes", "produto_grupos"];
    try {
      const respostas = await Promise.all(
        tabelas.map((t) =>
          fetch(`${SUPABASE_URL}/rest/v1/${t}?select=*`, {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
            cache: "no-store",
          })
        )
      );
      if (respostas.some((r) => !r.ok)) return null;
      const dados = await Promise.all(respostas.map((r) => r.json()));
      if (dados.some((d) => !Array.isArray(d))) return null;
      return montarCatalogo(Object.fromEntries(tabelas.map((t, i) => [t, dados[i]])));
    } catch (e) {
      return null;
    }
  }

  // Escolhe o catálogo que o site vai mostrar.
  async function iniciarCatalogo() {
    const busca = buscarCatalogoDoBanco();
    const espera = new Promise((resolve) => setTimeout(() => resolve("tempo"), ESPERA_MAXIMA_CATALOGO_MS));
    const resultado = await Promise.race([busca, espera]);

    if (resultado && resultado !== "tempo") {
      salvarCacheCatalogo(resultado);
      aplicarCatalogo(resultado);
      return;
    }

    // O banco falhou ou demorou: usa a última cópia salva (se houver). Sem cópia, fica o config.js.
    const copia = lerCacheCatalogo();
    if (copia) aplicarCatalogo(copia);

    // Se só demorou, atualiza a tela quando a resposta chegar.
    if (resultado === "tempo") {
      busca.then((catalogo) => {
        if (catalogo) {
          salvarCacheCatalogo(catalogo);
          aplicarCatalogo(catalogo);
          renderCatalogo();
        }
      });
    }
  }

  function renderCatalogo() {
    renderDestaques();
    renderAbasCategoria();
    renderCardapio();
  }

  /* ---------------------------------------------------------
   * RENDER: PRODUTOS EM DESTAQUE
   * --------------------------------------------------------- */
  function renderDestaques() {
    const grid = $("#destaqueGrid");
    const destaques = CONFIG.PRODUTOS.filter((p) => p.destaque);
    grid.innerHTML = destaques.map(produtoCardHTML).join("");
    ligarBotoesMontar(grid);
  }

  /* ---------------------------------------------------------
   * RENDER: ABAS + CARDÁPIO POR CATEGORIA
   * --------------------------------------------------------- */
  function renderAbasCategoria() {
    const nav = $("#cardapioAbas");
    const categorias = ["Todos", ...CONFIG.CATEGORIAS];
    // Se a aba escolhida deixou de existir (ex.: categoria desativada), volta pra "Todos".
    if (!categorias.includes(state.categoriaAtiva)) state.categoriaAtiva = "Todos";
    nav.innerHTML = categorias
      .map(
        (c) =>
          `<button class="aba-cat${c === state.categoriaAtiva ? " active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`
      )
      .join("");

    nav.querySelectorAll(".aba-cat").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.categoriaAtiva = btn.dataset.cat;
        renderAbasCategoria();
        renderCardapio();
      });
    });
  }

  function renderCardapio() {
    const grid = $("#cardapioGrid");
    const lista =
      state.categoriaAtiva === "Todos"
        ? CONFIG.PRODUTOS
        : CONFIG.PRODUTOS.filter((p) => p.categoria === state.categoriaAtiva);

    grid.innerHTML = lista.map(produtoCardHTML).join("");
    ligarBotoesMontar(grid);
  }

  function ligarBotoesMontar(container) {
    container.querySelectorAll("[data-abrir-produto]").forEach((btn) => {
      btn.addEventListener("click", () => openProdutoModal(btn.dataset.abrirProduto));
    });
  }

  function produtoCardHTML(p) {
    const imagem = urlSegura(p.imagem);
    const thumb = imagem
      ? `<div class="produto-thumb" style="background-image:url('${imagem}')"></div>`
      : `<div class="produto-thumb" aria-hidden="true"></div>`;
    return `
      <article class="produto-card">
        ${p.destaque ? '<span class="badge">Mais pedido</span>' : ""}
        ${thumb}
        <h3>${esc(p.nome)}</h3>
        <p>${esc(p.descricao)}</p>
        <div class="produto-footer">
          <span class="produto-preco">${formatBRL(p.preco)}</span>
          <button class="btn btn-primary" data-abrir-produto="${esc(p.id)}">Montar</button>
        </div>
      </article>`;
  }

  /* ---------------------------------------------------------
   * RENDER: BAIRROS (seção + select do checkout)
   * --------------------------------------------------------- */
  function renderBairros() {
    const lista = $("#listaBairros");
    lista.innerHTML = CONFIG.BAIRROS_REGIAO5.map(
      (nome) => `<li>${nome} <span class="taxa">Grátis</span></li>`
    ).join("");

    const select = $("#campoBairro");

    function criarGrupo(label, nomes, taxaTexto) {
      const grupo = document.createElement("optgroup");
      grupo.label = `${label} — ${taxaTexto}`;
      nomes.forEach((nome) => {
        const opt = document.createElement("option");
        opt.value = nome;
        opt.textContent = nome;
        grupo.appendChild(opt);
      });
      select.appendChild(grupo);
    }

    criarGrupo("Região 5", CONFIG.BAIRROS_REGIAO5, "grátis");
    criarGrupo("Regiões próximas (Itaparica/Jockey)", CONFIG.BAIRROS_PROXIMOS, formatBRL(CONFIG.ENTREGA.taxaProxima));
    criarGrupo("Outras regiões", CONFIG.BAIRROS_DISTANTES, formatBRL(CONFIG.ENTREGA.taxaDistante));

    const optOutro = document.createElement("option");
    optOutro.value = "__outro__";
    optOutro.textContent = `Meu bairro não está na lista — taxa ${formatBRL(CONFIG.ENTREGA.taxaDistante)}`;
    select.appendChild(optOutro);
  }

  function taxaDoBairro(nome) {
    if (CONFIG.BAIRROS_REGIAO5.includes(nome)) return CONFIG.ENTREGA.taxaRegiao5;
    if (CONFIG.BAIRROS_PROXIMOS.includes(nome)) return CONFIG.ENTREGA.taxaProxima;
    return CONFIG.ENTREGA.taxaDistante;
  }

  /* ---------------------------------------------------------
   * MODAL DE PRODUTO
   * --------------------------------------------------------- */
  function openProdutoModal(produtoId) {
    const produto = CONFIG.PRODUTOS.find((p) => p.id === produtoId);
    if (!produto) return;

    state.modal.produto = produto;
    state.modal.complementosSelecionados = new Set();
    state.modal.saborSelecionado = null;
    state.modal.brindeSelecionado = null;
    state.modal.upgradeAtivo = false;
    state.modal.brindeInfo = null;
    state.modal.upgradeInfo = null;
    state.modal.quantidade = 1;

    $("#produtoModalTitulo").textContent = produto.nome;
    $("#produtoModalDesc").textContent = produto.descricao;
    $("#qtdValor").textContent = "1";

    if (produto.tipo === "montavel") {
      renderComplementosMontavel(produto);
    } else {
      renderSaboresUnicos(produto);
    }

    updateModalTotal();
    $("#produtoModalOverlay").classList.add("aberto");
  }

  function closeProdutoModal() {
    $("#produtoModalOverlay").classList.remove("aberto");
  }

  // ---------- Tipo "montavel" (Açaí: grupos de complementos + brinde) ----------
  // A bola de sorvete de brinde vale para os produtos da categoria Açaí
  // (depois isso passa a ser configurado nas promoções).
  function produtoAceitaBrinde(produto) {
    return produto.categoriaId ? produto.categoriaId === "acai" : produto.categoria === "Açaí";
  }

  function renderComplementosMontavel(produto) {
    $("#complementoInfoBox").innerHTML = gruposDoProduto(produto).length
      ? "Escolha os complementos — cada grupo tem um limite de quantos itens dá pra marcar."
      : "Escolha a quantidade e adicione ao carrinho.";

    let html = "";
    gruposDoProduto(produto).forEach((grupo) => {
      const textoLimite = grupo.limite === null || grupo.limite === undefined
        ? "(escolha quantos quiser)"
        : `(escolha até ${grupo.limite})`;
      html += `<h4 class="grupo-titulo" data-grupo-titulo="${esc(grupo.grupo)}">${esc(grupo.grupo)} <span class="grupo-limite">${textoLimite}</span></h4>`;
      html += `<div class="complementos-grid">`;
      grupo.itens.forEach((item) => {
        html += `
          <div class="complemento-item" data-id="${esc(item.id)}" data-grupo="${esc(grupo.grupo)}" tabindex="0" role="checkbox" aria-checked="false">
            <span>${esc(item.nome)}</span>
            <span class="preco-extra">incluso</span>
          </div>`;
      });
      html += `</div>`;
    });

    // Brinde (promoção do tipo "brinde" no painel)
    const brinde = brindeDoProduto(produto);
    state.modal.brindeInfo = brinde;
    if (brinde) {
      html += `<h4 class="grupo-titulo brinde-titulo">🎁 ${esc(brinde.titulo)}</h4>`;
      html += `<div class="sabores-grid" id="brindeGrid">`;
      brinde.opcoes.forEach((opcao) => {
        const imagem = urlSegura(opcao.imagem);
        const thumb = imagem
          ? `<span class="sabor-thumb" style="background-image:url('${imagem}')"></span>`
          : `<span class="sabor-thumb sabor-thumb-vazio">🍨</span>`;
        html += `
          <button type="button" class="sabor-item" data-sabor="${esc(opcao.nome)}">
            ${thumb}
            <span class="sabor-nome">${esc(opcao.nome)}</span>
          </button>`;
      });
      html += `</div>`;
    }

    // Upgrade de tamanho (aparece quando há promoção de upgrade ativa para este produto)
    const upgrade = promocaoUpgradeDoProduto(produto);
    state.modal.upgradeInfo = upgrade;
    if (upgrade) {
      html += `
        <div class="upgrade-promo" id="upgradePromoBox">
          <label class="upgrade-check">
            <input type="checkbox" id="upgradeCheckbox" />
            <span>🎉 Troque seu ${esc(produto.nome)} pelo ${esc(upgrade.alvo.nome)} pagando só +${formatBRL(upgrade.promo.valor)}</span>
          </label>
        </div>`;
    }

    $("#modalCorpoDinamico").innerHTML = html;

    $all(".complemento-item").forEach((el) => {
      el.addEventListener("click", () => toggleComplemento(el.dataset.id));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleComplemento(el.dataset.id);
        }
      });
    });

    const brindeGrid = $("#brindeGrid");
    if (brindeGrid) {
      brindeGrid.querySelectorAll(".sabor-item").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.modal.brindeSelecionado = btn.dataset.sabor;
          brindeGrid.querySelectorAll(".sabor-item").forEach((b) => b.classList.remove("selecionado"));
          btn.classList.add("selecionado");
        });
      });
    }

    const upgradeCheckbox = $("#upgradeCheckbox");
    if (upgradeCheckbox) {
      upgradeCheckbox.addEventListener("change", (e) => {
        state.modal.upgradeAtivo = e.target.checked;
        updateModalTotal();
      });
    }
  }

  // Transforma "Completos" -> "Completo", "Coberturas" -> "Cobertura", etc.
  function singularGrupo(nomeGrupo) {
    return nomeGrupo.replace(/s$/i, "");
  }

  // Descobre a qual grupo (Completos/Coberturas/Frutas) um id de complemento pertence.
  function grupoDoComplemento(id) {
    return gruposDoProduto(state.modal.produto).find((g) => g.itens.some((i) => i.id === id));
  }

  // Grupos de complementos do produto: os do banco (um conjunto por produto)
  // ou, se o produto veio do config.js, a lista geral do açaí.
  function gruposDoProduto(produto) {
    return (produto && produto.grupos) || CONFIG.GRUPOS_COMPLEMENTOS_ACAI;
  }

  // Conta quantos itens de um grupo específico já estão marcados.
  function contarSelecionadosDoGrupo(grupoAlvo) {
    let count = 0;
    state.modal.complementosSelecionados.forEach((id) => {
      if (grupoDoComplemento(id) === grupoAlvo) count++;
    });
    return count;
  }

  function toggleComplemento(id) {
    const sel = state.modal.complementosSelecionados;
    const grupo = grupoDoComplemento(id);

    if (!sel.has(id)) {
      // Vai marcar agora — checa se o grupo já bateu o limite.
      const temLimite = grupo && grupo.limite !== null && grupo.limite !== undefined;
      if (temLimite && contarSelecionadosDoGrupo(grupo) >= grupo.limite) {
        toast(`Você já escolheu o máximo de ${grupo.limite} em "${grupo.grupo}".`);
        return;
      }
      sel.add(id);
    } else {
      sel.delete(id);
    }

    const el = $all(".complemento-item").find((e) => e.dataset.id === id);
    if (el) {
      const marcado = sel.has(id);
      el.classList.toggle("selecionado", marcado);
      el.setAttribute("aria-checked", marcado ? "true" : "false");
    }
    updateModalTotal();
  }

  // ---------- Tipo "sabor-unico" (Sorvete / Sander / Picolé) ----------
  function renderSaboresUnicos(produto) {
    $("#complementoInfoBox").innerHTML = `Escolha o sabor do seu ${esc(produto.nome.toLowerCase())}.`;

    let html = `<div class="sabores-grid">`;
    produto.sabores.forEach((sabor) => {
      const imagem = urlSegura(sabor.imagem);
      const thumb = imagem
        ? `<span class="sabor-thumb" style="background-image:url('${imagem}')"></span>`
        : `<span class="sabor-thumb sabor-thumb-vazio">🍨</span>`;
      html += `
        <button type="button" class="sabor-item" data-sabor="${esc(sabor.nome)}">
          ${thumb}
          <span class="sabor-nome">${esc(sabor.nome)}</span>
        </button>`;
    });
    html += `</div>`;
    $("#modalCorpoDinamico").innerHTML = html;

    $all(".sabor-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.modal.saborSelecionado = btn.dataset.sabor;
        $all(".sabor-item").forEach((b) => b.classList.remove("selecionado"));
        btn.classList.add("selecionado");
        updateModalTotal();
      });
    });
  }

  function updateModalTotal() {
    const produto = state.modal.produto;
    let precoUnitario = produto.preco;

    if (state.modal.upgradeAtivo && state.modal.upgradeInfo) {
      precoUnitario += state.modal.upgradeInfo.promo.valor;
    }

    const total = Math.round(precoUnitario * state.modal.quantidade * 100) / 100;
    $("#produtoModalTotal").textContent = formatBRL(total);
  }

  function initModalQtdControls() {
    $("#qtdMenos").addEventListener("click", () => {
      state.modal.quantidade = Math.max(1, state.modal.quantidade - 1);
      $("#qtdValor").textContent = state.modal.quantidade;
      updateModalTotal();
    });
    $("#qtdMais").addEventListener("click", () => {
      state.modal.quantidade = Math.min(20, state.modal.quantidade + 1);
      $("#qtdValor").textContent = state.modal.quantidade;
      updateModalTotal();
    });
  }

  function addAoCarrinho() {
    const produto = state.modal.produto;

    if (produto.tipo === "sabor-unico" && !state.modal.saborSelecionado) {
      toast("Escolha um sabor antes de adicionar ao carrinho.");
      return;
    }

    let descricaoItens = [];
    if (produto.tipo === "montavel") {
      const nomes = Array.from(state.modal.complementosSelecionados).map((id) => {
        for (const grupo of gruposDoProduto(produto)) {
          const item = grupo.itens.find((i) => i.id === id);
          // Prefixa com o grupo (ex: "Cobertura: Morango" / "Fruta: Morango")
          // pra não confundir itens de nomes iguais em grupos diferentes.
          if (item) return `${singularGrupo(grupo.grupo)}: ${item.nome}`;
        }
        return id;
      });
      descricaoItens = nomes;
    } else {
      descricaoItens = [`Sabor: ${state.modal.saborSelecionado}`];
    }

    if (state.modal.brindeSelecionado && state.modal.brindeInfo) {
      descricaoItens.push(`🎁 Brinde: ${state.modal.brindeInfo.item} (${state.modal.brindeSelecionado})`);
    }

    // Upgrade de tamanho: o item vira o produto de destino, pagando a diferença configurada
    let produtoIdFinal = produto.id;
    let nomeFinal = produto.nome;
    let precoFinal = produto.preco;
    let categoriaFinal = categoriaIdDe(produto);
    let upgradeId = null;

    if (state.modal.upgradeAtivo && state.modal.upgradeInfo) {
      const { promo, alvo } = state.modal.upgradeInfo;
      produtoIdFinal = alvo.id;
      nomeFinal = alvo.nome;
      precoFinal = Math.round((produto.preco + promo.valor) * 100) / 100;
      categoriaFinal = categoriaIdDe(alvo);
      upgradeId = promo.id;
      descricaoItens.push(`🎉 ${promo.nome}: ${produto.nome} → ${alvo.nome} (+${formatBRL(promo.valor)})`);
    }

    state.cart.push({
      uid: uid(),
      produtoId: produtoIdFinal,
      categoriaId: categoriaFinal,
      upgradeId,
      nome: nomeFinal,
      precoUnitario: precoFinal,
      itens: descricaoItens,
      quantidade: state.modal.quantidade,
    });

    renderCart();
    closeProdutoModal();
    abrirCarrinho();
    toast(`${produto.nome} adicionado ao carrinho!`);
  }

  /* ---------------------------------------------------------
   * CARRINHO
   * --------------------------------------------------------- */
  function abrirCarrinho() {
    $("#carrinhoDrawer").classList.add("aberto");
    $("#drawerOverlay").classList.add("aberto");
  }
  function fecharCarrinhoDrawer() {
    $("#carrinhoDrawer").classList.remove("aberto");
    $("#drawerOverlay").classList.remove("aberto");
  }

  function renderCart() {
    const container = $("#carrinhoItens");

    if (state.cart.length === 0) {
      // (a mensagem é recriada aqui: antes ela era um elemento fixo que sumia quando entrava o 1º item)
      container.innerHTML = '<p class="carrinho-vazio" id="carrinhoVazioMsg">Seu carrinho está vazio. Que tal um açaí agora?</p>';
      $("#btnIrCheckout").disabled = true;
    } else {
      container.innerHTML = state.cart
        .map(
          (item) => `
        <div class="item-carrinho" data-uid="${item.uid}">
          <div class="item-thumb" aria-hidden="true"></div>
          <div class="item-info">
            <h4>${esc(item.nome)}</h4>
            <div class="item-complementos">${
              item.itens.length ? esc(item.itens.join(", ")) : "Sem complementos"
            }</div>
            <div class="item-linha">
              <div class="item-qtd">
                <button data-menos>−</button>
                <span>${item.quantidade}</span>
                <button data-mais>+</button>
              </div>
              <span class="item-preco">${formatBRL(item.precoUnitario * item.quantidade)}</span>
            </div>
            <button class="item-remover" data-remover>Remover</button>
          </div>
        </div>`
        )
        .join("");
      $("#btnIrCheckout").disabled = false;
    }

    container.querySelectorAll(".item-carrinho").forEach((el) => {
      const itemUid = el.dataset.uid;
      el.querySelector("[data-mais]")?.addEventListener("click", () => alterarQtdCarrinho(itemUid, 1));
      el.querySelector("[data-menos]")?.addEventListener("click", () => alterarQtdCarrinho(itemUid, -1));
      el.querySelector("[data-remover]")?.addEventListener("click", () => removerDoCarrinho(itemUid));
    });

    atualizarBadgeCarrinho();
    atualizarValoresCarrinho();
  }

  function alterarQtdCarrinho(itemUid, delta) {
    const item = state.cart.find((i) => i.uid === itemUid);
    if (!item) return;
    item.quantidade = Math.max(1, item.quantidade + delta);
    renderCart();
  }

  function removerDoCarrinho(itemUid) {
    state.cart = state.cart.filter((i) => i.uid !== itemUid);
    renderCart();
  }

  function atualizarBadgeCarrinho() {
    const totalItens = state.cart.reduce((s, i) => s + i.quantidade, 0);
    $("#cartBadge").textContent = totalItens;
  }

  function calcularSubtotal() {
    return state.cart.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
  }

  function calcularTaxaEntrega() {
    if (state.entrega.tipo === "retirada") return 0;
    return state.entrega.bairro ? state.entrega.bairro.taxa : null;
  }

  function atualizarValoresCarrinho() {
    const subtotal = calcularSubtotal();
    $("#carrinhoSubtotal").textContent = formatBRL(subtotal);

    const { valor: desconto, frete } = calcularDescontoTotal();
    const linhaDesconto = $("#linhaDescontoCarrinho");
    if (linhaDesconto) {
      if (desconto > 0) {
        $("#carrinhoDesconto").textContent = "- " + formatBRL(desconto);
        linhaDesconto.hidden = false;
      } else {
        linhaDesconto.hidden = true;
      }
    }

    const taxa = calcularTaxaEntrega();
    $("#carrinhoTaxa").textContent = taxa === null ? "Definida no checkout" : frete > 0 ? formatBRL(taxa - frete) + " (cupom)" : formatBRL(taxa);

    const total = Math.max(subtotal - desconto + (taxa || 0) - frete, 0);
    $("#carrinhoTotal").textContent = formatBRL(total);
  }

  /* ---------------------------------------------------------
   * CHECKOUT
   * --------------------------------------------------------- */
  function initPagamentoOpcoes() {
    const container = $("#pagamentoOpcoes");
    container.innerHTML = CONFIG.FORMAS_PAGAMENTO.map(
      (f) => `<button type="button" class="pagamento-opcao" data-id="${f.id}">${f.nome}</button>`
    ).join("");

    container.querySelectorAll(".pagamento-opcao").forEach((btn) => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".pagamento-opcao").forEach((b) => b.classList.remove("selecionada"));
        btn.classList.add("selecionada");
        state.pagamento = btn.dataset.id;
        $("#blocoTroco").hidden = state.pagamento !== "dinheiro";
      });
    });
  }

  function abrirCheckout() {
    if (state.cart.length === 0) return;
    renderResumoCheckout();
    $("#checkoutModalOverlay").classList.add("aberto");
    fecharCarrinhoDrawer();
  }
  function fecharCheckout() {
    $("#checkoutModalOverlay").classList.remove("aberto");
  }

  function initTipoEntrega() {
    $("#btnEntrega").addEventListener("click", () => setTipoEntrega("entrega"));
    $("#btnRetirada").addEventListener("click", () => setTipoEntrega("retirada"));
  }
  function setTipoEntrega(tipo) {
    state.entrega.tipo = tipo;
    $("#btnEntrega").classList.toggle("active", tipo === "entrega");
    $("#btnRetirada").classList.toggle("active", tipo === "retirada");
    $("#blocoEndereco").style.display = tipo === "entrega" ? "block" : "none";
    renderResumoCheckout();
    atualizarValoresCarrinho();
  }

  function initBairroSelect() {
    $("#campoBairro").addEventListener("change", (e) => {
      const valor = e.target.value;
      const blocoOutro = $("#blocoOutroBairro");

      if (valor === "__outro__") {
        state.entrega.bairro = { nome: null, taxa: CONFIG.ENTREGA.taxaDistante };
        blocoOutro.hidden = false;
      } else if (valor) {
        state.entrega.bairro = { nome: valor, taxa: taxaDoBairro(valor) };
        blocoOutro.hidden = true;
      } else {
        state.entrega.bairro = null;
        blocoOutro.hidden = true;
      }
      renderResumoCheckout();
      atualizarValoresCarrinho();
    });
  }

  function renderResumoCheckout() {
    const container = $("#resumoItens");
    container.innerHTML = state.cart
      .map(
        (item) => `
      <div class="resumo-item-linha">
        <span>${item.quantidade}x ${esc(item.nome)}<br><small>${
          esc(item.itens.join(", ")) || "-"
        }</small></span>
        <span>${formatBRL(item.precoUnitario * item.quantidade)}</span>
      </div>`
      )
      .join("");

    const subtotal = calcularSubtotal();
    const { valor: desconto, linhas: linhasPromo, frete, cupom } = calcularDescontoTotal();
    const taxa = state.entrega.tipo === "retirada" ? 0 : (state.entrega.bairro ? state.entrega.bairro.taxa : 0);
    const total = Math.max(subtotal - desconto + taxa - frete, 0);

    $("#resumoSubtotal").textContent = formatBRL(subtotal);
    const linhaDescontoResumo = $("#linhaDescontoResumo");
    if (linhaDescontoResumo) {
      if (desconto > 0) {
        $("#resumoDesconto").textContent = "- " + formatBRL(desconto);
        linhaDescontoResumo.hidden = false;
      } else {
        linhaDescontoResumo.hidden = true;
      }
    }

    const linhasPromoEl = $("#resumoLinhasPromo");
    if (linhasPromoEl) {
      linhasPromoEl.innerHTML = linhasPromo.map((l) => `<div class="linha-promo-aplicada">${esc(l)}</div>`).join("");
    }

    $("#resumoTaxa").textContent = state.entrega.tipo === "retirada" ? "Retirada (sem taxa)" : frete > 0 ? formatBRL(taxa - frete) + " (cupom)" : formatBRL(taxa);
    $("#resumoTotal").textContent = formatBRL(total);
    atualizarMensagemCupom(cupom);
  }

  /* ---------------------------------------------------------
   * VALIDAÇÃO + ENVIO PARA O WHATSAPP
   * --------------------------------------------------------- */
  /* ---------------------------------------------------------
   * CUPOM (consultado e "gasto" no banco por funções do Supabase)
   * --------------------------------------------------------- */
  async function chamarRpc(nome, corpo, tempoMs) {
    const controle = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controle && tempoMs ? setTimeout(() => controle.abort(), tempoMs) : null;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nome}`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
        signal: controle ? controle.signal : undefined,
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function mostrarMensagemCupom(texto, tipo) {
    const el = $("#msgCupom");
    if (!el) return;
    el.hidden = !texto;
    el.textContent = texto || "";
    el.className = "msg-cupom " + (tipo || "aviso");
  }

  function limparCampoCupom() {
    const campo = $("#campoCupom");
    if (campo) campo.value = "";
    mostrarMensagemCupom("", "aviso");
    const remover = $("#btnRemoverCupom");
    if (remover) remover.hidden = true;
  }

  // Mostra no checkout o que está acontecendo com o cupom (aplicado, perdeu pra promoção, pedido mínimo...)
  function atualizarMensagemCupom(info) {
    const remover = $("#btnRemoverCupom");
    if (!state.cupom) {
      if (remover) remover.hidden = true;
      return;
    }
    if (remover) remover.hidden = false;
    if (!info) return;
    if (info.status === "aplicado") {
      const c = state.cupom;
      const texto = info.efeito === "brinde" ? "Cupom " + info.codigo + " aplicado: " + (c.brinde_texto || "brinde")
        : info.efeito === "frete_gratis" ? "Cupom " + info.codigo + " aplicado: frete grátis!"
        : "Cupom " + info.codigo + " aplicado: você economiza " + formatBRL(info.economia) + ".";
      mostrarMensagemCupom(texto, "ok");
    } else {
      mostrarMensagemCupom(info.motivo, "aviso");
    }
  }

  async function aplicarCupom() {
    const campo = $("#campoCupom");
    const botao = $("#btnAplicarCupom");
    const codigo = campo.value.trim();
    if (!codigo) {
      mostrarMensagemCupom("Digite o código do cupom.", "erro");
      return;
    }
    botao.disabled = true;
    botao.textContent = "Verificando…";
    const r = await chamarRpc("consultar_cupom", { p_codigo: codigo, p_telefone: $("#campoTelefone").value });
    botao.disabled = false;
    botao.textContent = "Aplicar";

    state.cupom = r && r.valido ? r.cupom : null;
    renderResumoCheckout();
    atualizarValoresCarrinho();
    if (!r) mostrarMensagemCupom("Não consegui verificar o cupom agora. Confira a internet e tente de novo.", "erro");
    else if (!r.valido) mostrarMensagemCupom(r.motivo || "Cupom inválido.", "erro");
  }

  function removerCupom() {
    state.cupom = null;
    limparCampoCupom();
    renderResumoCheckout();
    atualizarValoresCarrinho();
  }

  function initCupom() {
    const botao = $("#btnAplicarCupom");
    if (!botao) return; // página sem o campo de cupom
    botao.addEventListener("click", aplicarCupom);
    $("#btnRemoverCupom").addEventListener("click", removerCupom);
    $("#campoCupom").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault(); // Enter no cupom aplica o cupom (e não finaliza o pedido)
        aplicarCupom();
      }
    });
  }

  /* ---------------------------------------------------------
   * ACOMPANHAMENTO DO PEDIDO (o cliente vê o status que a loja marca no painel)
   * --------------------------------------------------------- */
  const CHAVE_PEDIDO = "tiburcioPedido";
  const INTERVALO_ACOMP = window.__INTERVALO_ACOMP || 8000; // (só os testes mudam isso)
  const TEMPO_REGISTRO_PEDIDO = window.__TEMPO_PEDIDO || 2500;
  const VALIDADE_ACOMP_MS = 6 * 60 * 60 * 1000;
  let timerAcomp = null;
  let statusAcomp = null;

  function lerPedidoAcompanhado() {
    try {
      const p = JSON.parse(localStorage.getItem(CHAVE_PEDIDO));
      if (p && p.id && Date.now() - p.criado < VALIDADE_ACOMP_MS) return p;
    } catch (e) { /* sem registro */ }
    return null;
  }
  function guardarPedidoAcompanhado(p) {
    try { localStorage.setItem(CHAVE_PEDIDO, JSON.stringify(p)); } catch (e) { /* tudo bem */ }
  }

  async function registrarPedido(payload) {
    const r = await chamarRpc("criar_pedido", { p_dados: payload }, TEMPO_REGISTRO_PEDIDO);
    return r && r.ok ? { id: r.id, numero: r.numero } : null;
  }

  function renderAcompanhamento(d, semConexao) {
    const p = lerPedidoAcompanhado();
    const pill = $("#pillAcompanhar");
    const corpo = $("#acompCorpo");
    if (!p || !pill || !corpo) return;
    const status = d ? d.status : statusAcomp || "novo";
    const retirada = (d ? d.tipo_entrega : p.tipo) === "retirada";
    let icone = "⏳", titulo = "Pedido enviado!", msg = "Aguardando a loja aceitar o seu pedido.", passo = 0, rotulo = "aguardando a loja";
    if (status === "aceito") {
      icone = "👩‍🍳"; titulo = "Seu pedido está em preparo!"; passo = 1; rotulo = "em preparo";
      msg = d && d.estimativa_minutos ? "Previsão: cerca de " + d.estimativa_minutos + " minutos." : "Já estamos preparando com carinho.";
    } else if (status === "saiu") {
      passo = 2;
      if (retirada) { icone = "✅"; titulo = "Seu pedido está pronto para retirada!"; msg = "Pode vir buscar. Obrigado pela preferência!"; rotulo = "pronto para retirada"; }
      else { icone = "🛵"; titulo = "Seu pedido saiu para entrega!"; msg = "Já está a caminho. Obrigado pela preferência!"; rotulo = "saiu para entrega"; }
    } else if (status === "recusado") {
      icone = "😕"; titulo = "Não conseguimos aceitar seu pedido"; rotulo = "não aceito";
      msg = "Motivo: " + ((d && d.motivo_recusa) || "fale com a gente");
    }
    const passos = ["Recebido", "Em preparo", retirada ? "Pronto" : "A caminho"];
    const lista = status === "recusado" ? "" : '<ol class="acomp-passos">' + passos.map((t, i) =>
      `<li class="${i < passo || (i === passo && passo === 2) ? "feito" : i === passo ? "atual" : ""}">${t}</li>`).join("") + "</ol>";
    corpo.innerHTML = `
      <div class="acomp-icone" aria-hidden="true">${icone}</div>
      <h4 class="acomp-titulo">${esc(titulo)}</h4>
      <p class="acomp-msg">${esc(msg)}</p>
      ${lista}
      ${status === "novo" ? '<p class="acomp-nota">Se ainda não enviou a mensagem no WhatsApp, envie para a loja ver seu pedido mais rápido.</p>' : ""}
      <a class="btn btn-ghost acomp-whats" href="https://wa.me/${esc(CONFIG.WHATSAPP_NUMBER)}" target="_blank" rel="noopener">Falar com a loja no WhatsApp</a>
      <p class="acomp-nota">Pedido #${esc(p.numero)} · esta tela atualiza sozinha${semConexao ? " (sem conexão agora, tentando de novo…)" : ""}</p>`;
    pill.textContent = "🧾 Pedido #" + p.numero + " · " + rotulo;
    pill.hidden = false;
  }

  function pararPollingAcomp() {
    if (timerAcomp) clearInterval(timerAcomp);
    timerAcomp = null;
  }
  function iniciarPollingAcomp() {
    pararPollingAcomp();
    timerAcomp = setInterval(atualizarAcompanhamento, INTERVALO_ACOMP);
  }

  async function atualizarAcompanhamento() {
    const p = lerPedidoAcompanhado();
    if (!p) {
      pararPollingAcomp();
      if ($("#pillAcompanhar")) $("#pillAcompanhar").hidden = true;
      return;
    }
    const d = await chamarRpc("acompanhar_pedido", { p_id: p.id }, 6000);
    if (d && d.ok) {
      statusAcomp = d.status;
      renderAcompanhamento(d);
      if (d.status === "saiu" || d.status === "recusado") pararPollingAcomp();
    } else if (d && d.ok === false) {
      // o pedido não existe mais no banco
      pararPollingAcomp();
      try { localStorage.removeItem(CHAVE_PEDIDO); } catch (e) { /* tudo bem */ }
      $("#pillAcompanhar").hidden = true;
      fecharAcompanhamento();
    } else {
      renderAcompanhamento(null, true);
    }
  }

  function abrirAcompanhamento() {
    if (!lerPedidoAcompanhado()) return;
    renderAcompanhamento(null);
    $("#acompanhamentoOverlay").classList.add("aberto");
    atualizarAcompanhamento();
    if (statusAcomp !== "saiu" && statusAcomp !== "recusado") iniciarPollingAcomp();
  }
  function fecharAcompanhamento() {
    const o = $("#acompanhamentoOverlay");
    if (o) o.classList.remove("aberto");
  }

  function initAcompanhamento() {
    const pill = $("#pillAcompanhar");
    if (!pill) return; // página sem a tela de acompanhamento
    pill.addEventListener("click", abrirAcompanhamento);
    $("#fecharAcompanhamento").addEventListener("click", fecharAcompanhamento);
    if (lerPedidoAcompanhado()) {
      atualizarAcompanhamento().then(() => {
        if (lerPedidoAcompanhado() && statusAcomp !== "saiu" && statusAcomp !== "recusado") iniciarPollingAcomp();
      });
    }
  }

  function initCheckoutSubmit() {
    $("#checkoutForm").addEventListener("submit", async (e) => {
      e.preventDefault();

      const nome = $("#campoNome").value.trim();
      const telefone = $("#campoTelefone").value.trim();

      if (!nome || !telefone) {
        toast("Preencha nome e telefone para continuar.");
        return;
      }
      if (!state.pagamento) {
        toast("Escolha a forma de pagamento.");
        return;
      }

      let endereco = {};
      if (state.entrega.tipo === "entrega") {
        const valorBairro = $("#campoBairro").value;

        if (!valorBairro) {
          toast("Selecione seu bairro para entrega.");
          return;
        }

        let nomeBairro, taxa;
        if (valorBairro === "__outro__") {
          nomeBairro = $("#campoOutroBairroTexto").value.trim();
          if (!nomeBairro) {
            toast("Informe o nome do seu bairro.");
            return;
          }
          taxa = CONFIG.ENTREGA.taxaDistante;
        } else {
          nomeBairro = valorBairro;
          taxa = taxaDoBairro(valorBairro);
        }

        const enderecoTexto = $("#campoEndereco").value.trim();
        const numero = $("#campoNumero").value.trim();
        if (!enderecoTexto || !numero) {
          toast("Informe endereço e número para entrega.");
          return;
        }

        endereco = {
          bairro: nomeBairro,
          rua: enderecoTexto,
          numero,
          complemento: $("#campoComplementoEndereco").value.trim(),
          referencia: $("#campoReferencia").value.trim(),
          taxa,
        };
      }

      const troco = state.pagamento === "dinheiro" ? $("#campoTroco").value.trim() : "";

      const botao = $("#btnFinalizarWhats");
      if (botao.disabled) return; // evita clique duplo (dois pedidos iguais)

      // A aba do WhatsApp é aberta já no clique, antes de qualquer espera, pra o navegador não bloquear.
      const aba = window.open("about:blank", "_blank");
      botao.disabled = true;
      try {
        // Cupom: só é "gasto" se de fato valeu no pedido (se a promoção deu mais desconto, ele não é usado)
        let cupomUsoId = null;
        const calc = calcularDescontoTotal();
        if (state.cupom && calc.cupom && calc.cupom.usar) {
          const r = await chamarRpc("usar_cupom", { p_codigo: state.cupom.codigo, p_telefone: telefone });
          if (!r || !r.valido) {
            if (aba) { try { aba.close(); } catch (x) { /* tudo bem */ } }
            if (!r) {
              toast("Não consegui validar o cupom agora. Tente de novo ou remova o cupom.");
            } else {
              state.cupom = null;
              renderResumoCheckout();
              atualizarValoresCarrinho();
              mostrarMensagemCupom(r.motivo || "Esse cupom não pode ser usado.", "erro");
              toast(r.motivo || "Esse cupom não pode ser usado.");
            }
            return;
          }
          cupomUsoId = r.uso_id || null;
        }
        await enviarPedidoWhatsApp({ nome, telefone, endereco, troco }, aba, cupomUsoId);
      } finally {
        botao.disabled = false;
      }
    });
  }

  async function enviarPedidoWhatsApp({ nome, telefone, endereco, troco }, aba, cupomUsoId) {
    const subtotal = calcularSubtotal();
    const { valor: desconto, linhas: linhasPromo, frete, cupom } = calcularDescontoTotal();
    const taxa = state.entrega.tipo === "retirada" ? 0 : endereco.taxa || 0;
    const total = Math.max(subtotal - desconto + taxa - frete, 0);
    const formaPagamento = CONFIG.FORMAS_PAGAMENTO.find((f) => f.id === state.pagamento);

    let msg = `Olá! Gostaria de fazer um pedido na ${CONFIG.BRAND.nome} 🍇\n\n`;
    msg += `*Cliente:* ${nome}\n`;
    msg += `*Telefone:* ${telefone}\n\n`;
    msg += `*Pedido:*\n`;

    state.cart.forEach((item) => {
      msg += `${item.quantidade}x ${item.nome}\n`;
      item.itens.forEach((linha) => {
        msg += `   - ${linha}\n`;
      });
      msg += `   Subtotal: ${formatBRL(item.precoUnitario * item.quantidade)}\n`;
    });

    msg += `\n*Subtotal:* ${formatBRL(subtotal)}\n`;
    if (linhasPromo.length > 0) {
      msg += `\n*Promoções aplicadas:*\n`;
      linhasPromo.forEach((l) => {
        msg += `${l}\n`;
      });
    }
    if (desconto > 0) {
      msg += `*Desconto total:* - ${formatBRL(desconto)}\n`;
    }
    if (cupom && cupom.usar) {
      msg += `*Cupom usado:* ${cupom.codigo}\n`;
    }
    msg += `*Taxa de entrega:* ${state.entrega.tipo === "retirada" ? "Retirada (sem taxa)" : frete > 0 ? formatBRL(taxa - frete) + " (cupom " + cupom.codigo + ")" : formatBRL(taxa)}\n`;
    msg += `*Total:* ${formatBRL(total)}\n\n`;
    msg += `*Forma de pagamento:* ${formaPagamento ? formaPagamento.nome : "-"}\n`;
    if (troco) msg += `*Troco para:* ${troco}\n`;

    if (state.entrega.tipo === "entrega") {
      msg += `\n*Endereço de entrega:*\n`;
      msg += `${endereco.rua}\n`;
      msg += `Nº ${endereco.numero}\n`;
      msg += `Bairro: ${endereco.bairro}\n`;
      if (endereco.complemento) msg += `Complemento: ${endereco.complemento}\n`;
      if (endereco.referencia) msg += `Referência: ${endereco.referencia}\n`;
    } else {
      msg += `\n*Pedido para retirada no local.*\n`;
    }

    const link = buildWhatsAppLink(msg);

    // O pedido também é guardado no banco (a loja vê no painel e o cliente acompanha).
    // Se o banco não responder em poucos segundos, o pedido segue só pelo WhatsApp, como sempre foi.
    const registro = await registrarPedido({
      nome,
      telefone,
      tipo_entrega: state.entrega.tipo,
      endereco: state.entrega.tipo === "entrega"
        ? { bairro: endereco.bairro, rua: endereco.rua, numero: endereco.numero, complemento: endereco.complemento || "", referencia: endereco.referencia || "" }
        : {},
      itens: state.cart.map((i) => ({ nome: i.nome, quantidade: i.quantidade, preco_unitario: i.precoUnitario, detalhes: i.itens })),
      promocoes: linhasPromo,
      subtotal,
      desconto,
      taxa,
      desconto_frete: frete,
      total,
      pagamento: formaPagamento ? formaPagamento.nome : "",
      troco: troco || "",
      cupom_codigo: cupom && cupom.usar ? cupom.codigo : "",
      cupom_uso_id: cupomUsoId || null,
    });

    const tipoPedido = state.entrega.tipo;
    state.cart = [];
    state.cupom = null;
    limparCampoCupom();
    renderCart();
    fecharCheckout();
    if (registro) {
      guardarPedidoAcompanhado({ id: registro.id, numero: registro.numero, tipo: tipoPedido, criado: Date.now() });
      statusAcomp = "novo";
      toast("Pedido #" + registro.numero + " enviado! ✅");
      abrirAcompanhamento();
    } else {
      toast("Pedido enviado para o WhatsApp! ✅");
    }

    // por último, abre o WhatsApp (a aba em branco foi aberta no clique pra o navegador não bloquear)
    if (aba && !aba.closed) {
      try { aba.location.href = link; } catch (e) { window.location.href = link; }
    } else {
      window.location.href = link;
    }
  }

  /* ---------------------------------------------------------
   * EVENTOS GERAIS DE UI
   * --------------------------------------------------------- */
  function initUiEvents() {
    $("#btnAbrirCarrinho").addEventListener("click", abrirCarrinho);
    $("#fecharCarrinho").addEventListener("click", fecharCarrinhoDrawer);
    $("#drawerOverlay").addEventListener("click", fecharCarrinhoDrawer);

    $("#fecharProdutoModal").addEventListener("click", closeProdutoModal);
    $("#produtoModalOverlay").addEventListener("click", (e) => {
      if (e.target.id === "produtoModalOverlay") closeProdutoModal();
    });
    $("#addAoCarrinho").addEventListener("click", addAoCarrinho);

    $("#btnIrCheckout").addEventListener("click", abrirCheckout);
    $("#fecharCheckout").addEventListener("click", fecharCheckout);
    $("#checkoutModalOverlay").addEventListener("click", (e) => {
      if (e.target.id === "checkoutModalOverlay") fecharCheckout();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeProdutoModal();
        fecharCheckout();
        fecharCarrinhoDrawer();
      }
    });
  }

  /* ---------------------------------------------------------
   * BOOT
   * --------------------------------------------------------- */
  function init() {
    initBrand();
    renderBairros();
    initModalQtdControls();
    initPagamentoOpcoes();
    initTipoEntrega();
    initBairroSelect();
    initCheckoutSubmit();
    initCupom();
    initAcompanhamento();
    initUiEvents();
    renderCart();
    initPromocoes();

    // Cardápio: mostra "carregando" enquanto busca no banco e depois desenha.
    // Se algo falhar, desenha mesmo assim com a cópia salva ou com o config.js.
    const carregando = '<p style="color:#6b5a70;font-size:14px;">Carregando cardápio…</p>';
    $("#destaqueGrid").innerHTML = carregando;
    $("#cardapioGrid").innerHTML = carregando;
    iniciarCatalogo()
      .catch(() => {})
      .then(renderCatalogo);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
