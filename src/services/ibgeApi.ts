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

  try {
    // Fetch all cities from IBGE API
    const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
    const cities: IBGECity[] = await response.json();

    // Format cities as "City - State"
    brazilianCities = cities.map(city =>
      `${city.nome} - ${city.microrregiao.mesorregiao.UF.sigla}`
    ).sort();

    citiesLoaded = true;
    return brazilianCities;
  } catch (error) {
    console.error('Error loading cities from IBGE API:', error);

    // Fallback to static cities if API fails
    const fallbackCities = [
      "São Paulo - SP",
      "Rio de Janeiro - RJ",
      "Brasília - DF",
      "Salvador - BA",
      "Fortaleza - CE",
      "Belo Horizonte - MG",
      "Manaus - AM",
      "Curitiba - PR",
      "Recife - PE",
      "Porto Alegre - RS"
    ];

    brazilianCities = fallbackCities;
    return fallbackCities;
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
    .slice(0, 8); // Limit to 8 suggestions
};