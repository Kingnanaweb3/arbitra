"use client";

let zkLoginAddress: string | null = null;
let zkLoginEmail: string | null = null;

export function getZkLoginAddress(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("zklogin_address");
}

export function getZkLoginEmail(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("zklogin_email");
}

export function setZkLoginUser(address: string, email: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("zklogin_address", address);
  sessionStorage.setItem("zklogin_email", email);
}

export function getZkLoginUsername(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("zklogin_username");
}

export function setZkLoginUsername(username: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("zklogin_username", username);
}

export function clearZkLoginUser() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("zklogin_address");
  sessionStorage.removeItem("zklogin_email");
  sessionStorage.removeItem("zklogin_jwt");
  sessionStorage.removeItem("zklogin_randomness");
  sessionStorage.removeItem("zklogin_max_epoch");
  sessionStorage.removeItem("zklogin_ephemeral_key");
}

export function parseJwtEmail(jwt: string): string {
  try {
    const payload = jwt.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.email ?? decoded.sub ?? "Google User";
  } catch {
    return "Google User";
  }
}

export function deriveAddressFromJwt(jwt: string): string {
  try {
    const payload = jwt.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    const sub = decoded.sub ?? "unknown";
    return `0x${sub.slice(0, 6)}...${sub.slice(-4)}`;
  } catch {
    return "0x...zklogin";
  }
}
