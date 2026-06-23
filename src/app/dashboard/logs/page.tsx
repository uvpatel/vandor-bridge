"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Activity, 
  Search, 
  RefreshCw, 
  Calendar, 
  User, 
  Info,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface ActivityLog {
  id: string;
  actorId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  message: string;
  createdAt: string;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = React.useState<ActivityLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const fetchLogs = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/activities");
      const data = await res.json();
      if (res.ok) {
        setLogs(data.activities || []);
      } else {
        toast.error("Failed to load audit trail");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading activity logs");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entityType.toLowerCase().includes(search.toLowerCase())
  );

  const getEntityBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "rfq":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "vendor":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "quotation":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "approval":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "purchase_order":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "invoice":
        return "bg-teal-50 text-teal-700 border-teal-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Activity Logs & Notifications</h1>
          <p className="text-slate-500 text-sm">Review full system audit trails, status changes, and notification dispatches.</p>
        </div>
        <Button onClick={fetchLogs} disabled={loading} variant="outline" className="flex items-center gap-1">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Refresh Logs
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input 
            className="pl-9 bg-white" 
            placeholder="Search logs by action, keyword, entity..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Logs Timeline */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            System Events Audit Trail <Badge variant="secondary">{filteredLogs.length}</Badge>
          </CardTitle>
          <CardDescription>Listing chronological history of platform operations.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="size-8 animate-spin text-slate-400" />
              <p className="mt-2 text-sm text-slate-500">Retrieving security event log...</p>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50/50 transition duration-150 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div className="flex gap-3 items-start">
                    
                    {/* Log Avatar Icon */}
                    <div className="flex size-8 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-500">
                      <Activity className="size-4" />
                    </div>

                    <div className="space-y-1">
                      <p className="font-medium text-slate-800 text-sm leading-snug">{log.message}</p>
                      
                      {/* Subtitles and Badges */}
                      <div className="flex flex-wrap gap-2 items-center text-[10px] text-slate-400 font-semibold">
                        <Badge variant="outline" className={`${getEntityBadgeColor(log.entityType)} text-[10px] px-1.5 py-0`}>
                          {log.entityType.toUpperCase().replace("_", " ")}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <User className="size-3 text-slate-300" /> {log.actorId ? `USER: ${log.actorId.substring(0, 8)}` : "SYSTEM"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Info className="size-3 text-slate-300" /> Action: {log.action}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Date/Time */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold sm:text-right shrink-0">
                    <Calendar className="size-3.5 text-slate-300" />
                    {new Date(log.createdAt).toLocaleString()}
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12">
              <Activity className="size-12 mx-auto text-slate-300 animate-pulse" />
              <h3 className="mt-4 text-base font-semibold text-slate-800">No events matched query</h3>
              <p className="text-slate-500 text-xs mt-1">Try modifying your search criteria or triggering database actions.</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
