import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useQueryWithTimeout, withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
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
import { Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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

export default function SessionNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: courses } = useQueryWithTimeout({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select("id, title, slug")
        .order("title");
      if (error) throw error;
      return data;
    },
    timeout: TIMEOUTS.DEFAULT,
  });

  const { data: instructors } = useQueryWithTimeout({
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

      const { error } = await withTimeout(
        Promise.resolve(supabase.from("course_sessions").insert({
          content_id: values.content_id,
          instructor_id: values.instructor_id || null,
          title: values.title,
          description: values.description || null,
          scheduled_date: scheduledDateTime.toISOString(),
          duration_minutes: values.duration_minutes,
          meeting_link: values.meeting_link || null,
          recording_link: values.recording_link || null,
          status: values.status,
        })),
        TIMEOUTS.DEFAULT,
        "Session creation timed out"
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session created successfully");
      navigate("/sessions");
    },
    onError: (error) => {
      console.error("Error creating session:", error);
      toast.error("Failed to create session");
    },
  });

  const onSubmit = (values: FormValues) => {
    createSession.mutate(values);
  };

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

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Create New Session</h1>
        <p className="text-muted-foreground">
          Schedule a live session for your course
        </p>
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
                        disabled={(date) => date < new Date()}
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
            <Button type="submit" disabled={createSession.isPending}>
              {createSession.isPending ? "Creating..." : "Create Session"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}