/**
 * @fileoverview This file provides the ConditionBuilder component, a UI element
 * designed for inputting and validating conditions in JSON format. It uses a
 * textarea for input and provides real-time JSON validation feedback.
 */
import * as React from "react";
import { Textarea } from "@/components/ui/textarea";

/**
 * Props for the ConditionBuilder component.
 */
interface ConditionBuilderProps {
  /** The current JSON string value of the conditions. */
  value: string;
  /**
   * Callback function that is triggered when the content of the textarea changes.
   * It receives the new string value (which may or may not be valid JSON at the time of the call).
   * @param {string} value - The new string value from the textarea.
   */
  onChange: (value: string) => void;
}

/**
 * `ConditionBuilder` is a client-side component that provides a specialized
 * input field for users to define conditions in JSON format. It includes
 * real-time validation and visual feedback for JSON syntax errors.
 *
 * @param {ConditionBuilderProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered condition builder UI.
 */
export function ConditionBuilder({ value, onChange }: ConditionBuilderProps) {
  /** State to store any JSON parsing error message. Null if no error or input is empty. */
  const [error, setError] = React.useState<string | null>(null);

  /**
   * Handles changes to the textarea input.
   * It attempts to parse the input value as JSON. If parsing fails, an error
   * message is set, and the textarea border is styled red. If parsing succeeds
   * (or the input is empty), any existing error is cleared.
   * The `onChange` prop is called with the new string value regardless of its validity,
   * allowing the parent component to see the user's raw input.
   * @param {React.ChangeEvent<HTMLTextAreaElement>} e - The textarea change event.
   */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    try {
      // Validate that the input is proper JSON
      if (newValue.trim() !== '') {
        JSON.parse(newValue);
      }
      setError(null);
      onChange(newValue);
    } catch {
      setError('Invalid JSON format');
      onChange(newValue); // Still update the value so the user can see their typing
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={handleChange}
        rows={6}
        className={error ? "border-red-500" : ""}
        placeholder='{"field": "value", "comparison": "equals", "value": "someValue"}'
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="text-xs text-gray-500">
        Enter conditions in JSON format. Example:
        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
          {`{
  "subject": {
    "id": "123"
  },
  "action": "create"
}`}
        </pre>
      </p>
    </div>
  );
} 