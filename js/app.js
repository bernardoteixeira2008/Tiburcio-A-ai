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
    nav.innerHTML = categorias
      .map(
        (c) =>
          `<button class="aba-cat${c === state.categoriaAtiva ? " active" : ""}" data-cat="${c}">${c}</button>`
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
    const thumb = p.imagem
      ? `<div class="produto-thumb" style="background-image:url('assets/${p.imagem}')"></div>`
      : `<div class="produto-thumb" aria-hidden="true"></div>`;
    return `
      <article class="produto-card">
        ${p.destaque ? '<span class="badge">Mais pedido</span>' : ""}
        ${thumb}
        <h3>${p.nome}</h3>
        <p>${p.descricao}</p>
        <div class="produto-footer">
          <span class="produto-preco">${formatBRL(p.preco)}</span>
          <button class="btn btn-primary" data-abrir-produto="${p.id}">Montar</button>
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
  function renderComplementosMontavel(produto) {
    $("#complementoInfoBox").innerHTML =
      "Escolha à vontade — todos os itens abaixo já estão inclusos no preço do seu açaí.";

    let html = "";
    CONFIG.GRUPOS_COMPLEMENTOS_ACAI.forEach((grupo) => {
      html += `<h4 class="grupo-titulo">${grupo.grupo}</h4>`;
      html += `<div class="complementos-grid">`;
      grupo.itens.forEach((item) => {
        html += `
          <div class="complemento-item" data-id="${item.id}" tabindex="0" role="checkbox" aria-checked="false">
            <span>${item.nome}</span>
            <span class="preco-extra">incluso</span>
          </div>`;
      });
      html += `</div>`;
    });

    // Brinde promocional
    if (CONFIG.PROMOCAO_BRINDE_ACAI && CONFIG.PROMOCAO_BRINDE_ACAI.ativa) {
      html += `<h4 class="grupo-titulo brinde-titulo">🎁 ${CONFIG.PROMOCAO_BRINDE_ACAI.titulo}</h4>`;
      html += `<div class="sabores-grid" id="brindeGrid">`;
      CONFIG.PROMOCAO_BRINDE_ACAI.sabores.forEach((sabor) => {
        html += `<button type="button" class="sabor-item" data-sabor="${sabor}">${sabor}</button>`;
      });
      html += `</div>`;
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
  }

  function toggleComplemento(id) {
    const sel = state.modal.complementosSelecionados;
    if (sel.has(id)) sel.delete(id);
    else sel.add(id);

    const el = document.querySelector(`.complemento-item[data-id="${id}"]`);
    if (el) {
      const marcado = sel.has(id);
      el.classList.toggle("selecionado", marcado);
      el.setAttribute("aria-checked", marcado ? "true" : "false");
    }
    updateModalTotal();
  }

  // ---------- Tipo "sabor-unico" (Sorvete / Sander / Picolé) ----------
  function renderSaboresUnicos(produto) {
    $("#complementoInfoBox").innerHTML = `Escolha o sabor do seu ${produto.nome.toLowerCase()}.`;

    let html = `<div class="sabores-grid">`;
    produto.sabores.forEach((sabor) => {
      html += `<button type="button" class="sabor-item" data-sabor="${sabor}">${sabor}</button>`;
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
    const total = produto.preco * state.modal.quantidade;
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
        for (const grupo of CONFIG.GRUPOS_COMPLEMENTOS_ACAI) {
          const item = grupo.itens.find((i) => i.id === id);
          if (item) return item.nome;
        }
        return id;
      });
      descricaoItens = nomes;
    } else {
      descricaoItens = [`Sabor: ${state.modal.saborSelecionado}`];
    }

    if (state.modal.brindeSelecionado) {
      descricaoItens.push(`🎁 Brinde: bola de sorvete (${state.modal.brindeSelecionado})`);
    }

    state.cart.push({
      uid: uid(),
      produtoId: produto.id,
      nome: produto.nome,
      precoUnitario: produto.preco,
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
    const vazio = $("#carrinhoVazioMsg");

    if (state.cart.length === 0) {
      container.innerHTML = "";
      container.appendChild(vazio);
      $("#btnIrCheckout").disabled = true;
    } else {
      container.innerHTML = state.cart
        .map(
          (item) => `
        <div class="item-carrinho" data-uid="${item.uid}">
          <div class="item-thumb" aria-hidden="true"></div>
          <div class="item-info">
            <h4>${item.nome}</h4>
            <div class="item-complementos">${
              item.itens.length ? item.itens.join(", ") : "Sem complementos"
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

    const taxa = calcularTaxaEntrega();
    $("#carrinhoTaxa").textContent = taxa === null ? "Definida no checkout" : formatBRL(taxa);

    const total = subtotal + (taxa || 0);
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
        <span>${item.quantidade}x ${item.nome}<br><small>${
          item.itens.join(", ") || "-"
        }</small></span>
        <span>${formatBRL(item.precoUnitario * item.quantidade)}</span>
      </div>`
      )
      .join("");

    const subtotal = calcularSubtotal();
    const taxa = state.entrega.tipo === "retirada" ? 0 : (state.entrega.bairro ? state.entrega.bairro.taxa : 0);
    const total = subtotal + taxa;

    $("#resumoSubtotal").textContent = formatBRL(subtotal);
    $("#resumoTaxa").textContent = state.entrega.tipo === "retirada" ? "Retirada (sem taxa)" : formatBRL(taxa);
    $("#resumoTotal").textContent = formatBRL(total);
  }

  /* ---------------------------------------------------------
   * VALIDAÇÃO + ENVIO PARA O WHATSAPP
   * --------------------------------------------------------- */
  function initCheckoutSubmit() {
    $("#checkoutForm").addEventListener("submit", (e) => {
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
      enviarPedidoWhatsApp({ nome, telefone, endereco, troco });
    });
  }

  function enviarPedidoWhatsApp({ nome, telefone, endereco, troco }) {
    const subtotal = calcularSubtotal();
    const taxa = state.entrega.tipo === "retirada" ? 0 : endereco.taxa || 0;
    const total = subtotal + taxa;
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
    msg += `*Taxa de entrega:* ${state.entrega.tipo === "retirada" ? "Retirada (sem taxa)" : formatBRL(taxa)}\n`;
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
    window.open(link, "_blank");

    state.cart = [];
    renderCart();
    fecharCheckout();
    toast("Pedido enviado para o WhatsApp! ✅");
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
    renderDestaques();
    renderAbasCategoria();
    renderCardapio();
    renderBairros();
    initModalQtdControls();
    initPagamentoOpcoes();
    initTipoEntrega();
    initBairroSelect();
    initCheckoutSubmit();
    initUiEvents();
    renderCart();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
