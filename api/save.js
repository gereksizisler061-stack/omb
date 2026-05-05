export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = req.headers["x-api-key"];

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  const body = req.body;

  if (!body || !Array.isArray(body.users)) {
    return res.status(400).json({ error: "users array required" });
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates"
    },
    body: JSON.stringify(body.users)
  });

  const text = await response.text();

  if (!response.ok) {
    return res.status(response.status).json({
      error: "Supabase error",
      details: text
    });
  }

  return res.status(200).json({
    ok: true,
    inserted: body.users.length
  });
}
