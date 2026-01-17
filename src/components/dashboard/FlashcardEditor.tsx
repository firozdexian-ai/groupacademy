import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Code,
  Copy,
  Check,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardEditorProps {
  initialCards?: Flashcard[];
  onChange?: (cards: Flashcard[]) => void;
  onSave?: (json: string) => void;
}

export function FlashcardEditor({ initialCards = [], onChange, onSave }: FlashcardEditorProps) {
  const [cards, setCards] = useState<Flashcard[]>(
    initialCards.length > 0
      ? initialCards
      : [{ id: crypto.randomUUID(), front: "", back: "" }]
  );
  const [activeTab, setActiveTab] = useState<"visual" | "json" | "preview">("visual");
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  const updateCards = useCallback(
    (newCards: Flashcard[]) => {
      setCards(newCards);
      onChange?.(newCards);
    },
    [onChange]
  );

  const addCard = () => {
    updateCards([...cards, { id: crypto.randomUUID(), front: "", back: "" }]);
  };

  const removeCard = (id: string) => {
    if (cards.length === 1) {
      toast.error("You need at least one flashcard");
      return;
    }
    updateCards(cards.filter((card) => card.id !== id));
  };

  const updateCard = (id: string, field: "front" | "back", value: string) => {
    updateCards(
      cards.map((card) => (card.id === id ? { ...card, [field]: value } : card))
    );
  };

  const moveCard = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= cards.length) return;

    const newCards = [...cards];
    [newCards[fromIndex], newCards[toIndex]] = [newCards[toIndex], newCards[fromIndex]];
    updateCards(newCards);
  };

  const getJsonOutput = (): string => {
    return JSON.stringify(
      cards.map((c) => ({ front: c.front, back: c.back })),
      null,
      2
    );
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getJsonOutput());
      setCopied(true);
      toast.success("JSON copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const importFromJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        throw new Error("JSON must be an array of flashcards");
      }

      const newCards: Flashcard[] = parsed.map((item: any) => ({
        id: crypto.randomUUID(),
        front: item.front || item.question || "",
        back: item.back || item.answer || "",
      }));

      if (newCards.length === 0) {
        throw new Error("No valid flashcards found in JSON");
      }

      updateCards(newCards);
      setActiveTab("visual");
      toast.success(`Imported ${newCards.length} flashcards`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid JSON format");
    }
  };

  const handleSave = () => {
    const emptyCards = cards.filter((c) => !c.front.trim() || !c.back.trim());
    if (emptyCards.length > 0) {
      toast.error(`${emptyCards.length} card(s) have empty front or back`);
      return;
    }
    onSave?.(getJsonOutput());
    toast.success("Flashcards saved");
  };

  const validCards = cards.filter((c) => c.front.trim() && c.back.trim());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Flashcard Editor</h3>
          <Badge variant="secondary">{cards.length} cards</Badge>
        </div>
        <Button onClick={handleSave} disabled={validCards.length === 0}>
          Save Flashcards
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="visual" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Visual Editor
          </TabsTrigger>
          <TabsTrigger value="json" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            JSON
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Visual Editor */}
        <TabsContent value="visual" className="mt-4">
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {cards.map((card, index) => (
                <Card key={card.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">Card {index + 1}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveCard(index, "up")}
                          disabled={index === 0}
                          className="h-8 w-8"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveCard(index, "down")}
                          disabled={index === cards.length - 1}
                          className="h-8 w-8"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCard(card.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`front-${card.id}`}>Front (Question)</Label>
                        <Textarea
                          id={`front-${card.id}`}
                          placeholder="Enter the question or term..."
                          value={card.front}
                          onChange={(e) => updateCard(card.id, "front", e.target.value)}
                          className="min-h-[100px] resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`back-${card.id}`}>Back (Answer)</Label>
                        <Textarea
                          id={`back-${card.id}`}
                          placeholder="Enter the answer or definition..."
                          value={card.back}
                          onChange={(e) => updateCard(card.id, "back", e.target.value)}
                          className="min-h-[100px] resize-none"
                        />
                      </div>
                    </div>
                    {(!card.front.trim() || !card.back.trim()) && (
                      <p className="text-sm text-destructive">
                        Both front and back are required
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={addCard}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Card
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* JSON Editor */}
        <TabsContent value="json" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export JSON</CardTitle>
              <CardDescription>Copy this JSON to use in the resource data field</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto max-h-[200px]">
                  <code>{getJsonOutput()}</code>
                </pre>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Import JSON</CardTitle>
              <CardDescription>
                Paste JSON to import flashcards. Supports formats: {`{front, back}`} or {`{question, answer}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={`[\n  { "front": "Question 1", "back": "Answer 1" },\n  { "front": "Question 2", "back": "Answer 2" }\n]`}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
              />
              <Button onClick={importFromJson} disabled={!jsonInput.trim()}>
                Import Flashcards
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview" className="mt-4">
          {validCards.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  Card {previewIndex + 1} of {validCards.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFlipped(false)}
                  disabled={!isFlipped}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>

              {/* Flashcard Preview */}
              <div
                className="relative h-[300px] cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div
                  className={`absolute inset-0 transition-transform duration-500 transform-style-preserve-3d ${
                    isFlipped ? "rotate-y-180" : ""
                  }`}
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* Front */}
                  <Card
                    className="absolute inset-0 flex items-center justify-center p-8 backface-hidden bg-gradient-to-br from-primary/5 to-primary/10"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="text-center space-y-4">
                      <Badge>Question</Badge>
                      <p className="text-xl font-medium">{validCards[previewIndex]?.front}</p>
                      <p className="text-sm text-muted-foreground">Click to flip</p>
                    </div>
                  </Card>

                  {/* Back */}
                  <Card
                    className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <div className="text-center space-y-4">
                      <Badge className="bg-green-500/10 text-green-600">Answer</Badge>
                      <p className="text-xl font-medium">{validCards[previewIndex]?.back}</p>
                      <p className="text-sm text-muted-foreground">Click to flip back</p>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreviewIndex((prev) => Math.max(0, prev - 1));
                    setIsFlipped(false);
                  }}
                  disabled={previewIndex === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreviewIndex((prev) => Math.min(validCards.length - 1, prev + 1));
                    setIsFlipped(false);
                  }}
                  disabled={previewIndex === validCards.length - 1}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <Card className="p-8">
              <div className="text-center text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No valid flashcards to preview</p>
                <p className="text-sm">Add cards with both front and back content</p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
