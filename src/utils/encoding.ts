const SECRET_KEY = "WEBCOURSE_EXAM_2024_SECURE_KEY_XYZ";

export function encodeResult(data: object): string {
  const json = JSON.stringify(data);
  const bytes: number[] = [];
  for (let i = 0; i < json.length; i++) {
    bytes.push(json.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
  }
  // Convert to hex string — always safe, no btoa issues
  const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  // Second pass: base64 of hex
  return btoa(hex);
}

export function decodeResult(encoded: string): object {
  const hex = atob(encoded);
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  let json = "";
  for (let i = 0; i < bytes.length; i++) {
    json += String.fromCharCode(bytes[i] ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
  }
  return JSON.parse(json);
}
