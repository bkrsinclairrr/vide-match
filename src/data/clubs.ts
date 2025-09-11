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
  {
    id: "goianesia-go",
    name: "Goianésia-GO",
    country: "Brasil",
    continent: "América do Sul",
    league: "Campeonato Goiano",
    logo: "🇧🇷",
    founded: 1955,
    players: 28,
    monthlyOffer: 3500,
    openPositions: 2,
    preferredStyle: "Atacante veloz",
    category: "Profissional",
    description: "Clube tradicional de Goiás com foco no desenvolvimento de jovens talentos.",
    contact: { phone: "+55 62 99999-0001", email: "contato@goianesia.com.br" }
  },
  {
    id: "gremio-rs",
    name: "Grêmio-RS",
    country: "Brasil",
    continent: "América do Sul",
    league: "Campeonato Brasileiro Série A",
    logo: "🔵",
    founded: 1903,
    players: 35,
    monthlyOffer: 6500,
    openPositions: 3,
    preferredStyle: "Meio-campista técnico",
    category: "Profissional",
    description: "Clube histórico do Rio Grande do Sul com tradição em formação de craques.",
    contact: { phone: "+55 51 99999-0002", email: "contato@gremio.net" }
  },
  {
    id: "atletico-go",
    name: "Atlético-GO",
    country: "Brasil",
    continent: "América do Sul",
    league: "Campeonato Brasileiro Série A",
    logo: "🔴",
    founded: 1937,
    players: 30,
    monthlyOffer: 5200,
    openPositions: 2,
    preferredStyle: "Atacante físico",
    category: "Profissional",
    description: "Time goiano com tradição em revelar talentos para o futebol nacional.",
    contact: { phone: "+55 62 99999-0003", email: "scouts@atleticogoianiense.com.br" }
  },
  {
    id: "brasilis-sp",
    name: "Brasilis-SP",
    country: "Brasil",
    continent: "América do Sul",
    league: "Campeonato Paulista",
    logo: "🟢",
    founded: 1945,
    players: 26,
    monthlyOffer: 4200,
    openPositions: 4,
    preferredStyle: "Ponta driblador",
    category: "Profissional",
    description: "Clube paulista em crescimento com investimento em jovens promessas.",
    contact: { phone: "+55 11 99999-0004", email: "futebol@brasilis.com.br" }
  },
  {
    id: "barcelona-capela-sp",
    name: "Barcelona Capela-SP",
    country: "Brasil",
    continent: "América do Sul",
    league: "Campeonato Paulista",
    logo: "🔴",
    founded: 1950,
    players: 24,
    monthlyOffer: 3800,
    openPositions: 3,
    preferredStyle: "Defensor sólido",
    category: "Profissional",
    description: "Time tradicional de São Paulo com forte base defensiva.",
    contact: { phone: "+55 11 99999-0005", email: "contato@barcelonacapela.com.br" }
  },
  {
    id: "brazlandia-df",
    name: "Brazlândia-DF",
    country: "Brasil",
    continent: "América do Sul",
    league: "Campeonato Brasiliense",
    logo: "🟡",
    founded: 1965,
    players: 22,
    monthlyOffer: 3200,
    openPositions: 2,
    preferredStyle: "Volante box-to-box",
    category: "Profissional",
    description: "Clube do Distrito Federal com foco na formação de atletas locais.",
    contact: { phone: "+55 61 99999-0006", email: "futsal@brazlandia.com.br" }
  },
  {
    id: "gama-df",
    name: "Gama-DF",
    country: "Brasil",
    continent: "América do Sul",
    league: "Campeonato Brasiliense",
    logo: "🟢",
    founded: 1975,
    players: 28,
    monthlyOffer: 4000,
    openPositions: 3,
    preferredStyle: "Lateral ofensivo",
    category: "Profissional",
    description: "Time histórico do DF conhecido pela revelação de grandes jogadores.",
    contact: { phone: "+55 61 99999-0007", email: "contratacoes@gama.com.br" }
  },
  {
    id: "legiao-df",
    name: "Legião-DF",
    country: "Brasil",
    continent: "América do Sul",
    league: "Campeonato Brasiliense",
    logo: "⚫",
    founded: 1980,
    players: 25,
    monthlyOffer: 3600,
    openPositions: 2,
    preferredStyle: "Meio-campo criativo",
    category: "Profissional",
    description: "Clube jovem do DF com projeto ambicioso de crescimento.",
    contact: { phone: "+55 61 99999-0008", email: "peneiras@legiao.com.br" }
  },
  {
    id: "desportivo-real-go",
    name: "Desportivo Real-GO",
    country: "Brasil",
    continent: "América do Sul",
    league: "Campeonato Goiano",
    logo: "🔵",
    founded: 1958,
    players: 27,
    monthlyOffer: 3400,
    openPositions: 4,
    preferredStyle: "Atacante de área",
    category: "Profissional",
    description: "Time goiano tradicional com boa estrutura para desenvolvimento.",
    contact: { phone: "+55 62 99999-0009", email: "real@desportivoreal.com.br" }
  },
  {
    id: "m10-al",
    name: "M10-AL",
    country: "Brasil",
    continent: "América do Sul",
    league: "Campeonato Alagoano",
    logo: "🔟",
    founded: 2010,
    players: 23,
    monthlyOffer: 3000,
    openPositions: 3,
    preferredStyle: "Extremo técnico",
    category: "Profissional",
    description: "Clube moderno de Alagoas focado em inovação e tecnologia no futebol.",
    contact: { phone: "+55 82 99999-0010", email: "scouts@m10al.com.br" }
  },
  {
    id: "alianca-al",
    name: "Aliança-AL",
    country: "Brasil",
    continent: "América do Sul",
    league: "Campeonato Alagoano",
    logo: "🔴",
    founded: 1946,
    players: 26,
    monthlyOffer: 3300,
    openPositions: 2,
    preferredStyle: "Zagueiro central",
    category: "Profissional",
    description: "Clube histórico alagoano com tradição na formação de defensores.",
    contact: { phone: "+55 82 99999-0011", email: "futebol@aliancaal.com.br" }
  },
  {
    id: "independente-limeira-sp",
    name: "Independente Limeira-SP",
    country: "Brasil",
    continent: "América do Sul",
    league: "Campeonato Paulista",
    logo: "🟣",
    founded: 1962,
    players: 29,
    monthlyOffer: 4500,
    openPositions: 3,
    preferredStyle: "Meia-atacante",
    category: "Profissional",
    description: "Clube do interior paulista com crescimento consistente nos últimos anos.",
    contact: { phone: "+55 19 99999-0012", email: "contato@independentelimeira.com.br" }
  }
];

// Function to get clubs (simplified since we only have 12 clubs now)
const getAllClubs = (): Club[] => {
  return [...clubsDatabase];
};

// Export all clubs (now just the 12 Brazilian clubs)
export const allClubs: Club[] = getAllClubs();

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