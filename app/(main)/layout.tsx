import React from "react";
import LeftSidebar from "@/components/ui/LeftSidebar";
import RightSidebar from "@/components/ui/RightSidebar";
import MobileNavbar from "@/components/ui/MobileNavbar";
import MobileHeader from "@/components/ui/MobileHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark-mode flex min-h-screen bg-snow-white text-almost-black font-din-round pt-14 md:pt-0 pb-[68px] md:pb-0 overflow-x-hidden">
      {/* Mobile Top Header Navigation */}
      <MobileHeader />

      {/* Left Sidebar - Fixed */}
      <div className="hidden md:flex w-[256px] border-r-2 border-cloud-gray fixed h-full bg-snow-white z-40">
        <LeftSidebar />
      </div>

      {/* Main Content & Right Sidebar Container */}
      <div className="flex-1 flex justify-center md:pl-[256px]">
        <div className="w-full max-w-[1056px] flex px-4 py-4 md:px-6 md:py-6 gap-12">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Tab Navigation */}
      <MobileNavbar />
    </div>
  );
}
