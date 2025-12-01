import { GraduationCap, Calendar, Award, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface ReportData {
  student: {
    full_name: string;
    student_id: string;
    email: string;
  };
  content: {
    title: string;
    content_type: string;
  };
  quiz_attempt: {
    id: string;
    score: number;
    total_questions: number;
    passed: boolean;
    completed_at: string;
  };
  enrollment: {
    enrolled_at: string;
  };
}

interface ReportCardTemplateProps {
  data: ReportData;
}

export function ReportCardTemplate({ data }: ReportCardTemplateProps) {
  const percentage = Math.round((data.quiz_attempt.score / data.quiz_attempt.total_questions) * 100);

  return (
    <div id="report-card-content" className="space-y-8">
      {/* Header */}
      <div className="text-center border-b pb-6">
        <div className="flex items-center justify-center mb-4">
          <GraduationCap className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">GroUp Academy</h1>
        <h2 className="text-xl text-muted-foreground">Assessment Report Card</h2>
      </div>

      {/* Student Information */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Student Name</p>
          <p className="font-semibold text-lg">{data.student.full_name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Student ID</p>
          <p className="font-semibold text-lg">{data.student.student_id}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-semibold">{data.student.email}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Enrollment Date</p>
          <p className="font-semibold">{format(new Date(data.enrollment.enrolled_at), "PPP")}</p>
        </div>
      </div>

      {/* Course Information */}
      <div className="border-t pt-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Course Name</p>
          <p className="font-semibold text-xl">{data.content.title}</p>
        </div>
      </div>

      {/* Assessment Results */}
      <div className="border-t pt-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-4">
            {data.quiz_attempt.passed ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Assessment Score</p>
            <p className="text-5xl font-bold">{data.quiz_attempt.score}/{data.quiz_attempt.total_questions}</p>
            <p className="text-3xl font-semibold text-muted-foreground">{percentage}%</p>
          </div>

          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10">
            <Award className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">
              {data.quiz_attempt.passed ? "PASSED" : "NOT PASSED"}
            </span>
          </div>
        </div>
      </div>

      {/* Completion Date */}
      <div className="border-t pt-6 text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <p className="text-sm">
            Completed on {format(new Date(data.quiz_attempt.completed_at), "PPP")}
          </p>
        </div>
      </div>

      {/* Verification ID */}
      <div className="border-t pt-6 text-center">
        <p className="text-xs text-muted-foreground">
          Verification ID: {data.quiz_attempt.id}
        </p>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        <p>This is an official assessment report card issued by GroUp Academy</p>
        <p className="mt-1">© {new Date().getFullYear()} GroUp Academy. All rights reserved.</p>
      </div>
    </div>
  );
}
