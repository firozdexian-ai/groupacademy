import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "@/domains/feed/components/talent/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
 Mail,
 Phone,
 Briefcase,
 GraduationCap,
 Edit2,
 Sparkles,
 Loader2,
 Settings,
 MapPin,
 Award,
 ArrowLeft,
 ShieldCheck,
 Linkedin,
 Globe,
 Languages as LanguagesIcon,
 Plus,
} from "lucide-react";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileCompletionMeter } from "@/domains/profile/components/talent/ProfileCompletionMeter";
import { ProfileSectionEditor } from "@/domains/profile/components/talent/ProfileSectionEditor";
import { PublicProfileSettings } from "@/domains/profile/components/talent/PublicProfileSettings";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getCountryFlag, getCountryName } from "@/lib/constants/countries";
import { enhanceCoverLetter } from "@/domains/jobs/api/jobsApi";
import { trackError } from "@/lib/errorTracking";
import { InlineSpinner } from "@/components/common/InlineSpinner";

type EditableSection =
 | "about"
 | "experience"
 | "education"
 | "skills"
 | "achievements"
 | "languages"
 | null;

export default function Profile() {
 const navigate = useNavigate();
 const { talent, updateTalent, refreshTalent, isLoading: isTalentLoading } = useTalent();
 const [showEnhanceDialog, setShowEnhanceDialog] = useState(false);
 const [isEnhancing, setIsEnhancing] = useState(false);
 const [editingSection, setEditingSection] = useState<EditableSection>(null);

 // --- Query: Fetch user's own feed posts ---
 const { data: myPosts = [], isLoading: isPostsLoading } = useQuery({
   queryKey: ["my-posts", talent?.userId],
   enabled: !!talent?.userId,
   queryFn: async () => {
     const { data, error } = await supabase
       .from("feed_posts")
       .select("*")
       .eq("author_user_id", talent!.userId)
       .eq("is_active", true)
       .eq("status", "published")
       .order("created_at", { ascending: false })
       .limit(3);
     if (error) throw error;
     return data || [];
   },
 });

 const mapRowToPost = (row: any) => ({
   id: row.id,
   authorName: row.author_name || "Community member",
   authorAvatar: row.author_avatar || undefined,
   authorTitle: row.author_title || "",
   contentType: (row.content_type || "text") as any,
   textContent: row.text_content || "",
   mediaUrl: row.media_url || undefined,
   pollOptions: row.poll_options,
   pollEndsAt: row.poll_ends_at,
   linkUrl: row.link_url,
   linkPreview: row.link_preview,
   tags: row.tags || undefined,
   isPinned: !!row.is_pinned,
   createdAt: row.created_at,
 });

 const handleSectionSave = useCallback(
 async (_section: string | null, data: any) => {
 try {
 await updateTalent(data);
 await refreshTalent();
 toast.success("Profile saved.");
 } catch (e) {
 trackError(e, { area: "Profile.handleSectionSave" });
 toast.error("Couldn't save — please try again.");
 }
 },
 [updateTalent, refreshTalent],
 );

 const handleEnhanceWithAI = async () => {
 if (!talent?.experience?.length) {
 toast.error("Add at least one work experience first.");
 setShowEnhanceDialog(false);
 navigate("/app/profile/edit");
 return;
 }

 setIsEnhancing(true);
 try {
 const data: any = await enhanceCoverLetter({
 type: "experience",
 experience: talent.experience,
 profession: talent.customProfession || "professional",
 } as any);

 if (data?.enhancedExperience) {
 await updateTalent({ experience: data.enhancedExperience });
 await refreshTalent();
 toast.success("Updated with AI.");
 }
 } catch (error) {
 trackError(error, { area: "Profile.handleEnhanceWithAI" });
 toast.error("AI rewrite failed — please try again.");
 } finally {
 setIsEnhancing(false);
 setShowEnhanceDialog(false);
 }
 };

 if (isTalentLoading) {
 return (
 <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
 <InlineSpinner size="lg" />
 <p className="text-sm text-muted-foreground">Loading your profile…</p>
 </div>
 );
 }

 if (!talent) return null;

 const t: any = talent;
 const initials = talent.fullName
 ? talent.fullName
 .split(" ")
 .map((n) => n[0])
 .join("")
 .toUpperCase()
 .slice(0, 2)
 : "—";

 const countryLabel = t.country
 ? `${getCountryFlag(t.country) ?? ""} ${getCountryName(t.country) ?? t.country}`.trim()
 : null;

 const SectionHeader = ({
 title,
 count,
 section,
 showEnhance,
 addLabel,
 }: {
 title: string;
 count?: number;
 section: EditableSection;
 showEnhance?: boolean;
 addLabel?: string;
 }) => (
 <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-4">
 <div className="flex items-center gap-2">
 <h3 className="text-sm font-semibold">{title}</h3>
 {count !== undefined && count > 0 && (
 <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
 {count}
 </Badge>
 )}
 </div>
 <div className="flex items-center gap-1">
 {showEnhance && (talent.experience?.length ?? 0) > 0 && (
 <Button
 variant="ghost"
 size="sm"
 className="h-8 text-primary"
 onClick={() => setShowEnhanceDialog(true)}
 >
 <Sparkles className="h-3.5 w-3.5 mr-1" /> AI rewrite
 </Button>
 )}
 <Button variant="ghost" size="sm" className="h-8" onClick={() => setEditingSection(section)}>
 {(count ?? 0) === 0 ? (
 <>
 <Plus className="h-3.5 w-3.5 mr-1" /> {addLabel ?? "Add"}
 </>
 ) : (
 <Edit2 className="h-3.5 w-3.5" />
 )}
 </Button>
 </div>
 </div>
 );

 const EmptyState = ({ label, onAdd }: { label: string; onAdd: () => void }) => (
 <button
 type="button"
 onClick={onAdd}
 className="w-full p-5 rounded-xl bg-muted/30 border border-dashed border-border/60 text-sm text-muted-foreground hover:bg-muted/50 transition text-left"
 >
 {label}
 </button>
 );

 return (
 <div className="max-w-xl mx-auto pb-32 animate-in fade-in duration-300">
 <header className="flex items-center justify-between px-4 py-4 sticky top-0 z-20 bg-background/80 border-b border-border/40">
 <div className="flex items-center gap-3">
 <Button variant="ghost" size="icon" aria-label="Go back" className="h-9 w-9" onClick={() => navigate("/app/feed")}>
 <ArrowLeft className="h-5 w-5" />
 </Button>
 <div>
 <h1 className="text-lg font-bold">My profile</h1>
 <div className="flex items-center gap-1.5">
 <ShieldCheck className="h-3 w-3 text-emerald-500" />
 <p className="text-[10px] text-muted-foreground">Verified profile</p>
 </div>
 </div>
 </div>
 <Button variant="ghost" size="icon" aria-label="Settings" className="h-9 w-9" onClick={() => navigate("/app/profile/edit")}>
 <Settings className="h-5 w-5" />
 </Button>
 </header>

 {/* Cover + avatar */}
 <div className="relative mb-6 px-4 pt-4">
 <div className="rounded-2xl overflow-hidden shadow-lg">
 {t.coverImageUrl ? (
 <img src={t.coverImageUrl} alt="Cover" className="h-32 w-full object-cover" />
 ) : (
 <div className="h-32 bg-gradient-to-br from-primary via-blue-600 to-primary opacity-90" />
 )}
 </div>
 <div className="relative -mt-12 px-3">
 <Card>
 <CardContent className="p-5 pt-0">
 <div className="flex items-end justify-between -mt-10 mb-4">
 <Avatar className="h-20 w-20 ring-4 ring-background rounded-2xl">
 <AvatarImage src={t.profilePhotoUrl} />
 <AvatarFallback className="text-xl bg-primary text-primary-foreground font-bold rounded-2xl">
 {initials}
 </AvatarFallback>
 </Avatar>
 <Button variant="outline" size="sm" onClick={() => navigate("/app/profile/edit")}>
 <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
 </Button>
 </div>
 <h2 className="text-2xl font-bold">{talent.fullName || "Your name"}</h2>
 {t.customProfession && (
 <p className="text-sm text-primary font-medium mt-0.5">{t.customProfession}</p>
 )}

 {/* Contact strip */}
 <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
 {countryLabel && (
 <div className="flex items-center gap-2">
 <MapPin className="h-3.5 w-3.5" />
 <span>{countryLabel}</span>
 </div>
 )}
 {t.email && (
 <div className="flex items-center gap-2">
 <Mail className="h-3.5 w-3.5" />
 <span className="truncate">{t.email}</span>
 </div>
 )}
 {t.phone && (
 <div className="flex items-center gap-2">
 <Phone className="h-3.5 w-3.5" />
 <span>{t.phone}</span>
 </div>
 )}
 {t.linkedinUrl && (
 <a
 href={t.linkedinUrl}
 target="_blank"
 rel="noreferrer"
 className="flex items-center gap-2 hover:text-primary"
 >
 <Linkedin className="h-3.5 w-3.5" />
 <span className="truncate">LinkedIn</span>
 </a>
 )}
 {t.portfolioUrl && (
 <a
 href={t.portfolioUrl}
 target="_blank"
 rel="noreferrer"
 className="flex items-center gap-2 hover:text-primary"
 >
 <Globe className="h-3.5 w-3.5" />
 <span className="truncate">Portfolio</span>
 </a>
 )}
 </div>
 </CardContent>
 </Card>
 </div>
 </div>

 <div className="px-4 mb-6">
 <ProfileCompletionMeter talent={talent} variant="compact" />
 </div>

 <div className="space-y-4 px-4">
 {/* About */}
 <Card>
 <CardHeader className="p-5 pb-2">
 <SectionHeader title="About" section="about" addLabel="Add bio" count={t.currentStatus ? 1 : 0} />
 </CardHeader>
 <CardContent className="px-5 pb-5">
 {t.currentStatus ? (
 <p className="text-sm text-foreground/80 whitespace-pre-wrap">{t.currentStatus}</p>
 ) : (
 <EmptyState label="Add a short bio so employers know what you do." onAdd={() => setEditingSection("about")} />
 )}
 </CardContent>
 </Card>

 {/* Activity Section (LinkedIn-Style Feed) */}
 <Card>
   <CardHeader className="p-5 pb-2">
     <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-4">
       <div className="flex items-center gap-2">
         <h3 className="text-sm font-semibold">Activity</h3>
         {myPosts.length > 0 && (
           <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
             {myPosts.length} posts
           </Badge>
         )}
       </div>
       <Button variant="ghost" size="sm" className="h-8 text-primary font-bold hover:bg-primary/5 rounded-xl px-3" onClick={() => navigate("/app/feed")}>
         Create post
       </Button>
     </div>
   </CardHeader>
   <CardContent className="px-5 pb-5 space-y-4">
     {isPostsLoading ? (
       <div className="space-y-3">
         <Skeleton className="h-24 w-full rounded-2xl" />
       </div>
     ) : myPosts.length === 0 ? (
       <div className="text-center py-6">
         <p className="text-xs text-muted-foreground mb-4">
           You haven't shared any updates yet. Post your achievements or ask questions to build your presence.
         </p>
         <Button variant="outline" size="sm" className="rounded-xl font-bold" onClick={() => navigate("/app/feed")}>
           Share an update
         </Button>
       </div>
     ) : (
       <div className="space-y-4">
         {myPosts.map((post: any) => (
           <PostCard key={post.id} post={mapRowToPost(post)} />
         ))}
       </div>
     )}
   </CardContent>
 </Card>

 {/* Experience */}
 <Card>
 <CardHeader className="p-5 pb-2">
 <SectionHeader
 title="Work experience"
 count={t.experience?.length ?? 0}
 section="experience"
 showEnhance
 addLabel="Add experience"
 />
 </CardHeader>
 <CardContent className="px-5 pb-5 space-y-3">
 {(t.experience?.length ?? 0) === 0 ? (
 <EmptyState label="Add your work experience." onAdd={() => setEditingSection("experience")} />
 ) : (
 t.experience.map((exp: any, i: number) => (
 <div key={i} className="flex gap-3">
 <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
 <Briefcase className="h-4 w-4 text-primary" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-medium text-sm">{exp.position || exp.title || "Role"}</p>
 <p className="text-xs text-muted-foreground">{exp.company}</p>
 {(exp.startDate || exp.endDate) && (
 <p className="text-[11px] text-muted-foreground mt-0.5">
 {exp.startDate} {exp.endDate ? `– ${exp.endDate}` : exp.isCurrent ? "– Present" : ""}
 </p>
 )}
 {exp.description && (
 <p className="text-xs text-foreground/70 mt-1.5 whitespace-pre-wrap">{exp.description}</p>
 )}
 </div>
 </div>
 ))
 )}
 </CardContent>
 </Card>

 {/* Education */}
 <Card>
 <CardHeader className="p-5 pb-2">
 <SectionHeader
 title="Education"
 count={t.education?.length ?? 0}
 section="education"
 addLabel="Add education"
 />
 </CardHeader>
 <CardContent className="px-5 pb-5 space-y-3">
 {(t.education?.length ?? 0) === 0 ? (
 <EmptyState label="Add where you studied." onAdd={() => setEditingSection("education")} />
 ) : (
 t.education.map((ed: any, i: number) => (
 <div key={i} className="flex gap-3">
 <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
 <GraduationCap className="h-4 w-4 text-primary" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-medium text-sm">{ed.institution}</p>
 {(ed.degree || ed.fieldOfStudy) && (
 <p className="text-xs text-muted-foreground">
 {[ed.degree, ed.fieldOfStudy].filter(Boolean).join(" · ")}
 </p>
 )}
 {(ed.startYear || ed.endYear) && (
 <p className="text-[11px] text-muted-foreground mt-0.5">
 {ed.startYear} {ed.endYear ? `– ${ed.endYear}` : ""}
 </p>
 )}
 </div>
 </div>
 ))
 )}
 </CardContent>
 </Card>

 {/* Skills */}
 <Card>
 <CardHeader className="p-5 pb-2">
 <SectionHeader
 title="Skills"
 count={t.skills?.length ?? 0}
 section="skills"
 addLabel="Add skills"
 />
 </CardHeader>
 <CardContent className="px-5 pb-5">
 {(t.skills?.length ?? 0) === 0 ? (
 <EmptyState label="Add the skills employers should know about." onAdd={() => setEditingSection("skills")} />
 ) : (
 <div className="flex flex-wrap gap-1.5">
 {t.skills.map((s: any, i: number) => (
 <Badge key={i} variant="secondary" className="text-xs">
 {typeof s === "string" ? s : s.name}
 </Badge>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 {/* Languages */}
 <Card>
 <CardHeader className="p-5 pb-2">
 <SectionHeader
 title="Languages"
 count={t.languages?.length ?? 0}
 section="languages"
 addLabel="Add languages"
 />
 </CardHeader>
 <CardContent className="px-5 pb-5 space-y-2">
 {(t.languages?.length ?? 0) === 0 ? (
 <EmptyState label="Add languages you speak." onAdd={() => setEditingSection("languages")} />
 ) : (
 t.languages.map((l: any, i: number) => (
 <div key={i} className="flex items-center gap-2 text-sm">
 <LanguagesIcon className="h-3.5 w-3.5 text-primary" />
 <span className="font-medium">{l.language}</span>
 <span className="text-muted-foreground text-xs">· {l.proficiency}</span>
 </div>
 ))
 )}
 </CardContent>
 </Card>

 {/* Achievements */}
 <Card>
 <CardHeader className="p-5 pb-2">
 <SectionHeader
 title="Achievements & certifications"
 count={t.achievements?.length ?? 0}
 section="achievements"
 addLabel="Add achievement"
 />
 </CardHeader>
 <CardContent className="px-5 pb-5 space-y-3">
 {(t.achievements?.length ?? 0) === 0 ? (
 <EmptyState
 label="Add awards, certifications, or recognitions."
 onAdd={() => setEditingSection("achievements")}
 />
 ) : (
 t.achievements.map((a: any, i: number) => (
 <div key={i} className="flex gap-3">
 <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
 <Award className="h-4 w-4 text-primary" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-medium text-sm">{a.title}</p>
 <p className="text-xs text-muted-foreground">
 {[a.issuer, a.date].filter(Boolean).join(" · ")}
 </p>
 </div>
 </div>
 ))
 )}
 </CardContent>
 </Card>

 <PublicProfileSettings />
 </div>

 <Dialog open={showEnhanceDialog} onOpenChange={setShowEnhanceDialog}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Rewrite with AI</DialogTitle>
 <DialogDescription>
 We'll tighten your work-experience descriptions so they read well to employers. You can always undo by
 editing manually.
 </DialogDescription>
 </DialogHeader>
 <DialogFooter className="gap-2">
 <Button variant="outline" onClick={() => setShowEnhanceDialog(false)} disabled={isEnhancing}>
 Cancel
 </Button>
 <Button onClick={handleEnhanceWithAI} disabled={isEnhancing}>
 {isEnhancing ? (
 <>
 <InlineSpinner size="sm" className="mr-2" /> Rewriting…
 </>
 ) : (
 <>
 <Sparkles className="h-4 w-4 mr-2" /> Rewrite
 </>
 )}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 <ProfileSectionEditor
 section={editingSection}
 onClose={() => setEditingSection(null)}
 onSave={handleSectionSave}
 talent={talent}
 />
 </div>
 );
}
