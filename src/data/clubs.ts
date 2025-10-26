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

// Clubes europeus de médio porte
const clubsDatabase: Club[] = [
  // Espanha - La Liga
  {
    id: "1",
    name: "Real Sociedad",
    country: "Espanha",
    continent: "Europa",
    league: "La Liga",
    logo: "🔵⚪",
    founded: 1909,
    players: 28,
    monthlyOffer: 6500,
    openPositions: 3,
    preferredStyle: "Meia-atacante criativo",
    category: "La Liga",
    description: "Clube basco com tradição em revelar talentos jovens e futebol ofensivo.",
    contact: {
      email: "scouting@realsociedad.eus",
      phone: "+34 943 462 833",
      social: "@RealSociedad"
    }
  },
  {
    id: "2",
    name: "Real Betis",
    country: "Espanha",
    continent: "Europa",
    league: "La Liga",
    logo: "🟢⚪",
    founded: 1907,
    players: 30,
    monthlyOffer: 6200,
    openPositions: 4,
    preferredStyle: "Lateral ofensivo",
    category: "La Liga",
    description: "Clube sevilhano que valoriza futebol técnico e laterais que apoiam o ataque.",
    contact: {
      email: "cantera@realbetis.es",
      phone: "+34 954 610 340",
      social: "@RealBetis"
    }
  },
  {
    id: "3",
    name: "Athletic Bilbao",
    country: "Espanha",
    continent: "Europa",
    league: "La Liga",
    logo: "🔴⚪",
    founded: 1898,
    players: 27,
    monthlyOffer: 6800,
    openPositions: 2,
    preferredStyle: "Ponta veloz",
    category: "La Liga",
    description: "Tradicional clube basco que valoriza jogadores intensos e comprometidos.",
    contact: {
      email: "lezama@athletic-club.eus",
      phone: "+34 944 240 877",
      social: "@AthleticClub"
    }
  },
  {
    id: "4",
    name: "Celta de Vigo",
    country: "Espanha",
    continent: "Europa",
    league: "La Liga",
    logo: "🔵⚪",
    founded: 1923,
    players: 26,
    monthlyOffer: 5400,
    openPositions: 5,
    preferredStyle: "Volante técnico",
    category: "La Liga",
    description: "Clube galego que busca jogadores técnicos e com boa visão de jogo.",
    contact: {
      email: "ojeadores@celtavigo.net",
      phone: "+34 986 291 801",
      social: "@RCCelta"
    }
  },

  // Inglaterra - Premier League / Championship
  {
    id: "5",
    name: "Brighton & Hove Albion",
    country: "Inglaterra",
    continent: "Europa",
    league: "Premier League",
    logo: "🔵⚪",
    founded: 1901,
    players: 29,
    monthlyOffer: 7200,
    openPositions: 3,
    preferredStyle: "Meio-campo box-to-box",
    category: "Premier League",
    description: "Clube inovador que valoriza análise de dados e jogadores versáteis.",
    contact: {
      email: "recruitment@brightonandhovealbion.com",
      phone: "+44 1273 695400",
      social: "@OfficialBHAFC"
    }
  },
  {
    id: "6",
    name: "Brentford FC",
    country: "Inglaterra",
    continent: "Europa",
    league: "Premier League",
    logo: "🔴⚪",
    founded: 1889,
    players: 25,
    monthlyOffer: 6900,
    openPositions: 4,
    preferredStyle: "Atacante finalizador",
    category: "Premier League",
    description: "The Bees utilizam estatística avançada para encontrar talentos subestimados.",
    contact: {
      email: "scouting@brentfordfc.com",
      phone: "+44 20 8847 2511",
      social: "@BrentfordFC"
    }
  },
  {
    id: "7",
    name: "Fulham FC",
    country: "Inglaterra",
    continent: "Europa",
    league: "Premier League",
    logo: "⚫⚪",
    founded: 1879,
    players: 28,
    monthlyOffer: 6700,
    openPositions: 3,
    preferredStyle: "Zagueiro seguro",
    category: "Premier League",
    description: "Clube londrino tradicional que busca defensores sólidos e confiáveis.",
    contact: {
      email: "academy@fulhamfc.com",
      phone: "+44 20 7893 8383",
      social: "@FulhamFC"
    }
  },
  {
    id: "8",
    name: "Wolverhampton Wanderers",
    country: "Inglaterra",
    continent: "Europa",
    league: "Premier League",
    logo: "🟡⚫",
    founded: 1877,
    players: 30,
    monthlyOffer: 7000,
    openPositions: 2,
    preferredStyle: "Centroavante físico",
    category: "Premier League",
    description: "Wolves procuram atacantes fortes e que saibam jogar de costas.",
    contact: {
      email: "recruitment@wolves.co.uk",
      phone: "+44 871 222 2220",
      social: "@Wolves"
    }
  },

  // Escócia - Scottish Premiership
  {
    id: "9",
    name: "Aberdeen FC",
    country: "Escócia",
    continent: "Europa",
    league: "Scottish Premiership",
    logo: "🔴⚪",
    founded: 1903,
    players: 24,
    monthlyOffer: 4200,
    openPositions: 5,
    preferredStyle: "Volante defensivo",
    category: "Scottish Premiership",
    description: "Clube tradicional escocês que valoriza jogadores trabalhadores e táticos.",
    contact: {
      email: "youth@afc.co.uk",
      phone: "+44 1224 650400",
      social: "@AberdeenFC"
    }
  },
  {
    id: "10",
    name: "Heart of Midlothian",
    country: "Escócia",
    continent: "Europa",
    league: "Scottish Premiership",
    logo: "🔴⚪",
    founded: 1874,
    players: 25,
    monthlyOffer: 4000,
    openPositions: 4,
    preferredStyle: "Lateral esquerdo",
    category: "Scottish Premiership",
    description: "Hearts busca laterais modernos que apoiem o ataque com qualidade.",
    contact: {
      email: "recruitment@heartofmidlothianfc.co.uk",
      phone: "+44 333 043 1874",
      social: "@JamTarts"
    }
  },
  {
    id: "11",
    name: "Hibernian FC",
    country: "Escócia",
    continent: "Europa",
    league: "Scottish Premiership",
    logo: "🟢⚪",
    founded: 1875,
    players: 23,
    monthlyOffer: 3800,
    openPositions: 5,
    preferredStyle: "Meia central",
    category: "Scottish Premiership",
    description: "Hibs procuram meias inteligentes com boa distribuição de bola.",
    contact: {
      email: "academy@hibernianfc.co.uk",
      phone: "+44 131 661 2159",
      social: "@HibernianFC"
    }
  },

  // França - Ligue 1
  {
    id: "12",
    name: "RC Lens",
    country: "França",
    continent: "Europa",
    league: "Ligue 1",
    logo: "🔴🟡",
    founded: 1906,
    players: 27,
    monthlyOffer: 5800,
    openPositions: 3,
    preferredStyle: "Ponta rápido",
    category: "Ligue 1",
    description: "Clube com forte conexão com torcida, busca pontas explosivos.",
    contact: {
      email: "recrutement@rclens.fr",
      phone: "+33 3 21 79 29 80",
      social: "@RCLens"
    }
  },
  {
    id: "13",
    name: "Stade Rennais",
    country: "França",
    continent: "Europa",
    league: "Ligue 1",
    logo: "🔴⚫",
    founded: 1901,
    players: 29,
    monthlyOffer: 6100,
    openPositions: 3,
    preferredStyle: "Meia-atacante",
    category: "Ligue 1",
    description: "Rennes investe em jovens talentos criativos para o ataque.",
    contact: {
      email: "formation@staderennais.com",
      phone: "+33 2 99 33 65 65",
      social: "@staderennais"
    }
  },
  {
    id: "14",
    name: "OGC Nice",
    country: "França",
    continent: "Europa",
    league: "Ligue 1",
    logo: "🔴⚫",
    founded: 1904,
    players: 28,
    monthlyOffer: 5900,
    openPositions: 4,
    preferredStyle: "Zagueiro central",
    category: "Ligue 1",
    description: "Clube da Riviera Francesa procura zagueiros modernos e técnicos.",
    contact: {
      email: "recrutement@ogcnice.com",
      phone: "+33 4 92 00 42 40",
      social: "@ogcnice"
    }
  },
  {
    id: "15",
    name: "RC Strasbourg",
    country: "França",
    continent: "Europa",
    league: "Ligue 1",
    logo: "🔵⚪",
    founded: 1906,
    players: 26,
    monthlyOffer: 5200,
    openPositions: 4,
    preferredStyle: "Lateral direito",
    category: "Ligue 1",
    description: "Racing valoriza laterais completos e com boa técnica individual.",
    contact: {
      email: "formation@rcstrasbourg.fr",
      phone: "+33 3 88 60 96 96",
      social: "@RCSA"
    }
  },

  // Itália - Serie A
  {
    id: "16",
    name: "ACF Fiorentina",
    country: "Itália",
    continent: "Europa",
    league: "Serie A",
    logo: "🟣⚪",
    founded: 1926,
    players: 29,
    monthlyOffer: 6400,
    openPositions: 3,
    preferredStyle: "Armador clássico",
    category: "Serie A",
    description: "La Viola busca meias criativos com visão de jogo ao estilo italiano.",
    contact: {
      email: "settoregiovanile@acffiorentina.it",
      phone: "+39 055 5032 301",
      social: "@acffiorentina"
    }
  },
  {
    id: "17",
    name: "Torino FC",
    country: "Itália",
    continent: "Europa",
    league: "Serie A",
    logo: "🔴⚫",
    founded: 1906,
    players: 27,
    monthlyOffer: 5700,
    openPositions: 4,
    preferredStyle: "Centroavante clássico",
    category: "Serie A",
    description: "Il Toro procura atacantes de área com presença física.",
    contact: {
      email: "primavera@torinofc.it",
      phone: "+39 011 562 8711",
      social: "@TorinoFC_1906"
    }
  },
  {
    id: "18",
    name: "Bologna FC",
    country: "Itália",
    continent: "Europa",
    league: "Serie A",
    logo: "🔴🔵",
    founded: 1909,
    players: 28,
    monthlyOffer: 5900,
    openPositions: 3,
    preferredStyle: "Volante técnico",
    category: "Serie A",
    description: "Clube histórico italiano que valoriza volantes com qualidade técnica.",
    contact: {
      email: "settoregiovanile@bolognafc.it",
      phone: "+39 051 614 2411",
      social: "@BfcOfficialPage"
    }
  },
  {
    id: "19",
    name: "Udinese Calcio",
    country: "Itália",
    continent: "Europa",
    league: "Serie A",
    logo: "⚫⚪",
    founded: 1896,
    players: 26,
    monthlyOffer: 5400,
    openPositions: 5,
    preferredStyle: "Ponta esquerdo",
    category: "Serie A",
    description: "Famoso por revelar talentos, Udinese busca pontas habilidosos.",
    contact: {
      email: "academy@udinese.it",
      phone: "+39 0432 50 50 11",
      social: "@Udinese_1896"
    }
  },

  // Turquia - Süper Lig
  {
    id: "20",
    name: "Trabzonspor",
    country: "Turquia",
    continent: "Europa",
    league: "Süper Lig",
    logo: "🔴🔵",
    founded: 1967,
    players: 28,
    monthlyOffer: 5500,
    openPositions: 4,
    preferredStyle: "Atacante dinâmico",
    category: "Süper Lig",
    description: "Clube tradicional turco busca atacantes versáteis e intensos.",
    contact: {
      email: "altyapi@trabzonspor.org.tr",
      phone: "+90 462 230 1967",
      social: "@Trabzonspor"
    }
  },
  {
    id: "21",
    name: "Başakşehir FK",
    country: "Turquia",
    continent: "Europa",
    league: "Süper Lig",
    logo: "🟠🔵",
    founded: 1990,
    players: 26,
    monthlyOffer: 5300,
    openPositions: 3,
    preferredStyle: "Meio-campo criativo",
    category: "Süper Lig",
    description: "Clube moderno de Istambul que investe em meias técnicos.",
    contact: {
      email: "akademi@ibfk.org.tr",
      phone: "+90 212 468 1990",
      social: "@ibfk2014"
    }
  },
  {
    id: "22",
    name: "Konyaspor",
    country: "Turquia",
    continent: "Europa",
    league: "Süper Lig",
    logo: "🟢⚪",
    founded: 1922,
    players: 25,
    monthlyOffer: 4600,
    openPositions: 5,
    preferredStyle: "Zagueiro físico",
    category: "Süper Lig",
    description: "Clube da Anatólia que procura zagueiros fortes e confiáveis.",
    contact: {
      email: "altyapi@konyaspor.org.tr",
      phone: "+90 332 235 0922",
      social: "@konyaspor"
    }
  },

  // Noruega - Eliteserien
  {
    id: "23",
    name: "Molde FK",
    country: "Noruega",
    continent: "Europa",
    league: "Eliteserien",
    logo: "🔵⚪",
    founded: 1911,
    players: 23,
    monthlyOffer: 3800,
    openPositions: 4,
    preferredStyle: "Lateral ofensivo",
    category: "Eliteserien",
    description: "Clube norueguês de sucesso que valoriza laterais modernos.",
    contact: {
      email: "rekruttering@moldefk.no",
      phone: "+47 71 25 73 00",
      social: "@MoldeFK"
    }
  },
  {
    id: "24",
    name: "Rosenborg BK",
    country: "Noruega",
    continent: "Europa",
    league: "Eliteserien",
    logo: "⚫⚪",
    founded: 1917,
    players: 24,
    monthlyOffer: 4000,
    openPositions: 3,
    preferredStyle: "Meio-campo box-to-box",
    category: "Eliteserien",
    description: "Maior clube norueguês busca meias completos e trabalhadores.",
    contact: {
      email: "akademiet@rbk.no",
      phone: "+47 73 82 16 40",
      social: "@Rosenborg"
    }
  },
  {
    id: "25",
    name: "Bodø/Glimt",
    country: "Noruega",
    continent: "Europa",
    league: "Eliteserien",
    logo: "🟡⚫",
    founded: 1916,
    players: 22,
    monthlyOffer: 3600,
    openPositions: 5,
    preferredStyle: "Atacante veloz",
    category: "Eliteserien",
    description: "Campeão norueguês que joga futebol ofensivo e precisa de atacantes rápidos.",
    contact: {
      email: "rekruttering@glimt.no",
      phone: "+47 75 54 10 00",
      social: "@Glimt"
    }
  },

  // Finlândia - Veikkausliiga
  {
    id: "26",
    name: "HJK Helsinki",
    country: "Finlândia",
    continent: "Europa",
    league: "Veikkausliiga",
    logo: "🔵⚪",
    founded: 1907,
    players: 22,
    monthlyOffer: 3200,
    openPositions: 4,
    preferredStyle: "Ponta criativo",
    category: "Veikkausliiga",
    description: "Maior clube finlandês procura pontas com técnica e criatividade.",
    contact: {
      email: "akatemia@hjk.fi",
      phone: "+358 9 4766 2700",
      social: "@hjkhelsinki"
    }
  },
  {
    id: "27",
    name: "KuPS Kuopio",
    country: "Finlândia",
    continent: "Europa",
    league: "Veikkausliiga",
    logo: "🟡⚫",
    founded: 1923,
    players: 20,
    monthlyOffer: 2900,
    openPositions: 5,
    preferredStyle: "Volante defensivo",
    category: "Veikkausliiga",
    description: "Clube em ascensão que busca volantes táticos e disciplinados.",
    contact: {
      email: "akatemia@kups.fi",
      phone: "+358 17 581 2250",
      social: "@KuPSofficial"
    }
  },

  // Mais times europeus diversos
  {
    id: "28",
    name: "Vitesse Arnhem",
    country: "Holanda",
    continent: "Europa",
    league: "Eredivisie",
    logo: "🟡⚫",
    founded: 1892,
    players: 25,
    monthlyOffer: 5100,
    openPositions: 4,
    preferredStyle: "Meia-atacante",
    category: "Eredivisie",
    description: "Clube holandês conhecido por desenvolver jovens talentos ofensivos.",
    contact: {
      email: "scouting@vitesse.nl",
      phone: "+31 26 320 9500",
      social: "@MijnVitesse"
    }
  },
  {
    id: "29",
    name: "FC København",
    country: "Dinamarca",
    continent: "Europa",
    league: "Superliga",
    logo: "🔵⚪",
    founded: 1992,
    players: 26,
    monthlyOffer: 4800,
    openPositions: 3,
    preferredStyle: "Centroavante",
    category: "Superliga",
    description: "Clube dinamarquês dominante que busca atacantes finalizadores.",
    contact: {
      email: "academy@fck.dk",
      phone: "+45 35 43 31 31",
      social: "@FCKobenhavn"
    }
  },
  {
    id: "30",
    name: "AIK Stockholm",
    country: "Suécia",
    continent: "Europa",
    league: "Allsvenskan",
    logo: "⚫🟡",
    founded: 1891,
    players: 24,
    monthlyOffer: 3900,
    openPositions: 4,
    preferredStyle: "Lateral versátil",
    category: "Allsvenskan",
    description: "Tradicional clube sueco valoriza laterais completos e inteligentes.",
    contact: {
      email: "ungdom@aik.se",
      phone: "+46 8 735 50 00",
      social: "@AIKfotboll"
    }
  },
  {
    id: "31",
    name: "Olympiacos Piraeus",
    country: "Grécia",
    continent: "Europa",
    league: "Super League",
    logo: "🔴⚪",
    founded: 1925,
    players: 27,
    monthlyOffer: 5600,
    openPositions: 3,
    preferredStyle: "Zagueiro líder",
    category: "Super League",
    description: "Gigante grego busca defensores com personalidade e liderança.",
    contact: {
      email: "academy@olympiacos.org",
      phone: "+30 210 414 4000",
      social: "@olympiacosfc"
    }
  },
  {
    id: "32",
    name: "Sporting Braga",
    country: "Portugal",
    continent: "Europa",
    league: "Primeira Liga",
    logo: "🔴⚪",
    founded: 1921,
    players: 28,
    monthlyOffer: 5800,
    openPositions: 3,
    preferredStyle: "Extremo técnico",
    category: "Primeira Liga",
    description: "Os Arsenalistas procuram extremos habilidosos e com dribles.",
    contact: {
      email: "formacao@scbraga.pt",
      phone: "+351 253 203 400",
      social: "@SCBragaOficial"
    }
  },
  {
    id: "33",
    name: "Standard Liège",
    country: "Bélgica",
    continent: "Europa",
    league: "Pro League",
    logo: "🔴⚪",
    founded: 1898,
    players: 26,
    monthlyOffer: 5300,
    openPositions: 4,
    preferredStyle: "Volante box-to-box",
    category: "Pro League",
    description: "Clube tradicional belga que valoriza volantes completos.",
    contact: {
      email: "jeunesse@standard.be",
      phone: "+32 4 254 48 00",
      social: "@Standard_RSCL"
    }
  },
  {
    id: "34",
    name: "Austria Wien",
    country: "Áustria",
    continent: "Europa",
    league: "Bundesliga",
    logo: "🟣⚪",
    founded: 1911,
    players: 25,
    monthlyOffer: 4500,
    openPositions: 4,
    preferredStyle: "Meia central",
    category: "Bundesliga",
    description: "Violetas de Viena buscam meias organizadores com boa técnica.",
    contact: {
      email: "akademie@fk-austria.at",
      phone: "+43 1 688 09 24",
      social: "@FKAustriaWien"
    }
  },
  {
    id: "35",
    name: "Slavia Praha",
    country: "República Tcheca",
    continent: "Europa",
    league: "Fortuna Liga",
    logo: "🔴⚪",
    founded: 1892,
    players: 27,
    monthlyOffer: 4700,
    openPositions: 3,
    preferredStyle: "Atacante completo",
    category: "Fortuna Liga",
    description: "Clube tcheco de prestígio procura atacantes versáteis e inteligentes.",
    contact: {
      email: "akademie@slavia.cz",
      phone: "+420 233 081 729",
      social: "@slaviaofficial"
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