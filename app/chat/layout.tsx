'use client';
import App from "@/app/components/App";
import AppPrepare from "@/app/components/ChatPrepare";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <div className="flex flex-col h-dvh">
      <AppPrepare />
      <App>{children}</App>
    </div>
  )
}