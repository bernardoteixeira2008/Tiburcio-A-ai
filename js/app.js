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
    cart: [],              // itens do carrinho
    modal: {
      produto: null,       // produto sendo montado no modal
      complementosSelecionados: new Set(),
      quantidade: 1,
    },
    entrega: {
      tipo: "entrega",      // "entrega" | "retirada"
      bairro: null,         // objeto { nome, taxa }
    },
    pagamento: null,        // id da forma de pagamento
  };

  /* ---------------------------------------------------------
   * HELPERS
   * --------------------------------------------------------- */
  const $ = (sel) => document.querySelector(sel);
  const $all = (sel) => Array.from(document.querySelectorAll(sel));
  const formatBRL = (v) =>
    "R$ " + v.toFixed(2).replace(".", ",");

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("mostrar");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("mostrar"), 2600);
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
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
    const numero = CONFIG.WHATSAPP_NUMBER;
    return `https://wa.me/${numero}?text=${encodeURIComponent(text)}`;
  }

  /* ---------------------------------------------------------
   * RENDER: PRODUTOS EM DESTAQUE
   * --------------------------------------------------------- */
  function renderDestaques() {
    const grid = $("#destaqueGrid");
    const destaques = CONFIG.PRODUTOS.filter((p) => p.destaque);
    grid.innerHTML = destaques.map(produtoCardHTML).join("");
    grid.querySelectorAll("[data-abrir-produto]").forEach((btn) => {
      btn.addEventListener("click", () => openProdutoModal(btn.dataset.abrirProduto));
    });
  }

  /* ---------------------------------------------------------
   * RENDER: CARDÁPIO COMPLETO
   * --------------------------------------------------------- */
  function renderCardapio() {
    const grid = $("#cardapioGrid");
    grid.innerHTML = CONFIG.PRODUTOS.map(produtoCardHTML).join("");
    grid.querySelectorAll("[data-abrir-produto]").forEach((btn) => {
      btn.addEventListener("click", () => openProdutoModal(btn.dataset.abrirProduto));
    });
  }

  function produtoCardHTML(p) {
    return `
      <article class="produto-card">
        ${p.destaque ? '<span class="badge">Mais pedido</span>' : ""}
        <div class="produto-thumb" aria-hidden="true"></div>
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
    lista.innerHTML = CONFIG.BAIRROS_ATENDIDOS.map(
      (b) => `<li>${b.nome} <span class="taxa">${formatBRL(b.taxa)}</span></li>`
    ).join("");

    const select = $("#campoBairro");
    CONFIG.BAIRROS_ATENDIDOS.forEach((b) => {
      const opt = document.createElement("option");
      opt.value = b.nome;
      opt.textContent = `${b.nome} — taxa ${formatBRL(b.taxa)}`;
      select.appendChild(opt);
    });
  }

  /* ---------------------------------------------------------
   * MODAL DE PRODUTO (montar açaí)
   * --------------------------------------------------------- */
  function openProdutoModal(produtoId) {
    const produto = CONFIG.PRODUTOS.find((p) => p.id === produtoId);
    if (!produto) return;

    state.modal.produto = produto;
    state.modal.complementosSelecionados = new Set();
    state.modal.quantidade = 1;

    $("#produtoModalTitulo").textContent = produto.nome;
    $("#produtoModalDesc").textContent = produto.descricao;
    $("#qtdGratisTexto").textContent = produto.complementosGratis;
    $("#qtdValor").textContent = "1";

    const lista = $("#complementosLista");
    lista.innerHTML = CONFIG.COMPLEMENTOS.map(
      (c) => `
      <div class="complemento-item" data-id="${c.id}" tabindex="0" role="checkbox" aria-checked="false">
        <span>${c.nome}</span>
        <span class="preco-extra" data-preco-label>grátis*</span>
      </div>`
    ).join("");

    lista.querySelectorAll(".complemento-item").forEach((el) => {
      el.addEventListener("click", () => toggleComplemento(el.dataset.id));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleComplemento(el.dataset.id);
        }
      });
    });

    updateModalTotal();
    $("#produtoModalOverlay").classList.add("aberto");
  }

  function closeProdutoModal() {
    $("#produtoModalOverlay").classList.remove("aberto");
  }

  function toggleComplemento(id) {
    const sel = state.modal.complementosSelecionados;
    if (sel.has(id)) sel.delete(id);
    else sel.add(id);
    refreshComplementosVisual();
    updateModalTotal();
  }

  // Recalcula quais complementos contam como grátis (os primeiros N marcados)
  // e atualiza o visual/preço de cada item.
  function refreshComplementosVisual() {
    const produto = state.modal.produto;
    const limite = produto.complementosGratis;
    const selecionadosOrdem = Array.from(state.modal.complementosSelecionados);

    $all(".complemento-item").forEach((el) => {
      const id = el.dataset.id;
      const comp = CONFIG.COMPLEMENTOS.find((c) => c.id === id);
      const marcado = state.modal.complementosSelecionados.has(id);
      el.classList.toggle("selecionado", marcado);
      el.setAttribute("aria-checked", marcado ? "true" : "false");

      const posicao = selecionadosOrdem.indexOf(id);
      const label = el.querySelector("[data-preco-label]");
      if (!marcado) {
        label.textContent = comp.preco > 0 ? `+ ${formatBRL(comp.preco)}` : "grátis";
      } else if (posicao < limite) {
        label.textContent = "incluso ✓";
      } else {
        label.textContent = `+ ${formatBRL(comp.preco)}`;
      }
    });
  }

  function calcularPrecoComplementosExtra() {
    const produto = state.modal.produto;
    const limite = produto.complementosGratis;
    const selecionadosOrdem = Array.from(state.modal.complementosSelecionados);
    let extra = 0;
    selecionadosOrdem.forEach((id, idx) => {
      if (idx >= limite) {
        const comp = CONFIG.COMPLEMENTOS.find((c) => c.id === id);
        extra += comp.preco;
      }
    });
    return extra;
  }

  function updateModalTotal() {
    const produto = state.modal.produto;
    const extra = calcularPrecoComplementosExtra();
    const total = (produto.preco + extra) * state.modal.quantidade;
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
    const limite = produto.complementosGratis;
    const selecionadosOrdem = Array.from(state.modal.complementosSelecionados);

    const complementos = selecionadosOrdem.map((id, idx) => {
      const comp = CONFIG.COMPLEMENTOS.find((c) => c.id === id);
      return {
        id: comp.id,
        nome: comp.nome,
        preco: idx < limite ? 0 : comp.preco,
      };
    });

    const precoUnitario =
      produto.preco + complementos.reduce((s, c) => s + c.preco, 0);

    state.cart.push({
      uid: uid(),
      produtoId: produto.id,
      nome: produto.nome,
      precoBase: produto.preco,
      complementos,
      quantidade: state.modal.quantidade,
      precoUnitario,
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
              item.complementos.length
                ? item.complementos.map((c) => c.nome).join(", ")
                : "Sem complementos"
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

    // listeners dos itens
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
    return state.entrega.bairro ? state.entrega.bairro.taxa : null; // null = ainda não definida
  }

  function atualizarValoresCarrinho() {
    const subtotal = calcularSubtotal();
    $("#carrinhoSubtotal").textContent = formatBRL(subtotal);

    const taxa = calcularTaxaEntrega();
    $("#carrinhoTaxa").textContent =
      taxa === null ? "Definida no checkout" : formatBRL(taxa);

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
      const nome = e.target.value;
      const bairro = CONFIG.BAIRROS_ATENDIDOS.find((b) => b.nome === nome) || null;
      state.entrega.bairro = bairro;
      $("#foraAreaAlerta").classList.toggle("mostrar", !!nome && !bairro);
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
          item.complementos.map((c) => c.nome).join(", ") || "Sem complementos"
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
        const bairroNome = $("#campoBairro").value;
        const bairro = CONFIG.BAIRROS_ATENDIDOS.find((b) => b.nome === bairroNome);

        if (!bairroNome) {
          toast("Selecione o bairro para entrega.");
          return;
        }
        if (!bairro) {
          $("#foraAreaAlerta").classList.add("mostrar");
          toast("Esse bairro está fora da nossa área de entrega (Região 5).");
          return;
        }
        const enderecoTexto = $("#campoEndereco").value.trim();
        const numero = $("#campoNumero").value.trim();
        if (!enderecoTexto || !numero) {
          toast("Informe endereço e número para entrega.");
          return;
        }

        endereco = {
          bairro: bairro.nome,
          rua: enderecoTexto,
          numero,
          complemento: $("#campoComplementoEndereco").value.trim(),
          referencia: $("#campoReferencia").value.trim(),
          taxa: bairro.taxa,
        };
      }

      const troco =
        state.pagamento === "dinheiro" ? $("#campoTroco").value.trim() : "";

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
      if (item.complementos.length) {
        item.complementos.forEach((c) => {
          msg += `   - ${c.nome}${c.preco > 0 ? ` (+${formatBRL(c.preco)})` : ""}\n`;
        });
      }
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

    // limpa o carrinho após o envio
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
