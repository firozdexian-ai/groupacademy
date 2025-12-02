import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  content_id: z.string().min(1, "Please select a course"),
  instructor_id: z.string().optional(),
  title: z.string().min(1, "Session title is required"),
  description: z.string().optional(),
  scheduled_date: z.date({
    required_error: "Please select a date and time",
  }),
  scheduled_time: z.string().min(1, "Please select a time"),
  duration_minutes: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  meeting_link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  recording_link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function SessionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_sessions")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select("id, title, slug")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: instructors } = useQuery({
    queryKey: ["instructors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, full_name")
        .eq("status", "active")
        .order("full_name");
      if (error) throw error;
      return data;
    },
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

  useEffect(() => {
    if (session) {
      const sessionDate = new Date(session.scheduled_date);
      form.reset({
        content_id: session.content_id,
        instructor_id: session.instructor_id || undefined,
        title: session.title,
        description: session.description || "",
        scheduled_date: sessionDate,
        scheduled_time: format(sessionDate, "HH:mm"),
        duration_minutes: session.duration_minutes,
        meeting_link: session.meeting_link || "",
        recording_link: session.recording_link || "",
        status: session.status,
      });
    }
  }, [session, form]);

  const updateSession = useMutation({
    mutationFn: async (values: FormValues) => {
      const scheduledDateTime = new Date(values.scheduled_date);
      const [hours, minutes] = values.scheduled_time.split(":").map(Number);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const { error } = await supabase
        .from("course_sessions")
        .update({
          content_id: values.content_id,
          instructor_id: values.instructor_id || null,
          title: values.title,
          description: values.description || null,
          scheduled_date: scheduledDateTime.toISOString(),
          duration_minutes: values.duration_minutes,
          meeting_link: values.meeting_link || null,
          recording_link: values.recording_link || null,
          status: values.status,
        })
        .eq("id", id!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session", id] });
      toast.success("Session updated successfully");
      navigate("/sessions");
    },
    onError: (error) => {
      console.error("Error updating session:", error);
      toast.error("Failed to update session");
    },
  });

  const deleteSession = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("course_sessions")
        .delete()
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session deleted successfully");
      navigate("/sessions");
    },
    onError: (error) => {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    },
  });

  const onSubmit = (values: FormValues) => {
    updateSession.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-muted-foreground">Loading session...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/sessions")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Sessions
      </Button>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Edit Session</h1>
          <p className="text-muted-foreground">
            Update session details and meeting information
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Session</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this session? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteSession.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="content_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courses?.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Session Title *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Week 1: Introduction to AI" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What will be covered in this session?"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="scheduled_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
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
                  <FormLabel>Time *</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes) *</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
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
                  <FormLabel>Instructor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select instructor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {instructors?.map((instructor) => (
                        <SelectItem key={instructor.id} value={instructor.id}>
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

          <FormField
            control={form.control}
            name="meeting_link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting Link</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://zoom.us/j/..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Zoom, Google Meet, or any other meeting platform link
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recording_link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recording Link</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://youtube.com/..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Add after the session is completed
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/sessions")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateSession.isPending}>
              {updateSession.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
