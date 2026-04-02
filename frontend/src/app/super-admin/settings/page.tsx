"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SystemSetting {
  key: string;
  value: unknown;
  description: string;
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/super/system-settings");
        if (res.ok) {
           const data = await res.json();
           setSettings(data);
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/super/system-settings", {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error("Failed to save settings");
      toast.success("Platform settings updated successfully");
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, newValue: string) => {
     setSettings(prev => 
        prev.map(s => s.key === key ? { ...s, value: newValue } : s)
     );
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-slate-900 dark:bg-slate-100 p-2 text-white dark:text-slate-900">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            System Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure global platform constraints and defaults.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Global Parameters</CardTitle>
            <CardDescription>
              These settings safely override hardcoded limits across isolated organizations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                   <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-10 w-full" />
                   </div>
                ))
             ) : (
                settings.map(setting => (
                   <div key={setting.key} className="space-y-2">
                       <Label htmlFor={setting.key} className="font-semibold text-slate-700 dark:text-slate-300">
                          {setting.key}
                       </Label>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{setting.description}</p>
                       <Input 
                          id={setting.key}
                          value={String(setting.value)}
                          onChange={(e) => handleChange(setting.key, e.target.value)}
                          className="font-mono text-sm max-w-md"
                       />
                   </div>
                ))
             )}
          </CardContent>
          <CardFooter className="bg-slate-50 dark:bg-slate-800 border-t justify-end py-4">
             <Button type="submit" disabled={loading || saving}>
                {saving ? (
                   "Saving..."
                ) : (
                   <>
                     <Save className="h-4 w-4 mr-2" />
                     Save Configuration
                   </>
                )}
             </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
