"use client"

import { useMemo } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Removed Table imports
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
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
      toast({ title: "Status", description: result.gateway?.message || result.status });
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
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-wide">Order History</h1>
        <p className="text-muted-foreground">Riwayat pembelian kamu.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="mt-2 text-2xl font-bold">{totals.pending}</div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Paid</div>
            <div className="mt-2 text-2xl font-bold">{totals.paid}</div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Expired</div>
            <div className="mt-2 text-2xl font-bold">{totals.expired}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Orders
          </CardTitle>
          <CardDescription>Order dengan status pending bisa dicek ulang.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              {orders.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                  Belum ada order.
                </div>
              ) : (
                orders.map((o) => (
                  <Card key={o.id} className="flex flex-col overflow-hidden bg-background/50">
                    <div className="p-4 flex-1 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold">{o.packageTitle || "—"}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">{o.id}</div>
                        </div>
                        <Badge variant={o.status === "paid" ? "default" : o.status === "pending" ? "secondary" : "outline"}>
                          {o.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm border-t pt-3">
                        <div>
                          <span className="text-xs text-muted-foreground block">Harga</span>
                          <span className="font-medium mt-0.5 block">IDR {formatIdr(o.price)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Tanggal</span>
                          <span className="font-medium mt-0.5 block">{formatDateTimeId(o.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {o.status === "pending" && (
                      <div className="bg-muted/40 p-3 border-t">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full gap-2 bg-background/50 hover:bg-background"
                          onClick={() => confirmMutation.mutate(o.id)} 
                          disabled={confirmMutation.isPending}
                        >
                          {confirmMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Cek Status Pembayaran
                        </Button>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
