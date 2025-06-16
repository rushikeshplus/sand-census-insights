
import { useState } from "react";

type Insight = string;

interface UseAiInsightsOptions {
  summary: string;
  preview: any[];
}

export function useAiInsights() {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Enhanced local insights generator
  function generateLocalInsights(summary: string, preview: any[]) {
    if (!preview.length) {
      setInsight("No data available for analysis.");
      return;
    }

    const columns = Object.keys(preview[0]);
    const numRows = preview.length;
    let insights: string[] = [];

    // Dataset overview
    insights.push(`📊 **Dataset Overview**`);
    insights.push(`Your dataset contains ${columns.length} columns with ${numRows} sample records shown.`);
    insights.push("");

    // Column analysis
    insights.push(`🔍 **Column Analysis**`);
    const numericColumns: string[] = [];
    const categoricalColumns: string[] = [];
    
    for (const col of columns) {
      const vals = preview.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== "");
      const uniqueVals = Array.from(new Set(vals));
      const numericVals = vals.map(v => Number(v)).filter(v => !isNaN(v) && isFinite(v));
      
      if (numericVals.length > vals.length * 0.7) {
        // Numeric column
        numericColumns.push(col);
        const mean = numericVals.reduce((a, b) => a + b, 0) / numericVals.length;
        const min = Math.min(...numericVals);
        const max = Math.max(...numericVals);
        insights.push(`• **${col}** (Numeric): Range ${min.toFixed(2)} - ${max.toFixed(2)}, Average: ${mean.toFixed(2)}`);
      } else {
        // Categorical column
        categoricalColumns.push(col);
        const topValues = uniqueVals.slice(0, 3).map(v => `"${v}"`).join(", ");
        insights.push(`• **${col}** (Categorical): ${uniqueVals.length} unique values (${topValues}${uniqueVals.length > 3 ? "..." : ""})`);
      }
    }

    insights.push("");

    // Data quality insights
    insights.push(`✅ **Data Quality**`);
    let qualityIssues = 0;
    
    for (const col of columns) {
      const vals = preview.map(r => r[col]);
      const emptyVals = vals.filter(v => v === null || v === undefined || v === "").length;
      if (emptyVals > 0) {
        insights.push(`• **${col}**: ${emptyVals}/${numRows} empty values detected`);
        qualityIssues++;
      }
    }
    
    if (qualityIssues === 0) {
      insights.push(`• No obvious data quality issues detected in the sample`);
    }

    insights.push("");

    // Analysis recommendations
    insights.push(`💡 **Analysis Recommendations**`);
    
    if (numericColumns.length >= 2) {
      insights.push(`• Consider correlation analysis between numeric columns: ${numericColumns.join(", ")}`);
    }
    
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      insights.push(`• Try grouping ${numericColumns[0]} by ${categoricalColumns[0]} for insights`);
    }
    
    if (categoricalColumns.length > 0) {
      insights.push(`• Create frequency distributions for: ${categoricalColumns.join(", ")}`);
    }
    
    if (numericColumns.length > 0) {
      insights.push(`• Look for outliers and distribution patterns in: ${numericColumns.join(", ")}`);
    }

    // Set the final insight
    setInsight(insights.join("\n"));
  }

  async function getAiInsight({ summary, preview }: UseAiInsightsOptions) {
    setLoading(true);
    setError(null);
    setInsight(null);
    
    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      generateLocalInsights(summary, preview);
    } catch (e: any) {
      setError(e.message || "Failed to generate insights.");
    } finally {
      setLoading(false);
    }
  }

  return { loading, insight, error, getAiInsight };
}
