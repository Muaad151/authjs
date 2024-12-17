import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-sky-500 h-full flex items-center justify-center">
      {children}
    </div>
  );
}
