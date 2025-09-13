export interface Club {
  id: string;
  name: string;
  country: string;
  continent: string;
  league: string;
  logo: string;
  founded: number;
  players: number;
  monthlyOffer: number;
  openPositions: number;
  preferredStyle: string;
  category: string;
  description: string;
  contact: {
    email: string;
    phone: string;
    social: string;
  };
}

// Times reais da Série A e B do Brasileirão
const clubsDatabase: Club[] = [
  // Série A
  {
    id: "1",
    name: "Flamengo",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série A",
    logo: "🔴⚫",
    founded: 1981,
    players: 35,
    monthlyOffer: 8500,
    openPositions: 3,
    preferredStyle: "Atacante dinâmico",
    category: "Série A",
    description: "Maior torcida do Brasil, busca jogadores com mentalidade vencedora e técnica apurada.",
    contact: {
      email: "scout@flamengo.com.br",
      phone: "+55 21 3434-0100",
      social: "@flamengo"
    }
  },
  {
    id: "2",
    name: "Palmeiras",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série A",
    logo: "🟢⚪",
    founded: 1914,
    players: 38,
    monthlyOffer: 9200,
    openPositions: 2,
    preferredStyle: "Meio-campo criativo",
    category: "Série A",
    description: "Academia de Futebol, foca no desenvolvimento de jovens talentos com visão de jogo.",
    contact: {
      email: "observacao@palmeiras.com.br",
      phone: "+55 11 3873-4444",
      social: "@palmeiras"
    }
  },
  {
    id: "3",
    name: "Corinthians",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série A",
    logo: "⚫⚪",
    founded: 1910,
    players: 33,
    monthlyOffer: 7800,
    openPositions: 4,
    preferredStyle: "Zagueiro central",
    category: "Série A",
    description: "Sport Club Corinthians Paulista, busca defensores sólidos e com liderança.",
    contact: {
      email: "futebol@corinthians.com.br",
      phone: "+55 11 2095-3500",
      social: "@corinthians"
    }
  },
  {
    id: "4",
    name: "São Paulo",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série A",
    logo: "🔴⚫⚪",
    founded: 1930,
    players: 36,
    monthlyOffer: 8200,
    openPositions: 3,
    preferredStyle: "Lateral ofensivo",
    category: "Série A",
    description: "Tricolor paulista com tradição em revelar talentos, busca laterais versáteis.",
    contact: {
      email: "scout@saopaulofc.net",
      phone: "+55 11 3749-8000",
      social: "@saopaulofc"
    }
  },
  {
    id: "5",
    name: "Santos",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série A",
    logo: "⚫⚪",
    founded: 1912,
    players: 32,
    monthlyOffer: 7200,
    openPositions: 5,
    preferredStyle: "Ponta veloz",
    category: "Série A",
    description: "Vila Belmiro é berço de craques, procura pontas rápidos e habilidosos.",
    contact: {
      email: "observacao@santosfc.com.br",
      phone: "+55 13 3257-4100",
      social: "@santosfc"
    }
  },
  {
    id: "6",
    name: "Grêmio",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série A",
    logo: "🔵🟡⚫",
    founded: 1903,
    players: 34,
    monthlyOffer: 7900,
    openPositions: 2,
    preferredStyle: "Volante técnico",
    category: "Série A",
    description: "Tricolor gaúcho valoriza jogadores com boa técnica e visão tática.",
    contact: {
      email: "futebol@gremio.net",
      phone: "+55 51 3337-4100",
      social: "@gremio"
    }
  },
  {
    id: "7",
    name: "Internacional",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série A",
    logo: "🔴⚪",
    founded: 1909,
    players: 35,
    monthlyOffer: 8100,
    openPositions: 3,
    preferredStyle: "Centroavante clássico",
    category: "Série A",
    description: "Colorado busca atacantes finalizadores e com presença de área.",
    contact: {
      email: "observacao@internacional.com.br",
      phone: "+55 51 3230-4600",
      social: "@internacional"
    }
  },
  {
    id: "8",
    name: "Atlético Mineiro",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série A",
    logo: "⚫⚪",
    founded: 1908,
    players: 37,
    monthlyOffer: 8700,
    openPositions: 2,
    preferredStyle: "Meia-atacante",
    category: "Série A",
    description: "Galo investe em jogadores criativos que façam a diferença no terço final.",
    contact: {
      email: "futebol@atletico.com.br",
      phone: "+55 31 3299-4500",
      social: "@atletico"
    }
  },
  {
    id: "9",
    name: "Cruzeiro",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série A",
    logo: "🔵⚪",
    founded: 1921,
    players: 33,
    monthlyOffer: 7500,
    openPositions: 4,
    preferredStyle: "Goleiro seguro",
    category: "Série A",
    description: "Raposa procura goleiros confiáveis e com bom jogo aéreo.",
    contact: {
      email: "observacao@cruzeiro.com.br",
      phone: "+55 31 3319-4100",
      social: "@cruzeiro"
    }
  },
  {
    id: "10",
    name: "Fluminense",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série A",
    logo: "🟢🔴⚪",
    founded: 1902,
    players: 34,
    monthlyOffer: 7800,
    openPositions: 3,
    preferredStyle: "Armador clássico",
    category: "Série A",
    description: "Tricolor das Laranjeiras valoriza o futebol bonito e jogadores inteligentes.",
    contact: {
      email: "futebol@fluminense.com.br",
      phone: "+55 21 2563-4100",
      social: "@fluminensefc"
    }
  },

  // Série B
  {
    id: "11",
    name: "Sport Recife",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série B",
    logo: "🔴⚫",
    founded: 1905,
    players: 28,
    monthlyOffer: 5200,
    openPositions: 4,
    preferredStyle: "Lateral esquerdo",
    category: "Série B",
    description: "Leão da Ilha busca retornar à elite e precisa de laterais ofensivos.",
    contact: {
      email: "observacao@sport.com.br",
      phone: "+55 81 3426-4100",
      social: "@sportrecife"
    }
  },
  {
    id: "12",
    name: "Ceará",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série B",
    logo: "⚫⚪",
    founded: 1914,
    players: 30,
    monthlyOffer: 4800,
    openPositions: 5,
    preferredStyle: "Atacante de área",
    category: "Série B",
    description: "Vozão quer voltar à Série A e busca atacantes oportunistas.",
    contact: {
      email: "futebol@ceara.com.br",
      phone: "+55 85 3299-1900",
      social: "@cearasc"
    }
  },
  {
    id: "13",
    name: "Bahia",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série B",
    logo: "🔵🔴⚪",
    founded: 1931,
    players: 29,
    monthlyOffer: 5500,
    openPositions: 3,
    preferredStyle: "Volante defensivo",
    category: "Série B",
    description: "Tricolor baiano precisa de volantes que marquem e distribuam bem.",
    contact: {
      email: "observacao@esporteclubebahia.com.br",
      phone: "+55 71 3203-1900",
      social: "@ecbahia"
    }
  },
  {
    id: "14",
    name: "Coritiba",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série B",
    logo: "🟢⚪",
    founded: 1909,
    players: 31,
    monthlyOffer: 5100,
    openPositions: 4,
    preferredStyle: "Zagueiro experiente",
    category: "Série B",
    description: "Coxa busca zagueiros com experiência para organizar a defesa.",
    contact: {
      email: "futebol@coritiba.com.br",
      phone: "+55 41 3320-1909",
      social: "@coritiba"
    }
  },
  {
    id: "15",
    name: "Guarani",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série B",
    logo: "🟢⚪",
    founded: 1911,
    players: 26,
    monthlyOffer: 4200,
    openPositions: 6,
    preferredStyle: "Meia central",
    category: "Série B",
    description: "Bugre procura meias que tenham boa visão de jogo e passes precisos.",
    contact: {
      email: "observacao@guaranifc.com.br",
      phone: "+55 19 3231-9800",
      social: "@guaranifc"
    }
  },
  {
    id: "16",
    name: "Vila Nova",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série B",
    logo: "🔴⚪",
    founded: 1943,
    players: 27,
    monthlyOffer: 4500,
    openPositions: 5,
    preferredStyle: "Ponta direita",
    category: "Série B",
    description: "Tigrão quer pontas rápidos para criar jogadas pelo lado direito.",
    contact: {
      email: "futebol@vilanova.com.br",
      phone: "+55 62 3291-4500",
      social: "@vilanovafc"
    }
  },
  {
    id: "17",
    name: "Ponte Preta",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série B",
    logo: "⚫⚪",
    founded: 1900,
    players: 29,
    monthlyOffer: 4800,
    openPositions: 4,
    preferredStyle: "Lateral direito",
    category: "Série B",
    description: "Macaca busca laterais que subam ao ataque e tenham cruzamento.",
    contact: {
      email: "observacao@pontepreta.com.br",
      phone: "+55 19 3231-1900",
      social: "@aappontepreta"
    }
  },
  {
    id: "18",
    name: "Avaí",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série B",
    logo: "🔵⚪",
    founded: 1923,
    players: 28,
    monthlyOffer: 4600,
    openPositions: 3,
    preferredStyle: "Meio-campo box-to-box",
    category: "Série B",
    description: "Leão da Ilha precisa de meias que marquem e apoiem o ataque.",
    contact: {
      email: "futebol@avai.com.br",
      phone: "+55 48 3234-1923",
      social: "@avaifc"
    }
  },
  {
    id: "19",
    name: "CRB",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série B",
    logo: "🔴⚪",
    founded: 1912,
    players: 25,
    monthlyOffer: 4100,
    openPositions: 5,
    preferredStyle: "Centroavante",
    category: "Série B",
    description: "Galo de Campina busca atacantes que saibam finalizar e jogar de costas.",
    contact: {
      email: "observacao@crb.com.br",
      phone: "+55 82 3336-1912",
      social: "@crboficial"
    }
  },
  {
    id: "20",
    name: "Operário-PR",
    country: "Brasil",
    continent: "América do Sul",
    league: "Brasileirão Série B",
    logo: "⚫🟡",
    founded: 1912,
    players: 26,
    monthlyOffer: 4300,
    openPositions: 4,
    preferredStyle: "Goleiro jovem",
    category: "Série B",
    description: "Fantasma quer investir em goleiros jovens com potencial de crescimento.",
    contact: {
      email: "futebol@operario.com.br",
      phone: "+55 43 3337-1912",
      social: "@operariopr"
    }
  }
];

export const allClubs = [...clubsDatabase];

export const getAllClubs = (): Club[] => {
  return [...clubsDatabase];
};

export const getRandomClub = (usedClubIds: string[] = []): Club => {
  const availableClubs = allClubs.filter(club => !usedClubIds.includes(club.id));
  const clubsToUse = availableClubs.length > 0 ? availableClubs : allClubs;
  return clubsToUse[Math.floor(Math.random() * clubsToUse.length)];
};

export const getClubsByContinent = (continent: string): Club[] => {
  return allClubs.filter(club => club.continent.toLowerCase() === continent.toLowerCase());
};

export const getClubsByCountry = (country: string): Club[] => {
  return allClubs.filter(club => club.country.toLowerCase() === country.toLowerCase());
};

export const TOTAL_CLUBS = allClubs.length;