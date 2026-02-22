import { Outlet, useParams } from "react-router";

export function GroupLayout() {
  const { groupId } = useParams();

  return (
    <div className="flex h-screen">
      <aside className="bg-bg-secondary flex w-64 flex-col border-r border-border p-4">
        <h2 className="font-display text-lg font-semibold">
          Group {groupId}
        </h2>
        <nav className="mt-4 flex flex-col gap-1">
          <p className="text-text-tertiary text-sm">Channels coming soon</p>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
