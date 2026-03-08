import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil, Trash2, Store as StoreIcon, MapPin, Phone } from "lucide-react";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";
import StoreFormDialog from "../components/stores/StoreFormDialog";
import { useRole } from "../components/shared/useRole";

const regionLabels = { north: "North", south: "South", east: "East", west: "West", central: "Central" };
const typeLabels = { hypermarket: "Hypermarket", supermarket: "Supermarket", minimart: "Minimart", express: "Express" };

export default function Stores() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStore, setEditStore] = useState(null);
  const queryClient = useQueryClient();

  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: () => base44.entities.Store.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Store.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["stores"] }); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Store.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["stores"] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Store.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores"] }),
  });

  const handleSave = (formData) => {
    if (editStore) updateMutation.mutate({ id: editStore.id, data: formData });
    else createMutation.mutate(formData);
  };

  const filtered = stores.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search stores..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => { setEditStore(null); setDialogOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-1.5" /> Add Store
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80">
          <EmptyState
            icon={StoreIcon}
            title="No stores yet"
            description="Add your supermarket locations to manage distribution"
            actionLabel="Add Store"
            onAction={() => { setEditStore(null); setDialogOpen(true); }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(store => (
            <div key={store.id} className="bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">{store.name}</h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{store.code}</p>
                </div>
                <StatusBadge status={store.status} />
              </div>
              <div className="space-y-2 text-xs text-slate-500 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{store.address || "No address"} · {regionLabels[store.region]} Region</span>
                </div>
                <div className="flex items-center gap-2">
                  <StoreIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{typeLabels[store.store_type] || store.store_type}</span>
                </div>
                {store.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{store.contact_person ? `${store.contact_person} · ` : ""}{store.contact_phone}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => { setEditStore(store); setDialogOpen(true); }}>
                  <Pencil className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteMutation.mutate(store.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <StoreFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        store={editStore}
        onSave={handleSave}
        saving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}