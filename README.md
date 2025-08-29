# Free SeoAnalyser - Open Source SEO Analysis & Web Research Platform

<div align="center">
  <img src="https://img.shields.io/badge/FREE-Open%20Source-brightgreen?style=for-the-badge" alt="Free Open Source" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="MIT License" />
</div>

<br />

**Free SeoAnalyser** is a completely free, open-source SEO analysis and web research platform designed to democratize SEO tools for everyone. No hidden fees, no premium tiers - just powerful SEO analysis tools available to all. Built with modern technologies and AI integration, Free SeoAnalyser provides professional-grade SEO insights and recommendations without the cost.

## 🌟 Key Features

### SEO & Analysis Tools
- 🔍 **Comprehensive SEO Scoring** - Real-time SEO analysis with actionable insights
- 📊 **Competitor Intelligence** - Deep dive into competitor strategies and rankings
- 🔗 **Backlink Profile Analysis** - Visual mapping and quality assessment of backlinks
- 📝 **Content Optimization** - AI-powered content quality scoring and recommendations
- 🎯 **Smart Keyword Research** - Discover high-value keywords with search volume data
- 📈 **Technical Site Audit** - Identify and fix technical SEO issues

### AI-Powered Capabilities
- 🤖 **Intelligent SEO Assistant** - Get instant answers to SEO questions
- 🔬 **Web Research Engine** - Automated research with AI summarization
- 💡 **Smart Recommendations** - Personalized optimization suggestions
- 🌐 **Real-time SERP Analysis** - Live search results analysis and tracking

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: DeepSeek API
- **Search APIs**: Serper API, SerpAPI

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- API Keys (see Environment Setup)

## Installation

1. **Clone the repository:**
```bash
git clone https://github.com/bluesonix21/seoanalyser.git
cd seoanalyser
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` file and add your API keys:
- `DATABASE_URL`: PostgreSQL connection string
- `SERPAPI_KEY`: Get from [SerpAPI](https://serpapi.com/)
- `SERPER_API_KEY`: Get from [Serper](https://serper.dev/)
- `DEEPSEEK_API_KEY`: Get from [DeepSeek](https://www.deepseek.com/)

4. **Set up database:**
```bash
npm run db:migrate
```

5. **Start development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
FantasyQuestRealm/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── lib/        # Utilities and services
│   │   └── pages/      # Page components
├── server/             # Express backend
│   ├── routes.ts       # API routes
│   └── researchApi.ts  # Research API handlers
├── shared/             # Shared types and schemas
└── migrations/         # Database migrations
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database (if applicable)

## API Documentation

### Endpoints

- `POST /api/search` - Perform web search
- `POST /api/scrape` - Scrape web page content
- `GET /api/seo/analyze` - Analyze URL for SEO
- `POST /api/ai/chat` - AI assistant chat

## Security

This project follows security best practices:
- Environment variables for sensitive data
- No hardcoded credentials
- Input validation and sanitization
- CORS configuration
- Rate limiting (recommended for production)

See `SECURITY_REPORT.md` for detailed security analysis.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For support, please open an issue in the GitHub repository.

## Acknowledgments

- React and Vite communities
- TailwindCSS for styling
- All API service providers
- Open source contributors

---

**Note:** Remember to never commit sensitive data like API keys to the repository. Always use environment variables for configuration.