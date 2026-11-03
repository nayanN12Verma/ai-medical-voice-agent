import { doctorAgent } from "@/app/(routes)/dashboard/_components/DoctorCard";

/** PlayHT voice IDs supported by Vapi's web SDK */
const VAPI_PLAYHT_VOICES = [
  "jennifer",
  "melissa",
  "will",
  "chris",
  "matt",
  "jack",
  "ruby",
  "davis",
  "donna",
  "michael",
] as const;

export type VapiPlayHtVoiceId = (typeof VAPI_PLAYHT_VOICES)[number];

const DOCTOR_VOICE_BY_ID: Record<number, VapiPlayHtVoiceId> = {
  1: "will",
  2: "chris",
  3: "michael",
  4: "jennifer",
  5: "melissa",
  6: "matt",
  7: "jack",
  8: "ruby",
  9: "donna",
  10: "davis",
};

const LEGACY_VOICE_MAP: Record<string, VapiPlayHtVoiceId> = {
  sarge: "michael",
  susan: "jennifer",
  eileen: "melissa",
  charlotte: "matt",
  ayla: "jack",
  aaliyah: "ruby",
  hudson: "donna",
  atlas: "davis",
};

export function getVapiVoiceId(doctor: doctorAgent): VapiPlayHtVoiceId {
  if (doctor.id && DOCTOR_VOICE_BY_ID[doctor.id]) {
    return DOCTOR_VOICE_BY_ID[doctor.id];
  }

  const voiceId = doctor.voiceId?.toLowerCase();
  if (voiceId && VAPI_PLAYHT_VOICES.includes(voiceId as VapiPlayHtVoiceId)) {
    return voiceId as VapiPlayHtVoiceId;
  }

  if (voiceId && LEGACY_VOICE_MAP[voiceId]) {
    return LEGACY_VOICE_MAP[voiceId];
  }

  return "will";
}
