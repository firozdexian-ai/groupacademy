import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPublishedContentBasic,
  listActiveInstructorsBasic,
  insertCourseSession,
} from "@/domains/learning/repo/learningRepo";
import { useQueryWithTimeout, withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  ArrowLeft,
  Video,
  Link2,
  GraduationCap,
  Clock,
  Sparkles,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  content_id: z.string().min(1, "Curriculum node selection required"),
  instructor_id: z.string().optional().nullable(),
  title: z.string().min(1, "Session identity required"),
  description: z.string().optional(),
  scheduled_date: z.date({
    required_error: "Calendar date required",
  }),
  scheduled_time: z.string().min(1, "Temporal offset required"),
  duration_minutes: z.coerce.number().min(1, "Minimum duration: 1 minute"),
  meeting_link: z.string().url("Must be a valid URL protocol").optional().or(z.literal("")),
  recording_link: z.string().url("Must be a valid URL protocol").optional().or(z.literal("")),
  status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function SessionNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: courses } = useQueryWithTimeout({
    queryKey: ["courses-registry"],
    queryFn: async () => await listPublishedContentBasic(),
    timeout: TIMEOUTS.DEFAULT,
  });

  const { data: instructors } = useQueryWithTimeout({
    queryKey: ["instructors-active"],
    queryFn: async () => await listActiveInstructorsBasic(),
    timeout: TIMEOUTS.DEFAULT,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      duration_minutes: 60,
      meeting_link: "",
      recording_link: "",
      status: "scheduled",
      scheduled_time: "10:00",
    },
  });

  const createSession = useMutation({
    mutationFn: async (values: FormValues) => {
      const scheduledDateTime = new Date(values.scheduled_date);
      const [hours, minutes] = values.scheduled_time.split(":").map(Number);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      await withTimeout(
        insertCourseSession({
          content_id: values.content_id,
          instructor_id: values.instructor_id || null,
          title: values.title,
          description: values.description || null,
          scheduled_date: scheduledDateTime.toISOString(),
          duration_minutes: values.duration_minutes,
          meeting_link: values.meeting_link || null,
          recording_link: values.recording_link || null,
          status: values.status,
        }),
        TIMEOUTS.DEFAULT,
        "Sequence timed out during committal",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("New session node established.");
      navigate("/sessions");
    },
    onError: (error: any) => {
      console.error("Logic Error:", error);
      toast.error(`Committal Failed: ${error.message}`);
    },
  });

  return (
    <div className="min-h-screen bg-muted/20 pb-20 selection:bg-primary/10">
      <main className="container max-w-3xl mx-auto py-12 px-6 space-y-10 animate-in fade-in duration-700">
        {/* Navigation HUD */}
        <header className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/sessions")}
            className="rounded-xl font-bold uppercase text-[10px] tracking-widest pl-0 hover:bg-transparent"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Global Registry
          </Button>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tighter uppercase">New Session</h1>
              <p className="text-muted-foreground font-medium">
                Initialize a live learning node in the curriculum ledger.
              </p>
            </div>
            <Badge
              variant="outline"
              className="hidden sm:flex border-primary/20 text-primary bg-primary/5 font-black uppercase text-[10px]"
            >
              <Sparkles className="w-3 h-3 mr-2" /> Protocol v2.6
            </Badge>
          </div>
        </header>

        <Card className="rounded-[40px] border-border/40 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-xl">
          <CardContent className="p-8 md:p-12">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => createSession.mutate(v))} className="space-y-8">
                {/* Curriculum Selection */}
                <FormField
                  control={form.control}
                  name="content_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">
                        Parent Curriculum Node
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl bg-background/50 font-bold border-border/40">
                            <SelectValue placeholder="Select course assignment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {courses?.map((course) => (
                            <SelectItem key={course.id} value={course.id} className="text-xs font-bold">
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px] font-bold uppercase" />
                    </FormItem>
                  )}
                />

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">
                          Session Identity
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Week 04: Neural Network Architectures"
                            {...field}
                            className="h-12 rounded-xl bg-background/50 border-border/40 font-bold"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold uppercase" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">
                          Operational Brief
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Define the logic nodes covered in this session..."
                            {...field}
                            className="min-h-[120px] rounded-2xl bg-background/50 border-border/40 resize-none font-medium text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Temporal HUD */}
                <div className="grid md:grid-cols-2 gap-6 p-6 rounded-[32px] bg-muted/30 border border-border/10">
                  <FormField
                    control={form.control}
                    name="scheduled_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">
                          Target Date
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-12 rounded-xl bg-background/50 border-border/40 font-bold pl-4",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                {field.value ? format(field.value, "PPP") : <span>Select Date</span>}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduled_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">
                          Start Time (24h)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            className="h-12 rounded-xl bg-background/50 border-border/40 font-bold"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Logistics */}
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="duration_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">
                          Duration (Min)
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                              type="number"
                              {...field}
                              className="h-12 pl-11 rounded-xl bg-background/50 border-border/40 font-bold"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instructor_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">
                          Lead Instructor
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border/40 font-bold">
                              <GraduationCap className="h-4 w-4 mr-2 text-primary" />
                              <SelectValue placeholder="Assign Instructor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            {instructors?.map((instructor) => (
                              <SelectItem key={instructor.id} value={instructor.id} className="text-xs font-bold">
                                {instructor.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Link Infrastructure */}
                <div className="space-y-4 pt-4 border-t border-border/10">
                  <FormField
                    control={form.control}
                    name="meeting_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Video className="h-3 w-3 text-primary" /> Handshake Link (Zoom/Meet)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://zoom.us/j/..."
                            {...field}
                            className="h-12 rounded-xl bg-background/50 border-border/40 font-mono text-xs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recording_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Link2 className="h-3 w-3 text-primary" /> Archive Link (YouTube/Drive)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://youtube.com/watch?v=..."
                            {...field}
                            className="h-12 rounded-xl bg-background/50 border-border/40 font-mono text-xs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Initial Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest ml-1">
                        Node Lifecycle Status
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl bg-primary/5 border-primary/20 font-black uppercase text-[10px] tracking-widest">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="scheduled" className="text-[10px] font-black uppercase">
                            Scheduled
                          </SelectItem>
                          <SelectItem value="ongoing" className="text-[10px] font-black uppercase text-blue-500">
                            Live Node
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/sessions")}
                    className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest border-border/40"
                  >
                    Abort
                  </Button>
                  <Button
                    type="submit"
                    disabled={createSession.isPending}
                    className="flex-[2] h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
                  >
                    {createSession.isPending ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" /> Establish Session
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
