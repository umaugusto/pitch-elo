/**
 * Build Script - Template YAML + HTML v2.0
 * Processa YAML para gerar apresentação HTML
 */

const fs = require('fs');
const path = require('path');

// Tenta carregar js-yaml, com fallback para parser simples
let yaml;
try {
  yaml = require('js-yaml');
} catch (e) {
  console.log('⚠️  js-yaml não encontrado. Instale com: npm install js-yaml');
  process.exit(1);
}

// Configuração
const CONFIG_FILE = 'config.yaml';
const PRESENTATION_FILE = 'presentation.yaml';
const TEMPLATE_FILE = 'template.html';
const OUTPUT_FILE = 'index.html';
const TEMPLATES_DIR = 'templates';
const PLACEHOLDER = '<!-- SLIDES_PLACEHOLDER -->';

/**
 * Processa Markdown básico para HTML
 */
function processMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')  // **bold**
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')              // *italic*
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')  // [text](url)
    .replace(/\n\n/g, '</p><p>')                         // parágrafos
    .replace(/\n/g, '<br>');                             // quebras de linha
}

/**
 * Carrega arquivo YAML
 */
function loadYaml(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return yaml.load(content);
}

/**
 * Carrega template HTML
 */
function loadTemplate(type) {
  const templatePath = path.join(TEMPLATES_DIR, `${type}.html`);
  if (!fs.existsSync(templatePath)) {
    console.warn(`⚠️  Template não encontrado: ${type}.html`);
    return null;
  }
  return fs.readFileSync(templatePath, 'utf8');
}

/**
 * Gera breadcrumb HTML
 */
function generateBreadcrumb(navPath, navStructure) {
  if (!navPath) return '';

  const parts = navPath.split('/');
  const links = [];
  links.push('<a href="#slide-2" class="breadcrumb-home" title="Sumário"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></a>');

  let current = navStructure;

  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    if (current[key]) {
      const item = current[key];
      const isLast = i === parts.length - 1;

      if (isLast) {
        links.push(`<span class="breadcrumb-current">${item.label}</span>`);
      } else {
        links.push(`<a href="#slide-${item.slide}">${item.label}</a>`);
      }
      current = item.children || {};
    }
  }

  return `<nav class="breadcrumb">${links.join('<span class="breadcrumb-sep">/</span>')}</nav>`;
}

/**
 * Gera links de navegação
 */
function generateNavLinks(navStructure) {
  const entries = Object.entries(navStructure);
  if (entries.length === 0) return '';

  const links = entries
    .slice(0, 5)
    .map(([key, item]) => `<a href="#slide-${item.slide}">${item.label}</a>`)
    .join('');

  return `<nav class="nav-links">${links}</nav>`;
}

/**
 * Gera header do slide
 */
function generateHeader(slide, config, navLinksHtml) {
  const breadcrumb = generateBreadcrumb(slide.nav, config.nav);
  const logoHtml = config.project.logo 
    ? `<img src="${config.project.logo}" alt="Logo" class="client-logo-img">`
    : '';

  return `
  <div class="slide-header">
    <div class="slide-header-left">
      ${breadcrumb || `<span class="project-name">${config.project.name}</span>`}
    </div>
    <div class="slide-header-right">
      ${navLinksHtml}
      ${logoHtml}
    </div>
  </div>`;
}

/**
 * Gera footer do slide
 */
function generateFooter(slideNumber, totalSlides, config) {
  const authorInfo = config.project.author 
    ? ` · ${config.project.author}${config.project.email ? ` · ${config.project.email}` : ''}`
    : '';
  return `
  <div class="slide-footer">
    <div class="slide-footer-left">${config.project.name}${authorInfo}</div>
    <div class="slide-footer-right">${slideNumber}/${totalSlides}</div>
  </div>`;
}

// ============================================
// RENDERIZADORES DE SLIDE
// ============================================

function renderCover(slide, config) {
  const logoHtml = config?.project?.logo 
    ? `<img src="${config.project.logo}" alt="Logo" class="cover-logo">`
    : '';
  
  return `
    <div class="slide-content slide-content--cover">
      ${logoHtml}
      <h1>${slide.title || ''}</h1>
      ${slide.subtitle ? `<p class="subtitle">${slide.subtitle}</p>` : ''}
      ${slide.date ? `<p class="meta">${slide.date}</p>` : ''}
    </div>`;
}

function renderToc(slide) {
  const items = (slide.sections || []).map(section => `
      <a href="#slide-${section.slide}" class="toc-item">
        <span class="toc-number">${section.number}</span>
        <div class="toc-text">
          <span class="toc-section">${section.title}</span>
          <span class="toc-desc">${section.description || ''}</span>
        </div>
      </a>`).join('');

  return `
    <div class="slide-content">
      <div class="toc-header">
        <span class="toc-label">Índice</span>
        <h2 class="toc-title">${slide.title || 'Sumário'}</h2>
      </div>
      <nav class="toc-nav">
        ${items}
      </nav>
    </div>`;
}

function renderSection(slide) {
  // Detecta se é sub-seção pelo número (contém ".")
  const isSubsection = slide.number && slide.number.includes('.');

  if (isSubsection) {
    // Sub-seção: design claro com indicador de hierarquia
    const parentSection = slide.number.split('.')[0];
    return `
    <div class="slide-content">
      ${slide.number ? `<span class="section-number-bg">${slide.number}</span>` : ''}
      <div class="section-text">
        <span class="section-parent">Seção ${parentSection}</span>
        <span class="section-number-inline">${slide.number}</span>
        <h2>${slide.title || ''}</h2>
        ${slide.subtitle ? `<p class="subtitle">${slide.subtitle}</p>` : ''}
      </div>
    </div>`;
  }

  // Seção principal: design escuro original
  return `
    <div class="slide-content">
      ${slide.number ? `<span class="section-number-bg">${slide.number}</span>` : ''}
      <div class="section-text">
        <h2>${slide.title || ''}</h2>
        ${slide.subtitle ? `<p class="subtitle">${slide.subtitle}</p>` : ''}
      </div>
    </div>`;
}

function renderText(slide) {
  const content = processMarkdown(slide.content || '');
  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <div class="body-text">
        <p>${content}</p>
      </div>
    </div>`;
}

/**
 * Slide: Text + Image - Texto à esquerda, imagem à direita
 * Layout 50-50 com título integrado ao bloco de texto
 */
function renderTextImage(slide) {
  const content = processMarkdown(slide.content || '');
  const imgClass = slide.imageStyle === 'portrait' 
    ? 'text-image__img text-image__img--portrait' 
    : 'text-image__img';
  const imageHtml = slide.image 
    ? `<img src="${slide.image}" alt="${slide.imageAlt || ''}" class="${imgClass}">`
    : `<div class="text-image__placeholder">
        <span>📷</span>
        <span class="text-image__placeholder-text">${slide.imagePlaceholder || 'Adicionar imagem'}</span>
      </div>`;
  
  return `
    <div class="slide-content slide-content--text-image">
      <div class="text-image">
        <div class="text-image__text">
          <h2>${slide.title || ''}</h2>
          <p>${content}</p>
        </div>
        <div class="text-image__media">
          ${imageHtml}
          ${slide.imageCaption ? `<span class="text-image__caption">${slide.imageCaption}</span>` : ''}
        </div>
      </div>
    </div>`;
}

function renderText2Col(slide) {
  const columns = (slide.columns || []).map(col => `
      <div class="col">
        ${col.title ? `<h3>${col.title}</h3>` : ''}
        <p>${processMarkdown(col.content || '')}</p>
      </div>`).join('');

  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <div class="layout-2col">
        ${columns}
      </div>
    </div>`;
}

function renderCards3(slide) {
  const isColored = slide.colored || false;
  const isBottomAlign = slide.bottomAlign || false;
  const colorClasses = ['pillar--green', 'pillar--blue', 'pillar--purple'];
  
  const pillars = (slide.cards || []).map((card, index) => {
    const colorClass = isColored ? colorClasses[index % colorClasses.length] : '';
    return `
      <div class="pillar ${colorClass}">
        <div class="pillar__icon">${card.icon || ''}</div>
        <h3 class="pillar__title">${card.title || ''}</h3>
        <p class="pillar__desc">${processMarkdown(card.content || '')}</p>
      </div>`;
  }).join('');

  const contentClass = isBottomAlign ? 'slide-content slide-content--cards3-bottom' : 'slide-content';
  const pillarsClass = isColored ? 'pillars-editorial pillars-editorial--colored' : 'pillars-editorial';
  
  const subtitleHtml = slide.subtitle ? `<p class="cards3-subtitle">${processMarkdown(slide.subtitle)}</p>` : '';

  return `
    <div class="${contentClass}">
      <h2>${slide.title || ''}</h2>
      ${subtitleHtml}
      <div class="${pillarsClass}">
        ${pillars}
      </div>
    </div>`;
}

/**
 * Slide: Radial Metrics - Métricas com círculos de progresso
 * SVG ring progress que converte valores em arcos visuais
 */
function renderMetrics2x2(slide) {
  const metrics = (slide.metrics || []).map((m, index) => {
    // Calcular percentual para o arco
    let percent = 75; // default
    const val = m.value || '';
    if (val.startsWith('-') && val.endsWith('%')) {
      // Redução: -40% → mostrar 60% (quanto "sobrou")
      percent = 100 - Math.abs(parseInt(val));
    } else if (val.endsWith('%')) {
      percent = parseInt(val);
    } else if (val.includes('x')) {
      percent = Math.min(100, parseFloat(val) * 25); // 3.2x → 80%
    } else if (m.context && m.context.includes('Meta:')) {
      const meta = parseInt(m.context.match(/Meta:\s*(\d+)/)?.[1] || 100);
      percent = Math.min(100, (parseInt(val) / meta) * 100);
    }

    // SVG ring: circumference = 2 * PI * r = 2 * 3.14159 * 45 ≈ 283
    const circumference = 283;
    const offset = circumference - (percent / 100) * circumference;

    return `
      <div class="radial-metric">
        <svg class="radial-metric__ring" viewBox="0 0 100 100">
          <circle class="radial-metric__bg" cx="50" cy="50" r="45"/>
          <circle class="radial-metric__progress" cx="50" cy="50" r="45"
                  style="stroke-dashoffset: ${offset}"/>
        </svg>
        <div class="radial-metric__value">${m.value}</div>
        <div class="radial-metric__label">${m.label}</div>
        ${m.context ? `<div class="radial-metric__context">${m.context}</div>` : ''}
      </div>`;
  }).join('');

  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <div class="radial-metrics">
        ${metrics}
      </div>
    </div>`;
}

function renderTimeline(slide) {
  // Verifica se usa layout dramatic (quando há campos extras como progress, deliverables)
  const hasEnhancedFields = (slide.phases || []).some(p =>
    p.progress !== undefined || p.deliverables || p.status
  );

  if (hasEnhancedFields) {
    return renderTimelineDramatic(slide);
  }

  // Layout original para compatibilidade
  const phases = (slide.phases || []).map((phase, index) => `
      <div class="timeline-phase ${phase.active ? 'timeline-phase--active' : ''}">
        <div class="timeline-phase__number">${String(index + 1).padStart(2, '0')}</div>
        <div class="timeline-phase__marker"></div>
        <div class="timeline-phase__content">
          <span class="timeline-phase__date">${phase.date || ''}</span>
          <h4 class="timeline-phase__title">${phase.title || ''}</h4>
          <p class="timeline-phase__desc">${processMarkdown(phase.content || '')}</p>
        </div>
      </div>`).join('');

  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <div class="timeline-editorial">
        <div class="timeline-editorial__line"></div>
        ${phases}
      </div>
    </div>`;
}

function renderTimelineEnhanced(slide) {
  const phases = slide.phases || [];
  const activeIndex = phases.findIndex(p => p.active);
  const activePhase = activeIndex >= 0 ? phases[activeIndex] : phases[0];
  const otherPhases = phases.filter((_, i) => i !== activeIndex);

  // Calcula progresso global (baseado em fases completas + progresso da ativa)
  const completedPhases = phases.filter(p => p.status === 'concluído' || p.progress === 100).length;
  const activeProgress = activePhase?.progress || 0;
  const globalProgress = Math.round(((completedPhases + (activeProgress / 100)) / phases.length) * 100);

  // Gera labels de meses para a barra de progresso
  const monthLabels = phases.map(p => p.date?.split('-')[0] || '').filter(Boolean);
  monthLabels.push(phases[phases.length - 1]?.date?.split('-')[1] || 'Dez');

  // Renderiza entregáveis se existirem
  const deliverablesList = (activePhase?.deliverables || []).map(d =>
    `<li>${d}</li>`
  ).join('');

  // Badge de status
  const statusBadge = activePhase?.status === 'concluído' ? 'Concluído' :
                      activePhase?.active ? 'Em andamento' : 'Pendente';

  // Fases na lista lateral
  const upcomingPhases = otherPhases.map((phase, i) => {
    const originalIndex = phases.indexOf(phase);
    const statusClass = phase.status === 'concluído' ? 'timeline-enhanced__phase--completed' :
                        'timeline-enhanced__phase--pending';
    return `
        <div class="timeline-enhanced__phase ${statusClass}">
          <div class="timeline-enhanced__phase-marker"></div>
          <div class="timeline-enhanced__phase-info">
            <span class="timeline-enhanced__phase-number">${String(originalIndex + 1).padStart(2, '0')}</span>
            <span class="timeline-enhanced__phase-date">${phase.date || ''}</span>
            <span class="timeline-enhanced__phase-title">${phase.title || ''}</span>
          </div>
        </div>`;
  }).join('');

  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>

      <div class="timeline-enhanced">
        <!-- Barra de progresso global -->
        <div class="timeline-enhanced__progress">
          <div class="timeline-enhanced__progress-bar" style="--progress: ${globalProgress}%"></div>
          <div class="timeline-enhanced__progress-labels">
            ${monthLabels.map(m => `<span>${m}</span>`).join('')}
          </div>
        </div>

        <div class="timeline-enhanced__grid">
          <!-- Fase ativa (destaque) -->
          <div class="timeline-enhanced__active">
            <div class="timeline-enhanced__active-badge">${statusBadge}</div>
            <div class="timeline-enhanced__active-number">${String(activeIndex + 1).padStart(2, '0')}</div>
            <div class="timeline-enhanced__active-content">
              <span class="timeline-enhanced__active-date">${activePhase?.date || ''}</span>
              <h3 class="timeline-enhanced__active-title">${activePhase?.title || ''}</h3>
              <p class="timeline-enhanced__active-desc">${processMarkdown(activePhase?.content || '')}</p>
              ${deliverablesList ? `<ul class="timeline-enhanced__deliverables">${deliverablesList}</ul>` : ''}
            </div>
            ${activePhase?.progress !== undefined ? `
            <div class="timeline-enhanced__active-progress">
              <div class="timeline-enhanced__active-progress-ring" style="--progress: ${activePhase.progress}"></div>
              <span>${activePhase.progress}%</span>
            </div>` : ''}
          </div>

          <!-- Fases na lista -->
          <div class="timeline-enhanced__upcoming">
            <span class="timeline-enhanced__upcoming-label">Outras fases</span>
            ${upcomingPhases}
            <div class="timeline-enhanced__connector"></div>
          </div>
        </div>
      </div>
    </div>`;
}

function renderTimelineDramatic(slide) {
  const phases = slide.phases || [];

  // Calcula progresso global para o gradiente da linha
  const completedPhases = phases.filter(p => p.status === 'concluído' || p.progress === 100).length;
  const activePhase = phases.find(p => p.active);
  const activeProgress = activePhase?.progress || 0;
  const globalProgress = Math.round(((completedPhases + (activeProgress / 100)) / phases.length) * 100);

  // Renderiza cada fase
  const phasesHtml = phases.map((phase, index) => {
    // Determina o status da fase (completed tem prioridade sobre active)
    const isCompleted = phase.status === 'concluído' || phase.progress === 100;
    const isActive = phase.active && !isCompleted;
    const isPending = !isActive && !isCompleted;

    // Classes de status
    let statusClass = 'timeline-dramatic__phase';
    if (isCompleted) statusClass += ' timeline-dramatic__phase--completed';
    else if (isActive) statusClass += ' timeline-dramatic__phase--active';
    else statusClass += ' timeline-dramatic__phase--pending';

    // Status text para label externo
    const statusText = isCompleted ? 'Concluído' : (isActive ? 'Em andamento' : 'Pendente');

    // Deliverables como lista
    const deliverables = phase.deliverables || [];
    const deliverableHtml = deliverables.length > 0
      ? `<ul class="timeline-dramatic__deliverables">${deliverables.map(d => `<li>${d}</li>`).join('')}</ul>`
      : '';

    // Progress bar APENAS para fase ativa
    const progressBar = (phase.progress !== undefined && isActive) ? `
      <div class="timeline-dramatic__progress">
        <div class="timeline-dramatic__progress-bar">
          <div class="timeline-dramatic__progress-fill" style="width: ${phase.progress}%"></div>
        </div>
        <span class="timeline-dramatic__progress-label">${phase.progress}%</span>
      </div>` : '';

    return `
      <div class="${statusClass}">
        <div class="timeline-dramatic__number">${String(index + 1).padStart(2, '0')}</div>
        <div class="timeline-dramatic__marker"></div>
        <div class="timeline-dramatic__content">
          <span class="timeline-dramatic__date">${phase.date || ''}</span>
          <h4 class="timeline-dramatic__title">${phase.title || ''}</h4>
          <p class="timeline-dramatic__desc">${processMarkdown(phase.content || '')}</p>
          ${deliverableHtml}
          ${progressBar}
        </div>
        <span class="timeline-dramatic__status-label">${statusText}</span>
      </div>`;
  }).join('');

  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <div class="timeline-dramatic" style="--progress: ${globalProgress}%">
        ${phasesHtml}
      </div>
    </div>`;
}

function renderTable(slide) {
  const headers = (slide.headers || []).map(h => `<th>${h}</th>`).join('');
  const rows = (slide.rows || []).map(row => {
    const cells = row.map(cell => `<td>${cell}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <table class="table">
        <thead>
          <tr>${headers}</tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`;
}

/**
 * Slide: Quote Editorial - Citação com aspas gigantes
 * Layout editorial com elemento gráfico decorativo
 */
function renderQuote(slide) {
  return `
    <div class="slide-content">
      <div class="quote-editorial">
        <blockquote class="quote-editorial__text">
          ${slide.quote || ''}
        </blockquote>
        <footer class="quote-editorial__footer">
          <span class="quote-editorial__author">${slide.author || ''}</span>
          ${slide.role ? `<span class="quote-editorial__role">${slide.role}</span>` : ''}
        </footer>
      </div>
    </div>`;
}

/**
 * Slide: Closing - Checklist visual de próximos passos
 * Layout com checkboxes grandes e contato do apresentador
 */
function renderClosing(slide) {
  const items = (slide.items || []).map(item => `
      <li class="checklist__item">
        <span class="checklist__box">✓</span>
        <span class="checklist__text">${item}</span>
      </li>`).join('');

  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      ${items ? `<ul class="checklist">${items}</ul>` : ''}
      ${slide.contact ? `
      <div class="closing-contact">
        <span class="closing-contact__name">${slide.contact.name || ''}</span>
        <span class="closing-contact__email">${slide.contact.email || ''}</span>
      </div>` : ''}
    </div>`;
}

/**
 * Slide: Thanks - Slide de agradecimento minimalista
 * Tipografia gigante centralizada
 */
function renderThanks(slide, config) {
  const logo = config?.project?.logo || 'LOGO';
  return `
    <div class="slide-content centered">
      <div class="thanks">
        <div class="thanks__logo">${logo}</div>
        <h1 class="thanks__title">${slide.title || 'Obrigado'}</h1>
        ${slide.subtitle ? `<p class="thanks__subtitle">${slide.subtitle}</p>` : ''}
      </div>
    </div>`;
}

/**
 * Slide: Persona - Perfil de usuário com características comportamentais
 * Layout 30-35-35: foto+sliders | contexto+metas | frustrações+oportunidades
 */
function renderPersona(slide) {
  // Sliders de características comportamentais
  const traits = (slide.traits || []).map(t => `
      <div class="persona-trait">
        <div class="persona-trait__labels">
          <span class="persona-trait__left">${t.left || ''}</span>
          <span class="persona-trait__right">${t.right || ''}</span>
        </div>
        <div class="persona-trait__track">
          <div class="persona-trait__fill" style="width: ${t.value || 50}%"></div>
          <div class="persona-trait__marker" style="left: ${t.value || 50}%"></div>
        </div>
      </div>`).join('');

  // Listas
  const motivations = (slide.motivations || []).map(m => `<li>${m}</li>`).join('');
  const goals = (slide.goals || []).map(g => `<li>${g}</li>`).join('');
  const frustrations = (slide.frustrations || []).map(f => `<li>${f}</li>`).join('');
  const opportunities = (slide.opportunities || []).map(o => `<li>${o}</li>`).join('');

  return `
    <div class="slide-content">
      <div class="persona">
        <!-- Coluna 1: Foto + Sliders -->
        <div class="persona__col persona__col--profile">
          <div class="persona__photo">
            ${slide.photo ? `<img src="${slide.photo}" alt="${slide.name || 'Persona'}">` : '<span class="persona__photo-placeholder">👤</span>'}
          </div>
          <h3 class="persona__name">${slide.name || 'Nome da Persona'}</h3>
          <span class="persona__role">${slide.role || ''}</span>
          ${slide.quote ? `<blockquote class="persona__quote">"${slide.quote}"</blockquote>` : ''}

          <div class="persona__traits">
            ${traits}
          </div>
        </div>

        <!-- Coluna 2: Tags + Contexto + Motivações -->
        <div class="persona__col persona__col--context">
          ${slide.tags ? `
          <div class="persona__tags">
            ${slide.tags.map(tag => `<span class="persona__tag">${tag}</span>`).join('')}
          </div>` : ''}
          
          <div class="persona__section">
            <h4 class="persona__section-title">Contexto</h4>
            <p class="persona__context">${(slide.context || '').replace(/\|\|/g, '<span class="persona__break"></span>')}</p>
          </div>

          ${motivations ? `
          <div class="persona__section">
            <h4 class="persona__section-title">Motivações</h4>
            <ul class="persona__list persona__list--motivations">${motivations}</ul>
          </div>` : ''}
        </div>

        <!-- Coluna 3: Resultados + Frustrações + Oportunidades -->
        <div class="persona__col persona__col--insights">
          ${goals ? `
          <div class="persona__section">
            <h4 class="persona__section-title">Resultados Desejados</h4>
            <ul class="persona__list persona__list--goals">${goals}</ul>
          </div>` : ''}

          ${frustrations ? `
          <div class="persona__section">
            <h4 class="persona__section-title persona__section-title--negative">Frustrações</h4>
            <ul class="persona__list persona__list--frustrations">${frustrations}</ul>
          </div>` : ''}

          ${opportunities ? `
          <div class="persona__section">
            <h4 class="persona__section-title persona__section-title--positive">Oportunidades</h4>
            <ul class="persona__list persona__list--opportunities">${opportunities}</ul>
          </div>` : ''}
        </div>
      </div>
    </div>`;
}

/**
 * Slide: Comparison Split - Antes × Depois visual
 * Duas colunas 50-50 com imagem + label + descrição
 */
function renderComparisonSplit(slide) {
  const renderSide = (side, modifier) => `
    <div class="comparison__side comparison__side--${modifier}">
      <div class="comparison__image">
        ${side.image && side.image !== 'placeholder'
          ? `<img src="${side.image}" alt="${side.label}">`
          : '<span class="comparison__placeholder">📷</span>'}
      </div>
      <span class="comparison__label">${side.label || ''}</span>
      <p class="comparison__content">${side.content || ''}</p>
    </div>`;

  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <div class="comparison">
        ${slide.left ? renderSide(slide.left, 'left') : ''}
        <div class="comparison__divider"></div>
        ${slide.right ? renderSide(slide.right, 'right') : ''}
      </div>
    </div>`;
}

/**
 * Slide: Matrix 2x2 - Matriz de impacto/risco
 * Quadrantes com itens posicionados por coordenadas X/Y
 */
function renderMatrixPlot(slide) {
  const quadrantLabels = {};
  (slide.quadrants || []).forEach(q => {
    quadrantLabels[q.position] = q.label;
  });

  const items = (slide.items || []).map(item => `
    <div class="matrix-plot__item" style="left: ${item.x}%; bottom: ${item.y}%;">
      <span class="matrix-plot__dot"></span>
      <span class="matrix-plot__item-label">${item.label}</span>
    </div>`).join('');

  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <div class="matrix-plot">
        <div class="matrix-plot__y-axis">
          <span class="matrix-plot__axis-high">${slide.y_axis?.high || 'Alto'}</span>
          <span class="matrix-plot__axis-label">${slide.y_axis?.label || 'Y'}</span>
          <span class="matrix-plot__axis-low">${slide.y_axis?.low || 'Baixo'}</span>
        </div>
        <div class="matrix-plot__grid">
          <div class="matrix-plot__quadrant matrix-plot__quadrant--tl">${quadrantLabels['top-left'] || ''}</div>
          <div class="matrix-plot__quadrant matrix-plot__quadrant--tr">${quadrantLabels['top-right'] || ''}</div>
          <div class="matrix-plot__quadrant matrix-plot__quadrant--bl">${quadrantLabels['bottom-left'] || ''}</div>
          <div class="matrix-plot__quadrant matrix-plot__quadrant--br">${quadrantLabels['bottom-right'] || ''}</div>
          <div class="matrix-plot__items">${items}</div>
        </div>
        <div class="matrix-plot__x-axis">
          <span class="matrix-plot__axis-low">${slide.x_axis?.low || 'Baixo'}</span>
          <span class="matrix-plot__axis-label">${slide.x_axis?.label || 'X'}</span>
          <span class="matrix-plot__axis-high">${slide.x_axis?.high || 'Alto'}</span>
        </div>
      </div>
    </div>`;
}

/**
 * Slide: Gallery Grid - Grid de imagens para portfólio
 * Colunas configuráveis com captions
 */
function renderGalleryGrid(slide) {
  const columns = slide.columns || 3;
  const images = (slide.images || []).map(img => `
    <figure class="gallery__item">
      <div class="gallery__image">
        ${img.src && img.src !== 'placeholder'
          ? `<img src="${img.src}" alt="${img.caption || ''}">`
          : '<span class="gallery__placeholder">📷</span>'}
      </div>
      ${img.caption ? `<figcaption class="gallery__caption">${img.caption}</figcaption>` : ''}
    </figure>`).join('');

  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <div class="gallery" style="--gallery-columns: ${columns}">
        ${images}
      </div>
    </div>`;
}

/**
 * Slide: Gallery Masonry - Grid assimétrico estilo portfólio
 * Usa CSS columns para efeito masonry nativo com alturas variadas
 */
function renderGalleryMasonry(slide) {
  const images = (slide.images || []).map(img => `
    <figure class="masonry__item ${img.size === 'tall' ? 'masonry__item--tall' : ''}">
      <div class="masonry__image">
        ${img.src && img.src !== 'placeholder'
          ? `<img src="${img.src}" alt="${img.caption || ''}">`
          : '<span class="masonry__placeholder">📷</span>'}
      </div>
      ${img.caption ? `<figcaption class="masonry__caption">${img.caption}</figcaption>` : ''}
    </figure>`).join('');

  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <div class="masonry">
        ${images}
      </div>
    </div>`;
}

/**
 * Slide: Gallery Hero - Imagem destacada + grid secundário
 * Layout 60-40 com hero à esquerda e 2×2 à direita
 */
function renderGalleryHero(slide) {
  const gridItems = (slide.grid || []).map(img => `
    <figure class="hero-grid__item">
      <div class="hero-grid__image">
        ${img.src && img.src !== 'placeholder'
          ? `<img src="${img.src}" alt="${img.caption || ''}">`
          : '<span class="hero-grid__placeholder">📷</span>'}
      </div>
      ${img.caption ? `<figcaption class="hero-grid__caption">${img.caption}</figcaption>` : ''}
    </figure>`).join('');

  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <div class="hero-gallery">
        <figure class="hero-gallery__main">
          <div class="hero-gallery__image">
            ${slide.hero?.src && slide.hero.src !== 'placeholder'
              ? `<img src="${slide.hero.src}" alt="${slide.hero?.caption || ''}">`
              : '<span class="hero-gallery__placeholder">📷</span>'}
          </div>
          ${slide.hero?.caption ? `<figcaption class="hero-gallery__caption">${slide.hero.caption}</figcaption>` : ''}
        </figure>
        <div class="hero-gallery__grid">
          ${gridItems}
        </div>
      </div>
    </div>`;
}

/**
 * Slide: Gallery Carousel - Cards horizontais em linha
 * Foco sequencial com numeração e descrições
 */
function renderGalleryCarousel(slide) {
  const images = (slide.images || []).map((img, i) => `
    <article class="carousel__card">
      <span class="carousel__number">${String(i + 1).padStart(2, '0')}</span>
      <div class="carousel__image">
        ${img.src && img.src !== 'placeholder'
          ? `<img src="${img.src}" alt="${img.caption || ''}">`
          : '<span class="carousel__placeholder">📷</span>'}
      </div>
      <div class="carousel__content">
        ${img.caption ? `<h4 class="carousel__title">${img.caption}</h4>` : ''}
        ${img.description ? `<p class="carousel__description">${img.description}</p>` : ''}
      </div>
    </article>`).join('');

  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <div class="carousel">
        ${images}
      </div>
    </div>`;
}

/**
 * Slide: Gallery Bento - Layout estilo Apple com blocos variados
 * Grid assimétrico com tamanhos large/medium/small
 */
function renderGalleryBento(slide) {
  const items = (slide.items || []).map(item => `
    <figure class="bento__item bento__item--${item.size || 'small'}">
      <div class="bento__image">
        ${item.src && item.src !== 'placeholder'
          ? `<img src="${item.src}" alt="${item.caption || ''}">`
          : '<span class="bento__placeholder">📷</span>'}
      </div>
      ${item.caption ? `<figcaption class="bento__caption">${item.caption}</figcaption>` : ''}
    </figure>`).join('');

  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <div class="bento">
        ${items}
      </div>
    </div>`;
}

/**
 * Slide: Process Flow - Fluxograma de processo
 * Etapas com tipos (start, process, decision, end)
 */
function renderProcessFlow(slide) {
  const typeIcons = {
    'start': '●',
    'end': '◉',
    'process': '▢',
    'decision': '◇'
  };

  const steps = (slide.steps || []).map(step => `
    <div class="flow__step flow__step--${step.type}" data-id="${step.id}">
      <span class="flow__icon">${typeIcons[step.type] || '▢'}</span>
      <span class="flow__label">${step.label}</span>
    </div>`).join('');

  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <div class="flow">
        <div class="flow__steps">${steps}</div>
      </div>
      <div class="flow__legend">
        <span><span class="flow__legend-icon">●</span> Início/Fim</span>
        <span><span class="flow__legend-icon">▢</span> Processo</span>
        <span><span class="flow__legend-icon">◇</span> Decisão</span>
      </div>
    </div>`;
}

/**
 * Slide: Voices Grid - Múltiplas citações de clientes
 * Grid 4x2 com 8 citações compactas
 */
function renderVoices(slide) {
  const voices = (slide.voices || []).map(v => `
      <article class="voice-card">
        <blockquote class="voice-card__quote">${v.quote || ''}</blockquote>
        <footer class="voice-card__footer">
          <span class="voice-card__author">${v.author || ''}</span>
          ${v.role ? `<span class="voice-card__role">${v.role}</span>` : ''}
        </footer>
      </article>`).join('');

  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <div class="voices-grid">
        ${voices}
      </div>
    </div>`;
}

/**
 * Slide: Asymmetric Columns - 3 colunas com larguras diferenciadas
 * Hierarquia visual por proporção de espaço (45% - 30% - 25%)
 */
function renderIcons3Col(slide) {
  const items = (slide.items || []).map((item, index) => `
      <article class="asymmetric-col">
        <span class="asymmetric-col__number">${String(index + 1).padStart(2, '0')}</span>
        <h3 class="asymmetric-col__title">${item.title || ''}</h3>
        <p class="asymmetric-col__desc">${processMarkdown(item.content || '')}</p>
      </article>`).join('');

  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <div class="asymmetric-cols">
        ${items}
      </div>
    </div>`;
}

/**
 * Slide: Feature Showcase (6 itens em layout editorial 2+4)
 * Layout assimétrico com 2 itens destacados + 4 secundários
 */
function renderIconsGrid(slide) {
  const items = slide.items || [];

  // Divide itens em destacados (2) e secundários (4)
  const featured = items.slice(0, 2);
  const secondary = items.slice(2, 6);

  // Renderiza itens destacados (números 01-02)
  const featuredHtml = featured.map((item, index) => `
      <article class="feature-item feature-item--large">
        <span class="feature-item__number">${String(index + 1).padStart(2, '0')}</span>
        <div class="feature-item__content">
          <h3 class="feature-item__title">${item.title || ''}</h3>
          <p class="feature-item__desc">${processMarkdown(item.content || '')}</p>
        </div>
      </article>`).join('');

  // Renderiza itens secundários (números 03-06)
  const secondaryHtml = secondary.map((item, index) => `
      <article class="feature-item feature-item--compact">
        <span class="feature-item__number">${String(index + 3).padStart(2, '0')}</span>
        <div class="feature-item__content">
          <h4 class="feature-item__title">${item.title || ''}</h4>
          <p class="feature-item__desc">${processMarkdown(item.content || '')}</p>
        </div>
      </article>`).join('');

  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <div class="feature-showcase">
        <div class="feature-showcase__featured">
          ${featuredHtml}
        </div>
        <div class="feature-showcase__divider"></div>
        <div class="feature-showcase__secondary">
          ${secondaryHtml}
        </div>
      </div>
    </div>`;
}

/**
 * Slide: Matrix Quadrant (É/Não É/Faz/Não Faz)
 * Matriz 2x2 para definição de identidade e escopo do produto
 */
function renderMatrixQuadrant(slide) {
  const quadrants = slide.quadrants || {};
  
  const renderItems = (items) => {
    if (!items || items.length === 0) return '';
    return items.map(item => `<li>${item}</li>`).join('');
  };

  return `
    <div class="slide-content slide-content--matrix">
      ${slide.title ? `<h2 class="matrix-title">${slide.title}</h2>` : ''}
      
      <div class="matrix-quadrant">
        <div class="matrix-quadrant__grid">
          <!-- É -->
          <div class="matrix-quadrant__cell matrix-quadrant__cell--is">
            <div class="matrix-quadrant__header">
              <span class="matrix-quadrant__icon">✓</span>
              <h3 class="matrix-quadrant__label">É</h3>
            </div>
            <ul class="matrix-quadrant__list">
              ${renderItems(quadrants.is)}
            </ul>
          </div>
          
          <!-- Não É -->
          <div class="matrix-quadrant__cell matrix-quadrant__cell--is-not">
            <div class="matrix-quadrant__header">
              <span class="matrix-quadrant__icon">✗</span>
              <h3 class="matrix-quadrant__label">Não É</h3>
            </div>
            <ul class="matrix-quadrant__list">
              ${renderItems(quadrants.isNot)}
            </ul>
          </div>
          
          <!-- Faz -->
          <div class="matrix-quadrant__cell matrix-quadrant__cell--does">
            <div class="matrix-quadrant__header">
              <span class="matrix-quadrant__icon">→</span>
              <h3 class="matrix-quadrant__label">Faz</h3>
            </div>
            <ul class="matrix-quadrant__list">
              ${renderItems(quadrants.does)}
            </ul>
          </div>
          
          <!-- Não Faz -->
          <div class="matrix-quadrant__cell matrix-quadrant__cell--does-not">
            <div class="matrix-quadrant__header">
              <span class="matrix-quadrant__icon">⊘</span>
              <h3 class="matrix-quadrant__label">Não Faz</h3>
            </div>
            <ul class="matrix-quadrant__list">
              ${renderItems(quadrants.doesNot)}
            </ul>
          </div>
        </div>
        
        <!-- Eixos centrais -->
        <div class="matrix-quadrant__axis matrix-quadrant__axis--vertical">
          <span class="matrix-quadrant__axis-label matrix-quadrant__axis-label--top">IDENTIDADE</span>
          <span class="matrix-quadrant__axis-label matrix-quadrant__axis-label--bottom">ESCOPO</span>
        </div>
        <div class="matrix-quadrant__axis matrix-quadrant__axis--horizontal">
          <span class="matrix-quadrant__axis-label matrix-quadrant__axis-label--left">SIM</span>
          <span class="matrix-quadrant__axis-label matrix-quadrant__axis-label--right">NÃO</span>
        </div>
      </div>
    </div>`;
}

/**
 * Slide: Data Highlight - Destaque de dados com números grandes
 * Grid de métricas com insight
 */
function renderDataHighlight(slide) {
  const metrics = slide.metrics || [];
  
  // Divide métricas em principais (primeiras 2) e secundárias
  const primaryMetrics = metrics.slice(0, 2);
  const secondaryMetrics = metrics.slice(2);
  
  const primaryHtml = primaryMetrics.map(m => `
    <div class="data-metric data-metric--primary">
      <span class="data-metric__value">${m.value || ''}</span>
      <span class="data-metric__label">${m.label || ''}</span>
      ${m.context ? `<span class="data-metric__context">${m.context}</span>` : ''}
    </div>
  `).join('');
  
  const secondaryHtml = secondaryMetrics.length > 0 ? `
    <div class="data-metrics--secondary">
      ${secondaryMetrics.map(m => `
        <div class="data-metric data-metric--secondary">
          <span class="data-metric__value">${m.value || ''}</span>
          <span class="data-metric__label">${m.label || ''}</span>
          ${m.context ? `<span class="data-metric__context">${m.context}</span>` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';
  
  const insightHtml = slide.insight ? `
    <div class="data-insight">
      <p>${processMarkdown(slide.insight)}</p>
    </div>
  ` : '';
  
  const sourceHtml = slide.source ? `
    <span class="data-source">Fonte: ${slide.source}</span>
  ` : '';
  
  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <div class="data-layout">
        <div class="data-metrics--primary">
          ${primaryHtml}
        </div>
        ${secondaryHtml}
        ${insightHtml}
      </div>
      ${sourceHtml}
    </div>`;
}

/**
 * Slide: Problem Split V2 - Dois lados do problema
 * Layout redesenhado com cards lado a lado
 */
function renderProblemSplit(slide) {
  const sides = slide.sides || [];
  
  const sidesHtml = sides.map((side, index) => {
    const isProvider = index === 0;
    const sideClass = isProvider ? 'provider' : 'client';
    
    // Stats
    const statsHtml = (side.stats || []).map(s => `
      <div class="problem-split-v2__stat">
        <div class="problem-split-v2__stat-value">${s.value}</div>
        <div class="problem-split-v2__stat-label">${s.label}</div>
      </div>
    `).join('');
    
    // Items
    const itemsHtml = (side.items || []).map(item => 
      `<div class="problem-split-v2__item">${processMarkdown(item)}</div>`
    ).join('');
    
    return `
      <div class="problem-split-v2__side problem-split-v2__side--${sideClass}">
        <div class="problem-split-v2__header">
          <div class="problem-split-v2__icon">${side.icon || ''}</div>
          <h3 class="problem-split-v2__title">${side.title || ''}</h3>
        </div>
        ${statsHtml ? `<div class="problem-split-v2__stats">${statsHtml}</div>` : ''}
        <div class="problem-split-v2__content">
          <div class="problem-split-v2__items">${itemsHtml}</div>
        </div>
      </div>
    `;
  }).join('');
  
  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      <div class="problem-split-v2">
        ${sidesHtml}
      </div>
    </div>`;
}

/**
 * Slide: Solution Hero - Apresentação completa da solução
 * Layout editorial assimétrico com conteúdo rico
 */
function renderSolutionHero(slide) {
  // Seções principais (coluna esquerda)
  const sections = (slide.sections || []).map(s => `
    <div class="sh-section">
      <h3 class="sh-section__title">${s.title}</h3>
      <p class="sh-section__text">${processMarkdown(s.text)}</p>
    </div>
  `).join('');
  
  // Conteúdo "É" (sidebar) - suporta texto ou lista
  let isContent = '';
  if (typeof slide.is === 'string') {
    isContent = `<p class="sh-card__text">${processMarkdown(slide.is)}</p>`;
  } else if (Array.isArray(slide.is)) {
    isContent = `<ul>${slide.is.map(i => `<li>${i}</li>`).join('')}</ul>`;
  }
  
  // Conteúdo "Não é" (sidebar) - suporta texto ou lista
  let isNotContent = '';
  if (typeof slide.isNot === 'string') {
    isNotContent = `<p class="sh-card__text">${processMarkdown(slide.isNot)}</p>`;
  } else if (Array.isArray(slide.isNot)) {
    isNotContent = `<ul>${slide.isNot.map(i => `<li>${i}</li>`).join('')}</ul>`;
  }
  
  // Highlight (sidebar)
  const highlight = slide.highlight || {};
  
  return `
    <div class="slide-content slide-content--sh slide-content--solution-hero">
      <div class="sh-layout">
        <div class="sh-main">
          <div class="sh-header solution-hero__header">
            <h2 class="sh-title">${slide.title || ''}</h2>
            <p class="sh-subtitle">${slide.subtitle || ''}</p>
          </div>
          <div class="sh-sections solution-hero__sections">${sections}</div>
        </div>
        
        <aside class="sh-sidebar">
          <div class="sh-card sh-card--is">
            <h4>É</h4>
            ${isContent}
          </div>
          
          <div class="sh-card sh-card--isnot">
            <h4>Não é</h4>
            ${isNotContent}
          </div>
          
          <div class="sh-highlight">
            <span class="sh-highlight__label">${highlight.label || ''}</span>
            <span class="sh-highlight__value">${highlight.value || ''}</span>
          </div>
        </aside>
      </div>
    </div>`;
}

/**
 * Slide: Dual Track - Jornadas que convergem
 * Layout horizontal com conexões visuais
 */
function renderDualTrack(slide) {
  const tracks = slide.tracks || [];
  const left = tracks[0] || {};
  const right = tracks[1] || {};
  const leftSteps = left.steps || [];
  const rightSteps = right.steps || [];
  const centerLabels = slide.centerLabels || ['', '', '', ''];
  
  // Gera linhas horizontais conectando os passos
  const rowsHtml = leftSteps.map((lstep, i) => {
    const rstep = rightSteps[i] || {};
    const isConnect = i === 2; // Passo 3 = momento de encontro
    const isLoop = i === 3; // Passo 4 = fecha o ciclo
    const centerLabel = centerLabels[i] || '';
    
    return `
      <div class="dt-row ${isConnect ? 'dt-row--connect' : ''} ${isLoop ? 'dt-row--loop' : ''}">
        <div class="dt-cell dt-cell--left">
          <strong>${lstep.title || ''}</strong>
          <span>${lstep.text || ''}</span>
        </div>
        <div class="dt-cell dt-cell--center">
          <span class="dt-num">${i + 1}</span>
          <span class="dt-center-label">${centerLabel}</span>
        </div>
        <div class="dt-cell dt-cell--right">
          <strong>${rstep.title || ''}</strong>
          <span>${rstep.text || ''}</span>
        </div>
      </div>
    `;
  }).join('');
  
  return `
    <div class="slide-content slide-content--dual-track">
      <h2>${slide.title || ''}</h2>
      <div class="dt-v2">
        <div class="dt-rows">
          <div class="dt-row dt-row--header">
            <div class="dt-cell dt-cell--left">
              <span class="dt-persona__icon">${left.icon || ''}</span>
              <span class="dt-persona__name">${left.title || ''}</span>
            </div>
            <div class="dt-cell dt-cell--center"></div>
            <div class="dt-cell dt-cell--right">
              <span class="dt-persona__icon">${right.icon || ''}</span>
              <span class="dt-persona__name">${right.title || ''}</span>
            </div>
          </div>
          ${rowsHtml}
        </div>
      </div>
    </div>`;
}

/**
 * Slide: Benchmark Table - Comparação com concorrentes
 * Tabela visual de benchmarking
 */
function renderBenchmarkTable(slide) {
  const competitors = slide.competitors || [];
  const criteria = slide.criteria || [];
  
  // Header
  const headerCells = competitors.map((c, i) => {
    const isHighlight = c.highlight;
    return `<th class="bt-cell bt-cell--header ${isHighlight ? 'bt-cell--highlight' : ''}">${c.name}</th>`;
  }).join('');
  
  // Rows
  const rowsHtml = criteria.map(criterion => {
    const cells = competitors.map((comp, i) => {
      const value = criterion.values[i] || '';
      const isHighlight = comp.highlight;
      return `<td class="bt-cell ${isHighlight ? 'bt-cell--highlight' : ''}">${value}</td>`;
    }).join('');
    
    return `
      <tr class="bt-row">
        <td class="bt-cell bt-cell--criterion">${criterion.name}</td>
        ${cells}
      </tr>
    `;
  }).join('');
  
  return `
    <div class="slide-content">
      <h2>${slide.title || ''}</h2>
      ${slide.subtitle ? `<p class="bt-subtitle">${slide.subtitle}</p>` : ''}
      <table class="bt-table">
        <thead>
          <tr class="bt-row bt-row--header">
            <th class="bt-cell bt-cell--criterion"></th>
            ${headerCells}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>`;
}

/**
 * Slide: Question - Pergunta desafio / HMW
 * Slide de transição com pergunta central
 */
function renderQuestion(slide) {
  const bgStyle = slide.background ? `style="background-image: url('${slide.background}')"` : '';
  const hasBackground = slide.background ? 'question--has-bg' : '';
  
  return `
    <div class="slide-content slide-content--question ${hasBackground}" ${bgStyle}>
      <div class="question__overlay"></div>
      <div class="question__content">
        ${slide.context ? `<p class="question__context">${slide.context}</p>` : ''}
        <h2 class="question__text">${processMarkdown(slide.question || '')}</h2>
      </div>
    </div>`;
}

/**
 * Slide: Revenue Model - Modelo de sustentabilidade
 * Layout centralizado com cards informativos
 */
function renderRevenueModel(slide) {
  const streams = (slide.streams || []).map((s, i) => `
    <div class="rm-stream-expanded">
      <div class="rm-stream-expanded__header">
        <div class="rm-stream-expanded__icon">${s.icon || ''}</div>
        <h3 class="rm-stream-expanded__title">${s.title || ''}</h3>
      </div>
      <p class="rm-stream-expanded__desc">${processMarkdown(s.desc || '')}</p>
    </div>
  `).join('');
  
  return `
    <div class="slide-content slide-content--rm-expanded">
      <div class="rm-header">
        <h2>${slide.title || ''}</h2>
        ${slide.principle ? `<p class="rm-principle">${slide.principle}</p>` : ''}
      </div>
      <div class="rm-streams-expanded">${streams}</div>
    </div>`;
}

/**
 * Slide: User Stories - Grid 2x3 com histórias de usuário
 * Layout colorido com emojis padronizados por ator
 */
function renderUserStories(slide) {
  const stories = (slide.stories || []).map((s, i) => {
    const color = s.color || 'green';
    return `
    <div class="us-card us-card--${color}">
      <div class="us-card__icon">${s.icon || ''}</div>
      <div class="us-card__actor">${s.actor || ''}</div>
      <p class="us-card__story">${processMarkdown(s.story || '')}</p>
    </div>`;
  }).join('');
  
  return `
    <div class="slide-content slide-content--user-stories">
      <h2>${slide.title || ''}</h2>
      <div class="us-grid">${stories}</div>
    </div>`;
}

/**
 * Slide: User Stories V2 - Duas colunas agrupadas por ator
 * Layout sem repetição de labels
 */
function renderUserStoriesV2(slide) {
  const renderColumn = (group) => {
    const cards = (group.stories || []).map(s => `
      <div class="us-card-v2">
        <p class="us-card-v2__story">${processMarkdown(s)}</p>
      </div>
    `).join('');
    
    return `
      <div class="us-column us-column--${group.color || 'green'}">
        <div class="us-column__header">
          <span class="us-column__icon">${group.icon || ''}</span>
          <span class="us-column__title">${group.title || ''}</span>
        </div>
        <div class="us-column__cards">${cards}</div>
      </div>`;
  };
  
  const columns = (slide.groups || []).map(renderColumn).join('');
  
  return `
    <div class="slide-content slide-content--user-stories-v2">
      <h2>${slide.title || ''}</h2>
      <div class="us-columns">${columns}</div>
    </div>`;
}

/**
 * Slide: Prototype Showcase - QR Code + Screenshots do protótipo
 * Layout para demonstrar MVP interativo
 */
function renderPrototypeShowcase(slide) {
  const screens = (slide.screens || []).map(screen => `
    <div class="proto-screen">
      <div class="proto-screen__frame">
        ${screen.image 
          ? `<img src="${screen.image}" alt="${screen.label}" class="proto-screen__img">`
          : `<div class="proto-screen__placeholder">📱</div>`
        }
      </div>
      <div class="proto-screen__info">
        <span class="proto-screen__label">${screen.label || ''}</span>
        <span class="proto-screen__desc">${screen.description || ''}</span>
      </div>
    </div>
  `).join('');
  
  const qrContent = slide.qrcode 
    ? `<img src="${slide.qrcode}" alt="QR Code" class="proto-qr__image">`
    : `<div class="proto-qr__placeholder">
        <span class="proto-qr__icon">📱</span>
        <span class="proto-qr__text">QR Code</span>
        <span class="proto-qr__hint">Escaneie para acessar</span>
      </div>`;
  
  return `
    <div class="slide-content slide-content--prototype">
      <div class="proto-layout">
        <div class="proto-qr">
          <h2>${slide.title || 'Protótipo'}</h2>
          ${slide.subtitle ? `<p class="proto-subtitle">${slide.subtitle}</p>` : ''}
          ${qrContent}
          <p class="proto-url">${slide.url || 'elo-mvp.vercel.app'}</p>
        </div>
        <div class="proto-screens">
          ${screens}
        </div>
      </div>
    </div>`;
}

/**
 * Renderiza um slide baseado no tipo
 */
function renderSlide(slide, slideNumber, totalSlides, config, navLinksHtml) {
  const type = slide.type || 'text';

  // Map de renderizadores
  const renderers = {
    'cover': renderCover,
    'toc': renderToc,
    'section': renderSection,
    'text': renderText,
    'text-image': renderTextImage,
    'text-2col': renderText2Col,
    'cards-3': renderCards3,
    'icons-3col': renderIcons3Col,
    'icons-grid': renderIconsGrid,
    'metrics-2x2': renderMetrics2x2,
    'timeline': renderTimeline,
    'table': renderTable,
    'quote': renderQuote,
    'voices': renderVoices,
    'closing': renderClosing,
    'thanks': renderThanks,
    'persona': renderPersona,
    'comparison-split': renderComparisonSplit,
    'matrix-quadrant': renderMatrixQuadrant,
    'matrix-plot': renderMatrixPlot,
    'gallery-grid': renderGalleryGrid,
    'gallery-masonry': renderGalleryMasonry,
    'gallery-hero': renderGalleryHero,
    'gallery-carousel': renderGalleryCarousel,
    'gallery-bento': renderGalleryBento,
    'process-flow': renderProcessFlow,
    'data-highlight': renderDataHighlight,
    'problem-split': renderProblemSplit,
    'solution-hero': renderSolutionHero,
    'dual-track': renderDualTrack,
    'benchmark-table': renderBenchmarkTable,
    'question': renderQuestion,
    'revenue-model': renderRevenueModel,
    'user-stories': renderUserStories,
    'user-stories-v2': renderUserStoriesV2,
    'prototype-showcase': renderPrototypeShowcase
  };

  const renderer = renderers[type];
  if (!renderer) {
    console.warn(`⚠️  Tipo de slide desconhecido: ${type}`);
    return '';
  }

  const content = renderer(slide, config);

  // Determina classes do slide
  let slideClass = 'slide';
  if (type === 'cover') slideClass += ' slide--cover';
  if (type === 'section') {
    // Detecta sub-seção pelo número (contém ".")
    const isSubsection = slide.number && slide.number.includes('.');
    slideClass += isSubsection ? ' slide--subsection-cover' : ' slide--section-cover';
  }
  if (type === 'toc') slideClass += ' slide--toc';

  // Monta o slide completo
  const header = type !== 'cover' ? generateHeader(slide, config, navLinksHtml) : '';
  const footer = type !== 'cover' ? generateFooter(slideNumber, totalSlides, config) : '';
  const navAttr = slide.nav ? ` data-nav="${slide.nav}"` : '';

  return `
<section class="${slideClass}" id="slide-${slideNumber}" data-slide="${slideNumber}"${navAttr}>
  ${header}
  ${content}
  ${footer}
</section>`;
}

/**
 * Build principal
 */
function build() {
  console.log('\n🔨 Build Template YAML + HTML v2.0\n');

  // Carrega configuração
  const config = loadYaml(CONFIG_FILE);
  console.log(`📋 Projeto: ${config.project.name}`);

  // Carrega apresentação
  const presentation = loadYaml(PRESENTATION_FILE);
  const slides = presentation.slides || [];
  const totalSlides = slides.length;

  if (totalSlides === 0) {
    console.error('❌ Nenhum slide definido em presentation.yaml');
    process.exit(1);
  }

  console.log(`\n📂 Processando ${totalSlides} slides:\n`);

  // Gera links de navegação
  const navLinksHtml = generateNavLinks(config.nav);

  // Processa cada slide
  const processedSlides = slides.map((slide, index) => {
    const slideNumber = index + 1;
    const rendered = renderSlide(slide, slideNumber, totalSlides, config, navLinksHtml);
    console.log(`   ${String(slideNumber).padStart(2, '0')}. ${slide.type || 'text'} - ${slide.title || '(sem título)'}`);
    return rendered;
  });

  // Lê template base
  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.error(`❌ ${TEMPLATE_FILE} não encontrado!`);
    process.exit(1);
  }
  let template = fs.readFileSync(TEMPLATE_FILE, 'utf8');

  // Substitui placeholder do nome do projeto
  template = template.replace(/\{\{project\.name\}\}/g, config.project.name);

  // Injeta tema (wireframe como default)
  const theme = config.project?.theme || 'wireframe';
  template = template.replace('<html lang="pt-BR">', `<html lang="pt-BR" data-theme="${theme}">`);

  // Injeta slides
  const slidesHtml = processedSlides.join('\n');
  const finalHtml = template.replace(PLACEHOLDER, slidesHtml);

  // Escreve arquivo final
  fs.writeFileSync(OUTPUT_FILE, finalHtml, 'utf8');

  console.log(`\n✅ Build completo!`);
  console.log(`   Arquivo: ${OUTPUT_FILE}`);
  console.log(`   Slides: ${totalSlides}\n`);
}

// Executa
try {
  build();
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}
