# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Contexto

Sistema de apresentações HTML executivas com separação dados/templates. Conteúdo em YAML renderizado para HTML com design system grayscale editorial. Dimensões fixas 1280×720px (16:9).

## Comandos

```bash
npm run build    # Gera index.html a partir de presentation.yaml
node build.js    # Alternativa direta
```

**Dependência:** `js-yaml` (instalar via `npm install` se necessário)

## Arquitetura

```
presentation.yaml  ← CONTEÚDO (editar slides aqui)
config.yaml        ← Metadados e estrutura de navegação
build.js           ← Renderizadores inline por tipo
template.html      ← HTML base com placeholder
index.html         ← OUTPUT gerado (não editar)
styles/
├── variables.css  ← Design tokens (cores, tipografia, spacing)
├── themes.css     ← Overrides por tema (wireframe/einstein/hdl)
├── base.css       ← Estilos globais e slide structure
├── layouts.css    ← Grid systems e containers
├── components.css ← Componentes reutilizáveis
└── reset.css      ← CSS reset
```

**Fluxo:** YAML → build.js (renderizadores) → HTML final

## Tipos de Slide

| Tipo | Campos obrigatórios | Campos opcionais |
|:-----|:--------------------|:-----------------|
| `cover` | title | subtitle, date |
| `toc` | title, sections[] | — |
| `section` | title | number, subtitle, nav |
| `text` | title, content | nav |
| `text-2col` | title, columns[] | nav |
| `cards-3` | title, cards[] | nav |
| `metrics-2x2` | title, metrics[] | nav |
| `timeline` | title, phases[] | nav |
| `table` | title, headers[], rows[][] | nav |
| `quote` | quote, author | role, nav |
| `closing` | title | items[], contact |

### Timeline Enhanced

Quando `phases[]` inclui campos extras (`progress`, `deliverables`, `status`), renderiza automaticamente o layout "dramatic" com barra de progresso:

```yaml
phases:
  - date: "Jan-Mar"
    title: "Discovery"
    content: "Descrição"
    active: true
    progress: 65
    status: "em andamento"
    deliverables:
      - "Item 1"
      - "Item 2"
```

## Markdown nos Campos

Suporte básico em campos de texto: `**bold**`, `*italic*`, `[text](url)`

## Navegação

O campo `nav` define breadcrumbs usando paths hierárquicos em `config.yaml`:

```yaml
# config.yaml
nav:
  contexto:
    label: "Contexto"
    slide: 3
    children:
      problema:
        label: "Problema"
        slide: 4

# presentation.yaml
- type: text
  nav: "contexto/problema"  # Gera: 🏠 › Contexto › Problema
```

## Temas

Definido em `config.yaml` sob `project.theme`:

| Tema | Accent | Descrição |
|:-----|:-------|:----------|
| `wireframe` | #737373 | Escala de cinza neutra (default) |
| `einstein` | #3AD6CA | Cores institucionais (azul #004F92, turquesa) |
| `hdl` | #A280E1 | Roxo Health Design Lab (gradientes suaves) |

## Adicionar Novo Tipo de Slide

1. Criar função `renderNovo(slide)` em `build.js`
2. Adicionar ao objeto `renderers` em `renderSlide()` (linha ~474)
3. Se necessário, adicionar estilos em `styles/components.css`

## Área Útil do Slide

Os slides têm header (breadcrumb + logo) e footer (nome projeto + paginação) fixos. A classe `.slide-content` ocupa a área útil entre eles. Considerar ao criar layouts:
- Padding: 80px (variável `--slide-padding`)
- Header/footer height: ~40px cada
- Área útil vertical: ~560px

## Orientações de Uso

Este é um **modelo de template** — conteúdo sintético deve ocupar toda a área útil para estressar o layout. Ao criar/editar slides:

1. **Usar skill frontend-design:** Sempre invocar antes de editar slides HTML/CSS
2. **Design system:** Manter escala de cinza e design minimalista existente
3. **Conteúdo extenso:** Criar textos verbosos para testar limites do layout
4. **CSS global:** Preferir editar componentes globais em `styles/` quando possível
5. **Live preview:** Não precisa rebuild, mudanças visíveis em tempo real

## Diretrizes CSS

### Antes de criar novo seletor

Buscar se já existe definição similar em `components.css`:
```bash
rg "\.nome-classe" styles/
```

Seletores duplicados causam conflitos de especificidade e comportamento imprevisível.

### Usar variáveis do design system

**Sempre usar variáveis** de `variables.css` — nunca valores hardcoded:

| Tipo | Correto | Incorreto |
|:-----|:--------|:----------|
| Espaçamento | `var(--space-4)` | `16px` |
| Tipografia | `var(--font-size-tiny)` | `12px` |
| Cores | `var(--color-gray-500)` | `#6699C0` |
| Gaps | `var(--gap-md)` | `24px` |

**Escala de espaçamento disponível:**
- `--space-1` a `--space-10`: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px, 128px
- `--gap-xs/sm/md/lg/xl`: aliases semânticos

**Tipografia:**
- `--font-size-hero`: 80px
- `--font-size-h1/h2/h3/h4`: 60px, 40px, 30px, 20px
- `--font-size-body/small/tiny`: 20px, 14px, 12px

### Custom properties em @media

Valores inválidos para custom properties em contextos especiais:

```css
/* INCORRETO */
@media print {
  --shadow-lg: none;  /* "none" não é válido */
}

/* CORRETO */
@media print {
  --shadow-lg: 0 0 0 transparent;
}
```

### Organização de components.css

O arquivo segue estrutura por complexidade:
1. Componentes básicos (breadcrumb, tag, card, badge)
2. Listas e métricas
3. Timeline e process
4. Componentes sofisticados (accent-line, stat-block, feature-card)
5. Slides específicos (cover, toc, section)

Ao adicionar novo componente, posicionar na seção apropriada.

### Timeline Dramatic: Alinhamento da Linha Conectora

A linha conectora horizontal (`.timeline-dramatic::before`) usa `position: absolute` com valor `top` fixo. **Ao alterar margins do número ou marker, recalcular o `top`:**

```
top = padding-top(container) + altura(número) + margin-bottom(número) + altura(marker)/2
```

Valores atuais:
- `padding-top`: var(--space-4) = 16px
- `número font-size`: 48px (line-height: 1)
- `margin-bottom número`: var(--space-4) = 16px
- `marker height`: 16px → centro = 8px
- **Total: 88px**

Ao alterar qualquer um desses valores, atualizar `top` em `.timeline-dramatic::before`.

### Conteúdo YAML vs CSS

- **CSS**: Live preview automático no navegador
- **YAML**: Requer `node build.js` para gerar novo HTML

Sempre executar build após editar `presentation.yaml` ou `config.yaml`.
- Este ppt é um template, o conteúdo deve ser um meta conteúdo, ou seja, um template cujo o conteúdo apresenta o próprio template, considere isso ao popular os layuts com conteúdo.