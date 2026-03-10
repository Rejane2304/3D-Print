import type { ReactNode } from "react";

export default function SecondaryLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#181a24" }}>
      {children}
    </div>
  );
}
