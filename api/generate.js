// Vercel serverless function to proxy Grok API calls
// This keeps the API key secure

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description } = req.body;

  if (!description || typeof description !== 'string') {
    return res.status(400).json({ error: 'Description is required' });
  }

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast-non-reasoning',
        messages: [{
          role: 'user',
          content: `Generate a JSON workflow for: "${description}". 

Return ONLY valid JSON (no markdown, no explanations) in this exact format:
{
  "name": "Workflow Name",
  "nodes": [
    {"id": "1", "label": "Step description", "type": "scraper"},
    {"id": "2", "label": "Step description", "type": "llm"}
  ],
  "edges": [
    {"from": "1", "to": "2"}
  ]
}

Keep it simple (3-5 nodes). Node types: scraper, llm, email, filter, webhook, database, api.`
        }],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
