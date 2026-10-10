'use strict';

const $ = id => document.getElementById(id);
const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const demo = {
  id: 'demo-reading-ai', demo: true, language:'nl-NL',
  title: 'Leren denken in een tijd van AI',
  subtitle: 'Waarom een goed antwoord begint bij een betere vraag.',
  author: 'Een essay om de leesruimte te ontdekken', source: 'Voorbeeldartikel', url: '',
  summary: 'AI kan je helpen om een tekst te begrijpen, maar begrip ontstaat wanneer je zelf vragen stelt. Gebruik een antwoord als het begin van je denkwerk: zoek de aanname, vraag om een voorbeeld en leg het idee uit in je eigen woorden. Een kleine notitie maakt van een vluchtige gedachte iets waarop je kunt terugkomen.',
  blocks: [
    {type:'p',text:'Er is een verschil tussen een antwoord krijgen en iets begrijpen. Een antwoord kun je kopiëren. Begrip ontstaat pas wanneer je verbanden ziet, twijfels onderzoekt en een idee in je eigen woorden kunt uitleggen.'},
    {type:'p',text:'Dat verschil wordt zichtbaarder nu we met AI kunnen praten. Een moeilijke alinea krijgt in een paar seconden een eenvoudiger versie. Een onbekend begrip verandert in een voorbeeld. Een lange tekst wordt een korte samenvatting. De drempel om een vraag te stellen wordt kleiner.'},
    {type:'p',text:'Maar snelheid is niet hetzelfde als inzicht. Als je ieder lastig stukje meteen overslaat, oefen je steeds minder met de moeite die bij leren hoort. Een leesassistent is daarom vooral interessant wanneer hij je helpt om langer bij een gedachte te blijven.'},
    {type:'h2',text:'Een vraag in de marge'},
    {type:'p',text:'Vroeger schreven lezers hun vragen in de kantlijn. Een uitroepteken bij een verrassende zin. Een vraagteken naast een stelling die te makkelijk klonk. Een verbinding met een ander boek. Die kleine aantekeningen maakten van lezen een gesprek.'},
    {type:'p',text:'Een digitale marge kan dat gesprek voortzetten. Selecteer de zin die je niet begrijpt en vraag om een concreet voorbeeld. Laat zien welke aanname eronder ligt. Vraag wat een criticus zou zeggen. De tekst blijft in het midden; de uitleg verschijnt ernaast.'},
    {type:'blockquote',text:'De beste vraag maakt een antwoord niet alleen duidelijker. Ze maakt ook zichtbaar wat je nog niet weet.'},
    {type:'p',text:'Dat is iets anders dan een assistent die voor je beslist wat belangrijk is. Je bepaalt zelf waar je aandacht naartoe gaat. De gemarkeerde passage is het beginpunt, jouw nieuwsgierigheid bepaalt de richting.'},
    {type:'h2',text:'Van herkennen naar begrijpen'},
    {type:'p',text:'Een tekst kan vertrouwd aanvoelen zonder dat je hem werkelijk kunt uitleggen. Dit noemen we een illusie van begrip: woorden herkennen voelt soms alsof je hun betekenis beheerst. Een eenvoudige manier om dat te onderzoeken is jezelf drie vragen te stellen.'},
    {type:'li',text:'Kan ik dit idee uitleggen aan iemand die de tekst niet heeft gelezen?'},
    {type:'li',text:'Kan ik een eigen voorbeeld bedenken, buiten het voorbeeld van de schrijver?'},
    {type:'li',text:'Weet ik ook wanneer dit idee niet opgaat?'},
    {type:'p',text:'Als een van die vragen lastig is, hoef je niet terug naar het begin. Kies precies die ene zin. Laat de assistent helpen, sluit de uitleg en probeer het opnieuw in je eigen woorden. Zo wordt de uitleg een opstap naar zelfstandig denken.'},
    {type:'h2',text:'Bewaar niet alles. Bewaar de gedachte.'},
    {type:'p',text:'Het is verleidelijk om een hele pagina geel te maken. Toch zegt een markering zonder notitie vaak weinig over waarom een passage je raakte. Eén zin met een korte eigen gedachte kan later meer waard zijn dan tien pagina’s vol kleur.'},
    {type:'p',text:'Schrijf daarom bij een markering wat je wilt onthouden. Een vraag die openblijft. Een toepassing in je werk. Een idee dat botst met wat je eerder dacht. Je notitieboek wordt dan geen opslagplaats van andermans zinnen, maar een spoor van je eigen denken.'},
    {type:'p',text:'De waarde van AI bij lezen zit misschien juist in die kleine ruimte tussen tekst en gedachte. Niet in het aantal pagina’s dat je sneller kunt verwerken, maar in het ene inzicht waarbij je even stilstaat.'}
  ]
};

let stored;
try { stored = JSON.parse(localStorage.getItem('gloss-reader-v1') || '{}'); } catch { stored = {}; }
let state = {
  articles: Array.isArray(stored.articles) ? stored.articles : [],
  notes: Array.isArray(stored.notes) ? stored.notes : [],
  preferences: {theme:'paper',font:'serif',size:19,leading:1.8,color:'yellow',language:'nl',...stored.preferences},
  currentId: stored.currentId || demo.id,
};
if (!state.articles.some(a => a.id === demo.id)) state.articles.unshift(demo);
if (!['nl','en'].includes(state.preferences.language)) state.preferences.language='nl';
const demos = {nl:demo,en:window.GlossI18n.demo};
if (!state.articles.some(a => a.id === demos.en.id)) state.articles.push(demos.en);
state.articles.forEach(article=>{
  if(article.source==='Eigen tekst'&&article.author==='Toegevoegd door jou')article.sourceType='own';
  if(article.id===demo.id&&!article.language)article.language='nl-NL';
});
let current = state.articles.find(a => a.id === state.currentId) || state.articles[0];
if(current.demo) current=state.articles.find(a=>a.id===demos[state.preferences.language].id);
let selection = null;
let conversation = null;
let filter = 'all';
let toastTimer;
let configured = false;
let ai = {provider:'openai',apiKey:'',model:'gpt-4.1-mini'};
let observer;
let readAloud = false;
let noteTarget = null;
const staticCopy = [];

function t(source) {
  return state.preferences.language==='en' ? window.GlossI18n.en[source] || source : source;
}

function captureStaticCopy() {
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()) {
    const node=walker.currentNode, source=node.textContent.trim();
    if(Object.hasOwn(window.GlossI18n.en,source)) staticCopy.push({node,source,original:node.textContent});
  }
  document.querySelectorAll('[aria-label],[title],[placeholder]').forEach(node=>{
    for(const attribute of ['aria-label','title','placeholder']) {
      const source=node.getAttribute(attribute);
      if(source&&Object.hasOwn(window.GlossI18n.en,source))staticCopy.push({node,attribute,source});
    }
  });
}

function applyLanguage() {
  document.documentElement.lang=state.preferences.language;
  staticCopy.forEach(({node,source,attribute,original})=>{
    if(!node.isConnected)return;
    if(attribute)node.setAttribute(attribute,t(source));
    else node.textContent=original.replace(source,t(source));
  });
  document.querySelectorAll('[data-language]').forEach(button=>{
    const active=button.dataset.language===state.preferences.language;
    button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
  });
  $('import-button').textContent=t($('import-button').disabled?'Even lezen…':'Open artikel →');
  $('key-hint').textContent=t($('ai-provider').value==='ollama'?'Start Ollama op deze computer en zorg dat het model is gedownload.':'Je sleutel blijft alleen in dit tabblad; we bewaren hem niet in je notitieboek.');
  $('ai-settings-status').textContent=configured?t('Er is al een OpenAI-sleutel ingesteld op de lokale server.'):'';
}

function switchLanguage(language) {
  if(conversation?.busy){notify(t('Wacht tot de assistent klaar is voordat je de taal wijzigt.'));return;}
  const homeVisible=!$('home-view').hidden;
  const previous=!current.demo?conversation:null;
  const questionDraft=$('question-input')?.value||'';
  state.preferences.language=language;
  if(current.demo)current=state.articles.find(a=>a.id===demos[language].id);
  applyLanguage();applyPreferences();renderArticle();
  if(homeVisible)showHome();
  else if(previous){conversation=previous;conversationShell();renderMessages();$('question-input').value=questionDraft;}
  save();
}

function notify(text) {
  $('toast').textContent = t(text);
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').hidden = true, 6000);
}

function save() {
  try { localStorage.setItem('gloss-reader-v1', JSON.stringify(state)); }
  catch { notify(t('Je browseropslag is vol. Exporteer je notities om ze veilig te bewaren.')); }
}

function textOf(article = current) { return article.blocks.map(b => b.text).join('\n\n'); }
function wordCount(article) { return textOf(article).split(/\s+/).length; }
function apiReady() { return ai.provider === 'ollama' || Boolean(ai.apiKey) || configured; }
function summaryOf(article=current) {
  if(article.demo)return article.summary||'';
  return article.summaries?.[state.preferences.language] ||
    (article.summaryLanguage===state.preferences.language||(!article.summaryLanguage&&state.preferences.language==='nl')?article.summary||'':'');
}

async function post(path, payload) {
  const response = await fetch(path, {method:'POST',headers:{'Content-Type':'application/json','Accept-Language':state.preferences.language},body:JSON.stringify({...payload,language:state.preferences.language})});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || t('Dit verzoek kon niet worden verwerkt.'));
  return result;
}

function applyPreferences() {
  const p = state.preferences;
  document.documentElement.dataset.theme = p.theme;
  document.documentElement.style.setProperty('--article-font', {serif:"Georgia, 'Times New Roman', serif",sans:"'DM Sans', sans-serif",mono:"ui-monospace, SFMono-Regular, monospace"}[p.font] || 'Georgia, serif');
  document.documentElement.style.setProperty('--article-size', `${p.size}px`);
  document.documentElement.style.setProperty('--article-leading', p.leading);
  document.querySelectorAll('[data-theme-choice]').forEach(b => b.classList.toggle('selected', b.dataset.themeChoice === p.theme));
  document.querySelectorAll('[data-font]').forEach(b => b.classList.toggle('active', b.dataset.font === p.font));
  document.querySelectorAll('[data-color]').forEach(b => { if (b.classList.contains('color-dot')) b.classList.toggle('selected', b.dataset.color === p.color); });
  $('font-size').value = p.size;
  $('font-size-label').textContent = `${p.size} px`;
  $('line-height').value = Math.round(p.leading * 10);
  $('line-height-label').textContent = Number(p.leading).toFixed(1);
  document.querySelector('meta[name="theme-color"]').content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
}

function renderBody() {
  const body = $('article-body');
  body.replaceChildren();
  const saved = state.notes.filter(n => n.articleId === current.id && Number.isFinite(n.start) && Number.isFinite(n.end));
  let offset = 0;
  current.blocks.forEach((block, i) => {
    const node = make(['p','h2','h3','li','blockquote','pre'].includes(block.type) ? block.type : 'p');
    node.id = `block-${i}`;
    node.dataset.offset = offset;
    const segments = saved.filter(n => n.start < offset + block.text.length && n.end > offset);
    const points = new Set([0, block.text.length]);
    segments.forEach(n => { points.add(Math.max(0,n.start-offset)); points.add(Math.min(block.text.length,n.end-offset)); });
    const bounds = [...points].sort((a,b) => a-b);
    for (let j=0;j<bounds.length-1;j++) {
      const start = bounds[j], end = bounds[j+1];
      const highlight = segments.find(n => n.start <= offset+start && n.end >= offset+end);
      if (highlight) {
        const mark = make('mark', '', block.text.slice(start,end));
        mark.dataset.color = highlight.color || 'yellow';
        mark.dataset.noteId = highlight.id;
        mark.addEventListener('click', () => {
          if (window.getSelection().toString().trim()) return;
          selection = {...highlight};
          if (highlight.type === 'answer') showSavedAnswer(highlight);
          else openNotebook();
        });
        node.append(mark);
      } else node.append(document.createTextNode(block.text.slice(start,end)));
    }
    body.append(node);
    offset += block.text.length;
  });
}

function renderArticle() {
  stopSpeech();
  state.currentId = current.id;
  $('article-title').textContent = current.title;
  document.title = `${current.title} — Gloss`;
  $('article-subtitle').textContent = current.subtitle || t('Alle ruimte voor de tekst. En voor jouw gedachten.');
  $('article-author').textContent = current.sourceType==='own'?t('Toegevoegd door jou'):current.author || current.source || t('Eigen tekst');
  $('article-source').textContent = current.sourceType==='own'?t('Eigen tekst'):current.source || t('Eigen tekst');
  $('reading-time').textContent = `${Math.max(1,Math.ceil(wordCount(current)/220))} ${t('min leestijd')}`;
  $('original-link').hidden = !current.url;
  $('summary-body').hidden = true;
  $('summary-toggle').setAttribute('aria-expanded','false');
  $('summary-chevron').textContent = '+';
  $('summary-body').textContent = summaryOf();
  renderBody();
  renderOutline();
  renderNotebook();
  showMarginWelcome();
  selection = null;
  conversation = null;
  $('selection-toolbar').hidden = true;
  save();
}

function renderOutline() {
  if (observer) observer.disconnect();
  const container = $('outline');
  container.replaceChildren();
  const sections = [{text:t('Begin'),index:0},...current.blocks.map((b,i)=>({text:b.text,index:i,type:b.type})).filter(b=>b.type==='h2'||b.type==='h3')];
  sections.forEach((section,i) => {
    const button = make('button',i===0?'active':'',section.text.length>26 ? section.text.slice(0,25)+'…' : section.text);
    button.title = section.text;
    button.dataset.block = `block-${section.index}`;
    button.addEventListener('click',()=>$(button.dataset.block).scrollIntoView({behavior:'smooth',block:'start'}));
    container.append(button);
  });
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      container.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.block===entry.target.id));
      $('dock-position').textContent=String(sections.findIndex(s=>`block-${s.index}`===entry.target.id)+1).padStart(2,'0');
    }
  },{rootMargin:'-10% 0px -65% 0px'});
  sections.forEach(section=>{const node=$(`block-${section.index}`);if(node) observer.observe(node);});
}

function showMarginWelcome() {
  document.body.classList.remove('conversation-open');
  const rail = $('annotation-rail');
  const wrapper = make('div','annotation-card');
  wrapper.append(make('div','annotation-heading',t('✧  EEN GEDACHTE IN DE MARGE')));
  const title = make('p','annotation-intro');
  title.append(document.createTextNode(t('Sta even ')),make('em','',t('stil.')));
  wrapper.append(title,make('p','annotation-helper',t('Selecteer een zin die je raakt of waar je over twijfelt. Stel een vraag, vraag om uitleg of bewaar je gedachte.')));
  if (current.demo) {
    const suggestions=make('div','suggestions');
    const button=make('button','',t('Probeer een voorbeelduitleg ↗'));
    button.id='try-example';
    button.addEventListener('click',()=>{
      const quote=current.id===demos.en.id?'But speed is not the same as insight.':'Maar snelheid is niet hetzelfde als inzicht.';
      const full=current.blocks.map(b=>b.text).join('');
      selection={quote,start:full.indexOf(quote),end:full.indexOf(quote)+quote.length};
      openConversation('explain');
    });
    suggestions.append(button);wrapper.append(suggestions);
  }
  rail.replaceChildren(wrapper);
}

function captureSelection() {
  if (!$('note-dialog').open && !$('settings-dialog').open) {
    const selected=window.getSelection();
    if (!selected.rangeCount || selected.isCollapsed || !selected.toString().trim()) { $('selection-toolbar').hidden=true;return; }
    const range=selected.getRangeAt(0), body=$('article-body');
    if (!body.contains(range.startContainer) || !body.contains(range.endContainer)) { $('selection-toolbar').hidden=true;return; }
    const before=document.createRange();before.selectNodeContents(body);before.setEnd(range.startContainer,range.startOffset);
    const quote=range.toString();
    if (quote.length>12000) {notify(t('Selecteer een kortere passage om een vraag te stellen.'));return;}
    selection={quote,start:before.toString().length,end:before.toString().length+quote.length};
    const rect=range.getBoundingClientRect();
    const toolbar=$('selection-toolbar');toolbar.hidden=false;
    const width=toolbar.offsetWidth;
    toolbar.style.left=`${Math.max(8,Math.min(window.innerWidth-width-8,rect.left+(rect.width-width)/2))}px`;
    toolbar.style.top=`${Math.max(5,rect.top-toolbar.offsetHeight-10)}px`;
  }
}

function demoAnswer(action, quote) {
  const sentence = quote.toLowerCase();
  if (action === 'define' && /begrip|begrijpen|herkennen|understand|recogniz/.test(sentence)) return t('Begrip betekent hier: je kunt een idee niet alleen herkennen, maar ook in je eigen woorden uitleggen, toepassen en kritisch onderzoeken. De “illusie van begrip” ontstaat wanneer herkenbare woorden dat vermogen groter laten lijken dan het is.');
  if (/snelheid|inzicht|overslaat|moeite|speed|insight|effort|skip/.test(sentence)) return t('Een snel antwoord is handig, maar je hebt het idee daarmee nog niet zelf doorgrond.\n\nDenk aan een wiskundesom: de uitkomst kennen is iets anders dan begrijpen waarom de stappen werken. De schrijver pleit ervoor AI te gebruiken om een lastig stukje te onderzoeken, zodat je het daarna zelf kunt uitleggen.');
  if (/antwoord|begrip|begrijpen|herkennen|answer|understand|recogniz/.test(sentence)) return t('De schrijver onderscheidt informatie krijgen van iets begrijpen. Begrip gaat een stap verder: je kunt het idee uitleggen zonder de oorspronkelijke formulering, een eigen voorbeeld geven en aangeven waar de gedachte ophoudt te kloppen.\n\nProbeer de passage eens in één zin aan een ander uit te leggen.');
  if (/marge|kantlijn|gesprek|vraag|margin|conversation|question/.test(sentence)) return t('De kantlijn is hier een plek voor actief lezen. Je reageert op de tekst met een vraag, een bezwaar of een verbinding. De digitale assistent kan daarop antwoorden, terwijl jij kiest welke passage aandacht verdient.');
  if (/notitie|bewaar|markering|gedachte|note|save|highlight|thought/.test(sentence)) return t('Een gemarkeerde zin laat zien wát je opviel. Een eigen notitie legt ook vast waaróm: een toepassing, een twijfel of een nieuw verband. Daardoor kun je later de gedachte achter de markering terugvinden.');
  return null;
}

function conversationShell() {
  document.body.classList.add('conversation-open');
  const card=make('section','annotation-card');
  const heading=make('div','annotation-heading');
  heading.append(make('span','',t('✧ In de marge')));
  const close=make('button','icon-button','×');close.setAttribute('aria-label',t('Uitleg sluiten'));close.addEventListener('click',()=>{conversation=null;showMarginWelcome();});heading.append(close);
  card.append(heading,make('p','annotation-eyebrow',apiReady()?t('JOUW LEESASSISTENT'):t('VOORBEELD · AI NOG NIET AANGESLOTEN')),make('blockquote','',conversation.target.quote));
  const messages=make('div','conversation-messages');messages.id='conversation-messages';card.append(messages);
  const actions=make('div','annotation-actions');
  const keep=make('button','',t('↗ Bewaar'));keep.addEventListener('click',saveAnswer);
  const note=make('button','',t('＋ Eigen notitie'));note.addEventListener('click',()=>openNote(conversation.target));
  actions.append(keep,note);card.append(actions);
  const suggestions=make('div','suggestions');
  for(const [question,label] of [[t('Geef een concreet voorbeeld.'),t('Een voorbeeld')],[t('Welke aanname zit hieronder?'),t('De aanname')]]) {
    const button=make('button','',label);button.addEventListener('click',()=>ask(question));suggestions.append(button);
  }
  card.append(suggestions);
  const form=make('form','annotation-form');
  const input=make('textarea');input.id='question-input';input.placeholder=t('Denk verder. Stel je vraag…');input.rows=1;input.setAttribute('aria-label',t('Vraag over de passage'));
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();form.requestSubmit();}});
  const send=make('button','','↑');send.id='send-question';send.type='submit';send.setAttribute('aria-label',t('Vraag versturen'));
  form.append(input,send);form.addEventListener('submit',async event=>{event.preventDefault();const q=input.value.trim();if(q&&await ask(q))input.value='';});card.append(form);
  $('annotation-rail').replaceChildren(card);
}

async function openConversation(action) {
  if (!selection) return;
  $('selection-toolbar').hidden=true;
  window.getSelection().removeAllRanges();
  conversation={target:{...selection},messages:[],busy:false,articleId:current.id};
  conversationShell();
  if(action==='ask') {$('question-input').focus();return;}
  const question=action==='define'?t('Definieer het belangrijkste begrip in deze passage.'):t('Leg deze passage eenvoudig uit.');
  const preview=current.demo&&!apiReady()?demoAnswer(action,selection.quote):null;
  if(preview){conversation.messages.push({role:'user',content:question},{role:'assistant',content:preview,demo:true});renderMessages();}
  else await ask(question);
}

function renderMessages() {
  const messages=$('conversation-messages');if(!messages||!conversation)return;
  messages.replaceChildren();
  for(const message of conversation.messages) {
    if(message.role==='user')messages.append(make('p','answer-question',message.content));
    else {
      if(message.demo)messages.append(make('p','annotation-eyebrow',t('VOORBEELDUITLEG')));
      messages.append(make('div','answer-text',message.content));
    }
  }
  if(conversation.busy)messages.append(make('p','pending-dots',t('De assistent leest mee…')));
}

async function ask(question) {
  if(!conversation||conversation.busy)return;
  const active=conversation;
  if(!apiReady()) {
    showAIError(t('Voor eigen vragen heb je een model nodig. Sluit AI aan om verder te praten over deze passage.'));return false;
  }
  active.busy=true;
  const history=active.messages.map(({role,content})=>({role,content}));
  active.messages.push({role:'user',content:question});renderMessages();$('send-question').disabled=true;
  try {
    const result=await post('/api/ask',{...ai,article:textOf(),selection:active.target.quote,question,history});
    active.messages.push({role:'assistant',content:result.answer});
    if(active===conversation)document.querySelector('.annotation-error')?.remove();
    return true;
  } catch(error) {
    active.messages.pop();
    if(active===conversation)showAIError(error.message);
    return false;
  } finally {
    active.busy=false;
    if(active===conversation){renderMessages();$('send-question').disabled=false;}
  }
}

function showAIError(message) {
  const form=document.querySelector('.annotation-form');if(!form)return;
  document.querySelector('.annotation-error')?.remove();
  const error=make('div','annotation-error',message);
  const button=make('button','',t('AI-instellingen openen →'));button.addEventListener('click',openSettings);error.append(button);form.before(error);
}

function addNote(target, type, content='', extra={}) {
  const note={id:crypto.randomUUID(),articleId:current.id,title:current.title,created:new Date().toISOString(),type,color:state.preferences.color,...target,content,...extra};
  state.notes.push(note);save();renderBody();renderNotebook();return note;
}
function highlight() {
  if(!selection)return;
  addNote(selection,'highlight');$('selection-toolbar').hidden=true;window.getSelection().removeAllRanges();notify(t('Markering bewaard in je notitieboek.'));
}
function openNote(target=selection) {
  if(!target)return;
  noteTarget={...target};$('selection-toolbar').hidden=true;$('note-quote').textContent=target.quote;$('note-text').value='';$('note-dialog').showModal();$('note-text').focus();
}
function saveAnswer() {
  if(!conversation)return;
  const answer=[...conversation.messages].reverse().find(m=>m.role==='assistant');
  if(!answer){notify(t('Stel eerst een vraag of voeg een eigen notitie toe.'));return;}
  const question=[...conversation.messages].reverse().find(m=>m.role==='user');
  addNote(conversation.target,'answer',answer.content,{question:question?.content||'',demo:Boolean(answer.demo)});notify(t('Passage en uitleg bewaard.'));
}
function showSavedAnswer(note) {
  conversation={target:{...note},messages:[{role:'user',content:note.question||t('Uitleg bij deze passage')},{role:'assistant',content:note.content,demo:note.demo}],busy:false,articleId:note.articleId};conversationShell();renderMessages();
}

function renderNotebook() {
  $('note-count').textContent=state.notes.length;
  const container=$('notebook-items');container.replaceChildren();
  const notes=[...state.notes].reverse().filter(n=>filter==='all'||(filter==='highlight'?n.type==='highlight':n.type!=='highlight'));
  if(!notes.length){const empty=make('div','notebook-empty');empty.append(make('span','','❧'),make('p','',t('Een zin. Een vraag. Een nieuw idee.\nSelecteer een passage en bewaar\nwat je wilt vasthouden.')));container.append(empty);}
  for(const note of notes){
    const card=make('div','notebook-card');const type=make('div','note-type',({highlight:t('↗ Markering'),note:t('＋ Eigen notitie'),answer:t('✧ Uitleg')}[note.type]||t('Notitie'))+(note.demo?t(' · voorbeeld'):''));
    const remove=make('button','','×');remove.setAttribute('aria-label',t('Notitie verwijderen'));remove.addEventListener('click',()=>{state.notes=state.notes.filter(n=>n.id!==note.id);save();renderBody();renderNotebook();});type.append(remove);card.append(type);
    const passage=make('button','note-passage');passage.dataset.color=note.color;passage.append(make('span','',note.quote));passage.title=t('Ga naar de passage');
    passage.addEventListener('click',()=>{
      const article=state.articles.find(a=>a.id===note.articleId);if(!article){notify(t('Dit artikel is niet meer beschikbaar.'));return;}
      if(current.id!==article.id){current=article;showReader();renderArticle();}
      if(window.innerWidth<850)closeNotebook();
      const mark=document.querySelector(`mark[data-note-id="${note.id}"]`);mark?.scrollIntoView({behavior:'smooth',block:'center'});
      if(note.type==='answer')showSavedAnswer(note);
    });card.append(passage);
    if(note.content)card.append(make('div','note-content',note.content));
    card.append(make('div','note-title',note.title));container.append(card);
  }
  $('export-notes').disabled=!state.notes.length;
}
function openNotebook(){ $('notebook-panel').hidden=false;document.body.classList.add('notebook-open');$('notebook-button').setAttribute('aria-expanded','true'); }
function closeNotebook(){ $('notebook-panel').hidden=true;document.body.classList.remove('notebook-open');$('notebook-button').setAttribute('aria-expanded','false'); }

function showHome() {
  stopSpeech();closeNotebook();$('reader-view').hidden=true;$('home-view').hidden=false;$('appearance-panel').hidden=true;$('selection-toolbar').hidden=true;document.body.classList.remove('focus','conversation-open');window.scrollTo(0,0);document.title=t('Gloss — lees met aandacht');
  const recent=$('recent-articles');recent.replaceChildren();
  recent.append(make('div','recent-heading',t('OP JE LEESTAFEL')));
  [...state.articles].filter(article=>!article.demo||article.id===demos[state.preferences.language].id).reverse().slice(0,8).forEach(article=>{
    const button=make('button','recent-card',article.title);button.append(make('span','',`${article.sourceType==='own'?t('Eigen tekst'):article.source||t('Eigen tekst')}  ↗`));button.addEventListener('click',()=>{current=article;showReader();renderArticle();});recent.append(button);
  });
}
function showReader(){$('home-view').hidden=true;$('reader-view').hidden=false;window.scrollTo(0,0);}
function openArticle(article){
  const existing=state.articles.findIndex(a=>a.id===article.id);
  if(existing>=0)current=state.articles[existing];
  else{state.articles.push(article);current=article;}
  showReader();renderArticle();
}

function openSettings(){$('settings-dialog').showModal();$('ai-settings-status').textContent=configured?t('Er is al een OpenAI-sleutel ingesteld op de lokale server.'):'';}
function stopSpeech(){if('speechSynthesis' in window)window.speechSynthesis.cancel();readAloud=false;$('speech-button').style.color='';$('speech-button').setAttribute('aria-label',t('Voorlezen'));}
function toggleSpeech(){
  if(!('speechSynthesis' in window)){notify(t('Deze browser ondersteunt geen voorlezen.'));return;}
  if(readAloud){stopSpeech();return;}
  if($('reader-view').hidden){notify(t('Open eerst een artikel.'));return;}
  const speech=new SpeechSynthesisUtterance(textOf());speech.lang=current.language||(state.preferences.language==='en'?'en-US':'nl-NL');speech.rate=.94;
  speech.onend=stopSpeech;speech.onerror=()=>{stopSpeech();notify(t('Voorlezen is gestopt. Controleer de beschikbare stemmen in je browser.'));};window.speechSynthesis.speak(speech);readAloud=true;$('speech-button').style.color='var(--accent)';$('speech-button').setAttribute('aria-label',t('Voorlezen stoppen'));
}

$('home-button').addEventListener('click',showHome);
$('library-button').addEventListener('click',showHome);
$('new-article-bottom').addEventListener('click',showHome);
$('demo-button').addEventListener('click',()=>{current=state.articles.find(a=>a.id===demos[state.preferences.language].id);showReader();renderArticle();});
document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>switchLanguage(button.dataset.language)));
$('notebook-button').addEventListener('click',()=>{$('notebook-panel').hidden?openNotebook():closeNotebook();});
$('close-notebook').addEventListener('click',closeNotebook);
$('appearance-button').addEventListener('click',()=>{$('appearance-panel').hidden=!$('appearance-panel').hidden;$('appearance-button').setAttribute('aria-expanded',String(!$('appearance-panel').hidden));});
$('settings-button').addEventListener('click',openSettings);
$('speech-button').addEventListener('click',toggleSpeech);
$('paste-button').addEventListener('click',()=>$('paste-dialog').showModal());
document.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
document.querySelectorAll('[data-theme-choice]').forEach(button=>button.addEventListener('click',()=>{state.preferences.theme=button.dataset.themeChoice;applyPreferences();save();}));
document.querySelectorAll('[data-font]').forEach(button=>button.addEventListener('click',()=>{state.preferences.font=button.dataset.font;applyPreferences();save();}));
document.querySelectorAll('.color-dot').forEach(button=>button.addEventListener('click',()=>{state.preferences.color=button.dataset.color;applyPreferences();save();}));
$('font-size').addEventListener('input',()=>{state.preferences.size=Number($('font-size').value);applyPreferences();save();});
$('line-height').addEventListener('input',()=>{state.preferences.leading=Number($('line-height').value)/10;applyPreferences();save();});
$('focus-button').addEventListener('click',()=>{document.body.classList.toggle('focus');$('appearance-panel').hidden=true;notify(t('Focusmodus aan. Druk op Esc om terug te keren.'));});
$('original-link').addEventListener('click',()=>{if(current.url)window.open(current.url,'_blank','noopener,noreferrer');});

$('summary-toggle').addEventListener('click',async()=>{
  if(!summaryOf()){
    if(!apiReady()){openSettings();notify(t('Sluit AI aan voor een samenvatting van je eigen artikel.'));return;}
    const article=current,language=state.preferences.language;$('summary-toggle').disabled=true;
    try{const result=await post('/api/ask',{...ai,article:textOf(article),selection:'',question:t('Vat dit artikel samen in één korte alinea. Benoem de hoofdgedachte en maximaal drie belangrijke punten.')});article.summaries={...article.summaries,[language]:result.answer};save();if(current.id!==article.id||state.preferences.language!==language)return;$('summary-body').textContent=result.answer;}
    catch(error){notify(error.message);return;}
    finally{$('summary-toggle').disabled=false;}
  }
  $('summary-body').hidden=!$('summary-body').hidden;$('summary-toggle').setAttribute('aria-expanded',String(!$('summary-body').hidden));$('summary-chevron').textContent=$('summary-body').hidden?'+':'−';
});
$('selection-toolbar').addEventListener('pointerdown',event=>event.preventDefault());
$('selection-toolbar').addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  const action=button.dataset.action;if(action==='highlight')highlight();else if(action==='note')openNote();else openConversation(action);
});
document.addEventListener('pointerup',event=>{if(!event.target.closest('#selection-toolbar'))setTimeout(captureSelection,20);});
document.addEventListener('keyup',event=>{if(event.key==='Shift')captureSelection();});
document.addEventListener('keydown',event=>{
  const typing=event.target.closest('input,textarea,select');
  if(event.key==='Escape'){document.body.classList.remove('focus');$('appearance-panel').hidden=true;$('appearance-button').setAttribute('aria-expanded','false');$('selection-toolbar').hidden=true;closeNotebook();}
  if(!typing&&!document.querySelector('dialog[open]')&&event.key.toLowerCase()==='f'&&!event.metaKey&&!event.ctrlKey&&!$('reader-view').hidden){event.preventDefault();document.body.classList.toggle('focus');}
});
document.addEventListener('pointerdown',event=>{if(!event.target.closest('#appearance-panel,#appearance-button')){$('appearance-panel').hidden=true;$('appearance-button').setAttribute('aria-expanded','false');}});
window.addEventListener('scroll',()=>{
  $('selection-toolbar').hidden=true;
  const max=document.documentElement.scrollHeight-window.innerHeight;$('progress').style.width=`${max>0?Math.min(100,window.scrollY/max*100):0}%`;
},{passive:true});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-selected',String(b===button));});renderNotebook();}));

$('url-form').addEventListener('submit',async event=>{
  event.preventDefault();const button=$('import-button');button.disabled=true;button.textContent=t('Even lezen…');
  try{const article=await post('/api/import',{url:$('url-input').value});openArticle(article);}
  catch(error){notify(error.message);}
  finally{button.disabled=false;button.textContent=t('Open artikel →');}
});
$('paste-form').addEventListener('submit',event=>{
  event.preventDefault();const text=$('paste-text').value.trim();if(text.length<40){notify(t('Plak minstens een paar zinnen om een artikel te maken.'));return;}
  if(text.length>160000){notify(t('Deze tekst is te lang. Gebruik maximaal 160.000 tekens.'));return;}
  const blocks=text.split(/\n\s*\n/).filter(Boolean).map(p=>({type:p.startsWith('## ')?'h2':'p',text:p.replace(/^## /,'').trim()}));
  openArticle({id:crypto.randomUUID(),title:$('paste-title').value.trim(),source:t('Eigen tekst'),author:t('Toegevoegd door jou'),sourceType:'own',language:state.preferences.language==='en'?'en-US':'nl-NL',blocks,demo:false});$('paste-dialog').close();$('paste-form').reset();
});
$('note-form').addEventListener('submit',event=>{event.preventDefault();const text=$('note-text').value.trim();if(!text||!noteTarget)return;addNote(noteTarget,'note',text);$('note-dialog').close();notify(t('Je gedachte is bewaard.'));});
$('ai-provider').addEventListener('change',()=>{
  const local=$('ai-provider').value==='ollama';$('key-field').hidden=local;$('key-hint').textContent=local?t('Start Ollama op deze computer en zorg dat het model is gedownload.'):t('Je sleutel blijft alleen in dit tabblad; we bewaren hem niet in je notitieboek.');$('ai-model').value=local?'llama3.2':'gpt-4.1-mini';
});
$('settings-form').addEventListener('submit',event=>{event.preventDefault();ai={provider:$('ai-provider').value,apiKey:$('api-key').value.trim(),model:$('ai-model').value.trim()};$('settings-dialog').close();notify(t('Aansluiting ingesteld. Je volgende vraag wordt naar dit model gestuurd.'));});
$('export-notes').addEventListener('click',()=>{
  const md=[t('# Mijn leesnotities'),'',...state.notes.flatMap(note=>[`## ${note.title}`,'',`> ${note.quote.replace(/\n/g,'\n> ')}`,'',...(note.question?[`${t("**Vraag:**")} ${note.question}`,'']:[]),...(note.demo?[t('_Voorbeelduitleg_'),'']:[]),note.content||t('_Markering_'), '',`${t('Bewaard:')} ${new Date(note.created).toLocaleDateString(state.preferences.language==='en'?'en-US':'nl-NL')}`,'','---',''])].join('\n');
  const url=URL.createObjectURL(new Blob([md],{type:'text/markdown;charset=utf-8'}));const a=make('a');a.href=url;a.download=t('gloss-leesnotities.md');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify(t('Je notities zijn geëxporteerd.'));
});

captureStaticCopy();applyLanguage();applyPreferences();renderArticle();
fetch('/api/status').then(r=>r.json()).then(result=>{configured=result.openaiConfigured;ai.model=result.defaultModel;$('ai-model').value=ai.model;}).catch(()=>notify(t('De lokale server is niet bereikbaar. Start server.py om links en AI te gebruiken.')));
