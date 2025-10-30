"use client";

import React from "react";
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Upload,
  File,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Copy,
  Hash,
} from "lucide-react";
import { FileAnalysisResult } from "@/lib/api/types";
import {
  formatVerdict,
  formatCategory,
  formatFileSize,
  copyToClipboard,
} from "@/lib/format-utils";
import { useIOCStore } from "@/lib/store/ioc-store";
import IOCService from "@/lib/api/ioc-service";
import { toast } from "sonner";

export function FileUploadAnalyzer() {
  const {
    fileResult,
    isFileAnalyzing,
    error,
    setFileResult,
    setFileAnalyzing,
    setError,
  } = useIOCStore();

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File size exceeds 100MB limit");
      return;
    }

    setFileAnalyzing(true);
    setError(null);

    try {
      const result = await IOCService.analyzeFile(file);
      setFileResult(result);
      toast.success("File analysis completed successfully");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to analyze file";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setFileAnalyzing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case "clean":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "malicious":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "suspicious":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <HelpCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const copyHash = async (hash: string, type: string) => {
    const success = await copyToClipboard(hash);
    if (success) {
      toast.success(`${type} hash copied to clipboard`);
    } else {
      toast.error("Failed to copy hash");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Upload Analysis
          </CardTitle>
          <CardDescription>
            Upload files to extract hashes and check their reputation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${
                isDragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }
              ${isFileAnalyzing ? "pointer-events-none opacity-50" : ""}
            `}
          >
            <input {...getInputProps()} />
            {isFileAnalyzing ? (
              <div className="space-y-3">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
                <p className="text-sm text-gray-600">Analyzing file...</p>
                <p className="text-xs text-gray-500">
                  Extracting hashes and checking reputation
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <File className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive
                      ? "Drop the file here..."
                      : "Drag & drop your file here"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Any file type accepted (Max 100MB)
                  </p>
                </div>
                <Button variant="outline">Choose File</Button>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {fileResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <File className="h-5 w-5" />
                File Analysis Result
              </span>
              <Badge variant={formatVerdict(fileResult.verdict).variant}>
                <span className="flex items-center gap-1">
                  {getVerdictIcon(fileResult.verdict)}
                  {formatVerdict(fileResult.verdict).label}
                </span>
              </Badge>
            </CardTitle>
            <CardDescription>
              Analysis results for {fileResult.filename}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  File Name
                </label>
                <p className="text-sm break-all">{fileResult.filename}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  File Size
                </label>
                <p className="text-sm">{formatFileSize(fileResult.fileSize)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  MIME Type
                </label>
                <p className="text-sm font-mono">{fileResult.mimeType}</p>
              </div>
            </div>

            {/* Verdict Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Category
                </label>
                <p className="text-sm flex items-center gap-1">
                  <span>{formatCategory(fileResult.category).icon}</span>
                  {formatCategory(fileResult.category).label}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Detections
                </label>
                <p className="text-sm">
                  {fileResult.detectionCount}/{fileResult.totalEngines} engines
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Detection Ratio
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        fileResult.detectionCount > 0
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${
                          fileResult.totalEngines > 0
                            ? (fileResult.detectionCount /
                                fileResult.totalEngines) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {fileResult.totalEngines > 0
                      ? Math.round(
                          (fileResult.detectionCount /
                            fileResult.totalEngines) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* File Hashes */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-3 block">
                File Hashes
              </label>
              <div className="space-y-3">
                {Object.entries(fileResult.hashes).map(([type, hash]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium uppercase">
                          {type}
                        </span>
                      </div>
                      <p className="text-sm font-mono text-gray-700 break-all">
                        {hash}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyHash(hash, type.toUpperCase())}
                      className="ml-2 shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Metadata */}
            {fileResult.metadata &&
              Object.keys(fileResult.metadata).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block">
                    Additional Information
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(fileResult.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
