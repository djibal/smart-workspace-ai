import { riskLevel, type ThreatEvent } from "@/lib/sim";

export type ThreatAction = "allow" | "ask" | "block";

const permissionRisks: Record<string, string> = {
  camera: "Camera access could expose images of you and your surroundings.",
  microphone: "Microphone access could capture conversations and background audio.",
  "clipboard-read": "Clipboard access could expose copied passwords, messages or other sensitive text.",
  geolocation: "Location access could reveal where you are and your movement patterns.",
  notifications: "Notifications can interrupt you or display sensitive content on screen.",
  "screen-capture": "Screen capture could expose private documents, messages and other open apps.",
  "usb-device": "USB access could let an app communicate with a connected device and its data.",
};

export function threatDisplay(event: ThreatEvent) {
  const severity = riskLevel(event.risk);
  const action: ThreatAction = severity === "high" ? "block" : severity === "medium" ? "ask" : "allow";
  return {
    severity,
    severityLabel: `${severity[0]?.toUpperCase()}${severity.slice(1)} severity`,
    scoreLabel: `Simulated risk score ${event.risk} out of 100; ${severity} severity. Not a device security assessment.`,
    risk: event.type === "permission"
      ? permissionRisks[event.target] ?? "This permission could expose device data or capabilities; review why the app needs it."
      : severity === "high"
        ? "This sample destination has a high generated risk score; an unfamiliar destination can expose data or imitate a trusted service."
        : severity === "medium"
          ? "This sample destination may involve tracking or an unfamiliar service; review what data would be shared."
          : "This sample destination has a low generated risk score. A low score does not establish that a real connection is safe.",
    action,
  };
}

export function recommendationDisplay(action: ThreatAction) {
  return {
    label: action === "ask" ? "Ask before granting access" : action === "block" ? "Block access" : "Allow only if needed",
    explanation: action === "ask"
      ? "Review the request and confirm that it matches what you intended before granting access."
      : action === "block"
        ? "Withhold access until the request and destination have been verified."
        : "Grant access only when you trust the app and this request is necessary for your task.",
    available: false as const,
    availability: "Informational only. AegisDesk cannot apply this action in the web demo; no device permission or connection is changed.",
  };
}