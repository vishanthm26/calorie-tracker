export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { meal } = req.body;
  if (!meal) return res.status(400).json({ error: 'No meal provided' });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: `You are a nutrition estimator. Respond ONLY with a JSON object (no markdown, no backticks) with:
- name: short cleaned meal name (string)
- kcal: estimated calories (integer)
- protein: grams (integer)
- carbs: grams (integer)
- fat: grams (integer)
- note: one short sentence on accuracy or portion tips (string)
Be realistic for Indian home-cooked portions. Always estimate, never refuse.`,
      messages: [{ role: 'user', content: meal }]
    })
  });

  const data = await response.json();
  const text = data.content?.find(b => b.type === 'text')?.text || '';
  const est = JSON.parse(text.replace(/```json|```/g, '').trim());
  res.status(200).json(est);
}
