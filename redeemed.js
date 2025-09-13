import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const filePath = path.resolve('.', 'redeemed.json');

  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(data);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(json);
  } catch {
    return res.status(500).json({ error: 'Failed to read redeemed data.' });
  }
}
