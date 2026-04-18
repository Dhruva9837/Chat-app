'use client'

import React from 'react';
import { GlobalSidebar } from '@/components/chat/GlobalSidebar';
import { CleanChatList } from '@/components/chat/CleanChatList';
import { CleanChatWindow } from '@/components/chat/CleanChatWindow';
import { CleanInfoPanel } from '@/components/chat/CleanInfoPanel';

export default function DesktopPreviewPage() {
  return (
    <div className="theme-clean-light min-h-screen w-full bg-primary-bg overflow-hidden flex font-sans antialiased">
      {/* 1. Navigation Sidebar (Minimized/Standard) */}
      <GlobalSidebar />

      {/* 2. Content Container */}
      <div className="flex-1 flex h-screen overflow-hidden">
        {/* 2.1 Chat Selection Sidebar */}
        <CleanChatList />

        {/* 2.2 Main Chat Window */}
        <CleanChatWindow />

        {/* 2.3 Shared Files/Info Panel */}
        <CleanInfoPanel />
      </div>
    </div>
  );
}
