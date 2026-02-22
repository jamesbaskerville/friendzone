import { useParams } from "react-router";

export function Thread() {
  const { messageId } = useParams();

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-text-secondary">Thread for message {messageId}</p>
    </div>
  );
}
