/**
 * @fileoverview This file provides a suite of components and a hook (`useFormField`)
 * for building accessible and manageable forms, deeply integrated with `react-hook-form`.
 * It leverages Radix UI primitives (e.g., Label for `FormLabel`, Slot for `FormControl`)
 * and is styled with Tailwind CSS using the `cn` utility.
 *
 * The components are designed to be composed together to create individual form items,
 * each typically consisting of a label, an input control, an optional description,
 * and a message area for validation errors.
 *
 * This implementation appears to be a standard setup, likely generated or adapted
 * from a UI library like ShadCN/ui, providing a structured way to build forms
 * with proper ARIA attributes and error handling.
 *
 * Key exports include:
 * - `Form`: Re-export of `FormProvider` from `react-hook-form` for wrapping the entire form.
 * - `FormField`: A wrapper around `react-hook-form`'s `Controller` for individual field registration.
 * - `useFormField`: Hook to access field state and IDs within form item components.
 * - `FormItem`: A container for a single form field and its associated elements.
 * - `FormLabel`: The label for a form field, connected for accessibility.
 * - `FormControl`: A slot for the actual input element.
 * - `FormDescription`: For displaying helper text or descriptions for a field.
 * - `FormMessage`: For displaying validation errors or other messages related to a field.
 */
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/**
 * Re-export of `FormProvider` from `react-hook-form`.
 * This component should wrap the entire form to provide context for `useFormContext`
 * and other form components.
 */
const Form = FormProvider

/**
 * Defines the shape of the context value provided by `FormFieldContext`.
 * It primarily shares the `name` of the form field.
 * @template TFieldValues - The type of the form values.
 * @template TName - The type of the field name.
 * @internal
 */
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

/**
 * React Context for sharing form field data (specifically the field's `name`)
 * from a `FormField` component to its descendants like `FormControl`, `FormLabel`, etc.
 * @internal
 */
const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

/**
 * `FormField` is a component that wraps `react-hook-form`'s `Controller` component.
 * It is responsible for registering an input with `react-hook-form` and providing
 * `FormFieldContext` to its children. This context allows `useFormField` to access
 * the field's name.
 *
 * It accepts all props that `react-hook-form`'s `Controller` component accepts.
 *
 * @template TFieldValues - Extends `FieldValues` from `react-hook-form`, representing the shape of the form's data.
 * @template TName - Extends `FieldPath<TFieldValues>` from `react-hook-form`, ensuring type safety for field names.
 * @param {ControllerProps<TFieldValues, TName>} props - Props for the `Controller` component.
 * @returns {React.JSX.Element}
 */
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

/**
 * `useFormField` is a custom hook that provides access to form field state and
 * metadata within components nested under a `FormField` and `FormItem`.
 * It leverages `useFormContext` from `react-hook-form` and the internal
 * `FormFieldContext` and `FormItemContext`.
 *
 * It throws an error if used outside of a `<FormField>` component.
 *
 * @returns {object} An object containing:
 * - `id`: A unique ID for the form item, used for ARIA attributes.
 * - `name`: The name of the form field.
 * - `formItemId`: The generated ID for the `FormItem` container.
 * - `formDescriptionId`: The generated ID for the `FormDescription` element.
 * - `formMessageId`: The generated ID for the `FormMessage` element (for errors).
 * - ...and other field state properties from `react-hook-form`'s `getFieldState`
 *   (e.g., `invalid`, `isTouched`, `isDirty`, `error`).
 */
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

/**
 * Defines the shape of the context value provided by `FormItemContext`.
 * It shares a unique `id` for ARIA attribute linking within a form item.
 * @internal
 */
type FormItemContextValue = {
  id: string
}

/**
 * React Context for sharing a unique ID within a `FormItem` component.
 * This ID is used by `FormLabel`, `FormControl`, etc., to correctly set up
 * ARIA attributes like `htmlFor`, `aria-describedby`, and `aria-labelledby`.
 * @internal
 */
const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

/**
 * `FormItem` is a wrapper component for a single form item, which typically
 * includes a label, an input control, an optional description, and an area for
 * error messages. It generates a unique ID and provides it via `FormItemContext`
 * to its children, enabling proper ARIA attribute linking.
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard HTML div attributes.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the underlying div element.
 * @returns {React.JSX.Element}
 */
const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

/**
 * `FormLabel` is a component for rendering the label of a form field.
 * It's an extension of the local `Label` component (which is based on Radix UI's Label primitive).
 * It uses the `useFormField` hook to:
 * - Access the `formItemId` to set the `htmlFor` attribute, linking it to the input control.
 * - Access the field's `error` state to conditionally apply a "destructive" (error) text color.
 *
 * @param {React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>} props - Props for the Radix UI Label component.
 * @param {React.Ref<React.ElementRef<typeof LabelPrimitive.Root>>} ref - Forwarded ref.
 * @returns {React.JSX.Element}
 */
const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

/**
 * `FormControl` acts as a wrapper for the actual input component within a form item
 * (e.g., `<input>`, `<select>`, `<textarea>`, or custom input components).
 * It uses Radix UI's `Slot` component, which merges its props onto its immediate child.
 *
 * It utilizes the `useFormField` hook to automatically set important ARIA attributes
 * on the child input component:
 * - `id`: Set to `formItemId` for linking with `FormLabel`.
 * - `aria-describedby`: Set to connect the input with `FormDescription` and/or `FormMessage`
 *   (includes `formMessageId` if there's an error).
 * - `aria-invalid`: Set to `true` if the field has an error.
 *
 * @param {React.ComponentPropsWithoutRef<typeof Slot>} props - Props for the Radix UI Slot component.
 * @param {React.Ref<React.ElementRef<typeof Slot>>} ref - Forwarded ref.
 * @returns {React.JSX.Element}
 */
const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

/**
 * `FormDescription` is a component used to display descriptive or helper text
 * associated with a form field.
 * It uses the `useFormField` hook to get the `formDescriptionId`, which is set as its `id`
 * attribute. This allows `FormControl` to link to it via `aria-describedby` for accessibility.
 *
 * @param {React.HTMLAttributes<HTMLParagraphElement>} props - Standard HTML paragraph attributes.
 * @param {React.Ref<HTMLParagraphElement>} ref - Forwarded ref.
 * @returns {React.JSX.Element}
 */
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-[0.8rem] text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

/**
 * `FormMessage` is a component used to display validation error messages or other
 * messages related to a specific form field.
 *
 * It uses the `useFormField` hook to:
 * - Access the field's `error` state (from `react-hook-form`).
 * - Get the `formMessageId`, which is set as its `id` attribute for `aria-describedby` linking.
 *
 * The component only renders if there is an `error` message for the field or if
 * explicit `children` are provided to it. The error message text is taken from `error.message`.
 *
 * @param {React.HTMLAttributes<HTMLParagraphElement>} props - Standard HTML paragraph attributes.
 * @param {React.Ref<HTMLParagraphElement>} ref - Forwarded ref.
 * @returns {React.JSX.Element | null} The error message paragraph, or null if no message.
 */
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-[0.8rem] font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
