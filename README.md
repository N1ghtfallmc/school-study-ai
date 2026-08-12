# SchoolStudy AI 🎓

An AI-powered study application that helps students create study materials and teachers find educational resources.

## Features

### Student Dashboard
- **AI-Generated Summaries**: Extract key concepts from your notes
- **Interactive Flashcards**: Flip cards to learn terms and definitions
- **Practice Quizzes**: Multiple-choice questions based on your content
- **Character Limit**: 3000 character input protection

### Teacher Dashboard
- **Smart Resource Finder**: AI-curated educational resources
- **Quality Sources**: Khan Academy, OpenStax, MIT OpenCourseWare, and more
- **Topic-Specific**: Get targeted resources for any subject

## Security Features
- ✅ Server-side API integration (no exposed keys)
- ✅ Environment variable protection
- ✅ Rate limit handling
- ✅ Input validation

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Groq API key from [console.groq.com](https://console.groq.com)

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open in browser:**
   Navigate to `http://localhost:3001`

## Vercel Deployment

### Step 1: Push to GitHub
Your code is already pushed to GitHub! ✅

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/login with your GitHub account
2. Click "Add New Project" 
3. Import your `school-study-ai` repository from GitHub
4. Configure the project:
   - **Framework Preset**: Select "Express" (if available) or "Other"
   - **Root Directory**: Leave as default
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
5. **Important**: Add environment variable:
   - Click "Environment Variables"
   - Add: `GROQ_API_KEY` = Your Groq API key from [console.groq.com](https://console.groq.com)
6. Click "Deploy"

### Step 3: Access Your App
Vercel will provide a URL like `https://school-study-ai.vercel.app`

### Step 4: Test Your Deployment
- Visit your Vercel URL
- Try the Student Dashboard with some notes
- Try the Teacher Dashboard with a topic search

## Environment Variables

- `GROQ_API_KEY`: Your Groq API key (required)
- `PORT`: Server port (optional, defaults to 3001 locally)

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **AI**: Groq API (Llama 3.3 70B)
- **Deployment**: Vercel

## License

MIT