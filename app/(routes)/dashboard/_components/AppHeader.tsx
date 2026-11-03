import React from "react";
import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

const menuOptions = [
  {
    id: 1,
    name: "Home",
    path: "/dashboard",
  },
  {
    id: 2,
    name: "History",
    path: "/dashboard/history",
  },
  {
    id: 3,
    name: "Pricing",
    path: "/pricing",
  },
  {
    id: 4,
    name: "Profile",
    path: "/profile",
  },
];

function AppHeader() {
  return (
    <div className="flex items-center justify-between p-4 shadow px-10 mid:px-20 lg:px-40">
      <Image src="/logo.png" alt="Logo" width={180} height={90} />

      <div className="hidden md:flex gap-12 items-center">
        {menuOptions.map((option) => (
          <Link key={option.id} href={option.path}>
            <h2 className="hover:font-bold cursor-pointer transition-all">
              {option.name}
            </h2>
          </Link>
        ))}
      </div>

      <UserButton />
    </div>
  );
}

export default AppHeader;
