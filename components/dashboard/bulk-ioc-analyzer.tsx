"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  FileSpreadsheet,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Filter,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BulkAnalysisResult, IOCVerdict } from "@/lib/api/types";
import {
  formatVerdict,
  formatCategory,
  formatIOCType,
  downloadBlob,
} from "@/lib/format-utils";
import { useIOCStore } from "@/lib/store/ioc-store";
import IOCService from "@/lib/api/ioc-service";
import { toast } from "sonner";

export function BulkIOCAnalyzer() {
  const [filterVerdict, setFilterVerdict] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const {
    bulkResults,
    isBulkAnalyzing,
    error,
    setBulkResults,
    setBulkAnalyzing,
    setError,
  } = useIOCStore();

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    const isValidType =
      validTypes.includes(file.type) || file.name.match(/\.(csv|xlsx|xls)$/i);

    if (!isValidType) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    setBulkAnalyzing(true);
    setError(null);

    try {
      const result = await IOCService.analyzeBulkFromFile(file);
      setBulkResults(result);
      toast.success(
        `Analysis completed! Processed ${result.totalProcessed} IOCs`
      );
    } catch (error: any) {
      const errorMessage = error.message || "Failed to analyze bulk IOCs";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setBulkAnalyzing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const downloadSampleCSV = async () => {
    try {
      const blob = await IOCService.downloadSampleCSV();
      downloadBlob(blob, "ioc_sample_template.csv");
      toast.success("Sample CSV template downloaded");
    } catch (error) {
      toast.error("Failed to download sample template");
    }
  };

  const getVerdictIcon = (verdict: IOCVerdict) => {
    switch (verdict) {
      case IOCVerdict.CLEAN:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case IOCVerdict.MALICIOUS:
        return <XCircle className="h-4 w-4 text-red-600" />;
      case IOCVerdict.SUSPICIOUS:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  // Filter results based on search term and verdict filter
  const filteredResults = React.useMemo(() => {
    if (!bulkResults?.results) return [];

    return bulkResults.results.filter((result) => {
      const matchesSearch =
        !searchTerm ||
        result.value.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesVerdict =
        filterVerdict === "all" || result.verdict === filterVerdict;

      return matchesSearch && matchesVerdict;
    });
  }, [bulkResults?.results, searchTerm, filterVerdict]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk IOC Analysis
          </CardTitle>
          <CardDescription>
            Upload CSV or Excel files to analyze multiple IOCs at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">File Upload</TabsTrigger>
              <TabsTrigger value="manual">Manual Input</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${
                    isDragActive
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }
                  ${isBulkAnalyzing ? "pointer-events-none opacity-50" : ""}
                `}
              >
                <input {...getInputProps()} />
                {isBulkAnalyzing ? (
                  <div className="space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                    <p className="text-sm text-gray-600">Analyzing IOCs...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FileSpreadsheet className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-sm font-medium">
                      {isDragActive
                        ? "Drop the file here..."
                        : "Drag & drop your CSV/Excel file here"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Supported formats: CSV, XLS, XLSX (Max 10MB, 1000 IOCs)
                    </p>
                    <Button variant="outline" size="sm">
                      Choose File
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <Button
                  variant="link"
                  size="sm"
                  onClick={downloadSampleCSV}
                  className="text-blue-600"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download Sample Template
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <p>Manual bulk input coming soon...</p>
                <p className="text-sm">
                  For now, please use the file upload option
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {bulkResults && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              Processed {bulkResults.totalProcessed} IOCs with{" "}
              {bulkResults.errors.length} errors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {bulkResults.summary.clean}
                </div>
                <div className="text-sm text-green-600">Clean</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {bulkResults.summary.suspicious}
                </div>
                <div className="text-sm text-yellow-600">Suspicious</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {bulkResults.summary.malicious}
                </div>
                <div className="text-sm text-red-600">Malicious</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {bulkResults.summary.unknown}
                </div>
                <div className="text-sm text-gray-600">Unknown</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search IOCs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterVerdict} onValueChange={setFilterVerdict}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verdicts</SelectItem>
                  <SelectItem value="malicious">Malicious</SelectItem>
                  <SelectItem value="suspicious">Suspicious</SelectItem>
                  <SelectItem value="clean">Clean</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IOC</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Verdict</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Detections</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-mono text-sm max-w-xs">
                        <div className="truncate" title={result.value}>
                          {result.value}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          {formatIOCType(result.type).icon}
                          {formatIOCType(result.type).label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={formatVerdict(result.verdict).variant}>
                          <span className="flex items-center gap-1">
                            {getVerdictIcon(result.verdict)}
                            {formatVerdict(result.verdict).label}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          {formatCategory(result.category).icon}
                          {formatCategory(result.category).label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                result.confidence >= 80
                                  ? "bg-green-500"
                                  : result.confidence >= 60
                                  ? "bg-yellow-500"
                                  : result.confidence >= 30
                                  ? "bg-orange-500"
                                  : "bg-gray-400"
                              }`}
                              style={{ width: `${result.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs">{result.confidence}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {result.detectionCount}/{result.totalEngines}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No results match your current filters</p>
              </div>
            )}

            {/* Errors */}
            {bulkResults.errors.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-red-600 mb-2">
                  Processing Errors
                </h4>
                <div className="space-y-1">
                  {bulkResults.errors.map((error, index) => (
                    <div key={index} className="text-sm bg-red-50 p-2 rounded">
                      <span className="font-medium">{error.value}:</span>{" "}
                      {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
