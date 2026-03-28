"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  X,
  Calendar,
  Tag,
  MapPin,
  Smile,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { FilterState } from "@/types/filter";
import type { Emotion } from "@/types/travel";
import { continentMapping } from "@/types/filter";

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  emotions: Record<string, Emotion>;
  availableTags: string[];
  availableCountries: string[];
}

export default function FilterPanel({
  filters,
  onFiltersChange,
  emotions,
  availableTags,
  availableCountries,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // 활성 필터 개수 계산
  const activeFilterCount =
    filters.tags.length +
    filters.countries.length +
    (filters.dateRange.start || filters.dateRange.end ? 1 : 0);



  // 태그 필터 토글
  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  // 국가 필터 토글
  const toggleCountry = (country: string) => {
    const newCountries = filters.countries.includes(country)
      ? filters.countries.filter((c) => c !== country)
      : [...filters.countries, country];
    onFiltersChange({ ...filters, countries: newCountries });
  };

  // 대륙 전체 선택/해제
  const toggleContinent = (continent: string) => {
    const continentCountries = continentMapping[continent] || [];
    const allSelected = continentCountries.every((country) =>
      filters.countries.includes(country)
    );

    const newCountries = allSelected
      ? filters.countries.filter((c) => !continentCountries.includes(c))
      : [...new Set([...filters.countries, ...continentCountries])];

    onFiltersChange({ ...filters, countries: newCountries });
  };

  // 날짜 범위 변경
  const handleDateChange = (field: "start" | "end", value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: { ...filters.dateRange, [field]: value || null },
    });
  };

  // 모든 필터 초기화
  const clearAllFilters = () => {
    onFiltersChange({
      emotions: [], // Legacy 지원용으로 빈 배열 유지
      dateRange: { start: null, end: null },
      tags: [],
      countries: [],
    });
  };

  return (
    <div className="relative">
      {/* 필터 버튼 */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant={activeFilterCount > 0 ? "default" : "outline"}
        className="relative"
      >
        <Filter className="w-4 h-4 mr-2" />
        필터
        {activeFilterCount > 0 && (
          <Badge className="ml-2 bg-pink-500 hover:bg-pink-600">
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      {/* 필터 패널 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-[100]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* 필터 사이드 패널 */}
            <motion.div
              className="fixed right-0 top-0 h-screen w-full md:w-96 bg-slate-900 z-[110] overflow-y-auto shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="p-6">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-bold text-white">필터</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-slate-400 hover:text-white"
                      >
                        초기화
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* 활성 필터 요약 */}
                {activeFilterCount > 0 && (
                  <Card className="bg-slate-800/50 border-slate-700 p-4 mb-6">
                    <div className="text-sm text-slate-400 mb-2">
                      활성 필터 ({activeFilterCount})
                    </div>
                    <div className="flex flex-wrap gap-2">

                      {filters.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-blue-500/20 text-blue-300"
                        >
                          #{tag}
                          <button
                            onClick={() => toggleTag(tag)}
                            className="ml-1 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      {filters.countries.map((country) => (
                        <Badge
                          key={country}
                          variant="secondary"
                          className="bg-green-500/20 text-green-300"
                        >
                          {country}
                          <button
                            onClick={() => toggleCountry(country)}
                            className="ml-1 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      {(filters.dateRange.start || filters.dateRange.end) && (
                        <Badge
                          variant="secondary"
                          className="bg-pink-500/20 text-pink-300"
                        >
                          📅 {filters.dateRange.start || "시작"} ~{" "}
                          {filters.dateRange.end || "종료"}
                          <button
                            onClick={() =>
                              onFiltersChange({
                                ...filters,
                                dateRange: { start: null, end: null },
                              })
                            }
                            className="ml-1 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      )}
                    </div>
                  </Card>
                )}

                <div className="space-y-6">


                  {/* 2. 기간별 검색 */}
                  <Card className="bg-slate-800/50 border-slate-700 p-4">
                    <button
                      onClick={() =>
                        setActiveSection(
                          activeSection === "dateRange" ? null : "dateRange"
                        )
                      }
                      className="w-full flex items-center justify-between mb-3"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-pink-400" />
                        <h3 className="font-semibold text-white">기간</h3>
                        {(filters.dateRange.start || filters.dateRange.end) && (
                          <Badge className="bg-pink-500/20">설정됨</Badge>
                        )}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          activeSection === "dateRange" ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {activeSection === "dateRange" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-3"
                        >
                          <div>
                            <label className="text-sm text-slate-400 mb-1 block">
                              시작일
                            </label>
                            <Input
                              type="date"
                              value={filters.dateRange.start || ""}
                              onChange={(e) =>
                                handleDateChange("start", e.target.value)
                              }
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-slate-400 mb-1 block">
                              종료일
                            </label>
                            <Input
                              type="date"
                              value={filters.dateRange.end || ""}
                              onChange={(e) =>
                                handleDateChange("end", e.target.value)
                              }
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>

                  {/* 3. 태그 검색 */}
                  <Card className="bg-slate-800/50 border-slate-700 p-4">
                    <button
                      onClick={() =>
                        setActiveSection(
                          activeSection === "tags" ? null : "tags"
                        )
                      }
                      className="w-full flex items-center justify-between mb-3"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-blue-400" />
                        <h3 className="font-semibold text-white">태그</h3>
                        {filters.tags.length > 0 && (
                          <Badge className="bg-blue-500/20">
                            {filters.tags.length}
                          </Badge>
                        )}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          activeSection === "tags" ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {activeSection === "tags" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="flex flex-wrap gap-2"
                        >
                          {availableTags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              className={`px-3 py-1 rounded-full text-sm transition-all ${
                                filters.tags.includes(tag)
                                  ? "bg-blue-500 text-white"
                                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                              }`}
                            >
                              #{tag}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>

                  {/* 4. 국가/대륙별 필터 */}
                  <Card className="bg-slate-800/50 border-slate-700 p-4">
                    <button
                      onClick={() =>
                        setActiveSection(
                          activeSection === "countries" ? null : "countries"
                        )
                      }
                      className="w-full flex items-center justify-between mb-3"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-400" />
                        <h3 className="font-semibold text-white">국가</h3>
                        {filters.countries.length > 0 && (
                          <Badge className="bg-green-500/20">
                            {filters.countries.length}
                          </Badge>
                        )}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          activeSection === "countries" ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {activeSection === "countries" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-4"
                        >
                          {/* 대륙별 그룹 */}
                          {Object.entries(continentMapping).map(
                            ([continent, countries]) => {
                              const availableInContinent = countries.filter(
                                (c) => availableCountries.includes(c)
                              );
                              if (availableInContinent.length === 0)
                                return null;

                              const allSelected = availableInContinent.every(
                                (c) => filters.countries.includes(c)
                              );

                              return (
                                <div key={continent}>
                                  <button
                                    onClick={() => toggleContinent(continent)}
                                    className="w-full flex items-center justify-between mb-2 px-2 py-1 rounded hover:bg-slate-700/50"
                                  >
                                    <span className="text-sm font-medium text-slate-300">
                                      {continent}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={
                                        allSelected
                                          ? "bg-green-500/20 text-green-300"
                                          : ""
                                      }
                                    >
                                      {
                                        availableInContinent.filter((c) =>
                                          filters.countries.includes(c)
                                        ).length
                                      }
                                      /{availableInContinent.length}
                                    </Badge>
                                  </button>
                                  <div className="flex flex-wrap gap-2 ml-4">
                                    {availableInContinent.map((country) => (
                                      <button
                                        key={country}
                                        onClick={() => toggleCountry(country)}
                                        className={`px-3 py-1 rounded-full text-xs transition-all ${
                                          filters.countries.includes(country)
                                            ? "bg-green-500 text-white"
                                            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                        }`}
                                      >
                                        {country}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
