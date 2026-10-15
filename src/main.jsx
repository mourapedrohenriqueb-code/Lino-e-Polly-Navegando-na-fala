import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Volume2,Mic,Star,Lock,ArrowLeft,Settings,Home,Check,BookOpen,Trophy,ShoppingBag,Speaker,BrainCircuit,Waves,Heart,Copy,Share2,ExternalLink} from 'lucide-react';
import QRCode from 'qrcode';
import { getInitialProgress, getUnlockedIslands } from './gameLogic';
import './styles.css';

const baseIslands = [
 {id:1,x:13,y:34,title:'Ilha do Alfabeto',word:'A',answer:'A',type:'letra',desc:'Comece com a primeira letra e o primeiro som do pirata.',difficulty:'Fácil'},
 {id:2,x:32,y:12,title:'Ilha das Sílabas',word:'PA',answer:'PA',type:'silaba',desc:'Repita sílabas fortes para ganhar equilíbrio na fala.',difficulty:'Fácil'},
 {id:3,x:54,y:10,title:'Ilha das Palavras',word:'CASA',answer:'CASA',type:'palavra',desc:'Diga palavras curtas e bem claras.',difficulty:'Média'},
 {id:4,x:52,y:55,title:'Ilha das Frases Curtas',word:'BOLA',answer:'BOLA',type:'frase-curta',desc:'Fale uma palavra com confiança e siga o comando do pirata.',difficulty:'Média'},
 {id:5,x:77,y:57,title:'Ilha das Frases Médias',word:'EU GOSTO DE CANTAR',answer:'EU GOSTO DE CANTAR',type:'frase-media',desc:'Produza uma frase de tamanho médio com clareza.',difficulty:'Média'},
 {id:6,x:74,y:10,title:'Ilha das Frases Grandes',word:'HOJE EU VOU AO PARQUE COM MEUS AMIGOS',answer:'HOJE EU VOU AO PARQUE COM MEUS AMIGOS',type:'frase-grande',desc:'Fale com ritmo e atenção para cada palavra.',difficulty:'Difícil'},
 {id:7,x:95,y:14,title:'Ilha dos Textos Curtos',word:'A CASA É BONITA',answer:'A CASA É BONITA',type:'texto-curto',desc:'Leia um texto pequeno com boa entonação.',difficulty:'Difícil'},
 {id:8,x:29,y:40,title:'Ilha dos Textos Médios',word:'NO MEU DIA A DIA EU ESCUTO, FALO E APRENDO COM PACIÊNCIA',answer:'NO MEU DIA A DIA EU ESCUTO, FALO E APRENDO COM PACIÊNCIA',type:'texto-medio',desc:'Escolha a voz certa e fale com calma.',difficulty:'Muito difícil'},
 {id:9,x:95,y:88,title:'Ilha dos Textos Grandes',word:'MEU PIRATA PREFERIDO ESTUDA TODOS OS DIAS, FALA COM ALEGRIA E A CADA PALAVRA APRENDE UMA NOVA HISTÓRIA',answer:'MEU PIRATA PREFERIDO ESTUDA TODOS OS DIAS, FALA COM ALEGRIA E A CADA PALAVRA APRENDE UMA NOVA HISTÓRIA',type:'texto-grande',desc:'Desafio final: fale todo o texto com fluidez e clareza.',difficulty:'Desafio final'}
];

const shopItems = [
 {id:'boca-1',name:'Boca dourada',price:45,icon:'✨'},
 {id:'boca-2',name:'Boca cívica',price:70,icon:'🏅'},
 {id:'voz-1',name:'Voz pirata',price:80,icon:'🎧'},
 {id:'bot-1',name:'Fone laranja',price:60,icon:'🔊'}
];

const normalizeText=(text='')=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9\s]/g,' ').replace(/\s+/g,' ').trim().toUpperCase();
const assetUrl=(name)=>`${import.meta.env.BASE_URL}assets/${name}`;

const copyTextToClipboard=async(text)=>{
 try{
   if(navigator.clipboard?.writeText){
     await navigator.clipboard.writeText(text);
     return;
   }
 }catch{}

 const textarea=document.createElement('textarea');
 textarea.value=text;
 textarea.setAttribute('readonly','');
 textarea.style.position='fixed';
 textarea.style.opacity='0';
 document.body.appendChild(textarea);
 textarea.select();
 const copied=document.execCommand('copy');
 textarea.remove();
 if(!copied){
   throw new Error('Não foi possível copiar o texto.');
 }
};

function App(){
 const [screen,setScreen]=useState('home');
 const [selectedIslandId,setSelectedIslandId]=useState(1);
 const [xp,setXp]=useState(120);
 const [coins,setCoins]=useState(80);
 const [completed,setCompleted]=useState(getInitialProgress());
 const [voiceEnabled,setVoiceEnabled]=useState(true);
 const [soundEnabled,setSoundEnabled]=useState(true);
 const [ambientEnabled,setAmbientEnabled]=useState(()=>window.localStorage.getItem('fonoAmbientEnabled') !== 'false');
 const [recognitionEnabled,setRecognitionEnabled]=useState(true);
 const [listening,setListening]=useState(false);
 const [speaking,setSpeaking]=useState(false);
 const [linoGreeting,setLinoGreeting]=useState(false);
 const [message,setMessage]=useState('');
 const [ownedItems,setOwnedItems]=useState(['boca-1']);
 const ambientAudioRef=useRef(null);

 const islands = useMemo(() => getUnlockedIslands(baseIslands, completed), [completed]);

 const selectedIsland = islands.find((island)=>island.id === selectedIslandId) ?? islands[0];

 const startAmbientAudio=()=>{
   if(!ambientEnabled){
     return;
   }
   if(ambientAudioRef.current){
     ambientAudioRef.current.context.resume();
     return;
   }
   const AudioContextAPI=window.AudioContext || window.webkitAudioContext;
   if(!AudioContextAPI){
     return;
   }
   const context=new AudioContextAPI();
   const output=context.createGain();
    output.gain.value=0.09;
   output.connect(context.destination);
   const buffer=context.createBuffer(1,context.sampleRate * 3,context.sampleRate);
   const data=buffer.getChannelData(0);
   for(let index=0;index<data.length;index+=1){
    data[index]=(Math.random() * 2 - 1) * 0.48;
   }
   const noise=context.createBufferSource();
   noise.buffer=buffer;
   noise.loop=true;
   const filter=context.createBiquadFilter();
   filter.type='lowpass';
   filter.frequency.value=620;
   filter.Q.value=0.7;
   noise.connect(filter);
   filter.connect(output);
   noise.start();
   const playSeagull=()=>{
     const call=context.createOscillator();
     const callGain=context.createGain();
     const now=context.currentTime;
     call.type='sine';
     call.frequency.setValueAtTime(980,now);
     call.frequency.linearRampToValueAtTime(1450,now + 0.16);
     call.frequency.linearRampToValueAtTime(1080,now + 0.34);
     callGain.gain.setValueAtTime(0.0001,now);
      callGain.gain.exponentialRampToValueAtTime(0.05,now + 0.05);
     callGain.gain.exponentialRampToValueAtTime(0.0001,now + 0.38);
     call.connect(callGain);
     callGain.connect(output);
     call.start(now);
     call.stop(now + 0.4);
   };
   const seagullTimer=window.setInterval(playSeagull,7800);
   ambientAudioRef.current={context,noise,output,seagullTimer};
   context.resume();
 };

 const stopAmbientAudio=()=>{
   const ambientAudio=ambientAudioRef.current;
   if(!ambientAudio){
     return;
   }
   window.clearInterval(ambientAudio.seagullTimer);
   ambientAudio.noise.stop();
   ambientAudio.context.close();
   ambientAudioRef.current=null;
 };

 useEffect(()=>{
   const handleInteraction=()=>startAmbientAudio();
   if(ambientEnabled && screen === 'home'){
     window.addEventListener('pointerdown',handleInteraction);
     document.addEventListener('visibilitychange',handleInteraction);
   }else{
     stopAmbientAudio();
   }
   return ()=>{
     window.removeEventListener('pointerdown',handleInteraction);
     document.removeEventListener('visibilitychange',handleInteraction);
   };
 },[ambientEnabled,screen]);

 useEffect(()=>{
   window.localStorage.setItem('fonoAmbientEnabled',String(ambientEnabled));
 },[ambientEnabled]);

 const speakText=(text)=>{
   if(!text || !voiceEnabled || !('speechSynthesis' in window)){
     setMessage('A voz do navegador está desligada ou não é compatível.');
     return;
   }
   if(!soundEnabled){
     setMessage('O som está desativado nas configurações.');
     return;
   }
   const utterance = new SpeechSynthesisUtterance(text);
   utterance.lang = 'pt-BR';
   utterance.rate = 0.9;
   utterance.pitch = 1.15;
   utterance.onstart = () => setSpeaking(true);
   utterance.onend = () => setSpeaking(false);
   utterance.onerror = () => setSpeaking(false);
   window.speechSynthesis.cancel();
   window.speechSynthesis.speak(utterance);
 };

 const greetWithLino=()=>{
   setLinoGreeting(true);
   window.setTimeout(() => setLinoGreeting(false), 3600);
 };

 useEffect(()=>{
   if(screen !== 'home'){
     return undefined;
   }
   const greetingTimer = window.setTimeout(greetWithLino, 650);
   return () => window.clearTimeout(greetingTimer);
 },[screen]);

 const handleVoiceInput=()=>{
   if(!recognitionEnabled){
     setMessage('O reconhecimento de voz está desativado nas configurações.');
     return;
   }

   const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
   if(!SpeechRecognitionAPI){
     setMessage('Seu navegador não oferece reconhecimento de voz. Use Chrome ou Edge.');
     return;
   }

   const recognition = new SpeechRecognitionAPI();
   recognition.lang = 'pt-BR';
   recognition.interimResults = true;
   recognition.continuous = false;
   recognition.maxAlternatives = 1;

   recognition.onstart = () => {
     setListening(true);
     setMessage('Ouvindo sua fala...');
   };

   recognition.onend = () => setListening(false);

   recognition.onerror = (event) => {
     setListening(false);
     setMessage(`Não consegui ouvir direito: ${event.error}. Tente outra vez.`);
   };

   recognition.onresult = (event) => {
     const resultIndex = event.resultIndex;
     const result = event.results[resultIndex];

     if(!result){
       return;
     }

     const transcript = Array.from(event.results)
       .map((item) => item[0]?.transcript ?? '')
       .join(' ')
       .trim();

     const normalizedTranscript = normalizeText(transcript);
     const expected = normalizeText(selectedIsland.answer);
     const isCorrect = normalizedTranscript.includes(expected) || expected.includes(normalizedTranscript) || normalizedTranscript === expected;

     if(result.isFinal){
       if(isCorrect){
         const nextCompleted = Math.max(completed, selectedIsland.id);
         setCompleted(nextCompleted);
         setXp((value)=>value + 30);
         setCoins((value)=>value + 15);
         setMessage('Muito bem! Você acertou e avançou na ilha.');
         setListening(false);
         recognition.stop();

         if(selectedIsland.id < islands.length){
           setTimeout(() => {
             const nextIsland = islands.find((island) => island.id === selectedIsland.id + 1);
             if(nextIsland){
               setSelectedIslandId(nextIsland.id);
               setMessage(`Parabéns! A próxima ilha já está liberada: ${nextIsland.title}.`);
             }
           }, 900);
         }
         return;
       }

       setMessage(`Você falou “${result[0].transcript}”. Tente novamente.`);
       return;
     }

     if(transcript){
       setMessage(`Ouvindo: “${transcript}”`);
     }
   };

   recognition.start();
 };

 const openIsland = (island) => {
   if(!island.unlocked){
     setMessage('Complete a ilha anterior para liberar esta etapa.');
     return;
   }
   setSelectedIslandId(island.id);
   setScreen('lesson');
   setMessage('');
 };

 const buyItem=(item)=>{
   if(ownedItems.includes(item.id)){
     setMessage(`${item.name} já está no seu inventário.`);
     return;
   }
   if(coins < item.price){
     setMessage(`Faltam ${item.price - coins} moedas para comprar este item.`);
     return;
   }
   setCoins((value)=>value - item.price);
   setOwnedItems((items)=>[...items,item.id]);
   setMessage(`${item.name} comprado com sucesso!`);
 };

 return (
   <div className="app">
     {screen === 'home' && (
       <>
         <header className="hud">
           <div className="profile">
             <div className={`avatar ${speaking ? 'speaking' : ''}`}>
               <img src={assetUrl('lino.png')} alt="Avatar do aluno" />
               <span className="mouth" />
             </div>
             <div>
               <b>Pedro</b>
               <span>Nível {Math.max(1, Math.floor((xp + 1) / 60))}</span>
               <div className="xpbar"><i style={{width:`${(xp % 300) / 3}%`}} /></div>
             </div>
           </div>
           <div className="hudRight">
             <div className="coin">⭐ <b>{xp}</b></div>
             <button type="button" onClick={() => setScreen('settings')} aria-label="Configurações"><Settings size={20} /></button>
           </div>
         </header>

         <main className="mapWrap">
           <img className="map" src={assetUrl('map.png')} alt="Mapa de ilhas" />
           <div className="titleRibbon">
             <strong>FonoPirata</strong>
             <small>Fale • Aprenda • Conquiste</small>
           </div>
           <div className="route route1" />
           <div className="route route2" />
           <div className="route route3" />
           <div className="mapBoat boatOne" aria-hidden="true">⛵</div>
           <div className="mapBoat boatTwo" aria-hidden="true">⛵</div>
           {islands.map((island) => (
             <button
               key={island.id}
               type="button"
               className={`islandNode ${!island.unlocked ? 'locked' : ''}`}
               style={{left: `${island.x}%`, top: `${island.y}%`, '--island-delay': `${island.id * -0.42}s`}}
               onClick={() => openIsland(island)}
             >
               <span>{island.unlocked ? island.id : <Lock size={20} />}</span>
             </button>
           ))}
           <button type="button" className={`mascot linoMap ${linoGreeting ? 'greeting' : ''}`} onClick={greetWithLino} aria-label="Mostrar saudação do Lino" title="Mostrar saudação do Lino"><span className="linoBubble">Ahoy, Está na hora da lição, Ahoy</span><img src={assetUrl('lino.png')} alt="Mascote Lino" /></button>
           <div className="mascot pollyMap"><img src={assetUrl('polly.png')} alt="Mascote Polly" /></div>
         </main>

         <nav className="bottom">
           <button type="button" className="active"><Home /><span>Mapa</span></button>
           <button type="button" onClick={() => setScreen('progress')}><Trophy /><span>Progresso</span></button>
           <button type="button" onClick={() => setScreen('shop')}><ShoppingBag /><span>Loja</span></button>
           <button type="button" onClick={() => setScreen('donation')}><Heart /><span>Doação</span></button>
           <button type="button" onClick={() => setScreen('share')}><Share2 /><span>Link</span></button>
           <button type="button" onClick={() => setScreen('settings')}><Settings /><span>Config</span></button>
         </nav>
       </>
     )}

     {screen === 'lesson' && (
       <Lesson
         island={selectedIsland}
         onBack={() => setScreen('home')}
         speak={() => speakText(selectedIsland.answer)}
         listen={handleVoiceInput}
         listening={listening}
         speaking={speaking}
         message={message}
         onClearMessage={() => setMessage('')}
       />
     )}

     {screen === 'progress' && <Progress xp={xp} completed={completed} islands={islands} onBack={() => setScreen('home')} />}

     {screen === 'shop' && <Shop onBack={() => setScreen('home')} coins={coins} items={shopItems} ownedItems={ownedItems} onBuy={buyItem} />}

    {screen === 'donation' && <Donation onBack={() => setScreen('home')} />}

    {screen === 'share' && <ShareApp onBack={() => setScreen('home')} />}

     {screen === 'settings' && (
       <SettingsScreen
         onBack={() => setScreen('home')}
         voiceEnabled={voiceEnabled}
         soundEnabled={soundEnabled}
         recognitionEnabled={recognitionEnabled}
         ambientEnabled={ambientEnabled}
         onToggleVoice={() => setVoiceEnabled((value) => !value)}
         onToggleSound={() => setSoundEnabled((value) => !value)}
         onToggleRecognition={() => setRecognitionEnabled((value) => !value)}
         onToggleAmbient={() => setAmbientEnabled((value) => !value)}
       />
     )}
   </div>
 );
}

function Lesson({island,onBack,speak,listen,listening,message,onClearMessage,speaking})
{
 return (
   <div className="lesson">
     <button type="button" className="back" onClick={onBack}><ArrowLeft /></button>
     <div className="lessonHero">
       <div className="islandCard">
         <img src={assetUrl('map.png')} alt={island.title} />
         <div className="islandOverlay">
           <h1>{island.title}</h1>
           <p>{island.desc}</p>
         </div>
       </div>
       <div className={`faceDemo ${speaking ? 'active' : ''}`}>
         <div className="head3d">
           <span className="eye left" />
           <span className="eye right" />
           <span className="cheek left" />
           <span className="cheek right" />
           <div className="mouth3d">
             <span className="upperLip" />
             <span className="lowerLip" />
             <span className="tongue" />
           </div>
         </div>
       </div>
     </div>

     <section className="practice">
       <div className="paper">
         <div className="wordRow">
           <h2>{island.answer}</h2>
           <button type="button" className="sound" onClick={speak} aria-label="Ouvir palavra"><Volume2 /></button>
         </div>
         <p>Escute a palavra e depois fale no microfone com clareza.</p>
         <button type="button" className="mic" onClick={listen}>
           <Mic size={42} />
           <span>{listening ? 'Ouvindo...' : 'Falar palavra'}</span>
         </button>
         {message && (
           <div className={`feedback ${message.includes('Muito bem') ? 'ok' : 'try'}`}>
             {message}
             {message.includes('Muito bem') && <Check />}
             <button type="button" className="closeMessage" onClick={onClearMessage}>×</button>
           </div>
         )}
       </div>
       <img className="pollyLesson" src={assetUrl('polly.png')} alt="Polly" />
     </section>
   </div>
 );
}

function Progress({xp,completed,islands,onBack})
{
 return (
   <div className="progress">
     <button type="button" className="back" onClick={onBack}><ArrowLeft /></button>
     <div className="parchment">
       <h1>Meu Progresso</h1>
       <div className="progressTop">
         <img src={assetUrl('lino.png')} alt="Pedro" />
         <div>
           <h2>Pedro</h2>
           <p>Nível {Math.max(1, Math.floor((xp + 1) / 60))}</p>
           <div className="longbar"><i style={{width:`${(xp / 300) * 100}%`}} /></div>
           <b>{xp} / 300 XP</b>
         </div>
       </div>
       <h3>Ilhas Concluídas</h3>
       <div className="badges">
         {islands.map((island) => (
           <div key={island.id} className={island.id > completed ? 'lockedBadge' : 'badge'}>
             {island.id > completed ? <Lock /> : <Star fill="currentColor" />}
             <span>{island.id > completed ? `Bloqueada` : `Ilha ${island.id}`}</span>
           </div>
         ))}
       </div>
       <h3>Conquistas</h3>
       <div className="ach">
         <div>⭐<span>1ª Palavra</span></div>
         <div>🎤<span>10 Acertos</span></div>
         <div>🏝️<span>{completed} Ilhas</span></div>
         <div>👑<span>Fala Bem</span></div>
       </div>
     </div>
   </div>
 );
}

function Shop({onBack,coins,items,ownedItems,onBuy})
{
 return (
   <div className="shop">
     <button type="button" className="back" onClick={onBack}><ArrowLeft /></button>
     <div className="panel">
       <h1>Loja do Pirata</h1>
       <div className="coinRow">⭐ <b>{coins}</b> moedas</div>
       <div className="shopList">
         {items.map((item) => (
           <div key={item.id} className="shopItem">
             <div className="shopIcon">{item.icon}</div>
             <div>
               <h3>{item.name}</h3>
               <p>{item.price} moedas</p>
             </div>
             <button type="button" onClick={() => onBuy(item)} disabled={ownedItems.includes(item.id)}>
               {ownedItems.includes(item.id) ? 'Comprado' : 'Comprar'}
             </button>
           </div>
         ))}
       </div>
     </div>
   </div>
 );
}

function Donation({onBack})
{
 const pixKey='mourapedrohenriqueb@gmail.com';
 const [copyStatus,setCopyStatus]=useState('');

 const copyPixKey=async()=>{
   try{
     await copyTextToClipboard(pixKey);
     setCopyStatus('Copiada!');
   }catch{
     setCopyStatus('Falha ao copiar');
   }
   window.setTimeout(() => setCopyStatus(''),2200);
 };

 return (
   <div className="donation shop">
     <button type="button" className="back" onClick={onBack}><ArrowLeft /></button>
     <div className="panel donationPanel">
       <div className="donationHeart"><Heart fill="currentColor" /></div>
       <h1>Doação para o projeto</h1>
       <p className="donationText">Sua contribuição ajuda o FonoPirata a continuar levando atividades de fala e aprendizagem para mais pessoas.</p>
       <div className="pixBox">
         <span>Chave Pix</span>
         <strong>{pixKey}</strong>
         <button type="button" onClick={copyPixKey}><Copy size={17} />{copyStatus || 'Copiar chave'}</button>
       </div>
     </div>
   </div>
 );
}

function ShareApp({onBack})
{
 const appLink=new URL(import.meta.env.BASE_URL,window.location.origin).href;
 const qrCanvasRef=useRef(null);
 const [copyStatus,setCopyStatus]=useState('');

 useEffect(()=>{
   if(qrCanvasRef.current){
     QRCode.toCanvas(qrCanvasRef.current,appLink,{width:176,margin:2,color:{dark:'#3b2417',light:'#fff8e6'}});
   }
 },[appLink]);

 const copyLink=async()=>{
   try{
     await copyTextToClipboard(appLink);
     setCopyStatus('Copiado!');
   }catch{
     setCopyStatus('Falha ao copiar');
   }
   window.setTimeout(() => setCopyStatus(''),2200);
 };

 return (
   <div className="shareApp shop">
     <button type="button" className="back" onClick={onBack}><ArrowLeft /></button>
     <div className="panel sharePanel">
       <div className="shareIcon"><Share2 /></div>
       <h1>Compartilhar aplicativo</h1>
       <p className="donationText">Envie este link para outras pessoas entrarem no FonoPirata.</p>
       <div className="linkBox">
         <span>Link do aplicativo</span>
         <div className="qrCodeBox">
           <canvas ref={qrCanvasRef} aria-label="QR Code para abrir o aplicativo" />
           <small>Aponte a câmera do celular para abrir</small>
         </div>
         <strong>{appLink}</strong>
         <div className="linkActions">
           <button type="button" onClick={copyLink}><Copy size={17} />{copyStatus || 'Copiar link'}</button>
           <a href={appLink} target="_blank" rel="noreferrer"><ExternalLink size={17} />Abrir</a>
         </div>
       </div>
     </div>
   </div>
 );
}

function SettingsScreen({onBack,voiceEnabled,soundEnabled,recognitionEnabled,ambientEnabled,onToggleVoice,onToggleSound,onToggleRecognition,onToggleAmbient})
{
 return (
   <div className="settingsScreen">
     <button type="button" className="back" onClick={onBack}><ArrowLeft /></button>
     <div className="panel">
       <h1>Configurações</h1>
       <div className="settingsList">
         <button type="button" className="switchRow" onClick={onToggleVoice}>
           <Speaker size={18} />
           <span>Fala da voz</span>
           <strong>{voiceEnabled ? 'Ligado' : 'Desligado'}</strong>
         </button>
         <button type="button" className="switchRow" onClick={onToggleSound}>
           <Volume2 size={18} />
           <span>Áudio do app</span>
           <strong>{soundEnabled ? 'Ligado' : 'Desligado'}</strong>
         </button>
         <button type="button" className="switchRow" onClick={onToggleRecognition}>
           <BrainCircuit size={18} />
           <span>Reconhecimento de voz</span>
           <strong>{recognitionEnabled ? 'Ligado' : 'Desligado'}</strong>
         </button>
         <button type="button" className="switchRow" onClick={onToggleAmbient}>
           <Waves size={18} />
           <span>Som calmo do mar</span>
           <strong>{ambientEnabled ? 'Ligado' : 'Desligado'}</strong>
         </button>
       </div>
     </div>
   </div>
 );
}

createRoot(document.getElementById('root')).render(<App />);
