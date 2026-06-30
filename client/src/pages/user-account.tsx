"use client"

import { useState } from "react";
import { Loader2, Lock, Mail, User, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUserAuth } from "@/lib/user-auth";

export function UserAccount() {
  const { toast } = useToast();
  const { token, user, logout } = useUserAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast({ title: "Error", description: "Password lama dan password baru wajib diisi", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password baru minimal 6 karakter", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Konfirmasi password tidak sama", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal ubah password");
      toast({ title: "Berhasil", description: data.message || "Password berhasil diubah" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      toast({ title: "Gagal", description: e instanceof Error ? e.message : "Terjadi error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Akun Saya</h1>
        <p className="text-sm text-muted-foreground mt-1">Informasi profil dan pengaturan keamanan.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Profile Card */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-sm font-semibold">Profil</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between rounded-lg border bg-background px-4 py-3">
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Username</span>
              </div>
              <span className="font-mono text-sm font-medium">{user?.username || "\u2014"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-background px-4 py-3">
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </div>
              <span className="font-mono text-sm font-medium truncate max-w-[180px]">{user?.email || "\u2014"}</span>
            </div>

            {/* Mobile logout button */}
            <div className="md:hidden pt-2">
              <Button variant="outline" className="w-full gap-2 text-muted-foreground" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Keluar dari Akun
              </Button>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Ubah Password
            </h2>
          </div>
          <div className="p-5">
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword" className="text-xs font-medium">Password Lama</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Masukkan password lama"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs font-medium">Password Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-medium">Konfirmasi Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={saving}
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Password"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
