/**
 * organization-selector.tsx — Organization Dropdown Component
 *
 * Reusable select component that loads active organizations from Supabase
 * and displays them in a dropdown. Used in profile setup and admin forms.
 * Data is cached via TanStack Query under the ["organizations"] key.
 *
 * @module components/selectors/organization-selector
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
import type { Organization } from "@/types/database";

interface OrganizationSelectorProps {
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

export function OrganizationSelector({
  value,
  onValueChange,
  label = "Organization",
  disabled = false,
}: OrganizationSelectorProps) {
  const supabase = createClient();

  const { data: organizations, isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as Pick<Organization, "id" | "name" | "code">[];
    },
  });

  if (isLoading) {
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
      <Select value={value ?? ""} onValueChange={handleValueChange(onValueChange)} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Select an organization" />
        </SelectTrigger>
        <SelectContent>
          {organizations?.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name} ({org.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
