export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = req.headers["x-api-key"];

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { users } = req.body || {};

  if (!Array.isArray(users)) {
    return res.status(400).json({ error: "users array required" });
  }

  const cleanUsers = users.map(u => ({
    name: u.name,
    position: u.pos || u.position || null,
    rank: u.rank || null,
    family: u.family || null,
    wealth: u.wealth || null,
    plating: u.plating || null,
    casino: Array.isArray(u.casino) ? u.casino.join(", ") : u.casino || null,
    is_casino_owner: u.isCasinoOwner ?? u.is_casino_owner ?? false,
    profile_url: u.profileUrl || u.profile_url || null,
    updated_at: new Date().toISOString()
  }));

  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/users`, {
    method: "POST",
    headers: {
      "apikey": process.env.SUPABASE_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates"
    },
    body: JSON.stringify(cleanUsers)
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
    saved: cleanUsers.length
  });
}
