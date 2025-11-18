export const generateInsightsPrompt = (businessData) => {
  return `You are an expert retail analytics consultant analyzing data for a small-to-mid-sized retail business. Your role is to identify actionable insights and provide prescriptive recommendations based on their actual business data.

## BUSINESS CONTEXT
Business Name: ${businessData.businessName || "This Store"}
Business Type: ${businessData.businessType || "Retail Store"}
Location: ${businessData.location || "Hawaii"}
Customer Mix: ${businessData.customerMix || "Mixed local and tourist"}
Current Date: ${new Date().toLocaleDateString()}

## CURRENT BUSINESS DATA
Time Period: ${businessData.timePeriod || "Last 7 Days"}

Key Metrics:
- Total Revenue: $${businessData.totalRevenue || 0}
- Foot Traffic: ${businessData.footTraffic || 0} visitors
- Transactions: ${businessData.transactions || 0}
- Conversion Rate: ${businessData.conversionRate || 0}%
- Average Transaction Value: $${businessData.avgTransactionValue || 0}
- Peak Traffic Hours: ${businessData.peakHours || "Unknown"}
- Peak Sales Hours: ${businessData.peakSalesHours || "Unknown"}

${businessData.topProducts ? `Top Sellers: ${businessData.topProducts.join(', ')}` : ''}
${businessData.slowMovers ? `Slow-Moving Items: ${businessData.slowMovers.join(', ')}` : ''}

Historical Comparison:
- Revenue vs Last Period: ${businessData.revenueChange || "N/A"}
- Traffic vs Last Period: ${businessData.trafficChange || "N/A"}
- Conversion vs Last Period: ${businessData.conversionChange || "N/A"}

## YOUR TASK
Generate insights in TWO categories:

### 1. INTERESTING INSIGHTS (3-4 insights)
Identify notable patterns, trends, or anomalies in the data. These should be:
- Specific to their actual numbers
- Surprising or non-obvious
- Based on data comparisons
- Focused on "what's happening" with brief "why it matters"

### 2. PRESCRIPTIVE INSIGHTS (3-4 recommendations)
Provide actionable recommendations. These should be:
- Specific, concrete actions (not vague suggestions)
- Directly tied to their data patterns
- Prioritized by potential impact
- Include expected outcome when possible
- Address: dead inventory, staffing optimization, missed opportunities, promotion effectiveness, local vs tourist targeting

## IMPORTANT GUIDELINES
- Never repeat the same insight twice - always provide fresh analysis
- Use their actual numbers in your insights
- Prioritize insights that can save time or increase revenue
- Focus on problems they can actually solve
- Be direct and confident in your recommendations
- Consider Hawaii's unique retail context (tourist/local dynamics, seasonal patterns)
- Reference specific time periods, percentages, and dollar amounts
- Avoid obvious statements - explain WHY and WHAT TO DO

## OUTPUT FORMAT
Return ONLY a valid JSON object with this structure (no markdown, no code blocks):

{
  "interestingInsights": [
    {
      "title": "Brief headline (5-8 words)",
      "description": "2-3 sentence explanation with specific numbers and why it matters",
      "priority": "high",
      "category": "conversion"
    }
  ],
  "prescriptiveInsights": [
    {
      "title": "Action-oriented headline starting with verb",
      "description": "2-3 sentences explaining what to do, how to do it, and expected impact",
      "priority": "high",
      "actionType": "immediate",
      "category": "staffing",
      "estimatedImpact": "Brief statement of expected benefit"
    }
  ]
}

NOW ANALYZE THE DATA AND GENERATE FRESH, SPECIFIC INSIGHTS IN VALID JSON FORMAT.`;
};

export async function generateBusinessInsights(businessData, isRefresh = false) {
  try {
    // Call the backend API endpoint instead of Anthropic directly
    const response = await fetch("http://localhost:8000/api/generate-insights", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        businessData: businessData,
        isRefresh: isRefresh
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const insights = await response.json();
    
    // Check if there's an error in the response
    if (insights.error) {
      throw new Error(insights.error);
    }
    
    return insights;
  } catch (error) {
    console.error("Error generating insights:", error);
    throw error;
  }
}
