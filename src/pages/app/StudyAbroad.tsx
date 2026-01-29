import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, MapPin, Calendar, DollarSign, ArrowLeft, Search, Award, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { COUNTRIES, getCountryFlag } from "@/lib/constants/countries";

// Filter for study abroad popular countries
const STUDY_COUNTRIES = COUNTRIES.filter(c =>
  ["US", "UK", "CA", "AU", "DE", "SG", "JP", "SE", "NL", "MY"].includes(c.code)
);

const DEGREE_TYPES = ["All Degrees", "Bachelor", "Master", "PhD", "Diploma"];

// --- INLINE HOOK: useDebounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function StudyAbroad() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Initialize state from URL params
  const initialCountry = searchParams.get("country") || "all";
  const initialDegree = searchParams.get("degree") || "All Degrees";
  const initialSearch = searchParams.get("search") || "";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [selectedDegree, setSelectedDegree] = useState(initialDegree);

  // 2. Debounce Search Term (500ms delay)
  const debouncedSearch = useDebounce(searchTerm, 500);

  // 3. Sync state changes back to URL (using debounced value)
  useEffect(() => {
    const params: any = {};
    if (selectedCountry !== "all") params.country = selectedCountry;
    if (selectedDegree !== "All Degrees") params.degree = selectedDegree;
    if (debouncedSearch) params.search = debouncedSearch;
    setSearchParams(params, { replace: true });
  }, [selectedCountry, selectedDegree, debouncedSearch, setSearchParams]);

  const { data: programs, isLoading } = useQuery({
    queryKey: ["study-abroad-programs", selectedCountry, selectedDegree, debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from("study_abroad_programs")
        .select("*")
        .eq("is_active", true)
        .order("featured", { ascending: false })
        .order("university_name");

      if (selectedCountry !== "all") {
        query = query.eq("country_code", selectedCountry);
      }
      if (selectedDegree !== "All Degrees") {
        query = query.eq("degree_type", selectedDegree);
      }
      if (debouncedSearch) {
        // Safe search across multiple columns
        query = query.or(
          `university_name.ilike.%${debouncedSearch}%,program_name.ilike.%${debouncedSearch}%,field_of_study.ilike.%${debouncedSearch}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCountry("all");
    setSelectedDegree("All Degrees");
  };

  const activeFilterCount =
    (selectedCountry !== "all" ? 1 : 0) + (selectedDegree !== "All Degrees" ? 1 : 0) + (searchTerm ? 1 : 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/abroad")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Study Abroad</h1>
            <p className="text-muted-foreground text-sm">Explore top universities and programs</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border rounded-xl p-3 mb-6 shadow-sm sticky top-0 z-10">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search universities, programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background border-muted-foreground/20"
            />
          </div>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-full md:w-[180px] bg-background border-muted-foreground/20">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="flex items-center gap-2">
                  <span>🌍</span>
                  <span>All Countries</span>
                </span>
              </SelectItem>
              {STUDY_COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <span className="flex items-center gap-2">
                    <span>{getCountryFlag(country.code)}</span>
                    <span>{country.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDegree} onValueChange={setSelectedDegree}>
            <SelectTrigger className="w-full md:w-[150px] bg-background border-muted-foreground/20">
              <SelectValue placeholder="Degree type" />
            </SelectTrigger>
            <SelectContent>
              {DEGREE_TYPES.map((degree) => (
                <SelectItem key={degree} value={degree}>
                  {degree}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              title="Clear filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : programs && programs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {programs.map((program) => (
            <Card
              key={program.id}
              className="hover:shadow-md transition-all cursor-pointer group border-muted-foreground/20 hover:border-primary/50"
              onClick={() => navigate(`/app/abroad/study/${program.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-xl border">
                      {getCountryFlag(program.country_code)}
                    </div>
                    <div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-1">
                        {program.university_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {program.country_name}
                      </CardDescription>
                    </div>
                  </div>
                  {program.featured && (
                    <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20 shrink-0">
                      Featured
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-sm mb-3 line-clamp-1">{program.program_name}</h3>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {program.degree_type && (
                    <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                      <GraduationCap className="h-3 w-3" />
                      {program.degree_type}
                    </div>
                  )}
                  {program.duration && (
                    <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                      <Calendar className="h-3 w-3" />
                      {program.duration}
                    </div>
                  )}
                  {program.tuition_range && (
                    <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                      <DollarSign className="h-3 w-3" />
                      {program.tuition_range}
                    </div>
                  )}
                </div>

                {program.scholarship_available && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <Award className="h-3.5 w-3.5" />
                    Scholarship Available
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-12 border-dashed">
          <CardContent className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No programs found</h3>
            <p className="text-muted-foreground mb-4 max-w-xs mx-auto">
              We couldn't find any programs matching your filters. Try adjusting your search criteria.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
