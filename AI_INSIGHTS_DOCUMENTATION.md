# AI-Powered Insights Documentation

## Overview

The AI-Powered Insights system uses Claude API to generate personalized, real-time business insights based on your actual dashboard data. The system provides two types of insights:

1. **Interesting Insights** - What's happening in your business (patterns, trends, anomalies)
2. **Prescriptive Insights** - What to do next (actionable recommendations)

## Features

### Dynamic Insights Generation
- Insights are generated in real-time using Claude Sonnet 4
- Based on your actual business metrics from the dashboard
- Personalized to your specific business context (Hawaii retail, tourist/local mix)

### Refresh Capability
- "Get New Insights" button generates completely new analysis
- Uses higher temperature setting to ensure variety
- Never repeats the same insights twice

### Data-Driven Analysis
The AI analyzes:
- Total Revenue
- Foot Traffic
- Transaction count
- Conversion Rate
- Average Transaction Value
- Peak traffic and sales hours
- Top selling products
- Historical trends

## Setup Instructions

### 1. Get Your Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-api03-`)

### 2. Configure Environment Variables

The API key is already configured in `frontend/.env`:

```env
VITE_ANTHROPIC_API_KEY=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
```

**Important:** Keep your API key secure! Never commit it to public repositories.

### 3. Files Created/Modified

**New Files:**
- `frontend/src/utils/generateInsights.js` - Core insight generation logic
- `frontend/src/components/InsightsSection.jsx` - UI component for displaying insights
- `frontend/.env` - Environment configuration with API key
- `frontend/.env.example` - Template for API key configuration

**Modified Files:**
- `frontend/src/components/Dashboard.jsx` - Integrated InsightsSection component

## How It Works

### 1. Data Collection
The Dashboard component collects business metrics from your backend API:
- Revenue data
- Foot traffic data
- Transaction data
- Conversion metrics
- Product performance

### 2. Prompt Generation
The `generateInsightsPrompt()` function creates a detailed prompt that includes:
- Business context (name, type, location)
- Current metrics with actual numbers
- Historical comparisons
- Specific guidelines for insight generation

### 3. AI Analysis
Claude API analyzes the data and returns structured insights in JSON format:

```json
{
  "interestingInsights": [
    {
      "title": "Brief headline",
      "description": "Detailed explanation with specific numbers",
      "priority": "high",
      "category": "conversion"
    }
  ],
  "prescriptiveInsights": [
    {
      "title": "Action-oriented headline",
      "description": "What to do and expected impact",
      "priority": "high",
      "actionType": "immediate",
      "category": "staffing",
      "estimatedImpact": "Expected benefit"
    }
  ]
}
```

### 4. Display
The InsightsSection component renders the insights with:
- Color-coded priority borders (red=high, yellow=medium, blue=low)
- Category tags
- Action type indicators
- Estimated impact for prescriptive insights

## Usage

### Initial Load
When the dashboard loads, insights are automatically generated based on current data.

### Refreshing Insights
Click the "🔄 Get New Insights" button to generate fresh analysis. The system uses a higher temperature setting and includes a special prompt to ensure new insights are generated without repetition.

### Widget Visibility
The insights section appears when either the 'insights' or 'prescriptions' widgets are enabled in the dashboard customizer.

## Insight Categories

### Interesting Insights Categories
- `conversion` - Conversion rate patterns
- `revenue` - Revenue trends
- `traffic` - Foot traffic patterns
- `products` - Product performance
- `timing` - Time-based patterns

### Prescriptive Insights Categories
- `staffing` - Staff scheduling recommendations
- `inventory` - Inventory management
- `marketing` - Marketing and promotion strategies
- `operations` - Operational improvements
- `pricing` - Pricing optimization

## Error Handling

The system includes robust error handling:

1. **Missing API Key**: Shows error message asking to configure API key
2. **API Request Failed**: Displays error with status and message
3. **JSON Parse Error**: Catches and logs malformed responses
4. **Network Issues**: Handles connection problems gracefully

## Customization

### Adjusting Business Context
Update the `dashboardData` object in Dashboard.jsx to include more specific information:

```javascript
<InsightsSection 
  dashboardData={{
    businessName: "Your Store Name",
    businessType: "Specific Business Type",
    location: "Your Location",
    customerMix: "Describe your customer base",
    // ... other metrics
  }}
/>
```

### Modifying Insight Categories
Edit `generateInsightsPrompt()` in `generateInsights.js` to add new categories or change guidance.

### Styling
The component uses Tailwind CSS. Modify classes in `InsightsSection.jsx` to change appearance.

## API Costs

Claude Sonnet 4 pricing (as of implementation):
- Input: $3 per million tokens
- Output: $15 per million tokens

Typical insight generation uses:
- ~1,500 input tokens (prompt with data)
- ~800 output tokens (insights response)

Estimated cost per insight generation: ~$0.01-0.02

## Troubleshooting

### Insights Not Loading
1. Check browser console for errors
2. Verify API key is correct in `.env` file
3. Ensure backend is running and providing metrics
4. Check network tab for API request status

### Repeated Insights
- Try using the refresh button instead of reloading the page
- The refresh function uses higher temperature for more variety

### Slow Loading
- Initial load typically takes 3-5 seconds
- Refresh may take slightly longer (5-7 seconds)
- This is normal for AI-generated content

## Best Practices

1. **Refresh Periodically**: Generate new insights after significant business changes
2. **Review Both Sections**: Interesting insights provide context, prescriptive insights provide action items
3. **Track Implementation**: Note which recommendations you implement and track results
4. **Data Quality**: Ensure your backend data is accurate for best insights

## Future Enhancements

Potential improvements:
- Historical insight tracking
- Insight effectiveness scoring
- Custom insight preferences
- Multi-language support
- Scheduled insight generation
- Export insights to PDF/CSV

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure backend API is returning proper data structure
4. Test with sample data to isolate issues
