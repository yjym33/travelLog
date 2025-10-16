export interface FilterState {
  emotions: string[]; // 선택된 감정들
  dateRange: {
    start: string | null; // YYYY-MM-DD
    end: string | null; // YYYY-MM-DD
  };
  tags: string[]; // 선택된 태그들
  countries: string[]; // 선택된 국가들
}

export const initialFilterState: FilterState = {
  emotions: [],
  dateRange: {
    start: null,
    end: null,
  },
  tags: [],
  countries: [],
};

// 대륙별 국가 매핑
export const continentMapping: Record<string, string[]> = {
  아시아: ["South Korea", "Japan", "China", "Thailand", "Vietnam", "Singapore"],
  유럽: ["France", "Italy", "Spain", "Germany", "United Kingdom", "Greece"],
  북미: ["United States", "Canada", "Mexico"],
  남미: ["Brazil", "Argentina", "Chile", "Peru"],
  오세아니아: ["Australia", "New Zealand"],
  아프리카: ["South Africa", "Egypt", "Kenya", "Morocco"],
};

export const getCountriesByContinent = (continent: string): string[] => {
  return continentMapping[continent] || [];
};

export const getContinentByCountry = (country: string): string | null => {
  for (const [continent, countries] of Object.entries(continentMapping)) {
    if (countries.includes(country)) {
      return continent;
    }
  }
  return null;
};
