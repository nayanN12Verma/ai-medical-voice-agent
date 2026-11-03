"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { Circle, PhoneCall, PhoneOff, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import Vapi from "@vapi-ai/web";
import { doctorAgent } from "../../_components/DoctorCard";
import { getVapiVoiceId } from "@/shared/vapiVoices";
import { toast } from "sonner";

export type SessionDetails = {
  id: number;
  notes: string;
  sessionId: string;
  report: JSON;
  selectedDoctor: doctorAgent;
  createdon: string;
};

type message = {
  role: string;
  text: string;
};

function MedicalVoiceAgent() {
  const router = useRouter();
  const { sessionId } = useParams();
  const [loading, setLoading] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails>();
  const [callStarted, setCallStarted] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [liveTranscripts, setLiveTranscripts] = useState<string>();
  const [messages, setMessages] = useState<message[]>([]);
  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    if (sessionId) GetSessionDetails();
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
        vapiRef.current.removeAllListeners();
        vapiRef.current = null;
      }
    };
  }, []);

  const GetSessionDetails = async () => {
    try {
      const result = await axios.get("/api/session-chat?sessionId=" + sessionId);
      const data = result.data;
      // Normalize doctor.id — JSON from DB may deserialize it as a string
      if (data?.selectedDoctor?.id != null) {
        data.selectedDoctor.id = Number(data.selectedDoctor.id);
      }
      setSessionDetails(data);
    } catch (error) {
      console.error("Error fetching session details:", error);
      toast.error("Failed to load session details.");
    }
  };

  const startCall = async () => {
    if (!sessionDetails?.selectedDoctor) {
      toast.error("Doctor details are missing. Please start a new consultation.");
      return;
    }

    if (callStarted || vapiRef.current) {
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    if (!apiKey) {
      toast.error("Vapi API key is not configured.");
      return;
    }

    setLoading(true);
    const doctor = sessionDetails.selectedDoctor;
    const voiceId = getVapiVoiceId(doctor);

    try {
      const vapi = new Vapi(apiKey);

      vapi.on("call-start", () => {
        setCallStarted(true);
        setLoading(false);
      });

      vapi.on("call-end", () => {
        setCallStarted(false);
        setLoading(false);
        vapiRef.current = null;
      });

      vapi.on("call-start-failed", (event: any) => {
        // Vapi SDK uses 'errorMsg' not 'error' in this event payload
        const errMsg =
          event?.errorMsg || event?.error || JSON.stringify(event) || "Unknown error";
        console.error("Call start failed:", errMsg, event);
        toast.error(`Call failed to start: ${errMsg}`);
        setCallStarted(false);
        setLoading(false);
        vapiRef.current = null;
      });

      vapi.on("error", (error) => {
        console.error("Vapi error:", error);
        const message =
          typeof error === "object" && error !== null && "message" in error
            ? String((error as { message: unknown }).message)
            : "An unexpected call error occurred.";
        toast.error(message);
        setLoading(false);
      });

      vapi.on("message", (message) => {
        if (message?.type === "status-update" && message?.status === "ended") {
          const reason = message.endedReason ?? "unknown";
          console.warn("[Vapi] Call ended with reason:", reason);
          if (reason !== "customer-ended-call") {
            toast.error(`Call ended unexpectedly: ${reason}`);
          }
        }

        if (message?.type === "transcript") {
          const { role, transcriptType, transcript } = message;
          if (transcriptType === "partial") {
            setLiveTranscripts(transcript);
            setCurrentRole(role);
          } else if (transcriptType === "final") {
            setMessages((prev) => [...prev, { role, text: transcript }]);
            setLiveTranscripts("");
            setCurrentRole(null);
          }
        }
      });

      vapi.on("speech-start", () => setCurrentRole("assistant"));
      vapi.on("speech-end", () => setCurrentRole("user"));

      const result = await vapi.start({
        name: "AI Medical Doctor Agent",
        firstMessage: `Hello! I'm your ${doctor.specialist} AI assistant. How can I help you today?`,
        transcriber: {
          provider: "deepgram",
          language: "en-US",
        },
        // Use OpenAI TTS as primary provider (stable). PlayHT as fallback.
        // PlayHT as primary was causing 'playht-unknown-error' → immediate disconnect.
        voice: {
          provider: "openai",
          voiceId: "alloy",
          fallbackPlan: {
            voices: [
              { provider: "playht", voiceId },
              { provider: "openai", voiceId: "nova" },
            ],
          },
        },
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                doctor.agentPrompt ||
                "You are a helpful medical assistant. Please assist the user with their medical queries.",
            },
          ],
        },
      });

      // Assign ref AFTER start() resolves successfully to avoid race condition
      if (result) {
        vapiRef.current = vapi;
      } else {
        toast.error("Failed to start the call. Please try again.");
        setLoading(false);
        vapi.removeAllListeners();
      }
    } catch (err) {
      console.error("Error starting Vapi agent:", err);
      toast.error("Failed to start the call. Please try again.");
      setLoading(false);
    }
  };

  const endCall = async () => {
    setLoading(true);

    if (vapiRef.current) {
      try {
        vapiRef.current.stop();
        vapiRef.current.removeAllListeners();
        vapiRef.current = null;
        setCallStarted(false);

        const report = await GenerateReport();
        console.log("Report saved:", report);
      } catch (error) {
        console.error("Error ending call:", error);
        toast.error("Failed to end the call cleanly.");
      }
    }

    setLoading(false);
    toast.success("Call ended and report generated successfully!");
    router.replace("/dashboard");
  };

  const GenerateReport = async () => {
    try {
      const result = await axios.post("/api/medical-report", {
        messages,
        sessionDetails,
        sessionId,
      });
      return result.data;
    } catch (err) {
      console.error("Report generation failed:", err);
    }
  };

  return (
    <div className="p-6 border rounded-3xl bg-secondary/20 shadow-lg w-full max-w-md mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="px-3 py-1 border rounded-full flex gap-2 items-center text-sm font-medium">
          <Circle className={`h-4 w-4 rounded-full ${callStarted ? "bg-green-400" : "bg-red-400"}`} />
          {callStarted ? "Call Connected" : "Call Not Started"}
        </h2>
        <h2 className="font-semibold text-gray-500 text-sm">00:00</h2>
      </div>

      {sessionDetails && (
        <div className="flex items-center flex-col mt-8">
          <Image
            src={sessionDetails.selectedDoctor?.image ?? "/doctor1.png"}
            alt="doctor image"
            width={100}
            height={100}
            className="h-[100px] w-[100px] object-cover rounded-full shadow-md"
          />
          <h2 className="mt-3 text-lg font-semibold text-gray-800">
            {sessionDetails.selectedDoctor?.specialist}
          </h2>
          <p className="text-sm text-gray-500">AI Medical Voice Agent</p>

          <div className="mt-10 text-center space-y-1 overflow-y-auto flex flex-col items-center px-6 max-h-48">
            {messages.slice(-4).map((msg, idx) => (
              <h2 className="text-sm text-gray-400" key={idx}>
                {msg.role}: {msg.text}
              </h2>
            ))}
            {liveTranscripts && (
              <h2 className="text-base font-medium text-gray-700">
                {currentRole}: {liveTranscripts}
              </h2>
            )}
          </div>

          <Button
            onClick={callStarted ? endCall : startCall}
            variant={callStarted ? "destructive" : "default"}
            className="mt-12 px-6 py-2 text-base rounded-xl shadow-md flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <Loader className="animate-spin h-4 w-4" />
            ) : callStarted ? (
              <>
                <PhoneOff className="h-4 w-4" /> End Call
              </>
            ) : (
              <>
                <PhoneCall className="h-4 w-4" /> Start Call
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default MedicalVoiceAgent;
