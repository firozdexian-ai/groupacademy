import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ResearchPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleTitle: string;
  moduleDescription: string;
  moduleIndex: number;
  totalModules: number;
  courseTitle: string;
  courseIndex: number;
  totalCourses: number;
  levelName: string;
  programName: string;
  schoolName: string;
  academyName: string;
}

function buildResearchPrompt(props: Omit<ResearchPromptDialogProps, "open" | "onOpenChange">): string {
  const {
    moduleTitle, moduleDescription, moduleIndex, totalModules,
    courseTitle, courseIndex, totalCourses,
    levelName, programName, schoolName, academyName,
  } = props;

  const talkingPoints = moduleDescription?.trim()
    ? `\n**Talking Points**:\n${moduleDescription.split("\n").map(l => l.trim()).filter(Boolean).map(l => `• ${l}`).join("\n")}\n`
    : "\n**Talking Points**: (none yet — this research will help create them)\n";

  return `You are a curriculum research specialist. Conduct deep research for the following educational module:

**Academy**: ${academyName}
**School**: ${schoolName}
**Program**: ${programName}
**Level**: ${levelName}
**Course**: ${courseTitle} (Course ${courseIndex} of ${totalCourses})
**Module**: ${moduleTitle} (Module ${moduleIndex} of ${totalModules})
${talkingPoints}
**Research Instructions**:
Provide comprehensive, actionable research covering:
1. Key concepts, definitions, and frameworks
2. Industry best practices and standards
3. Real-world examples and case studies from global contexts
4. Common mistakes and misconceptions
5. Tools, templates, or resources relevant to this topic
6. Assessment-worthy questions and discussion points
7. Recommended reading, videos, or external references

Format the output as structured sections with clear headings. Include citations where possible. The research should be detailed enough to serve as the knowledge base for creating:
- Video lecture talking points
- Slide decks
- Practice exercises & case studies
- Quiz / assessment questions`;
}

export default function ResearchPromptDialog(props: ResearchPromptDialogProps) {
  const { open, onOpenChange, ...promptProps } = props;
  const [copied, setCopied] = useState(false);

  const prompt = buildResearchPrompt(promptProps);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy — please select and copy manually");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Deep Research Prompt</DialogTitle>
          <DialogDescription>
            Copy this prompt and paste it into your research platform (ChatGPT, Gemini, Perplexity, etc.)
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={prompt}
          readOnly
          className="flex-1 min-h-[300px] text-sm font-mono resize-none"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleCopy} className="gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Prompt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
