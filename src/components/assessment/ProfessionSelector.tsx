import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { getIcon } from "@/lib/iconMap";

interface ProfessionCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

interface ProfessionSelectorProps {
  categories: ProfessionCategory[];
  onSelect: (category: ProfessionCategory) => void;
  onBack: () => void;
}

export function ProfessionSelector({ categories, onSelect, onBack }: ProfessionSelectorProps) {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-3">Select Your Profession</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Choose the category that best matches your career field for tailored assessment questions
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const IconComponent = getIcon(category.icon);
          
          return (
            <Card
              key={category.id}
              className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
              onClick={() => onSelect(category)}
            >
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                  <IconComponent className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {category.description || `Assessment tailored for ${category.name} professionals`}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
