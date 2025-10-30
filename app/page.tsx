"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Search,
  Upload,
  FileSpreadsheet,
  BarChart3,
  Activity,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { SingleIOCAnalyzer } from "@/components/dashboard/single-ioc-analyzer";
import { BulkIOCAnalyzer } from "@/components/dashboard/bulk-ioc-analyzer";
import { FileUploadAnalyzer } from "@/components/dashboard/file-upload-analyzer";
import { AnalyticsVisualization } from "@/components/dashboard/analytics-visualization";
import { useIOCStore } from "@/lib/store/ioc-store";
import { IOCService } from "@/lib/api/ioc-service";
import { Toaster } from "sonner";

export default function Home() {
  const { isAnalyzing, isBulkAnalyzing, isFileAnalyzing } = useIOCStore();
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalAnalyzed: 0,
    clean: 0,
    malicious: 0,
    suspicious: 0,
  });
  const [loading, setLoading] = useState(true);

  const isAnyAnalyzing = isAnalyzing || isBulkAnalyzing || isFileAnalyzing;

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch recent analyses and analytics in parallel
        const [recentData, analyticsData] = await Promise.all([
          IOCService.getRecentAnalyses(5),
          IOCService.getAnalytics(30),
        ]);

        setRecentAnalyses(recentData || []);

        // Extract stats from analytics
        if (analyticsData?.summary) {
          setStats({
            totalAnalyzed: analyticsData.summary.totalAnalyzed || 0,
            clean: analyticsData.summary.verdictBreakdown?.clean || 0,
            malicious: analyticsData.summary.verdictBreakdown?.malicious || 0,
            suspicious: analyticsData.summary.verdictBreakdown?.suspicious || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refresh data when analysis completes
  useEffect(() => {
    if (!isAnyAnalyzing) {
      // Small delay to ensure database has been updated
      const timer = setTimeout(() => {
        const fetchData = async () => {
          try {
            const [recentData, analyticsData] = await Promise.all([
              IOCService.getRecentAnalyses(5),
              IOCService.getAnalytics(30),
            ]);

            setRecentAnalyses(recentData || []);

            if (analyticsData?.summary) {
              setStats({
                totalAnalyzed: analyticsData.summary.totalAnalyzed || 0,
                clean: analyticsData.summary.verdictBreakdown?.clean || 0,
                malicious:
                  analyticsData.summary.verdictBreakdown?.malicious || 0,
                suspicious:
                  analyticsData.summary.verdictBreakdown?.suspicious || 0,
              });
            }
          } catch (error) {
            console.error("Error refreshing dashboard data:", error);
          }
        };
        fetchData();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isAnyAnalyzing]);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  IOC Reputation Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Threat Intelligence Analysis Platform
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isAnyAnalyzing && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span className="text-sm font-medium">Analyzing...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="single" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Single IOC</span>
                </TabsTrigger>
                <TabsTrigger value="bulk" className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="hidden sm:inline">Bulk Analysis</span>
                </TabsTrigger>
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">File Upload</span>
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="single">
                <SingleIOCAnalyzer />
              </TabsContent>

              <TabsContent value="bulk">
                <BulkIOCAnalyzer />
              </TabsContent>

              <TabsContent value="file">
                <FileUploadAnalyzer />
              </TabsContent>

              <TabsContent value="analytics">
                <AnalyticsVisualization />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
                <CardDescription>Analysis overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="text-center py-4 text-gray-500">
                    <Activity className="h-4 w-4 mx-auto mb-2 animate-spin" />
                    <p className="text-sm">Loading stats...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Total Analyzed
                      </span>
                      <span className="font-semibold">
                        {stats.totalAnalyzed}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Clean</span>
                      <span className="font-semibold text-green-600">
                        {stats.clean}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Malicious</span>
                      <span className="font-semibold text-red-600">
                        {stats.malicious}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Suspicious</span>
                      <span className="font-semibold text-yellow-600">
                        {stats.suspicious}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest IOC analyses</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-8 w-8 mx-auto mb-2 animate-spin" />
                    <p className="text-sm">Loading recent activity...</p>
                  </div>
                ) : recentAnalyses.length > 0 ? (
                  <div className="space-y-3">
                    {recentAnalyses.map((result) => (
                      <div key={result.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant={
                              result.verdict === "clean"
                                ? "default"
                                : result.verdict === "malicious"
                                ? "destructive"
                                : result.verdict === "suspicious"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {result.verdict}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(result.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-gray-700 truncate">
                          {result.value}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {result.type.toUpperCase()} • {result.confidence}%
                          confidence
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Analyze some IOCs to see activity here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
