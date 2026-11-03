import App from "next/app";
import React from "react";
import AppHeader from "./_components/AppHeader";
function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
        <AppHeader />

       <div className="px-10 mid:px-20 lg:px-40 py-10">
       {children}
       </div>
    </div>
  );
}
export default DashboardLayout;