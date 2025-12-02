import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Video, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Sessions() {
  const navigate = useNavigate();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_sessions")
        .select(`
          *,
          content:content_id (
            id,
            title,
            slug
          ),
          instructors:instructor_id (
            id,
            full_name,
            profile_image_url
          )
        `)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "scheduled":
        return "default";
      case "ongoing":
        return "secondary";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500";
      case "ongoing":
        return "bg-green-500";
      case "completed":
        return "bg-muted";
      case "cancelled":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-muted-foreground">Loading sessions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Course Sessions</h1>
          <p className="text-muted-foreground">
            Manage live sessions, meetings, and recordings
          </p>
        </div>
        <Button onClick={() => navigate("/sessions/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Session
        </Button>
      </div>

      {!sessions || sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No sessions scheduled</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first course session
            </p>
            <Button onClick={() => navigate("/sessions/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/sessions/${session.id}/edit`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`} />
                      <Badge variant={getStatusVariant(session.status)}>
                        {session.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mb-1">{session.title}</CardTitle>
                    <CardDescription>
                      {session.content?.title || "Course not found"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {format(new Date(session.scheduled_date), "PPP 'at' p")}
                    </span>
                  </div>

                  {session.duration_minutes && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{session.duration_minutes} minutes</span>
                    </div>
                  )}

                  {session.instructors && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{session.instructors.full_name}</span>
                    </div>
                  )}

                  {session.meeting_link && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Video className="h-4 w-4" />
                      <span>Meeting link available</span>
                    </div>
                  )}

                  {session.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {session.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
