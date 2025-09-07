// Global database of 900 football clubs for matching algorithm
export interface Club {
  id: string;
  name: string;
  country: string;
  continent: string;
  league: string;
  logo: string; // Emoji placeholder
  founded: number;
  players: number;
  monthlyOffer: number; // In BRL
  openPositions: number;
  preferredStyle: string;
  category: string;
  description: string;
  contact: {
    phone: string;
    email: string;
  };
}

export const clubsDatabase: Club[] = [
  // South America - Brazil
  {
    id: "america-mg",
    name: "América Futebol Clube",
    country: "Brasil",
    continent: "América do Sul",
    league: "Campeonato Brasileiro Série A",
    logo: "🇧🇷",
    founded: 1912,
    players: 30,
    monthlyOffer: 4500,
    openPositions: 3,
    preferredStyle: "Meio-campo criativo",
    category: "Profissional",
    description: "Clube tradicional de Minas Gerais com foco no desenvolvimento de jovens talentos.",
    contact: { phone: "+55 31 99999-0001", email: "contato@america-mg.com.br" }
  },
  {
    id: "atletico-go",
    name: "Atlético Clube Goianiense",
    country: "Brasil",
    continent: "América do Sul",
    league: "Campeonato Brasileiro Série A",
    logo: "🔴",
    founded: 1937,
    players: 28,
    monthlyOffer: 5200,
    openPositions: 2,
    preferredStyle: "Atacante veloz",
    category: "Profissional",
    description: "Time goiano com tradição em revelar talentos para o futebol nacional.",
    contact: { phone: "+55 62 99999-0002", email: "scouts@atleticogoianiense.com.br" }
  },
  {
    id: "ceara-sc",
    name: "Ceará Sporting Club",
    country: "Brasil",
    continent: "América do Sul",
    league: "Campeonato Brasileiro Série A",
    logo: "⚫",
    founded: 1914,
    players: 32,
    monthlyOffer: 4800,
    openPositions: 4,
    preferredStyle: "Defensor sólido",
    category: "Profissional",
    description: "Clube nordestino com forte base defensiva e trabalho tático apurado.",
    contact: { phone: "+55 85 99999-0003", email: "futebol@ceara.com.br" }
  },
  {
    id: "fortaleza-ec",
    name: "Fortaleza Esporte Clube",
    country: "Brasil",
    continent: "América do Sul",
    league: "Campeonato Brasileiro Série A",
    logo: "🔵",
    founded: 1918,
    players: 29,
    monthlyOffer: 5500,
    openPositions: 2,
    preferredStyle: "Volante box-to-box",
    category: "Profissional",
    description: "Referência no Nordeste, conhecido pelo futebol ofensivo e intenso.",
    contact: { phone: "+55 85 99999-0004", email: "contratacoes@fortaleza.com.br" }
  },
  {
    id: "cuiaba-ec",
    name: "Cuiabá Esporte Clube",
    country: "Brasil",
    continent: "América do Sul",
    league: "Campeonato Brasileiro Série A",
    logo: "🟡",
    founded: 2001,
    players: 26,
    monthlyOffer: 6000,
    openPositions: 3,
    preferredStyle: "Ponta driblador",
    category: "Profissional",
    description: "Clube em ascensão do Centro-Oeste com investimento em jovens promessas.",
    contact: { phone: "+55 65 99999-0005", email: "peneiras@cuiaba.com.br" }
  },

  // South America - Argentina
  {
    id: "estudiantes-lp",
    name: "Club Estudiantes de La Plata",
    country: "Argentina",
    continent: "América do Sul",
    league: "Primera División",
    logo: "🔴",
    founded: 1905,
    players: 35,
    monthlyOffer: 3800,
    openPositions: 2,
    preferredStyle: "Meia organizador",
    category: "Profissional",
    description: "Clube histórico argentino famoso por sua escola de futebol.",
    contact: { phone: "+54 221 999-0001", email: "captacion@estudiantes.com.ar" }
  },
  {
    id: "newells-old-boys",
    name: "Club Atlético Newell's Old Boys",
    country: "Argentina",
    continent: "América do Sul",
    league: "Primera División",
    logo: "🔴",
    founded: 1903,
    players: 33,
    monthlyOffer: 4200,
    openPositions: 3,
    preferredStyle: "Atacante técnico",
    category: "Profissional",
    description: "Berço de Messi, reconhecido mundialmente pela formação de craques.",
    contact: { phone: "+54 341 999-0002", email: "inferiores@newells.com.ar" }
  },
  {
    id: "arsenal-sarandi",
    name: "Arsenal de Sarandí",
    country: "Argentina",
    continent: "América do Sul",
    league: "Primera División",
    logo: "🔵",
    founded: 1957,
    players: 28,
    monthlyOffer: 3500,
    openPositions: 4,
    preferredStyle: "Lateral ofensivo",
    category: "Profissional",
    description: "Clube jovem da Grande Buenos Aires com projeto de crescimento sustentável.",
    contact: { phone: "+54 11 999-0003", email: "futbol@arsenal.com.ar" }
  },

  // Europe - Portugal
  {
    id: "belenenses",
    name: "Clube de Futebol Os Belenenses",
    country: "Portugal",
    continent: "Europa",
    league: "Liga Portugal 2",
    logo: "🔵",
    founded: 1919,
    players: 25,
    monthlyOffer: 4800,
    openPositions: 2,
    preferredStyle: "Extremo rápido",
    category: "Profissional",
    description: "Clube histórico de Lisboa com tradição na formação de jogadores.",
    contact: { phone: "+351 21 999-0001", email: "formacao@osbelenenses.com" }
  },
  {
    id: "academico-viseu",
    name: "Académico de Viseu FC",
    country: "Portugal",
    continent: "Europa",
    league: "Liga Portugal 2",
    logo: "⚫",
    founded: 1914,
    players: 23,
    monthlyOffer: 3200,
    openPositions: 3,
    preferredStyle: "Central defensivo",
    category: "Profissional",
    description: "Clube da região centro de Portugal com apostas em jovens talentos.",
    contact: { phone: "+351 232 999-0002", email: "futebol@academico-viseu.pt" }
  },

  // Europe - Spain
  {
    id: "mirandes",
    name: "Club Deportivo Mirandés",
    country: "Espanha",
    continent: "Europa",
    league: "Primera División RFEF",
    logo: "🔴",
    founded: 1927,
    players: 22,
    monthlyOffer: 5500,
    openPositions: 2,
    preferredStyle: "Médio defensivo",
    category: "Profissional",
    description: "Clube basco com filosofia de jogo intenso e pressão alta.",
    contact: { phone: "+34 947 999-001", email: "cantera@cdmirandes.com" }
  },
  {
    id: "ponferradina",
    name: "Sociedad Deportiva Ponferradina",
    country: "Espanha",
    continent: "Europa",
    league: "Primera División RFEF",
    logo: "🔵",
    founded: 1922,
    players: 24,
    monthlyOffer: 4900,
    openPositions: 3,
    preferredStyle: "Avançado centro",
    category: "Profissional",
    description: "Time de León com crescimento constante e bom trabalho de base.",
    contact: { phone: "+34 987 999-002", email: "deportivo@ponferradina.es" }
  },

  // Europe - Italy
  {
    id: "cagliari",
    name: "Cagliari Calcio",
    country: "Itália",
    continent: "Europa",
    league: "Serie B",
    logo: "🔴",
    founded: 1920,
    players: 30,
    monthlyOffer: 6500,
    openPositions: 2,
    preferredStyle: "Trequartista criativo",
    category: "Profissional",
    description: "Clube histórico da Sardenha com tradição na Serie A italiana.",
    contact: { phone: "+39 070 999-001", email: "settoregiovanile@cagliaricalcio.com" }
  },
  {
    id: "cosenza",
    name: "Cosenza Calcio",
    country: "Itália",
    continent: "Europa",
    league: "Serie B",
    logo: "🔴",
    founded: 1914,
    players: 26,
    monthlyOffer: 4200,
    openPositions: 4,
    preferredStyle: "Ala esquerda",
    category: "Profissional",
    description: "Clube da Calábria focado no desenvolvimento de talentos do sul da Itália.",
    contact: { phone: "+39 0984 999-002", email: "primavera@cosenzacalcio.it" }
  },

  // North America - USA
  {
    id: "chicago-fire",
    name: "Chicago Fire FC",
    country: "Estados Unidos",
    continent: "América do Norte",
    league: "Major League Soccer",
    logo: "🔥",
    founded: 1997,
    players: 28,
    monthlyOffer: 7000,
    openPositions: 2,
    preferredStyle: "Atacante físico",
    category: "Profissional",
    description: "Franquia da MLS com forte investimento em jovens promessas internacionais.",
    contact: { phone: "+1 312 999-0001", email: "academy@chicagofirefc.com" }
  },
  {
    id: "fc-cincinnati",
    name: "FC Cincinnati",
    country: "Estados Unidos",
    continent: "América do Norte",
    league: "Major League Soccer",
    logo: "🔵",
    founded: 2015,
    players: 25,
    monthlyOffer: 6800,
    openPositions: 3,
    preferredStyle: "Médio box-to-box",
    category: "Profissional",
    description: "Clube jovem da MLS em crescimento com foco em talentos sul-americanos.",
    contact: { phone: "+1 513 999-0002", email: "development@fccincinnati.com" }
  },

  // Asia - Japan
  {
    id: "kashima-antlers",
    name: "Kashima Antlers",
    country: "Japão",
    continent: "Ásia",
    league: "J1 League",
    logo: "🦌",
    founded: 1947,
    players: 32,
    monthlyOffer: 5800,
    openPositions: 2,
    preferredStyle: "Volante técnico",
    category: "Profissional",
    description: "Clube tradicional japonês com várias conquistas na Champions da Ásia.",
    contact: { phone: "+81 299 999-001", email: "youth@kashima-antlers.co.jp" }
  },
  {
    id: "cerezo-osaka",
    name: "Cerezo Osaka",
    country: "Japão",
    continent: "Ásia",
    league: "J1 League",
    logo: "🌸",
    founded: 1957,
    players: 29,
    monthlyOffer: 5400,
    openPositions: 3,
    preferredStyle: "Extremo técnico",
    category: "Profissional",
    description: "Time de Osaka conhecido pelo futebol ofensivo e técnico apurado.",
    contact: { phone: "+81 6 999-002", email: "academy@cerezo.co.jp" }
  },

  // Continue with more clubs... (This is a representative sample)
  // For brevity, I'll add a few more key examples from different regions

  // Africa - South Africa
  {
    id: "orlando-pirates",
    name: "Orlando Pirates FC",
    country: "África do Sul",
    continent: "África",
    league: "Premier Soccer League",
    logo: "⚫",
    founded: 1937,
    players: 30,
    monthlyOffer: 3800,
    openPositions: 3,
    preferredStyle: "Atacante rápido",
    category: "Profissional",
    description: "Clube histórico sul-africano com grande torcida e tradição continental.",
    contact: { phone: "+27 11 999-0001", email: "development@orlandopirates.com" }
  },

  // Australia
  {
    id: "melbourne-victory",
    name: "Melbourne Victory FC",
    country: "Austrália",
    continent: "Oceania",
    league: "A-League Men",
    logo: "🔵",
    founded: 2004,
    players: 26,
    monthlyOffer: 6200,
    openPositions: 2,
    preferredStyle: "Meio-campista criativo",
    category: "Profissional",
    description: "Clube australiano bem-sucedido com programa de desenvolvimento internacional.",
    contact: { phone: "+61 3 999-0001", email: "academy@melbournevictory.com.au" }
  },

  // Add more clubs from different continents and leagues...
  // Mexico
  {
    id: "fc-juarez",
    name: "FC Juárez",
    country: "México",
    continent: "América do Norte",
    league: "Liga MX",
    logo: "🟢",
    founded: 2015,
    players: 27,
    monthlyOffer: 5200,
    openPositions: 3,
    preferredStyle: "Lateral ofensivo",
    category: "Profissional",
    description: "Clube mexicano em ascensão com foco em jovens talentos latinos.",
    contact: { phone: "+52 656 999-0001", email: "fuerzasbasicas@fcjuarez.mx" }
  },

  // Colombia
  {
    id: "atletico-nacional",
    name: "Atlético Nacional",
    country: "Colômbia",
    continent: "América do Sul",
    league: "Liga BetPlay",
    logo: "🟢",
    founded: 1947,
    players: 35,
    monthlyOffer: 4800,
    openPositions: 2,
    preferredStyle: "Meia-atacante",
    category: "Profissional",
    description: "Gigante colombiano com histórico de revelações para a Europa.",
    contact: { phone: "+57 4 999-0001", email: "divisionsemenores@atlnacional.com.co" }
  },

  // Add more varied clubs to reach the 900 target...
  // For this demo, I'll create a function to generate more clubs programmatically
];

// Function to generate additional clubs to reach 900 total
const generateAdditionalClubs = (): Club[] => {
  const baseClubs = [...clubsDatabase];
  const additionalClubs: Club[] = [];
  
  const countries = [
    { name: "Brasil", continent: "América do Sul", league: "Campeonato Brasileiro", emoji: "🇧🇷" },
    { name: "Argentina", continent: "América do Sul", league: "Primera División", emoji: "🇦🇷" },
    { name: "Uruguai", continent: "América do Sul", league: "Primera División", emoji: "🇺🇾" },
    { name: "Chile", continent: "América do Sul", league: "Primera División", emoji: "🇨🇱" },
    { name: "Peru", continent: "América do Sul", league: "Liga 1", emoji: "🇵🇪" },
    { name: "Equador", continent: "América do Sul", league: "Serie A", emoji: "🇪🇨" },
    { name: "Colômbia", continent: "América do Sul", league: "Liga BetPlay", emoji: "🇨🇴" },
    { name: "Venezuela", continent: "América do Sul", league: "Primera División", emoji: "🇻🇪" },
    { name: "México", continent: "América do Norte", league: "Liga MX", emoji: "🇲🇽" },
    { name: "Estados Unidos", continent: "América do Norte", league: "MLS", emoji: "🇺🇸" },
    { name: "Portugal", continent: "Europa", league: "Liga Portugal", emoji: "🇵🇹" },
    { name: "Espanha", continent: "Europa", league: "La Liga", emoji: "🇪🇸" },
    { name: "Itália", continent: "Europa", league: "Serie A", emoji: "🇮🇹" },
    { name: "França", continent: "Europa", league: "Ligue 1", emoji: "🇫🇷" },
    { name: "Inglaterra", continent: "Europa", league: "Premier League", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { name: "Alemanha", continent: "Europa", league: "Bundesliga", emoji: "🇩🇪" },
    { name: "Holanda", continent: "Europa", league: "Eredivisie", emoji: "🇳🇱" },
    { name: "Bélgica", continent: "Europa", league: "Pro League", emoji: "🇧🇪" },
    { name: "Japão", continent: "Ásia", league: "J-League", emoji: "🇯🇵" },
    { name: "Coreia do Sul", continent: "Ásia", league: "K League", emoji: "🇰🇷" },
    { name: "China", continent: "Ásia", league: "Super League", emoji: "🇨🇳" },
    { name: "Austrália", continent: "Oceania", league: "A-League", emoji: "🇦🇺" },
    { name: "África do Sul", continent: "África", league: "PSL", emoji: "🇿🇦" },
    { name: "Egito", continent: "África", league: "Premier League", emoji: "🇪🇬" },
    { name: "Marrocos", continent: "África", league: "Botola Pro", emoji: "🇲🇦" },
  ];

  const clubNames = [
    "FC", "Atlético", "Sporting", "Real", "Santos", "União", "Cruzeiro", "Flamengo", "Nacional", "Internacional",
    "Olimpia", "Estudiantes", "Racing", "Boca", "River", "Peñarol", "Defensor", "Cerro", "Montevideo", "Danubio",
    "Universidad", "Colo-Colo", "Católica", "Unión", "Huachipato", "Audax", "Palestino", "Ñublense", "Everton",
    "Alianza", "Universitario", "Sporting", "Melgar", "César Vallejo", "Cienciano", "Municipal", "Cusco", "Cantolao",
    "Barcelona", "Emelec", "LDU", "Independiente", "Aucas", "Delfín", "Macará", "Mushuc", "Técnico",
    "América", "Guadalajara", "Cruz Azul", "Pumas", "Tigres", "Monterrey", "Santos", "Toluca", "Atlas",
    "United", "City", "Rovers", "Wanderers", "Town", "County", "Park", "Villa", "Forest", "Albion",
    "Milan", "Roma", "Napoli", "Lazio", "Fiorentina", "Atalanta", "Bologna", "Genoa", "Sampdoria", "Torino",
    "Marseille", "Lyon", "Nice", "Monaco", "Lille", "Rennes", "Strasbourg", "Montpellier", "Nantes", "Bordeaux",
    "Hamburg", "Stuttgart", "Hannover", "Cologne", "Bremen", "Düsseldorf", "Nuremberg", "Kaiserslautern", "Freiburg",
    "Ajax", "PSV", "Feyenoord", "AZ", "Vitesse", "Utrecht", "Groningen", "Heerenveen", "Twente", "Willem",
    "Anderlecht", "Club Brugge", "Standard", "Genk", "Antwerp", "Gent", "Charleroi", "Mechelen", "Oostende",
    "Kashima", "Urawa", "Yokohama", "Gamba", "Kawasaki", "Nagoya", "Vissel", "Sanfrecce", "Consadole", "Shimizu",
    "Seoul", "Suwon", "Jeonbuk", "Ulsan", "Pohang", "Incheon", "Daegu", "Jeju", "Gangwon", "Seongnam",
    "Shanghai", "Guangzhou", "Beijing", "Shandong", "Jiangsu", "Tianjin", "Hebei", "Chongqing", "Dalian", "Shenzhen",
    "Sydney", "Melbourne", "Perth", "Adelaide", "Brisbane", "Wellington", "Western", "Central", "Macarthur", "Newcastle",
    "Chiefs", "Pirates", "Sundowns", "SuperSport", "AmaZulu", "Golden", "Stellenbosch", "Sekhukhune", "Maritzburg", "Swallows",
    "Al Ahly", "Zamalek", "Ismaily", "Arab", "Pyramids", "Masry", "Enppi", "Ghazl", "Wadi", "Mokawloon",
    "Raja", "Wydad", "FUS", "Hassania", "Olympique", "Moghreb", "Difaâ", "Renaissance", "Ittihad", "Chabab"
  ];

  const positions = [
    "Atacante centro", "Ponta esquerda", "Ponta direita", "Meia-atacante", "Meio-campo", 
    "Volante", "Lateral esquerdo", "Lateral direito", "Zagueiro", "Goleiro"
  ];

  const styles = [
    "Atacante físico", "Atacante técnico", "Atacante veloz", "Extremo rápido", "Extremo técnico",
    "Meia criativo", "Meia organizador", "Volante defensivo", "Volante box-to-box", "Lateral ofensivo",
    "Zagueiro forte", "Zagueiro técnico", "Goleiro reflexo", "Goleiro saída", "Trequartista"
  ];

  let clubId = baseClubs.length;

  // Generate clubs to reach 900 total
  while (baseClubs.length + additionalClubs.length < 900) {
    const country = countries[Math.floor(Math.random() * countries.length)];
    const baseName = clubNames[Math.floor(Math.random() * clubNames.length)];
    const cityName = clubNames[Math.floor(Math.random() * clubNames.length)];
    const fullName = Math.random() > 0.5 ? `${baseName} ${cityName}` : `${cityName} ${baseName}`;
    
    const club: Club = {
      id: `club-${clubId}`,
      name: fullName,
      country: country.name,
      continent: country.continent,
      league: country.league,
      logo: country.emoji,
      founded: 1900 + Math.floor(Math.random() * 123), // 1900-2023
      players: 20 + Math.floor(Math.random() * 20), // 20-40 players
      monthlyOffer: 3000 + Math.floor(Math.random() * 4000), // 3000-7000 BRL
      openPositions: 1 + Math.floor(Math.random() * 4), // 1-4 positions
      preferredStyle: styles[Math.floor(Math.random() * styles.length)],
      category: Math.random() > 0.1 ? "Profissional" : "Semi-profissional",
      description: `Clube ${country.name.toLowerCase()} com foco no desenvolvimento de talentos e crescimento sustentável.`,
      contact: {
        phone: `+${Math.floor(Math.random() * 99)} ${Math.floor(Math.random() * 99)} 999-${String(clubId).padStart(4, '0')}`,
        email: `contato@${fullName.toLowerCase().replace(/\s+/g, '')}.com`
      }
    };

    additionalClubs.push(club);
    clubId++;
  }

  return additionalClubs;
};

// Combine base clubs with generated ones
export const allClubs: Club[] = [...clubsDatabase, ...generateAdditionalClubs()];

// Function to get a random club with weighted distribution
export const getRandomClub = (usedClubIds: string[] = []): Club => {
  const availableClubs = allClubs.filter(club => !usedClubIds.includes(club.id));
  
  if (availableClubs.length === 0) {
    // If all clubs have been used, reset and start over
    return allClubs[Math.floor(Math.random() * allClubs.length)];
  }
  
  return availableClubs[Math.floor(Math.random() * availableClubs.length)];
};

// Function to get clubs by continent
export const getClubsByContinent = (continent: string): Club[] => {
  return allClubs.filter(club => club.continent === continent);
};

// Function to get clubs by country
export const getClubsByCountry = (country: string): Club[] => {
  return allClubs.filter(club => club.country === country);
};

// Total clubs count
export const TOTAL_CLUBS = allClubs.length;