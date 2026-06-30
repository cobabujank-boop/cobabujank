"use client"

import { useEffect, useMemo, useState } from "react";
import { Cpu, Loader2, RotateCcw, Clock, KeyRound, Shield, RefreshCw } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useUserAuth } from "@/lib/user-auth";

type UserKeyRow = {
  id: number;
  keyCode: string;
  packageTitle: string | null;
  status: string;
  expiresAt: string | null;
  hwid?: string | null;
  hwidResetAt?: string | null;
  createdAt: string;
};

function formatDateId(value: string | null) {
  if (!value) return "\u2014";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "\u2014";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatRemaining(ms: number): string {
  if (ms <= 0 || !Number.isFinite(ms)) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function statusVariant(status: string) {
  if (status === "active") return "default" as const;
  if (status === "expired") return "destructive" as const;
  return "secondary" as const;
}

export function UserKeys() {
  const { toast } = useToast();
  const { token } = useUserAuth();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetTargetKey, setResetTargetKey] = useState<UserKeyRow | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { data, isLoading } = useQuery<{ keys: UserKeyRow[] }>({
    queryKey: ["/api/user/keys"],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch("/api/user/keys", { headers: authHeaders });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal ambil keys");
      return json;
    },
  });

  const keys = data?.keys || [];
  const stats = useMemo(() => {
    const total = keys.length;
    const active = keys.filter((k) => k.status === "active").length;
    const expired = keys.filter((k) => k.status === "expired").length;
    const resetReady = keys.filter((k) => {
      if (k.status !== "active") return false;
      if (!k.hwid) return false;
      if (!k.hwidResetAt) return true;
      const next = new Date(k.hwidResetAt).getTime() + 20 * 60 * 1000;
      return nowMs >= next;
    }).length;
    return { total, active, expired, resetReady };
  }, [keys, nowMs]);

  const resetHwidMutation = useMutation({
    mutationFn: async (key: UserKeyRow) => {
      const res = await fetch(`/api/user/keys/${key.id}/reset-hwid`, {
        method: "POST",
        headers: authHeaders,
      });
      const json = await res.json();
      if (res.status === 429) throw new Error(json.message || "Bisa reset lagi dalam 20 menit");
      if (!res.ok) throw new Error(json.message || "Gagal reset HWID");
      return json as { success: boolean; message: string };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/keys"] });
      toast({ title: "Berhasil", description: result.message || "HWID berhasil di-reset" });
      setResetDialogOpen(false);
      setResetTargetKey(null);
    },
    onError: (e: unknown) => {
      toast({ title: "Gagal reset", description: e instanceof Error ? e.message : "Terjadi error", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Keys</h1>
        <p className="text-sm text-muted-foreground mt-1">Kelola license key dan hardware ID kamu.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <KeyRound className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Total</span>
          </div>
          <div className="text-2xl font-bold tabular-nums">{stats.total}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Aktif</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-emerald-500">{stats.active}</div>
          {stats.expired > 0 && <div className="text-xs text-muted-foreground mt-0.5">{stats.expired} expired</div>}
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <RefreshCw className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Reset</span>
          </div>
          <div className="text-2xl font-bold tabular-nums">{stats.resetReady}</div>
        </div>
      </div>

      {/* Reset HWID Dialog */}
      <AlertDialog
        open={resetDialogOpen}
        onOpenChange={(open) => {
          setResetDialogOpen(open);
          if (!open) setResetTargetKey(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Hardware ID</AlertDialogTitle>
            <AlertDialogDescription>
              Ini akan melepas device yang terikat ke key ini. Setelah reset, key bisa dipakai di device baru.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {resetTargetKey ? (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Key</span>
                <span className="font-mono font-medium">{resetTargetKey.keyCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">HWID</span>
                <span className="max-w-[200px] truncate font-mono text-xs">{resetTargetKey.hwid || "\u2014"}</span>
              </div>
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetHwidMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetTargetKey && resetHwidMutation.mutate(resetTargetKey)}
              disabled={!resetTargetKey || resetHwidMutation.isPending}
            >
              {resetHwidMutation.isPending ? "Memproses..." : "Reset HWID"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Key List */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Memuat data...</span>
        </div>
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <KeyRound className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Belum ada key</p>
          <p className="text-xs text-muted-foreground mt-1">Beli paket di halaman Store untuk mendapatkan key.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => {
            const isActive = k.status === "active";
            const hasHwid = !!k.hwid;
            const nextAllowedAt = k.hwidResetAt ? new Date(k.hwidResetAt).getTime() + 20 * 60 * 1000 : null;
            const msLeft = nextAllowedAt ? nextAllowedAt - nowMs : 0;
            const canReset = isActive && hasHwid && (!nextAllowedAt || msLeft <= 0);

            return (
              <div key={k.id} className="rounded-xl border bg-card overflow-hidden">
                {/* Top section */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-sm font-semibold break-all">{k.keyCode}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{k.packageTitle || "\u2014"}</div>
                    </div>
                    <Badge variant={statusVariant(k.status)} className="shrink-0">{k.status}</Badge>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-0.5">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Device</div>
                      <div className="flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-mono text-xs truncate">{k.hwid || "Tidak terikat"}</span>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Berlaku hingga</div>
                      <span className="text-xs font-medium">{formatDateId(k.expiresAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Action footer */}
                {isActive && (
                  <div className="border-t bg-muted/30 px-4 py-2.5 flex items-center justify-between">
                    {!hasHwid ? (
                      <span className="text-xs text-muted-foreground">Belum terikat device</span>
                    ) : !canReset ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Cooldown {formatRemaining(msLeft)}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => {
                          setResetTargetKey(k);
                          setResetDialogOpen(true);
                        }}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset HWID
                      </Button>
                    )}
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
