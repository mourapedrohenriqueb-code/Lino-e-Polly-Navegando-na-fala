import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Volume2,Mic,Star,Lock,ArrowLeft,Settings,Home,Check,BookOpen,Trophy,ShoppingBag,Speaker,BrainCircuit,Waves,Heart,Copy,Share2,ExternalLink,LogIn,LogOut,Languages,Target,Lightbulb,Headphones,Bookmark,Compass,AudioLines} from 'lucide-react';
import QRCode from 'qrcode';
import { alphabetLetters, bookRecommendations, getDiagnosticQuestions, getDiagnosticSummary, getInitialProgress, getSyllableGuide, getUnlockedIslands, phraseBank, portugueseSyllables, textBank, wordBank } from './gameLogic';
import { observeAndTranslate, translateTexts } from './services/autoTranslate';
import { supabaseClient, supabaseConfigured, supabaseConfigurationMessage } from './services/supabaseClient';
import './styles.css';

const baseIslands = [
 {id:1,x:13,y:34,title:'Ilha do Alfabeto',word:'A',answer:'A',type:'letra',desc:'Explore todas as letras do alfabeto e fortaleça os sons iniciais da fala.',difficulty:'Fácil',examples: alphabetLetters},
 {id:2,x:31,y:15,title:'Ilha das Sílabas',word:'PA',answer:'PA',type:'silaba',desc:'Pratique sílabas frequentes do português, organizadas para leitura e fala.',difficulty:'Fácil',examples: portugueseSyllables},
 {id:3,x:50,y:11,title:'Ilha das Palavras',word:'CASA',answer:'CASA',type:'palavra',desc:'Diga palavras do cotidiano com entonação e precisão.',difficulty:'Média',examples: wordBank},
 {id:4,x:68,y:44,title:'Ilha das Frases',word:phraseBank[0],answer:phraseBank[0],type:'frase',desc:'Pratique frases variadas para trabalhar clareza e fluência.',difficulty:'Média',examples: phraseBank},
 {id:5,x:85,y:17,title:'Ilha dos Textos',word:textBank[0],answer:textBank[0],type:'texto',desc:'Leia textos curtos com entonação, ritmo e boa fluência.',difficulty:'Difícil',examples: textBank},
 {id:6,x:84,y:55,title:'Ilha dos Livros Infantis',word:bookRecommendations[0].title,answer:bookRecommendations[0].title,type:'livros',desc:'Conheça livros infantis disponíveis gratuitamente em bibliotecas digitais.',difficulty:'Desafio final',examples: bookRecommendations.map((book)=>book.title),books:bookRecommendations}
];

const shopItems = [
 {id:'syllable-guide',name:'Mapa das sílabas',price:45,icon:'🧩',category:'Leitura',description:'Mostra a divisão silábica do exemplo para você ler por partes e juntar os sons.',benefit:'Pratique a leitura em partes menores.',action:'Ferramenta disponível em cada atividade.'},
 {id:'slow-voice',name:'Voz em ritmo tranquilo',price:60,icon:'🐢',category:'Escuta',description:'Deixa o exemplo falado mais lento, sem mudar o texto, para você escutar com calma.',benefit:'Ajusta a voz do exemplo para ritmo lento.',action:'Ativado automaticamente ao comprar.'},
 {id:'first-sound',name:'Lupa do primeiro som',price:55,icon:'🔎',category:'Fala',description:'Revela a primeira letra do exemplo e uma pista para começar a pronunciar.',benefit:'Use uma pista quando travar no começo.',action:'Ferramenta disponível em cada atividade.'},
 {id:'double-listen',name:'Fone de repetição',price:75,icon:'🎧',category:'Escuta',description:'Adiciona um botão para ouvir o modelo de fala duas vezes seguidas.',benefit:'Compare e escute o modelo novamente.',action:'Ferramenta disponível em cada atividade.'},
 {id:'review-book',name:'Caderno de revisão',price:90,icon:'📘',category:'Revisão',description:'Guarda exemplos que você quer praticar de novo e cria uma lista de revisão no progresso.',benefit:'Monte uma lista pessoal de exemplos difíceis.',action:'Salve e reencontre atividades.'},
 {id:'focus-compass',name:'Bússola do foco',price:110,icon:'🧭',category:'Rotina',description:'Desbloqueia uma rodada guiada de três exemplos seguidos para praticar com foco.',benefit:'Organiza uma sessão curta de prática.',action:'Ferramenta disponível em cada atividade.'}
];

const normalizeText=(text='')=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9\s]/g,' ').replace(/\s+/g,' ').trim().toUpperCase();
const assetUrl=(name)=>`${import.meta.env.BASE_URL}assets/${name}`;
const profileStorageKey='fonoPirataProfile';

function loadSavedProfile(){
 try{
   const saved=window.localStorage.getItem(profileStorageKey);
   if(!saved) return null;
   const profile=JSON.parse(saved);
   if(!profile || typeof profile !== 'object') throw new Error('Formato de progresso inválido.');
   return profile;
 }catch(error){
   console.error('Não foi possível recuperar o progresso salvo.',error);
   return null;
 }
}

function loadSavedLanguage(){
 try{
   return window.localStorage.getItem('fonoPirataLanguage') || 'pt-BR';
 }catch(error){
   console.error('Não foi possível recuperar o idioma salvo.',error);
   return 'pt-BR';
 }
}

function getValidProgress(value){
 if(!value || typeof value!=='object' || value.version!==1) return null;
 if(!Number.isInteger(value.selectedIslandId) || value.selectedIslandId<1 || value.selectedIslandId>6) return null;
 if(!Number.isInteger(value.selectedExampleIndex) || value.selectedExampleIndex<0 || value.selectedExampleIndex>500) return null;
 if(!Number.isFinite(value.xp) || value.xp<0 || !Number.isFinite(value.coins) || value.coins<0) return null;
 if(!Number.isInteger(value.completed) || value.completed<0 || value.completed>6) return null;
 if(value.startingIslandId!==undefined && (!Number.isInteger(value.startingIslandId) || value.startingIslandId<1 || value.startingIslandId>6)) return null;
 if(value.screen!==undefined && value.screen!=='home' && value.screen!=='lesson') return null;
 if(!Array.isArray(value.ownedItems) || !value.ownedItems.every((item)=>typeof item==='string')) return null;
 if(value.totalAttempts!==undefined && (!Number.isInteger(value.totalAttempts) || value.totalAttempts<0)) return null;
 if(value.totalCorrect!==undefined && (!Number.isInteger(value.totalCorrect) || value.totalCorrect<0 || value.totalCorrect>(value.totalAttempts ?? 0))) return null;
 if(value.practiceByIsland!==undefined && (!value.practiceByIsland || typeof value.practiceByIsland!=='object' || Array.isArray(value.practiceByIsland) || Object.values(value.practiceByIsland).some((count)=>!Number.isInteger(count) || count<0))) return null;
 if(value.reviewItems!==undefined && (!Array.isArray(value.reviewItems) || !value.reviewItems.every((item)=>typeof item==='string' && /^\d+:\d+$/.test(item)))) return null;
 return value;
}

function speechMatches(expectedText,spokenText){
 const expected=normalizeText(expectedText).split(/\s+/).filter(Boolean);
 const spoken=normalizeText(spokenText).split(/\s+/).filter(Boolean);
 if(!expected.length || !spoken.length) return false;
 if(expected.length===1 && spoken.length===1){
   const distance=editDistance(expected[0],spoken[0]);
   return distance <= Math.max(1,Math.floor(expected[0].length*0.2));
 }
 const matched=expected.filter((word)=>spoken.some((spokenWord)=>word===spokenWord || editDistance(word,spokenWord)<=1)).length;
 return matched/expected.length >= 0.82;
}

function editDistance(first,second){
 const row=Array.from({length:second.length+1},(_,index)=>index);
 for(let rowIndex=1;rowIndex<=first.length;rowIndex+=1){
   let previous=row[0];
   row[0]=rowIndex;
   for(let column=1;column<=second.length;column+=1){
     const oldValue=row[column];
     row[column]=Math.min(row[column]+1,row[column-1]+1,previous+(first[rowIndex-1]===second[column-1]?0:1));
     previous=oldValue;
   }
 }
 return row[second.length];
}

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
 const [savedProfile]=useState(loadSavedProfile);
 const [screen,setScreen]=useState(savedProfile?.screen==='lesson'?'lesson':savedProfile?'home':'diagnostic');
 const [isLoading,setIsLoading]=useState(true);
 const [selectedIslandId,setSelectedIslandId]=useState(savedProfile?.selectedIslandId ?? 1);
 const [selectedExampleIndex,setSelectedExampleIndex]=useState(savedProfile?.selectedExampleIndex ?? 0);
 const [xp,setXp]=useState(savedProfile?.xp ?? 120);
 const [coins,setCoins]=useState(savedProfile?.coins ?? 80);
 const [completed,setCompleted]=useState(savedProfile?.completed ?? getInitialProgress());
 const [startingIslandId,setStartingIslandId]=useState(savedProfile?.startingIslandId ?? 1);
 const [totalAttempts,setTotalAttempts]=useState(savedProfile?.totalAttempts ?? 0);
 const [totalCorrect,setTotalCorrect]=useState(savedProfile?.totalCorrect ?? 0);
 const [practiceByIsland,setPracticeByIsland]=useState(savedProfile?.practiceByIsland ?? {});
 const [reviewItems,setReviewItems]=useState(savedProfile?.reviewItems ?? []);
 const [voiceEnabled,setVoiceEnabled]=useState(true);
 const [soundEnabled,setSoundEnabled]=useState(true);
 const [ambientEnabled,setAmbientEnabled]=useState(()=>window.localStorage.getItem('fonoAmbientEnabled') !== 'false');
 const [recognitionEnabled,setRecognitionEnabled]=useState(true);
 const [listening,setListening]=useState(false);
 const [speaking,setSpeaking]=useState(false);
 const [linoGreeting,setLinoGreeting]=useState(false);
 const [message,setMessage]=useState('');
 const [ownedItems,setOwnedItems]=useState(savedProfile?.ownedItems ?? ['boca-1']);
 const [diagnosticAnswers,setDiagnosticAnswers]=useState({});
 const [diagnosticResult,setDiagnosticResult]=useState(null);
 const [currentUser,setCurrentUser]=useState(null);
 const [authMessage,setAuthMessage]=useState('');
 const [authBusy,setAuthBusy]=useState(false);
 const [syncReady,setSyncReady]=useState(false);
 const [language,setLanguage]=useState(loadSavedLanguage);
 const [exercisePrompt,setExercisePrompt]=useState('');
 const [promptTranslating,setPromptTranslating]=useState(false);
 const [availableLanguages,setAvailableLanguages]=useState([]);
 const [languageMessage,setLanguageMessage]=useState('');
 const ambientAudioRef=useRef(null);
 const appRootRef=useRef(null);
 const cloudSyncTimer=useRef(null);

 const diagnosticQuestions = useMemo(() => getDiagnosticQuestions(), []);
 const islands = useMemo(() => getUnlockedIslands(baseIslands, completed, startingIslandId), [completed,startingIslandId]);
 const selectedIsland = islands.find((island)=>island.id === selectedIslandId) ?? islands[0];
 const activeExampleIndex=Math.min(selectedExampleIndex,selectedIsland.examples.length-1);
 const selectedExample = selectedIsland.examples[activeExampleIndex] ?? selectedIsland.answer;

 useEffect(()=>{
   if(selectedExampleIndex>=selectedIsland.examples.length) setSelectedExampleIndex(0);
 },[selectedExampleIndex,selectedIsland]);

 const handleDiagnosticAnswer=(questionId,optionValue)=>{
   setDiagnosticAnswers((current)=>({
     ...current,
     [questionId]: optionValue,
   }));
 };

 const finishDiagnostic=()=>{
   const total = diagnosticQuestions.reduce((sum,question)=>sum + Number(diagnosticAnswers[question.id] ?? 1), 0);
   const result = getDiagnosticSummary(total);
   setStartingIslandId(result.startingIslandId);
   setDiagnosticResult(result);
   setScreen('diagnostic-result');
 };

 useEffect(()=>{
   const loadingTimer=window.setTimeout(()=>setIsLoading(false),5000);
   return ()=>window.clearTimeout(loadingTimer);
 },[]);

 useEffect(()=>{
   try{
     window.localStorage.setItem(profileStorageKey,JSON.stringify({
       version:1,
       screen:screen==='lesson'?'lesson':'home',
       selectedIslandId,selectedExampleIndex,xp,coins,completed,startingIslandId,ownedItems,totalAttempts,totalCorrect,practiceByIsland,reviewItems
     }));
   }catch(error){
     console.error('Não foi possível salvar o progresso neste dispositivo.',error);
     setMessage('Não foi possível salvar o progresso neste dispositivo.');
   }
 },[screen,selectedIslandId,selectedExampleIndex,xp,coins,completed,startingIslandId,ownedItems,totalAttempts,totalCorrect,practiceByIsland,reviewItems]);

 useEffect(()=>{
   try{
     window.localStorage.setItem('fonoPirataLanguage',language);
   }catch(error){
     console.error('Não foi possível salvar o idioma selecionado.',error);
     setLanguageMessage('Não foi possível salvar o idioma neste dispositivo.');
   }
 },[language]);

 useEffect(()=>{
   document.documentElement.lang=language;
 },[language]);

 useEffect(()=>{
   if(!supabaseClient) return undefined;
   let active=true;

   const loadCloudProfile=async(userId)=>{
     setSyncReady(false);
     let result;
     try{
       result=await supabaseClient.from('profiles').select('progress').eq('id',userId).maybeSingle();
     }catch(error){
       if(!active) return;
       console.error('Não foi possível carregar o progresso da conta.',error);
       setAuthMessage('Entrou na conta, mas não foi possível carregar o progresso salvo.');
       return;
     }
     if(!active) return;
     if(result.error){
       console.error('Não foi possível carregar o progresso da conta.',result.error);
       setAuthMessage('Entrou na conta, mas não foi possível carregar o progresso salvo.');
       return;
     }
     const saved=getValidProgress(result.data?.progress);
     if(result.data && !saved){
       setAuthMessage('O progresso da conta está em um formato inválido. O salvamento local continua disponível.');
       return;
     }
     if(saved){
       setSelectedIslandId(saved.selectedIslandId);
       setSelectedExampleIndex(saved.selectedExampleIndex);
       setXp(saved.xp);
       setCoins(saved.coins);
       setCompleted(saved.completed);
       setStartingIslandId(saved.startingIslandId ?? 1);
       setOwnedItems(saved.ownedItems);
       setTotalAttempts(saved.totalAttempts ?? 0);
       setTotalCorrect(saved.totalCorrect ?? 0);
       setPracticeByIsland(saved.practiceByIsland ?? {});
       setReviewItems(saved.reviewItems ?? []);
       setScreen(saved.screen==='lesson'?'lesson':'home');
     }else{
       setScreen(savedProfile?.screen==='lesson'?'lesson':savedProfile?'home':'diagnostic');
     }
     setSyncReady(true);
   };

   const {data:{subscription}}=supabaseClient.auth.onAuthStateChange((event,session)=>{
     setCurrentUser(session?.user ?? null);
     if(session?.user){
       window.setTimeout(()=>{ void loadCloudProfile(session.user.id); },0);
     }else{
       setSyncReady(false);
     }
   });
   supabaseClient.auth.getSession().then(({data,error})=>{
     if(error){
       console.error('Não foi possível verificar a sessão de login.',error);
       setAuthMessage('Não foi possível verificar sua sessão. Tente entrar novamente.');
       return;
     }
     if(data.session?.user) setCurrentUser(data.session.user);
   }).catch((error)=>{
     console.error('Não foi possível verificar a sessão de login.',error);
     setAuthMessage('Não foi possível verificar sua sessão. Tente entrar novamente.');
   });

   return ()=>{
     active=false;
     subscription.unsubscribe();
   };
 },[]);

 useEffect(()=>{
   if(!supabaseClient || !currentUser || !syncReady) return undefined;
   window.clearTimeout(cloudSyncTimer.current);
   cloudSyncTimer.current=window.setTimeout(async()=>{
     const progress={
       version:1,
       screen:screen==='lesson'?'lesson':'home',
       selectedIslandId,selectedExampleIndex,xp,coins,completed,startingIslandId,ownedItems,totalAttempts,totalCorrect,practiceByIsland,reviewItems
     };
     try{
       const {error}=await supabaseClient.from('profiles').upsert({
         id:currentUser.id,
         progress,
         updated_at:new Date().toISOString()
       },{onConflict:'id'});
       if(error) throw error;
     }catch(error){
       console.error('Não foi possível sincronizar o progresso da conta.',error);
       setAuthMessage('O progresso continua salvo neste dispositivo, mas a sincronização falhou.');
     }
   },500);
   return ()=>window.clearTimeout(cloudSyncTimer.current);
 },[currentUser,syncReady,screen,selectedIslandId,selectedExampleIndex,xp,coins,completed,startingIslandId,ownedItems,totalAttempts,totalCorrect,practiceByIsland,reviewItems]);

 useEffect(()=>{
   if(!supabaseClient || !currentUser || screen!=='settings' || availableLanguages.length) return undefined;
   let active=true;
   supabaseClient.functions.invoke('translate',{
     body:{action:'languages',target:'pt-BR'}
   }).then(({data,error})=>{
     if(!active) return;
     if(error) throw error;
     if(!Array.isArray(data?.languages)) throw new Error('O serviço não devolveu a lista de idiomas.');
     setAvailableLanguages(data.languages);
     setLanguageMessage('');
   }).catch((error)=>{
     if(!active) return;
     console.error('Não foi possível carregar os idiomas disponíveis.',error);
     setLanguageMessage(error.message || 'Não foi possível carregar os idiomas.');
   });
   return ()=>{ active=false; };
 },[currentUser,screen,availableLanguages.length]);

 useEffect(()=>{
   if(language!=='pt-BR' && !currentUser){
     setLanguageMessage('Entre na conta para usar a tradução automática.');
     return undefined;
   }
   return observeAndTranslate(appRootRef.current,supabaseClient,language,(error)=>{
     setLanguageMessage(error);
   });
 },[language,currentUser]);

 useEffect(()=>{
   let active=true;
   if(language==='pt-BR' || !currentUser || !supabaseClient){
     setExercisePrompt(selectedExample);
     setPromptTranslating(false);
     return ()=>{active=false;};
   }
   setPromptTranslating(true);
   translateTexts(supabaseClient,language,[selectedExample]).then(([translated])=>{
     if(active) setExercisePrompt(translated);
   }).catch((error)=>{
     if(!active) return;
     console.error('Não foi possível traduzir este exercício.',error);
     setLanguageMessage(error.message || 'Não foi possível traduzir este exercício.');
     setExercisePrompt(selectedExample);
   }).finally(()=>{
     if(active) setPromptTranslating(false);
   });
   return ()=>{active=false;};
 },[selectedExample,language,currentUser]);

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
   const lowpass=context.createBiquadFilter();
   lowpass.type='lowpass';
   lowpass.frequency.value=2100;
   output.gain.value=0.3;
   lowpass.connect(output);
   output.connect(context.destination);

   const playNote=(midiNote,startTime,duration,volume)=>{
     const frequency=440*Math.pow(2,(midiNote-69)/12);
     const oscillator=context.createOscillator();
     const overtone=context.createOscillator();
     const overtoneGain=context.createGain();
     const envelope=context.createGain();
     oscillator.type='sine';
     overtone.type='sine';
     oscillator.frequency.setValueAtTime(frequency,startTime);
     overtone.frequency.setValueAtTime(frequency*2,startTime);
     overtoneGain.gain.value=0.09;
     envelope.gain.setValueAtTime(0.0001,startTime);
     envelope.gain.exponentialRampToValueAtTime(volume,startTime+0.035);
     envelope.gain.exponentialRampToValueAtTime(0.0001,startTime+duration);
     oscillator.connect(envelope);
     overtone.connect(overtoneGain);
     overtoneGain.connect(envelope);
     envelope.connect(lowpass);
     oscillator.start(startTime);
     overtone.start(startTime);
     oscillator.stop(startTime+duration+0.03);
     overtone.stop(startTime+duration+0.03);
   };

   const melody=[72,74,76,null,79,76,74,null,72,74,76,79,81,79,76,null];
   const chords=[[48,52,55],[45,48,52],[41,45,48],[43,47,50]];
   let beat=0;
   const playBeat=()=>{
     const now=context.currentTime+0.03;
     const note=melody[beat%melody.length];
     if(note!==null) playNote(note,now,0.95,0.065);
     if(beat%4===0){
       const chord=chords[Math.floor(beat/4)%chords.length];
       chord.forEach((chordNote)=>playNote(chordNote,now,2.55,0.018));
     }
     beat+=1;
   };
   playBeat();
   const musicTimer=window.setInterval(playBeat,720);
   ambientAudioRef.current={context,musicTimer};
   context.resume();
 };

 const stopAmbientAudio=()=>{
   const ambientAudio=ambientAudioRef.current;
   if(!ambientAudio){
     return;
   }
   window.clearInterval(ambientAudio.musicTimer);
   ambientAudio.context.close();
   ambientAudioRef.current=null;
 };

 useEffect(()=>{
   const handleInteraction=()=>{
     if(document.visibilityState==='visible'){
       startAmbientAudio();
     }else{
       ambientAudioRef.current?.context.suspend();
     }
   };
   if(ambientEnabled && !isLoading && !listening && !speaking){
     window.addEventListener('pointerdown',handleInteraction);
     document.addEventListener('visibilitychange',handleInteraction);
   }else{
     stopAmbientAudio();
   }
   return ()=>{
     window.removeEventListener('pointerdown',handleInteraction);
     document.removeEventListener('visibilitychange',handleInteraction);
   };
 },[ambientEnabled,isLoading,listening,speaking]);

 useEffect(()=>{
   window.localStorage.setItem('fonoAmbientEnabled',String(ambientEnabled));
 },[ambientEnabled]);

 const speakText=(text,repetitions=1)=>{
   if(!text || !voiceEnabled || !('speechSynthesis' in window)){
     setMessage('A voz do navegador está desligada ou não é compatível.');
     return;
   }
   if(!soundEnabled){
     setMessage('O som está desativado nas configurações.');
     return;
   }
   window.speechSynthesis.cancel();
   const portugueseVoice=window.speechSynthesis.getVoices()
     .filter((voice)=>voice.lang.toLowerCase().startsWith(language.toLowerCase().split('-')[0]))
     .sort((first,second)=>Number(second.lang.toLowerCase()===language.toLowerCase())-Number(first.lang.toLowerCase()===language.toLowerCase()))[0];
   let remaining=repetitions;
   const speakNext=()=>{
     const utterance = new SpeechSynthesisUtterance(text);
     utterance.lang = language;
     utterance.rate = ownedItems.includes('slow-voice') ? 0.68 : 0.88;
     utterance.pitch = 1.02;
     if(portugueseVoice) utterance.voice=portugueseVoice;
     utterance.onstart = () => setSpeaking(true);
     utterance.onend = () => {
       remaining-=1;
       if(remaining>0) speakNext();
       else setSpeaking(false);
     };
     utterance.onerror = () => setSpeaking(false);
     window.speechSynthesis.speak(utterance);
   };
   speakNext();
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
   if(promptTranslating){
     setMessage('Aguarde a tradução do exercício antes de falar.');
     return;
   }
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
   recognition.lang = language;
   recognition.interimResults = false;
   recognition.continuous = false;
   recognition.maxAlternatives = 3;

   recognition.onstart = () => {
     setListening(true);
     setMessage('Ouvindo sua fala...');
   };

   recognition.onend = () => {
     setListening(false);
   };

   recognition.onerror = (event) => {
     setListening(false);
     setMessage(`Não consegui ouvir direito: ${event.error}. Tente outra vez.`);
   };

   recognition.onresult = (event) => {
     const finalResult=event.results[event.results.length-1];
     const alternatives=Array.from(finalResult ?? []).map((item)=>item.transcript?.trim() ?? '').filter(Boolean);
     const matchedTranscript=alternatives.find((transcript)=>speechMatches(exercisePrompt || selectedExample,transcript));
     const latestTranscript=matchedTranscript ?? alternatives[0];
     setTotalAttempts((value)=>value+1);
     setPracticeByIsland((current)=>({...current,[selectedIsland.id]:(current[selectedIsland.id] ?? 0)+1}));
     if(!latestTranscript) return;

     if(matchedTranscript){
       setTotalCorrect((value)=>value+1);
       setCompleted((value)=>Math.max(value,selectedIsland.id));
       setXp((value)=>value + 30);
       setCoins((value)=>value + 15);
       setMessage('Muito bem! A fala foi reconhecida.');
       if(selectedIsland.id < islands.length){
         window.setTimeout(()=>{
           const nextIsland=islands.find((island)=>island.id===selectedIsland.id + 1);
           if(nextIsland){
             setSelectedIslandId(nextIsland.id);
             setSelectedExampleIndex(0);
             setMessage(`Parabéns! A próxima ilha já está liberada: ${nextIsland.title}.`);
           }
         },900);
       }
       return;
     }
     setMessage(`O reconhecimento ouviu “${latestTranscript}”. Tente novamente falando perto do microfone e em um lugar silencioso.`);
   };

   try{
     recognition.start();
   }catch(error){
     setListening(false);
     setMessage(`Não foi possível iniciar o microfone: ${error.message}`);
   }
 };

 const openIsland = (island) => {
   if(!island.unlocked){
     setMessage('Complete a ilha anterior para liberar esta etapa.');
     return;
   }
   setSelectedIslandId(island.id);
   setSelectedExampleIndex(0);
   setScreen('lesson');
   setMessage('');
 };

 const sendLoginCode=async(identifier)=>{
   if(!supabaseClient){
     setAuthMessage(supabaseConfigurationMessage);
     return null;
   }
   const value=identifier.trim();
   const isEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
   const isPhone=/^\+[1-9]\d{7,14}$/.test(value);
   if(!isEmail && !isPhone){
     setAuthMessage('Digite um e-mail válido ou telefone com código do país, como +5511999999999.');
     return null;
   }

   setAuthBusy(true);
   setAuthMessage('');
   try{
     const options={shouldCreateUser:true};
     const result=isEmail
       ? await supabaseClient.auth.signInWithOtp({
           email:value,
           options:{...options,emailRedirectTo:new URL(import.meta.env.BASE_URL,window.location.origin).href}
         })
       : await supabaseClient.auth.signInWithOtp({phone:value,options});
     if(result.error) throw result.error;
     setAuthMessage(isEmail?'Enviamos um link de acesso para seu e-mail. Abra-o neste dispositivo para continuar.':'Enviamos um código por SMS. Digite-o abaixo para entrar.');
     return isPhone?'phone':null;
   }catch(error){
     console.error('Não foi possível enviar o código de acesso.',error);
     setAuthMessage(error.message || 'Não foi possível enviar o código de acesso.');
     return null;
   }finally{
     setAuthBusy(false);
   }
 };

 const verifyPhoneCode=async(phone,token)=>{
   if(!supabaseClient) return;
   setAuthBusy(true);
   setAuthMessage('');
   try{
     const {error}=await supabaseClient.auth.verifyOtp({phone,token,type:'sms'});
     if(error) throw error;
     setAuthMessage('Acesso confirmado. Carregando seu progresso...');
   }catch(error){
     console.error('Não foi possível confirmar o código SMS.',error);
     setAuthMessage(error.message || 'Código inválido ou expirado. Peça outro código e tente novamente.');
   }finally{
     setAuthBusy(false);
   }
 };

 const signOut=async()=>{
   if(!supabaseClient) return;
   const {error}=await supabaseClient.auth.signOut();
   if(error){
     console.error('Não foi possível encerrar a sessão.',error);
     setAuthMessage('Não foi possível encerrar a sessão. Tente novamente.');
     return;
   }
   setAuthMessage('Você saiu da conta. O progresso local deste dispositivo foi mantido.');
   setScreen('account');
 };

 const changeLanguage=(nextLanguage)=>{
   if(nextLanguage!=='pt-BR' && !currentUser){
     setLanguageMessage('Entre na conta para usar a tradução automática.');
     return;
   }
   setLanguageMessage('');
   setLanguage(nextLanguage);
 };

 const globalStatus=screen==='account'?'':screen==='settings'?authMessage:authMessage||languageMessage;

 const buyItem=(item)=>{
   if(ownedItems.includes(item.id)){
     return {success:false,message:`${item.name} já está no seu inventário.`};
   }
   if(coins < item.price){
     return {success:false,message:`Faltam ${item.price - coins} moedas para comprar este item.`};
   }
   setCoins((value)=>value - item.price);
   setOwnedItems((items)=>[...items,item.id]);
   return {success:true,message:`${item.name} comprado! A ajuda já está disponível nas atividades.`};
 };

 const toggleReviewItem=(itemKey)=>{
   setReviewItems((items)=>items.includes(itemKey)
     ? items.filter((item)=>item!==itemKey)
     : [...items,itemKey]);
 };

 const openReviewItem=(itemKey)=>{
   const [islandId,exampleIndex]=itemKey.split(':').map(Number);
   const island=islands.find((item)=>item.id===islandId);
   if(!island?.unlocked || !Number.isInteger(exampleIndex) || exampleIndex>=island.examples.length){
     setMessage('Esta atividade não está disponível para revisão agora.');
     return;
   }
   setSelectedIslandId(islandId);
   setSelectedExampleIndex(exampleIndex);
   setScreen('lesson');
 };

 return (
   <div className="app" ref={appRootRef}>
      {globalStatus && (
        <div className="globalNotice" role="status">
          <span>{globalStatus}</span>
          <button type="button" aria-label="Fechar aviso" onClick={()=>{setAuthMessage('');setLanguageMessage('');}}>×</button>
        </div>
      )}
      {isLoading && (
        <div className="loadingScreen" role="status" aria-live="polite">
          <div className="loadingCard">
            <span className="loadingShip" aria-hidden="true">🏴‍☠️⛵</span>
            <img src={assetUrl('lino.png')} alt="" />
            <h1>FonoPirata</h1>
            <p>Lino e Polly estão preparando sua aventura...</p>
            <div className="loadingTrack"><i /></div>
          </div>
        </div>
      )}
      {screen === 'diagnostic' && (
        <DiagnosticScreen
          questions={diagnosticQuestions}
          answers={diagnosticAnswers}
          onAnswer={handleDiagnosticAnswer}
          onSubmit={finishDiagnostic}
          onOpenAccount={() => setScreen('account')}
        />
      )}

      {screen === 'diagnostic-result' && diagnosticResult && (
        <DiagnosticResultScreen
          result={diagnosticResult}
          onContinue={() => {
            setSelectedIslandId(diagnosticResult.startingIslandId);
            setSelectedExampleIndex(0);
            setScreen('lesson');
          }}
        />
      )}

      {screen === 'account' && (
        <AccountScreen
          configured={supabaseConfigured}
          user={currentUser}
          busy={authBusy}
          message={authMessage}
          onBack={() => setScreen(savedProfile?'home':'diagnostic')}
          onSendCode={sendLoginCode}
          onVerifyCode={verifyPhoneCode}
          onSignOut={signOut}
          onContinueOffline={() => setScreen(savedProfile?'home':'diagnostic')}
        />
      )}

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
                <span>Nível {Math.floor(xp/100)+1}</span>
                <div className="xpbar"><i style={{width:`${xp % 100}%`}} /></div>
              </div>
            </div>
            <div className="hudRight">
              <div className="coin" aria-label={`${coins} moedas e ${xp} pontos de experiência`} title="Moedas e experiência"><span>🪙</span><b>{coins}</b><span className="coinXp">⭐ {xp} XP</span></div>
              <button type="button" onClick={() => setScreen('settings')} aria-label="Configurações"><Settings size={20} /></button>
            </div>
          </header>

          <main className="mapWrap">
            <img className="map" src={assetUrl('map.png')} alt="Mapa de ilhas" onError={(event)=>{event.currentTarget.hidden=true;setAuthMessage('Não foi possível carregar a imagem do mapa. Confira se map.png está em public/assets.');}} />
            <div className="titleRibbon">
              <strong>FonoPirata</strong>
              <small>Fale • Aprenda • Conquiste</small>
            </div>
            <div className="route route1" />
            <div className="route route2" />
            <div className="route route3" />
            <div className="wavePatch wavePatchOne" aria-hidden="true" />
            <div className="wavePatch wavePatchTwo" aria-hidden="true" />
            <div className="mapBoat boatOne" aria-hidden="true">⛵</div>
            <div className="mapBoat boatTwo" aria-hidden="true">🚤</div>
            {islands.map((island) => (
              <button
                key={island.id}
                type="button"
                className={`islandNode islandNode-${island.id} ${!island.unlocked ? 'locked' : ''}`}
                style={{left: `${island.x}%`, top: `${island.y}%`, '--island-delay': `${island.id * -0.42}s`}}
                onClick={() => openIsland(island)}
              >
                <span>{island.unlocked ? island.id : <Lock size={20} />}</span>
              </button>
            ))}
            <button type="button" className={`mascot linoMap ${linoGreeting ? 'greeting' : ''}`} onClick={greetWithLino} aria-label="Mostrar saudação do Lino" title="Mostrar saudação do Lino"><span className="linoBubble">Ahoy, Está na hora da lição, Ahoy</span><img src={assetUrl('lino.png')} alt="Mascote Lino" /></button>
            <div className="mascot pollyMap"><img src={assetUrl('polly-purple.png')} alt="Polly, a polva roxa" /></div>
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
         selectedExample={selectedExample}
         selectedExampleIndex={activeExampleIndex}
         onSelectExample={setSelectedExampleIndex}
         onBack={() => setScreen('home')}
         speak={() => speakText(exercisePrompt || selectedExample)}
         speakTwice={() => speakText(exercisePrompt || selectedExample,2)}
         listen={handleVoiceInput}
         ownedItems={ownedItems}
         isSavedReview={reviewItems.includes(`${selectedIsland.id}:${activeExampleIndex}`)}
         onToggleReview={()=>toggleReviewItem(`${selectedIsland.id}:${activeExampleIndex}`)}
         promptTranslating={promptTranslating}
          listening={listening}
          speaking={speaking}
          message={message}
          onClearMessage={() => setMessage('')}
        />
      )}

      {screen === 'progress' && <Progress xp={xp} completed={completed} coins={coins} islands={islands} totalAttempts={totalAttempts} totalCorrect={totalCorrect} practiceByIsland={practiceByIsland} reviewItems={reviewItems} hasReviewBook={ownedItems.includes('review-book')} onOpenReview={openReviewItem} onRemoveReview={toggleReviewItem} onBack={() => setScreen('home')} />}

      {screen === 'shop' && <Shop onBack={() => setScreen('home')} coins={coins} items={shopItems} ownedItems={ownedItems} onBuy={buyItem} />}

     {screen === 'donation' && <Donation onBack={() => setScreen('home')} />}

     {screen === 'share' && <ShareApp onBack={() => setScreen('home')} />}

      {screen === 'settings' && (
        <SettingsScreen
          onBack={() => setScreen('home')}
          onOpenAccount={() => {
            setAuthMessage('');
            setScreen('account');
          }}
          user={currentUser}
          language={language}
          languages={availableLanguages}
          languageMessage={languageMessage}
          onChangeLanguage={changeLanguage}
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

function Lesson({island,selectedExample,selectedExampleIndex,onSelectExample,onBack,speak,speakTwice,listen,listening,message,onClearMessage,speaking,promptTranslating,ownedItems,isSavedReview,onToggleReview})
{
 const pageSize=20;
 const pageCount=Math.ceil(island.examples.length/pageSize);
 const page=Math.floor(selectedExampleIndex/pageSize);
 const pageStart=page*pageSize;
 const examples=island.examples.slice(pageStart,pageStart+pageSize);
 const [showSyllables,setShowSyllables]=useState(false);
 const [showFirstSound,setShowFirstSound]=useState(false);
 const [focusRound,setFocusRound]=useState([]);
 const firstLetter=selectedExample.match(/[\p{L}]/u)?.[0]?.toLocaleUpperCase('pt-BR');
 const focusExamples=Array.from({length:Math.min(3,island.examples.length)},(_,offset)=>(selectedExampleIndex+offset)%island.examples.length);

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
       <div className="lessonMascots">
         <img src={assetUrl('lino.png')} alt="Lino, seu companheiro de aventura" />
         <img src={assetUrl('polly-purple.png')} alt="Polly, a polva roxa" />
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
           <h2>{selectedExample}</h2>
           <button type="button" className="sound" onClick={speak} disabled={promptTranslating} aria-label="Ouvir exemplo"><Volume2 /></button>
         </div>
         <p>
           {island.type === 'livros'
             ? 'Escolha um livro para abrir a biblioteca digital e ler no site de origem.'
             : 'Escute o exemplo e depois fale no microfone com calma. O reconhecimento automático pode variar conforme o aparelho e o ambiente.'}
         </p>
         {ownedItems.some((item)=>['syllable-guide','slow-voice','first-sound','double-listen','review-book','focus-compass'].includes(item)) && (
           <div className="lessonTools" aria-label="Ferramentas de aprendizagem">
             {ownedItems.includes('slow-voice') && <span className="lessonToolStatus"><Headphones size={17} /> Voz lenta ativada</span>}
             {ownedItems.includes('syllable-guide') && <button type="button" onClick={()=>setShowSyllables((value)=>!value)}><AudioLines size={17} />{showSyllables?'Ocultar sílabas':'Separar em sílabas'}</button>}
             {ownedItems.includes('first-sound') && <button type="button" onClick={()=>setShowFirstSound((value)=>!value)}><Lightbulb size={17} />{showFirstSound?'Ocultar pista':'Ver pista inicial'}</button>}
             {ownedItems.includes('double-listen') && <button type="button" onClick={speakTwice} disabled={promptTranslating}><Headphones size={17} />Ouvir duas vezes</button>}
             {ownedItems.includes('review-book') && <button type="button" className={isSavedReview?'active':''} onClick={onToggleReview}><Bookmark size={17} fill={isSavedReview?'currentColor':'none'} />{isSavedReview?'Salvo para rever':'Guardar para rever'}</button>}
             {ownedItems.includes('focus-compass') && <button type="button" onClick={()=>setFocusRound(focusExamples)}><Compass size={17} />Iniciar rodada de 3</button>}
           </div>
         )}
         {showSyllables && ownedItems.includes('syllable-guide') && (
           <div className="learningHint"><AudioLines size={18} /><span>Leia por partes: <strong>{getSyllableGuide(selectedExample)}</strong></span></div>
         )}
         {showFirstSound && ownedItems.includes('first-sound') && firstLetter && (
           <div className="learningHint"><Lightbulb size={18} /><span>Pista inicial: o exemplo começa com a letra <strong>{firstLetter}</strong>.</span></div>
         )}
         {focusRound.length>0 && ownedItems.includes('focus-compass') && (
           <div className="focusRound">
             <strong>Rodada de foco · 3 exemplos</strong>
             <div>{focusRound.map((index,roundIndex)=>(
               <button type="button" key={`${index}-${roundIndex}`} className={selectedExampleIndex===index?'active':''} onClick={()=>onSelectExample(index)}>
                 <span>{roundIndex+1}</span>{island.examples[index]}
               </button>
             ))}</div>
           </div>
         )}
         <div className="examplesPanel">
           <div className="miniHeader">
             <span>{island.type==='silaba'?'Sílabas frequentes':'Banco de exercícios'}</span>
             <strong>{Array.isArray(island.examples) ? island.examples.length : 1} itens</strong>
           </div>
           <div className="exampleList">
             {examples.map((item, index) => (
               <button type="button" key={`${item}-${pageStart+index}`} className={`exampleChip ${pageStart+index === selectedExampleIndex ? 'active' : ''}`} onClick={()=>onSelectExample(pageStart+index)}>
                 {item}
               </button>
             ))}
           </div>
           {pageCount>1 && (
             <div className="examplePagination">
               <button type="button" onClick={()=>onSelectExample(Math.max(0,pageStart-pageSize))} disabled={page===0}>Anterior</button>
               <span>Página {page+1} de {pageCount}</span>
               <button type="button" onClick={()=>onSelectExample(Math.min(island.examples.length-1,pageStart+pageSize))} disabled={page===pageCount-1}>Próxima</button>
             </div>
           )}
         </div>
         {island.books && (
           <div className="bookList">
             {island.books.map((book)=>(
               <a key={book.title} href={book.url} target="_blank" rel="noreferrer">
                 <strong>{book.title}</strong><span>{book.age} · {book.reason}</span><small>Abrir biblioteca digital ↗</small>
               </a>
             ))}
             <p>Os links levam às obras originais, principalmente em inglês, que estão em domínio público. Traduções podem ter direitos autorais próprios; confira a edição no site de origem.</p>
           </div>
         )}
         {!island.books && (
           <button type="button" className="mic" onClick={listen} disabled={listening}>
             <Mic size={42} />
             <span>{promptTranslating ? 'Traduzindo...' : listening ? 'Ouvindo...' : 'Falar exemplo'}</span>
           </button>
         )}
         {message && (
           <div className={`feedback ${message.includes('Muito bem') ? 'ok' : 'try'}`}>
             {message}
             {message.includes('Muito bem') && <Check />}
             <button type="button" className="closeMessage" onClick={onClearMessage}>×</button>
           </div>
         )}
       </div>
       <img className="pollyLesson" src={assetUrl('polly-purple.png')} alt="Polly, a polva roxa" />
     </section>
   </div>
 );
}

function Progress({xp,completed,coins,islands,totalAttempts,totalCorrect,practiceByIsland,reviewItems,hasReviewBook,onOpenReview,onRemoveReview,onBack})
{
 const level=Math.floor(xp/100)+1;
 const levelXp=xp%100;
 const accuracy=totalAttempts?Math.round(totalCorrect/totalAttempts*100):0;
 const achievements=[
   {icon:'🌟',title:'Primeiro acerto',unlocked:totalCorrect>=1,detail:'Faça uma atividade corretamente'},
   {icon:'🎤',title:'Voz confiante',unlocked:totalCorrect>=10,detail:'Alcance 10 acertos'},
   {icon:'🏝️',title:'Explorador',unlocked:completed>=3,detail:'Conclua 3 ilhas'},
   {icon:'👑',title:'Lenda dos mares',unlocked:completed>=6,detail:'Conclua as 6 ilhas'}
 ];
 const savedReviews=reviewItems.map((key)=>{
   const [islandId,index]=key.split(':').map(Number);
   const island=baseIslands.find((item)=>item.id===islandId);
   return island?.examples[index]?{key,island,example:island.examples[index]}:null;
 }).filter(Boolean);

 return (
   <div className="progress">
     <button type="button" className="back" onClick={onBack} aria-label="Voltar ao mapa"><ArrowLeft /></button>
     <div className="progressDashboard">
       <header className="progressHero">
         <div>
           <span className="progressEyebrow"><Compass size={16} /> DIÁRIO DE BORDO</span>
           <h1>Seu progresso</h1>
           <p>Cada tentativa conta. Veja o quanto você já avançou!</p>
         </div>
         <img src={assetUrl('polly-purple.png')} alt="Polly comemorando seu progresso" />
       </header>

       <section className="levelCard" aria-label={`Nível ${level}`}>
         <div className="levelPortrait"><img src={assetUrl('lino.png')} alt="Lino, seu companheiro" /></div>
         <div className="levelDetails">
           <div className="levelTitle"><div><span>NÍVEL {level}</span><h2>Aventureiro da fala</h2></div><strong>⭐ {xp} XP</strong></div>
           <div className="levelTrack"><i style={{width:`${levelXp}%`}} /></div>
           <small>{levelXp} de 100 XP para o nível {level+1}</small>
         </div>
       </section>

       <section className="progressStats" aria-label="Resumo da aprendizagem">
         <article className="progressStat statBlue"><span><Target size={20} /></span><strong>{totalAttempts}</strong><small>Tentativas de fala</small></article>
         <article className="progressStat statGreen"><span><Check size={20} /></span><strong>{totalCorrect}</strong><small>Respostas reconhecidas</small></article>
         <article className="progressStat statGold"><span>⭐</span><strong>{accuracy}%</strong><small>Precisão geral de reconhecimento</small></article>
         <article className="progressStat statPurple"><span><ShoppingBag size={20} /></span><strong>{coins}</strong><small>Moedas disponíveis</small></article>
       </section>

       <section className="progressSection">
         <div className="sectionHeading"><div><span>🌊</span><div><h2>Mapa da sua jornada</h2><p>{completed} de {islands.length} ilhas concluídas</p></div></div><span className="journeyCount">{completed}/{islands.length}</span></div>
         <div className="islandProgressGrid">
           {islands.map((island)=>(
             <article key={island.id} className={`islandProgressCard ${island.id<=completed?'islandDone':''} ${!island.unlocked?'islandLocked':''}`}>
               <div className="islandProgressIcon">{island.id<=completed?'🏆':island.unlocked?'🗺️':'🔒'}</div>
               <div><strong>Ilha {island.id}</strong><span>{island.title.replace('Ilha ','')}</span><small>{practiceByIsland[island.id] ?? 0} tentativas</small></div>
               {island.id<=completed&&<Check size={18} aria-label="Concluída" />}
             </article>
           ))}
         </div>
       </section>

       <section className="progressSection">
         <div className="sectionHeading"><div><span>✨</span><div><h2>Conquistas</h2><p>Metas que você já alcançou</p></div></div></div>
         <div className="achievementGrid">
           {achievements.map((achievement)=>(
             <article key={achievement.title} className={`achievementCard ${achievement.unlocked?'achievementUnlocked':'achievementWaiting'}`}>
               <span>{achievement.icon}</span><div><strong>{achievement.title}</strong><small>{achievement.unlocked?'Conquista desbloqueada':achievement.detail}</small></div>{achievement.unlocked&&<Check size={17} />}
             </article>
           ))}
         </div>
       </section>

       {hasReviewBook&&(
         <section className="progressSection reviewSection">
           <div className="sectionHeading"><div><span>📘</span><div><h2>Caderno de revisão</h2><p>Exemplos guardados para praticar outra vez</p></div></div><span className="journeyCount">{savedReviews.length}</span></div>
           {savedReviews.length===0?<p className="emptyReview">Ainda não guardou exemplos. Na atividade, toque em “Guardar para rever”.</p>:(
             <div className="reviewList">{savedReviews.map((item)=>(
               <article key={item.key}><div><strong>{item.example}</strong><small>Ilha {item.island.id} · {item.island.title.replace('Ilha ','')}</small></div><button type="button" onClick={()=>onOpenReview(item.key)}>Praticar</button><button type="button" className="removeReview" aria-label={`Remover ${item.example} do caderno`} onClick={()=>onRemoveReview(item.key)}>×</button></article>
             ))}</div>
           )}
         </section>
       )}
     </div>
   </div>
 );
}

function Shop({onBack,coins,items,ownedItems,onBuy})
{
 const [notice,setNotice]=useState('');
 const [filter,setFilter]=useState('Todos');
 const categories=['Todos',...new Set(items.map((item)=>item.category))];
 const visibleItems=filter==='Todos'?items:items.filter((item)=>item.category===filter);
 const handleBuy=(item)=>{
   const result=onBuy(item);
   setNotice(result.message);
 };

 return (
   <div className="shop">
     <button type="button" className="back" onClick={onBack} aria-label="Voltar ao mapa"><ArrowLeft /></button>
     <div className="shopDashboard">
       <header className="shopHero">
         <div><span className="shopEyebrow"><ShoppingBag size={16} /> MERCADO DO CAPITÃO</span><h1>Loja de ferramentas</h1><p>Troque suas moedas por recursos que ajudam na prática.</p></div>
         <div className="treasureChest" aria-hidden="true">🧰<span>✨</span></div>
         <div className="shopBalance"><span>SEU TESOURO</span><strong>🪙 {coins}</strong><small>moedas disponíveis</small></div>
       </header>
       <div className="coinTip"><Star size={19} fill="currentColor" /><span><strong>Como ganhar moedas?</strong> Cada fala reconhecida rende 15 moedas e 30 XP. Continue praticando para desbloquear mais ferramentas!</span></div>
       <div className="shopIntro"><div><h2>Escolha sua ajuda de aprendizagem</h2><p>As ferramentas compradas ficam disponíveis nas atividades e no seu progresso.</p></div><span>{ownedItems.filter((id)=>items.some((item)=>item.id===id)).length} no inventário</span></div>
       <div className="shopFilters" aria-label="Filtrar ferramentas">
         {categories.map((category)=><button type="button" key={category} className={filter===category?'active':''} onClick={()=>setFilter(category)}>{category}</button>)}
       </div>
       {notice&&<div className="shopNotice" role="status"><Check size={18}/>{notice}<button type="button" onClick={()=>setNotice('')} aria-label="Fechar aviso">×</button></div>}
       <div className="shopGrid">
         {visibleItems.map((item)=>{
           const owned=ownedItems.includes(item.id);
           const affordable=coins>=item.price;
           return (
             <article key={item.id} className={`shopCard ${owned?'shopCardOwned':''}`}>
               <div className="shopCardTop"><span className="shopIcon">{item.icon}</span><span className="shopCategory">{item.category}</span></div>
               <h3>{item.name}</h3><p>{item.description}</p>
               <div className="shopBenefit"><Target size={16}/><span>{item.benefit}</span></div>
               <small className="shopHow">{item.action}</small>
               <footer><strong>🪙 {item.price}</strong><button type="button" onClick={()=>handleBuy(item)} disabled={owned||!affordable}>{owned?'No inventário':affordable?'Comprar':`Faltam ${item.price-coins}`}</button></footer>
             </article>
           );
         })}
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

function AccountScreen({configured,user,busy,message,onBack,onSendCode,onVerifyCode,onSignOut,onContinueOffline})
{
 const [identifier,setIdentifier]=useState('');
 const [pendingPhone,setPendingPhone]=useState('');
 const [token,setToken]=useState('');

 const submitAccess=async(event)=>{
   event.preventDefault();
   const method=await onSendCode(identifier);
   if(method==='phone') setPendingPhone(identifier.trim());
 };

 const submitToken=async(event)=>{
   event.preventDefault();
   await onVerifyCode(pendingPhone,token.trim());
 };

 return (
   <div className="settingsScreen accountScreen">
     <button type="button" className="back" onClick={onBack} aria-label="Voltar"><ArrowLeft /></button>
     <div className="panel">
       <div className="accountIcon"><LogIn /></div>
       <h1>Conta e progresso</h1>
       {!configured && <div className="accountNotice">{supabaseConfigurationMessage}</div>}
       {user ? (
         <div className="accountSignedIn">
           <p>Conta conectada</p>
           <strong>{user.email || user.phone}</strong>
           <p>Seu progresso está sendo sincronizado com segurança.</p>
           <button type="button" className="accountAction" onClick={onSignOut}><LogOut size={18} /> Sair da conta</button>
         </div>
       ) : configured && (
         <>
           <p className="accountIntro">Entre com seu e-mail ou telefone para acessar seu progresso em outros dispositivos. Um código/link de acesso será enviado para você.</p>
           {!pendingPhone ? (
             <form className="accountForm" onSubmit={submitAccess}>
               <label htmlFor="account-identifier">E-mail ou telefone com código do país</label>
               <input
                 id="account-identifier"
                 autoComplete="username"
                 type="text"
                 value={identifier}
                 onChange={(event)=>setIdentifier(event.target.value)}
                 placeholder="nome@exemplo.com ou +5511999999999"
                 required
               />
               <button type="submit" className="accountAction" disabled={busy}>
                 <LogIn size={18} />{busy?'Enviando...':'Enviar link ou código'}
               </button>
             </form>
           ) : (
             <form className="accountForm" onSubmit={submitToken}>
               <label htmlFor="account-code">Código enviado por SMS para {pendingPhone}</label>
               <input
                 id="account-code"
                 autoComplete="one-time-code"
                 inputMode="numeric"
                 value={token}
                 onChange={(event)=>setToken(event.target.value)}
                 required
               />
               <button type="submit" className="accountAction" disabled={busy}>
                 <LogIn size={18} />{busy?'Verificando...':'Confirmar código'}
               </button>
               <button type="button" className="offlineAction" onClick={()=>onSendCode(pendingPhone)} disabled={busy}>Reenviar código</button>
             </form>
           )}
         </>
       )}
       {message && <p className="accountMessage" role="status">{message}</p>}
       {!user && <button type="button" className="offlineAction" onClick={onContinueOffline}>Continuar sem conta neste dispositivo</button>}
     </div>
   </div>
 );
}

function SettingsScreen({onBack,onOpenAccount,user,language,languages,languageMessage,onChangeLanguage,voiceEnabled,soundEnabled,recognitionEnabled,ambientEnabled,onToggleVoice,onToggleSound,onToggleRecognition,onToggleAmbient})
{
 return (
   <div className="settingsScreen">
     <button type="button" className="back" onClick={onBack}><ArrowLeft /></button>
     <div className="panel">
       <h1>Configurações</h1>
       <div className="settingsList">
         <div className="languageSetting">
           <label htmlFor="language-select"><Languages size={18} /> Idioma do aplicativo</label>
           <select id="language-select" value={language} onChange={(event)=>onChangeLanguage(event.target.value)}>
             <option value="pt-BR">Português (Brasil)</option>
             {languages.filter((item)=>item.code!=='pt-BR' && item.code!=='pt').map((item)=>(
               <option key={item.code} value={item.code}>{item.name}</option>
             ))}
           </select>
           <small>Idiomas oferecidos pelo Google Cloud Translation. Para traduzir, o conteúdo visível desta tela é enviado ao serviço e é necessário estar conectado.</small>
           {!user && <small>Entre na conta para carregar os idiomas e traduzir o aplicativo.</small>}
           {languageMessage && <span className="languageMessage" role="status">{languageMessage}</span>}
         </div>
         <button type="button" className="switchRow accountRow" onClick={onOpenAccount}>
           {user?<LogOut size={18} />:<LogIn size={18} />}
           <span>Conta e sincronização</span>
           <strong>{user?'Conectada':'Entrar'}</strong>
         </button>
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
           <span>Música clássica calma</span>
           <strong>{ambientEnabled ? 'Ligado' : 'Desligado'}</strong>
         </button>
         <small className="soundNote">Trilha original sintetizada, sem gravação de terceiros. O navegador inicia o áudio após o primeiro toque.</small>
       </div>
     </div>
   </div>
 );
}

function DiagnosticScreen({questions, answers, onAnswer, onSubmit,onOpenAccount}) {
  const answeredCount = questions.filter((question) => answers[question.id] !== undefined).length;
  const isReady = answeredCount === questions.length;

  return (
    <div className="diagnosticScreen">
      <div className="diagnosticCard">
        <div className="diagnosticHeader">
          <BookOpen size={28} />
          <div>
            <small>Questionário para escolher uma atividade</small>
            <h1>FonoPirata</h1>
          </div>
        </div>

        <p className="diagnosticIntro">Responda 20 perguntas sobre observações do dia a dia. Elas ajudam a sugerir uma ilha para começar, mas não avaliam nem diagnosticam a criança.</p>
        <div className="screeningNotice">Este questionário não substitui avaliação fonoaudiológica. Se houver preocupação com fala, audição ou comunicação, converse com um fonoaudiólogo ou pediatra.</div>
        <button type="button" className="diagnosticLogin" onClick={onOpenAccount}>Já tem uma conta? Entrar e sincronizar</button>

        {questions.map((question, index) => (
          <div key={question.id} className="diagnosticQuestion">
            <h2>{index + 1}. {question.question}</h2>
            <div className="diagnosticOptions">
              {question.options.map((option) => (
                <label key={option.label} className={`option ${answers[question.id] === option.value ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === option.value}
                    onChange={() => onAnswer(question.id, option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <button type="button" className="submitDiagnostic" disabled={!isReady} onClick={onSubmit}>
          Ver sugestão de início
        </button>
      </div>
    </div>
  );
}

function DiagnosticResultScreen({ result, onContinue }) {
  return (
    <div className="diagnosticScreen">
      <div className="diagnosticCard resultCard">
        <div className={`resultBadge ${result.tone}`}>{result.title}</div>
        <h1>Sua jornada começa aqui</h1>
        <p>{result.message}</p>
        <div className="resultTip">
          <strong>Importante:</strong>
          <span>{result.disclaimer}</span>
        </div>
        <button type="button" className="submitDiagnostic" onClick={onContinue}>Ir para a ilha sugerida</button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
