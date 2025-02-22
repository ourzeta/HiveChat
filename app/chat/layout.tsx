'use client';
import React, { useEffect } from 'react'
import App from "@/app/components/App";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-dvh">
      <App>{children}</App>
    </div>
  )
}