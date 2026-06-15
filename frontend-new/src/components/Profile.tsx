import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { API_BASE_URL, fetchWithAuth } from "@/lib/api";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  User, 
  Lock, 
  Key, 
  LogOut, 
  Trash2, 
  ShieldAlert, 
  Hourglass, 
  Mail
} from "lucide-react";
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

interface ProfileProps {
  onHub: () => void;
}

export const Profile = ({ onHub }: ProfileProps) => {
  const { user, logout, refreshProfile } = useAuth();
  
  // Profile name update state
  const [name, setName] = useState(user?.name || "");
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Account deletion state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    
    setIsUpdatingName(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to update profile name");
      }

      await refreshProfile();
      toast.success("Profile name updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Could not update name");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to change password");
      }

      toast.success("Password changed successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Could not change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== "DELETE") {
      toast.error("Please type DELETE to confirm account deletion");
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to delete account");
      }

      toast.success("Your account and all associated lab records have been deleted");
      setIsDeleteDialogOpen(false);
      logout();
    } catch (err: any) {
      toast.error(err.message || "Could not delete account");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid relative overflow-y-auto pb-12">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-border bg-surface/70 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onHub} className="flex items-center gap-2 group">
              <div className="w-5 h-5 rounded-sm bg-primary flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-accent" />
              </div>
              <span className="font-display text-base text-primary group-hover:text-accent transition-colors">Helix</span>
            </button>
            <span className="text-border ml-1">/</span>
            <button onClick={onHub} className="label-num hover:text-accent transition-colors">Hub</button>
            <span className="text-border">/</span>
            <span className="label-num text-foreground">Profile Settings</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onHub} 
              className="text-xs px-3 py-1.5 rounded border border-border text-primary hover:bg-surface-sunken transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Hub
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-6 pt-12 space-y-8 animate-reveal">
        {/* Page title */}
        <div className="space-y-1">
          <span className="label-num">User Settings & Preferences</span>
          <h1 className="font-display text-3xl text-primary mt-1 tracking-tight">
            Manage your <span className="italic text-accent">Researcher Profile</span>
          </h1>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-xl">
            Update your account information, modify access keys, or delete the profile environment. Changes here take effect immediately across all sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Side summary card */}
          <div className="panel p-6 space-y-6 md:col-span-1 bg-surface-sunken">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/5 border border-accent/30 flex items-center justify-center text-accent shadow-inner">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display text-lg text-primary">{user?.name || "Dr. Chen"}</h3>
                <span className="label-num text-xs mt-1 block">{user?.email}</span>
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Email status
                </span>
                <span className="pill pill-success">verified</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <Hourglass className="w-3.5 h-3.5" />
                  Session Expiry
                </span>
                <span className="font-mono text-[10px] text-primary">7 days</span>
              </div>
            </div>
            
            <div className="border-t border-border pt-4">
              <button
                onClick={() => logout()}
                className="w-full bg-surface-raised border border-border text-primary py-2 rounded text-xs font-medium hover:bg-muted hover:text-destructive flex items-center justify-center gap-2 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Form settings */}
          <div className="space-y-6 md:col-span-2">
            {/* Form 1: General Details */}
            <form onSubmit={handleUpdateName} className="panel">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span className="panel-title">profile information</span>
                </div>
              </div>
              <div className="panel-body space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full bg-surface-sunken border border-border rounded px-3 py-2 text-sm text-muted-foreground outline-none cursor-not-allowed pr-10"
                      />
                      <div className="absolute right-3 top-2.5 text-muted-foreground/50">
                        <Lock className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground block">
                      Email address is linked to your login provider and cannot be changed here.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent"
                      placeholder="e.g. Dr. Alexander Kurian"
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingName || name.trim() === user?.name}
                    className="bg-primary text-primary-foreground px-4 py-1.5 rounded text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {isUpdatingName ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>

            {/* Form 2: Password */}
            {user?.is_google ? (
              <div className="panel bg-surface-sunken/50 border-dashed">
                <div className="panel-header bg-surface/30">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                    <span className="panel-title text-muted-foreground/80">security & password</span>
                  </div>
                </div>
                <div className="panel-body flex items-start gap-3 text-xs text-muted-foreground py-5">
                  <Lock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-primary">Managed by Google Single Sign-On</h4>
                    <p className="mt-1 leading-relaxed">
                      Your account authentication is secured via Google OAuth. Passwords and login credentials can be managed directly within your Google Account settings.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="panel">
                <div className="panel-header">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="panel-title">security & password</span>
                  </div>
                </div>
                <div className="panel-body space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Current Password</label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent"
                          placeholder="Min 6 characters"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent"
                          placeholder="Confirm password"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={isChangingPassword || !oldPassword || !newPassword || !confirmPassword}
                      className="bg-primary text-primary-foreground px-4 py-1.5 rounded text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {isChangingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Danger Zone panel */}
            <div className="panel border-destructive/30">
              <div className="panel-header border-destructive/20 bg-destructive/5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  <span className="panel-title text-destructive font-bold">danger zone</span>
                </div>
              </div>
              <div className="panel-body space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-primary">Delete Account & Data</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed max-w-md">
                      Permanently delete your user profile and all associated laboratory datasets (inventory items, researchers list, experiment plans, and versions). This action is irreversible.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmationText("");
                      setIsDeleteDialogOpen(true);
                    }}
                    className="bg-destructive hover:bg-destructive/95 text-white px-4 py-2 rounded text-xs font-medium transition-colors shrink-0 inline-flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="border-destructive/40 shadow-xl max-w-md bg-surface p-6">
          <AlertDialogHeader className="space-y-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto sm:mx-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <AlertDialogTitle className="font-display text-lg text-primary text-center sm:text-left">
                Confirm Profile Deletion
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed text-center sm:text-left">
                You are about to delete your profile permanently. This action will cascade delete all lab metadata, inventory lists, scientists list, prior experiments, and reasoning trace logs.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>

          <div className="my-4 space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block">
              Type <span className="text-destructive font-bold">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              className="w-full bg-surface-sunken border border-border rounded px-3 py-2 text-sm outline-none focus:border-destructive text-destructive font-mono"
              placeholder="DELETE"
            />
          </div>

          <AlertDialogFooter className="border-t border-border pt-4 gap-2">
            <AlertDialogCancel 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeleteConfirmationText("");
              }}
              className="text-xs px-3 py-1.5 border border-border"
            >
              Cancel
            </AlertDialogCancel>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount || deleteConfirmationText !== "DELETE"}
              className="bg-destructive hover:bg-destructive/90 text-white rounded px-4 py-1.5 text-xs font-medium disabled:opacity-40 transition-colors inline-flex items-center gap-1.5"
            >
              {isDeletingAccount ? "Deleting..." : "Permanently Delete"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
