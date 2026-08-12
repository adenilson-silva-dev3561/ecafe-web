async function request(url, options = {}) {
  console.debug("[api] request", url, options);
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const text = await response.text().catch(() => null);
      const body = text ? ` - ${text}` : "";
      throw new Error(`Request to ${url} failed with status ${response.status}${body}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    return null;
  } catch (err) {
    console.error("[api] request error", url, err);
    throw err;
  }
}

export { request };
