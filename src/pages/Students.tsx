import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { 
  Search, 
  UserPlus, 
  Mail, 
  Phone, 
  Calendar,
  ArrowLeft,
  Filter
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  enrollments?: Array<{
    id: string;
    status: string;
    enrolled_at: string;
    content: {
      title: string;
      content_type: string;
    };
  }>;
}

const statusConfig = {
  lead: { label: "Lead", color: "bg-slate-500" },
  free_learner: { label: "Free Learner", color: "bg-blue-500" },
  enrolled: { label: "Enrolled", color: "bg-primary" },
  completed: { label: "Completed", color: "bg-green-500" },
  dropped: { label: "Dropped", color: "bg-destructive" },
};

export default function Students() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: queryError } = await withTimeout(
        Promise.resolve(
          supabase
            .from("students")
            .select(`
              *,
              enrollments(
                id,
                status,
                enrolled_at,
                content:content_id(title, content_type)
              )
            `)
            .order("created_at", { ascending: false })
        ).then(q => q),
        TIMEOUTS.DEFAULT,
        "Loading students timed out"
      );

      if (queryError) throw queryError;
      setStudents(data || []);
    } catch (err: any) {
      console.error("Error loading students:", err);
      setError(err.message || "Failed to load students");
      toast({
        title: "Error loading students",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || student.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-10 w-32 mb-4" />
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-5 w-96" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="mb-6 flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-4 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <ErrorState
            title="Failed to load students"
            description={error}
            onRetry={loadStudents}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Students CRM</h1>
              <p className="text-muted-foreground">
                Manage your learners and track their progress
              </p>
            </div>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>
        </div>

        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or student ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="enrolled">Enrolled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="dropped">Dropped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredStudents.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No students found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">
                        {student.full_name}
                      </h3>
                      <Badge className={statusConfig[student.status as keyof typeof statusConfig]?.color || "bg-muted"}>
                        {statusConfig[student.status as keyof typeof statusConfig]?.label || student.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ID: {student.student_id}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{student.email}</span>
                  </div>
                  {student.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{student.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Joined {new Date(student.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {student.enrollments && student.enrollments.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Enrollment History</h4>
                    <div className="space-y-2">
                      {student.enrollments.map((enrollment: any) => (
                        <div
                          key={enrollment.id}
                          className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded"
                        >
                          <div>
                            <span className="font-medium">
                              {enrollment.content.title}
                            </span>
                            <span className="text-muted-foreground ml-2">
                              ({enrollment.content.content_type})
                            </span>
                          </div>
                          <Badge variant="outline">{enrollment.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
