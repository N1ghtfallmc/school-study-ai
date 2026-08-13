const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file (for local development)
if (process.env.NODE_ENV !== 'production') {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        });
    }
}

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Serve static files (always, for both local and Vercel)
app.use(express.static(path.join(__dirname)));

// API Route: Generate study materials
app.post('/api/generate', async (req, res) => {
    try {
        const { notes, summaryCount = 4, quizCount = 5, flashcardCount = 10 } = req.body;

        if (!notes || typeof notes !== 'string') {
            return res.status(400).json({ error: 'Notes are required' });
        }

        if (notes.length > 3000) {
            return res.status(400).json({ error: 'Notes exceed maximum length of 3000 characters' });
        }

        // Validate counts
        const validSummaryCount = Math.min(Math.max(parseInt(summaryCount) || 4, 3), 8);
        const validQuizCount = Math.min(Math.max(parseInt(quizCount) || 5, 5), 25);
        const validFlashcardCount = Math.min(Math.max(parseInt(flashcardCount) || 10, 10), 30);

        const prompt = `You are an expert educational content creator. Analyze the following study notes and create educational materials in JSON format:

STUDY NOTES:
${notes}

Return ONLY a valid JSON object with this exact structure:
{
  "summary": ["First key point", "Second key point", "Third key point"],
  "flashcards": [
    {"term": "First term", "definition": "Clear definition"},
    {"term": "Second term", "definition": "Clear definition"},
    {"term": "Third term", "definition": "Clear definition"}
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
    }
  ]
}

Requirements:
- Summary: Extract exactly ${validSummaryCount} key concepts as bullet points
- Flashcards: Create exactly ${validFlashcardCount} term-definition pairs from the content
- Quiz: Create exactly ${validQuizCount} multiple-choice questions with 4 options each
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
1. Khan Academy (khanacademy.org) - free video lessons and exercises
2. OpenStax (openstax.org) - free open textbooks
3. CK-12 Foundation (ck12.org) - free educational resources
4. MIT OpenCourseWare (ocw.mit.edu) - free course materials
5. Crash Course (youtube.com/crashcourse) - YouTube educational series
6. edX (edx.org) - free online courses from universities
7. Coursera (coursera.org) - free online courses
8. TED-Ed (ed.ted.com) - educational videos
9. National Geographic Education (nationalgeographic.org/education)
10. Smithsonian Learning Lab (learninglab.si.edu)

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

// Serve index.html for all other routes (SPA-like behavior)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server (only for local development)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`SchoolStudy AI server running on port ${PORT}`);
        console.log(`Open http://localhost:${PORT} in your browser`);
    });
}

// Export for Vercel
module.exports = app;