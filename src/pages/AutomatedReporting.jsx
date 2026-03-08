import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil, Send, Calendar, Clock } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import ReportScheduleForm from "@/components/reporting/ReportScheduleForm";

export default function AutomatedReportingPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["reportSchedules"],
    queryFn: () => base44.entities.ReportSchedule.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ReportSchedule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportSchedules"] });
      setDialogOpen(false);
      setEditSchedule(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ReportSchedule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportSchedules"] });
      setDialogOpen(false);
      setEditSchedule(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ReportSchedule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportSchedules"] });
      setDeleteTarget(null);
    },
  });

  const sendMutation = useMutation({
    mutationFn: (schedule_id) =>
      base44.functions.invoke("generateAutomatedReport", { schedule_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportSchedules"] });
    },
  });

  const handleSave = (formData) => {
    if (editSchedule) {
      updateMutation.mutate({ id: editSchedule.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const activeSchedules = schedules.filter(s => s.status === "active");
  const inactiveSchedules = schedules.filter(s => s.status === "inactive");

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Automated Reporting</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setEditSchedule(null)}
            >
              <Plus className="w-4 h-4" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editSchedule ? "Edit Schedule" : "Create Report Schedule"}
              </DialogTitle>
            </DialogHeader>
            <ReportScheduleForm
              schedule={editSchedule}
              onSubmit={handleSave}
              saving={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active ({activeSchedules.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveSchedules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeSchedules.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No Active Schedules"
              description="Create your first report schedule to get started"
              buttonLabel="Create Schedule"
              onButtonClick={() => setDialogOpen(true)}
            />
          ) : (
            <div className="grid gap-4">
              {activeSchedules.map((schedule) => (
                <Card key={schedule.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{schedule.name}</h3>
                        <Badge className="bg-emerald-100 text-emerald-700">
                          {schedule.report_type}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {schedule.report_type === "weekly"
                            ? `Every ${schedule.frequency_day}`
                            : `Day ${schedule.frequency_date} of month`}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {schedule.send_time}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => sendMutation.mutate(schedule.id)}
                        disabled={sendMutation.isPending}
                      >
                        <Send className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditSchedule(schedule);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setDeleteTarget(schedule.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Recipients ({schedule.recipients.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {schedule.recipients.map((recipient) => (
                        <span
                          key={recipient}
                          className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded"
                        >
                          {recipient}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                      Sections: {schedule.include_sections.join(", ")}
                    </p>
                    {schedule.last_sent && (
                      <p className="text-xs text-slate-500 mt-1">
                        Last sent: {new Date(schedule.last_sent).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {inactiveSchedules.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No Inactive Schedules"
              description="All your schedules are currently active"
            />
          ) : (
            <div className="grid gap-4">
              {inactiveSchedules.map((schedule) => (
                <Card key={schedule.id} className="p-5 opacity-60 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{schedule.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {schedule.recipients.length} recipients
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditSchedule(schedule);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setDeleteTarget(schedule.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this report schedule? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteTarget)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}