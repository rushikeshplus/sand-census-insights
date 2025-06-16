import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, BarChart3, PieChart, Table2, Info, Brain, AlertTriangle, Sparkles, Map, Filter } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "@/hooks/use-toast";
import { useAiInsights } from "@/hooks/useAiInsights";
import {
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

type AnalyzedData = {
  columns: string[];
  numRows: number;
  numCols: number;
  preview: any[];
  columnInfo: { [key: string]: { unique: number; type: string } };
};

const sampleChartColors = ["#6366F1", "#06D6A0", "#FFD166", "#EF476F", "#7C3AED", "#3B82F6"];

function analyzeData(data: any[]): AnalyzedData {
  if (!Array.isArray(data) || data.length === 0) return {
    columns: [],
    numRows: 0,
    numCols: 0,
    preview: [],
    columnInfo: {}
  };
  const columns = Object.keys(data[0] ?? {});
  const numRows = data.length;
  const numCols = columns.length;
  const preview = data.slice(0, 5);

  // Basic column info: unique values, type estimation
  const columnInfo: AnalyzedData['columnInfo'] = {};
  for (const col of columns) {
    const values = data.map((row) => row[col]);
    const unique = new Set(values.map((v) => String(v).trim())).size;
    const numeric = values.filter((v) => !isNaN(Number(v))).length;
    const inferredType = numeric > numRows / 2 ? "numeric" : "categorical";
    columnInfo[col] = { unique, type: inferredType };
  }
  return { columns, numRows, numCols, preview, columnInfo };
}

function generateSummary(analyzed: AnalyzedData) {
  if (!analyzed.numRows) return "No data found in file. Please check the file format.";
  let summary = `The uploaded file has ${analyzed.numRows} rows and ${analyzed.numCols} columns. `;
  summary += "Detected columns: ";
  summary += analyzed.columns.join(", ") + ". ";
  for (const col of analyzed.columns) {
    summary += `Column "${col}" has ${analyzed.columnInfo[col].unique} unique values and appears to be ${analyzed.columnInfo[col].type}. `;
  }
  return summary;
}

const DashboardDropdown = ({
  options,
  value,
  onChange,
  label
}: {
  options: string[];
  value: string | undefined;
  onChange: (v: string) => void;
  label?: string;
}) => (
  <div className="flex flex-col space-y-1 min-w-[120px]">
    {label && (
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    )}
    <select
      className="block rounded px-2 py-1 bg-gray-900 border border-gray-700 text-gray-100 focus:outline outline-1"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(opt => (
        <option value={opt} key={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const AnalyzeData = () => {
  const [fileName, setFileName] = useState("");
  const [tableData, setTableData] = useState<any[] | null>(null);
  const [analyzed, setAnalyzed] = useState<AnalyzedData | null>(null);

  // Axis selection state
  const [barXAxis, setBarXAxis] = useState<string | undefined>();
  const [barYAxis, setBarYAxis] = useState<string | undefined>();
  const [pieCol, setPieCol] = useState<string | undefined>();
  const [histogramCol, setHistogramCol] = useState<string | undefined>();

  // Use the AI insights hook
  const { loading: aiLoading, insight: aiInsight, error: aiError, getAiInsight } = useAiInsights();

  function handleFile(file: File) {
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setTableData(result.data as any[]);
          const a = analyzeData(result.data as any[]);
          setAnalyzed(a);
          autoSelectColumns(a);
          toast({ description: "CSV file analyzed successfully!" });
          // Generate AI insights
          getAiInsight({ summary: generateSummary(a), preview: a.preview });
        },
        error: () => toast({ description: "Could not parse CSV file.", variant: "destructive" }),
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(firstSheet);
        setTableData(json as any[]);
        const a = analyzeData(json as any[]);
        setAnalyzed(a);
        autoSelectColumns(a);
        toast({ description: "Excel file analyzed successfully!" });
        // Generate AI insights
        getAiInsight({ summary: generateSummary(a), preview: a.preview });
      };
      reader.onerror = () => toast({ description: "Could not parse Excel file.", variant: "destructive" });
      reader.readAsArrayBuffer(file);
    } else {
      toast({ description: "Unsupported file type. Please upload a CSV or Excel file.", variant: "destructive" });
    }
  }

  function autoSelectColumns(a: AnalyzedData) {
    // pick numeric col as Y, categorical as X for bar
    const numericCols = a.columns.filter(c => a.columnInfo[c].type === "numeric");
    const catCols = a.columns.filter(c => a.columnInfo[c].type === "categorical");
    setBarXAxis(catCols[0]);
    setBarYAxis(numericCols[0]);
    setPieCol(catCols[0]);
    setHistogramCol(numericCols[0]);
  }

  return (
    <div className="min-h-screen w-full bg-gray-950 text-white px-4 py-8">
      <div className="mx-auto max-w-[1200px] flex flex-col gap-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="text-primary w-8 h-8" />
          <h1 className="text-3xl md:text-4xl font-bold text-primary">AI-Powered Data Analysis</h1>
        </div>
        
        {/* Upload Section */}
        <Card className="bg-gray-900 border-gray-800 mb-6 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2 text-accent">
              <UploadCloud className="h-6 w-6" />
              <CardTitle className="text-xl">Upload & Inspect</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={e => { if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]); }}
                className="block w-full md:w-72 text-gray-200 bg-gray-800 border border-gray-700 rounded px-4 py-2"
              />
              {fileName && (
                <div className="flex items-center gap-2 text-sm text-accent-foreground">
                  <Info className="h-4 w-4" /> <span>File:</span> <b>{fileName}</b>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {analyzed && (
          <>
            {/* 🧠 Insight Stories */}
            <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-700/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-purple-300 flex items-center gap-2">
                  <Brain className="h-6 w-6" />
                  🧠 AI Insight Stories
                  <span className="ml-2 text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded">
                    Local AI • Privacy-First
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiLoading ? (
                  <div className="text-gray-400 flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-purple-400" viewBox="0 0 24 24">
                      <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Generating AI insights...
                  </div>
                ) : aiError ? (
                  <div className="text-red-400 font-medium">Error: {aiError}</div>
                ) : aiInsight?.stories ? (
                  <div className="space-y-3">
                    {aiInsight.stories.map((story, idx) => (
                      <div key={idx} className="text-gray-200 leading-relaxed p-3 bg-purple-900/10 rounded-lg border border-purple-800/20">
                        {story}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400">Upload data to generate AI-powered insights and stories.</div>
                )}
                {analyzed && !aiLoading && (
                  <Button 
                    onClick={() => getAiInsight({ summary: generateSummary(analyzed), preview: analyzed.preview })}
                    variant="outline" 
                    size="sm" 
                    className="mt-3 border-purple-600 text-purple-300 hover:bg-purple-900/20"
                  >
                    🔄 Regenerate Stories
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* 📌 Smart Anomaly Detection */}
            {aiInsight?.anomalies && aiInsight.anomalies.length > 0 && (
              <Card className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-700/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-orange-300 flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6" />
                    📌 Anomaly Detection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {aiInsight.anomalies.map((anomaly, idx) => (
                      <div key={idx} className="text-gray-200 p-3 bg-orange-900/10 rounded-lg border border-orange-800/20">
                        {anomaly}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 📊 AI-Generated Dashboard Suggestions */}
            {aiInsight?.dashboardSuggestions && aiInsight.dashboardSuggestions.length > 0 && (
              <Card className="bg-gradient-to-br from-green-900/20 to-teal-900/20 border-green-700/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-green-300 flex items-center gap-2">
                    <Sparkles className="h-6 w-6" />
                    📊 Smart Dashboard Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {aiInsight.dashboardSuggestions.map((suggestion, idx) => (
                      <div key={idx} className="text-gray-200 p-3 bg-green-900/10 rounded-lg border border-green-800/20">
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 🗺️ GeoSmart Visualization */}
            {aiInsight?.geoColumns && aiInsight.geoColumns.length > 0 && (
              <Card className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-700/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-300 flex items-center gap-2">
                    <Map className="h-6 w-6" />
                    🗺️ GeoSmart Visualization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {aiInsight.geoColumns.map((geoCol, idx) => (
                      <div key={idx} className="text-gray-200 p-3 bg-blue-900/10 rounded-lg border border-blue-800/20">
                        {geoCol}
                      </div>
                    ))}
                    <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-800/30">
                      <h4 className="text-blue-200 font-semibold mb-2">🇮🇳 Indian Map Visualization Ready!</h4>
                      <p className="text-gray-300 text-sm">
                        Geographic columns detected. You can create choropleth maps, heatmaps, and regional analysis 
                        for Indian states, districts, and PIN codes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 🧮 Smart Filters Panel */}
            {aiInsight?.smartFilters && aiInsight.smartFilters.length > 0 && (
              <Card className="bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-yellow-700/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-yellow-300 flex items-center gap-2">
                    <Filter className="h-6 w-6" />
                    🧮 Smart Filters Panel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aiInsight.smartFilters.map((filter, idx) => (
                      <div key={idx} className="bg-yellow-900/10 rounded-lg border border-yellow-800/20 p-3">
                        <h4 className="text-yellow-200 font-semibold mb-2">{filter.column}</h4>
                        <div className="text-xs text-yellow-300 mb-2 uppercase tracking-wide">{filter.type}</div>
                        <div className="space-y-1">
                          {filter.suggestions.map((suggestion, sidx) => (
                            <div key={sidx} className="text-gray-300 text-sm bg-yellow-900/20 px-2 py-1 rounded">
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data Preview */}
            <Card className="bg-gray-900 border-gray-800 shadow">
              <CardHeader>
                <CardTitle className="text-base md:text-lg text-blue-400">🔎 Data Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded border border-gray-800">
                  <table className="w-full text-sm text-gray-200">
                    <thead>
                      <tr>
                        {analyzed.columns.map(col => (
                          <th key={col} className="px-2 py-1 border-b border-gray-700 text-left">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {analyzed.preview.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-gray-800/40" : undefined}>
                          {analyzed.columns.map(col => (
                            <td key={col} className="px-2 py-1">{String(row[col])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Dashboard Cards - keeping existing charts */}
            <div className="grid md:grid-cols-2 gap-8 mt-4">
              {/* Bar Chart */}
              <Card className="bg-[#111827] border-gray-800 shadow-lg p-3 flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-amber-400" />
                    <CardTitle className="text-base">Bar Chart</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {analyzed && barXAxis && barYAxis ? (
                    <>
                      <div className="flex flex-wrap gap-4 mb-2">
                        <DashboardDropdown
                          options={analyzed.columns.filter(c => analyzed.columnInfo[c].type === "categorical")}
                          value={barXAxis}
                          onChange={setBarXAxis}
                          label="X Axis"
                        />
                        <DashboardDropdown
                          options={analyzed.columns.filter(c => analyzed.columnInfo[c].type === "numeric")}
                          value={barYAxis}
                          onChange={setBarYAxis}
                          label="Y Axis"
                        />
                      </div>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                          data={tableData ?? []}
                          margin={{ top: 8, right: 8, left: 8, bottom: 24 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey={barXAxis} tick={{ fill: "#fff" }} />
                          <YAxis dataKey={barYAxis} tick={{ fill: "#fff" }} />
                          <Bar dataKey={barYAxis} fill="#6366F1" />
                          <ReTooltip />
                        </BarChart>
                      </ResponsiveContainer>
                    </>
                  ) : <p className="text-gray-400">Not enough columns</p>}
                </CardContent>
              </Card>

              {/* Pie Chart */}
              <Card className="bg-[#1e293b] border-gray-800 shadow-lg p-3 flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <PieChart className="h-5 w-5 text-pink-400" />
                    <CardTitle className="text-base">Pie Chart</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {analyzed && pieCol ? (() => {
                    // value counts for pieCol
                    const freq: { [k: string]: number } = {};
                    (tableData ?? []).forEach(row => {
                      const v = String(row[pieCol]);
                      freq[v] = (freq[v] || 0) + 1;
                    });
                    const data = Object.entries(freq).map(([name, value]) => ({ name, value }));
                    return (
                      <>
                        <div className="mb-2 flex flex-wrap gap-4">
                          <DashboardDropdown
                            options={analyzed.columns.filter(c => analyzed.columnInfo[c].type === "categorical")}
                            value={pieCol}
                            onChange={setPieCol}
                            label="Category"
                          />
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                          <RePieChart>
                            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                              {data.map((_, i) => (
                                <Cell key={i} fill={sampleChartColors[i % sampleChartColors.length]} />
                              ))}
                            </Pie>
                            <ReTooltip />
                          </RePieChart>
                        </ResponsiveContainer>
                      </>
                    )
                  })() : <p className="text-gray-400">No categorical column found for pie chart</p>}
                </CardContent>
              </Card>

              {/* Histogram */}
              <Card className="bg-[#111827] border-gray-800 shadow-lg p-3 flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">Histogram</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyzed && histogramCol ? (() => {
                    const values = (tableData ?? []).map(r => Number(r[histogramCol])).filter(v => !isNaN(v));
                    if (!values.length) return <p className="text-gray-400">No numeric data available</p>;
                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    const binsCount = 8;
                    const binSize = (max - min) / binsCount || 1;
                    const bins = Array.from({ length: binsCount }, (_, i) => ({
                      name: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
                      value: values.filter(v => v >= min + i * binSize && v < min + (i + 1) * binSize).length
                    }));
                    bins[binsCount - 1].value += values.filter(v => v === max).length;
                    return (
                      <>
                        <div className="mb-2 flex flex-wrap gap-4">
                          <DashboardDropdown
                            options={analyzed.columns.filter(c => analyzed.columnInfo[c].type === "numeric")}
                            value={histogramCol}
                            onChange={setHistogramCol}
                            label="Value"
                          />
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={bins}>
                            <XAxis dataKey="name" tick={{ fill: "#fff" }} interval={0} />
                            <YAxis tick={{ fill: "#fff" }} />
                            <Bar dataKey="value" fill="#06D6A0" />
                            <ReTooltip />
                          </BarChart>
                        </ResponsiveContainer>
                      </>
                    );
                  })() : <p className="text-gray-400">No numeric column found for histogram</p>}
                </CardContent>
              </Card>

              {/* Value Counts Table */}
              <Card className="bg-[#1e293b] border-gray-800 shadow-lg p-3 flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">Value Counts (Top 10)</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyzed && pieCol ? (() => {
                    const freq: { [k: string]: number } = {};
                    (tableData ?? []).forEach(row => {
                      const v = String(row[pieCol]);
                      freq[v] = (freq[v] || 0) + 1;
                    });
                    const data = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
                    if (!data.length) return <p className="text-gray-400">No categorical data</p>;
                    return (
                      <>
                        <div className="mb-2 flex flex-wrap gap-4">
                          <DashboardDropdown
                            options={analyzed.columns.filter(c => analyzed.columnInfo[c].type === "categorical")}
                            value={pieCol}
                            onChange={setPieCol}
                            label="Category"
                          />
                        </div>
                        <table className="w-full text-sm border border-gray-700 rounded">
                          <thead>
                            <tr>
                              <th className="text-left px-2 py-1 border-b border-gray-600">{pieCol}</th>
                              <th className="text-left px-2 py-1 border-b border-gray-600">Count</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.map(([cat, count]) => (
                              <tr key={cat}>
                                <td className="px-2 py-1">{cat}</td>
                                <td className="px-2 py-1">{count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )
                  })() : <p className="text-gray-400">No categorical column</p>}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyzeData;
