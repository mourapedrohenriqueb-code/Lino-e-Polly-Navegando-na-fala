import { useState } from 'react';
import { ArrowLeft, BookOpen, Check, Compass, Headphones, Heart, Lightbulb, Sparkles, Volume2 } from 'lucide-react';
import { dailyMissionGoal, getStoryChapter, rotateItems } from './adventure';
import './adventure.css';

const storyChapters = [
  { title: 'O mapa que sussurrava', text: 'Lino e Polly encontram um mapa que só revela o caminho quando a tripulação pratica os sons das letras.' },
  { title: 'A praia das sílabas', text: 'Uma trilha de conchas separa as palavras em pedacinhos. Junte cada som e ajude os amigos a atravessar a praia.' },
  { title: 'O mercado das palavras', text: 'Na ilha movimentada, cada palavra nomeia uma pista. Escute, explore e descubra o que está escondido.' },
  { title: 'A ponte das frases', text: 'Para alcançar o outro lado, a tripulação precisa organizar ideias e falar cada frase no seu ritmo.' },
  { title: 'A biblioteca flutuante', text: 'Uma biblioteca aparece entre as ondas. Leia uma história por vez e descubra novos caminhos.' },
  { title: 'O tesouro das histórias', text: 'O grande tesouro é uma coleção de histórias para compartilhar. Cada página guarda uma nova aventura.' }
];

const mascotOptions = [
  { id: 'lino', label: 'Lino', image: `${import.meta.env.BASE_URL}assets/lino.png` },
  { id: 'polly', label: 'Polly', image: `${import.meta.env.BASE_URL}assets/polly-purple.png` }
];

const boatOptions = ['⛵', '🚤', '🛶', '🏴‍☠️'];
const decorationOptions = ['⭐', '🐚', '🌴', '🦀'];
const rhymeChallenges = [
  { word: 'GATO', answer: 'PATO', options: ['PATO', 'BOLA', 'CASA'] },
  { word: 'JANELA', answer: 'PANELA', options: ['PANELA', 'GATO', 'SOL'] },
  { word: 'CORAÇÃO', answer: 'BALÃO', options: ['BALÃO', 'LIVRO', 'CASA'] },
  { word: 'PÃO', answer: 'MÃO', options: ['MÃO', 'GATO', 'BOLA'] }
];
const memoryPairs = [
  { word: 'CASA', icon: '🏠' },
  { word: 'SOL', icon: '☀️' },
  { word: 'GATO', icon: '🐱' },
  { word: 'BOLA', icon: '⚽' }
];

function RhymeGame({ onSpeak }) {
  const [round, setRound] = useState(0);
  const [result, setResult] = useState('');
  const challenge = rhymeChallenges[round % rhymeChallenges.length];
  const options = rotateItems(challenge.options, round);

  const chooseAnswer = (answer) => {
    setResult(answer === challenge.answer
      ? 'Boa! Você encontrou uma palavra que rima. Toda tentativa ajuda a aprender.'
      : 'Boa tentativa! Escute o som final e escolha outra palavra.');
  };

  return (
    <section className="adventureGame">
      <div className="adventureSectionTitle"><span>🎵</span><div><h2>Caça às rimas</h2><p>Encontre uma palavra com som parecido no final.</p></div></div>
      <div className="rhymePrompt">
        <strong>{challenge.word}</strong>
        <button type="button" onClick={() => onSpeak(challenge.word)} aria-label={`Ouvir ${challenge.word}`}><Volume2 /></button>
      </div>
      <div className="rhymeChoices">
        {options.map((option) => (
          <button type="button" key={option} onClick={() => chooseAnswer(option)}>{option}</button>
        ))}
      </div>
      {result && <p className="gameFeedback" role="status">{result}</p>}
      <button type="button" className="adventureSecondary" onClick={() => { setRound((value) => value + 1); setResult(''); }}>Outra rodada</button>
    </section>
  );
}

function MemoryGame() {
  const [round, setRound] = useState(0);
  const [selectedWord, setSelectedWord] = useState(null);
  const [matchedWords, setMatchedWords] = useState([]);
  const [result, setResult] = useState('');
  const picturePairs = rotateItems(memoryPairs, (round % (memoryPairs.length - 1)) + 1);

  const chooseIcon = (pair) => {
    if (!selectedWord) {
      setResult('Escolha primeiro uma palavra para combinar.');
      return;
    }
    if (selectedWord === pair.word) {
      setMatchedWords((words) => words.includes(pair.word) ? words : [...words, pair.word]);
      setResult('Par encontrado! Você combinou a palavra com a figura.');
    } else {
      setResult('Quase! Tente outra combinação.');
    }
    setSelectedWord(null);
  };

  return (
    <section className="adventureGame">
      <div className="adventureSectionTitle"><span>🧩</span><div><h2>Memória de palavras</h2><p>Escolha uma palavra e encontre a figura correspondente.</p></div></div>
      <div className="memoryBoard">
        <div className="memoryColumn" aria-label="Palavras">
          {memoryPairs.map((pair) => (
            <button type="button" key={pair.word} className={matchedWords.includes(pair.word) ? 'matched' : selectedWord === pair.word ? 'selected' : ''} onClick={() => { setSelectedWord(pair.word); setResult(''); }} disabled={matchedWords.includes(pair.word)}>
              {matchedWords.includes(pair.word) ? <><Check size={17} /> {pair.word}</> : pair.word}
            </button>
          ))}
        </div>
        <div className="memoryColumn" aria-label="Figuras">
          {picturePairs.map((pair) => (
            <button type="button" key={pair.icon} className={matchedWords.includes(pair.word) ? 'matched' : ''} onClick={() => chooseIcon(pair)} disabled={matchedWords.includes(pair.word)} aria-label={`Figura ${pair.word}`}>
              {matchedWords.includes(pair.word) ? <Check size={18} /> : pair.icon}
            </button>
          ))}
        </div>
      </div>
      {result && <p className="gameFeedback" role="status">{result}</p>}
      {matchedWords.length === memoryPairs.length && <p className="gameComplete">Você encontrou todos os pares! Quer jogar de novo? <button type="button" onClick={() => { setRound((value) => value + 1); setMatchedWords([]); setSelectedWord(null); setResult(''); }}>Recomeçar</button></p>}
    </section>
  );
}

export default function AdventureHub({
  islands, completed, totalAttempts, totalCorrect, dailyMission, mascot, boat, decoration,
  onChooseMascot, onChooseBoat, onChooseDecoration, onStartStory, onStartListening,
  onBack, onSpeak, reduceMotion, onToggleReduceMotion
}) {
  const [familyGuidanceOpen, setFamilyGuidanceOpen] = useState(false);
  const chapterNumber = getStoryChapter(completed, storyChapters.length);
  const chapter = storyChapters[chapterNumber - 1];
  const nextIsland = islands.find((island) => island.id === chapterNumber && island.unlocked)
    ?? islands.find((island) => island.unlocked)
    ?? islands[0];
  const missionComplete = dailyMission.attempts >= dailyMissionGoal;
  const missionPercent = Math.min(100, (dailyMission.attempts / dailyMissionGoal) * 100);

  return (
    <main className="adventureScreen">
      <button type="button" className="back" onClick={onBack} aria-label="Voltar ao mapa"><ArrowLeft /></button>
      <header className="adventureHero">
        <div><span className="adventureEyebrow"><Compass size={16} /> CADERNO DE AVENTURA</span><h1>Mais aventuras, do seu jeito!</h1><p>As atividades originais continuam no mapa. Aqui você encontra extras opcionais.</p></div>
        <span className="adventureHeroIcon" aria-hidden="true">🗺️</span>
      </header>

      <section className="adventureCard storyCard">
        <div className="adventureSectionTitle"><span>📖</span><div><h2>Uma história por ilha</h2><p>Capítulo {chapterNumber} de {storyChapters.length} · {chapter.title}</p></div></div>
        <p>{chapter.text}</p>
        <button type="button" className="adventurePrimary" onClick={() => onStartStory(nextIsland.id)}><BookOpen size={18} />Ir para {nextIsland.title}</button>
      </section>

      <section className="adventureCard missionCard">
        <div className="adventureSectionTitle"><span>🎯</span><div><h2>Missão de hoje</h2><p>Tente praticar {dailyMissionGoal} exemplos. Vale tentar, sem precisar acertar.</p></div></div>
        <div className="missionProgress" role="progressbar" aria-label="Progresso da missão diária" aria-valuenow={dailyMission.attempts} aria-valuemin={0} aria-valuemax={dailyMissionGoal}><i style={{ width: `${missionPercent}%` }} /></div>
        <div className="missionFooter"><strong>{missionComplete ? 'Missão cumprida! Muito bem por praticar.' : `${dailyMission.attempts} de ${dailyMissionGoal} tentativas`}</strong><button type="button" onClick={onStartListening}><Headphones size={17} />Começar praticando</button></div>
      </section>

      <section className="adventureCard">
        <div className="adventureSectionTitle"><span>✨</span><div><h2>Deixe a aventura com a sua cara</h2><p>Escolha opções visuais sem gastar moedas.</p></div></div>
        <div className="cosmeticGroups">
          <fieldset><legend>Companheiro</legend><div className="cosmeticOptions">{mascotOptions.map((option) => <button type="button" key={option.id} className={mascot === option.id ? 'chosen' : ''} onClick={() => onChooseMascot(option.id)}><img src={option.image} alt="" />{option.label}</button>)}</div></fieldset>
          <fieldset><legend>Barco</legend><div className="cosmeticOptions">{boatOptions.map((option) => <button type="button" key={option} className={boat === option ? 'chosen' : ''} onClick={() => onChooseBoat(option)} aria-pressed={boat === option}>{option}</button>)}</div></fieldset>
          <fieldset><legend>Enfeite do mapa</legend><div className="cosmeticOptions">{decorationOptions.map((option) => <button type="button" key={option} className={decoration === option ? 'chosen' : ''} onClick={() => onChooseDecoration(option)} aria-pressed={decoration === option}>{option}</button>)}</div></fieldset>
        </div>
      </section>

      <section className="adventureCard">
        <div className="adventureSectionTitle"><span>🎲</span><div><h2>Jogos rápidos</h2><p>Dois jeitos extras de brincar com palavras.</p></div></div>
        <RhymeGame onSpeak={onSpeak} />
        <MemoryGame />
        <button type="button" className="adventureSecondary" onClick={onStartListening}><Headphones size={17} />Só quero ouvir primeiro</button>
      </section>

      <details className="adventureCard familyCard">
        <summary><span><Heart size={20} /> Área da família e cuidadores</span><small>Orientações e resumo do progresso</small></summary>
        <div className="familyContent">
          <p>As ilhas e os exemplos já praticados continuam no mapa e no diário de bordo. Escolha uma ilha liberada para apoiar a próxima brincadeira.</p>
          <div className="familyProgress" aria-label="Resumo de uso do jogo"><strong>{completed} ilhas concluídas</strong><strong>{totalAttempts} tentativas registradas</strong><strong>{totalCorrect} respostas reconhecidas</strong></div>
          <div className="familyIslandChoices">{islands.filter((island) => island.unlocked).map((island) => <button type="button" key={island.id} onClick={() => onStartStory(island.id)}>{island.title}</button>)}</div>
          <ul><li>Valorize a tentativa e façam pausas quando a criança quiser.</li><li>O jogo não faz diagnósticos; dúvidas sobre fala devem ser conversadas com um fonoaudiólogo ou pediatra.</li><li>As gravações de voz não são salvas pelo aplicativo. O reconhecimento pode ser processado pelo serviço de fala do navegador.</li></ul>
          <button type="button" className="adventureSecondary" onClick={() => setFamilyGuidanceOpen((value) => !value)}><Lightbulb size={17} />{familyGuidanceOpen ? 'Ocultar boas práticas' : 'Ver boas práticas'}</button>
          {familyGuidanceOpen && <div className="familyTips"><strong>Uma brincadeira leve funciona melhor:</strong><ol><li>Deixe a criança escolher a palavra ou a história.</li><li>Mostre primeiro como ouvir ou falar o exemplo, sem cobrar repetição.</li><li>Faça uma pausa se houver cansaço; não é necessário completar uma missão.</li></ol></div>}
        </div>
      </details>

      <div className="adventureAccessibility">
        <Sparkles size={18} /><span>Animações reduzidas</span><button type="button" aria-pressed={reduceMotion} onClick={onToggleReduceMotion}>{reduceMotion ? 'Ligado' : 'Desligado'}</button>
      </div>
      {dailyMission.attempts < dailyMissionGoal && <span className="adventureNote" aria-live="polite">A missão continua aberta; pratique no seu ritmo.</span>}
    </main>
  );
}
