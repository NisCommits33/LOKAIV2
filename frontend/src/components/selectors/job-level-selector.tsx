/**
 * job-level-selector.tsx — Cascading Job Level Dropdown
 *
 * Fetches and displays job levels filtered by the selected organization,
 * ordered by seniority (level_order). Automatically disables when no
 * organization is selected.
 * Data is cached via TanStack Query under ["job-levels", organizationId].
 *
 * @module components/selectors/job-level-selector
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { JobLevel } from "@/types/database";

interface JobLevelSelectorProps {
  organizationId?: string;
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

/** Wraps onValueChange to filter out null values from Radix Select */
function handleValueChange(
  onValueChange: (value: string) => void
): (value: string | null) => void {
  return (value) => {
    if (value) onValueChange(value);
  };
}

export function JobLevelSelector({
  organizationId,
  value,
  onValueChange,
  label = "Job Level",
  disabled = false,
}: JobLevelSelectorProps) {
  const supabase = createClient();

  const { data: jobLevels, isLoading } = useQuery({
    queryKey: ["job-levels", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("job_levels")
        .select("id, name, level_order")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("level_order");

      if (error) throw error;
      return data as Pick<JobLevel, "id" | "name" | "level_order">[];
    },
    enabled: !!organizationId,
  });

  const isDisabled = disabled || !organizationId;

  if (isLoading && organizationId) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={handleValueChange(onValueChange)}
        disabled={isDisabled}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={
              organizationId
                ? "Select a job level"
                : "Select an organization first"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {jobLevels?.map((level) => (
            <SelectItem key={level.id} value={level.id}>
              {level.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
