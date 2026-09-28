import { Plus, X } from "lucide-react";
import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Button, IconButton, Input, Label } from "@/components/ui";
import type { CourseFormValues } from "./schemas";

type ListField = "what_you_learn" | "requirements";

interface ListFieldEditorProps {
  name: ListField;
  label: string;
  placeholder: string;
  hint?: string;
  control: Control<CourseFormValues>;
  register: UseFormRegister<CourseFormValues>;
  errors: FieldErrors<CourseFormValues>;
  max?: number;
}

/** Repeatable single-line inputs bound to a react-hook-form field array (`{ value }[]`). */
export function ListFieldEditor({ name, label, placeholder, hint, control, register, errors, max = 20 }: ListFieldEditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name });
  const listError = errors[name]?.message ?? errors[name]?.root?.message;

  return (
    <fieldset>
      <Label>{label}</Label>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <Input
              placeholder={placeholder}
              aria-label={`${label} ${index + 1}`}
              error={errors[name]?.[index]?.value?.message}
              {...register(`${name}.${index}.value` as const)}
            />
            <IconButton
              aria-label="Bandni o'chirish"
              size="md"
              disabled={fields.length === 1}
              onClick={() => remove(index)}
              className="text-slate-400 hover:text-rose-500"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
          disabled={fields.length >= max}
          onClick={() => append({ value: "" })}
        >
          Band qo'shish
        </Button>
        {hint && <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
      </div>
      {listError && (
        <p role="alert" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
          {listError}
        </p>
      )}
    </fieldset>
  );
}
