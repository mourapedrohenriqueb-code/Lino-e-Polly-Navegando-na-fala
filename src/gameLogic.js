const unique = (items) => [...new Set(items)];

export const alphabetLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const baseWordBank = [
  'casa', 'bola', 'mesa', 'boneca', 'pato', 'gato', 'sol', 'lua', 'flor', 'rio', 'livro', 'mãe', 'pai', 'filho', 'amigo', 'jardim',
  'escola', 'professor', 'caderno', 'lápis', 'caneta', 'maçã', 'banana', 'uva', 'laranja', 'limão', 'pão', 'arroz', 'feijão', 'carro',
  'bicicleta', 'pescador', 'montanha', 'mar', 'praia', 'voar', 'andar', 'correr', 'saltar', 'brincar', 'chorar', 'rir', 'dançar', 'escutar',
  'falar', 'aprender', 'lembrar', 'imaginar', 'coelho', 'cachorro', 'gato', 'pássaro', 'peixe', 'tigre', 'leão', 'cavalo', 'elefante', 'zebra',
  'jogar', 'bola', 'piano', 'cantor', 'música', 'cantiga', 'palavra', 'frase', 'texto', 'leitura', 'sonho', 'futuro', 'presente', 'passado',
  'amarelo', 'azul', 'verde', 'vermelho', 'rosa', 'preto', 'branco', 'cinza', 'marrom', 'roxo', 'jardim', 'nuvem', 'chuva', 'vento', 'sol',
  'janela', 'porta', 'quarto', 'cozinha', 'banheiro', 'sofá', 'cadeira', 'tapete', 'almofada', 'fogão', 'prato', 'copo', 'garrafa', 'lâmpada',
  'telefone', 'tablet', 'notebook', 'cadeado', 'chave', 'andar', 'escada', 'parque', 'piscina', 'passeio', 'história', 'fantasia', 'aventura',
  'avó', 'vovó', 'vovô', 'neto', 'neta', 'irmão', 'irmã', 'família', 'trabalho', 'brincadeira', 'esforço', 'alegria', 'curiosidade', 'gentileza',
  'sabedoria', 'educação', 'invenção', 'arte', 'cinema', 'teatro', 'música', 'campo', 'cidade', 'vila', 'rio', 'laguna', 'vale', 'montanha', 'sombra',
  'relva', 'bichinho', 'borboleta', 'abelha', 'formiga', 'lagarta', 'joaninha', 'rato', 'rã', 'sapo', 'libélula', 'pipa', 'papagaio', 'pirata', 'foca',
  'trevo', 'nuvem', 'caminho', 'estação', 'mágica', 'fábula', 'milagre', 'luz', 'sombra', 'vento', 'brisa', 'sucesso', 'descoberta', 'gravidade',
  'coisa', 'amora', 'morango', 'kiwi', 'pera', 'manga', 'abacaxi', 'uva', 'maracujá', 'caju', 'marmita', 'lanche', 'almoço', 'jantar', 'café',
  'chocolate', 'sanduíche', 'refrigerante', 'água', 'suco', 'leite', 'iogurte', 'mamão', 'melancia', 'milho', 'batata', 'legume', 'verdura', 'salada',
  'vistoria', 'cobertor', 'roupa', 'sapato', 'meia', 'camisa', 'calça', 'boné', 'chapéu', 'cachecol', 'guarda-chuva', 'sorriso', 'olhar', 'escuta',
  'resposta', 'pergunta', 'conversa', 'atenção', 'paciência', 'energia', 'foco', 'cuidado', 'liberdade', 'segurança', 'confiança', 'coragem', 'felicidade'
];

const extraNouns = [
  'abajur', 'acampamento', 'açúcar', 'agulha', 'alface', 'algodão', 'anel', 'antena', 'apito', 'aquário',
  'arco', 'armário', 'aspirador', 'avião', 'avental', 'balde', 'bandeira', 'barraca', 'barulho', 'bateria',
  'berço', 'biblioteca', 'bigode', 'binóculo', 'blusa', 'bombeiro', 'brinquedo', 'cachoeira', 'calendário',
  'caminhão', 'campainha', 'caneca', 'capivara', 'caranguejo', 'carteira', 'castelo', 'cavalo', 'cenoura',
  'chocolateira', 'chuveiro', 'cigarra', 'colher', 'computador', 'concha', 'coração', 'coroa', 'corrida',
  'dentista', 'desenho', 'dinossauro', 'escova', 'espelho', 'estrela', 'fada', 'fazenda', 'ferramenta',
  'foguete', 'fogos', 'fotografia', 'fruta', 'galinha', 'garfo', 'girafa', 'gorila', 'grilo', 'helicóptero',
  'horta', 'igreja', 'jacaré', 'joelho', 'jornal', 'lagoa', 'lápis', 'limpeza', 'mamadeira', 'manteiga',
  'máquina', 'martelo', 'medalha', 'mel', 'mochila', 'navio', 'ovelha', 'panela', 'papel', 'passarinho',
  'patinete', 'pente', 'pipoca', 'planeta', 'polvo', 'prateleira', 'presente', 'quadro', 'queijo', 'rádio',
  'relógio', 'robô', 'sereia', 'tesoura', 'tartaruga', 'toalha', 'tomate', 'travesseiro', 'violão', 'zangão'
];

function makePlural(word) {
  if (/s$/i.test(word)) return '';
  if (/ão$/i.test(word)) return '';
  if (/[aeiou]$/i.test(word)) return `${word}s`;
  if (/[rz]$/i.test(word)) return `${word}es`;
  if (/m$/i.test(word)) return `${word.slice(0, -1)}ns`;
  const pluralExceptions = { anel: 'anéis', animal: 'animais', jornal: 'jornais', papel: 'papéis' };
  if (pluralExceptions[word]) return pluralExceptions[word];
  if (/l$/i.test(word)) return '';
  return `${word}s`;
}

export const wordBank = unique([
  ...baseWordBank,
  ...extraNouns,
  ...extraNouns.map(makePlural).filter(Boolean)
]);

function splitSyllables(word) {
  const vowels = 'aeiouáéíóúâêôãõü';
  const validOnsets = new Set(['br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'vr', 'bl', 'cl', 'fl', 'gl', 'pl', 'ch', 'lh', 'nh', 'rr']);
  const nuclei = [];

  for (let index = 0; index < word.length; index += 1) {
    if (vowels.includes(word[index])) {
      let end = index + 1;
      while (end < word.length && vowels.includes(word[end])) end += 1;
      nuclei.push([index, end]);
      index = end - 1;
    }
  }

  if (!nuclei.length) return [];

  const syllables = [];
  let start = 0;
  for (let index = 0; index < nuclei.length - 1; index += 1) {
    const gap = word.slice(nuclei[index][1], nuclei[index + 1][0]);
    const finalPair = gap.slice(-2);
    const onsetLength = validOnsets.has(finalPair) ? 2 : Math.min(1, gap.length);
    const split = nuclei[index + 1][0] - onsetLength;
    syllables.push(word.slice(start, split));
    start = split;
  }
  syllables.push(word.slice(start));
  return syllables.filter(Boolean);
}

export function getSyllableGuide(text) {
  return String(text).split(/(\s+)/).map((token) => {
    const word = token.match(/[\p{L}]+/u)?.[0];
    if (!word) return token;
    const guide = splitSyllables(word.toLocaleLowerCase('pt-BR')).join('·').toLocaleUpperCase('pt-BR');
    return token.replace(word, guide);
  }).join('');
}

export const portugueseSyllables = unique(
  wordBank.flatMap((word) => splitSyllables(word.toLocaleLowerCase('pt-BR')))
).sort((first, second) => first.localeCompare(second, 'pt-BR')).map((syllable) => syllable.toLocaleUpperCase('pt-BR'));

const basePhraseBank = [
  'A menina brinca no parque.',
  'O menino fala com alegria.',
  'Eu gosto de aprender novas palavras.',
  'A casa tem uma janela bonita.',
  'O cachorro corre pelo jardim.',
  'Hoje vou ao mercado com a mãe.',
  'A professora lê uma história interessante.',
  'Eu escuto com atenção durante a aula.',
  'A bola rola na grama verde.',
  'O pássaro canta no galho da árvore.',
  'Meus amigos brincam na escola.',
  'A água está gelada e refrescante.',
  'Minha mochila está cheia de livros.',
  'Vamos contar histórias antes de dormir.',
  'O peixe nada no rio claro.',
  'A lua ilumina a noite calma.',
  'Eu adoro pintar com guache.',
  'O sol aparece cedo pela manhã.',
  'Meu sonho é viajar para o mar.',
  'A família come junto no almoço.',
  'O carro passa pela rua tranquila.',
  'Eu quero aprender a escrever bem.',
  'O vento balança as árvores.',
  'A criança sorri ao ouvir música.',
  'A semana começou com energia.',
  'Eu mostrei meu desenho para o professor.',
  'A porta da escola está aberta.',
  'A professora elogia o esforço da turma.',
  'O cachorro late quando vê o carteiro.',
  'Hoje eu vou ajudar em casa.',
  'Eu sinto orgulho de meu progresso.',
  'A música ajuda a relaxar.',
  'A minha avó conta lindas histórias.',
  'A borboleta voa sobre a flor.',
  'Eu gosto de brincar de faz de conta.',
  'A praça está cheia de gente.',
  'Meu irmão lê um livro de aventura.',
  'A chuva molha as ruas da cidade.',
  'Eu aprendo palavras novas todos os dias.',
  'O sonho da família é viajar para a praia.',
  'O sapato novo está muito confortável.',
  'A escola transforma ideias em conhecimento.',
  'A menina segura a mochila com carinho.',
  'Meu amigo trouxe um presente.',
  'As crianças cantam com entusiasmo.',
  'O lobo da história é muito esperto.',
  'A avaliação está chegando e eu estou preparado.',
  'O papagaio repete a frase da professora.',
  'Eu falei com clareza durante o exercício.',
  'A reunião em família foi muito divertida.',
  'Hoje eu li um texto com atenção.',
  'A bicicleta do meu primo é azul.',
  'Meu pai ajuda na organização do quarto.',
  'A música de fundo deixou o ambiente alegre.',
  'A leitura melhora a comunicação da criança.',
  'Os amigos se ajudam quando precisam.',
  'Eu escolhi uma frase para treinar hoje.',
  'A mesa está pronta para o almoço.',
  'A lua cheia brilha no céu.',
  'A praça tem muitos brinquedos.',
  'As flores cheiram muito bem.',
  'O professor explicou a tarefa com calma.',
  'A água do rio está bonita.',
  'Eu gosto de ouvir histórias de suspense.',
  'A tarde foi cheia de descobertas.',
  'O desenho ficou muito bonito.',
  'A minha caneta escreve com precisão.',
  'O livro que escolhi fala sobre animais.',
  'A escola é um lugar de aprender e brincar.',
  'Hoje eu consegui falar sem medo.',
  'A professora pediu para repetir a palavra.',
  'O meu nome é escrito com letra cursiva.',
  'Eu gosto de ouvir a voz da professora.',
  'A mochila tem um espaço para o lanche.',
  'A cor amarela lembra o sol.',
  'A árvore grande oferece sombra.',
  'O rio passa pela cidade inteira.',
  'A flor cresceu perto da janela.',
  'A criança desenha uma casa no papel.',
  'Eu estudo com dedicação e paciência.',
  'A fala melhora quando praticamos todo dia.',
  'A família se reúne para celebrar.',
  'O patinho se move na lagoa.',
  'Eu me sinto mais confiante hoje.',
  'O texto foi lido com atenção total.',
  'A alegria da manhã me anima.',
  'A escola tem muitos momentos de aprendizado.',
  'Meu irmão conta uma história divertida.',
  'A música da rua me faz sorrir.',
  'Eu sigo as orientações com cuidado.',
  'A pequena mariposa pousou na flor.',
  'A leitura ativa a imaginação.',
  'A família caminha pela praça.',
  'Meu colega quis participar da brincadeira.',
  'O canto dos pássaros acorda a manhã.',
  'A joaninha ficou sobre a folha.',
  'A ponte liga o bairro ao parque.',
  'Hoje o céu está muito bonito.',
  'Eu consigo repetir palavras difíceis.',
  'O recreio foi cheio de risadas.',
  'A pesquisa sobre animais foi muito interessante.',
  'A fantasia me leva para outro mundo.',
  'O pirata navega em busca de tesouros.',
  'A mochila ajuda a guardar os materiais.',
  'A frase foi dita com clareza e ritmo.',
  'O aluno respondeu corretamente à pergunta.',
  'A sala de aula está organizada e acolhedora.',
  'Eu conto os passos até a escola.',
  'A caixa de lápis tem muitas cores.',
  'Meu café da manhã foi completo.',
  'A conversa com o amigo foi gentil.',
  'A frase longa exige atenção na fala.',
  'Meu sonho é ser professor.',
  'O vento bate na janela da casa.',
  'Os livros ajudam a crescer.',
  'A natureza encanta as crianças.',
  'O trabalho em grupo fortalece a amizade.',
  'Pequenas frases ajudam a falar melhor.',
  'Os meus amigos gostam de ouvir histórias.',
  'A horta da escola tem muitas verduras.',
  'Meu lápis vermelho é muito usado.'
];

const phraseActions = [
  'brincar no parque', 'pintar um desenho', 'cantar uma canção', 'ler uma história', 'cuidar das plantas',
  'jogar bola', 'visitar a biblioteca', 'passear com a família', 'conhecer um animal', 'montar um castelo',
  'preparar um lanche', 'andar de bicicleta', 'observar as estrelas', 'construir um brinquedo', 'fazer um bolo',
  'regar a horta', 'escutar os pássaros', 'aprender uma palavra', 'contar uma aventura', 'ajudar um amigo',
  'visitar os avós', 'desenhar uma paisagem', 'brincar com meus colegas', 'explorar a natureza', 'organizar meus livros'
];

const phraseDetails = [
  'com muita alegria', 'com meu melhor amigo', 'depois da escola', 'em uma tarde ensolarada', 'com bastante cuidado',
  'durante o fim de semana', 'perto da minha casa', 'com toda a família', 'na sala de aula', 'antes do jantar',
  'e aprender coisas novas', 'para me divertir', 'com atenção e carinho', 'em um lugar bonito', 'e contar para todos',
  'quando tenho tempo livre', 'com a ajuda da professora', 'em uma manhã tranquila', 'para cuidar da saúde', 'e dar boas risadas'
];

const generatedPhrases = phraseActions.flatMap((action) => phraseDetails.map((detail) => `Eu gosto de ${action} ${detail}.`));
export const phraseBank = unique([...basePhraseBank, ...generatedPhrases]);

const baseTextBank = [
  'Hoje eu fui à escola e aprendi novas palavras. Eu repeti as frases com atenção e fui muito feliz ao falar bem.',
  'Na sala de aula, a professora leu uma história sobre a natureza. Eu gostei muito da história e imaginei as árvores e os pássaros.',
  'Meu dia começou com um bom café e um passeio tranquilo. Depois, fui à escola e aprendi a formar frases mais claras.',
  'A casa da minha avó é grande e cheia de memórias. Eu gosto de ouvir as histórias dela e de brincar no quintal.',
  'No parque, as crianças brincam, correm e riem. O sol brilha e o vento balança as folhas das árvores.',
  'Hoje eu consegui ler um texto sem errar palavras. Meu professor elogiou meu esforço e minha atenção durante a leitura.',
  'No começo da tarde, o céu ficou azul e sem nuvens. Eu e meus amigos fomos ao pátio brincar com a bola.',
  'A leitura ajuda a melhorar a fala e a compreensão. Quando lemos com calma, entendemos melhor cada frase e cada palavra.',
  'Meu pai me levou ao mercado para comprar frutas. Escolhemos maçãs, bananas e laranjas para a sobremesa.',
  'A biblioteca da escola tem muitos livros interessantes. Eu gosto de ler historias sobre animais, aventuras e descobertas.',
  'Na aula de fala, o professor pediu para eu repetir algumas sílabas. Eu me senti mais confiante e consegui falar com clareza.',
  'A manhã foi cheia de atividades e aprendizado. Primeiro, escrevi algumas palavras e depois conversei com meus colegas.',
  'Durante a caminhada pela praça, vi um passarinho pousado no fio do poste. Ele cantou alto e eu fiquei observando com atenção.',
  'A professora explicou que a leitura e a fala fortalecem a memória. Eu fiquei motivado para praticar todas as atividades com mais entusiasmo.',
  'No fim do dia, minha família sentou à mesa para jantar. Eu contei como foi a aula e como aprendi coisas novas.',
  'As crianças da escola fizeram uma apresentação de dança e música. Todos se esforçaram para falar e cantar com alegria.',
  'Meu livro favorito fala sobre um pirata curioso e aventureiro. Ele explora o mar e aprende muitas coisas novas durante a viagem.',
  'Hoje eu pratico a leitura em voz alta. Isso ajuda a melhorar a entonação, a clareza e a confiança na fala.',
  'No recreio, eu brinquei de corrida com meus amigos. Depois, voltamos para a sala e seguimos com as atividades.',
  'A professora pediu para eu produzir uma frase longa. Eu respondi com calma e consegui falar todas as palavras sem pressa.',
  'A minha mochila está sempre organizada. Dentro dela, eu guardo o caderno, o lápis, a borracha e o livro de leitura.',
  'Na casa da minha tia, há uma horta com folhas verdes e verduras. Eu gosto de ajudar a regar as plantas e aprender sobre a natureza.',
  'Hoje eu conto uma história para minha família. A história fala de um menino que encontrou um tesouro escondido no jardim.',
  'Muitas palavras podem ser difíceis de falar no começo. Com prática e paciência, a fala fica cada vez mais clara e natural.',
  'Na escola, a professora apresentou uma atividade de pintura. Eu pintei o céu com tons de azul e o sol com amarelo brilhante.',
  'Eu gosto de ouvir música e cantar junto com meus amigos. A música torna a aula mais alegre e também ajuda a melhorar a fala.',
  'Meu irmão mais velho me ensinou algumas sílabas e palavras novas. Eu me senti muito orgulhoso em repetir tudo corretamente.',
  'O parque é um lugar cheio de alegria. Há árvores, brinquedos, pessoas conversando e crianças correndo por todos os lados.',
  'No fim de semana, fui à praia com minha família. O mar estava bonito, e eu me divirti muito brincando com a areia.',
  'As histórias infantis ajudam a exercitar a imaginação. Cada personagem tem uma lição interessante para a vida e para a fala.',
  'Eu andei de bicicleta em um caminho tranquilo. Depois, sentei no banco do parque e conversei com os amigos sobre o dia.',
  'A professora escreveu várias frases na lousa. Eu as li em voz alta, prestando atenção à pronúncia e ao ritmo da fala.',
  'Hoje a chuva caiu forte e a rua ficou molhada. Mesmo assim, eu fui à escola com minha mochila e continuei aprendendo.',
  'A leitura em grupo é divertida porque todos compartilham ideias e opiniões. Eu gosto de ouvir o que meus colegas têm a dizer.',
  'Meu sonho é escrever um livro sobre aventuras no céu. Eu imagino personagens que viajam entre nuvens e estrelas.',
  'A escola favorece o desenvolvimento da fala, da leitura e da criatividade. Cada atividade contribui para o crescimento da criança.',
  'Na biblioteca, encontrei uma história de um cavalo que corria muito rápido. Eu ri ao imaginar a sua aventura pelo campo.',
  'Eu gosto de repetir frases do texto para treinar a voz. Essa prática ajuda a falar com mais calma e segurança.',
  'Hoje eu aprendi que a atenção faz toda a diferença. Quando eu escuto com atenção, entendo melhor o que foi dito.',
  'Na escola, as crianças foram ao laboratório para observar plantas e flores. Foi uma atividade muito interessante e educativa.',
  'A fala se torna mais forte quando a criança pratica todo dia. Quanto mais treino, mais confiante eu me sinto.',
  'Na história que li, uma menina encontrou uma chave dourada. Ela abriu uma porta secreta e descobriu um mundo mágico.',
  'Eu gosto de imaginar histórias com personagens engraçados e aventuras inesperadas. A imaginação me ajuda a falar com mais criatividade.',
  'Meu pai leu para mim antes de dormir. A história falava de um lobinho que aprendeu a ser gentil e corajoso.',
  'No pátio da escola, as crianças fizeram um jogo de perguntas e respostas. Eu participei e aprendi palavras novas.',
  'A fala clara depende da respiração, da pronúncia e do ritmo. Quando pratico, meu discurso fica mais natural.',
  'Hoje eu completei um exercício de leitura em voz alta. O professor ficou satisfeito e elogiou minha organização e atenção.',
  'Meu caderno está cheio de desenhos e frases. Eu gosto de escrever pequenas histórias sobre amigos, animais e viagens.',
  'A tarde foi fresca e bonita. Eu caminhei até a praça e vi muitas flores em volta do lago.',
  'O texto sobre a natureza ensinou que cada ser vivo tem sua importância. Eu fiquei pensando na responsabilidade de cuidar do planeta.',
  'Eu gosto de falar sobre meus hobbies e minhas preferências. Isso me ajuda a expressar minhas ideias com clareza.',
  'A escola organizou uma feira de livros. Eu levei um livro de histórias e fiquei muito feliz ao descobrir novas aventuras.',
  'Durante a leitura, eu parei para respirar e pronunciar com calma. Essa pausa me ajudou a falar melhor e sem pressa.',
  'Na aula de português, aprendemos a separar as sílabas das palavras. Isso torna a leitura mais simples e divertida.',
  'Meu amigo contou uma piada e todos riram. A conversa ficou leve, alegre e cheia de energia positiva.',
  'Eu gosto de ouvir sons suaves e regulares. Isso me acalma quando vou estudar ou descansar.',
  'As flores do jardim têm cores diferentes. Algumas são vermelhas, outras amarelas e outras brancas.',
  'A história do patinho feio me ensinou que a diferença pode se transformar em beleza. Eu também aprendi a respeitar as pessoas.',
  'Hoje eu desenhei uma paisagem com céu, montanha e rio. Depois, descrevi todos os elementos com frases bem escolhidas.',
  'A conversa em família é sempre cheia de aprendizado. Eu conto minhas experiências e também ouço as de meus parentes.',
  'A tarde foi de brincadeiras no parque. Eu corri, subi no escorregador e depois sentei para tomar água.',
  'Meu livro favorito tem muitas páginas ilustradas. Cada imagem me ajuda a compreender melhor as ideias do texto.',
  'A menina do texto gosta de cantar e de ouvir histórias. Ela fala com entusiasmo e consegue emocionar os amigos.',
  'Eu pratiquei a fala em frente ao espelho e fiquei mais confiante. A cada repetição, eu percebi melhor minha pronúncia.',
  'Na sala, as crianças ouviram uma frase longa e depois a repetiram. Foi um exercício útil para melhorar a clareza e o ritmo.',
  'A escola está cheia de oportunidades de aprender e criar. Cada dia é uma chance de crescer e descobrir novas coisas.',
  'Eu gosto de ler histórias sobre amizade, coragem e carinho. Elas me inspiram a ser uma pessoa melhor.',
  'O passeio de hoje foi muito interessante. Vi árvores, flores, pássaros e o céu claro acima de tudo.',
  'A criança conseguiu falar todas as palavras sem travar. Isso mostra que a prática, a calma e a atenção fazem muita diferença.',
  'Hoje eu fui ao museu com a turma. Vi pinturas, esculturas e objetos antigos que me deixaram curioso.',
  'A leitura de um bom texto melhora a capacidade de falar e de refletir. Eu percebo isso em cada atividade trabalhada em sala.',
  'Meu próximo desafio é contar uma história inteira com clareza. Eu vou praticar em voz alta até me sentir seguro.',
  'No início da semana, a professora falou sobre as sílabas e as palavras. Eu consegui entender melhor cada som e cada letra.',
  'As nuvens se movem lentamente pelo céu. Eu fico observando e criando histórias sobre o que pode estar além delas.'
];

const textBeginnings = [
  'Hoje, a turma fez uma descoberta especial.',
  'Em uma manhã tranquila, a criança saiu para passear.',
  'Na escola, todos se prepararam para uma nova atividade.',
  'Certo dia, um grupo de amigos decidiu explorar o bairro.',
  'No fim de semana, a família planejou um passeio diferente.',
  'A professora levou uma surpresa para a sala.',
  'Depois da chuva, o jardim ficou cheio de vida.',
  'O pequeno explorador acordou cheio de curiosidade.',
  'Na biblioteca, havia uma mesa repleta de livros.',
  'Uma ideia divertida surgiu durante a brincadeira.'
];

const textMiddles = [
  'Eles observaram cada detalhe e fizeram perguntas interessantes.',
  'Todos participaram com calma e compartilharam suas ideias.',
  'Um amigo ajudou o outro a resolver o desafio.',
  'As cores, os sons e os cheiros chamaram a atenção de todos.',
  'A atividade ensinou novas palavras e despertou a imaginação.',
  'Juntos, eles descobriram um caminho seguro para continuar.',
  'Cada pessoa contou o que percebeu e escutou os colegas.',
  'A experiência ficou mais alegre com histórias e risadas.',
  'Com paciência, o grupo encontrou uma solução criativa.',
  'A criança anotou a novidade para contar em casa.'
];

const textEndings = [
  'No final, todos voltaram para casa felizes com o que aprenderam.',
  'Foi um momento especial que eles lembrariam por muito tempo.',
  'A turma combinou de repetir a aventura em outro dia.',
  'Cada um levou uma nova ideia para compartilhar com a família.',
  'Assim, uma simples atividade se transformou em uma grande história.',
  'O passeio terminou com um sorriso e muitas coisas para contar.',
  'A criança ficou orgulhosa por participar do começo ao fim.',
  'Todos perceberam que aprender junto pode ser muito divertido.',
  'Depois, eles desenharam a experiência em seus cadernos.',
  'Aquela descoberta inspirou novas brincadeiras e conversas.'
];

const generatedTexts = textBeginnings.flatMap((beginning) =>
  textMiddles.flatMap((middle) => textEndings.map((ending) => `${beginning} ${middle} ${ending}`))
);
export const textBank = unique([...baseTextBank, ...generatedTexts]).slice(0, 500);

export const bookRecommendations = [
  { title: 'Alice no País das Maravilhas', age: '8+', type: 'fantasia', reason: 'Uma aventura clássica para conversar sobre personagens e acontecimentos.', url: 'https://www.gutenberg.org/ebooks/11' },
  { title: 'O Mágico de Oz', age: '8+', type: 'aventura', reason: 'Acompanha uma jornada com amizade, coragem e novos lugares.', url: 'https://www.gutenberg.org/ebooks/55' },
  { title: 'Peter Pan', age: '8+', type: 'aventura', reason: 'Uma história de fantasia para explorar imaginação e narrativa.', url: 'https://www.gutenberg.org/ebooks/16' },
  { title: 'O Jardim Secreto', age: '9+', type: 'literatura', reason: 'Uma narrativa sobre amizade, natureza e mudanças.', url: 'https://www.gutenberg.org/ebooks/113' },
  { title: 'As Aventuras de Tom Sawyer', age: '9+', type: 'aventura', reason: 'Histórias de infância para praticar reconto e vocabulário.', url: 'https://www.gutenberg.org/ebooks/74' },
  { title: 'Fábulas de Esopo', age: '6+', type: 'fábula', reason: 'Narrativas curtas que ajudam a conversar sobre escolhas e personagens.', url: 'https://www.gutenberg.org/ebooks/search/?query=Aesop%27s+Fables' }
];

export function getDiagnosticQuestions() {
  const prompts = [
    'Pessoas que não convivem com a criança entendem o que ela diz?',
    'A criança costuma ser entendida por familiares em conversas do dia a dia?',
    'A criança demonstra perceber sons e vozes em ambientes tranquilos?',
    'A criança responde quando é chamada pelo nome?',
    'A criança compreende instruções simples adequadas à idade?',
    'A criança consegue pedir ajuda ou expressar necessidades?',
    'A criança usa palavras para falar sobre pessoas e objetos conhecidos?',
    'A criança aprende e usa palavras novas no cotidiano?',
    'A criança combina palavras para formar frases?',
    'A criança consegue contar algo que aconteceu recentemente?',
    'A criança participa de conversas com outras pessoas?',
    'A criança consegue esperar sua vez para falar em uma conversa?',
    'A criança fala sem demonstrar esforço ou desconforto?',
    'A criança consegue repetir palavras ou frases quando solicitado?',
    'A criança demonstra interesse em histórias e leitura compartilhada?',
    'A criança consegue acompanhar uma história curta lida em voz alta?',
    'A criança usa gestos, expressões ou palavras para se comunicar?',
    'A criança consegue comunicar-se em diferentes ambientes, como casa e escola?',
    'A criança consegue falar sobre algo que deseja ou que aconteceu?',
    'A criança demonstra confiança ao se comunicar com pessoas conhecidas?'
  ];
  const options = [
    { label: 'Ainda não / quase nunca', value: 1 },
    { label: 'Às vezes / com bastante apoio', value: 2 },
    { label: 'Na maioria das vezes', value: 3 },
    { label: 'Sim / com facilidade', value: 4 }
  ];

  return prompts.map((question, index) => ({
    id: `observation-${index + 1}`,
    question,
    options: options.map((option) => ({ ...option }))
  }));
}

export function getDiagnosticSummary(score) {
  const startingIslandId = score <= 35 ? 1
    : score <= 45 ? 2
      : score <= 55 ? 3
        : score <= 65 ? 4
          : score <= 73 ? 5 : 6;
  const islandNames = [
    'Ilha do Alfabeto',
    'Ilha das Sílabas',
    'Ilha das Palavras',
    'Ilha das Frases',
    'Ilha dos Textos',
    'Ilha dos Livros'
  ];

  return {
    title: 'Sugestão para começar',
    message: `Pelas respostas, sugerimos começar pela ${islandNames[startingIslandId - 1]}. Você pode mudar de ilha quando quiser.`,
    tone: startingIslandId <= 2 ? 'alerta' : startingIslandId <= 4 ? 'media' : 'excelente',
    startingIslandId,
    disclaimer: 'Isto não é um diagnóstico nem substitui uma avaliação fonoaudiológica. Se houver preocupação com a fala, audição ou comunicação, converse com um fonoaudiólogo ou pediatra.'
  };
}

export function getInitialProgress() {
  return 0;
}

export function isIslandUnlocked(islandId, completedCount, startingIslandId = 1) {
  return islandId === 1 || islandId <= startingIslandId || completedCount >= islandId - 1;
}

export function getUnlockedIslands(islands, completedCount, startingIslandId = 1) {
  return islands.map((island) => ({
    ...island,
    unlocked: isIslandUnlocked(island.id, completedCount, startingIslandId),
  }));
}
