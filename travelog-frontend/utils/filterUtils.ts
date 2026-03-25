import type { TravelLog } from "@/types/travel";
import type { FilterState } from "@/types/filter";

/**
 * 여행 기록을 필터링하는 메인 함수
 */
export function filterTravelLogs(
  logs: TravelLog[],
  filters: FilterState
): TravelLog[] {
  let filtered = [...logs];

  // 1. 감정 필터
  if (filters.emotions.length > 0) {
    filtered = filtered.filter((log) => filters.emotions.includes(log.emotion));
  }

  // 2. 기간 필터
  if (filters.dateRange.start || filters.dateRange.end) {
    filtered = filtered.filter((log) => {
      const logDate = new Date(log.createdAt);
      const startDate = filters.dateRange.start
        ? new Date(filters.dateRange.start)
        : null;
      const endDate = filters.dateRange.end
        ? new Date(filters.dateRange.end)
        : null;

      if (startDate && endDate) {
        return logDate >= startDate && logDate <= endDate;
      } else if (startDate) {
        return logDate >= startDate;
      } else if (endDate) {
        return logDate <= endDate;
      }
      return true;
    });
  }

  // 3. 태그 필터 (AND 조건 - 선택된 모든 태그를 포함해야 함)
  if (filters.tags.length > 0) {
    filtered = filtered.filter((log) => {
      // 태그에서 # 제거 후 비교
      const cleanLogTags = log.tags.map((tag) => tag.replace(/^#/, ""));
      const cleanFilterTags = filters.tags.map((tag) => tag.replace(/^#/, ""));

      // 선택된 모든 태그가 포함되어야 함
      return cleanFilterTags.every((filterTag) =>
        cleanLogTags.includes(filterTag)
      );
    });
  }

  // 4. 국가 필터
  if (filters.countries.length > 0) {
    filtered = filtered.filter((log) =>
      filters.countries.includes(log.country)
    );
  }

  return filtered;
}

/**
 * 모든 고유 태그 추출 (# 제거)
 */
export function getUniqueTags(logs: TravelLog[]): string[] {
  const tagsSet = new Set<string>();
  logs.forEach((log) => {
    log.tags.forEach((tag) => {
      const cleanTag = tag.replace(/^#/, "");
      tagsSet.add(cleanTag);
    });
  });
  return Array.from(tagsSet).sort();
}

/**
 * 모든 고유 국가 추출
 */
export function getUniqueCountries(logs: TravelLog[]): string[] {
  const countriesSet = new Set<string>();
  logs.forEach((log) => {
    if (log.country) {
      countriesSet.add(log.country);
    }
  });
  return Array.from(countriesSet).sort();
}

/**
 * 필터가 활성화되어 있는지 확인
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.emotions.length > 0 ||
    filters.tags.length > 0 ||
    filters.countries.length > 0 ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null
  );
}

/**
 * 필터 결과 통계
 */
export function getFilterStats(
  originalCount: number,
  filteredCount: number
): {
  filtered: number;
  total: number;
  percentage: number;
} {
  return {
    filtered: filteredCount,
    total: originalCount,
    percentage:
      originalCount > 0 ? Math.round((filteredCount / originalCount) * 100) : 0,
  };
}
