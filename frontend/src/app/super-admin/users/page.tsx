"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

  async function fetchUsers() {
    try {
      const res = await fetch("/api/super/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.organization?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
           <div className="rounded-xl bg-slate-900 p-2 text-white">
              <Users className="h-5 w-5" />
           </div>
           <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                 Global User Directory
              </h1>
              <p className="text-sm text-slate-500">
                 Search all verified members across any organization and manage hierarchical roles.
              </p>
           </div>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b bg-slate-50/50">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Details</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Manage Access</TableHead>
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
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    No users matched your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-medium text-slate-900">{u.full_name}</p>
                      <p className="text-sm text-slate-500">{u.email}</p>
                    </TableCell>
                    <TableCell>
                      {u.organization?.name ? (
                         <div>
                            <p className="font-medium text-slate-700">{u.organization.name}</p>
                            <p className="text-xs text-slate-500">{u.department?.name || "No Dept"} • {u.job_level?.name || "No Level"}</p>
                         </div>
                      ) : (
                        <span className="text-slate-400 italic">No Organization</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                         variant={u.role === 'super_admin' ? 'destructive' : u.role === 'org_admin' ? 'default' : 'secondary'}
                         className="capitalize"
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
                             className={u.role === 'employee' ? 'text-blue-600 border-blue-200 hover:bg-blue-50' : 'text-red-600 hover:bg-red-50'}
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
        </CardContent>
      </Card>
    </div>
  );
}
