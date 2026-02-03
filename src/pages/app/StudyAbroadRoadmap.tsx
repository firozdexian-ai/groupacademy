import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Map } from "lucide-react";
import { RoadmapIntakeForm } from "@/components/abroad/RoadmapIntakeForm";

export default function StudyAbroadRoadmap() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/abroad")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">AI Study Abroad Roadmap</h1>
          </div>
          <p className="text-sm text-muted-foreground">Get a personalized 12-month application plan</p>
        </div>
      </div>

      {/* Intake Form */}
      <RoadmapIntakeForm />
    </div>
  );
}
