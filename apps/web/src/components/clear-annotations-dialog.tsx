'use client';

import { ConfirmationDialog } from '@/components/confirmation-dialog';

export function ClearAnnotationsDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmationDialog
      title="Clear annotations?"
      description="This removes every highlight and text style from this reading. Saved-word styling will stay in place."
      confirmLabel="Clear annotations"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
