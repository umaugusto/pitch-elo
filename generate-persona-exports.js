/**
 * Gerador de HTMLs individuais para personas
 * Cada persona é renderizada em um HTML separado para screenshot
 * 
 * Uso: node generate-persona-exports.js
 * Depois abra cada HTML no navegador e faça screenshot (1920x1080)
 */

const fs = require('fs');
const path = require('path');

// Carregar estilos
const baseCSS = fs.readFileSync('styles/base.css', 'utf8');
const layoutsCSS = fs.readFileSync('styles/layouts.css', 'utf8');

// Dados das personas
const personas = [
  {
    filename: 'persona-seu-joao.html',
    name: "Seu João",
    role: "Eletricista autônomo · 58 anos",
    photo: "../assets/personas/seu-joao.png",
    quote: "Meu trabalho fala por mim. Quem me conhece sabe que eu resolvo.",
    tags: ["Sem MEI", "42 anos de atuação", "Casado"],
    traits: [
      { left: "Analógico", right: "Digital", value: 15 },
      { left: "Informal", right: "Formal", value: 10 },
      { left: "Reativo", right: "Proativo", value: 15 },
      { left: "Local", right: "Expansão", value: 10 },
      { left: "Genérico", right: "Especializado", value: 70 }
    ],
    context: "Trabalho com eletricidade desde os 16 anos — aprendi com meu pai. Nunca precisei de propaganda. Meu telefone toca porque alguém indicou.||Não tenho empresa, não tenho nota fiscal. Trabalho na confiança. Meu preço é justo e meu trabalho é garantido.",
    motivations: [
      "Manter a reputação que construí ao longo de 42 anos",
      "Continuar trabalhando enquanto tiver saúde",
      "Ser reconhecido pela qualidade, não pelo preço baixo"
    ],
    goals: [
      "Minimizar o esforço para alcançar novos clientes",
      "Maximizar a visibilidade do histórico de trabalhos"
    ],
    frustrations: [
      "Não consigo alcançar quem está fora do meu círculo",
      "Não tenho como mostrar os trabalhos que já fiz"
    ],
    opportunities: [
      "Como dar visibilidade a prestadores que não dominam tecnologia?"
    ]
  },
  {
    filename: 'persona-mariana.html',
    name: "Mariana",
    role: "Personal Organizer · 28 anos",
    photo: "../assets/personas/Mariana.png",
    quote: "Eu não limpo casa. Eu transformo ambientes. Mas como mostrar isso pra quem nunca me viu trabalhar?",
    tags: ["MEI", "4 anos de atuação", "Instagram profissional"],
    traits: [
      { left: "Analógico", right: "Digital", value: 85 },
      { left: "Informal", right: "Formal", value: 75 },
      { left: "Reativo", right: "Proativo", value: 80 },
      { left: "Local", right: "Expansão", value: 85 },
      { left: "Genérico", right: "Especializado", value: 80 }
    ],
    context: "Comecei como diarista pra ajudar em casa, mas percebi que tinha talento pra organização. Hoje me apresento como personal organizer.||Quero crescer, talvez contratar uma ajudante. Meu sonho é ter uma microempresa.",
    motivations: [
      "Transformar meu trabalho autônomo em uma empresa",
      "Ser reconhecida como profissional",
      "Ter agenda cheia com clientes que valorizem o trabalho"
    ],
    goals: [
      "Maximizar a percepção de valor do meu trabalho",
      "Maximizar a visibilidade para clientes fora do meu círculo"
    ],
    frustrations: [
      "Clientes novos pedem desconto sem conhecer meu trabalho",
      "Não existe plataforma local que me ajude a aparecer"
    ],
    opportunities: [
      "Como ajudar prestadores a demonstrar o valor do seu trabalho?"
    ]
  },
  {
    filename: 'persona-ricardo.html',
    name: "Ricardo",
    role: "Gerente de Projetos · 42 anos",
    photo: "../assets/personas/Ricardo.png",
    quote: "Me mostra que você sabe o que faz e eu pago o que você pedir. Só não me faça perder tempo.",
    tags: ["CLT", "MBA", "Trabalho remoto"],
    traits: [
      { left: "Analógico", right: "Digital", value: 85 },
      { left: "Transacional", right: "Relacional", value: 20 },
      { left: "Econômico", right: "Premium", value: 85 },
      { left: "Flexível", right: "Exigente", value: 85 },
      { left: "Variado", right: "Fiel", value: 80 }
    ],
    context: "Me mudei pra Santa Rita há 3 anos — trabalho remoto pra uma consultoria de São Paulo. Qualidade de vida, sabe?||Quando preciso de um prestador, quero resolver rápido. Pago mais caro se tiver garantia.",
    motivations: [
      "Resolver problemas domésticos sem perder tempo",
      "Encontrar prestadores confiáveis e manter a relação",
      "Ter um 'time' fixo de prestadores"
    ],
    goals: [
      "Minimizar o tempo para encontrar prestador confiável",
      "Maximizar a confiança antes da primeira contratação"
    ],
    frustrations: [
      "Não confio em indicação vaga — quero ver histórico antes",
      "Aqui não tem app, só boca-a-boca desorganizado"
    ],
    opportunities: [
      "Como gerar confiança antes da primeira contratação?"
    ]
  },
  {
    filename: 'persona-dona-celia.html',
    name: "Dona Célia",
    role: "Aposentada · Ex-professora · 67 anos",
    photo: "../assets/personas/celia.png",
    quote: "Gosto de ajudar. Quando alguém resolve um problema por causa de uma indicação minha, eu fico feliz.",
    tags: ["Viúva", "Multiplicadora", "40 anos no bairro"],
    traits: [
      { left: "Analógico", right: "Digital", value: 15 },
      { left: "Transacional", right: "Relacional", value: 90 },
      { left: "Econômico", right: "Premium", value: 85 },
      { left: "Flexível", right: "Exigente", value: 20 },
      { left: "Variado", right: "Fiel", value: 90 }
    ],
    context: "Moro nessa casa há 40 anos. Vi esse bairro crescer. Conheço todo mundo — e todo mundo me conhece.||Quando alguém precisa de prestador, vem perguntar pra mim. Só indico quem conheço e confio.",
    motivations: [
      "Ajudar as pessoas ao redor e me sentir útil",
      "Fazer parte da comunidade, sentir que pertenço"
    ],
    goals: [
      "Minimizar o esforço para lembrar e compartilhar indicações",
      "Maximizar a confiança nas indicações que recebo e faço"
    ],
    frustrations: [
      "Minha memória já não é a mesma, esqueço nomes",
      "Dificuldade com tecnologia — minha filha me ajuda"
    ],
    opportunities: [
      "Como apoiar multiplicadores a organizar indicações?"
    ]
  }
];

// Função para renderizar persona
function renderPersona(p) {
  const tags = p.tags.map(t => `<span class="persona-tag">${t}</span>`).join('');
  
  const traits = p.traits.map(t => `
    <div class="persona-trait">
      <span class="trait-left">${t.left}</span>
      <div class="trait-bar">
        <div class="trait-fill" style="width: ${t.value}%"></div>
      </div>
      <span class="trait-right">${t.right}</span>
    </div>
  `).join('');
  
  const contextParts = (p.context || '').split('||');
  const contextHTML = contextParts.map(part => `<p>${part}</p>`).join('');
  
  const motivations = (p.motivations || []).map(m => `<li>${m}</li>`).join('');
  const goals = (p.goals || []).map(g => `<li>${g}</li>`).join('');
  const frustrations = (p.frustrations || []).map(f => `<li>${f}</li>`).join('');
  const opportunities = (p.opportunities || []).map(o => `<li>${o}</li>`).join('');
  
  return `
    <div class="slide-content slide-content--persona">
      <div class="persona-grid">
        <div class="persona-photo-section">
          <div class="persona-photo">
            <img src="${p.photo}" alt="${p.name}">
          </div>
          <div class="persona-tags">${tags}</div>
        </div>
        
        <div class="persona-header-section">
          <h2 class="persona-name">${p.name}</h2>
          <p class="persona-role">${p.role}</p>
          <blockquote class="persona-quote">"${p.quote}"</blockquote>
        </div>
        
        <div class="persona-traits-section">
          <h4>Perfil</h4>
          ${traits}
        </div>
        
        <div class="persona-context-section">
          <h4>Contexto</h4>
          ${contextHTML}
        </div>
        
        <div class="persona-goals-section">
          <div class="goals-column">
            <h4>💚 Motivações</h4>
            <ul>${motivations}</ul>
          </div>
          <div class="goals-column">
            <h4>🎯 Objetivos</h4>
            <ul>${goals}</ul>
          </div>
          <div class="goals-column">
            <h4>😤 Frustrações</h4>
            <ul>${frustrations}</ul>
          </div>
          <div class="goals-column goals-column--full">
            <h4>💡 Oportunidades</h4>
            <ul>${opportunities}</ul>
          </div>
        </div>
      </div>
    </div>`;
}

// Template HTML
function createHTML(persona) {
  const content = renderPersona(persona);
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Persona - ${persona.name}</title>
  <style>
${baseCSS}
${layoutsCSS}

/* Ajustes para export standalone */
body {
  margin: 0;
  padding: 0;
  background: #f8f9fa;
}

.slide {
  width: 1920px;
  height: 1080px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  box-sizing: border-box;
}
  </style>
</head>
<body>
  <div class="slide">
    ${content}
  </div>
</body>
</html>`;
}

// Gerar arquivos
console.log('📸 Gerando HTMLs das personas para export...\n');

personas.forEach(p => {
  const html = createHTML(p);
  const filepath = path.join('exports', p.filename);
  fs.writeFileSync(filepath, html, 'utf8');
  console.log(`✅ ${filepath}`);
});

console.log('\n📋 Instruções:');
console.log('1. Abra cada HTML no Chrome');
console.log('2. Pressione F12 → Device Toolbar → 1920x1080');
console.log('3. Ctrl+Shift+P → "Capture full size screenshot"');
console.log('4. Salve os PNGs em assets/personas/exports/');
