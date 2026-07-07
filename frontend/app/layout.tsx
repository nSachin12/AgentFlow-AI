import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

export const metadata: Metadata = {
  title: "Autonomous AI Agent",
  description: "Transform natural language into professional business documents",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full">
      <body className="bg-[#020617] text-white min-h-screen overflow-x-hidden overflow-y-auto">
        <AnimatedBackground />
        <Sidebar />
        <main className="relative z-10 ml-16 lg:ml-60 min-h-screen w-[calc(100%-4rem)] lg:w-[calc(100%-15rem)] overflow-y-auto pb-10">
          {children}
        </main>
      </body>
    </html>
  );
}
