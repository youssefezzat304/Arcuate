export function StatusNotice({ message }: { message: string | null }) {
  return message ? (
    <p role="status" dir="auto" className="fixed bottom-5 left-1/2 z-50 max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-lg bg-accent px-4 py-3 font-sans text-sm text-accent-foreground shadow-sm">
      {message}
    </p>
  ) : null;
}
