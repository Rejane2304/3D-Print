import type { ReactNode } from "react";

export default function SecondaryLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#2d3148" }}>
      {children}
    </div>
  );
}
