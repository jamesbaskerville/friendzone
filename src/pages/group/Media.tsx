export function Media() {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border bg-bg-secondary px-4 py-3">
        <h2 className="font-display text-lg font-semibold">
          {"\u{1F4F7}"} Shared Media
        </h2>
      </header>

      <div className="flex flex-1 items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-3 text-4xl">{"\u{1F5BC}\uFE0F"}</div>
          <p className="text-text-secondary">
            Media shared in channels will appear here.
          </p>
          <p className="mt-1 text-sm text-text-tertiary">
            Coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
