import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

/** Navbar + full-height content without footer, for the video learning page. */
export function LearnLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar />
      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
