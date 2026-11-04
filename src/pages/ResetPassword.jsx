import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  verifyPasswordResetCode,
  confirmPasswordReset
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(null);

  React.useEffect(() => {
    if (!oobCode) {
      setValid(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then(() => setValid(true))
      .catch(() => setValid(false));
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (valid === null) {
    return (
      <AuthLayout icon={Lock} title="Checking reset link" subtitle="Please wait...">
        <div className="flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </AuthLayout>
    );
  }

  if (!valid) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Invalid reset link"
        subtitle="This password reset link is missing, expired, or invalid"
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            Request a new link
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          Please request a new password reset email.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={Lock} title="New password" subtitle="Enter your new password below">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting...</>
          ) : "Reset password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
