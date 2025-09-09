# Startup-Investor Matching System - Frontend

AI-powered startup-investor matching system with article analysis and investment tracking.

## Features

- 📊 **Dashboard**: Real-time statistics and news collection progress
- 🏢 **Investor Management**: Comprehensive investor profiles and contact information
- 📰 **Article Analysis**: AI-powered investment information extraction
- 💰 **Investment Tracking**: Track investment rounds and fund formations
- 🏷️ **Data Labeling**: Token-level labeling for ML model training

## Tech Stack

- **React 18** with TypeScript
- **Ant Design** for UI components
- **Axios** for API communication
- **React Router** for navigation

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Environment Variables

Create a `.env` file in the root directory:

```bash
REACT_APP_API_URL=https://your-backend-url.railway.app
```

## Deployment

This frontend is deployed on Vercel and automatically builds from the main branch.

## API Integration

The frontend communicates with the backend API for:
- Investor data management
- Article collection and analysis
- Investment information extraction
- Fund formation tracking
- Data labeling for ML training

## License

Private project for startup-investor matching system.