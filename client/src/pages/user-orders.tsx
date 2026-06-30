"use client"

import { useMemo } from "react";
import { Loader2, Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useUserAuth } from "@/lib/user-auth";

type UserOrderRow = {
  id: string;
  packageTitle: string | null;
  price: string;
  status: string;
  createdAt: string;
};

function formatIdr(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(String(value).replace(/,/g, "")) || 0 : Number(value);
  return new Intl.NumberFormat("id-ID").format(n);
}

function formatDateTimeId(value: string | null) {
  if (!value) return "\u2014";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "\u2014";
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusConfig(status: string) {
  switch (status) {
    case "paid": return { label: "Lunas", variant: "default" as const, icon: CheckCircle, color: "text-emerald-500" };
    case "pending": return { label: "Menunggu", variant: "secondary" as const, icon: Clock, color: "text-amber-500" };
    case "expired": return { label: "Expired", variant: "outline" as const, icon: XCircle, color: "text-muted-foreground" };
    default: return { label: status, variant: "outline" as const, icon: FileText, color: "text-muted-foreground" };
  }
}

export function UserOrders() {
  const { toast } = useToast();
  const { token } = useUserAuth();
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const { data, isLoading } = useQuery<{ orders: UserOrderRow[] }>({
    queryKey: ["/api/user/orders"],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch("/api/user/orders", { headers: authHeaders });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal ambil orders");
      return json;
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/user/orders/${encodeURIComponent(orderId)}/confirm`, {
        method: "POST",
        headers: authHeaders,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal cek status pembayaran");
      return json as { id: string; status: string; gateway?: { ok: boolean; message?: string } };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/orders"] });
      toast({ title: "Status diperbarui", description: result.gateway?.message || result.status });
    },
    onError: (e: unknown) => {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Terjadi error", variant: "destructive" });
    },
  });

  const orders = data?.orders || [];
  const totals = useMemo(() => {
    return {
      pending: orders.filter((o) => o.status === "pending").length,
      paid: orders.filter((o) => o.status === "paid").length,
      expired: orders.filter((o) => o.status === "expired").length,
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Riwayat Order</h1>
        <p className="text-sm text-muted-foreground mt-1">Semua transaksi pembelian kamu.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending</span>
          </div>
          <div className="text-2xl font-bold tabular-nums">{totals.pending}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lunas</span>
          </div>
          <div className="text-2xl font-bold tabular-nums">{totals.paid}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <XCircle className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Expired</span>
          </div>
          <div className="text-2xl font-bold tabular-nums">{totals.expired}</div>
        </div>
      </div>

      {/* Order List */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Memuat data...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Belum ada order</p>
          <p className="text-xs text-muted-foreground mt-1">Pembelian paket akan tercatat di sini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const cfg = statusConfig(o.status);
            const StatusIcon = cfg.icon;
            return (
              <div key={o.id} className="rounded-xl border bg-card overflow-hidden">
                <div className="p-4 space-y-3">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{o.packageTitle || "\u2014"}</div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">{o.id}</div>
                    </div>
                    <Badge variant={cfg.variant} className="shrink-0 gap-1">
                      <StatusIcon className={`h-3 w-3 ${cfg.color}`} />
                      {cfg.label}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-0.5">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Harga</div>
                      <span className="font-semibold">IDR {formatIdr(o.price)}</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Tanggal</div>
                      <span className="text-xs">{formatDateTimeId(o.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Action footer for pending */}
                {o.status === "pending" && (
                  <div className="border-t bg-muted/30 px-4 py-2.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 gap-1.5 text-xs"
                      onClick={() => confirmMutation.mutate(o.id)}
                      disabled={confirmMutation.isPending}
                    >
                      {confirmMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Cek Status Pembayaran
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
