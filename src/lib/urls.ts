export function normalizeExternalUrl(input: string) {
  const url = new URL(input.trim());

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http and https links are allowed.");
  }

  url.hash = "";

  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString();
}

export function createGoogleMapsQueryUrl(input: {
  label: string;
  latitude: number;
  longitude: number;
}) {
  const { label, latitude, longitude } = input;
  const query = encodeURIComponent(`${label} ${latitude},${longitude}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
