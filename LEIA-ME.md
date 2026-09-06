# Tiburcio Açaí — Site de pedidos

Site completo, funcional e responsivo para receber pedidos e finalizar via WhatsApp.
Agora com cardápio completo: **Açaí, Sorvetes, Sander e Picolés**, com abas para navegar entre categorias.

## Como abrir

Abra `index.html` no navegador, ou acesse pelo link do GitHub Pages já publicado.

## ⚠️ O PRIMEIRO PASSO: colocar o número de WhatsApp

Abra `js/config.js` e troque a linha:

```js
WHATSAPP_NUMBER: "WHATSAPP_NUMBER",
```

pelo número real, **somente dígitos**, com código do país + DDD:

```js
WHATSAPP_NUMBER: "5527996438936",
```

## Como o cardápio está organizado agora

Existem dois "tipos" de produto no `js/config.js`:

### 1. Tipo `"montavel"` — usado no Açaí

O cliente escolhe livremente itens de 3 grupos (todos inclusos no preço, sem cobrança extra):
- **Completos** (leite em pó, granola, leite condensado, paçoca, flocos de arroz, sucrilhos, ovomaltine, neston, gotas de chocolate, amendoim)
- **Coberturas** (morango, chocolate, leite condensado, maracujá, limão, caramelo, uva)
- **Frutas** (uva, morango, kiwi, manga, abacaxi, banana)

Esses grupos ficam em `GRUPOS_COMPLEMENTOS_ACAI`. Pra adicionar/remover um item, edite a lista do grupo certo:

```js
{ id: "leite-po", nome: "Leite em pó" },
```

Se um dia algum item precisar ser cobrado à parte, adicione `preco: 2.00` dentro do objeto do item (o padrão hoje é grátis para todos).

Também existe a promoção do brinde (bola de sorvete grátis ao comprar um açaí), configurada em `PROMOCAO_BRINDE_ACAI`. Para desativar a promoção, troque `ativa: true` para `ativa: false`.

### 2. Tipo `"sabor-unico"` — usado em Sorvete, Sander e Picolé

O produto já é um item fechado (pote de sorvete, copo de sander, picolé) e o cliente só escolhe **um sabor** da lista. Exemplo (Sander):

```js
{
  id: "sander",
  categoria: "Sander",
  tipo: "sabor-unico",
  nome: "Sander",
  descricao: "Copo de sander, escolha o sabor.",
  preco: 8.0,
  maxSabores: 1,
  sabores: ["Morango", "Açaí com Ninho", "Brigadeiro", "Coco"],
  destaque: false,
},
```

Pra adicionar um sabor novo, é só acrescentar o nome na lista `sabores`. Pra criar uma categoria nova (ex: "Milkshake"), copie um bloco desses, mude `id`, `categoria`, `nome`, `preco` e `sabores`, e adicione o nome da categoria em `CATEGORIAS` (lá no topo do arquivo) pra ela ganhar sua própria aba no cardápio.

## O que mais dá pra editar em `js/config.js`

- **BRAND** — nome, slogan, cidade, horário, Instagram.
- **ENTREGA**, **BAIRROS_REGIAO5**, **BAIRROS_PROXIMOS** e **BAIRROS_DISTANTES** — a entrega tem 3 faixas de taxa:
  - **Região 5** (lista em `BAIRROS_REGIAO5`): entrega **grátis**
  - **Regiões próximas** — área de Itaparica/Jockey (lista em `BAIRROS_PROXIMOS`): taxa fixa de **R$ 4,00**
  - **Demais regiões** (lista em `BAIRROS_DISTANTES`): taxa fixa de **R$ 8,00**
  - Se o cliente não achar o bairro dele na lista, pode digitar manualmente — nesse caso é cobrada a taxa de "demais regiões" (R$ 8,00)
  - Pra mudar os valores das taxas, edite `ENTREGA.taxaProxima` e `ENTREGA.taxaDistante`. Pra mover um bairro de faixa, basta cortar o nome de uma lista e colar em outra.
- **CATEGORIAS** — controla as abas do cardápio (Açaí | Sorvetes | Sander | Picolés).
- **FORMAS_PAGAMENTO** — opções mostradas no checkout.

## Como colocar fotos de verdade nos produtos e sabores

Cada produto e cada sabor já estão preparados para usar uma foto — falta só você subir as imagens. O site procura as fotos dentro de uma pasta chamada `assets/`, com estes nomes exatos:

### Foto do banner principal (topo do site)

| O que é | Nome do arquivo esperado |
|---|---|
| Foto de destaque do banner | `hero-acai.jpg` |

### Fotos dos produtos (aparecem nos cards do cardápio)

| Produto | Nome do arquivo esperado |
|---|---|
| Açaí 300ml | `acai-300.jpg` |
| Açaí 500ml | `acai-500.jpg` |
| Açaí 700ml | `acai-700.jpg` |
| Açaí 1000ml | `acai-1000.jpg` |
| Sorvete 1 Litro | `sorvete-1l.jpg` |
| Sander | `sander.jpg` |
| Picolé Premium | `picole-premium.jpg` |

### Fotos de cada sabor (aparecem dentro do "Montar")

| Sabor | Nome do arquivo esperado |
|---|---|
| Sorvete — Ninho Trufado | `sabor-ninho-trufado.jpg` |
| Sorvete — Napolitano | `sabor-napolitano.jpg` |
| Sorvete — Nutella | `sabor-nutella.jpg` |
| Sorvete — Ninho com Pistache | `sabor-ninho-pistache.jpg` |
| Sorvete — Açaí | `sabor-acai.jpg` |
| Sorvete — Kinderovo | `sabor-kinderovo.jpg` |
| Sorvete — Frutas Vermelhas | `sabor-frutas-vermelhas.jpg` |
| Sander — Morango | `sabor-sander-morango.jpg` |
| Sander — Açaí com Ninho | `sabor-sander-acai-ninho.jpg` |
| Sander — Brigadeiro | `sabor-sander-brigadeiro.jpg` |
| Sander — Coco | `sabor-sander-coco.jpg` |
| Picolé — Brigadeiro | `sabor-picole-brigadeiro.jpg` |
| Picolé — Esquimó | `sabor-picole-esquimo.jpg` |
| Picolé — Tentação | `sabor-picole-tentacao.jpg` |
| Picolé — Pé de Moleque | `sabor-picole-pe-de-moleque.jpg` |

### Passo a passo

1. No repositório do GitHub, clique em **"Add file" → "Create new file"**
2. No campo do nome, digite `assets/placeholder.txt` (isso cria a pasta `assets` automaticamente) e clique em "Commit changes" — só esse primeiro arquivo precisa desse truque, os próximos já vão direto pra pasta
3. Entre na pasta **`assets`** que acabou de aparecer
4. Clique em **"Add file" → "Upload files"**
5. Arraste as fotos, **com o nome exatamente igual ao das tabelas acima** (renomeie a foto no seu computador antes de subir)
6. Clique em **"Commit changes"**

Você não precisa subir todas de uma vez — pode ir subindo aos poucos. Se uma foto não for encontrada (nome errado ou ainda não subiu), o quadrado ou bolinha colorida continua aparecendo no lugar dela — não quebra o site.

Se quiser usar outro nome de arquivo, é só trocar o valor do campo `imagem` do produto ou do sabor correspondente no `js/config.js`.



1. Cliente escolhe uma aba (Açaí, Sorvetes, Sander ou Picolés) e clica em "Montar".
2. **Se for Açaí**: escolhe os complementos que quiser (todos inclusos) e, se a promoção estiver ativa, escolhe o sabor da bolinha de sorvete grátis.
3. **Se for Sorvete/Sander/Picolé**: escolhe o sabor.
4. Adiciona ao carrinho, pode repetir para outros produtos.
5. No carrinho, segue para o checkout: **Entrega** ou **Retirada**.
6. Se for entrega, escolhe o bairro numa lista já organizada por região: **Região 5** (grátis), **regiões próximas** — Itaparica/Jockey (R$ 4,00), ou **demais regiões** (R$ 8,00). Se o bairro não estiver em nenhuma lista, o cliente digita o nome e paga a taxa de R$ 8,00.
7. Escolhe a forma de pagamento (se dinheiro, pergunta o troco).
8. Clica em **"Finalizar pedido pelo WhatsApp"** → mensagem organizada é montada e o WhatsApp abre pronto para enviar.

## Estrutura de arquivos

```
tiburcio-acai/
├── index.html        → estrutura da página (inclui as abas do cardápio)
├── css/style.css      → toda a identidade visual
├── js/config.js       → ÚNICO arquivo que você precisa editar no dia a dia
└── js/app.js          → lógica do carrinho/checkout/WhatsApp (não precisa mexer)
```

## Como atualizar no GitHub

Sempre que eu te mandar um arquivo novo (config.js, app.js, index.html ou style.css):

1. No repositório, entre na pasta certa (`js` ou `css`, ou a raiz para `index.html`)
2. Clique no arquivo
3. Clique no ícone de lápis (editar)
4. Selecione tudo (Ctrl+A) e apague
5. Cole o conteúdo novo
6. Role até o fim e clique em **"Commit changes"**

Dica: antes de editar, veja se o navegador não traduziu a página automaticamente (isso pode corromper o código) — se estiver traduzida, clique com o botão direito e escolha "Mostrar original" antes de editar.
