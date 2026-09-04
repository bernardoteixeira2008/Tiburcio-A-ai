# Tiburcio Açaí — Site de pedidos

Site completo, funcional e responsivo para receber pedidos e finalizar via WhatsApp.

## Como abrir

Basta abrir o arquivo `index.html` no navegador (duplo clique) ou hospedar a pasta inteira em qualquer serviço de hospedagem estática (Netlify, Vercel, GitHub Pages, cPanel, etc). Não precisa de instalação, build ou servidor — é HTML/CSS/JS puro.

## ⚠️ O PRIMEIRO PASSO: colocar o número de WhatsApp

Abra `js/config.js` e troque a linha:

```js
WHATSAPP_NUMBER: "WHATSAPP_NUMBER",
```

pelo número real, **somente dígitos**, com código do país + DDD:

```js
WHATSAPP_NUMBER: "5527996438936",
```

Sem esse ajuste, o botão de WhatsApp e o checkout não vão funcionar corretamente.

## O que mais dá pra editar em `js/config.js`

Tudo isso está num único arquivo, comentado em português:

- **BRAND** — nome, slogan, cidade, horário de funcionamento, Instagram.
- **BAIRROS_ATENDIDOS** — lista de bairros da Região 5 com a taxa de entrega de cada um. Adicione, remova ou mude taxas livremente.
- **PRODUTOS** — os tamanhos de açaí (nome, descrição, preço, quantos complementos são grátis, se aparece em destaque na home).
- **COMPLEMENTOS** — cada complemento e seu preço (use `0` para deixar sempre grátis).
- **FORMAS_PAGAMENTO** — as opções mostradas no checkout.

Depois de editar e salvar `js/config.js`, é só atualizar a página — nada mais precisa ser tocado no resto do código.

## Como funciona o pedido

1. Cliente escolhe um tamanho de açaí e clica em "Montar".
2. Escolhe os complementos (os primeiros N marcados, definidos em `complementosGratis` de cada produto, são grátis; os demais somam o preço configurado).
3. Adiciona ao carrinho, pode repetir para outros tamanhos.
4. No carrinho, segue para o checkout: escolhe **Entrega** ou **Retirada**.
5. Se for entrega, escolhe o bairro (só aparecem bairros da Região 5) — se tentar prosseguir sem um bairro válido, o site avisa e não deixa continuar.
6. Escolhe a forma de pagamento (se for dinheiro, pergunta o troco).
7. Ao clicar em **"Finalizar pedido pelo WhatsApp"**, o site monta a mensagem completa (itens, complementos, subtotal, taxa, total, endereço) e abre o WhatsApp com tudo preenchido.

## Estrutura de arquivos

```
tiburcio-acai/
├── index.html        → estrutura da página
├── css/style.css      → toda a identidade visual (cores, tipografia, layout)
├── js/config.js       → ÚNICO arquivo que você precisa editar no dia a dia
└── js/app.js          → lógica do carrinho/checkout/WhatsApp (não precisa mexer)
```

## Identidade visual

As cores foram extraídas da logo enviada: roxo profundo de fundo, degradê rosa/roxo vibrante do "Açaí", detalhes dourados do anel e creme do copo. Tipografia: Fredoka (títulos, arredondada e jovem) + Inter (textos).
