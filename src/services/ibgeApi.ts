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
    citiesLoaded = true;
    return brazilianCities;
  } catch (primaryError) {
    console.warn('IBGE API failed, trying secondary source...', primaryError);

    try {
      // Secondary fallback: Reliable GitHub raw list of BR cities
      const fallbackResponse = await fetch('https://raw.githubusercontent.com/felipefdl/cidades-estados-brasil-json/master/Cidades.json');
      const fallbackCitiesData = await fallbackResponse.json();

      // This specific gist just returns an array of objects with {Nome: string, Estado: string}
      brazilianCities = fallbackCitiesData.map((c: any) => `${c.Nome || c.nome}`).sort();
      citiesLoaded = true;
      return brazilianCities;
    } catch (secondaryError) {
      console.error('All APIs failed. Using emergency fallback.', secondaryError);
      // Emergency standard fallback just so it doesn't break
      const emergencyFallback = [
        "São Paulo - SP", "Rio de Janeiro - RJ", "Brasília - DF",
        "Salvador - BA", "Fortaleza - CE", "Belo Horizonte - MG",
        "Manaus - AM", "Curitiba - PR", "Recife - PE", "Porto Alegre - RS",
        "Campinas - SP", "Guarulhos - SP", "São Gonçalo - RJ", "Maceió - AL"
      ];
      brazilianCities = emergencyFallback;
      return emergencyFallback;
    }
  }
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