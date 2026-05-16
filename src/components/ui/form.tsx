import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import { Controller, ControllerProps, FieldPath, FieldValues, FormProvider, useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Technical Data Entry & Form Schema Interface Primitives (Form)
 * Hardened operational architecture integrating React Hook Form & Radix UI accessible anchor maps.
 * Version: Launch Candidate · Phase Z0 Context & Structural Safeguards Hardened
 */
const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const formContext = useFormContext();

  // Phase 1: Enforce defensive context validation checks to block uninsulated runtime pointer exceptions
  if (!fieldContext) {
    throw new Error(
      "Validation Fault: useFormField analytics hooks must execute natively within an active <FormField> layout envelope.",
    );
  }
  if (!formContext) {
    throw new Error(
      "Validation Fault: useFormField layout context elements must execute inside a top-level <Form> master provider.",
    );
  }
  if (!itemContext) {
    throw new Error(
      "Validation Fault: useFormField UI bindings must execute beneath a contextual structural <FormItem> container wrapper.",
    );
  }

  const { getFieldState, formState } = formContext;
  const fieldState = getFieldState(fieldContext.name, formState);
  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue | null>(null);

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const uniqueGeneratedReactIdStr = React.useId();

    return (
      <FormItemContext.Provider value={{ id: uniqueGeneratedReactIdStr }}>
        <div
          ref={ref}
          className={cn("space-y-1.5 w-full block text-left antialiased transform-gpu", className)}
          {...props}
        />
      </FormItemContext.Provider>
    );
  },
);
FormItem.displayName = "Form_Core_Item_Node";

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      ref={ref}
      className={cn(
        "text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wide text-muted-foreground/80 block leading-none select-none pb-0.5 pt-0.5",
        error && "text-destructive",
        className,
      )}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = "Form_Core_Label_Node";

const FormControl = React.forwardRef<React.ElementRef<typeof Slot>, React.ComponentPropsWithoutRef<typeof Slot>>(
  ({ className, ...props }, ref) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

    return (
      <Slot
        ref={ref}
        id={formItemId}
        aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
        aria-invalid={!!error}
        className={cn(
          "transition-colors duration-200 transform-gpu block",
          error &&
            "border-destructive/60 text-destructive focus-visible:ring-destructive/20 placeholder:text-destructive/30",
          className,
        )}
        {...props}
      />
    );
  },
);
FormControl.displayName = "Form_Core_Control_Node";

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormField();

    return (
      <p
        ref={ref}
        id={formDescriptionId}
        className={cn(
          "text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest leading-normal block italic select-none pointer-events-none pt-0.5",
          className,
        )}
        {...props}
      />
    );
  },
);
FormDescription.displayName = "Form_Core_Description_Node";

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { error, formMessageId } = useFormField();
    const extractedErrorMessageBodyStr = error ? String(error?.message) : children;

    if (!extractedErrorMessageBodyStr) return null;

    return (
      <p
        ref={ref}
        id={formMessageId}
        className={cn(
          "text-[10px] font-mono font-extrabold uppercase tracking-wide text-destructive animate-in fade-in slide-in-from-top-1 duration-150 block leading-none pt-0.5 select-text selection:bg-destructive/5",
          className,
        )}
        {...props}
      >
        {extractedErrorMessageBodyStr}
      </p>
    );
  },
);
FormMessage.displayName = "Form_Core_Message_Node";

export { useFormField, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField };
