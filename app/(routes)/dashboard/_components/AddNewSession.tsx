"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react"; 
import SuggestDoctorcard from "./SuggestDoctorCard";
import  { doctorAgent }  from "./DoctorCard";
import { useRouter } from "next/navigation";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import axios from "axios";
function AddNewSession() {
  const [note, setNote] = useState<String>();
  const [loading, setLoading] = useState(false);
  const [suggestedDoctors, setSuggestedDoctors] = useState<doctorAgent[]>();
const [selectedDoctor, setSelectedDoctor] = useState<doctorAgent>();
const router = useRouter();
  const onclickNext =  async() => {
    setLoading(true);
    const result = await axios.post("/api/suggest-doctors",{
      notes: note,
    });
   console.log(result.data);
   setSuggestedDoctors(result.data);
   setLoading(false);
  }
  const onStartConsultation = async () => {
    try {
      setLoading(true);
  
      const result = await axios.post("/api/session-chat", {
        notes: note,
        selectedDoctor: selectedDoctor,
      });
  
      console.log(result.data);
  
      if (result.data?.sessionId) {
        console.log("Session started successfully with ID:", result.data.sessionId);
        // You can also redirect or update state here
        router.push(`/dashboard/medical-agent/${result.data.sessionId}`);
       
      } else {
        console.warn("Session started but no sessionId returned.");
      }
    } catch (error) {
      console.error("Error starting consultation:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    
    <Dialog>
      <DialogTrigger>
        <Button className="mt-3">+ Start a Consultation</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Basic Details</DialogTitle>
          <DialogDescription asChild>
            {!suggestedDoctors ? (
              <div>
                <h2 className="font-medium mb-1">Add Symptoms or Any Other Details</h2>
                <Textarea
                  placeholder="Add details here..."
                  className="h-[200px] mt-1"
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            ) : (
              <div>
              <h2 className="font-semibold text-lg mb-3">Suggested Doctors</h2>
            
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {suggestedDoctors.map((doctor, index) => (
                  <SuggestDoctorcard doctorAgent={doctor} key={index}
                  setSelectedDoctor={() => setSelectedDoctor(doctor)} 
                  selectedDoctor={selectedDoctor}/>
                ))}
              </div>
            </div>
                        )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          {!suggestedDoctors ? (
            <Button disabled={!note} onClick={onclickNext}>
              {loading ? "Loading..." : "Next"}
            </Button>
          ) : (
            <Button disabled={loading || !selectedDoctor} onClick={onStartConsultation}>
            {loading ? "Starting..." : "Start Consultation"}
          </Button>
          
          
          )}

          <DialogClose>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  
  );
}
export default AddNewSession;