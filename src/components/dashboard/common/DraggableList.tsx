import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

interface DraggableListProps<T> {
  items: T[];
  getId: (item: T) => string;
  renderItem: (item: T, index: number, dragHandleProps: DragHandleProps) => ReactNode;
  onReorder: (newItems: T[]) => void;
  disabled?: boolean;
  className?: string;
}

export interface DragHandleProps {
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  className?: string;
}

/**
 * Lightweight HTML5 drag-and-drop list. Reorders within the list and
 * notifies the parent with the new array order.
 */
export function DraggableList<T>({
  items,
  getId,
  renderItem,
  onReorder,
  disabled,
  className,
}: DraggableListProps<T>) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overPos, setOverPos] = useState<"before" | "after">("before");

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setOverId(null);
      return;
    }
    const fromIdx = items.findIndex((it) => getId(it) === draggingId);
    const toIdx = items.findIndex((it) => getId(it) === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const newList = [...items];
    const [moved] = newList.splice(fromIdx, 1);
    let insertAt = toIdx;
    if (fromIdx < toIdx) insertAt = toIdx - 1;
    if (overPos === "after") insertAt += 1;
    newList.splice(insertAt, 0, moved);
    onReorder(newList);
    setDraggingId(null);
    setOverId(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, index) => {
        const id = getId(item);
        const isDragging = draggingId === id;
        const isOver = overId === id;
        const handleProps: DragHandleProps = {
          draggable: !disabled,
          onDragStart: (e) => {
            if (disabled) return;
            setDraggingId(id);
            e.dataTransfer.effectAllowed = "move";
            try {
              e.dataTransfer.setData("text/plain", id);
            } catch {
              /* noop */
            }
          },
          onDragEnd: () => {
            setDraggingId(null);
            setOverId(null);
          },
          className: "cursor-grab active:cursor-grabbing",
        };
        return (
          <div
            key={id}
            onDragOver={(e) => {
              if (disabled || !draggingId || draggingId === id) return;
              e.preventDefault();
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const isAfter = e.clientY - rect.top > rect.height / 2;
              setOverId(id);
              setOverPos(isAfter ? "after" : "before");
            }}
            onDragLeave={() => {
              if (overId === id) setOverId(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(id);
            }}
            className={cn(
              "relative transition-opacity",
              isDragging && "opacity-50",
              isOver && overPos === "before" && "before:absolute before:inset-x-0 before:-top-1.5 before:h-0.5 before:bg-primary before:rounded-full",
              isOver && overPos === "after" && "after:absolute after:inset-x-0 after:-bottom-1.5 after:h-0.5 after:bg-primary after:rounded-full",
            )}
          >
            {renderItem(item, index, handleProps)}
          </div>
        );
      })}
    </div>
  );
}

/** Default visual grip you can drop into renderItem if you don't want a custom handle. */
export function DragHandle({ draggable, onDragStart, onDragEnd, className }: DragHandleProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors",
        className,
      )}
      title="Drag to reorder"
    >
      <GripVertical className="h-4 w-4" />
    </div>
  );
}
