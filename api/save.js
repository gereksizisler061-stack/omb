export default async function handler(req, res) {
  // CORS her durumda mümkün olduğunca önce ayarlansın
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, x-api-key"
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    /* ================= ENV CHECK ================= */

    if (!process.env.API_KEY) {
      return res.status(500).json({
        error: "API_KEY environment variable missing"
      });
    }

    if (!process.env.SUPABASE_URL) {
      return res.status(500).json({
        error: "SUPABASE_URL environment variable missing"
      });
    }

    if (!process.env.SUPABASE_KEY) {
      return res.status(500).json({
        error: "SUPABASE_KEY environment variable missing"
      });
    }

    /* ================= AUTH ================= */

    const apiKey = req.headers["x-api-key"];

    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    /* ================= INPUT ================= */

    const { users } = req.body || {};

    if (!Array.isArray(users)) {
      return res.status(400).json({
        error: "users array required"
      });
    }

    /* ================= CLEAN USERS ================= */

    const cleanUsers = users.map(u => ({
      name: u.name,
      position: u.pos || u.position || null,
      rank: u.rank || null,
      family: u.family || null,
      wealth: u.wealth || null,
      plating: u.plating || null,

      casino: Array.isArray(u.casino)
        ? u.casino.join(", ")
        : u.casino || null,

      is_casino_owner:
        u.isCasinoOwner ??
        u.is_casino_owner ??
        false,

      profile_url:
        u.profileUrl ||
        u.profile_url ||
        null,

      updated_at: new Date().toISOString()
    }));

    const uniqueUsers = Array.from(
      new Map(
        cleanUsers
          .filter(u => u.name)
          .map(u => [u.name, u])
      ).values()
    );

    /* ================= DELETE OLD ================= */

    const deleteUrl =
      `${process.env.SUPABASE_URL}/rest/v1/users?name=not.is.null`;

    const deleteResponse = await fetch(deleteUrl, {
      method: "DELETE",

      headers: {
        apikey: process.env.SUPABASE_KEY,

        Authorization:
          `Bearer ${process.env.SUPABASE_KEY}`,

        "Content-Type": "application/json"
      }
    });

    const deleteText = await deleteResponse.text();

    if (!deleteResponse.ok) {
      return res.status(deleteResponse.status).json({
        error: "Supabase delete error",
        details: deleteText
      });
    }

    /* ================= EMPTY RESULT ================= */

    if (uniqueUsers.length === 0) {
      return res.status(200).json({
        ok: true,
        deleted: true,
        saved: 0
      });
    }

    /* ================= INSERT ================= */

    const insertUrl =
      `${process.env.SUPABASE_URL}/rest/v1/users`;

    const response = await fetch(insertUrl, {
      method: "POST",

      headers: {
        apikey: process.env.SUPABASE_KEY,

        Authorization:
          `Bearer ${process.env.SUPABASE_KEY}`,

        "Content-Type": "application/json",

        Prefer: "resolution=merge-duplicates"
      },

      body: JSON.stringify(uniqueUsers)
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Supabase insert error",
        details: text
      });
    }

    /* ================= SUCCESS ================= */

    return res.status(200).json({
      ok: true,
      deleted: true,
      saved: uniqueUsers.length
    });

} catch (err) {
  console.error("SAVE API ERROR:", err);
  console.error("CAUSE:", err?.cause);

  return res.status(500).json({
    error: "Internal server error",
    message: err?.message || String(err),
    cause: err?.cause?.message || null,
    code: err?.cause?.code || null
  });
}
