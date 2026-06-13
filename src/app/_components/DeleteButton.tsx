"use client";

import React from "react";

interface DeleteButtonProps {
  action: (formData: FormData) => Promise<void>;
  name: string;
  value: string;
  title: string;
  className?: string;
  label?: string;
  extraHiddenInput?: { name: string; value: string };
}

export default function DeleteButton({
  action,
  name,
  value,
  title,
  className = "",
  label = "🗑️",
  extraHiddenInput
}: DeleteButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`本当に削除してもよろしいですか？`)) {
          e.preventDefault();
        }
      }}
      className="inline-block"
    >
      <input type="hidden" name={name} value={value} />
      {extraHiddenInput && (
        <input type="hidden" name={extraHiddenInput.name} value={extraHiddenInput.value} />
      )}
      <button type="submit" className={className} title={title}>
        {label}
      </button>
    </form>
  );
}