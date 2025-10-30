"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, PieChart, TrendingUp, Activity } from "lucide-react";
import { useIOCStore } from "@/lib/store/ioc-store";
import { IOCVerdict, IOCCategory, IOCType } from "@/lib/api/types";
import {
  formatVerdict,
  formatCategory,
  formatIOCType,
} from "@/lib/format-utils";
import IOCService from "@/lib/api/ioc-service";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export function AnalyticsVisualization() {
  const { bulkResults, analysisHistory, singleResult } = useIOCStore();
  const [analyticsData, setAnalyticsData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch analytics data from database
  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await IOCService.getAnalytics(7); // Get 7 days of data
        setAnalyticsData(data);
        console.log("Analytics Data from Database:", data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load analytics data from database");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Debug logging to check data structure
  React.useEffect(() => {
    if (bulkResults) {
      console.log("Bulk Results:", bulkResults);
    }
    if (analysisHistory?.length > 0) {
      console.log("Analysis History:", analysisHistory);
    }
    if (singleResult) {
      console.log("Single Result:", singleResult);
    }
  }, [bulkResults, analysisHistory, singleResult]);

  // Combine all available data for visualization - prioritize database data
  const allResults = React.useMemo(() => {
    // If we have database analytics data, use that for recent analyses
    if (analyticsData?.recentAnalyses?.length > 0) {
      return analyticsData.recentAnalyses;
    }

    // Fallback to in-memory store data
    const results: any[] = [];

    // Add bulk results
    if (bulkResults?.results) {
      results.push(...bulkResults.results);
    }

    // Add single result if not already in bulk results
    if (singleResult && !results.find((r) => r.id === singleResult.id)) {
      results.push(singleResult);
    }

    // Add unique results from history
    if (analysisHistory?.length > 0) {
      analysisHistory.forEach((result) => {
        if (!results.find((r) => r.id === result.id)) {
          results.push(result);
        }
      });
    }

    return results;
  }, [analyticsData, bulkResults, singleResult, analysisHistory]);

  // Generate verdict distribution data
  const verdictData = React.useMemo(() => {
    let data = { clean: 0, suspicious: 0, malicious: 0, unknown: 0 };

    // Prioritize database analytics data
    if (analyticsData?.summary?.verdictBreakdown) {
      data = analyticsData.summary.verdictBreakdown;
    } else if (bulkResults?.summary) {
      // Use bulk results summary if available
      data = bulkResults.summary;
    } else if (allResults.length > 0) {
      // Calculate from all results
      data = allResults.reduce(
        (acc: any, result: any) => {
          acc[result.verdict] = (acc[result.verdict] || 0) + 1;
          return acc;
        },
        { clean: 0, suspicious: 0, malicious: 0, unknown: 0 }
      );
    }

    return {
      labels: ["Clean", "Suspicious", "Malicious", "Unknown"],
      datasets: [
        {
          data: [data.clean, data.suspicious, data.malicious, data.unknown],
          backgroundColor: [
            "#10B981", // Green for clean
            "#F59E0B", // Yellow for suspicious
            "#EF4444", // Red for malicious
            "#6B7280", // Gray for unknown
          ],
          borderColor: ["#059669", "#D97706", "#DC2626", "#4B5563"],
          borderWidth: 2,
        },
      ],
    };
  }, [bulkResults, allResults]);

  // Generate category distribution data
  const categoryData = React.useMemo(() => {
    if (!allResults || allResults.length === 0) return null;

    const categoryCounts = allResults.reduce((acc, result) => {
      const category = result.category || IOCCategory.UNKNOWN;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<IOCCategory, number>);

    const categories = Object.keys(categoryCounts) as IOCCategory[];
    const colors = categories.map((category) => {
      switch (category) {
        case IOCCategory.MALWARE:
          return "#EF4444";
        case IOCCategory.PHISHING:
          return "#F97316";
        case IOCCategory.RANSOMWARE:
          return "#DC2626";
        case IOCCategory.BOTNET:
          return "#8B5CF6";
        case IOCCategory.C2:
          return "#3B82F6";
        case IOCCategory.SPAM:
          return "#F59E0B";
        default:
          return "#6B7280";
      }
    });

    return {
      labels: categories.map((cat) => formatCategory(cat).label),
      datasets: [
        {
          label: "IOC Categories",
          data: categories.map((cat) => categoryCounts[cat]),
          backgroundColor: colors,
          borderColor: colors.map((color) => color + "80"),
          borderWidth: 1,
        },
      ],
    };
  }, [allResults]);

  // Generate IOC type distribution data
  const typeData = React.useMemo(() => {
    if (!allResults || allResults.length === 0) return null;

    const typeCounts = allResults.reduce((acc, result) => {
      const type = result.type || IOCType.DOMAIN;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<IOCType, number>);

    const types = Object.keys(typeCounts) as IOCType[];

    return {
      labels: types.map((type) => formatIOCType(type).label),
      datasets: [
        {
          label: "IOC Types",
          data: types.map((type) => typeCounts[type]),
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 1,
        },
      ],
    };
  }, [allResults]);

  // Generate confidence trend data
  const confidenceTrendData = React.useMemo(() => {
    if (!allResults || allResults.length === 0) return null;

    // Group results by confidence ranges
    const confidenceRanges = {
      "0-20": 0,
      "21-40": 0,
      "41-60": 0,
      "61-80": 0,
      "81-100": 0,
    };

    allResults.forEach((result) => {
      const confidence = result.confidence;
      if (confidence <= 20) confidenceRanges["0-20"]++;
      else if (confidence <= 40) confidenceRanges["21-40"]++;
      else if (confidence <= 60) confidenceRanges["41-60"]++;
      else if (confidence <= 80) confidenceRanges["61-80"]++;
      else confidenceRanges["81-100"]++;
    });

    return {
      labels: Object.keys(confidenceRanges),
      datasets: [
        {
          label: "Number of IOCs",
          data: Object.values(confidenceRanges),
          fill: false,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          tension: 0.1,
        },
      ],
    };
  }, [allResults]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) : "0";
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics & Visualization
          </CardTitle>
          <CardDescription>
            Loading analytics data from database...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
            <p>Loading analytics data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics & Visualization
          </CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-red-500">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Failed to load analytics data</p>
            <p className="text-sm">Using in-memory data instead</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!allResults || allResults.length === 0) {
    const hasDbData = analyticsData?.summary?.totalAnalyzed > 0;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics & Visualization
          </CardTitle>
          <CardDescription>
            {hasDbData
              ? `Showing analytics for ${analyticsData.summary.totalAnalyzed} IOCs from database`
              : "Data visualization will appear after analyzing IOCs"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              {hasDbData
                ? "Database connected successfully"
                : "No data to visualize yet"}
            </p>
            <p className="text-sm">
              {hasDbData
                ? `Total analyzed: ${analyticsData.summary.totalAnalyzed} IOCs`
                : "Upload and analyze IOCs to see insights"}
            </p>
            {analyticsData?.note && (
              <p className="text-xs text-blue-600 mt-2">{analyticsData.note}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analysis Summary
          </CardTitle>
          <CardDescription>
            Overview of the latest bulk analysis results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {analyticsData?.summary?.totalAnalyzed ||
                  bulkResults?.totalProcessed ||
                  allResults.length}
              </div>
              <div className="text-sm text-gray-600">Total Processed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {analyticsData?.summary?.verdictBreakdown?.clean ||
                  bulkResults?.summary?.clean ||
                  allResults.filter((r: any) => r.verdict === "clean").length}
              </div>
              <div className="text-sm text-green-600">Clean</div>
            </div>
            <div className="text-3xl font-bold text-red-600 text-center">
              <div>
                {analyticsData?.summary?.verdictBreakdown?.malicious ||
                  bulkResults?.summary?.malicious ||
                  allResults.filter((r: any) => r.verdict === "malicious")
                    .length}
              </div>
              <div className="text-sm text-red-600">Malicious</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {analyticsData?.summary?.verdictBreakdown?.suspicious ||
                  bulkResults?.summary?.suspicious ||
                  allResults.filter((r: any) => r.verdict === "suspicious")
                    .length}
              </div>
              <div className="text-sm text-yellow-600">Suspicious</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verdict Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Verdict Distribution
            </CardTitle>
            <CardDescription>Breakdown of IOC verdicts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Pie data={verdictData} options={pieChartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* IOC Type Distribution Bar Chart */}
        {typeData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                IOC Type Distribution
              </CardTitle>
              <CardDescription>Types of IOCs analyzed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Bar data={typeData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Distribution */}
        {categoryData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Threat Categories
              </CardTitle>
              <CardDescription>
                Distribution of threat categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Bar data={categoryData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confidence Trend */}
        {confidenceTrendData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Confidence Distribution
              </CardTitle>
              <CardDescription>
                Distribution of confidence scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Line data={confidenceTrendData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Risk IOCs */}
      {allResults.filter((r) => r.verdict === IOCVerdict.MALICIOUS).length >
        0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">High Risk IOCs</CardTitle>
            <CardDescription>
              IOCs identified as malicious with high confidence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allResults
                .filter((r) => r.verdict === IOCVerdict.MALICIOUS)
                .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
                .slice(0, 5)
                .map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm text-red-800 truncate">
                        {result.value}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {formatIOCType(result.type).label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {formatCategory(result.category).label}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600">
                        {result.confidence}%
                      </div>
                      <div className="text-xs text-red-500">
                        {result.detectionCount}/{result.totalEngines}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
