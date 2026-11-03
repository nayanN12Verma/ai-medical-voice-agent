"use client";
import axios from "axios";
import { create } from "domain";
import React, { use,useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { User } from "lucide-react";
import UserDetailContext from "@/context/UserDetailContext";



export type UserType = {
    name: string;
    email: string;
    credit: number;
}

function Provider({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>){

    const {user} = useUser();
    const [userDetail, setuserDetail] = useState<any>();
useEffect(() => {
    user && CreateUser();
}, [user]);

const CreateUser = async () => {
    const result = await axios.post('/api/users');
    console.log(result.data);
    setuserDetail(result.data);
}

return (
    <div>
        <UserDetailContext.Provider value={{userDetail, setuserDetail}}>
            {children}
        </UserDetailContext.Provider>
    </div>
)
}
export default Provider;