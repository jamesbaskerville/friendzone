import { useParams } from "react-router";

export function Bracket() {
  const { bracketId } = useParams();

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-text-secondary">Bracket {bracketId}</p>
    </div>
  );
}
