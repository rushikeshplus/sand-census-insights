
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, BarChart3, PieChart, Table2, Info } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "@/hooks/use-toast";
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, Tooltip as ReTooltip, CartesianGrid, ResponsiveContainer } from "recharts";

type AnalyzedData = {
  columns: string[];
  numRows: number;
  numCols: number;
  preview: any[]; // first 5 rows
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

const AutoAnalyze = () => {
  const [fileName, setFileName] = useState("");
  const [tableData, setTableData] = useState<any[] | null>(null);
  const [analyzed, setAnalyzed] = useState<AnalyzedData | null>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setTableData(result.data as any[]);
          setAnalyzed(analyzeData(result.data as any[]));
          toast({ description: "CSV file analyzed successfully!" });
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
        setAnalyzed(analyzeData(json as any[]));
        toast({ description: "Excel file analyzed successfully!" });
      };
      reader.onerror = () => toast({ description: "Could not parse Excel file.", variant: "destructive" });
      reader.readAsArrayBuffer(file);
    } else {
      toast({ description: "Unsupported file type. Please upload a CSV or Excel file.", variant: "destructive" });
    }
  }

  /** Picks first two numerical columns for X/Y for demonstration purpose */
  function getNumericalXYCols(): [string?, string?] {
    if (!analyzed) return [];
    const numCols = analyzed.columns.filter(c => analyzed.columnInfo[c].type === "numeric");
    return [numCols[0], numCols[1]];
  }

  // For a pie, pick most unique values from categorical
  function getPieColumn(): string | undefined {
    if (!analyzed) return undefined;
    const catCols = analyzed.columns.filter(c => analyzed.columnInfo[c].type === "categorical");
    return catCols[0];
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <Card className="bg-gray-800 border-gray-700 mb-10">
          <CardHeader>
            <div className="flex items-center gap-2 text-blue-400">
              <UploadCloud className="h-7 w-7" />
              <CardTitle className="text-2xl">Auto Analyze</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-300">
              Upload a CSV or Excel file. SAND ONE will scan, summarize, and visualize the data for you automatically.
            </p>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={e => { if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]); }}
              className="block w-full text-gray-200 bg-gray-700 border border-gray-600 rounded px-4 py-2 mb-2"
            />
            {fileName && (
              <div className="mt-2 text-sm text-blue-300 flex items-center gap-1">
                <Info className="h-4 w-4" /> <span>File uploaded:</span> <b>{fileName}</b>
              </div>
            )}
          </CardContent>
        </Card>

        {analyzed && (
          <>
            <Card className="bg-gray-800 border-gray-700 mb-8">
              <CardHeader>
                <CardTitle className="text-xl text-green-400">📝 Data Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-200">{generateSummary(analyzed)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700 mb-8">
              <CardHeader>
                <CardTitle className="text-lg text-blue-400">🔎 Data Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-gray-200">
                    <thead>
                      <tr>
                        {analyzed.columns.map(col => (
                          <th key={col} className="px-2 py-1 border-b border-gray-600 text-left">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {analyzed.preview.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-gray-700/40" : undefined}>
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
            {/* Visualization Area */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-amber-400" />
                    <CardTitle className="text-base">Bar Chart</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {analyzed && getNumericalXYCols()[0] && getPieColumn() ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={tableData ?? []}
                        margin={{ top: 8, right: 8, left: 8, bottom: 24 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={getPieColumn()} tick={{ fill: "#fff" }} />
                        <YAxis tick={{ fill: "#fff" }} />
                        <Bar dataKey={getNumericalXYCols()[0]} fill="#6366F1" />
                        <ReTooltip />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-gray-400">Not enough numeric/categorical columns</p>}
                </CardContent>
              </Card>
              {/* Pie Chart */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-pink-400" />
                    <CardTitle className="text-base">Pie Chart</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {analyzed && getPieColumn() ? (() => {
                    // Group data by pie col, count frequencies
                    const pieCol = getPieColumn();
                    const freq: { [k: string]: number } = {};
                    (tableData ?? []).forEach(row => {
                      const v = String(row[pieCol]);
                      freq[v] = (freq[v] || 0) + 1;
                    });
                    const data = Object.entries(freq).map(([name, value]) => ({ name, value }));
                    return (
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
                    );
                  })() : <p className="text-gray-400">No categorical column found for pie chart</p>}
                </CardContent>
              </Card>
              {/* Histogram */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-base">Histogram</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyzed && getNumericalXYCols()[0] ? (() => {
                    // Build histogram bins for the first numeric col
                    const numCol = getNumericalXYCols()[0];
                    const values = (tableData ?? []).map(r => Number(r[numCol])).filter(v => !isNaN(v));
                    if (!values.length) return <p className="text-gray-400">No numeric data available</p>;
                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    const binsCount = 8;
                    const binSize = (max - min) / binsCount || 1;
                    const bins = Array.from({ length: binsCount }, (_, i) => ({
                      name: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
                      value: values.filter(v => v >= min + i * binSize && v < min + (i + 1) * binSize).length
                    }));
                    // last bin includes max
                    bins[binsCount - 1].value += values.filter(v => v === max).length;
                    return (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={bins}>
                          <XAxis dataKey="name" tick={{ fill: "#fff" }} interval={0} />
                          <YAxis tick={{ fill: "#fff" }} />
                          <Bar dataKey="value" fill="#06D6A0" />
                          <ReTooltip />
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })() : <p className="text-gray-400">No numeric column found for histogram</p>}
                </CardContent>
              </Card>
              {/* Value Counts Table */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-base">Value Counts (Top 10)</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyzed && getPieColumn() ? (() => {
                    // For first categorical column, show value counts table
                    const pieCol = getPieColumn();
                    const freq: { [k: string]: number } = {};
                    (tableData ?? []).forEach(row => {
                      const v = String(row[pieCol]);
                      freq[v] = (freq[v] || 0) + 1;
                    });
                    const data = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
                    if (!data.length) return <p className="text-gray-400">No categorical data</p>;
                    return (
                      <table className="w-full text-sm">
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

export default AutoAnalyze;

