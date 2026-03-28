"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface GlobalQuiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  questions: Record<string, unknown>[];
  created_at: string;
}

export default function GlobalQuizManagerPage() {
  const [quizzes, setQuizzes] = useState<GlobalQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Quiz state
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [jsonInput, setJsonInput] = useState(`[
  {
    "question": "Sample Question?",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "A",
    "explanation": "Because it is A."
  }
]`);

  async function fetchQuizzes() {
    try {
      const res = await fetch("/api/super/quizzes");
      if (res.ok) {
        setQuizzes(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuizzes();
  }, []);

     const handlePushQuiz = async () => {
     let parsedQuestions: Record<string, unknown>[] = [];
     try {
         const rawInput = JSON.parse(jsonInput);
         // Auto-wrap single objects into an array for better UX
         if (!Array.isArray(rawInput)) {
             if (typeof rawInput === 'object' && rawInput !== null) {
                 parsedQuestions = [rawInput as Record<string, unknown>];
             } else {
                 throw new Error("Input must be a JSON array or a single JSON object.");
             }
         } else {
             parsedQuestions = rawInput;
         }
     } catch (e: unknown) {
         const msg = e instanceof Error ? e.message : "Invalid JSON format";
         toast.error(`JSON Error: ${msg}`);
         return;
     }

     if (!title || !category) {
         toast.error("Title and category are required");
         return;
     }

     const payload = { title, description, category, difficulty, questions: parsedQuestions };

     try {
         const res = await fetch("/api/super/quizzes", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify(payload)
         });
         
         if (!res.ok) throw new Error("Failed to push quiz");
         
         toast.success("Quiz Published Globally!");
         setOpen(false);
         fetchQuizzes();
     } catch(e: unknown) {
         if (e instanceof Error) toast.error(e.message);
     }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
           <div className="rounded-xl bg-indigo-900 p-2 text-white">
              <BookOpen className="h-5 w-5" />
           </div>
           <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                 Global Quiz Manager
              </h1>
              <p className="text-sm text-slate-500">
                 Create and publish General Knowledge Quizzes straight to all users.
              </p>
           </div>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
               <Plus className="mr-2 h-4 w-4" />
               Create Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Push Global Quiz</DialogTitle>
              <DialogDescription>
                This quiz will immediately be available to all platform users.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Title</label>
                     <Input placeholder="e.g. 2026 Platform Compliance" value={title} onChange={e => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Category</label>
                     <Input placeholder="e.g. Technology" value={category} onChange={e => setCategory(e.target.value)} />
                  </div>
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-medium">Description</label>
                 <Input value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-medium">Difficulty</label>
                 <Select value={difficulty} onValueChange={setDifficulty}>
                   <SelectTrigger><SelectValue /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-medium flex justify-between">
                    Questions Array (JSON)
                    <span className="text-xs text-slate-400">Must include `question`, `options`[], `correct_answer`, `explanation`</span>
                 </label>
                 <Textarea 
                    className="font-mono text-xs h-48" 
                    value={jsonInput}
                    onChange={e => setJsonInput(e.target.value)}
                 />
              </div>
            </div>
            <DialogFooter>
               <Button onClick={handlePushQuiz} className="bg-indigo-600 hover:bg-indigo-700">
                  <Send className="mr-2 h-4 w-4" /> Push to All Users
               </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quiz Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Published Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
               {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
               ) : quizzes.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-slate-500 h-24">No global quizzes published.</TableCell></TableRow>
               ) : (
                  quizzes.map(quiz => (
                     <TableRow key={quiz.id}>
                        <TableCell>
                           <p className="font-medium">{quiz.title}</p>
                           <p className="text-xs text-slate-500">{quiz.description}</p>
                        </TableCell>
                        <TableCell><Badge variant="outline">{quiz.category}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{quiz.difficulty}</Badge></TableCell>
                        <TableCell>{Array.isArray(quiz.questions) ? quiz.questions.length : 0}</TableCell>
                        <TableCell className="text-sm text-slate-500">{format(new Date(quiz.created_at), "MMM d, yyyy")}</TableCell>
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
