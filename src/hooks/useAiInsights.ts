
import { useState } from "react";

// Basic summary/insight generator using just local data (no ML model)
// Optionally, you can customize this to use Hugging Face pipelines for text generation in-browser.

type Insight = string;

interface UseAiInsightsOptions {
  summary: string;
  preview: any[];
}

export function useAiInsights() {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Basic statistical analysis
  function generateLocalInsights(summary: string, preview: any[]) {
    if (!preview.length) {
      setInsight("No data available for insights.");
      return;
    }
    const columns = Object.keys(preview[0]);
    const numRows = preview.length;
    let bullets: string[] = [
      `The file contains sample data with ${columns.length} columns and ${numRows} example records.`,
    ];
    // For each column, note unique values and numeric/categorical nature
    for (const col of columns) {
      const vals = preview.map(r => r[col]);
      const uniqueVals = Array.from(new Set(vals));
      const numericVals = vals.map(Number).filter(v => !isNaN(v));
      if (numericVals.length > numRows / 2) {
        const mean = (numericVals.reduce((a, b) => a + b, 0) / numericVals.length).toFixed(2);
        bullets.push(`Column "${col}" appears numeric (mean: ${mean}, unique: ${uniqueVals.length}).`);
      } else {
        bullets.push(`Column "${col}" is likely categorical ("${uniqueVals.slice(0, 3).join('", "')}") and has ${uniqueVals.length} unique values.`);
      }
    }
    setInsight("• " + bullets.join("\n• "));
  }

  async function getAiInsight({ summary, preview }: UseAiInsightsOptions) {
    setLoading(true);
    setError(null);
    setInsight(null);
    try {
      // In a real case, you might load a small Hugging Face model here
      // For now, provide a deterministic insight for speed
      generateLocalInsights(summary, preview);
    } catch (e: any) {
      setError(e.message || "Failed to generate insights.");
    }
    setLoading(false);
  }

  return { loading, insight, error, getAiInsight };
}
