interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
}

interface IBGECity {
  id: number;
  nome: string;
  microrregiao: {
    mesorregiao: {
      UF: {
        id: number;
        sigla: string;
        nome: string;
      };
    };
  };
}

let brazilianCities: string[] = [];
let citiesLoaded = false;

// Injetar RAs do DF de forma global para garantir que sempre estejam na lista
const dfRegions = [
  "Plano Piloto - DF", "Asa Sul - DF", "Asa Norte - DF", "Gama - DF", "Taguatinga - DF",
  "Brazlândia - DF", "Sobradinho - DF", "Planaltina - DF", "Paranoá - DF",
  "Núcleo Bandeirante - DF", "Ceilândia - DF", "Guará - DF", "Cruzeiro - DF",
  "Samambaia - DF", "Santa Maria - DF", "São Sebastião - DF", "Recanto das Emas - DF",
  "Lago Sul - DF", "Riacho Fundo - DF", "Lago Norte - DF", "Candangolândia - DF",
  "Águas Claras - DF", "Riacho Fundo II - DF", "Sudoeste/Octogonal - DF", "Varjão - DF",
  "Park Way - DF", "SCIA (Estrutural) - DF", "Sobradinho II - DF", "Jardim Botânico - DF",
  "Itapoã - DF", "SIA - DF", "Vicente Pires - DF", "Fercal - DF",
  "Sol Nascente/Pôr do Sol - DF", "Arniqueira - DF", "Arapoanga - DF", "Água Quente - DF"
];

export const loadBrazilianCities = async (): Promise<string[]> => {
  if (citiesLoaded && brazilianCities.length > 0) {
    return brazilianCities;
  }

  // Formatting helper
  const formatCities = (cityList: any[]) => {
    // Handle different JSON structures from different sources
    return cityList.map(city => {
      if (city.microrregiao) { // IBGE format
        return `${city.nome} - ${city.microrregiao.mesorregiao.UF.sigla}`;
      } else if (city.estado) { // Alternative format
        return `${city.nome} - ${city.estado}`;
      }
      return city.nome || city;
    }).sort();
  };

  try {
    // Primary: Official IBGE API
    const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
    if (!response.ok) throw new Error("IBGE API unavailable");
    const cities = await response.json();
    brazilianCities = formatCities(cities);
  } catch (primaryError) {
    console.warn('IBGE API failed, trying secondary source...', primaryError);

    try {
      // Secondary fallback: Reliable GitHub raw list of BR cities
      const fallbackResponse = await fetch('https://raw.githubusercontent.com/felipefdl/cidades-estados-brasil-json/master/Cidades.json');
      const fallbackCitiesData = await fallbackResponse.json();

      // This specific gist just returns an array of objects with {Nome: string, Estado: string}
      brazilianCities = fallbackCitiesData.map((c: any) => `${c.Nome || c.nome}`).sort();
    } catch (secondaryError) {
      console.error('All APIs failed. Using emergency fallback.', secondaryError);
      // Emergency standard fallback just so it doesn't break
      brazilianCities = [
        "São Paulo - SP", "Rio de Janeiro - RJ", "Brasília - DF",
        "Salvador - BA", "Fortaleza - CE", "Belo Horizonte - MG",
        "Manaus - AM", "Curitiba - PR", "Recife - PE", "Porto Alegre - RS",
        "Campinas - SP", "Guarulhos - SP", "São Gonçalo - RJ", "Maceió - AL"
      ];
    }
  }

  // Merge DF Regions dynamically into the loaded cities
  brazilianCities = Array.from(new Set([...brazilianCities, ...dfRegions])).sort();
  citiesLoaded = true;

  return brazilianCities;
};

const removeAccents = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export const filterCities = async (query: string): Promise<string[]> => {
  if (!query.trim()) return [];

  const cities = await loadBrazilianCities();
  const normalizedQuery = removeAccents(query.toLowerCase().trim());

  return cities
    .filter(city =>
      removeAccents(city.toLowerCase()).includes(normalizedQuery)
    )
    .slice(0, 50); // Limit to 50 suggestions
};