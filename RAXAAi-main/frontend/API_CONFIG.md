# RAXA API Configuration

API base URL is automatically configured based on environment:

- **Development**: `http://localhost:8000`
- **Production**: Configure in `.env.local`

## Environment Variables

Create `.env.local` in the frontend directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# App Configuration
NEXT_PUBLIC_APP_NAME=RAXA AI
NEXT_PUBLIC_APP_VERSION=2.0.0
```

## API Client Setup

The frontend automatically uses the API URL from environment variables.

Example API call in Next.js:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL; // base backend URL (no /api/v2)

// Predict diseases
const response = await fetch(`${API_URL}/api/v2/predict/analyze`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ age: 45, gender: 'male' })
});
```

## Available Endpoints

### Health Management
- `/health/save` - Save health data
- `/health/:id` - Get/Update/Delete health data

### Disease Prediction
- `/predict/analyze` - Analyze and predict
- `/predict/results/:id` - Get results

### Adaptive Questionnaire
- `/adaptive/questions` - Initial questions
- `/adaptive/next-questions` - Follow-up questions
- `/adaptive/categories` - Get categories

### Disease Database
- `/diseases/list` - All diseases
- `/diseases/:name` - Disease details
- `/diseases/category/:name` - By category
- `/diseases/search` - Search diseases
