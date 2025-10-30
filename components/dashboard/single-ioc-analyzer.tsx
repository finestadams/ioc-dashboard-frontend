"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { IOCType, SingleIOCRequest } from "@/lib/api/types";
import {
  formatVerdict,
  formatCategory,
  formatIOCType,
  validateIOC,
} from "@/lib/format-utils";
import { useIOCStore } from "@/lib/store/ioc-store";
import IOCService from "@/lib/api/ioc-service";
import { toast } from "sonner";

interface FormData {
  value: string;
  type: IOCType;
  description: string;
}

export function SingleIOCAnalyzer() {
  const [autoDetectType, setAutoDetectType] = useState(true);
  const {
    singleResult,
    isAnalyzing,
    error,
    setSingleResult,
    setAnalyzing,
    setError,
  } = useIOCStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      value: "",
      type: IOCType.HASH,
      description: "",
    },
  });

  const watchedValue = watch("value");
  const watchedType = watch("type");

  // Auto-detect IOC type when value changes
  React.useEffect(() => {
    const detectType = async () => {
      if (autoDetectType && watchedValue.trim()) {
        try {
          const result = await IOCService.detectType(watchedValue.trim());
          setValue("type", result.type);
        } catch (error) {
          console.warn("Failed to auto-detect IOC type:", error);
        }
      }
    };

    const timeoutId = setTimeout(detectType, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [watchedValue, autoDetectType, setValue]);

  const onSubmit = async (data: FormData) => {
    // Validate IOC
    const validation = validateIOC(data.value, data.type);
    if (!validation.isValid) {
      setError(validation.error || "Invalid IOC");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const request: SingleIOCRequest = {
        value: data.value.trim(),
        type: data.type,
        description: data.description.trim() || undefined,
      };

      const result = await IOCService.analyzeSingle(request);
      setSingleResult(result);
      toast.success("IOC analysis completed successfully");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to analyze IOC";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case "clean":
        return <CheckCircle className="h-4 w-4" />;
      case "malicious":
        return <XCircle className="h-4 w-4" />;
      case "suspicious":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Single IOC Analysis
          </CardTitle>
          <CardDescription>
            Analyze individual Indicators of Compromise using multiple threat
            intelligence sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                IOC Value
              </label>
              <Input
                {...register("value", { required: "IOC value is required" })}
                placeholder="Enter hash, URL, IP address, or domain..."
                className="font-mono"
              />
              {errors.value && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.value.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">IOC Type</label>
              <Select
                value={watchedType}
                onValueChange={(value) => {
                  setValue("type", value as IOCType);
                  setAutoDetectType(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(IOCType).map((type) => {
                    const formatted = formatIOCType(type);
                    return (
                      <SelectItem key={type} value={type}>
                        <span className="flex items-center gap-2">
                          <span>{formatted.icon}</span>
                          {formatted.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {autoDetectType && (
                <p className="text-xs text-muted-foreground mt-1">
                  Type auto-detected. Uncheck to manually select.
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Description (Optional)
              </label>
              <Input
                {...register("description")}
                placeholder="Add a description or context for this IOC..."
              />
            </div>

            <Button
              type="submit"
              disabled={isAnalyzing || !watchedValue.trim()}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Analyze IOC
                </>
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {singleResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Analysis Result</span>
              <Badge variant={formatVerdict(singleResult.verdict).variant}>
                <span className="flex items-center gap-1">
                  {getVerdictIcon(singleResult.verdict)}
                  {formatVerdict(singleResult.verdict).label}
                </span>
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  IOC Value
                </label>
                <p className="font-mono text-sm break-all">
                  {singleResult.value}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Type
                </label>
                <p className="text-sm">
                  {formatIOCType(singleResult.type).label}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Category
                </label>
                <p className="text-sm flex items-center gap-1">
                  <span>{formatCategory(singleResult.category).icon}</span>
                  {formatCategory(singleResult.category).label}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Confidence
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        singleResult.confidence >= 80
                          ? "bg-green-500"
                          : singleResult.confidence >= 60
                          ? "bg-yellow-500"
                          : singleResult.confidence >= 30
                          ? "bg-orange-500"
                          : "bg-gray-400"
                      }`}
                      style={{ width: `${singleResult.confidence}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {singleResult.confidence}%
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Detections
                </label>
                <p className="text-sm">
                  {singleResult.detectionCount}/{singleResult.totalEngines}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Sources
                </label>
                <div className="flex flex-wrap gap-1">
                  {singleResult.sources.map((source) => (
                    <Badge key={source} variant="outline" className="text-xs">
                      {source}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {singleResult.lastSeen && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Last Seen
                </label>
                <p className="text-sm">
                  {new Date(singleResult.lastSeen).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
