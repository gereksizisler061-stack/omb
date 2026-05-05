import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.API_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const data = req.body;

  if (!data || !data.name) {
    return res.status(400).json({ error: 'Missing required field: name' });
  }

  const { error } = await supabase
    .from('users')
    .upsert({
      name: data.name,
      position: data.pos || data.position || null,
      rank: data.rank || null,
      family: data.family || null,
      wealth: data.wealth || null,
      plating: data.plating || null,
      casino: data.casino || [],
      is_casino_owner: Boolean(data.isCasinoOwner),
      profile_url: data.profileUrl || null,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'name'
    });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true });
}
