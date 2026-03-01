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
  currency: string;
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
    monthlyOffer: 8500,
    currency: "€",
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
    monthlyOffer: 7800,
    currency: "€",
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
    monthlyOffer: 9200,
    currency: "€",
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
    monthlyOffer: 6500,
    currency: "€",
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
  {
    id: "5",
    name: "Villarreal CF",
    country: "Espanha",
    continent: "Europa",
    league: "La Liga",
    logo: "🟡🔵",
    founded: 1923,
    players: 29,
    monthlyOffer: 9500,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Zagueiro técnico",
    category: "La Liga",
    description: "Submarino Amarelo valoriza jogadores com boa saída de bola.",
    contact: {
      email: "cantera@villarrealcf.es",
      phone: "+34 964 506 800",
      social: "@VillarrealCF"
    }
  },
  {
    id: "6",
    name: "Getafe CF",
    country: "Espanha",
    continent: "Europa",
    league: "La Liga",
    logo: "🔵⚪",
    founded: 1983,
    players: 25,
    monthlyOffer: 6200,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Volante defensivo",
    category: "La Liga",
    description: "Clube madrilenho que busca jogadores guerreiros e táticos.",
    contact: {
      email: "cantera@getafecf.com",
      phone: "+34 916 95 97 07",
      social: "@GetafeCF"
    }
  },
  {
    id: "7",
    name: "Osasuna",
    country: "Espanha",
    continent: "Europa",
    league: "La Liga",
    logo: "🔴🔵",
    founded: 1920,
    players: 26,
    monthlyOffer: 6800,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Lateral direito",
    category: "La Liga",
    description: "Clube navarro que valoriza jogadores com raça e determinação.",
    contact: {
      email: "tajonar@osasuna.es",
      phone: "+34 948 24 41 22",
      social: "@CAOsasuna"
    }
  },
  {
    id: "8",
    name: "Rayo Vallecano",
    country: "Espanha",
    continent: "Europa",
    league: "La Liga",
    logo: "⚪🔴",
    founded: 1924,
    players: 24,
    monthlyOffer: 5800,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Atacante pressionador",
    category: "La Liga",
    description: "Clube popular de Vallecas que joga futebol intenso e direto.",
    contact: {
      email: "cantera@rayovallecano.es",
      phone: "+34 914 78 22 53",
      social: "@RayoVallecano"
    }
  },
  {
    id: "9",
    name: "Deportivo Alavés",
    country: "Espanha",
    continent: "Europa",
    league: "La Liga",
    logo: "🔵⚪",
    founded: 1921,
    players: 25,
    monthlyOffer: 6000,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Zagueiro aéreo",
    category: "La Liga",
    description: "Clube basco que busca defensores fortes no jogo aéreo.",
    contact: {
      email: "cantera@deportivoalaves.com",
      phone: "+34 945 23 00 99",
      social: "@Alaves"
    }
  },
  {
    id: "10",
    name: "RCD Espanyol",
    country: "Espanha",
    continent: "Europa",
    league: "Segunda División",
    logo: "🔵⚪",
    founded: 1900,
    players: 27,
    monthlyOffer: 7200,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Meia criativo",
    category: "Segunda División",
    description: "Clube catalão tradicional em busca de meias organizadores.",
    contact: {
      email: "cantera@rcdespanyol.com",
      phone: "+34 932 92 77 00",
      social: "@RCDEspanyol"
    }
  },
  {
    id: "11",
    name: "Real Zaragoza",
    country: "Espanha",
    continent: "Europa",
    league: "Segunda División",
    logo: "🔵⚪",
    founded: 1932,
    players: 26,
    monthlyOffer: 6500,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Ponta direito",
    category: "Segunda División",
    description: "Clube aragonês que valoriza extremos rápidos e habilidosos.",
    contact: {
      email: "cantera@realzaragoza.com",
      phone: "+34 976 43 61 96",
      social: "@RealZaragoza"
    }
  },
  {
    id: "12",
    name: "Levante UD",
    country: "Espanha",
    continent: "Europa",
    league: "Segunda División",
    logo: "🔴🔵",
    founded: 1909,
    players: 25,
    monthlyOffer: 6200,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Atacante móvel",
    category: "Segunda División",
    description: "Clube valenciano que busca atacantes dinâmicos.",
    contact: {
      email: "cantera@levanteud.com",
      phone: "+34 963 36 55 12",
      social: "@LevanteUD"
    }
  },

  // Inglaterra - Premier League / Championship
  {
    id: "13",
    name: "Brighton & Hove Albion",
    country: "Inglaterra",
    continent: "Europa",
    league: "Premier League",
    logo: "🔵⚪",
    founded: 1901,
    players: 29,
    monthlyOffer: 12500,
    currency: "£",
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
    id: "14",
    name: "Brentford FC",
    country: "Inglaterra",
    continent: "Europa",
    league: "Premier League",
    logo: "🔴⚪",
    founded: 1889,
    players: 25,
    monthlyOffer: 11800,
    currency: "£",
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
    id: "15",
    name: "Fulham FC",
    country: "Inglaterra",
    continent: "Europa",
    league: "Premier League",
    logo: "⚫⚪",
    founded: 1879,
    players: 28,
    monthlyOffer: 11200,
    currency: "£",
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
    id: "16",
    name: "Wolverhampton Wanderers",
    country: "Inglaterra",
    continent: "Europa",
    league: "Premier League",
    logo: "🟡⚫",
    founded: 1877,
    players: 30,
    monthlyOffer: 13000,
    currency: "£",
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
  {
    id: "17",
    name: "Crystal Palace",
    country: "Inglaterra",
    continent: "Europa",
    league: "Premier League",
    logo: "🔴🔵",
    founded: 1905,
    players: 27,
    monthlyOffer: 11500,
    currency: "£",
    openPositions: 3,
    preferredStyle: "Ponta veloz",
    category: "Premier League",
    description: "Eagles valorizam pontas rápidos e dribladores.",
    contact: {
      email: "academy@cpfc.co.uk",
      phone: "+44 208 768 6000",
      social: "@CPFC"
    }
  },
  {
    id: "18",
    name: "Bournemouth",
    country: "Inglaterra",
    continent: "Europa",
    league: "Premier League",
    logo: "🔴⚫",
    founded: 1899,
    players: 26,
    monthlyOffer: 10800,
    currency: "£",
    openPositions: 4,
    preferredStyle: "Lateral ofensivo",
    category: "Premier League",
    description: "Cherries buscam laterais modernos que apoiem o ataque.",
    contact: {
      email: "academy@afcb.co.uk",
      phone: "+44 1202 726300",
      social: "@afcbournemouth"
    }
  },
  {
    id: "19",
    name: "Nottingham Forest",
    country: "Inglaterra",
    continent: "Europa",
    league: "Premier League",
    logo: "🔴⚪",
    founded: 1865,
    players: 28,
    monthlyOffer: 11000,
    currency: "£",
    openPositions: 3,
    preferredStyle: "Volante destruidor",
    category: "Premier League",
    description: "Clube histórico que valoriza volantes guerreiros.",
    contact: {
      email: "academy@nottinghamforest.co.uk",
      phone: "+44 115 982 4444",
      social: "@NFFC"
    }
  },
  {
    id: "20",
    name: "Leeds United",
    country: "Inglaterra",
    continent: "Europa",
    league: "Championship",
    logo: "⚪🔵",
    founded: 1919,
    players: 29,
    monthlyOffer: 9500,
    currency: "£",
    openPositions: 3,
    preferredStyle: "Meia pressionador",
    category: "Championship",
    description: "Clube tradicional que joga futebol intenso e de alta pressão.",
    contact: {
      email: "academy@leedsunited.com",
      phone: "+44 871 334 1919",
      social: "@LUFC"
    }
  },
  {
    id: "21",
    name: "West Bromwich Albion",
    country: "Inglaterra",
    continent: "Europa",
    league: "Championship",
    logo: "🔵⚪",
    founded: 1878,
    players: 27,
    monthlyOffer: 8800,
    currency: "£",
    openPositions: 4,
    preferredStyle: "Zagueiro líder",
    category: "Championship",
    description: "Baggies procuram defensores com liderança e experiência.",
    contact: {
      email: "academy@wba.co.uk",
      phone: "+44 871 271 1100",
      social: "@WBA"
    }
  },
  {
    id: "22",
    name: "Sheffield United",
    country: "Inglaterra",
    continent: "Europa",
    league: "Championship",
    logo: "🔴⚪",
    founded: 1889,
    players: 26,
    monthlyOffer: 8500,
    currency: "£",
    openPositions: 4,
    preferredStyle: "Lateral ala",
    category: "Championship",
    description: "Blades valorizam laterais que funcionam como alas no sistema.",
    contact: {
      email: "academy@sufc.co.uk",
      phone: "+44 871 995 1899",
      social: "@SheffieldUnited"
    }
  },
  {
    id: "23",
    name: "Middlesbrough",
    country: "Inglaterra",
    continent: "Europa",
    league: "Championship",
    logo: "🔴⚪",
    founded: 1876,
    players: 25,
    monthlyOffer: 7800,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Atacante completo",
    category: "Championship",
    description: "Boro busca atacantes versáteis e trabalhadores.",
    contact: {
      email: "academy@mfc.co.uk",
      phone: "+44 1642 877700",
      social: "@Boro"
    }
  },
  {
    id: "24",
    name: "Stoke City",
    country: "Inglaterra",
    continent: "Europa",
    league: "Championship",
    logo: "🔴⚪",
    founded: 1863,
    players: 26,
    monthlyOffer: 8000,
    currency: "£",
    openPositions: 4,
    preferredStyle: "Volante box-to-box",
    category: "Championship",
    description: "Potters valorizam meias completos e dinâmicos.",
    contact: {
      email: "academy@stokecityfc.com",
      phone: "+44 1782 367598",
      social: "@stokecity"
    }
  },

  // Escócia - Scottish Premiership
  {
    id: "25",
    name: "Aberdeen FC",
    country: "Escócia",
    continent: "Europa",
    league: "Scottish Premiership",
    logo: "🔴⚪",
    founded: 1903,
    players: 24,
    monthlyOffer: 6500,
    currency: "£",
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
    id: "26",
    name: "Heart of Midlothian",
    country: "Escócia",
    continent: "Europa",
    league: "Scottish Premiership",
    logo: "🔴⚪",
    founded: 1874,
    players: 25,
    monthlyOffer: 5800,
    currency: "£",
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
    id: "27",
    name: "Hibernian FC",
    country: "Escócia",
    continent: "Europa",
    league: "Scottish Premiership",
    logo: "🟢⚪",
    founded: 1875,
    players: 23,
    monthlyOffer: 5200,
    currency: "£",
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
  {
    id: "28",
    name: "Dundee United",
    country: "Escócia",
    continent: "Europa",
    league: "Scottish Premiership",
    logo: "🟠⚫",
    founded: 1909,
    players: 24,
    monthlyOffer: 5500,
    currency: "£",
    openPositions: 4,
    preferredStyle: "Atacante de área",
    category: "Scottish Premiership",
    description: "Tangerines buscam finalizadores eficientes dentro da área.",
    contact: {
      email: "academy@dundeeunitedfc.co.uk",
      phone: "+44 1382 833166",
      social: "@DundeeUnitedFC"
    }
  },
  {
    id: "29",
    name: "Kilmarnock FC",
    country: "Escócia",
    continent: "Europa",
    league: "Scottish Premiership",
    logo: "🔵⚪",
    founded: 1869,
    players: 23,
    monthlyOffer: 5000,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Lateral versátil",
    category: "Scottish Premiership",
    description: "Killie valoriza laterais que possam jogar em ambos os lados.",
    contact: {
      email: "academy@kilmarnockfc.co.uk",
      phone: "+44 1563 545300",
      social: "@KilmarnockFC"
    }
  },

  // França - Ligue 1
  {
    id: "30",
    name: "RC Lens",
    country: "França",
    continent: "Europa",
    league: "Ligue 1",
    logo: "🔴🟡",
    founded: 1906,
    players: 27,
    monthlyOffer: 7500,
    currency: "€",
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
    id: "31",
    name: "Stade Rennais",
    country: "França",
    continent: "Europa",
    league: "Ligue 1",
    logo: "🔴⚫",
    founded: 1901,
    players: 29,
    monthlyOffer: 8200,
    currency: "€",
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
    id: "32",
    name: "OGC Nice",
    country: "França",
    continent: "Europa",
    league: "Ligue 1",
    logo: "🔴⚫",
    founded: 1904,
    players: 28,
    monthlyOffer: 7800,
    currency: "€",
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
    id: "33",
    name: "RC Strasbourg",
    country: "França",
    continent: "Europa",
    league: "Ligue 1",
    logo: "🔵⚪",
    founded: 1906,
    players: 26,
    monthlyOffer: 6800,
    currency: "€",
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
  {
    id: "34",
    name: "Montpellier HSC",
    country: "França",
    continent: "Europa",
    league: "Ligue 1",
    logo: "🔵🟠",
    founded: 1974,
    players: 27,
    monthlyOffer: 7200,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Volante técnico",
    category: "Ligue 1",
    description: "La Paillade busca volantes com qualidade no passe.",
    contact: {
      email: "formation@mhscfoot.com",
      phone: "+33 4 67 13 61 00",
      social: "@MontpellierHSC"
    }
  },
  {
    id: "35",
    name: "Stade de Reims",
    country: "França",
    continent: "Europa",
    league: "Ligue 1",
    logo: "🔴⚪",
    founded: 1931,
    players: 26,
    monthlyOffer: 6500,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Ponta esquerdo",
    category: "Ligue 1",
    description: "Clube histórico francês que valoriza extremos habilidosos.",
    contact: {
      email: "formation@stade-de-reims.com",
      phone: "+33 3 26 05 23 45",
      social: "@StadeDeReims"
    }
  },
  {
    id: "36",
    name: "Nantes FC",
    country: "França",
    continent: "Europa",
    league: "Ligue 1",
    logo: "🟡🟢",
    founded: 1943,
    players: 27,
    monthlyOffer: 7000,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Meia criativo",
    category: "Ligue 1",
    description: "Canários buscam meias organizadores com visão de jogo.",
    contact: {
      email: "formation@fcnantes.com",
      phone: "+33 2 40 35 74 09",
      social: "@FCNantes"
    }
  },
  {
    id: "37",
    name: "Toulouse FC",
    country: "França",
    continent: "Europa",
    league: "Ligue 1",
    logo: "🟣⚪",
    founded: 1970,
    players: 25,
    monthlyOffer: 6200,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Zagueiro rápido",
    category: "Ligue 1",
    description: "Violets procuram defensores rápidos para linha alta.",
    contact: {
      email: "formation@tfc.info",
      phone: "+33 5 61 13 06 66",
      social: "@ToulouseFC"
    }
  },
  {
    id: "38",
    name: "Angers SCO",
    country: "França",
    continent: "Europa",
    league: "Ligue 1",
    logo: "⚫⚪",
    founded: 1919,
    players: 24,
    monthlyOffer: 5800,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Atacante móvel",
    category: "Ligue 1",
    description: "SCO busca atacantes dinâmicos e versáteis.",
    contact: {
      email: "formation@angers-sco.fr",
      phone: "+33 2 41 22 28 28",
      social: "@AngersSCO"
    }
  },

  // Itália - Serie A
  {
    id: "39",
    name: "ACF Fiorentina",
    country: "Itália",
    continent: "Europa",
    league: "Serie A",
    logo: "🟣⚪",
    founded: 1926,
    players: 29,
    monthlyOffer: 8800,
    currency: "€",
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
    id: "40",
    name: "Torino FC",
    country: "Itália",
    continent: "Europa",
    league: "Serie A",
    logo: "🔴⚫",
    founded: 1906,
    players: 27,
    monthlyOffer: 7200,
    currency: "€",
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
    id: "41",
    name: "Bologna FC",
    country: "Itália",
    continent: "Europa",
    league: "Serie A",
    logo: "🔴🔵",
    founded: 1909,
    players: 28,
    monthlyOffer: 7600,
    currency: "€",
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
    id: "42",
    name: "Udinese Calcio",
    country: "Itália",
    continent: "Europa",
    league: "Serie A",
    logo: "⚫⚪",
    founded: 1896,
    players: 26,
    monthlyOffer: 6900,
    currency: "€",
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
  {
    id: "43",
    name: "Sassuolo Calcio",
    country: "Itália",
    continent: "Europa",
    league: "Serie A",
    logo: "🟢⚫",
    founded: 1920,
    players: 26,
    monthlyOffer: 6800,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Lateral ofensivo",
    category: "Serie A",
    description: "Neroverdi valorizam laterais modernos que apoiem o ataque.",
    contact: {
      email: "settoregiovanile@sassuolocalcio.it",
      phone: "+39 0536 883611",
      social: "@SassuoloUS"
    }
  },
  {
    id: "44",
    name: "Hellas Verona",
    country: "Itália",
    continent: "Europa",
    league: "Serie A",
    logo: "🟡🔵",
    founded: 1903,
    players: 25,
    monthlyOffer: 6500,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Volante destruidor",
    category: "Serie A",
    description: "Gialloblu buscam volantes guerreiros e táticos.",
    contact: {
      email: "settoregiovanile@hellasverona.it",
      phone: "+39 045 8180 711",
      social: "@HellasVeronaFC"
    }
  },
  {
    id: "45",
    name: "Empoli FC",
    country: "Itália",
    continent: "Europa",
    league: "Serie A",
    logo: "🔵⚪",
    founded: 1920,
    players: 24,
    monthlyOffer: 6200,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Meia-atacante",
    category: "Serie A",
    description: "Azzurri conhecidos por revelar talentos ofensivos.",
    contact: {
      email: "settoregiovanile@empolifc.com",
      phone: "+39 0571 9261",
      social: "@EmpoliFC"
    }
  },
  {
    id: "46",
    name: "Genoa CFC",
    country: "Itália",
    continent: "Europa",
    league: "Serie A",
    logo: "🔴🔵",
    founded: 1893,
    players: 27,
    monthlyOffer: 7000,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Zagueiro experiente",
    category: "Serie A",
    description: "Clube mais antigo da Itália valoriza defensores sólidos.",
    contact: {
      email: "settoregiovanile@genoaCfc.it",
      phone: "+39 010 5319241",
      social: "@GenoaCFC"
    }
  },
  {
    id: "47",
    name: "Cagliari Calcio",
    country: "Itália",
    continent: "Europa",
    league: "Serie A",
    logo: "🔴🔵",
    founded: 1920,
    players: 25,
    monthlyOffer: 6600,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Atacante veloz",
    category: "Serie A",
    description: "Rossoblù sardo busca atacantes rápidos e finalizadores.",
    contact: {
      email: "settoregiovanile@cagliaricalcio.com",
      phone: "+39 070 60 421",
      social: "@CagliariCalcio"
    }
  },
  {
    id: "48",
    name: "Lecce",
    country: "Itália",
    continent: "Europa",
    league: "Serie A",
    logo: "🟡🔴",
    founded: 1908,
    players: 24,
    monthlyOffer: 6000,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Ponta direito",
    category: "Serie A",
    description: "Giallorossi do sul da Itália valorizam extremos técnicos.",
    contact: {
      email: "settoregiovanile@uslecce.it",
      phone: "+39 0832 344 121",
      social: "@OfficialUSLecce"
    }
  },
  {
    id: "49",
    name: "Salernitana",
    country: "Itália",
    continent: "Europa",
    league: "Serie A",
    logo: "🔴🟢",
    founded: 1919,
    players: 24,
    monthlyOffer: 5800,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Lateral esquerdo",
    category: "Serie A",
    description: "Granata procuram laterais esquerdos ofensivos.",
    contact: {
      email: "settoregiovanile@ussalernitana1919.it",
      phone: "+39 089 237 0635",
      social: "@OfficialUSS1919"
    }
  },
  {
    id: "50",
    name: "Parma Calcio",
    country: "Itália",
    continent: "Europa",
    league: "Serie B",
    logo: "🟡🔵",
    founded: 1913,
    players: 26,
    monthlyOffer: 6500,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Meio-campo criativo",
    category: "Serie B",
    description: "Crociati em reconstrução buscam meias talentosos.",
    contact: {
      email: "settoregiovanile@parmacalcio1913.com",
      phone: "+39 0521 176 0740",
      social: "@1913parmacalcio"
    }
  },

  // Turquia - Süper Lig
  {
    id: "51",
    name: "Trabzonspor",
    country: "Turquia",
    continent: "Europa",
    league: "Süper Lig",
    logo: "🔴🔵",
    founded: 1967,
    players: 28,
    monthlyOffer: 85000,
    currency: "₺",
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
    id: "52",
    name: "Başakşehir FK",
    country: "Turquia",
    continent: "Europa",
    league: "Süper Lig",
    logo: "🟠🔵",
    founded: 1990,
    players: 26,
    monthlyOffer: 78000,
    currency: "₺",
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
    id: "53",
    name: "Konyaspor",
    country: "Turquia",
    continent: "Europa",
    league: "Süper Lig",
    logo: "🟢⚪",
    founded: 1922,
    players: 25,
    monthlyOffer: 65000,
    currency: "₺",
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
  {
    id: "54",
    name: "Sivasspor",
    country: "Turquia",
    continent: "Europa",
    league: "Süper Lig",
    logo: "🔴⚪",
    founded: 1967,
    players: 24,
    monthlyOffer: 70000,
    currency: "₺",
    openPositions: 4,
    preferredStyle: "Volante box-to-box",
    category: "Süper Lig",
    description: "Yiğidolar buscam meias trabalhadores e versáteis.",
    contact: {
      email: "altyapi@sivasspor.org.tr",
      phone: "+90 346 221 58 67",
      social: "@Sivasspor"
    }
  },
  {
    id: "55",
    name: "Alanyaspor",
    country: "Turquia",
    continent: "Europa",
    league: "Süper Lig",
    logo: "🟠🟢",
    founded: 1948,
    players: 23,
    monthlyOffer: 72000,
    currency: "₺",
    openPositions: 4,
    preferredStyle: "Ponta técnico",
    category: "Süper Lig",
    description: "Clube da Riviera Turca valoriza extremos habilidosos.",
    contact: {
      email: "altyapi@alanyaspor.org.tr",
      phone: "+90 242 513 16 07",
      social: "@Alanyaspor"
    }
  },
  {
    id: "56",
    name: "Kasımpaşa",
    country: "Turquia",
    continent: "Europa",
    league: "Süper Lig",
    logo: "🔵⚪",
    founded: 1921,
    players: 24,
    monthlyOffer: 68000,
    currency: "₺",
    openPositions: 5,
    preferredStyle: "Lateral moderno",
    category: "Süper Lig",
    description: "Clube de Istambul busca laterais completos.",
    contact: {
      email: "altyapi@kasimpasa.com.tr",
      phone: "+90 212 235 19 21",
      social: "@Kasimpasa"
    }
  },

  // Noruega - Eliteserien
  {
    id: "57",
    name: "Molde FK",
    country: "Noruega",
    continent: "Europa",
    league: "Eliteserien",
    logo: "🔵⚪",
    founded: 1911,
    players: 23,
    monthlyOffer: 75000,
    currency: "kr",
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
    id: "58",
    name: "Rosenborg BK",
    country: "Noruega",
    continent: "Europa",
    league: "Eliteserien",
    logo: "⚫⚪",
    founded: 1917,
    players: 24,
    monthlyOffer: 85000,
    currency: "kr",
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
    id: "59",
    name: "Bodø/Glimt",
    country: "Noruega",
    continent: "Europa",
    league: "Eliteserien",
    logo: "🟡⚫",
    founded: 1916,
    players: 22,
    monthlyOffer: 68000,
    currency: "kr",
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
  {
    id: "60",
    name: "Vålerenga IF",
    country: "Noruega",
    continent: "Europa",
    league: "Eliteserien",
    logo: "🔵⚪",
    founded: 1913,
    players: 23,
    monthlyOffer: 70000,
    currency: "kr",
    openPositions: 4,
    preferredStyle: "Zagueiro central",
    category: "Eliteserien",
    description: "Clube de Oslo busca zagueiros líderes e seguros.",
    contact: {
      email: "akademi@vif-fotball.no",
      phone: "+47 22 60 90 60",
      social: "@VIF_Fotball"
    }
  },
  {
    id: "61",
    name: "Viking FK",
    country: "Noruega",
    continent: "Europa",
    league: "Eliteserien",
    logo: "🔵🟡",
    founded: 1899,
    players: 22,
    monthlyOffer: 72000,
    currency: "kr",
    openPositions: 4,
    preferredStyle: "Meia criativo",
    category: "Eliteserien",
    description: "Clube tradicional de Stavanger valoriza meias técnicos.",
    contact: {
      email: "akademi@viking-fk.no",
      phone: "+47 51 93 09 00",
      social: "@Viking_FK"
    }
  },

  // Finlândia - Veikkausliiga
  {
    id: "62",
    name: "HJK Helsinki",
    country: "Finlândia",
    continent: "Europa",
    league: "Veikkausliiga",
    logo: "🔵⚪",
    founded: 1907,
    players: 22,
    monthlyOffer: 5500,
    currency: "€",
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
    id: "63",
    name: "KuPS Kuopio",
    country: "Finlândia",
    continent: "Europa",
    league: "Veikkausliiga",
    logo: "🟡⚫",
    founded: 1923,
    players: 20,
    monthlyOffer: 5000,
    currency: "€",
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
  {
    id: "64",
    name: "FC Inter Turku",
    country: "Finlândia",
    continent: "Europa",
    league: "Veikkausliiga",
    logo: "🔵⚫",
    founded: 1990,
    players: 21,
    monthlyOffer: 5200,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Atacante finalizador",
    category: "Veikkausliiga",
    description: "Sinimustat buscam atacantes eficientes no gol.",
    contact: {
      email: "akatemia@fcinter.fi",
      phone: "+358 2 274 8600",
      social: "@FCInterTurku"
    }
  },
  {
    id: "65",
    name: "IFK Mariehamn",
    country: "Finlândia",
    continent: "Europa",
    league: "Veikkausliiga",
    logo: "🟢⚪",
    founded: 1919,
    players: 20,
    monthlyOffer: 5100,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Lateral versátil",
    category: "Veikkausliiga",
    description: "Clube das ilhas Åland valoriza laterais completos.",
    contact: {
      email: "akatemia@ifkmariehamn.fi",
      phone: "+358 18 19 130",
      social: "@IFKMariehamn"
    }
  },

  // Holanda - Eredivisie
  {
    id: "66",
    name: "Vitesse Arnhem",
    country: "Holanda",
    continent: "Europa",
    league: "Eredivisie",
    logo: "🟡⚫",
    founded: 1892,
    players: 25,
    monthlyOffer: 7200,
    currency: "€",
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
    id: "67",
    name: "AZ Alkmaar",
    country: "Holanda",
    continent: "Europa",
    league: "Eredivisie",
    logo: "🔴⚪",
    founded: 1967,
    players: 26,
    monthlyOffer: 8500,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Volante técnico",
    category: "Eredivisie",
    description: "Cheese Farmers conhecidos por revelar talentos técnicos.",
    contact: {
      email: "jeugdopleiding@az.nl",
      phone: "+31 72 547 95 55",
      social: "@AZAlkmaar"
    }
  },
  {
    id: "68",
    name: "FC Utrecht",
    country: "Holanda",
    continent: "Europa",
    league: "Eredivisie",
    logo: "🔴⚪",
    founded: 1970,
    players: 25,
    monthlyOffer: 7500,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Lateral ofensivo",
    category: "Eredivisie",
    description: "Domstedelingen valorizam laterais que apoiem o ataque.",
    contact: {
      email: "jeugdopleiding@fcutrecht.nl",
      phone: "+31 30 258 02 58",
      social: "@FCUtrecht"
    }
  },
  {
    id: "69",
    name: "SC Heerenveen",
    country: "Holanda",
    continent: "Europa",
    league: "Eredivisie",
    logo: "🔵⚪",
    founded: 1920,
    players: 24,
    monthlyOffer: 6800,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Ponta rápido",
    category: "Eredivisie",
    description: "Clube da Frísia que busca extremos velozes.",
    contact: {
      email: "jeugdopleiding@heerenveen.nl",
      phone: "+31 513 62 55 55",
      social: "@scHeerenveen"
    }
  },
  {
    id: "70",
    name: "FC Groningen",
    country: "Holanda",
    continent: "Europa",
    league: "Eredivisie",
    logo: "🟢⚪",
    founded: 1971,
    players: 24,
    monthlyOffer: 6500,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Zagueiro central",
    category: "Eredivisie",
    description: "Trots van het Noorden procura zagueiros líderes.",
    contact: {
      email: "jeugdopleiding@fcgroningen.nl",
      phone: "+31 50 549 12 00",
      social: "@fcgroningen"
    }
  },
  {
    id: "71",
    name: "Fortuna Sittard",
    country: "Holanda",
    continent: "Europa",
    league: "Eredivisie",
    logo: "🟡🟢",
    founded: 1968,
    players: 23,
    monthlyOffer: 6200,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Atacante completo",
    category: "Eredivisie",
    description: "Clube de Limburgo busca atacantes versáteis.",
    contact: {
      email: "jeugdopleiding@fortunasittard.nl",
      phone: "+31 46 451 13 50",
      social: "@FortunaSittard"
    }
  },
  {
    id: "72",
    name: "Go Ahead Eagles",
    country: "Holanda",
    continent: "Europa",
    league: "Eredivisie",
    logo: "🔴🟡",
    founded: 1902,
    players: 23,
    monthlyOffer: 6000,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Meio-campo criativo",
    category: "Eredivisie",
    description: "Águias de Deventer valorizam meias organizadores.",
    contact: {
      email: "jeugdopleiding@ga-eagles.nl",
      phone: "+31 570 63 83 38",
      social: "@GAEagles1902"
    }
  },

  // Dinamarca - Superliga
  {
    id: "73",
    name: "FC København",
    country: "Dinamarca",
    continent: "Europa",
    league: "Superliga",
    logo: "🔵⚪",
    founded: 1992,
    players: 26,
    monthlyOffer: 55000,
    currency: "kr",
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
    id: "74",
    name: "Brøndby IF",
    country: "Dinamarca",
    continent: "Europa",
    league: "Superliga",
    logo: "🔵🟡",
    founded: 1964,
    players: 25,
    monthlyOffer: 50000,
    currency: "kr",
    openPositions: 4,
    preferredStyle: "Volante box-to-box",
    category: "Superliga",
    description: "Clube tradicional de Copenhague valoriza meias completos.",
    contact: {
      email: "akademi@brondby.com",
      phone: "+45 43 63 03 01",
      social: "@BrondbyIF"
    }
  },
  {
    id: "75",
    name: "FC Midtjylland",
    country: "Dinamarca",
    continent: "Europa",
    league: "Superliga",
    logo: "⚫🔴",
    founded: 1999,
    players: 24,
    monthlyOffer: 52000,
    currency: "kr",
    openPositions: 3,
    preferredStyle: "Lateral moderno",
    category: "Superliga",
    description: "Os Lobos utilizam análise de dados para recrutar laterais.",
    contact: {
      email: "akademi@fcm.dk",
      phone: "+45 96 14 66 07",
      social: "@fcmidtjylland"
    }
  },
  {
    id: "76",
    name: "AaB Aalborg",
    country: "Dinamarca",
    continent: "Europa",
    league: "Superliga",
    logo: "🔴⚪",
    founded: 1885,
    players: 23,
    monthlyOffer: 48000,
    currency: "kr",
    openPositions: 4,
    preferredStyle: "Ponta criativo",
    category: "Superliga",
    description: "Clube do norte da Dinamarca busca extremos técnicos.",
    contact: {
      email: "akademi@aabsport.dk",
      phone: "+45 96 35 93 00",
      social: "@aabsport"
    }
  },
  {
    id: "77",
    name: "Silkeborg IF",
    country: "Dinamarca",
    continent: "Europa",
    league: "Superliga",
    logo: "🔴⚪",
    founded: 1917,
    players: 22,
    monthlyOffer: 45000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Zagueiro rápido",
    category: "Superliga",
    description: "Clube de Jylland valoriza defensores com velocidade.",
    contact: {
      email: "akademi@silkeborgif.com",
      phone: "+45 86 82 14 11",
      social: "@SilkeborgIF"
    }
  },

  // Suécia - Allsvenskan
  {
    id: "78",
    name: "AIK Stockholm",
    country: "Suécia",
    continent: "Europa",
    league: "Allsvenskan",
    logo: "⚫🟡",
    founded: 1891,
    players: 24,
    monthlyOffer: 72000,
    currency: "kr",
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
    id: "79",
    name: "IFK Göteborg",
    country: "Suécia",
    continent: "Europa",
    league: "Allsvenskan",
    logo: "🔵⚪",
    founded: 1904,
    players: 25,
    monthlyOffer: 68000,
    currency: "kr",
    openPositions: 4,
    preferredStyle: "Meia central",
    category: "Allsvenskan",
    description: "Blåvitt busca meias organizadores com visão de jogo.",
    contact: {
      email: "ungdom@ifkgoteborg.se",
      phone: "+46 31 750 61 00",
      social: "@IFKGoteborg"
    }
  },
  {
    id: "80",
    name: "Malmö FF",
    country: "Suécia",
    continent: "Europa",
    league: "Allsvenskan",
    logo: "🔵⚪",
    founded: 1910,
    players: 26,
    monthlyOffer: 75000,
    currency: "kr",
    openPositions: 3,
    preferredStyle: "Atacante completo",
    category: "Allsvenskan",
    description: "Clube mais bem-sucedido da Suécia busca atacantes versáteis.",
    contact: {
      email: "ungdom@mff.se",
      phone: "+46 40 699 09 00",
      social: "@Malmo_FF"
    }
  },
  {
    id: "81",
    name: "Djurgårdens IF",
    country: "Suécia",
    continent: "Europa",
    league: "Allsvenskan",
    logo: "🔵⚪",
    founded: 1891,
    players: 24,
    monthlyOffer: 70000,
    currency: "kr",
    openPositions: 4,
    preferredStyle: "Volante técnico",
    category: "Allsvenskan",
    description: "Clube de Estocolmo valoriza volantes com qualidade no passe.",
    contact: {
      email: "ungdom@dif.se",
      phone: "+46 8 508 110 00",
      social: "@dif_fotboll"
    }
  },
  {
    id: "82",
    name: "Hammarby IF",
    country: "Suécia",
    continent: "Europa",
    league: "Allsvenskan",
    logo: "🟢⚪",
    founded: 1889,
    players: 23,
    monthlyOffer: 65000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Ponta esquerdo",
    category: "Allsvenskan",
    description: "Bajen busca extremos esquerdos habilidosos.",
    contact: {
      email: "ungdom@hammarbyfotboll.se",
      phone: "+46 8 462 95 00",
      social: "@Hammarbyfotboll"
    }
  },
  {
    id: "83",
    name: "IFK Norrköping",
    country: "Suécia",
    continent: "Europa",
    league: "Allsvenskan",
    logo: "🔵⚪",
    founded: 1897,
    players: 23,
    monthlyOffer: 62000,
    currency: "kr",
    openPositions: 4,
    preferredStyle: "Zagueiro moderno",
    category: "Allsvenskan",
    description: "Peking valoriza zagueiros com boa saída de bola.",
    contact: {
      email: "ungdom@ifknorrkoping.se",
      phone: "+46 11 495 12 00",
      social: "@IFKNorrkoping"
    }
  },

  // Grécia - Super League
  {
    id: "84",
    name: "Olympiacos Piraeus",
    country: "Grécia",
    continent: "Europa",
    league: "Super League",
    logo: "🔴⚪",
    founded: 1925,
    players: 27,
    monthlyOffer: 7800,
    currency: "€",
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
    id: "85",
    name: "PAOK Thessaloniki",
    country: "Grécia",
    continent: "Europa",
    league: "Super League",
    logo: "⚫⚪",
    founded: 1926,
    players: 26,
    monthlyOffer: 7500,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Volante destruidor",
    category: "Super League",
    description: "Águia bicéfala busca volantes fortes e táticos.",
    contact: {
      email: "academy@paokfc.gr",
      phone: "+30 2310 570 000",
      social: "@PAOK_FC"
    }
  },
  {
    id: "86",
    name: "AEK Athens",
    country: "Grécia",
    continent: "Europa",
    league: "Super League",
    logo: "🟡⚫",
    founded: 1924,
    players: 25,
    monthlyOffer: 7200,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Meia-atacante",
    category: "Super League",
    description: "União valoriza meias ofensivos criativos.",
    contact: {
      email: "academy@aekfc.gr",
      phone: "+30 210 611 8800",
      social: "@AEK_FC_OFFICIAL"
    }
  },
  {
    id: "87",
    name: "Panathinaikos",
    country: "Grécia",
    continent: "Europa",
    league: "Super League",
    logo: "🟢⚪",
    founded: 1908,
    players: 26,
    monthlyOffer: 7600,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Lateral ofensivo",
    category: "Super League",
    description: "Trifólio busca laterais que apoiem o ataque.",
    contact: {
      email: "academy@pao.gr",
      phone: "+30 210 870 9000",
      social: "@paofc_"
    }
  },
  {
    id: "88",
    name: "Aris Thessaloniki",
    country: "Grécia",
    continent: "Europa",
    league: "Super League",
    logo: "🟡⚫",
    founded: 1914,
    players: 24,
    monthlyOffer: 6500,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Atacante físico",
    category: "Super League",
    description: "Deus da guerra busca atacantes fortes e finalizadores.",
    contact: {
      email: "academy@arisfc.gr",
      phone: "+30 2310 531 000",
      social: "@Aris_FC"
    }
  },

  // Portugal - Primeira Liga
  {
    id: "89",
    name: "Sporting Braga",
    country: "Portugal",
    continent: "Europa",
    league: "Primeira Liga",
    logo: "🔴⚪",
    founded: 1921,
    players: 28,
    monthlyOffer: 7500,
    currency: "€",
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
    id: "90",
    name: "Vitória SC",
    country: "Portugal",
    continent: "Europa",
    league: "Primeira Liga",
    logo: "⚫⚪",
    founded: 1922,
    players: 26,
    monthlyOffer: 6800,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Volante técnico",
    category: "Primeira Liga",
    description: "Conquistadores valorizam volantes com qualidade técnica.",
    contact: {
      email: "formacao@vitoriasc.pt",
      phone: "+351 253 516 139",
      social: "@VitoriaSC1922"
    }
  },
  {
    id: "91",
    name: "Rio Ave FC",
    country: "Portugal",
    continent: "Europa",
    league: "Primeira Liga",
    logo: "🟢⚪",
    founded: 1939,
    players: 25,
    monthlyOffer: 6200,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Lateral moderno",
    category: "Primeira Liga",
    description: "Vilacondenses buscam laterais completos e ofensivos.",
    contact: {
      email: "formacao@rioave-fc.pt",
      phone: "+351 252 646 870",
      social: "@RioAve_FC"
    }
  },
  {
    id: "92",
    name: "Boavista FC",
    country: "Portugal",
    continent: "Europa",
    league: "Primeira Liga",
    logo: "⚫⚪",
    founded: 1903,
    players: 25,
    monthlyOffer: 6500,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Zagueiro central",
    category: "Primeira Liga",
    description: "Axadrezados procuram zagueiros líderes e seguros.",
    contact: {
      email: "formacao@boavistafc.pt",
      phone: "+351 226 067 303",
      social: "@BoavistaOficial"
    }
  },
  {
    id: "93",
    name: "Moreirense FC",
    country: "Portugal",
    continent: "Europa",
    league: "Primeira Liga",
    logo: "🟢⚪",
    founded: 1938,
    players: 24,
    monthlyOffer: 5800,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Ponta rápido",
    category: "Primeira Liga",
    description: "Cónegos buscam extremos velozes e dribladores.",
    contact: {
      email: "formacao@moreirensefc.pt",
      phone: "+351 253 512 851",
      social: "@MoreirenseFC"
    }
  },
  {
    id: "94",
    name: "Famalicão",
    country: "Portugal",
    continent: "Europa",
    league: "Primeira Liga",
    logo: "🔵⚪",
    founded: 1931,
    players: 24,
    monthlyOffer: 6000,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Meia criativo",
    category: "Primeira Liga",
    description: "Famalicenses valorizam meias organizadores com visão.",
    contact: {
      email: "formacao@fcfamalicao.pt",
      phone: "+351 252 320 770",
      social: "@FCF1931"
    }
  },

  // Bélgica - Pro League
  {
    id: "95",
    name: "Standard Liège",
    country: "Bélgica",
    continent: "Europa",
    league: "Pro League",
    logo: "🔴⚪",
    founded: 1898,
    players: 26,
    monthlyOffer: 7100,
    currency: "€",
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
    id: "96",
    name: "KAA Gent",
    country: "Bélgica",
    continent: "Europa",
    league: "Pro League",
    logo: "🔵⚪",
    founded: 1900,
    players: 25,
    monthlyOffer: 7500,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Atacante móvel",
    category: "Pro League",
    description: "Buffalos buscam atacantes dinâmicos e versáteis.",
    contact: {
      email: "jeugd@kaagent.be",
      phone: "+32 9 240 20 50",
      social: "@KAAGent"
    }
  },
  {
    id: "97",
    name: "RSC Anderlecht",
    country: "Bélgica",
    continent: "Europa",
    league: "Pro League",
    logo: "🟣⚪",
    founded: 1908,
    players: 27,
    monthlyOffer: 8500,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Meia-atacante",
    category: "Pro League",
    description: "Clube mais titulado da Bélgica valoriza meias criativos.",
    contact: {
      email: "jeugd@rsca.be",
      phone: "+32 2 529 40 74",
      social: "@rscanderlecht"
    }
  },
  {
    id: "98",
    name: "Club Brugge",
    country: "Bélgica",
    continent: "Europa",
    league: "Pro League",
    logo: "🔵⚫",
    founded: 1891,
    players: 28,
    monthlyOffer: 9000,
    currency: "€",
    openPositions: 2,
    preferredStyle: "Ponta veloz",
    category: "Pro League",
    description: "Blauw-Zwart busca extremos rápidos e eficientes.",
    contact: {
      email: "jeugd@clubbrugge.be",
      phone: "+32 50 40 21 40",
      social: "@ClubBrugge"
    }
  },
  {
    id: "99",
    name: "KRC Genk",
    country: "Bélgica",
    continent: "Europa",
    league: "Pro League",
    logo: "🔵⚪",
    founded: 1988,
    players: 26,
    monthlyOffer: 7800,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Lateral ofensivo",
    category: "Pro League",
    description: "Smurfen conhecidos por revelar laterais ofensivos.",
    contact: {
      email: "jeugd@krcgenk.be",
      phone: "+32 89 38 05 00",
      social: "@KRCGenkOfficial"
    }
  },
  {
    id: "100",
    name: "Royal Antwerp",
    country: "Bélgica",
    continent: "Europa",
    league: "Pro League",
    logo: "🔴⚪",
    founded: 1880,
    players: 25,
    monthlyOffer: 7200,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Zagueiro moderno",
    category: "Pro League",
    description: "Clube mais antigo da Bélgica busca zagueiros técnicos.",
    contact: {
      email: "jeugd@rafc.be",
      phone: "+32 3 221 41 14",
      social: "@official_rafc"
    }
  },

  // Áustria - Bundesliga
  {
    id: "101",
    name: "Austria Wien",
    country: "Áustria",
    continent: "Europa",
    league: "Bundesliga",
    logo: "🟣⚪",
    founded: 1911,
    players: 25,
    monthlyOffer: 6200,
    currency: "€",
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
    id: "102",
    name: "Sturm Graz",
    country: "Áustria",
    continent: "Europa",
    league: "Bundesliga",
    logo: "⚫⚪",
    founded: 1909,
    players: 24,
    monthlyOffer: 6500,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Volante defensivo",
    category: "Bundesliga",
    description: "Schwoazn buscam volantes guerreiros e táticos.",
    contact: {
      email: "akademie@sksturm.at",
      phone: "+43 316 40 40 40",
      social: "@SKSturm"
    }
  },
  {
    id: "103",
    name: "Rapid Wien",
    country: "Áustria",
    continent: "Europa",
    league: "Bundesliga",
    logo: "🟢⚪",
    founded: 1899,
    players: 26,
    monthlyOffer: 6800,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Atacante completo",
    category: "Bundesliga",
    description: "Grün-Weißen valorizam atacantes versáteis e trabalhadores.",
    contact: {
      email: "akademie@skrapid.at",
      phone: "+43 1 727 08 0",
      social: "@skrapid"
    }
  },
  {
    id: "104",
    name: "LASK Linz",
    country: "Áustria",
    continent: "Europa",
    league: "Bundesliga",
    logo: "⚫⚪",
    founded: 1908,
    players: 25,
    monthlyOffer: 6600,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Lateral moderno",
    category: "Bundesliga",
    description: "Athletiker buscam laterais completos e intensos.",
    contact: {
      email: "akademie@lask.at",
      phone: "+43 732 65 08 08",
      social: "@LASK_Official"
    }
  },
  {
    id: "105",
    name: "Wolfsberger AC",
    country: "Áustria",
    continent: "Europa",
    league: "Bundesliga",
    logo: "⚫🟠",
    founded: 1931,
    players: 23,
    monthlyOffer: 5800,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Ponta rápido",
    category: "Bundesliga",
    description: "Wölfe procuram extremos velozes para contra-ataques.",
    contact: {
      email: "akademie@wolfsberger-ac.at",
      phone: "+43 4352 34 0 34",
      social: "@WolfsbergerAC"
    }
  },

  // República Tcheca - Fortuna Liga
  {
    id: "106",
    name: "Slavia Praha",
    country: "República Tcheca",
    continent: "Europa",
    league: "Fortuna Liga",
    logo: "🔴⚪",
    founded: 1892,
    players: 27,
    monthlyOffer: 145000,
    currency: "Kč",
    openPositions: 3,
    preferredStyle: "Atacante completo",
    category: "Fortuna Liga",
    description: "Clube tcheco de prestígio procura atacantes versáteis e inteligentes.",
    contact: {
      email: "akademie@slavia.cz",
      phone: "+420 233 081 729",
      social: "@slaviaofficial"
    }
  },
  {
    id: "107",
    name: "Sparta Praha",
    country: "República Tcheca",
    continent: "Europa",
    league: "Fortuna Liga",
    logo: "🔴🔵",
    founded: 1893,
    players: 28,
    monthlyOffer: 150000,
    currency: "Kč",
    openPositions: 3,
    preferredStyle: "Meia-atacante",
    category: "Fortuna Liga",
    description: "Letenští buscam meias ofensivos criativos.",
    contact: {
      email: "akademie@sparta.cz",
      phone: "+420 296 111 400",
      social: "@ACSparta_CZ"
    }
  },
  {
    id: "108",
    name: "Viktoria Plzeň",
    country: "República Tcheca",
    continent: "Europa",
    league: "Fortuna Liga",
    logo: "🔴🔵",
    founded: 1911,
    players: 26,
    monthlyOffer: 135000,
    currency: "Kč",
    openPositions: 4,
    preferredStyle: "Volante técnico",
    category: "Fortuna Liga",
    description: "Viktorka valoriza volantes com qualidade no passe.",
    contact: {
      email: "akademie@fcviktoria.cz",
      phone: "+420 377 321 493",
      social: "@fcviktorkaplzen"
    }
  },
  {
    id: "109",
    name: "Baník Ostrava",
    country: "República Tcheca",
    continent: "Europa",
    league: "Fortuna Liga",
    logo: "🔵⚪",
    founded: 1922,
    players: 25,
    monthlyOffer: 120000,
    currency: "Kč",
    openPositions: 4,
    preferredStyle: "Zagueiro central",
    category: "Fortuna Liga",
    description: "Baníci procuram zagueiros fortes e líderes.",
    contact: {
      email: "akademie@fcb.cz",
      phone: "+420 595 176 376",
      social: "@FCBanikOstrava"
    }
  },
  {
    id: "110",
    name: "Sigma Olomouc",
    country: "República Tcheca",
    continent: "Europa",
    league: "Fortuna Liga",
    logo: "🔵⚪",
    founded: 1919,
    players: 24,
    monthlyOffer: 110000,
    currency: "Kč",
    openPositions: 5,
    preferredStyle: "Lateral ofensivo",
    category: "Fortuna Liga",
    description: "Hanáci buscam laterais que apoiem o ataque.",
    contact: {
      email: "akademie@skol.cz",
      phone: "+420 585 205 305",
      social: "@SKSigmaOlomouc"
    }
  },

  // Suíça - Super League
  {
    id: "111",
    name: "FC Basel",
    country: "Suíça",
    continent: "Europa",
    league: "Super League",
    logo: "🔴🔵",
    founded: 1893,
    players: 27,
    monthlyOffer: 9500,
    currency: "CHF",
    openPositions: 3,
    preferredStyle: "Meia criativo",
    category: "Super League",
    description: "Clube suíço tradicional valoriza meias organizadores.",
    contact: {
      email: "nachwuchs@fcb.ch",
      phone: "+41 61 375 10 10",
      social: "@FCBasel1893"
    }
  },
  {
    id: "112",
    name: "FC Zürich",
    country: "Suíça",
    continent: "Europa",
    league: "Super League",
    logo: "🔵⚪",
    founded: 1896,
    players: 26,
    monthlyOffer: 9200,
    currency: "CHF",
    openPositions: 3,
    preferredStyle: "Atacante finalizador",
    category: "Super League",
    description: "FCZ busca atacantes eficientes na finalização.",
    contact: {
      email: "nachwuchs@fcz.ch",
      phone: "+41 44 209 44 44",
      social: "@FC_Zuerich"
    }
  },
  {
    id: "113",
    name: "Young Boys",
    country: "Suíça",
    continent: "Europa",
    league: "Super League",
    logo: "🟡⚫",
    founded: 1898,
    players: 28,
    monthlyOffer: 10000,
    currency: "CHF",
    openPositions: 2,
    preferredStyle: "Volante box-to-box",
    category: "Super League",
    description: "Campeão suíço valoriza meias completos e dinâmicos.",
    contact: {
      email: "nachwuchs@bsc-yb.ch",
      phone: "+41 31 998 66 66",
      social: "@BSC_YB"
    }
  },
  {
    id: "114",
    name: "Servette FC",
    country: "Suíça",
    continent: "Europa",
    league: "Super League",
    logo: "🔴⚪",
    founded: 1890,
    players: 25,
    monthlyOffer: 8500,
    currency: "CHF",
    openPositions: 4,
    preferredStyle: "Lateral moderno",
    category: "Super League",
    description: "Grenats de Genebra buscam laterais completos.",
    contact: {
      email: "formation@servettefc.ch",
      phone: "+41 22 308 18 96",
      social: "@ServetteFC"
    }
  },
  {
    id: "115",
    name: "FC Lugano",
    country: "Suíça",
    continent: "Europa",
    league: "Super League",
    logo: "⚫⚪",
    founded: 1908,
    players: 24,
    monthlyOffer: 8000,
    currency: "CHF",
    openPositions: 4,
    preferredStyle: "Ponta técnico",
    category: "Super League",
    description: "Bianconeri do Ticino valorizam extremos habilidosos.",
    contact: {
      email: "settoregiovanile@fclugano.com",
      phone: "+41 91 960 44 44",
      social: "@FCLugano1908"
    }
  },
  {
    id: "116",
    name: "FC St. Gallen",
    country: "Suíça",
    continent: "Europa",
    league: "Super League",
    logo: "🟢⚪",
    founded: 1879,
    players: 25,
    monthlyOffer: 8200,
    currency: "CHF",
    openPositions: 4,
    preferredStyle: "Zagueiro aéreo",
    category: "Super League",
    description: "Espenclub busca defensores fortes no jogo aéreo.",
    contact: {
      email: "nachwuchs@fcsg.ch",
      phone: "+41 71 274 77 44",
      social: "@FCSG_1879"
    }
  },

  // Polônia - Ekstraklasa
  {
    id: "117",
    name: "Legia Warszawa",
    country: "Polônia",
    continent: "Europa",
    league: "Ekstraklasa",
    logo: "🟢⚪",
    founded: 1916,
    players: 27,
    monthlyOffer: 28000,
    currency: "zł",
    openPositions: 3,
    preferredStyle: "Volante destruidor",
    category: "Ekstraklasa",
    description: "Wojskowi buscam volantes guerreiros e táticos.",
    contact: {
      email: "akademia@legia.com",
      phone: "+48 22 517 25 61",
      social: "@LegiaWarszawa"
    }
  },
  {
    id: "118",
    name: "Lech Poznań",
    country: "Polônia",
    continent: "Europa",
    league: "Ekstraklasa",
    logo: "🔵⚪",
    founded: 1922,
    players: 26,
    monthlyOffer: 26000,
    currency: "zł",
    openPositions: 3,
    preferredStyle: "Atacante completo",
    category: "Ekstraklasa",
    description: "Kolejorz valoriza atacantes versáteis e trabalhadores.",
    contact: {
      email: "akademia@lechpoznan.pl",
      phone: "+48 61 850 98 61",
      social: "@LechPoznan"
    }
  },
  {
    id: "119",
    name: "Raków Częstochowa",
    country: "Polônia",
    continent: "Europa",
    league: "Ekstraklasa",
    logo: "🔴🔵",
    founded: 1921,
    players: 25,
    monthlyOffer: 24000,
    currency: "zł",
    openPositions: 4,
    preferredStyle: "Meia-atacante",
    category: "Ekstraklasa",
    description: "Medaliki em ascensão buscam meias ofensivos.",
    contact: {
      email: "akademia@rakow.com",
      phone: "+48 34 366 02 23",
      social: "@Rakow1921"
    }
  },
  {
    id: "120",
    name: "Pogoń Szczecin",
    country: "Polônia",
    continent: "Europa",
    league: "Ekstraklasa",
    logo: "🔴🔵",
    founded: 1948,
    players: 24,
    monthlyOffer: 22000,
    currency: "zł",
    openPositions: 4,
    preferredStyle: "Lateral ofensivo",
    category: "Ekstraklasa",
    description: "Portowcy valorizam laterais que apoiem o ataque.",
    contact: {
      email: "akademia@pogonszczecin.pl",
      phone: "+48 91 464 83 83",
      social: "@PogonSzczecin"
    }
  },
  {
    id: "121",
    name: "Wisła Kraków",
    country: "Polônia",
    continent: "Europa",
    league: "Ekstraklasa",
    logo: "⚪🔴",
    founded: 1906,
    players: 25,
    monthlyOffer: 23000,
    currency: "zł",
    openPositions: 4,
    preferredStyle: "Ponta veloz",
    category: "Ekstraklasa",
    description: "Biała Gwiazda busca extremos rápidos.",
    contact: {
      email: "akademia@wisla.krakow.pl",
      phone: "+48 12 290 00 07",
      social: "@WislaKrakowSA"
    }
  },

  // Romênia - Liga I
  {
    id: "122",
    name: "CFR Cluj",
    country: "Romênia",
    continent: "Europa",
    league: "Liga I",
    logo: "🔴⚪",
    founded: 1907,
    players: 26,
    monthlyOffer: 28000,
    currency: "lei",
    openPositions: 3,
    preferredStyle: "Zagueiro central",
    category: "Liga I",
    description: "Feroviarii buscam zagueiros líderes e seguros.",
    contact: {
      email: "academie@cfr1907.ro",
      phone: "+40 264 420 763",
      social: "@cfr1907"
    }
  },
  {
    id: "123",
    name: "FCSB",
    country: "Romênia",
    continent: "Europa",
    league: "Liga I",
    logo: "🔴🔵",
    founded: 1947,
    players: 27,
    monthlyOffer: 30000,
    currency: "lei",
    openPositions: 3,
    preferredStyle: "Meia criativo",
    category: "Liga I",
    description: "Roș-albaștrii valorizam meias organizadores.",
    contact: {
      email: "academie@fcsb.ro",
      phone: "+40 21 324 00 08",
      social: "@FCSB"
    }
  },
  {
    id: "124",
    name: "Universitatea Craiova",
    country: "Romênia",
    continent: "Europa",
    league: "Liga I",
    logo: "🔵⚪",
    founded: 1948,
    players: 25,
    monthlyOffer: 26000,
    currency: "lei",
    openPositions: 4,
    preferredStyle: "Atacante finalizador",
    category: "Liga I",
    description: "Știința busca atacantes eficientes no gol.",
    contact: {
      email: "academie@ucv1948.ro",
      phone: "+40 251 419 696",
      social: "@UCVOficial"
    }
  },
  {
    id: "125",
    name: "Rapid București",
    country: "Romênia",
    continent: "Europa",
    league: "Liga I",
    logo: "🔴⚪",
    founded: 1923,
    players: 26,
    monthlyOffer: 27000,
    currency: "lei",
    openPositions: 3,
    preferredStyle: "Volante box-to-box",
    category: "Liga I",
    description: "Giuleștenii valorizam meias completos.",
    contact: {
      email: "academie@fcrapid.ro",
      phone: "+40 21 224 00 04",
      social: "@RapidBucuresti"
    }
  },
  {
    id: "126",
    name: "Sepsi OSK",
    country: "Romênia",
    continent: "Europa",
    league: "Liga I",
    logo: "🔴⚪",
    founded: 2011,
    players: 24,
    monthlyOffer: 22000,
    currency: "lei",
    openPositions: 4,
    preferredStyle: "Lateral moderno",
    category: "Liga I",
    description: "Clube da Transilvânia busca laterais completos.",
    contact: {
      email: "academie@sepsiosk.ro",
      phone: "+40 267 354 354",
      social: "@SepsiOSK"
    }
  },

  // Croácia - HNL
  {
    id: "127",
    name: "Dinamo Zagreb",
    country: "Croácia",
    continent: "Europa",
    league: "HNL",
    logo: "🔵⚪",
    founded: 1945,
    players: 27,
    monthlyOffer: 7500,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Meia-atacante",
    category: "HNL",
    description: "Plavi famosos por revelar talentos ofensivos.",
    contact: {
      email: "akademija@gnkdinamo.hr",
      phone: "+385 1 238 61 11",
      social: "@gnkdinamo"
    }
  },
  {
    id: "128",
    name: "Hajduk Split",
    country: "Croácia",
    continent: "Europa",
    league: "HNL",
    logo: "⚪🔵",
    founded: 1911,
    players: 26,
    monthlyOffer: 7000,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Volante técnico",
    category: "HNL",
    description: "Bili valorizam volantes com qualidade no passe.",
    contact: {
      email: "akademija@hajduk.hr",
      phone: "+385 21 398 555",
      social: "@HNK_Hajduk"
    }
  },
  {
    id: "129",
    name: "Rijeka",
    country: "Croácia",
    continent: "Europa",
    league: "HNL",
    logo: "⚪🔵",
    founded: 1946,
    players: 25,
    monthlyOffer: 6500,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Lateral ofensivo",
    category: "HNL",
    description: "Armada busca laterais modernos e ofensivos.",
    contact: {
      email: "akademija@nk-rijeka.hr",
      phone: "+385 51 334 025",
      social: "@nkrijeka"
    }
  },
  {
    id: "130",
    name: "Osijek",
    country: "Croácia",
    continent: "Europa",
    league: "HNL",
    logo: "🔵⚪",
    founded: 1947,
    players: 24,
    monthlyOffer: 6000,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Atacante completo",
    category: "HNL",
    description: "Bijelo-plavi procuram atacantes versáteis.",
    contact: {
      email: "akademija@nk-osijek.hr",
      phone: "+385 31 214 451",
      social: "@NK_Osijek"
    }
  },

  // Sérvia - SuperLiga
  {
    id: "131",
    name: "Red Star Belgrade",
    country: "Sérvia",
    continent: "Europa",
    league: "SuperLiga",
    logo: "🔴⚪",
    founded: 1945,
    players: 28,
    monthlyOffer: 7800,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Ponta técnico",
    category: "SuperLiga",
    description: "Crveno-beli com tradição europeia buscam extremos habilidosos.",
    contact: {
      email: "omladinska@crvenazvezdafk.com",
      phone: "+381 11 322 14 33",
      social: "@crvenazvezdafk"
    }
  },
  {
    id: "132",
    name: "Partizan Belgrade",
    country: "Sérvia",
    continent: "Europa",
    league: "SuperLiga",
    logo: "⚫⚪",
    founded: 1945,
    players: 27,
    monthlyOffer: 7500,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Zagueiro líder",
    category: "SuperLiga",
    description: "Crno-beli valorizam defensores com liderança.",
    contact: {
      email: "omladinska@partizan.rs",
      phone: "+381 11 366 97 41",
      social: "@PartizanBC"
    }
  },
  {
    id: "133",
    name: "TSC Bačka Topola",
    country: "Sérvia",
    continent: "Europa",
    league: "SuperLiga",
    logo: "🔴⚪",
    founded: 1913,
    players: 24,
    monthlyOffer: 6200,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Volante box-to-box",
    category: "SuperLiga",
    description: "Clube em ascensão busca meias dinâmicos.",
    contact: {
      email: "omladinska@tsctopolja.com",
      phone: "+381 24 715 555",
      social: "@tsctopolja"
    }
  },
  {
    id: "134",
    name: "Vojvodina",
    country: "Sérvia",
    continent: "Europa",
    league: "SuperLiga",
    logo: "🔴⚪",
    founded: 1914,
    players: 25,
    monthlyOffer: 6500,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Meia criativo",
    category: "SuperLiga",
    description: "Stari Dama de Novi Sad valoriza meias organizadores.",
    contact: {
      email: "omladinska@fkvojvodina.com",
      phone: "+381 21 6613 202",
      social: "@FKVojvodina"
    }
  },

  // Ucrânia - Premier League
  {
    id: "135",
    name: "Shakhtar Donetsk",
    country: "Ucrânia",
    continent: "Europa",
    league: "Premier League",
    logo: "🟠⚫",
    founded: 1936,
    players: 28,
    monthlyOffer: 9500,
    currency: "€",
    openPositions: 2,
    preferredStyle: "Meia-atacante brasileiro",
    category: "Premier League",
    description: "Mineradores famosos por revelar talentos brasileiros.",
    contact: {
      email: "academy@shakhtar.com",
      phone: "+380 62 304 34 43",
      social: "@FCShakhtar"
    }
  },
  {
    id: "136",
    name: "Dynamo Kyiv",
    country: "Ucrânia",
    continent: "Europa",
    league: "Premier League",
    logo: "🔵⚪",
    founded: 1927,
    players: 27,
    monthlyOffer: 9000,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Volante técnico",
    category: "Premier League",
    description: "Clube mais titulado da Ucrânia valoriza volantes técnicos.",
    contact: {
      email: "academy@fcdynamo.kiev.ua",
      phone: "+380 44 521 01 11",
      social: "@DynamoKyiv"
    }
  },
  {
    id: "137",
    name: "Zorya Luhansk",
    country: "Ucrânia",
    continent: "Europa",
    league: "Premier League",
    logo: "⚫⚪",
    founded: 1923,
    players: 24,
    monthlyOffer: 7000,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Lateral moderno",
    category: "Premier League",
    description: "Clube do leste ucraniano busca laterais completos.",
    contact: {
      email: "academy@fczirka.com.ua",
      phone: "+380 64 252 22 22",
      social: "@fczoryaUA"
    }
  },
  {
    id: "138",
    name: "Dnipro-1",
    country: "Ucrânia",
    continent: "Europa",
    league: "Premier League",
    logo: "🔵⚪",
    founded: 2017,
    players: 23,
    monthlyOffer: 7200,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Atacante veloz",
    category: "Premier League",
    description: "Clube moderno que valoriza atacantes rápidos.",
    contact: {
      email: "academy@fcdnipro.ua",
      phone: "+380 56 377 17 17",
      social: "@fcdnipro1"
    }
  },

  // Bulgária - First League
  {
    id: "139",
    name: "Ludogorets Razgrad",
    country: "Bulgária",
    continent: "Europa",
    league: "First League",
    logo: "🟢⚪",
    founded: 1945,
    players: 26,
    monthlyOffer: 11000,
    currency: "lv",
    openPositions: 3,
    preferredStyle: "Volante destruidor",
    category: "First League",
    description: "Campeão búlgaro dominante busca volantes táticos.",
    contact: {
      email: "academy@ludogorets.com",
      phone: "+359 84 662 155",
      social: "@Ludogorets1945"
    }
  },
  {
    id: "140",
    name: "CSKA Sofia",
    country: "Bulgária",
    continent: "Europa",
    league: "First League",
    logo: "🔴⚪",
    founded: 1948,
    players: 25,
    monthlyOffer: 10000,
    currency: "lv",
    openPositions: 3,
    preferredStyle: "Meia central",
    category: "First League",
    description: "Clube militar tradicional valoriza meias organizadores.",
    contact: {
      email: "academy@cska.bg",
      phone: "+359 2 963 38 38",
      social: "@CSKA1948"
    }
  },
  {
    id: "141",
    name: "Levski Sofia",
    country: "Bulgária",
    continent: "Europa",
    league: "First League",
    logo: "🔵⚪",
    founded: 1914,
    players: 26,
    monthlyOffer: 10500,
    currency: "lv",
    openPositions: 3,
    preferredStyle: "Atacante completo",
    category: "First League",
    description: "Sinyata busca atacantes versáteis e trabalhadores.",
    contact: {
      email: "academy@levski.bg",
      phone: "+359 2 931 19 14",
      social: "@LevskiSofia"
    }
  },
  {
    id: "142",
    name: "Botev Plovdiv",
    country: "Bulgária",
    continent: "Europa",
    league: "First League",
    logo: "🟡⚫",
    founded: 1912,
    players: 24,
    monthlyOffer: 8500,
    currency: "lv",
    openPositions: 4,
    preferredStyle: "Lateral ofensivo",
    category: "First League",
    description: "Canários buscam laterais que apoiem o ataque.",
    contact: {
      email: "academy@botevplovdiv.bg",
      phone: "+359 32 62 62 00",
      social: "@BotevPlovdiv"
    }
  },

  // Eslováquia - Fortuna Liga
  {
    id: "143",
    name: "Slovan Bratislava",
    country: "Eslováquia",
    continent: "Europa",
    league: "Fortuna Liga",
    logo: "🔵⚪",
    founded: 1919,
    players: 26,
    monthlyOffer: 6800,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Meia-atacante",
    category: "Fortuna Liga",
    description: "Belasí dominantes na Eslováquia buscam meias ofensivos.",
    contact: {
      email: "academy@skslovan.com",
      phone: "+421 2 4445 5777",
      social: "@SKSlovan"
    }
  },
  {
    id: "144",
    name: "Spartak Trnava",
    country: "Eslováquia",
    continent: "Europa",
    league: "Fortuna Liga",
    logo: "⚫⚪",
    founded: 1923,
    players: 24,
    monthlyOffer: 6000,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Volante técnico",
    category: "Fortuna Liga",
    description: "Androids valorizam volantes com qualidade no passe.",
    contact: {
      email: "academy@fcspartaktrnava.com",
      phone: "+421 33 551 14 51",
      social: "@SpartakTrnava"
    }
  },
  {
    id: "145",
    name: "Žilina",
    country: "Eslováquia",
    continent: "Europa",
    league: "Fortuna Liga",
    logo: "🟡🟢",
    founded: 1908,
    players: 23,
    monthlyOffer: 5500,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Ponta rápido",
    category: "Fortuna Liga",
    description: "Šošoni do norte eslovaco buscam extremos velozes.",
    contact: {
      email: "academy@mskzilina.sk",
      phone: "+421 41 562 41 11",
      social: "@MSKZilina"
    }
  },

  // Hungria - NB I
  {
    id: "146",
    name: "Ferencváros",
    country: "Hungria",
    continent: "Europa",
    league: "NB I",
    logo: "🟢⚪",
    founded: 1899,
    players: 27,
    monthlyOffer: 2100000,
    currency: "Ft",
    openPositions: 3,
    preferredStyle: "Atacante completo",
    category: "NB I",
    description: "Fradi, clube mais titulado da Hungria, busca atacantes versáteis.",
    contact: {
      email: "akademia@fradi.hu",
      phone: "+36 1 215 67 25",
      social: "@Fradi_HU"
    }
  },
  {
    id: "147",
    name: "Puskás Akadémia",
    country: "Hungria",
    continent: "Europa",
    league: "NB I",
    logo: "🟡⚫",
    founded: 2005,
    players: 25,
    monthlyOffer: 1800000,
    currency: "Ft",
    openPositions: 4,
    preferredStyle: "Meia criativo",
    category: "NB I",
    description: "Academia focada em desenvolvimento de jovens talentos.",
    contact: {
      email: "akademia@pfla.hu",
      phone: "+36 53 500 925",
      social: "@puskasacademy"
    }
  },
  {
    id: "148",
    name: "MOL Fehérvár",
    country: "Hungria",
    continent: "Europa",
    league: "NB I",
    logo: "🔴🔵",
    founded: 1941,
    players: 26,
    monthlyOffer: 1900000,
    currency: "Ft",
    openPositions: 3,
    preferredStyle: "Lateral moderno",
    category: "NB I",
    description: "Vidi valoriza laterais completos e modernos.",
    contact: {
      email: "akademia@videoton.hu",
      phone: "+36 22 514 070",
      social: "@VideotonFC"
    }
  },
  {
    id: "149",
    name: "Debrecen",
    country: "Hungria",
    continent: "Europa",
    league: "NB I",
    logo: "🔴⚪",
    founded: 1902,
    players: 24,
    monthlyOffer: 1700000,
    currency: "Ft",
    openPositions: 4,
    preferredStyle: "Volante box-to-box",
    category: "NB I",
    description: "Loki do leste húngaro busca meias completos.",
    contact: {
      email: "akademia@dvsc.hu",
      phone: "+36 52 511 828",
      social: "@DVSC_Official"
    }
  },

  // Chipre - First Division
  {
    id: "150",
    name: "APOEL Nicosia",
    country: "Chipre",
    continent: "Europa",
    league: "First Division",
    logo: "🔵🟡",
    founded: 1926,
    players: 26,
    monthlyOffer: 6500,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Meia central",
    category: "First Division",
    description: "Clube mais titulado do Chipre valoriza meias organizadores.",
    contact: {
      email: "academy@apoel.com.cy",
      phone: "+357 22 455 000",
      social: "@apoelfc"
    }
  },
  {
    id: "151",
    name: "Omonia Nicosia",
    country: "Chipre",
    continent: "Europa",
    league: "First Division",
    logo: "🟢⚪",
    founded: 1948,
    players: 25,
    monthlyOffer: 6200,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Atacante finalizador",
    category: "First Division",
    description: "Πράσινοι buscam atacantes eficientes no gol.",
    contact: {
      email: "academy@omonia.com.cy",
      phone: "+357 22 352 500",
      social: "@omonoia1948"
    }
  },
  {
    id: "152",
    name: "AEK Larnaca",
    country: "Chipre",
    continent: "Europa",
    league: "First Division",
    logo: "🟡🔵",
    founded: 1994,
    players: 24,
    monthlyOffer: 5800,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Lateral ofensivo",
    category: "First Division",
    description: "Clube da costa cipriota valoriza laterais ofensivos.",
    contact: {
      email: "academy@aeklarnaca.com.cy",
      phone: "+357 24 653 900",
      social: "@AEKLarnacaFC"
    }
  },
  {
    id: "153",
    name: "Apollon Limassol",
    country: "Chipre",
    continent: "Europa",
    league: "First Division",
    logo: "🔵⚪",
    founded: 1954,
    players: 24,
    monthlyOffer: 5900,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Ponta técnico",
    category: "First Division",
    description: "Γαλάζιοι de Limassol buscam extremos habilidosos.",
    contact: {
      email: "academy@apollonfc.com.cy",
      phone: "+357 25 820 400",
      social: "@ApollonLem"
    }
  },

  // Mais times da Espanha
  {
    id: "154",
    name: "Girona FC",
    country: "Espanha",
    continent: "Europa",
    league: "La Liga",
    logo: "🔴⚪",
    founded: 1930,
    players: 25,
    monthlyOffer: 7000,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Lateral completo",
    category: "La Liga",
    description: "Clube catalão em ascensão valoriza laterais versáteis.",
    contact: {
      email: "cantera@gironafc.cat",
      phone: "+34 972 40 36 25",
      social: "@GironaFC"
    }
  },
  {
    id: "155",
    name: "Real Valladolid",
    country: "Espanha",
    continent: "Europa",
    league: "La Liga",
    logo: "🟣⚪",
    founded: 1928,
    players: 26,
    monthlyOffer: 6800,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Volante equilibrado",
    category: "La Liga",
    description: "Pucelanos buscam volantes equilibrados taticamente.",
    contact: {
      email: "cantera@realvalladolid.es",
      phone: "+34 983 36 01 42",
      social: "@RealValladolid"
    }
  },
  {
    id: "156",
    name: "Mallorca",
    country: "Espanha",
    continent: "Europa",
    league: "La Liga",
    logo: "🔴⚫",
    founded: 1916,
    players: 25,
    monthlyOffer: 6600,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Zagueiro físico",
    category: "La Liga",
    description: "Bermellones das ilhas buscam defensores fortes.",
    contact: {
      email: "cantera@rcdmallorca.es",
      phone: "+34 971 22 15 21",
      social: "@RCD_Mallorca"
    }
  },
  {
    id: "157",
    name: "Almería",
    country: "Espanha",
    continent: "Europa",
    league: "Segunda División",
    logo: "🔴⚪",
    founded: 1989,
    players: 24,
    monthlyOffer: 6000,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Atacante rápido",
    category: "Segunda División",
    description: "Rojiblancos do sul da Espanha valorizam atacantes velozes.",
    contact: {
      email: "cantera@udalmeria.es",
      phone: "+34 950 17 56 00",
      social: "@U_D_Almeria"
    }
  },
  {
    id: "158",
    name: "Sporting Gijón",
    country: "Espanha",
    continent: "Europa",
    league: "Segunda División",
    logo: "🔴⚪",
    founded: 1905,
    players: 25,
    monthlyOffer: 6400,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Meia trabalhador",
    category: "Segunda División",
    description: "Rojiblancos asturianos buscam meias guerreiros.",
    contact: {
      email: "cantera@realsporting.com",
      phone: "+34 985 38 18 38",
      social: "@RealSporting"
    }
  },
  {
    id: "159",
    name: "Racing Santander",
    country: "Espanha",
    continent: "Europa",
    league: "Segunda División",
    logo: "🟢⚪",
    founded: 1913,
    players: 24,
    monthlyOffer: 5900,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Ponta criativo",
    category: "Segunda División",
    description: "Verdiblancos cantábricos valorizam extremos criativos.",
    contact: {
      email: "cantera@realracingclub.es",
      phone: "+34 942 22 46 16",
      social: "@RealRacingClub"
    }
  },
  {
    id: "160",
    name: "Eibar",
    country: "Espanha",
    continent: "Europa",
    league: "Segunda División",
    logo: "🔴🔵",
    founded: 1940,
    players: 23,
    monthlyOffer: 6100,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Lateral guerreiro",
    category: "Segunda División",
    description: "Armeros bascos buscam laterais intensos.",
    contact: {
      email: "cantera@sdeibar.com",
      phone: "+34 943 03 26 26",
      social: "@SDEibar"
    }
  },
  {
    id: "161",
    name: "Elche CF",
    country: "Espanha",
    continent: "Europa",
    league: "Segunda División",
    logo: "🟢⚪",
    founded: 1923,
    players: 24,
    monthlyOffer: 6200,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Volante posicional",
    category: "Segunda División",
    description: "Franjiverdes valencianos valorizam volantes táticos.",
    contact: {
      email: "cantera@elchecf.es",
      phone: "+34 966 63 07 73",
      social: "@elchecf"
    }
  },
  {
    id: "162",
    name: "Tenerife",
    country: "Espanha",
    continent: "Europa",
    league: "Segunda División",
    logo: "🔵⚪",
    founded: 1922,
    players: 23,
    monthlyOffer: 5800,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Atacante área",
    category: "Segunda División",
    description: "Blanquiazules das Canárias buscam atacantes de área.",
    contact: {
      email: "cantera@cdtenerife.es",
      phone: "+34 922 63 38 38",
      social: "@CDTOficial"
    }
  },

  // Mais times da Inglaterra
  {
    id: "163",
    name: "Southampton",
    country: "Inglaterra",
    continent: "Europa",
    league: "Championship",
    logo: "🔴⚪",
    founded: 1885,
    players: 27,
    monthlyOffer: 9200,
    currency: "£",
    openPositions: 3,
    preferredStyle: "Meia técnico",
    category: "Championship",
    description: "Saints famosos pela academia valorizam meias técnicos.",
    contact: {
      email: "academy@saintsfc.co.uk",
      phone: "+44 23 8072 7727",
      social: "@SouthamptonFC"
    }
  },
  {
    id: "164",
    name: "Norwich City",
    country: "Inglaterra",
    continent: "Europa",
    league: "Championship",
    logo: "🟡🟢",
    founded: 1902,
    players: 26,
    monthlyOffer: 8600,
    currency: "£",
    openPositions: 4,
    preferredStyle: "Ponta habilidoso",
    category: "Championship",
    description: "Canaries buscam extremos habilidosos e criativos.",
    contact: {
      email: "academy@canaries.co.uk",
      phone: "+44 1603 760760",
      social: "@NorwichCityFC"
    }
  },
  {
    id: "165",
    name: "Sunderland",
    country: "Inglaterra",
    continent: "Europa",
    league: "Championship",
    logo: "🔴⚪",
    founded: 1879,
    players: 26,
    monthlyOffer: 8400,
    currency: "£",
    openPositions: 4,
    preferredStyle: "Zagueiro aéreo",
    category: "Championship",
    description: "Black Cats valorizam zagueiros dominantes no ar.",
    contact: {
      email: "academy@safc.com",
      phone: "+44 191 551 5000",
      social: "@SunderlandAFC"
    }
  },
  {
    id: "166",
    name: "Swansea City",
    country: "Inglaterra",
    continent: "Europa",
    league: "Championship",
    logo: "⚪⚫",
    founded: 1912,
    players: 25,
    monthlyOffer: 7900,
    currency: "£",
    openPositions: 4,
    preferredStyle: "Meio-campo técnico",
    category: "Championship",
    description: "Swans galeses valorizam futebol técnico e de posse.",
    contact: {
      email: "academy@swanseacity.com",
      phone: "+44 1792 616600",
      social: "@SwansOfficial"
    }
  },
  {
    id: "167",
    name: "Bristol City",
    country: "Inglaterra",
    continent: "Europa",
    league: "Championship",
    logo: "🔴⚪",
    founded: 1894,
    players: 25,
    monthlyOffer: 7700,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Atacante trabalhador",
    category: "Championship",
    description: "Robins buscam atacantes intensos e trabalhadores.",
    contact: {
      email: "academy@bcfc.co.uk",
      phone: "+44 117 963 0600",
      social: "@BristolCity"
    }
  },
  {
    id: "168",
    name: "Preston North End",
    country: "Inglaterra",
    continent: "Europa",
    league: "Championship",
    logo: "⚪🔵",
    founded: 1880,
    players: 24,
    monthlyOffer: 7500,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Volante equilibrado",
    category: "Championship",
    description: "Lilywhites valorizam volantes equilibrados e inteligentes.",
    contact: {
      email: "academy@pnefc.net",
      phone: "+44 344 856 1964",
      social: "@pnefc"
    }
  },
  {
    id: "169",
    name: "Blackburn Rovers",
    country: "Inglaterra",
    continent: "Europa",
    league: "Championship",
    logo: "🔵⚪",
    founded: 1875,
    players: 25,
    monthlyOffer: 8000,
    currency: "£",
    openPositions: 4,
    preferredStyle: "Lateral moderno",
    category: "Championship",
    description: "Rovers tradicionais buscam laterais completos.",
    contact: {
      email: "academy@rovers.co.uk",
      phone: "+44 1254 372001",
      social: "@Rovers"
    }
  },
  {
    id: "170",
    name: "Cardiff City",
    country: "Inglaterra",
    continent: "Europa",
    league: "Championship",
    logo: "🔵⚪",
    founded: 1899,
    players: 25,
    monthlyOffer: 7800,
    currency: "£",
    openPositions: 4,
    preferredStyle: "Zagueiro forte",
    category: "Championship",
    description: "Bluebirds galeses buscam defensores físicos.",
    contact: {
      email: "academy@cardiffcityfc.co.uk",
      phone: "+44 29 2022 1001",
      social: "@CardiffCityFC"
    }
  },
  {
    id: "171",
    name: "Millwall",
    country: "Inglaterra",
    continent: "Europa",
    league: "Championship",
    logo: "🔵⚪",
    founded: 1885,
    players: 24,
    monthlyOffer: 7400,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Atacante físico",
    category: "Championship",
    description: "Lions londrinos valorizam atacantes fortes e guerreiros.",
    contact: {
      email: "academy@millwallfc.co.uk",
      phone: "+44 20 7232 1222",
      social: "@MillwallFC"
    }
  },
  {
    id: "172",
    name: "Queens Park Rangers",
    country: "Inglaterra",
    continent: "Europa",
    league: "Championship",
    logo: "🔵⚪",
    founded: 1882,
    players: 24,
    monthlyOffer: 7600,
    currency: "£",
    openPositions: 4,
    preferredStyle: "Meia criativo",
    category: "Championship",
    description: "Hoops de West London buscam meias criativos.",
    contact: {
      email: "academy@qpr.co.uk",
      phone: "+44 20 8743 0262",
      social: "@QPR"
    }
  },

  // Mais times da França
  {
    id: "173",
    name: "Le Havre AC",
    country: "França",
    continent: "Europa",
    league: "Ligue 1",
    logo: "🔵⚪",
    founded: 1872,
    players: 24,
    monthlyOffer: 6000,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Lateral jovem",
    category: "Ligue 1",
    description: "Clube mais antigo da França, famoso pela formação.",
    contact: {
      email: "formation@hac-foot.com",
      phone: "+33 2 35 26 19 79",
      social: "@HAC_Foot"
    }
  },
  {
    id: "174",
    name: "Clermont Foot",
    country: "França",
    continent: "Europa",
    league: "Ligue 1",
    logo: "🔴🔵",
    founded: 1990,
    players: 23,
    monthlyOffer: 5700,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Volante trabalhador",
    category: "Ligue 1",
    description: "Lanciers de Auvergne buscam volantes intensos.",
    contact: {
      email: "formation@clermont-foot.com",
      phone: "+33 4 73 75 19 19",
      social: "@ClermontFoot"
    }
  },
  {
    id: "175",
    name: "Metz FC",
    country: "França",
    continent: "Europa",
    league: "Ligue 1",
    logo: "🔴🟡",
    founded: 1932,
    players: 24,
    monthlyOffer: 6100,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Zagueiro central",
    category: "Ligue 1",
    description: "Grenats do leste francês valorizam defensores sólidos.",
    contact: {
      email: "formation@fcmetz.com",
      phone: "+33 3 87 74 54 54",
      social: "@FCMetz"
    }
  },
  {
    id: "176",
    name: "Lorient",
    country: "França",
    continent: "Europa",
    league: "Ligue 1",
    logo: "🟠⚫",
    founded: 1926,
    players: 23,
    monthlyOffer: 5900,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Ponta veloz",
    category: "Ligue 1",
    description: "Merlus da Bretanha buscam extremos rápidos.",
    contact: {
      email: "formation@fclweb.fr",
      phone: "+33 2 97 87 18 18",
      social: "@FCLorient"
    }
  },
  {
    id: "177",
    name: "Auxerre",
    country: "França",
    continent: "Europa",
    league: "Ligue 1",
    logo: "⚪🔵",
    founded: 1905,
    players: 24,
    monthlyOffer: 6300,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Meia promissor",
    category: "Ligue 1",
    description: "AJA com tradição em formar jovens talentos.",
    contact: {
      email: "formation@aja.fr",
      phone: "+33 3 86 46 45 45",
      social: "@AJA"
    }
  },
  {
    id: "178",
    name: "Troyes AC",
    country: "França",
    continent: "Europa",
    league: "Ligue 2",
    logo: "🔵⚪",
    founded: 1986,
    players: 23,
    monthlyOffer: 5500,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Atacante jovem",
    category: "Ligue 2",
    description: "ESTAC conhecido por recrutar jovens atacantes.",
    contact: {
      email: "formation@estac.fr",
      phone: "+33 3 25 71 32 00",
      social: "@ESTAC_Officiel"
    }
  },

  // Mais times da Itália
  {
    id: "179",
    name: "Sampdoria",
    country: "Itália",
    continent: "Europa",
    league: "Serie B",
    logo: "🔵⚪",
    founded: 1946,
    players: 26,
    monthlyOffer: 6800,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Meia técnico",
    category: "Serie B",
    description: "Blucerchiati genoveses valorizam meias com qualidade técnica.",
    contact: {
      email: "settoregiovanile@sampdoria.it",
      phone: "+39 010 5313 1",
      social: "@sampdoria"
    }
  },
  {
    id: "180",
    name: "Brescia Calcio",
    country: "Itália",
    continent: "Europa",
    league: "Serie B",
    logo: "🔵⚪",
    founded: 1911,
    players: 25,
    monthlyOffer: 6200,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Volante criativo",
    category: "Serie B",
    description: "Rondinelle da Lombardia buscam volantes com visão.",
    contact: {
      email: "settoregiovanile@bresciacalcio.it",
      phone: "+39 030 224 361",
      social: "@BresciaOfficial"
    }
  },
  {
    id: "181",
    name: "Palermo FC",
    country: "Itália",
    continent: "Europa",
    league: "Serie B",
    logo: "🟣⚫",
    founded: 1900,
    players: 25,
    monthlyOffer: 6400,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Atacante siciliano",
    category: "Serie B",
    description: "Rosanero sicilianos valorizam atacantes técnicos.",
    contact: {
      email: "settoregiovanile@palermofc.it",
      phone: "+39 091 688 2502",
      social: "@Palermofficial"
    }
  },
  {
    id: "182",
    name: "Venezia FC",
    country: "Itália",
    continent: "Europa",
    league: "Serie B",
    logo: "🟠🟢",
    founded: 1907,
    players: 24,
    monthlyOffer: 6100,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Lateral ofensivo",
    category: "Serie B",
    description: "Arancioneroverdi venezianos buscam laterais modernos.",
    contact: {
      email: "settoregiovanile@veneziafc.it",
      phone: "+39 041 238 0711",
      social: "@VeneziaFC"
    }
  },
  {
    id: "183",
    name: "Bari",
    country: "Itália",
    continent: "Europa",
    league: "Serie B",
    logo: "⚪🔴",
    founded: 1908,
    players: 24,
    monthlyOffer: 5900,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Ponta direito",
    category: "Serie B",
    description: "Galletti da Puglia valorizam extremos direitos.",
    contact: {
      email: "settoregiovanile@sscbari.it",
      phone: "+39 080 503 4749",
      social: "@SSCBaricalcio1908"
    }
  },
  {
    id: "184",
    name: "Como 1907",
    country: "Itália",
    continent: "Europa",
    league: "Serie B",
    logo: "🔵⚪",
    founded: 1907,
    players: 23,
    monthlyOffer: 6000,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Meia central",
    category: "Serie B",
    description: "Lariani do lago buscam meias organizadores.",
    contact: {
      email: "settoregiovanile@como1907.com",
      phone: "+39 031 266 271",
      social: "@Como_1907"
    }
  },

  // Mais times da Turquia
  {
    id: "185",
    name: "Antalyaspor",
    country: "Turquia",
    continent: "Europa",
    league: "Süper Lig",
    logo: "🔴⚪",
    founded: 1966,
    players: 24,
    monthlyOffer: 75000,
    currency: "₺",
    openPositions: 4,
    preferredStyle: "Ponta brasileiro",
    category: "Süper Lig",
    description: "Clube da costa turca com tradição em brasileiros.",
    contact: {
      email: "altyapi@antalyaspor.com.tr",
      phone: "+90 242 243 19 66",
      social: "@Antalyaspor"
    }
  },
  {
    id: "186",
    name: "Adana Demirspor",
    country: "Turquia",
    continent: "Europa",
    league: "Süper Lig",
    logo: "🔵🟠",
    founded: 1940,
    players: 24,
    monthlyOffer: 73000,
    currency: "₺",
    openPositions: 4,
    preferredStyle: "Atacante potente",
    category: "Süper Lig",
    description: "Clube do sul da Turquia busca atacantes fortes.",
    contact: {
      email: "altyapi@adanademirspor.org.tr",
      phone: "+90 322 363 00 01",
      social: "@AdanaDemirspor"
    }
  },
  {
    id: "187",
    name: "Hatayspor",
    country: "Turquia",
    continent: "Europa",
    league: "Süper Lig",
    logo: "🔴⚫",
    founded: 1967,
    players: 23,
    monthlyOffer: 70000,
    currency: "₺",
    openPositions: 5,
    preferredStyle: "Volante técnico",
    category: "Süper Lig",
    description: "Clube em crescimento valoriza volantes técnicos.",
    contact: {
      email: "altyapi@hatayspor.org.tr",
      phone: "+90 326 225 19 67",
      social: "@Hatayspor"
    }
  },
  {
    id: "188",
    name: "Gaziantep FK",
    country: "Turquia",
    continent: "Europa",
    league: "Süper Lig",
    logo: "🔴⚫",
    founded: 1969,
    players: 23,
    monthlyOffer: 71000,
    currency: "₺",
    openPositions: 4,
    preferredStyle: "Zagueiro experiente",
    category: "Süper Lig",
    description: "Şahinler buscam defensores com experiência.",
    contact: {
      email: "altyapi@gaziantepfk.org.tr",
      phone: "+90 342 220 30 69",
      social: "@GaziantepFK"
    }
  },

  // Mais times da Holanda
  {
    id: "189",
    name: "Feyenoord",
    country: "Holanda",
    continent: "Europa",
    league: "Eredivisie",
    logo: "🔴⚪",
    founded: 1908,
    players: 28,
    monthlyOffer: 9500,
    currency: "€",
    openPositions: 2,
    preferredStyle: "Atacante intenso",
    category: "Eredivisie",
    description: "Clube de Rotterdam valoriza atacantes guerreiros.",
    contact: {
      email: "jeugdopleiding@feyenoord.nl",
      phone: "+31 10 492 94 44",
      social: "@Feyenoord"
    }
  },
  {
    id: "190",
    name: "Twente",
    country: "Holanda",
    continent: "Europa",
    league: "Eredivisie",
    logo: "🔴⚪",
    founded: 1965,
    players: 25,
    monthlyOffer: 7800,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Volante dinâmico",
    category: "Eredivisie",
    description: "Tukkers de Enschede buscam volantes dinâmicos.",
    contact: {
      email: "jeugdopleiding@fctwente.nl",
      phone: "+31 53 486 18 65",
      social: "@fctwente"
    }
  },
  {
    id: "191",
    name: "NEC Nijmegen",
    country: "Holanda",
    continent: "Europa",
    league: "Eredivisie",
    logo: "🔴🟢",
    founded: 1900,
    players: 24,
    monthlyOffer: 6700,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Meia ofensivo",
    category: "Eredivisie",
    description: "Clube de Nijmegen valoriza meias ofensivos criativos.",
    contact: {
      email: "jeugdopleiding@necnijmegen.nl",
      phone: "+31 24 322 59 25",
      social: "@NECNijmegen"
    }
  },
  {
    id: "192",
    name: "Sparta Rotterdam",
    country: "Holanda",
    continent: "Europa",
    league: "Eredivisie",
    logo: "🔴⚪",
    founded: 1888,
    players: 23,
    monthlyOffer: 6400,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Lateral clássico",
    category: "Eredivisie",
    description: "Clube mais antigo de Rotterdam busca laterais sólidos.",
    contact: {
      email: "jeugdopleiding@sparta-rotterdam.nl",
      phone: "+31 10 477 99 66",
      social: "@SpartaRotterdam"
    }
  },

  // Mais times da Noruega
  {
    id: "193",
    name: "Lillestrøm SK",
    country: "Noruega",
    continent: "Europa",
    league: "Eliteserien",
    logo: "🟡⚫",
    founded: 1917,
    players: 23,
    monthlyOffer: 70000,
    currency: "kr",
    openPositions: 4,
    preferredStyle: "Zagueiro líder",
    category: "Eliteserien",
    description: "Kanarifuglene buscam zagueiros líderes.",
    contact: {
      email: "rekruttering@lsk.no",
      phone: "+47 63 80 47 00",
      social: "@LSKfotball"
    }
  },
  {
    id: "194",
    name: "Tromsø IL",
    country: "Noruega",
    continent: "Europa",
    league: "Eliteserien",
    logo: "🔴⚪",
    founded: 1920,
    players: 22,
    monthlyOffer: 65000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Atacante resistente",
    category: "Eliteserien",
    description: "Clube do Ártico busca atacantes fortes.",
    contact: {
      email: "rekruttering@til.no",
      phone: "+47 77 60 08 00",
      social: "@TromsoIL"
    }
  },

  // Mais times da Suécia
  {
    id: "195",
    name: "BK Häcken",
    country: "Suécia",
    continent: "Europa",
    league: "Allsvenskan",
    logo: "🟡⚫",
    founded: 1940,
    players: 24,
    monthlyOffer: 68000,
    currency: "kr",
    openPositions: 4,
    preferredStyle: "Ponta moderno",
    category: "Allsvenskan",
    description: "Clube de Gotemburgo valoriza extremos modernos.",
    contact: {
      email: "ungdom@bkhacken.se",
      phone: "+46 31 709 81 00",
      social: "@BKHackenFotboll"
    }
  },
  {
    id: "196",
    name: "IF Elfsborg",
    country: "Suécia",
    continent: "Europa",
    league: "Allsvenskan",
    logo: "🟡⚫",
    founded: 1904,
    players: 24,
    monthlyOffer: 66000,
    currency: "kr",
    openPositions: 4,
    preferredStyle: "Volante defensivo",
    category: "Allsvenskan",
    description: "Borås-klubben busca volantes destrutivos.",
    contact: {
      email: "ungdom@elfsborg.se",
      phone: "+46 33 25 09 00",
      social: "@IFElfsborg"
    }
  },
  {
    id: "197",
    name: "Kalmar FF",
    country: "Suécia",
    continent: "Europa",
    league: "Allsvenskan",
    logo: "🔴⚪",
    founded: 1910,
    players: 23,
    monthlyOffer: 60000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Meia central",
    category: "Allsvenskan",
    description: "Röd-vita do sul da Suécia valorizam meias organizadores.",
    contact: {
      email: "ungdom@kalmarff.se",
      phone: "+46 480 45 09 00",
      social: "@KalmarFF"
    }
  },

  // Mais times da Dinamarca
  {
    id: "198",
    name: "Randers FC",
    country: "Dinamarca",
    continent: "Europa",
    league: "Superliga",
    logo: "🔵⚪",
    founded: 2003,
    players: 23,
    monthlyOffer: 47000,
    currency: "kr",
    openPositions: 4,
    preferredStyle: "Atacante oportunista",
    category: "Superliga",
    description: "Hestene de Jylland buscam atacantes oportunistas.",
    contact: {
      email: "akademi@randersfc.dk",
      phone: "+45 86 41 61 11",
      social: "@RandersFC"
    }
  },
  {
    id: "199",
    name: "Viborg FF",
    country: "Dinamarca",
    continent: "Europa",
    league: "Superliga",
    logo: "🟢⚪",
    founded: 1896,
    players: 22,
    monthlyOffer: 44000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Lateral jovem",
    category: "Superliga",
    description: "De Grønne valorizam laterais jovens com potencial.",
    contact: {
      email: "akademi@viborgff.dk",
      phone: "+45 86 62 44 33",
      social: "@ViborgFF"
    }
  },
  {
    id: "200",
    name: "Odense BK",
    country: "Dinamarca",
    continent: "Europa",
    league: "Superliga",
    logo: "🔵⚪",
    founded: 1887,
    players: 24,
    monthlyOffer: 49000,
    currency: "kr",
    openPositions: 4,
    preferredStyle: "Volante criativo",
    category: "Superliga",
    description: "Stribet clube de Funen busca volantes criativos.",
    contact: {
      email: "akademi@ob.dk",
      phone: "+45 66 11 47 00",
      social: "@OdenseBoldklub"
    }
  },

  // Mais times de Portugal
  {
    id: "201",
    name: "Portimonense",
    country: "Portugal",
    continent: "Europa",
    league: "Primeira Liga",
    logo: "⚫⚪",
    founded: 1914,
    players: 24,
    monthlyOffer: 5600,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Extremo rápido",
    category: "Primeira Liga",
    description: "Alvinegros do Algarve buscam extremos velozes.",
    contact: {
      email: "formacao@portimonense.pt",
      phone: "+351 282 410 700",
      social: "@Portimonense_SC"
    }
  },
  {
    id: "202",
    name: "Casa Pia AC",
    country: "Portugal",
    continent: "Europa",
    league: "Primeira Liga",
    logo: "🟡🔴",
    founded: 1920,
    players: 23,
    monthlyOffer: 5400,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Volante equilibrado",
    category: "Primeira Liga",
    description: "Gansos lisboetas valorizam volantes equilibrados.",
    contact: {
      email: "formacao@casapiaac.pt",
      phone: "+351 21 362 10 00",
      social: "@CasaPiaAC"
    }
  },
  {
    id: "203",
    name: "Estoril Praia",
    country: "Portugal",
    continent: "Europa",
    league: "Primeira Liga",
    logo: "🟡🔵",
    founded: 1939,
    players: 24,
    monthlyOffer: 5700,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Ponta criativo",
    category: "Primeira Liga",
    description: "Canarinhos da linha valorizam extremos criativos.",
    contact: {
      email: "formacao@gdestorilpraia.pt",
      phone: "+351 21 467 58 70",
      social: "@GDEstorilPraia"
    }
  },
  {
    id: "204",
    name: "Gil Vicente",
    country: "Portugal",
    continent: "Europa",
    league: "Primeira Liga",
    logo: "🔴🔵",
    founded: 1924,
    players: 23,
    monthlyOffer: 5500,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Zagueiro jovem",
    category: "Primeira Liga",
    description: "Galos de Barcelos buscam zagueiros jovens promissores.",
    contact: {
      email: "formacao@gilvicente.pt",
      phone: "+351 253 808 830",
      social: "@GilVicente_FC"
    }
  },

  // Mais times da Bélgica
  {
    id: "205",
    name: "Union Saint-Gilloise",
    country: "Bélgica",
    continent: "Europa",
    league: "Pro League",
    logo: "🟡🔵",
    founded: 1897,
    players: 25,
    monthlyOffer: 7600,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Atacante técnico",
    category: "Pro League",
    description: "Clube histórico de Bruxelas em renascimento.",
    contact: {
      email: "jeunesse@usglive.be",
      phone: "+32 2 344 00 82",
      social: "@UnionStGilloise"
    }
  },
  {
    id: "206",
    name: "OH Leuven",
    country: "Bélgica",
    continent: "Europa",
    league: "Pro League",
    logo: "⚪🔴",
    founded: 2002,
    players: 24,
    monthlyOffer: 6800,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Meia jovem",
    category: "Pro League",
    description: "Clube universitário valoriza jovens talentos.",
    contact: {
      email: "jeugd@ohleuven.be",
      phone: "+32 16 28 09 30",
      social: "@OHLeuven"
    }
  },
  {
    id: "207",
    name: "KV Mechelen",
    country: "Bélgica",
    continent: "Europa",
    league: "Pro League",
    logo: "🟡🔴",
    founded: 1904,
    players: 24,
    monthlyOffer: 6600,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Lateral agressivo",
    category: "Pro League",
    description: "Malinwa valorizam laterais agressivos.",
    contact: {
      email: "jeugd@kvmechelen.be",
      phone: "+32 15 29 39 00",
      social: "@KVMechelen"
    }
  },

  // Mais times da Áustria
  {
    id: "208",
    name: "Red Bull Salzburg",
    country: "Áustria",
    continent: "Europa",
    league: "Bundesliga",
    logo: "🔴⚪",
    founded: 1933,
    players: 28,
    monthlyOffer: 8500,
    currency: "€",
    openPositions: 2,
    preferredStyle: "Ponta pressionador",
    category: "Bundesliga",
    description: "Roten Bullen com filosofia de jogo intenso.",
    contact: {
      email: "akademie@redbull.com",
      phone: "+43 662 2170",
      social: "@RedBullSalzburg"
    }
  },
  {
    id: "209",
    name: "Hartberg",
    country: "Áustria",
    continent: "Europa",
    league: "Bundesliga",
    logo: "🔵⚪",
    founded: 1946,
    players: 22,
    monthlyOffer: 5500,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Atacante trabalhador",
    category: "Bundesliga",
    description: "Clube da Estíria busca atacantes trabalhadores.",
    contact: {
      email: "akademie@tsv-hartberg.at",
      phone: "+43 3332 61505",
      social: "@TSVHartberg1946"
    }
  },

  // Mais times da República Tcheca
  {
    id: "210",
    name: "Jablonec",
    country: "República Tcheca",
    continent: "Europa",
    league: "Fortuna Liga",
    logo: "🟢⚪",
    founded: 1945,
    players: 24,
    monthlyOffer: 115000,
    currency: "Kč",
    openPositions: 4,
    preferredStyle: "Ponta esquerdo",
    category: "Fortuna Liga",
    description: "Zelení do norte tcheco buscam extremos esquerdos.",
    contact: {
      email: "akademie@fkjablonec.cz",
      phone: "+420 483 310 312",
      social: "@FKJablonec"
    }
  },
  {
    id: "211",
    name: "Slovácko",
    country: "República Tcheca",
    continent: "Europa",
    league: "Fortuna Liga",
    logo: "🔵⚪",
    founded: 1927,
    players: 23,
    monthlyOffer: 105000,
    currency: "Kč",
    openPositions: 5,
    preferredStyle: "Volante organizador",
    category: "Fortuna Liga",
    description: "Clube da Morávia valoriza volantes organizadores.",
    contact: {
      email: "akademie@fcslovacko.cz",
      phone: "+420 572 501 020",
      social: "@1_FCSlovacko"
    }
  },

  // Mais times da Suíça
  {
    id: "212",
    name: "Grasshopper",
    country: "Suíça",
    continent: "Europa",
    league: "Super League",
    logo: "🔵⚪",
    founded: 1886,
    players: 25,
    monthlyOffer: 8600,
    currency: "CHF",
    openPositions: 3,
    preferredStyle: "Meia promissor",
    category: "Super League",
    description: "Clube histórico de Zurique com tradição em formar talentos.",
    contact: {
      email: "nachwuchs@gcz.ch",
      phone: "+41 43 288 34 34",
      social: "@GCZurich"
    }
  },
  {
    id: "213",
    name: "Sion",
    country: "Suíça",
    continent: "Europa",
    league: "Super League",
    logo: "🔴⚪",
    founded: 1909,
    players: 24,
    monthlyOffer: 7800,
    currency: "CHF",
    openPositions: 4,
    preferredStyle: "Atacante alpino",
    category: "Super League",
    description: "Clube dos Alpes busca atacantes fortes.",
    contact: {
      email: "formation@fcsion.ch",
      phone: "+41 27 329 39 09",
      social: "@FCSion"
    }
  },

  // Mais times da Polônia
  {
    id: "214",
    name: "Cracovia",
    country: "Polônia",
    continent: "Europa",
    league: "Ekstraklasa",
    logo: "🔴⚪",
    founded: 1906,
    players: 24,
    monthlyOffer: 21000,
    currency: "zł",
    openPositions: 4,
    preferredStyle: "Zagueiro técnico",
    category: "Ekstraklasa",
    description: "Pasy de Cracóvia valorizam defensores técnicos.",
    contact: {
      email: "akademia@cracovia.pl",
      phone: "+48 12 410 52 00",
      social: "@KSCracoviaSSA"
    }
  },
  {
    id: "215",
    name: "Jagiellonia Białystok",
    country: "Polônia",
    continent: "Europa",
    league: "Ekstraklasa",
    logo: "🟡🔴",
    founded: 1920,
    players: 24,
    monthlyOffer: 22000,
    currency: "zł",
    openPositions: 4,
    preferredStyle: "Lateral ofensivo",
    category: "Ekstraklasa",
    description: "Jaga do nordeste polonês busca laterais ofensivos.",
    contact: {
      email: "akademia@jagiellonia.pl",
      phone: "+48 85 664 59 00",
      social: "@Jagiellonia1920"
    }
  },

  // Mais times da Romênia
  {
    id: "216",
    name: "Petrolul Ploiești",
    country: "Romênia",
    continent: "Europa",
    league: "Liga I",
    logo: "🟡🔵",
    founded: 1924,
    players: 24,
    monthlyOffer: 24000,
    currency: "lei",
    openPositions: 4,
    preferredStyle: "Ponta veloz",
    category: "Liga I",
    description: "Lupii galbeni buscam extremos rápidos.",
    contact: {
      email: "academie@fcpetrolul.ro",
      phone: "+40 244 516 924",
      social: "@fcpetrolul52"
    }
  },
  {
    id: "217",
    name: "Farul Constanța",
    country: "Romênia",
    continent: "Europa",
    league: "Liga I",
    logo: "🟢⚪",
    founded: 1920,
    players: 23,
    monthlyOffer: 23000,
    currency: "lei",
    openPositions: 5,
    preferredStyle: "Volante marítimo",
    category: "Liga I",
    description: "Marinarii do Mar Negro valorizam volantes táticos.",
    contact: {
      email: "academie@farulconstanta.ro",
      phone: "+40 241 618 300",
      social: "@FarulConstanta"
    }
  },

  // Mais times da Croácia
  {
    id: "218",
    name: "Lokomotiva Zagreb",
    country: "Croácia",
    continent: "Europa",
    league: "HNL",
    logo: "🔵⚪",
    founded: 1914,
    players: 23,
    monthlyOffer: 5800,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Meia jovem",
    category: "HNL",
    description: "Lokosi conhecidos por desenvolver jovens meias.",
    contact: {
      email: "akademija@nklokomotiva.hr",
      phone: "+385 1 309 03 09",
      social: "@nklokomotiva"
    }
  },
  {
    id: "219",
    name: "Istra 1961",
    country: "Croácia",
    continent: "Europa",
    league: "HNL",
    logo: "🟡🟢",
    founded: 1961,
    players: 22,
    monthlyOffer: 5500,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Lateral versátil",
    category: "HNL",
    description: "Žuto-zeleni da Ístria buscam laterais versáteis.",
    contact: {
      email: "akademija@nkistra.com",
      phone: "+385 52 222 665",
      social: "@NKIstra1961"
    }
  },

  // Mais times da Sérvia
  {
    id: "220",
    name: "Čukarički",
    country: "Sérvia",
    continent: "Europa",
    league: "SuperLiga",
    logo: "⚪🔴",
    founded: 1926,
    players: 23,
    monthlyOffer: 6000,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Atacante jovem",
    category: "SuperLiga",
    description: "Clube de Belgrado conhecido por revelar atacantes.",
    contact: {
      email: "omladinska@cukaricki.rs",
      phone: "+381 11 354 71 58",
      social: "@FKCukaricki"
    }
  },

  // Mais times da Ucrânia
  {
    id: "221",
    name: "Oleksandriya",
    country: "Ucrânia",
    continent: "Europa",
    league: "Premier League",
    logo: "🟡🔵",
    founded: 1948,
    players: 23,
    monthlyOffer: 6800,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Zagueiro confiável",
    category: "Premier League",
    description: "Clube do centro da Ucrânia busca defensores confiáveis.",
    contact: {
      email: "academy@fcoleksandria.com.ua",
      phone: "+380 5235 77 777",
      social: "@fcoleksandriya"
    }
  },

  // Mais times da Bulgária
  {
    id: "222",
    name: "CSKA 1948 Sofia",
    country: "Bulgária",
    continent: "Europa",
    league: "First League",
    logo: "🔴⚪",
    founded: 1948,
    players: 24,
    monthlyOffer: 9500,
    currency: "lv",
    openPositions: 4,
    preferredStyle: "Volante guerreiro",
    category: "First League",
    description: "Vermelho-brancos valorizam volantes guerreiros.",
    contact: {
      email: "academy@cska1948.bg",
      phone: "+359 2 807 07 48",
      social: "@CSKA1948Sofia"
    }
  },

  // Mais times da Eslováquia
  {
    id: "223",
    name: "Dunajská Streda",
    country: "Eslováquia",
    continent: "Europa",
    league: "Fortuna Liga",
    logo: "🟡🔵",
    founded: 2009,
    players: 23,
    monthlyOffer: 5200,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Atacante húngaro",
    category: "Fortuna Liga",
    description: "Clube multicultural busca atacantes talentosos.",
    contact: {
      email: "academy@dac1904.sk",
      phone: "+421 31 552 35 22",
      social: "@DAC1904FC"
    }
  },

  // Mais times da Hungria
  {
    id: "224",
    name: "Újpest FC",
    country: "Hungria",
    continent: "Europa",
    league: "NB I",
    logo: "🟣⚪",
    founded: 1885,
    players: 25,
    monthlyOffer: 1850000,
    currency: "Ft",
    openPositions: 3,
    preferredStyle: "Ponta clássico",
    category: "NB I",
    description: "Lilákok de Budapeste valorizam extremos clássicos.",
    contact: {
      email: "akademia@ujpestfc.hu",
      phone: "+36 1 231 2654",
      social: "@UjpestFC"
    }
  },
  {
    id: "225",
    name: "Honvéd",
    country: "Hungria",
    continent: "Europa",
    league: "NB I",
    logo: "🔴⚫",
    founded: 1909,
    players: 24,
    monthlyOffer: 1750000,
    currency: "Ft",
    openPositions: 4,
    preferredStyle: "Zagueiro militar",
    category: "NB I",
    description: "Clube militar tradicional busca defensores disciplinados.",
    contact: {
      email: "akademia@honvedfc.hu",
      phone: "+36 1 280 6969",
      social: "@honvedfc"
    }
  },

  // Mais times do Chipre
  {
    id: "226",
    name: "Anorthosis Famagusta",
    country: "Chipre",
    continent: "Europa",
    league: "First Division",
    logo: "🔵⚪",
    founded: 1911,
    players: 24,
    monthlyOffer: 5700,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Volante combativo",
    category: "First Division",
    description: "Kyanoléfki valorizam volantes combativos.",
    contact: {
      email: "academy@anorthosis.com.cy",
      phone: "+357 23 820 820",
      social: "@AnorthosisFC"
    }
  },

  // Times adicionais para completar 300+
  {
    id: "227",
    name: "Wrexham AFC",
    country: "País de Gales",
    continent: "Europa",
    league: "League Two",
    logo: "🔴⚪",
    founded: 1864,
    players: 24,
    monthlyOffer: 6500,
    currency: "£",
    openPositions: 4,
    preferredStyle: "Atacante combativo",
    category: "League Two",
    description: "Clube galês mais antigo em ascensão meteórica.",
    contact: {
      email: "academy@wrexhamafc.co.uk",
      phone: "+44 1978 262129",
      social: "@Wrexham_AFC"
    }
  },
  {
    id: "228",
    name: "Steaua București",
    country: "Romênia",
    continent: "Europa",
    league: "Liga I",
    logo: "🔴🔵",
    founded: 1947,
    players: 26,
    monthlyOffer: 29000,
    currency: "lei",
    openPositions: 3,
    preferredStyle: "Lateral romeno",
    category: "Liga I",
    description: "Clube histórico romeno com tradição europeia.",
    contact: {
      email: "academie@steauabucuresti.ro",
      phone: "+40 21 316 0147",
      social: "@SteauaBucuresti"
    }
  },
  {
    id: "229",
    name: "Maccabi Tel Aviv",
    country: "Israel",
    continent: "Europa",
    league: "Ligat ha'Al",
    logo: "🟡🔵",
    founded: 1906,
    players: 26,
    monthlyOffer: 28000,
    currency: "₪",
    openPositions: 3,
    preferredStyle: "Meia israelense",
    category: "Ligat ha'Al",
    description: "Clube mais titulado de Israel valoriza meias técnicos.",
    contact: {
      email: "academy@maccabi-tlv.co.il",
      phone: "+972 3 537 6376",
      social: "@MaccabiTLVFC"
    }
  },
  {
    id: "230",
    name: "Hapoel Beer Sheva",
    country: "Israel",
    continent: "Europa",
    league: "Ligat ha'Al",
    logo: "🔴⚪",
    founded: 1949,
    players: 25,
    monthlyOffer: 26000,
    currency: "₪",
    openPositions: 4,
    preferredStyle: "Atacante do deserto",
    category: "Ligat ha'Al",
    description: "Clube do sul de Israel busca atacantes resilientes.",
    contact: {
      email: "academy@hapoel-bs.co.il",
      phone: "+972 8 623 5555",
      social: "@HapoelBSFC"
    }
  },
  {
    id: "231",
    name: "Qarabağ FK",
    country: "Azerbaijão",
    continent: "Europa",
    league: "Premier League",
    logo: "⚫⚪",
    founded: 1951,
    players: 26,
    monthlyOffer: 7500,
    currency: "€",
    openPositions: 3,
    preferredStyle: "Volante azeri",
    category: "Premier League",
    description: "Campeão do Azerbaijão com presença europeia regular.",
    contact: {
      email: "academy@qarabagh.com",
      phone: "+994 12 404 80 80",
      social: "@QarabagFK"
    }
  },
  {
    id: "232",
    name: "Neftçi Baku",
    country: "Azerbaijão",
    continent: "Europa",
    league: "Premier League",
    logo: "⚫⚪",
    founded: 1937,
    players: 25,
    monthlyOffer: 7000,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Lateral cáucaso",
    category: "Premier League",
    description: "Clube tradicional de Baku valoriza laterais modernos.",
    contact: {
      email: "academy@neftchi.az",
      phone: "+994 12 490 55 55",
      social: "@NeftchiBaku"
    }
  },
  {
    id: "233",
    name: "Flora Tallinn",
    country: "Estônia",
    continent: "Europa",
    league: "Meistriliiga",
    logo: "🟢⚪",
    founded: 1990,
    players: 23,
    monthlyOffer: 5200,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Meia báltico",
    category: "Meistriliiga",
    description: "Clube estoniano dominante busca meias técnicos.",
    contact: {
      email: "academy@fcflora.ee",
      phone: "+372 627 9727",
      social: "@FCFloraTallinn"
    }
  },
  {
    id: "234",
    name: "Riga FC",
    country: "Letônia",
    continent: "Europa",
    league: "Virsliga",
    logo: "🔵⚪",
    founded: 2015,
    players: 23,
    monthlyOffer: 5100,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Atacante letão",
    category: "Virsliga",
    description: "Clube moderno de Riga em crescimento.",
    contact: {
      email: "academy@rigafc.lv",
      phone: "+371 67 146 146",
      social: "@RigaFC"
    }
  },
  {
    id: "235",
    name: "Žalgiris Vilnius",
    country: "Lituânia",
    continent: "Europa",
    league: "A Lyga",
    logo: "🟢⚪",
    founded: 1947,
    players: 23,
    monthlyOffer: 5000,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Ponta lituano",
    category: "A Lyga",
    description: "Clube histórico lituano valoriza extremos.",
    contact: {
      email: "academy@fkzalgiris.lt",
      phone: "+370 5 233 5333",
      social: "@fkzalgiris"
    }
  },
  {
    id: "236",
    name: "Shamrock Rovers",
    country: "Irlanda",
    continent: "Europa",
    league: "Premier Division",
    logo: "🟢⚪",
    founded: 1901,
    players: 24,
    monthlyOffer: 5500,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Volante irlandês",
    category: "Premier Division",
    description: "Hoops de Dublin, clube mais titulado da Irlanda.",
    contact: {
      email: "academy@shamrockrovers.ie",
      phone: "+353 1 492 2222",
      social: "@ShamrockRovers"
    }
  },
  {
    id: "237",
    name: "Bohemians FC",
    country: "Irlanda",
    continent: "Europa",
    league: "Premier Division",
    logo: "🔴⚫",
    founded: 1890,
    players: 23,
    monthlyOffer: 5200,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Lateral irlandês",
    category: "Premier Division",
    description: "Gypsies de Dublin com tradição comunitária.",
    contact: {
      email: "academy@bohemians.ie",
      phone: "+353 1 838 7000",
      social: "@bfcdublin"
    }
  },
  {
    id: "238",
    name: "The New Saints",
    country: "País de Gales",
    continent: "Europa",
    league: "Cymru Premier",
    logo: "🟢⚪",
    founded: 1959,
    players: 22,
    monthlyOffer: 5000,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Atacante galês",
    category: "Cymru Premier",
    description: "Clube galês dominante com presença europeia.",
    contact: {
      email: "academy@thenewsaintsfc.co.uk",
      phone: "+44 1691 670952",
      social: "@tnsfc"
    }
  },
  {
    id: "239",
    name: "HB Tórshavn",
    country: "Ilhas Faroé",
    continent: "Europa",
    league: "Betri deildin",
    logo: "🔵⚪",
    founded: 1904,
    players: 20,
    monthlyOffer: 25000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Volante faroense",
    category: "Betri deildin",
    description: "Clube mais titulado das Ilhas Faroé.",
    contact: {
      email: "academy@hb.fo",
      phone: "+298 351904",
      social: "@hbtorshavn"
    }
  },
  {
    id: "240",
    name: "Valur",
    country: "Islândia",
    continent: "Europa",
    league: "Úrvalsdeild",
    logo: "🔴⚪",
    founded: 1911,
    players: 22,
    monthlyOffer: 650000,
    currency: "kr",
    openPositions: 4,
    preferredStyle: "Lateral islandês",
    category: "Úrvalsdeild",
    description: "Clube de Reykjavik com tradição de laterais fortes.",
    contact: {
      email: "academy@valur.is",
      phone: "+354 510 2900",
      social: "@ValurFootball"
    }
  },
  {
    id: "241",
    name: "Breidablik",
    country: "Islândia",
    continent: "Europa",
    league: "Úrvalsdeild",
    logo: "🟢⚪",
    founded: 1950,
    players: 21,
    monthlyOffer: 600000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Meia viking",
    category: "Úrvalsdeild",
    description: "Clube suburbano islandês em ascensão.",
    contact: {
      email: "academy@breidablik.is",
      phone: "+354 565 1400",
      social: "@Breidablik"
    }
  },
  {
    id: "242",
    name: "Lincoln Red Imps",
    country: "Gibraltar",
    continent: "Europa",
    league: "National League",
    logo: "🔴⚪",
    founded: 1976,
    players: 20,
    monthlyOffer: 5000,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Atacante gibraltino",
    category: "National League",
    description: "Clube dominante de Gibraltar.",
    contact: {
      email: "academy@lincolnredimps.com",
      phone: "+350 200 79700",
      social: "@LincolnRedImps"
    }
  },
  {
    id: "243",
    name: "Valletta FC",
    country: "Malta",
    continent: "Europa",
    league: "Premier League",
    logo: "🟢⚪",
    founded: 1943,
    players: 21,
    monthlyOffer: 5200,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Volante maltês",
    category: "Premier League",
    description: "Clube mais titulado de Malta.",
    contact: {
      email: "academy@vallettafc.org",
      phone: "+356 2180 2180",
      social: "@VallettaFC"
    }
  },
  {
    id: "244",
    name: "Floriana FC",
    country: "Malta",
    continent: "Europa",
    league: "Premier League",
    logo: "🟢⚪",
    founded: 1894,
    players: 20,
    monthlyOffer: 5100,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Lateral mediterrâneo",
    category: "Premier League",
    description: "Clube histórico maltês.",
    contact: {
      email: "academy@florianafc.com",
      phone: "+356 2124 4424",
      social: "@FlorianaFC"
    }
  },
  {
    id: "245",
    name: "Linfield FC",
    country: "Irlanda do Norte",
    continent: "Europa",
    league: "Premiership",
    logo: "🔵⚪",
    founded: 1886,
    players: 23,
    monthlyOffer: 5400,
    currency: "£",
    openPositions: 4,
    preferredStyle: "Zagueiro norte-irlandês",
    category: "Premiership",
    description: "Blues de Belfast, clube mais titulado da Irlanda do Norte.",
    contact: {
      email: "academy@linfieldfc.com",
      phone: "+44 28 9024 4198",
      social: "@OfficialBlues"
    }
  },
  {
    id: "246",
    name: "Glentoran FC",
    country: "Irlanda do Norte",
    continent: "Europa",
    league: "Premiership",
    logo: "🟢🔴",
    founded: 1882,
    players: 22,
    monthlyOffer: 5200,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Atacante de Belfast",
    category: "Premiership",
    description: "Glens do leste de Belfast.",
    contact: {
      email: "academy@glentoran.com",
      phone: "+44 28 9045 8024",
      social: "@Glentoran"
    }
  },
  {
    id: "247",
    name: "Dundalk FC",
    country: "Irlanda",
    continent: "Europa",
    league: "Premier Division",
    logo: "⚪⚫",
    founded: 1903,
    players: 23,
    monthlyOffer: 5300,
    currency: "€",
    openPositions: 4,
    preferredStyle: "Meia box-to-box",
    category: "Premier Division",
    description: "Lilywhites com tradição europeia recente.",
    contact: {
      email: "academy@dundalkfc.com",
      phone: "+353 42 933 4504",
      social: "@DundalkFC"
    }
  },
  {
    id: "248",
    name: "Derry City",
    country: "Irlanda",
    continent: "Europa",
    league: "Premier Division",
    logo: "🔴⚪",
    founded: 1928,
    players: 22,
    monthlyOffer: 5100,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Ponta criativo",
    category: "Premier Division",
    description: "Candystripes do noroeste irlandês.",
    contact: {
      email: "academy@derrycityfc.net",
      phone: "+353 71 917 1900",
      social: "@derrycityfc"
    }
  },
  {
    id: "249",
    name: "Connah's Quay",
    country: "País de Gales",
    continent: "Europa",
    league: "Cymru Premier",
    logo: "⚪🔵",
    founded: 1946,
    players: 21,
    monthlyOffer: 4800,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Volante galês",
    category: "Cymru Premier",
    description: "Nomads do norte do País de Gales.",
    contact: {
      email: "academy@connahsquaynomads.co.uk",
      phone: "+44 1244 830292",
      social: "@CQNomadsFC"
    }
  },
  {
    id: "250",
    name: "Bala Town",
    country: "País de Gales",
    continent: "Europa",
    league: "Cymru Premier",
    logo: "🟡⚫",
    founded: 1880,
    players: 20,
    monthlyOffer: 4700,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Atacante rural",
    category: "Cymru Premier",
    description: "Lakesiders do interior galês.",
    contact: {
      email: "academy@balatownfc.com",
      phone: "+44 1678 521154",
      social: "@BalaTownFC"
    }
  },
  {
    id: "251",
    name: "KÍ Klaksvík",
    country: "Ilhas Faroé",
    continent: "Europa",
    league: "Betri deildin",
    logo: "🔵⚪",
    founded: 1904,
    players: 20,
    monthlyOffer: 24000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Zagueiro das ilhas",
    category: "Betri deildin",
    description: "Clube do norte das Faroé.",
    contact: {
      email: "academy@ki.fo",
      phone: "+298 456789",
      social: "@kiklaksvik"
    }
  },
  {
    id: "252",
    name: "KR Reykjavik",
    country: "Islândia",
    continent: "Europa",
    league: "Úrvalsdeild",
    logo: "⚫⚪",
    founded: 1899,
    players: 21,
    monthlyOffer: 620000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Volante nórdico",
    category: "Úrvalsdeild",
    description: "Clube tradicional de Reykjavik.",
    contact: {
      email: "academy@kr.is",
      phone: "+354 510 6900",
      social: "@KRFootball"
    }
  },
  {
    id: "253",
    name: "FH Hafnarfjörður",
    country: "Islândia",
    continent: "Europa",
    league: "Úrvalsdeild",
    logo: "🟢⚪",
    founded: 1929,
    players: 21,
    monthlyOffer: 610000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Lateral forte",
    category: "Úrvalsdeild",
    description: "Clube suburbano competitivo.",
    contact: {
      email: "academy@fh.is",
      phone: "+354 565 2100",
      social: "@FHHafnarfjordur"
    }
  },
  {
    id: "254",
    name: "Europa FC",
    country: "Gibraltar",
    continent: "Europa",
    league: "National League",
    logo: "🟢⚫",
    founded: 1925,
    players: 19,
    monthlyOffer: 4900,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Meia Gibraltar",
    category: "National League",
    description: "Clube em ascensão no rochedo.",
    contact: {
      email: "academy@europafc.com",
      phone: "+350 200 78800",
      social: "@EuropaFC"
    }
  },
  {
    id: "255",
    name: "Hibernians FC",
    country: "Malta",
    continent: "Europa",
    league: "Premier League",
    logo: "🟢⚪",
    founded: 1922,
    players: 20,
    monthlyOffer: 5000,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Atacante ilha",
    category: "Premier League",
    description: "Paolites com tradição maltesa.",
    contact: {
      email: "academy@hiberniansfc.com",
      phone: "+356 2180 5180",
      social: "@HiberniansFC"
    }
  },
  {
    id: "256",
    name: "Glentoran Belfast",
    country: "Irlanda do Norte",
    continent: "Europa",
    league: "Premiership",
    logo: "🟢🔴",
    founded: 1882,
    players: 22,
    monthlyOffer: 5200,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Zagueiro Belfast",
    category: "Premiership",
    description: "Oval Giants do leste de Belfast.",
    contact: {
      email: "academy@glentoran.com",
      phone: "+44 28 9045 8024",
      social: "@Glentoran"
    }
  },
  {
    id: "257",
    name: "Crusaders FC",
    country: "Irlanda do Norte",
    continent: "Europa",
    league: "Premiership",
    logo: "🔴⚫",
    founded: 1898,
    players: 22,
    monthlyOffer: 5100,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Volante norte",
    category: "Premiership",
    description: "Crues do norte de Belfast.",
    contact: {
      email: "academy@crusadersfc.com",
      phone: "+44 28 9074 6879",
      social: "@CrusadersFC"
    }
  },
  {
    id: "258",
    name: "Cork City",
    country: "Irlanda",
    continent: "Europa",
    league: "Premier Division",
    logo: "🟢⚪",
    founded: 1984,
    players: 22,
    monthlyOffer: 5000,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Ponta sulista",
    category: "Premier Division",
    description: "Rebel Army do sul da Irlanda.",
    contact: {
      email: "academy@corkcityfc.ie",
      phone: "+353 21 431 3927",
      social: "@CorkCityFC"
    }
  },
  {
    id: "259",
    name: "Sligo Rovers",
    country: "Irlanda",
    continent: "Europa",
    league: "Premier Division",
    logo: "🔴⚪",
    founded: 1928,
    players: 21,
    monthlyOffer: 4900,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Lateral oeste",
    category: "Premier Division",
    description: "Bit O'Red do oeste irlandês.",
    contact: {
      email: "academy@sligorovers.com",
      phone: "+353 71 916 2133",
      social: "@sligorovers"
    }
  },
  {
    id: "260",
    name: "Caernarfon Town",
    country: "País de Gales",
    continent: "Europa",
    league: "Cymru Premier",
    logo: "🟡🟢",
    founded: 1876,
    players: 20,
    monthlyOffer: 4600,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Zagueiro galês",
    category: "Cymru Premier",
    description: "Canaries do norte do País de Gales.",
    contact: {
      email: "academy@caernarfontownfc.com",
      phone: "+44 1286 676542",
      social: "@CaernarfonTown"
    }
  },
  {
    id: "261",
    name: "B36 Tórshavn",
    country: "Ilhas Faroé",
    continent: "Europa",
    league: "Betri deildin",
    logo: "🔴⚫",
    founded: 1936,
    players: 19,
    monthlyOffer: 23000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Meia Faroé",
    category: "Betri deildin",
    description: "Clube tradicional das ilhas.",
    contact: {
      email: "academy@b36.fo",
      phone: "+298 311936",
      social: "@B36Torshavn"
    }
  },
  {
    id: "262",
    name: "ÍA Akranes",
    country: "Islândia",
    continent: "Europa",
    league: "Úrvalsdeild",
    logo: "🔴⚪",
    founded: 1946,
    players: 20,
    monthlyOffer: 590000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Atacante fjord",
    category: "Úrvalsdeild",
    description: "Clube portuário islandês.",
    contact: {
      email: "academy@iaakranes.is",
      phone: "+354 431 1575",
      social: "@IAAkranes"
    }
  },
  {
    id: "263",
    name: "St Joseph's FC",
    country: "Gibraltar",
    continent: "Europa",
    league: "National League",
    logo: "🔴⚪",
    founded: 1912,
    players: 18,
    monthlyOffer: 4800,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Volante rochedo",
    category: "National League",
    description: "Saints de Gibraltar.",
    contact: {
      email: "academy@stjosephsfc.com",
      phone: "+350 200 77700",
      social: "@StJosephsFC"
    }
  },
  {
    id: "264",
    name: "Sliema Wanderers",
    country: "Malta",
    continent: "Europa",
    league: "Premier League",
    logo: "🔵⚪",
    founded: 1909,
    players: 20,
    monthlyOffer: 4950,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Lateral costeiro",
    category: "Premier League",
    description: "Blues de Sliema.",
    contact: {
      email: "academy@sliemawanderers.com",
      phone: "+356 2133 4504",
      social: "@SliemaWanderers"
    }
  },
  {
    id: "265",
    name: "Cliftonville FC",
    country: "Irlanda do Norte",
    continent: "Europa",
    league: "Premiership",
    logo: "🔴⚪",
    founded: 1879,
    players: 21,
    monthlyOffer: 5000,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Atacante Reds",
    category: "Premiership",
    description: "Reds do norte de Belfast, clube mais antigo da Irlanda.",
    contact: {
      email: "academy@cliftonvillefc.net",
      phone: "+44 28 9075 4321",
      social: "@cliftonvillefc"
    }
  },
  {
    id: "266",
    name: "St Patrick's Athletic",
    country: "Irlanda",
    continent: "Europa",
    league: "Premier Division",
    logo: "🔴⚪",
    founded: 1929,
    players: 22,
    monthlyOffer: 5050,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Meia Dublin",
    category: "Premier Division",
    description: "Saints de Inchicore.",
    contact: {
      email: "academy@stpatsfc.com",
      phone: "+353 1 454 5228",
      social: "@stpatsfc"
    }
  },
  {
    id: "267",
    name: "Newtown AFC",
    country: "País de Gales",
    continent: "Europa",
    league: "Cymru Premier",
    logo: "🔴⚪",
    founded: 1875,
    players: 19,
    monthlyOffer: 4500,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Volante Powys",
    category: "Cymru Premier",
    description: "Robins do centro do País de Gales.",
    contact: {
      email: "academy@newtownafc.co.uk",
      phone: "+44 1686 626636",
      social: "@NewtownAFC"
    }
  },
  {
    id: "268",
    name: "NSÍ Runavík",
    country: "Ilhas Faroé",
    continent: "Europa",
    league: "Betri deildin",
    logo: "⚫🟡",
    founded: 1957,
    players: 19,
    monthlyOffer: 22000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Zagueiro insular",
    category: "Betri deildin",
    description: "Clube das ilhas do leste.",
    contact: {
      email: "academy@nsi.fo",
      phone: "+298 417057",
      social: "@NSIRunavik"
    }
  },
  {
    id: "269",
    name: "Stjarnan",
    country: "Islândia",
    continent: "Europa",
    league: "Úrvalsdeild",
    logo: "🔵⚪",
    founded: 1960,
    players: 20,
    monthlyOffer: 580000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Ponta gelado",
    category: "Úrvalsdeild",
    description: "Clube de Garðabær conhecido pelas comemorações.",
    contact: {
      email: "academy@stjarnan.is",
      phone: "+354 565 3500",
      social: "@UMFStjarnan"
    }
  },
  {
    id: "270",
    name: "Mons Calpe",
    country: "Gibraltar",
    continent: "Europa",
    league: "National League",
    logo: "🔴🔵",
    founded: 2013,
    players: 18,
    monthlyOffer: 4700,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Lateral ágil",
    category: "National League",
    description: "Clube jovem de Gibraltar.",
    contact: {
      email: "academy@monscalpe.com",
      phone: "+350 200 76600",
      social: "@MonsCalpeFC"
    }
  },
  {
    id: "271",
    name: "Birkirkara FC",
    country: "Malta",
    continent: "Europa",
    league: "Premier League",
    logo: "🔴⚪",
    founded: 1950,
    players: 20,
    monthlyOffer: 4900,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Volante central",
    category: "Premier League",
    description: "Stripes de Birkirkara.",
    contact: {
      email: "academy@birkirkarafc.com",
      phone: "+356 2144 8144",
      social: "@BirkirkaraFC"
    }
  },
  {
    id: "272",
    name: "Coleraine FC",
    country: "Irlanda do Norte",
    continent: "Europa",
    league: "Premiership",
    logo: "🔵⚪",
    founded: 1927,
    players: 21,
    monthlyOffer: 4900,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Atacante costa",
    category: "Premiership",
    description: "Bannsiders da costa norte.",
    contact: {
      email: "academy@colerainfc.com",
      phone: "+44 28 7034 4144",
      social: "@ColeraineFC"
    }
  },
  {
    id: "273",
    name: "Waterford FC",
    country: "Irlanda",
    continent: "Europa",
    league: "Premier Division",
    logo: "🔵⚪",
    founded: 1930,
    players: 21,
    monthlyOffer: 4850,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Zagueiro Suir",
    category: "Premier Division",
    description: "Blues do sudeste irlandês.",
    contact: {
      email: "academy@waterfordfc.ie",
      phone: "+353 51 358978",
      social: "@WaterfordFCie"
    }
  },
  {
    id: "274",
    name: "Haverfordwest County",
    country: "País de Gales",
    continent: "Europa",
    league: "Cymru Premier",
    logo: "🔵⚪",
    founded: 1899,
    players: 19,
    monthlyOffer: 4400,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Meia Pembroke",
    category: "Cymru Premier",
    description: "Bluebirds do oeste do País de Gales.",
    contact: {
      email: "academy@haverfordwestcounty.com",
      phone: "+44 1437 763543",
      social: "@HaverfordwestAFC"
    }
  },
  {
    id: "275",
    name: "Víkingur Reykjavík",
    country: "Islândia",
    continent: "Europa",
    league: "Úrvalsdeild",
    logo: "🔴🔵",
    founded: 1908,
    players: 21,
    monthlyOffer: 630000,
    currency: "kr",
    openPositions: 4,
    preferredStyle: "Volante moderno",
    category: "Úrvalsdeild",
    description: "Vikings em crescimento na capital.",
    contact: {
      email: "academy@vikingur.is",
      phone: "+354 510 7700",
      social: "@VikingurReykjavik"
    }
  },
  {
    id: "276",
    name: "07 Vestur",
    country: "Ilhas Faroé",
    continent: "Europa",
    league: "Betri deildin",
    logo: "🟢⚪",
    founded: 2007,
    players: 18,
    monthlyOffer: 21000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Atacante oeste",
    category: "Betri deildin",
    description: "Clube jovem das ilhas ocidentais.",
    contact: {
      email: "academy@07vestur.fo",
      phone: "+298 234567",
      social: "@07Vestur"
    }
  },
  {
    id: "277",
    name: "Magpies FC",
    country: "Gibraltar",
    continent: "Europa",
    league: "National League",
    logo: "⚫⚪",
    founded: 2013,
    players: 17,
    monthlyOffer: 4600,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Meia jovem",
    category: "National League",
    description: "Clube emergente gibraltino.",
    contact: {
      email: "academy@magpiesfc.com",
      phone: "+350 200 75500",
      social: "@MagpiesFC"
    }
  },
  {
    id: "278",
    name: "Hamrun Spartans",
    country: "Malta",
    continent: "Europa",
    league: "Premier League",
    logo: "🔴⚫",
    founded: 1907,
    players: 20,
    monthlyOffer: 4850,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Lateral spartano",
    category: "Premier League",
    description: "Spartans tradicionais malteses.",
    contact: {
      email: "academy@hamrunspartans.com",
      phone: "+356 2123 3123",
      social: "@HamrunSpartans"
    }
  },
  {
    id: "279",
    name: "Larne FC",
    country: "Irlanda do Norte",
    continent: "Europa",
    league: "Premiership",
    logo: "🔴🟡",
    founded: 1889,
    players: 21,
    monthlyOffer: 4950,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Ponta costa leste",
    category: "Premiership",
    description: "Clube da costa de Antrim em ascensão.",
    contact: {
      email: "academy@larnefc.com",
      phone: "+44 28 2827 2817",
      social: "@larnefc"
    }
  },
  {
    id: "280",
    name: "Drogheda United",
    country: "Irlanda",
    continent: "Europa",
    league: "Premier Division",
    logo: "🔴⚪",
    founded: 1919,
    players: 21,
    monthlyOffer: 4800,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Volante Boyne",
    category: "Premier Division",
    description: "Drogs do nordeste irlandês.",
    contact: {
      email: "academy@droghedaunited.ie",
      phone: "+353 41 983 4558",
      social: "@DroghedaUnited"
    }
  },
  {
    id: "281",
    name: "Penybont FC",
    country: "País de Gales",
    continent: "Europa",
    league: "Cymru Premier",
    logo: "🟢⚪",
    founded: 2013,
    players: 18,
    monthlyOffer: 4300,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Atacante Bridgend",
    category: "Cymru Premier",
    description: "Clube moderno do sul do País de Gales.",
    contact: {
      email: "academy@penybontfc.com",
      phone: "+44 1656 721721",
      social: "@PenybontFC"
    }
  },
  {
    id: "282",
    name: "Fram Reykjavík",
    country: "Islândia",
    continent: "Europa",
    league: "1. deild",
    logo: "🔵⚪",
    founded: 1908,
    players: 20,
    monthlyOffer: 520000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Zagueiro tradicional",
    category: "1. deild",
    description: "Clube histórico de Reykjavik.",
    contact: {
      email: "academy@fram.is",
      phone: "+354 561 2929",
      social: "@FramReykjavik"
    }
  },
  {
    id: "283",
    name: "EB/Streymur",
    country: "Ilhas Faroé",
    continent: "Europa",
    league: "Betri deildin",
    logo: "🔵🔴",
    founded: 1993,
    players: 18,
    monthlyOffer: 20000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Volante ilha",
    category: "Betri deildin",
    description: "Fusão de clubes faroenses.",
    contact: {
      email: "academy@eb-streymur.fo",
      phone: "+298 445577",
      social: "@EBStreymur"
    }
  },
  {
    id: "284",
    name: "Bruno's Magpies",
    country: "Gibraltar",
    continent: "Europa",
    league: "National League",
    logo: "⚫⚪",
    founded: 2013,
    players: 17,
    monthlyOffer: 4500,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Lateral pequeno",
    category: "National League",
    description: "Clube compacto de Gibraltar.",
    contact: {
      email: "academy@brunosmagpies.com",
      phone: "+350 200 74400",
      social: "@BrunosMagpies"
    }
  },
  {
    id: "285",
    name: "Gzira United",
    country: "Malta",
    continent: "Europa",
    league: "Premier League",
    logo: "🔴⚫",
    founded: 1947,
    players: 19,
    monthlyOffer: 4750,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Meia Marsamxett",
    category: "Premier League",
    description: "Clube portuário maltês.",
    contact: {
      email: "academy@gziraunited.com",
      phone: "+356 2133 6133",
      social: "@GziraUnited"
    }
  },
  {
    id: "286",
    name: "Portadown FC",
    country: "Irlanda do Norte",
    continent: "Europa",
    league: "Premiership",
    logo: "🔴⚪",
    founded: 1924,
    players: 20,
    monthlyOffer: 4850,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Atacante Ports",
    category: "Premiership",
    description: "Ports de County Armagh.",
    contact: {
      email: "academy@portadownfc.co.uk",
      phone: "+44 28 3833 4004",
      social: "@OfficialPorts"
    }
  },
  {
    id: "287",
    name: "Shelbourne FC",
    country: "Irlanda",
    continent: "Europa",
    league: "Premier Division",
    logo: "🔴⚪",
    founded: 1895,
    players: 21,
    monthlyOffer: 4900,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Ponta Drumcondra",
    category: "Premier Division",
    description: "Shels de Dublin norte.",
    contact: {
      email: "academy@shelbournefc.ie",
      phone: "+353 1 855 1858",
      social: "@shelsfc"
    }
  },
  {
    id: "288",
    name: "Barry Town United",
    country: "País de Gales",
    continent: "Europa",
    league: "Cymru Premier",
    logo: "🟡🟢",
    founded: 1912,
    players: 19,
    monthlyOffer: 4350,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Volante Vale",
    category: "Cymru Premier",
    description: "Clube do Vale de Glamorgan.",
    contact: {
      email: "academy@barrytownunited.com",
      phone: "+44 1446 735353",
      social: "@BarryTownUTD"
    }
  },
  {
    id: "289",
    name: "Þróttur Reykjavík",
    country: "Islândia",
    continent: "Europa",
    league: "1. deild",
    logo: "🔴⚪",
    founded: 1949,
    players: 19,
    monthlyOffer: 500000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Lateral subúrbio",
    category: "1. deild",
    description: "Clube suburbano de Reykjavik.",
    contact: {
      email: "academy@throttur.is",
      phone: "+354 557 0707",
      social: "@ThrotturR"
    }
  },
  {
    id: "290",
    name: "Víkingur Gøta",
    country: "Ilhas Faroé",
    continent: "Europa",
    league: "Betri deildin",
    logo: "🔵🔴",
    founded: 2008,
    players: 18,
    monthlyOffer: 19500,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Zagueiro viking",
    category: "Betri deildin",
    description: "Vikings das ilhas centrais.",
    contact: {
      email: "academy@vikingur.fo",
      phone: "+298 447788",
      social: "@VikingurGota"
    }
  },
  {
    id: "291",
    name: "Glacis United",
    country: "Gibraltar",
    continent: "Europa",
    league: "National League",
    logo: "🔵⚪",
    founded: 1965,
    players: 17,
    monthlyOffer: 4400,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Meia rochoso",
    category: "National League",
    description: "Clube tradicional gibraltino.",
    contact: {
      email: "academy@glacisunited.com",
      phone: "+350 200 73300",
      social: "@GlacisUnited"
    }
  },
  {
    id: "292",
    name: "Mosta FC",
    country: "Malta",
    continent: "Europa",
    league: "Premier League",
    logo: "🔵⚪",
    founded: 1933,
    players: 19,
    monthlyOffer: 4700,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Atacante central",
    category: "Premier League",
    description: "Blues do centro de Malta.",
    contact: {
      email: "academy@mostafc.com",
      phone: "+356 2141 4141",
      social: "@MostaFC"
    }
  },
  {
    id: "293",
    name: "Glenavon FC",
    country: "Irlanda do Norte",
    continent: "Europa",
    league: "Premiership",
    logo: "🔵🔴",
    founded: 1889,
    players: 20,
    monthlyOffer: 4800,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Volante Lurgan",
    category: "Premiership",
    description: "Clube de Lurgan, County Armagh.",
    contact: {
      email: "academy@glenavonfc.com",
      phone: "+44 28 3832 2878",
      social: "@glenavonfc"
    }
  },
  {
    id: "294",
    name: "Treaty United",
    country: "Irlanda",
    continent: "Europa",
    league: "First Division",
    logo: "🔵⚪",
    founded: 2020,
    players: 20,
    monthlyOffer: 4650,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Zagueiro Shannon",
    category: "First Division",
    description: "Clube moderno de Limerick.",
    contact: {
      email: "academy@treatyunited.ie",
      phone: "+353 61 123456",
      social: "@TreatyUnitedFC"
    }
  },
  {
    id: "295",
    name: "Flint Town United",
    country: "País de Gales",
    continent: "Europa",
    league: "Cymru Premier",
    logo: "⚪⚫",
    founded: 1886,
    players: 18,
    monthlyOffer: 4250,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Lateral Dee",
    category: "Cymru Premier",
    description: "Silkmen do nordeste galês.",
    contact: {
      email: "academy@flinttownunited.com",
      phone: "+44 1352 733733",
      social: "@FlintTownUtd"
    }
  },
  {
    id: "296",
    name: "Fylkir",
    country: "Islândia",
    continent: "Europa",
    league: "1. deild",
    logo: "🟠⚫",
    founded: 1967,
    players: 19,
    monthlyOffer: 490000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Ponta Árbær",
    category: "1. deild",
    description: "Clube de Reykjavik leste.",
    contact: {
      email: "academy@fylkir.is",
      phone: "+354 567 1967",
      social: "@UMFFylkir"
    }
  },
  {
    id: "297",
    name: "Skála ÍF",
    country: "Ilhas Faroé",
    continent: "Europa",
    league: "1. deild",
    logo: "🟡🔵",
    founded: 1965,
    players: 17,
    monthlyOffer: 18000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Volante remoto",
    category: "1. deild",
    description: "Clube das ilhas remotas.",
    contact: {
      email: "academy@skala.fo",
      phone: "+298 223344",
      social: "@SkalaIF"
    }
  },
  {
    id: "298",
    name: "Lions Gibraltar",
    country: "Gibraltar",
    continent: "Europa",
    league: "National League",
    logo: "🟡🔴",
    founded: 2019,
    players: 16,
    monthlyOffer: 4300,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Atacante leão",
    category: "National League",
    description: "Clube jovem e ambicioso.",
    contact: {
      email: "academy@lionsgibraltar.com",
      phone: "+350 200 72200",
      social: "@LionsGibraltar"
    }
  },
  {
    id: "299",
    name: "Gudja United",
    country: "Malta",
    continent: "Europa",
    league: "Premier League",
    logo: "🔴⚪",
    founded: 1946,
    players: 19,
    monthlyOffer: 4650,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Meia sul Malta",
    category: "Premier League",
    description: "Clube do sul maltês em crescimento.",
    contact: {
      email: "academy@gudjaunited.com",
      phone: "+356 2168 2168",
      social: "@GudjaUnited"
    }
  },
  {
    id: "300",
    name: "Ballymena United",
    country: "Irlanda do Norte",
    continent: "Europa",
    league: "Premiership",
    logo: "🔵⚪",
    founded: 1928,
    players: 20,
    monthlyOffer: 4750,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Zagueiro Sky Blues",
    category: "Premiership",
    description: "Sky Blues de County Antrim.",
    contact: {
      email: "academy@ballymenaunitedfc.com",
      phone: "+44 28 2565 2614",
      social: "@Ballymena_Utd"
    }
  },
  {
    id: "301",
    name: "Galway United",
    country: "Irlanda",
    continent: "Europa",
    league: "First Division",
    logo: "🔴⚫",
    founded: 1937,
    players: 20,
    monthlyOffer: 4600,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Atacante oeste Irlanda",
    category: "First Division",
    description: "Tribesmen do oeste irlandês.",
    contact: {
      email: "academy@galwayunitedfc.ie",
      phone: "+353 91 123456",
      social: "@GalwayUnitedFC"
    }
  },
  {
    id: "302",
    name: "Aberystwyth Town",
    country: "País de Gales",
    continent: "Europa",
    league: "Cymru Premier",
    logo: "🟢⚫",
    founded: 1884,
    players: 18,
    monthlyOffer: 4200,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Volante Ceredigion",
    category: "Cymru Premier",
    description: "Seasiders do centro-oeste galês.",
    contact: {
      email: "academy@aberystwythtownfc.co.uk",
      phone: "+44 1970 617617",
      social: "@AberTownFC"
    }
  },
  {
    id: "303",
    name: "Keflavík",
    country: "Islândia",
    continent: "Europa",
    league: "1. deild",
    logo: "🔵⚪",
    founded: 1929,
    players: 19,
    monthlyOffer: 480000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Lateral aeroporto",
    category: "1. deild",
    description: "Clube da cidade do aeroporto.",
    contact: {
      email: "academy@keflavik.is",
      phone: "+354 421 4200",
      social: "@KeflavikFootball"
    }
  },
  {
    id: "304",
    name: "AB Argir",
    country: "Ilhas Faroé",
    continent: "Europa",
    league: "1. deild",
    logo: "🟡⚫",
    founded: 1973,
    players: 17,
    monthlyOffer: 17500,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Meia suburbano",
    category: "1. deild",
    description: "Clube suburbano de Tórshavn.",
    contact: {
      email: "academy@ab.fo",
      phone: "+298 317373",
      social: "@ABArgir"
    }
  },
  {
    id: "305",
    name: "FC Olympia",
    country: "Gibraltar",
    continent: "Europa",
    league: "National League",
    logo: "🟢⚪",
    founded: 1995,
    players: 16,
    monthlyOffer: 4200,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Ponta pequeno país",
    category: "National League",
    description: "Clube gibraltino emergente.",
    contact: {
      email: "academy@fcolympia.com",
      phone: "+350 200 71100",
      social: "@FCOlympia"
    }
  },
  {
    id: "306",
    name: "Sirens FC",
    country: "Malta",
    continent: "Europa",
    league: "Premier League",
    logo: "🔵🟡",
    founded: 1968,
    players: 18,
    monthlyOffer: 4600,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Volante St Paul's",
    category: "Premier League",
    description: "Clube de St Paul's Bay.",
    contact: {
      email: "academy@sirensfc.com",
      phone: "+356 2157 2157",
      social: "@SirensFC"
    }
  },
  {
    id: "307",
    name: "Dungannon Swifts",
    country: "Irlanda do Norte",
    continent: "Europa",
    league: "Premiership",
    logo: "🔵⚪",
    founded: 1949,
    players: 19,
    monthlyOffer: 4700,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Atacante Tyrone",
    category: "Premiership",
    description: "Swifts de County Tyrone.",
    contact: {
      email: "academy@dungannonswifts.com",
      phone: "+44 28 8772 7777",
      social: "@DswifsFC"
    }
  },
  {
    id: "308",
    name: "Longford Town",
    country: "Irlanda",
    continent: "Europa",
    league: "First Division",
    logo: "🔴⚫",
    founded: 1924,
    players: 19,
    monthlyOffer: 4550,
    currency: "€",
    openPositions: 5,
    preferredStyle: "Zagueiro midlands",
    category: "First Division",
    description: "Town do centro da Irlanda.",
    contact: {
      email: "academy@ltfc.ie",
      phone: "+353 43 334 5678",
      social: "@LongfordTownFC"
    }
  },
  {
    id: "309",
    name: "Llandudno FC",
    country: "País de Gales",
    continent: "Europa",
    league: "Cymru North",
    logo: "🔵⚪",
    founded: 1878,
    players: 17,
    monthlyOffer: 4100,
    currency: "£",
    openPositions: 5,
    preferredStyle: "Lateral balneário",
    category: "Cymru North",
    description: "Seasiders do norte galês.",
    contact: {
      email: "academy@llandudnofc.com",
      phone: "+44 1492 876876",
      social: "@LlandudnoFC"
    }
  },
  {
    id: "310",
    name: "Afturelding",
    country: "Islândia",
    continent: "Europa",
    league: "1. deild",
    logo: "🔴🔵",
    founded: 1909,
    players: 18,
    monthlyOffer: 470000,
    currency: "kr",
    openPositions: 5,
    preferredStyle: "Volante Mosfellsbær",
    category: "1. deild",
    description: "Clube de Mosfellsbær.",
    contact: {
      email: "academy@afturelding.is",
      phone: "+354 566 6800",
      social: "@Afturelding"
    }
  }
];

// Brazilian clubs - Série A and B
const brazilianClubs: Club[] = [
  { id: "br1", name: "Flamengo", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "🔴⚫", founded: 1895, players: 32, monthlyOffer: 18000, currency: "R$", openPositions: 4, preferredStyle: "Atacante veloz", category: "Série A", description: "Maior torcida do Brasil, centro de formação de elite.", contact: { email: "base@flamengo.com.br", phone: "+55 21 3333-3333", social: "@Flamengo" }},
  { id: "br2", name: "Palmeiras", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "🟢⚪", founded: 1914, players: 30, monthlyOffer: 17000, currency: "R$", openPositions: 3, preferredStyle: "Meia criativo", category: "Série A", description: "Maior campeão nacional com base forte.", contact: { email: "base@palmeiras.com.br", phone: "+55 11 3333-3333", social: "@Palmeiras" }},
  { id: "br3", name: "São Paulo FC", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "🔴⚪⚫", founded: 1930, players: 30, monthlyOffer: 16000, currency: "R$", openPositions: 3, preferredStyle: "Zagueiro técnico", category: "Série A", description: "Tricolor paulista, referência em revelação de talentos.", contact: { email: "base@saopaulofc.net", phone: "+55 11 3333-3334", social: "@SaoPauloFC" }},
  { id: "br4", name: "Corinthians", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "⚫⚪", founded: 1910, players: 31, monthlyOffer: 16000, currency: "R$", openPositions: 4, preferredStyle: "Volante combativo", category: "Série A", description: "Timão, tradição e paixão popular.", contact: { email: "base@corinthians.com.br", phone: "+55 11 3333-3335", social: "@Corinthians" }},
  { id: "br5", name: "Santos FC", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "⚪⚫", founded: 1912, players: 28, monthlyOffer: 15000, currency: "R$", openPositions: 3, preferredStyle: "Ponta habilidoso", category: "Série A", description: "O clube que revelou Pelé e Neymar.", contact: { email: "base@santosfc.com.br", phone: "+55 13 3333-3333", social: "@SantosFC" }},
  { id: "br6", name: "Fluminense", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "🟢🔴⚪", founded: 1902, players: 29, monthlyOffer: 14000, currency: "R$", openPositions: 3, preferredStyle: "Meia armador", category: "Série A", description: "Tricolor carioca, escola de futebol.", contact: { email: "base@fluminense.com.br", phone: "+55 21 3333-3334", social: "@FluminenseFC" }},
  { id: "br7", name: "Vasco da Gama", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "⚫⚪", founded: 1898, players: 28, monthlyOffer: 13000, currency: "R$", openPositions: 4, preferredStyle: "Lateral ofensivo", category: "Série A", description: "Gigante carioca com tradição em base.", contact: { email: "base@vasco.com.br", phone: "+55 21 3333-3335", social: "@VascodaGama" }},
  { id: "br8", name: "Grêmio", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "🔵⚫⚪", founded: 1903, players: 30, monthlyOffer: 15000, currency: "R$", openPositions: 3, preferredStyle: "Atacante de área", category: "Série A", description: "Imortal tricolor gaúcho.", contact: { email: "base@gremio.net", phone: "+55 51 3333-3333", social: "@Gremio" }},
  { id: "br9", name: "Internacional", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "🔴⚪", founded: 1909, players: 30, monthlyOffer: 15000, currency: "R$", openPositions: 3, preferredStyle: "Meio-campo box-to-box", category: "Série A", description: "Colorado gaúcho, campeão mundial.", contact: { email: "base@internacional.com.br", phone: "+55 51 3333-3334", social: "@SCInternacional" }},
  { id: "br10", name: "Atlético Mineiro", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "⚫⚪", founded: 1908, players: 29, monthlyOffer: 15000, currency: "R$", openPositions: 3, preferredStyle: "Ponta veloz", category: "Série A", description: "Galo forte, tradição mineira.", contact: { email: "base@atletico.com.br", phone: "+55 31 3333-3333", social: "@Atletico" }},
  { id: "br11", name: "Cruzeiro", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "🔵⚪", founded: 1921, players: 28, monthlyOffer: 14000, currency: "R$", openPositions: 4, preferredStyle: "Volante técnico", category: "Série A", description: "Raposa celeste, gigante de Minas.", contact: { email: "base@cruzeiro.com.br", phone: "+55 31 3333-3334", social: "@Cruzeiro" }},
  { id: "br12", name: "Botafogo", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "⚫⚪", founded: 1904, players: 28, monthlyOffer: 14000, currency: "R$", openPositions: 3, preferredStyle: "Meia-atacante", category: "Série A", description: "Estrela solitária, berço de craques.", contact: { email: "base@botafogo.com.br", phone: "+55 21 3333-3336", social: "@Botafogo" }},
  { id: "br13", name: "Athletico Paranaense", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "🔴⚫", founded: 1924, players: 28, monthlyOffer: 13000, currency: "R$", openPositions: 3, preferredStyle: "Lateral moderno", category: "Série A", description: "Furacão, clube inovador do sul.", contact: { email: "base@athletico.com.br", phone: "+55 41 3333-3333", social: "@AthsleticoPR" }},
  { id: "br14", name: "Bahia", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "🔵🔴⚪", founded: 1931, players: 27, monthlyOffer: 12000, currency: "R$", openPositions: 3, preferredStyle: "Atacante técnico", category: "Série A", description: "Maior do Nordeste.", contact: { email: "base@esporteclubebahia.com.br", phone: "+55 71 3333-3333", social: "@ECBahia" }},
  { id: "br15", name: "Fortaleza", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "🔵🔴⚪", founded: 1918, players: 27, monthlyOffer: 12000, currency: "R$", openPositions: 4, preferredStyle: "Centroavante goleador", category: "Série A", description: "Leão do Pici em ascensão.", contact: { email: "base@fortalezaec.net", phone: "+55 85 3333-3333", social: "@FortalezaEC" }},
  { id: "br16", name: "Coritiba", country: "Brasil", continent: "América do Sul", league: "Série B", logo: "🟢⚪", founded: 1909, players: 26, monthlyOffer: 10000, currency: "R$", openPositions: 4, preferredStyle: "Zagueiro forte", category: "Série B", description: "Coxa-Branca, tradição paranaense.", contact: { email: "base@coritiba.com.br", phone: "+55 41 3333-3334", social: "@Coritiba" }},
  { id: "br17", name: "Sport Recife", country: "Brasil", continent: "América do Sul", league: "Série B", logo: "🔴⚫", founded: 1905, players: 26, monthlyOffer: 10000, currency: "R$", openPositions: 3, preferredStyle: "Meia versátil", category: "Série B", description: "Leão da Ilha do Retiro.", contact: { email: "base@sportrecife.com.br", phone: "+55 81 3333-3333", social: "@SportRecife" }},
  { id: "br18", name: "Ceará SC", country: "Brasil", continent: "América do Sul", league: "Série B", logo: "⚫⚪", founded: 1914, players: 26, monthlyOffer: 9000, currency: "R$", openPositions: 3, preferredStyle: "Lateral rápido", category: "Série B", description: "Vozão, orgulho cearense.", contact: { email: "base@cearasc.com", phone: "+55 85 3333-3334", social: "@CearaSC" }},
  { id: "br19", name: "Ponte Preta", country: "Brasil", continent: "América do Sul", league: "Série B", logo: "⚫⚪", founded: 1900, players: 25, monthlyOffer: 9000, currency: "R$", openPositions: 4, preferredStyle: "Volante combativo", category: "Série B", description: "Macaca, tradição campineira.", contact: { email: "base@pontepreta.com.br", phone: "+55 19 3333-3333", social: "@aaboraPontePreta" }},
  { id: "br20", name: "Guarani FC", country: "Brasil", continent: "América do Sul", league: "Série B", logo: "🟢⚪", founded: 1911, players: 25, monthlyOffer: 8500, currency: "R$", openPositions: 4, preferredStyle: "Ponta driblador", category: "Série B", description: "Bugre, único campeão brasileiro da Série B.", contact: { email: "base@guaranifc.com.br", phone: "+55 19 3333-3334", social: "@GuaraniFC" }},
  { id: "br21", name: "Vitória", country: "Brasil", continent: "América do Sul", league: "Série B", logo: "🔴⚫", founded: 1899, players: 26, monthlyOffer: 10000, currency: "R$", openPositions: 3, preferredStyle: "Atacante potente", category: "Série B", description: "Leão da Barra, tradição baiana.", contact: { email: "base@ecvitoria.com.br", phone: "+55 71 3333-3334", social: "@ECVitoria" }},
  { id: "br22", name: "Náutico", country: "Brasil", continent: "América do Sul", league: "Série B", logo: "🔴⚪", founded: 1901, players: 25, monthlyOffer: 9000, currency: "R$", openPositions: 3, preferredStyle: "Meia criativo", category: "Série B", description: "Timbu, tradição pernambucana.", contact: { email: "base@nautico-pe.com.br", phone: "+55 81 3333-3334", social: "@NauticoPE" }},
  { id: "br23", name: "Chapecoense", country: "Brasil", continent: "América do Sul", league: "Série B", logo: "🟢⚪", founded: 1973, players: 25, monthlyOffer: 9000, currency: "R$", openPositions: 4, preferredStyle: "Goleiro seguro", category: "Série B", description: "Verdão do Oeste, superação e garra.", contact: { email: "base@chapecoense.com", phone: "+55 49 3333-3333", social: "@ChapecoenseReal" }},
  { id: "br24", name: "Goiás", country: "Brasil", continent: "América do Sul", league: "Série B", logo: "🟢⚪", founded: 1943, players: 26, monthlyOffer: 10000, currency: "R$", openPositions: 3, preferredStyle: "Centroavante oportunista", category: "Série B", description: "Esmeraldino, tradição goiana.", contact: { email: "base@goiasec.com.br", phone: "+55 62 3333-3333", social: "@GoiasEC" }},
  { id: "br25", name: "Juventude", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "🟢⚪", founded: 1913, players: 26, monthlyOffer: 11000, currency: "R$", openPositions: 4, preferredStyle: "Meia versátil", category: "Série A", description: "Papo, revelador de talentos gaúchos.", contact: { email: "base@juventude.com.br", phone: "+55 54 3333-3333", social: "@ECJuventude" }},
  { id: "br26", name: "Cuiabá", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "🟢🟡", founded: 2001, players: 26, monthlyOffer: 11000, currency: "R$", openPositions: 3, preferredStyle: "Lateral ofensivo", category: "Série A", description: "Dourado, novo no cenário nacional.", contact: { email: "base@cuiabaec.com.br", phone: "+55 65 3333-3333", social: "@CuiabaEC" }},
  { id: "br27", name: "Bragantino", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "🔴⚪", founded: 1928, players: 27, monthlyOffer: 14000, currency: "R$", openPositions: 3, preferredStyle: "Meia-atacante dinâmico", category: "Série A", description: "Massa Bruta, projeto moderno.", contact: { email: "base@rfrbbragantino.com.br", phone: "+55 11 3333-3336", social: "@RedBullBraga" }},
  { id: "br28", name: "América Mineiro", country: "Brasil", continent: "América do Sul", league: "Série B", logo: "🟢⚫", founded: 1912, players: 25, monthlyOffer: 9500, currency: "R$", openPositions: 4, preferredStyle: "Ponta rápido", category: "Série B", description: "Coelho, tradição mineira.", contact: { email: "base@americamineiro.com.br", phone: "+55 31 3333-3335", social: "@AmericaMG" }},
  { id: "br29", name: "Criciúma", country: "Brasil", continent: "América do Sul", league: "Série B", logo: "🟡⚫", founded: 1947, players: 25, monthlyOffer: 9000, currency: "R$", openPositions: 3, preferredStyle: "Volante distribuidor", category: "Série B", description: "Tigre, campeão da Copa do Brasil.", contact: { email: "base@criciuma.com.br", phone: "+55 48 3333-3333", social: "@CriciumaEC" }},
  { id: "br30", name: "Avaí FC", country: "Brasil", continent: "América do Sul", league: "Série B", logo: "🔵⚪", founded: 1923, players: 25, monthlyOffer: 8500, currency: "R$", openPositions: 4, preferredStyle: "Zagueiro alto", category: "Série B", description: "Leão da Ilha, tradição catarinense.", contact: { email: "base@avai.com.br", phone: "+55 48 3333-3334", social: "@AvaiFC" }},
  { id: "br31", name: "Operário-PR", country: "Brasil", continent: "América do Sul", league: "Série B", logo: "⚫⚪", founded: 1912, players: 24, monthlyOffer: 8000, currency: "R$", openPositions: 4, preferredStyle: "Atacante rápido", category: "Série B", description: "Fantasma, força do interior paranaense.", contact: { email: "base@operariopr.com", phone: "+55 42 3333-3333", social: "@OFEC_Oficial" }},
  { id: "br32", name: "Vila Nova", country: "Brasil", continent: "América do Sul", league: "Série B", logo: "🔴⚪", founded: 1943, players: 24, monthlyOffer: 8500, currency: "R$", openPositions: 3, preferredStyle: "Meia de ligação", category: "Série B", description: "Tigrão goiano.", contact: { email: "base@vilanova.com.br", phone: "+55 62 3333-3334", social: "@VilaNovaFC" }},
  { id: "br33", name: "Ituano", country: "Brasil", continent: "América do Sul", league: "Série B", logo: "🔴⚫", founded: 1947, players: 24, monthlyOffer: 8000, currency: "R$", openPositions: 4, preferredStyle: "Lateral versátil", category: "Série B", description: "Galo de Itu, revelador paulista.", contact: { email: "base@ituanofc.com.br", phone: "+55 11 3333-3337", social: "@ItuanoFC" }},
  { id: "br34", name: "Mirassol", country: "Brasil", continent: "América do Sul", league: "Série A", logo: "🟡🟢", founded: 1925, players: 25, monthlyOffer: 11000, currency: "R$", openPositions: 3, preferredStyle: "Centroavante técnico", category: "Série A", description: "Leão do interior paulista em ascensão.", contact: { email: "base@mirassolfc.com.br", phone: "+55 17 3333-3333", social: "@MirassolFC" }},
  { id: "br35", name: "Sport Club do Recife", country: "Brasil", continent: "América do Sul", league: "Série B", logo: "🔴⚫", founded: 1905, players: 25, monthlyOffer: 10000, currency: "R$", openPositions: 3, preferredStyle: "Ponta driblador", category: "Série B", description: "Tradição no Nordeste.", contact: { email: "base@sportrecife.com.br", phone: "+55 81 3333-3335", social: "@sportrecife" }},
];

export const allClubs = [...clubsDatabase];
export const allBrazilianClubs = [...brazilianClubs];

export const getAllClubs = (): Club[] => {
  return [...clubsDatabase, ...brazilianClubs];
};

export const getRandomClub = (usedClubIds: string[] = []): Club => {
  const all = [...clubsDatabase, ...brazilianClubs];
  const available = all.filter(club => !usedClubIds.includes(club.id));
  const toUse = available.length > 0 ? available : all;
  return toUse[Math.floor(Math.random() * toUse.length)];
};

export const getRandomBrazilianClub = (usedClubIds: string[] = []): Club => {
  const available = brazilianClubs.filter(club => !usedClubIds.includes(club.id));
  const toUse = available.length > 0 ? available : brazilianClubs;
  return toUse[Math.floor(Math.random() * toUse.length)];
};

export const getClubsByContinent = (continent: string): Club[] => {
  return getAllClubs().filter(club => club.continent.toLowerCase() === continent.toLowerCase());
};

export const getClubsByCountry = (country: string): Club[] => {
  return getAllClubs().filter(club => club.country.toLowerCase() === country.toLowerCase());
};

export const TOTAL_CLUBS = clubsDatabase.length + brazilianClubs.length;