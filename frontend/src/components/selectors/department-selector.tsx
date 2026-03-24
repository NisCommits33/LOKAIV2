/**
 * department-selector.tsx — Cascading Department Dropdown
 *
 * Fetches and displays departments filtered by the selected organization.
 * Automatically disables when no organization is selected.
 * Data is cached via TanStack Query under ["departments", organizationId].
 *
 * @module components/selectors/department-selector
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
import type { Department } from "@/types/database";

interface DepartmentSelectorProps {
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

export function DepartmentSelector({
  organizationId,
  value,
  onValueChange,
  label = "Department",
  disabled = false,
}: DepartmentSelectorProps) {
  const supabase = createClient();

  const { data: departments, isLoading } = useQuery({
    queryKey: ["departments", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("departments")
        .select("id, name, code")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data as Pick<Department, "id" | "name" | "code">[];
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
                ? "Select a department"
                : "Select an organization first"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {departments?.map((dept) => (
            <SelectItem key={dept.id} value={dept.id}>
              {dept.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
