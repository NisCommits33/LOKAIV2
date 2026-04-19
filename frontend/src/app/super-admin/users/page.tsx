"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";

interface GlobalUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  organization?: { name: string };
  department?: { name: string };
  job_level?: { name: string };
}

export default function CrossOrgUsersPage() {
  const [users, setUsers] = useState<GlobalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  async function fetchUsers() {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/super/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchUsers, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [page, search]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleRoleToggle = async (userId: string, currentRole: string) => {
     try {
         const isPromoting = currentRole === "employee";
         const endpoint = `/api/super/users/${userId}/${isPromoting ? 'promote' : 'demote'}`;
         
         const res = await fetch(endpoint, { method: "POST" });
         if (!res.ok) throw new Error("Failed to change user role");
         
         toast.success(`User successfully ${isPromoting ? 'promoted to Org Admin' : 'demoted to Employee'}`);
         fetchUsers(); // refresh data
     } catch(e: unknown) {
         if (e instanceof Error) toast.error(e.message);
     }
  };

  const filteredUsers = users;

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
           <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
              <Users className="h-5 w-5" />
           </div>
           <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                 Global User Directory
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                 Search all verified members across any organization and manage hierarchical roles.
              </p>
           </div>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
           <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                 placeholder="Search name, email, or organization..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="max-w-md border-0 bg-transparent focus-visible:ring-0 px-2"
              />
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">User Details</TableHead>
                  <TableHead className="min-w-[180px]">Organization</TableHead>
                  <TableHead className="min-w-[120px]">Role</TableHead>
                  <TableHead className="min-w-[120px]">Joined</TableHead>
                  <TableHead className="text-right min-w-[140px]">Manage Access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-slate-500 dark:text-slate-400">
                      No users matched your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{u.full_name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{u.email}</p>
                      </TableCell>
                      <TableCell>
                        {u.organization?.name ? (
                           <div className="whitespace-nowrap">
                              <p className="font-medium text-slate-700 dark:text-slate-300">{u.organization.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{u.department?.name || "No Dept"} • {u.job_level?.name || "No Level"}</p>
                           </div>
                        ) : (
                          <span className="text-slate-400 italic">No Organization</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                           variant={u.role === 'super_admin' ? 'destructive' : u.role === 'org_admin' ? 'default' : 'secondary'}
                           className="capitalize whitespace-nowrap"
                        >
                           {u.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-500">
                        {format(new Date(u.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                         {u.role !== 'super_admin' && u.organization && (
                            <Button 
                               variant={u.role === 'employee' ? 'outline' : 'ghost'}
                               size="sm"
                               className={cn(
                                 "whitespace-nowrap",
                                 u.role === 'employee' ? 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30' : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                               )}
                               onClick={() => handleRoleToggle(u.id, u.role)}
                            >
                               {u.role === 'employee' ? (
                                  <><ArrowUpCircle className="h-4 w-4 mr-2" /> Promote</>
                               ) : (
                                  <><ArrowDownCircle className="h-4 w-4 mr-2" /> Demote</>
                               )}
                            </Button>
                         )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <div className="px-6 pb-6 border-t pt-4">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / limit)}
            totalItems={total}
            itemsPerPage={limit}
            onPageChange={setPage}
            isLoading={loading}
          />
        </div>
      </Card>
    </div>
  );
}
