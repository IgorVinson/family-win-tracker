// filepath: src/pages/AcceptInvite.tsx

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  rpcClaimKidInvitation,
  supabase,
} from "@/integrations/supabase/client";
import { Lock, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AcceptInvite() {
  const [search] = useSearchParams();
  const urlToken = search.get("token") || "";
  const storedToken =
    typeof window !== "undefined"
      ? localStorage.getItem("pendingKidInvitation") || ""
      : "";
  const token = urlToken || storedToken;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);

  // Signup form state
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpDisplayName, setSignUpDisplayName] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail || !signUpPassword || !signUpDisplayName) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all fields.",
      });
      return;
    }

    setSignUpLoading(true);
    try {
      // Redirect to Auth page AFTER email verification so kid must sign in manually
      const redirectUrl = `${window.location.origin}/auth?inviteToken=${token}&verified=1`;
      const { data, error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: signUpDisplayName,
            role: "kid",
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        localStorage.setItem("pendingKidInvitation", token);
        toast({
          title: "Account created! Verify your email",
          description:
            "Check your email, click the verification link, then sign in on the next page to finish joining your family.",
        });
      }
    } catch (error: unknown) {
      console.error("Sign up error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred during sign up.";
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: message,
      });
    } finally {
      setSignUpLoading(false);
    }
  };

  const claim = async () => {
    if (claimed || !token) return;
    setLoading(true);
    const { data, error } = await rpcClaimKidInvitation(token);
    setLoading(false);
    if (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Invite failed",
        description: error.message,
      });
      return;
    }
    const kidId = data?.[0]?.kid_id;
    toast({
      title: "Invitation accepted",
      description: "Your account is now linked.",
    });
    if (kidId) {
      localStorage.removeItem("pendingKidInvitation");
      setClaimed(true);
      navigate(`/kid/${kidId}`);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              This invitation link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="KidsRise Logo"
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold">Join Your Family!</h1>
          <p className="text-muted-foreground mt-2">
            Create your kid account to start earning points
          </p>
        </div>

        {!user && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5" />
                Kid Account Setup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="signup-name"
                    className="flex items-center gap-2"
                  >
                    <UserRound className="h-4 w-4" />
                    Display Name
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signUpDisplayName}
                    onChange={e => setSignUpDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="signup-email"
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signUpEmail}
                    onChange={e => setSignUpEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="signup-password"
                    className="flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signUpPassword}
                    onChange={e => setSignUpPassword(e.target.value)}
                    placeholder="Create a password"
                    minLength={6}
                    required
                  />
                </div>
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  <p className="font-medium mb-1">What happens next:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>We email you a verification link</li>
                    <li>
                      You confirm your email (redirect goes to the sign-in page)
                    </li>
                    <li>You sign in manually</li>
                    <li>
                      Return here (or we redirect you) and press Join Family
                    </li>
                  </ol>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={signUpLoading}
                >
                  {signUpLoading ? "Creating account..." : "Create Kid Account"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  After verifying your email you must sign in, then come back to
                  link your account.
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        {user && !claimed && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-center text-green-600">
                Ready to Join!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Signed in! Click below to connect to your family account.
              </p>
              <Button
                onClick={claim}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? "Connecting..." : "Join Family"}
              </Button>
            </CardContent>
          </Card>
        )}
        {user && claimed && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-center text-green-600">
                Linked!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Redirecting to your dashboard...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
