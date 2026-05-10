import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTalentSearch } from "@/hooks/useTalentSearch";
import { Search, Loader2, MapPin, Award } from "lucide-react";
import { Link } from "react-router-dom";

export function AdminTalentSourcing() {
  const [keyword, setKeyword] = useState("");
  const [country, setCountry] = useState("");
  const [filters, setFilters] = useState<{ keyword?: string; country?: string }>({});
  const { data, isLoading } = useTalentSearch(filters, 0, 50);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Sourcing & Lists (Admin)</h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide talent search and oversight.
        </p>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-2">
        <div className="flex-1 flex gap-2 items-center">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <Input
          placeholder="Country (e.g. BD)"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="md:w-40"
        />
        <Button
          onClick={() =>
            setFilters({ keyword: keyword || undefined, country: country || undefined })
          }
        >
          Search
        </Button>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <p className="text-xs text-muted-foreground">{data?.total ?? 0} talents</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data?.rows.map((t) => (
          <Card key={t.id} className="p-3 space-y-2">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={t.profile_photo_url ?? undefined} />
                <AvatarFallback>{t.full_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{t.full_name}</p>
                {t.custom_profession && (
                  <p className="text-xs text-muted-foreground truncate">
                    {t.custom_profession}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {t.country && (
                    <span className="text-[11px] inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {t.country}
                    </span>
                  )}
                  {t.verified_skills > 0 && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Award className="h-3 w-3" /> {t.verified_skills}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {t.public_handle && (
              <Link
                to={`/t/${t.public_handle}`}
                className="text-xs text-primary"
                target="_blank"
              >
                View profile →
              </Link>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

export default AdminTalentSourcing;
