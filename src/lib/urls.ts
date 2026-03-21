export function normalizeExternalUrl(input: string) {
  const url = new URL(input.trim());

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
