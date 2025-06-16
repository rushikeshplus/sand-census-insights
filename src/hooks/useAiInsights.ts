
import { useState } from "react";

type Insight = {
  stories: string[];
  anomalies: string[];
  dashboardSuggestions: string[];
  geoColumns: string[];
  smartFilters: { column: string; type: string; suggestions: string[] }[];
};

interface UseAiInsightsOptions {
  summary: string;
  preview: any[];
}

export function useAiInsights() {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Advanced AI analysis using local algorithms
  function generateAdvancedInsights(summary: string, preview: any[]) {
    if (!preview.length) {
      setInsight({
        stories: ["No data available for analysis."],
        anomalies: [],
        dashboardSuggestions: [],
        geoColumns: [],
        smartFilters: []
      });
      return;
    }

    const columns = Object.keys(preview[0]);
    const numRows = preview.length;

    // 1. 🧠 Insight Stories Generation
    const stories = generateInsightStories(columns, preview, numRows);

    // 2. 📌 Smart Anomaly Detection
    const anomalies = detectAnomalies(columns, preview);

    // 3. 📊 AI-Generated Dashboard Suggestions
    const dashboardSuggestions = generateDashboardSuggestions(columns, preview);

    // 4. 🗺️ GeoSmart Visualization Detection
    const geoColumns = detectGeoColumns(columns);

    // 5. 🧮 Smart Filters Panel
    const smartFilters = generateSmartFilters(columns, preview);

    setInsight({
      stories,
      anomalies,
      dashboardSuggestions,
      geoColumns,
      smartFilters
    });
  }

  function generateInsightStories(columns: string[], preview: any[], numRows: number): string[] {
    const stories: string[] = [];
    
    // Dataset overview story
    stories.push(`📊 **Data Overview Story**: Your dataset contains ${numRows} records with ${columns.length} attributes. This represents a ${numRows > 1000 ? 'large' : numRows > 100 ? 'medium' : 'small'} dataset suitable for ${numRows > 1000 ? 'comprehensive statistical analysis' : 'exploratory data analysis'}.`);

    // Column relationship stories
    const numericColumns = columns.filter(col => {
      const vals = preview.map(r => Number(r[col])).filter(v => !isNaN(v));
      return vals.length > preview.length * 0.7;
    });

    const categoricalColumns = columns.filter(col => {
      const uniqueVals = new Set(preview.map(r => r[col]));
      return uniqueVals.size <= preview.length * 0.5 && uniqueVals.size > 1;
    });

    if (numericColumns.length >= 2) {
      stories.push(`🔢 **Numeric Insights**: Found ${numericColumns.length} numeric columns (${numericColumns.join(', ')}). These columns could reveal interesting correlations and trends when analyzed together.`);
    }

    if (categoricalColumns.length > 0) {
      stories.push(`🏷️ **Categorical Patterns**: Identified ${categoricalColumns.length} categorical variables (${categoricalColumns.slice(0, 3).join(', ')}${categoricalColumns.length > 3 ? '...' : ''}). These can be used for grouping and segmentation analysis.`);
    }

    // Data quality story
    let qualityScore = 100;
    let qualityIssues: string[] = [];
    
    columns.forEach(col => {
      const emptyCount = preview.filter(r => !r[col] || r[col] === '').length;
      if (emptyCount > 0) {
        qualityScore -= (emptyCount / preview.length) * 10;
        qualityIssues.push(`${col} has ${emptyCount} missing values`);
      }
    });

    stories.push(`✅ **Data Quality Score**: ${Math.round(qualityScore)}%. ${qualityScore > 90 ? 'Excellent data quality!' : qualityScore > 70 ? 'Good data quality with minor issues.' : 'Data quality needs attention.'} ${qualityIssues.length > 0 ? `Issues: ${qualityIssues.slice(0, 2).join(', ')}` : ''}`);

    return stories;
  }

  function detectAnomalies(columns: string[], preview: any[]): string[] {
    const anomalies: string[] = [];

    columns.forEach(col => {
      const values = preview.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
      
      // Check for numeric anomalies
      const numericVals = values.map(v => Number(v)).filter(v => !isNaN(v));
      if (numericVals.length > 5) {
        const mean = numericVals.reduce((a, b) => a + b, 0) / numericVals.length;
        const stdDev = Math.sqrt(numericVals.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / numericVals.length);
        
        const outliers = numericVals.filter(v => Math.abs(v - mean) > 2 * stdDev);
        if (outliers.length > 0) {
          anomalies.push(`🚨 **${col}**: Found ${outliers.length} potential outliers (values beyond 2 standard deviations). Range: ${Math.min(...outliers).toFixed(2)} to ${Math.max(...outliers).toFixed(2)}`);
        }
      }

      // Check for categorical anomalies
      const uniqueVals = new Set(values);
      if (uniqueVals.size === values.length && values.length > 3) {
        anomalies.push(`🔍 **${col}**: All values are unique - this might be an identifier column or contain very diverse data.`);
      }

      // Check for suspicious patterns
      const duplicateCount = values.length - uniqueVals.size;
      if (duplicateCount > values.length * 0.8) {
        anomalies.push(`🔄 **${col}**: High duplication rate (${Math.round(duplicateCount/values.length*100)}%) - might indicate data collection issues.`);
      }
    });

    if (anomalies.length === 0) {
      anomalies.push("✅ No obvious anomalies detected in the sample data. Your dataset appears to have consistent patterns.");
    }

    return anomalies;
  }

  function generateDashboardSuggestions(columns: string[], preview: any[]): string[] {
    const suggestions: string[] = [];

    const numericColumns = columns.filter(col => {
      const vals = preview.map(r => Number(r[col])).filter(v => !isNaN(v));
      return vals.length > preview.length * 0.7;
    });

    const categoricalColumns = columns.filter(col => {
      const uniqueVals = new Set(preview.map(r => r[col]));
      return uniqueVals.size <= preview.length * 0.5 && uniqueVals.size > 1;
    });

    // Visualization suggestions
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      suggestions.push(`📊 **Bar Chart**: Compare ${numericColumns[0]} across different ${categoricalColumns[0]} categories to identify patterns.`);
    }

    if (categoricalColumns.length > 0) {
      suggestions.push(`🥧 **Pie Chart**: Show distribution of ${categoricalColumns[0]} to understand category proportions.`);
    }

    if (numericColumns.length > 0) {
      suggestions.push(`📈 **Histogram**: Analyze the distribution of ${numericColumns[0]} to understand data spread and identify peaks.`);
    }

    if (numericColumns.length >= 2) {
      suggestions.push(`🔗 **Scatter Plot**: Explore correlation between ${numericColumns[0]} and ${numericColumns[1]} to find relationships.`);
    }

    if (categoricalColumns.length >= 2) {
      suggestions.push(`🎯 **Heatmap**: Create a cross-tabulation between ${categoricalColumns[0]} and ${categoricalColumns[1]} to find associations.`);
    }

    // Time series suggestions
    const dateColumns = columns.filter(col => 
      preview.some(r => !isNaN(Date.parse(r[col])))
    );
    
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      suggestions.push(`📅 **Time Series**: Plot ${numericColumns[0]} over ${dateColumns[0]} to identify trends and seasonality.`);
    }

    return suggestions;
  }

  function detectGeoColumns(columns: string[]): string[] {
    const geoKeywords = {
      state: ['state', 'states', 'province', 'region'],
      district: ['district', 'districts', 'city', 'cities', 'county'],
      pincode: ['pin', 'pincode', 'postal', 'zip', 'zipcode'],
      location: ['location', 'place', 'area', 'locality']
    };

    const detectedGeoColumns: string[] = [];

    columns.forEach(col => {
      const colLower = col.toLowerCase();
      
      Object.entries(geoKeywords).forEach(([type, keywords]) => {
        if (keywords.some(keyword => colLower.includes(keyword))) {
          detectedGeoColumns.push(`🗺️ **${col}** (${type}): Suitable for geographic visualization`);
        }
      });
    });

    if (detectedGeoColumns.length === 0) {
      // Check for potential geographic data based on content
      columns.forEach(col => {
        const sample = preview.map(r => String(r[col])).slice(0, 5);
        const hasIndianStates = sample.some(val => 
          ['maharashtra', 'gujarat', 'rajasthan', 'karnataka', 'tamil nadu', 'uttar pradesh', 'bihar', 'west bengal'].some(state => 
            val.toLowerCase().includes(state)
          )
        );
        
        if (hasIndianStates) {
          detectedGeoColumns.push(`🇮🇳 **${col}**: Contains Indian state names - perfect for choropleth maps`);
        }
      });
    }

    return detectedGeoColumns;
  }

  function generateSmartFilters(columns: string[], preview: any[]): { column: string; type: string; suggestions: string[] }[] {
    const smartFilters: { column: string; type: string; suggestions: string[] }[] = [];

    columns.forEach(col => {
      const values = preview.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
      const uniqueVals = Array.from(new Set(values));

      // Numeric filters
      const numericVals = values.map(v => Number(v)).filter(v => !isNaN(v));
      if (numericVals.length > values.length * 0.7) {
        const min = Math.min(...numericVals);
        const max = Math.max(...numericVals);
        const range = max - min;
        
        smartFilters.push({
          column: col,
          type: 'range',
          suggestions: [
            `Range: ${min.toFixed(2)} - ${max.toFixed(2)}`,
            `Low: ${min.toFixed(2)} - ${(min + range * 0.33).toFixed(2)}`,
            `Medium: ${(min + range * 0.33).toFixed(2)} - ${(min + range * 0.67).toFixed(2)}`,
            `High: ${(min + range * 0.67).toFixed(2)} - ${max.toFixed(2)}`
          ]
        });
      }
      // Categorical filters
      else if (uniqueVals.length <= 10 && uniqueVals.length > 1) {
        smartFilters.push({
          column: col,
          type: 'category',
          suggestions: uniqueVals.slice(0, 5).map(val => `"${val}"`)
        });
      }
      // Date filters
      else if (values.some(v => !isNaN(Date.parse(v)))) {
        smartFilters.push({
          column: col,
          type: 'date',
          suggestions: [
            'Last 30 days',
            'Last 3 months',
            'Last year',
            'Custom date range'
          ]
        });
      }
    });

    return smartFilters;
  }

  async function getAiInsight({ summary, preview }: UseAiInsightsOptions) {
    setLoading(true);
    setError(null);
    setInsight(null);
    
    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      generateAdvancedInsights(summary, preview);
    } catch (e: any) {
      setError(e.message || "Failed to generate insights.");
    } finally {
      setLoading(false);
    }
  }

  return { loading, insight, error, getAiInsight };
}
