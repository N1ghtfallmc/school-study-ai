const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Check for required environment variables
if (!process.env.GROQ_API_KEY) {
    console.error('ERROR: GROQ_API_KEY environment variable is not set');
    console.error('Please create a .env file with your Groq API key');
    process.exit(1);
}

// API Route: Generate study materials
app.post('/api/generate', async (req, res) => {
    try {
        const { notes } = req.body;

        if (!notes || typeof notes !== 'string') {
            return res.status(400).json({ error: 'Notes are required' });
        }

        if (notes.length > 3000) {
            return res.status(400).json({ error: 'Notes exceed maximum length of 3000 characters' });
        }

        const prompt = `You are an expert educational content creator. Analyze the following study notes and create educational materials in JSON format:

STUDY NOTES:
${notes}

Return ONLY a valid JSON object with this exact structure:
{
  "summary": ["First key point", "Second key point", "Third key point", "Fourth key point"],
  "flashcards": [
    {"term": "First term", "definition": "Clear definition"},
    {"term": "Second term", "definition": "Clear definition"},
    {"term": "Third term", "definition": "Clear definition"},
    {"term": "Fourth term", "definition": "Clear definition"},
    {"term": "Fifth term", "definition": "Clear definition"}
  ],
  "quiz": [
    {
      "question": "First question based on the notes?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0
    },
    {
      "question": "Second question based on the notes?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 1
    },
    {
      "question": "Third question based on the notes?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 2
    }
  ]
}

Requirements:
- Summary: Extract 4 key concepts as bullet points
- Flashcards: Create 5 term-definition pairs from the content
- Quiz: Create 3 multiple-choice questions with 4 options each
- Make all content directly derived from the provided notes
- Return ONLY the JSON, no additional text`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert educational content creator who always responds with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2048
            })
        });

        const data = await response.json();

        if (data.error) {
            if (data.error.type === 'rate_limit_error' || response.status === 429) {
                return res.status(429).json({ error: 'Rate limit exceeded' });
            }
            throw new Error(data.error.message);
        }

        const aiText = data.choices[0].message.content;

        // Extract JSON from response (handle potential markdown formatting)
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[0]);
            return res.json(parsedData);
        } else {
            throw new Error('Could not extract JSON from response');
        }

    } catch (error) {
        console.error('Error in /api/generate:', error);
        res.status(500).json({ error: 'Failed to generate study materials' });
    }
});

// API Route: Search educational resources
app.post('/api/search', async (req, res) => {
    try {
        const { topic } = req.body;

        if (!topic || typeof topic !== 'string') {
            return res.status(400).json({ error: 'Topic is required' });
        }

        const prompt = `You are an expert educational resource curator. Find 3 high-quality educational resources for the topic: "${topic}"

Focus on these types of resources:
1. Khan Academy (free video lessons and exercises)
2. OpenStax (free open textbooks)
3. CK-12 Foundation (free educational resources)
4. MIT OpenCourseWare
5. Crash Course (YouTube educational series)
6. Other reputable educational platforms

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Resource title",
    "link": "Full URL to the resource",
    "format": "Format type (e.g., 'Video Course', 'Textbook', 'Article', 'Interactive')",
    "explanation": "One sentence explaining why this resource is useful for learning about ${topic}"
  }
]

Requirements:
- All links must be real, working URLs to actual educational content
- Focus on free, reputable educational sources
- Make the explanation specific to how it helps learn ${topic}
- Return ONLY the JSON array, no additional text`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert educational resource curator who always responds with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        const data = await response.json();

        if (data.error) {
            if (data.error.type === 'rate_limit_error' || response.status === 429) {
                return res.status(429).json({ error: 'Rate limit exceeded' });
            }
            throw new Error(data.error.message);
        }

        const aiText = data.choices[0].message.content;

        // Extract JSON from response
        const jsonMatch = aiText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[0]);
            return res.json(parsedData);
        } else {
            throw new Error('Could not extract JSON from response');
        }

    } catch (error) {
        console.error('Error in /api/search:', error);
        res.status(500).json({ error: 'Failed to search resources' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`SchoolStudy AI server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});