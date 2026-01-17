import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Eye, FileText, Trophy, Target, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface QuizAttempt {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  contentId: string;
  contentTitle: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  attemptedAt: string;
  answers: {
    questionId: string;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation?: string;
  }[];
}

export function QuizResultsViewer() {
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Fetch courses with quizzes
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["admin-quiz-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select("id, title")
        .eq("quiz_enabled", true)
        .eq("is_published", true)
        .order("title");

      if (error) throw error;
      return data;
    },
  });

  // Fetch quiz attempts - Note: This requires a student_quiz_attempts table to be created
  // For now, we'll return empty data until the table exists
  const { data: quizAttempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ["admin-quiz-attempts", selectedCourse],
    queryFn: async (): Promise<QuizAttempt[]> => {
      // Check if table exists by querying with a limit of 0
      // This is a placeholder - the actual table needs to be created via migration
      // For now, return empty array as the table doesn't exist yet
      
      // When the student_quiz_attempts table is created, uncomment and use this query:
      /*
      let query = supabase
        .from("student_quiz_attempts")
        .select(`
          id,
          student_id,
          content_id,
          score,
          total_questions,
          passed,
          answers,
          created_at,
          content:content_id (id, title, pass_threshold),
          students:student_id (id, full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (selectedCourse !== "all") {
        query = query.eq("content_id", selectedCourse);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      return (data || []).map((attempt: any): QuizAttempt => ({
        id: attempt.id,
        studentId: attempt.student_id,
        studentName: attempt.students?.full_name || "Unknown",
        studentEmail: attempt.students?.email || "",
        contentId: attempt.content_id,
        contentTitle: attempt.content?.title || "Unknown Course",
        score: attempt.score || 0,
        totalQuestions: attempt.total_questions || 0,
        passed: attempt.passed || false,
        attemptedAt: attempt.created_at,
        answers: Array.isArray(attempt.answers) ? attempt.answers : [],
      }));
      */
      
      return [];
    },
  });

  // Calculate summary stats
  const summaryStats = {
    totalAttempts: quizAttempts?.length || 0,
    passedAttempts: quizAttempts?.filter((a) => a.passed).length || 0,
    averageScore: quizAttempts?.length
      ? Math.round(
          quizAttempts.reduce((sum, a) => sum + (a.totalQuestions > 0 ? (a.score / a.totalQuestions) * 100 : 0), 0) /
            quizAttempts.length
        )
      : 0,
    passRate: quizAttempts?.length
      ? Math.round((quizAttempts.filter((a) => a.passed).length / quizAttempts.length) * 100)
      : 0,
  };

  const viewAttemptDetails = (attempt: QuizAttempt) => {
    setSelectedAttempt(attempt);
    setDetailDialogOpen(true);
  };

  if (coursesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quiz Results</h2>
          <p className="text-muted-foreground">
            View and analyze quiz attempts across all courses
          </p>
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses?.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">Quiz submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summaryStats.passedAttempts}</div>
            <p className="text-xs text-muted-foreground">Successful attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.averageScore}%</div>
            <Progress value={summaryStats.averageScore} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.passRate}%</div>
            <Progress value={summaryStats.passRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Quiz Attempts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Attempts</CardTitle>
          <CardDescription>Individual quiz submissions with scores and pass status</CardDescription>
        </CardHeader>
        <CardContent>
          {attemptsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : quizAttempts && quizAttempts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Attempted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quizAttempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{attempt.studentName}</div>
                        <div className="text-sm text-muted-foreground">{attempt.studentEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{attempt.contentTitle}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="font-medium">
                          {attempt.score}/{attempt.totalQuestions}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({attempt.totalQuestions > 0
                            ? Math.round((attempt.score / attempt.totalQuestions) * 100)
                            : 0}%)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {attempt.passed ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Passed
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(attempt.attemptedAt), "MMM d, yyyy h:mm a")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewAttemptDetails(attempt)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No quiz attempts yet</p>
              <p className="text-sm">Quiz results will appear here once students take quizzes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attempt Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Quiz Attempt Details</DialogTitle>
            <DialogDescription>
              {selectedAttempt && (
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {selectedAttempt.studentName}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {format(new Date(selectedAttempt.attemptedAt), "MMM d, yyyy h:mm a")}
                  </div>
                  {selectedAttempt.passed ? (
                    <Badge className="bg-green-500/10 text-green-600">Passed</Badge>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-600">Failed</Badge>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedAttempt && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                {/* Score Summary */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Final Score</div>
                        <div className="text-2xl font-bold">
                          {selectedAttempt.score}/{selectedAttempt.totalQuestions}
                          <span className="text-lg text-muted-foreground ml-2">
                            ({selectedAttempt.totalQuestions > 0
                              ? Math.round((selectedAttempt.score / selectedAttempt.totalQuestions) * 100)
                              : 0}%)
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={
                          selectedAttempt.totalQuestions > 0
                            ? (selectedAttempt.score / selectedAttempt.totalQuestions) * 100
                            : 0
                        }
                        className="w-32 h-3"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Question Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-medium">Question Breakdown</h4>
                  {selectedAttempt.answers.length > 0 ? (
                    selectedAttempt.answers.map((answer, index) => (
                      <Card
                        key={answer.questionId || index}
                        className={`border-l-4 ${
                          answer.isCorrect ? "border-l-green-500" : "border-l-red-500"
                        }`}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            {answer.isCorrect ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-2 flex-1">
                              <p className="font-medium">Q{index + 1}: {answer.questionText}</p>
                              <div className="text-sm space-y-1">
                                <div>
                                  <span className="text-muted-foreground">Selected: </span>
                                  <span className={answer.isCorrect ? "text-green-600" : "text-red-600"}>
                                    {answer.selectedAnswer}
                                  </span>
                                </div>
                                {!answer.isCorrect && (
                                  <div>
                                    <span className="text-muted-foreground">Correct: </span>
                                    <span className="text-green-600">{answer.correctAnswer}</span>
                                  </div>
                                )}
                                {answer.explanation && (
                                  <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                                    <span className="font-medium">Explanation: </span>
                                    {answer.explanation}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Detailed answer breakdown not available for this attempt.
                    </p>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
