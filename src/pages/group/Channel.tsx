import { useParams } from "react-router";

export function Channel() {
  const { channelId } = useParams();

  return (
    <div className="flex h-full flex-col">
      <header className="bg-bg-secondary border-b border-border p-4">
        <h2 className="font-display text-lg font-semibold">
          Channel {channelId}
        </h2>
      </header>
      <div className="flex flex-1 items-center justify-center">
        <p className="text-text-secondary">Messages will appear here</p>
      </div>
    </div>
  );
}
