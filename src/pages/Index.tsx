import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFamilyKids } from "@/hooks/useFamilyKids";
import {
  Plus,
  Target,
  Trophy,
  Star,
  UserRound,
  ArrowRight,
  Edit,
  BarChart3,
  AlertCircle,
  LogOut,
  Loader2,
} from "lucide-react";
import { EditKidModal } from "@/components/kid/EditKidModal";
import { ReportViewModal } from "@/components/kid/ReportViewModal";

type DailyReportEntry = { metricId: string; value: number };
type DailyReport = {
  id: string;
  date: string;
  createdAt: string;
  notes?: string;
  entries: DailyReportEntry[];
  status?: "pending" | "approved" | "rejected";
};
type Metric = { id: string; name: string; unit?: string; groupId?: string };
type PrizeRedemption = {
  id: string;
  prizeId: string;
  prizeName: string;
  pointsCost: number;
  status: "pending" | "approved" | "rejected" | "completed";
  requestedAt: string;
  processedAt?: string;
  notes?: string;
};

type Kid = {
  id: string;
  name: string;
  points: number;
  goal: number;
  color: string; // hsl string token name or purpose only
  createdAt: string;
  reports?: DailyReport[];
  metrics?: Metric[];
  prizeRedemptions?: PrizeRedemption[];
};

const pastelHues = [
  "262 83% 58%",
  "200 90% 45%",
  "28 92% 54%",
  "150 60% 45%",
  "330 70% 55%",
];

const Index = () => {
  const { isAuthenticated, user, signOut, loading: authLoading } = useAuth();

  // Only use database for authenticated users
  const {
    kids,
    loading: dbLoading,
    addKid,
    updatePoints,
    setGoal,
    resetKid,
  } = useFamilyKids();

  const [openAddKid, setOpenAddKid] = useState(false);

  // Show loading if auth is loading or database is loading for authenticated users
  const loading = authLoading || (isAuthenticated && dbLoading);

  // Signature interaction: spotlight gradient follows pointer
  const handleMouseMove = (e: React.MouseEvent) => {
    document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
    document.documentElement.style.setProperty("--my", `${e.clientY}px`);
  };

  const totalPoints = useMemo(
    () => kids.reduce((sum, k) => sum + k.points, 0),
    [kids]
  );

  const leaderboard = useMemo(
    () => [...kids].sort((a, b) => b.points - a.points),
    [kids]
  );

  // Show loading state for authenticated users
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="card-elevated">
          <CardContent className="flex items-center gap-4 p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <div>
              <p className="font-medium">Loading...</p>
              <p className="text-sm text-muted-foreground">
                Setting up your family dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="spotlight-container min-h-screen"
      onMouseMove={handleMouseMove}
    >
      <div className="spotlight-overlay" />

      <main className="relative z-10 container py-10">
        <header className="mb-8">
          {/* Title and Add Kid Section */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <img
                src="/lovable-uploads/dd5214b6-f0ae-465c-be62-f98bdadb9881.png"
                alt="KidsRise Logo"
                className="h-12 sm:h-16 w-auto flex-shrink-0"
                onError={e => {
                  console.error("Logo failed to load");
                  e.currentTarget.style.display = "none";
                }}
                onLoad={() => console.log("Logo loaded successfully")}
              />
              {/* Title and Subtitle */}
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                  Watch Your Kids Rise to Every Challenge
                </h1>
                <p className="text-muted-foreground mt-2">
                  Transform daily chores and activities into exciting
                  achievements. KidsRise helps families set goals, track
                  progress, and celebrate wins together with our fun point-based
                  reward system.
                </p>
              </div>
            </div>
            <div className="flex gap-3 self-center">
              {isAuthenticated ? (
                <Dialog open={openAddKid} onOpenChange={setOpenAddKid}>
                  <DialogTrigger asChild>
                    <Button size="lg">
                      <Plus className="mr-2 h-5 w-5" /> Add Kid
                    </Button>
                  </DialogTrigger>
                  <AddKidDialog
                    onAdd={(n, g) => {
                      addKid(n, g);
                      setOpenAddKid(false);
                    }}
                  />
                </Dialog>
              ) : null}
            </div>
          </div>
        </header>

        {/* Dashboard Cards */}
        {!isAuthenticated ? (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" /> Sign In to Get Started
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-4">
                Sign in to create kid profiles and start tracking points,
                achievements, and rewards. Transform daily chores and activities
                into exciting achievements for your family!
              </p>
              <Button asChild>
                <Link to="/auth">
                  <UserRound className="mr-2 h-4 w-4" />
                  Sign In / Sign Up
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : kids.length === 0 ? (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" /> Get Started
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Create your first kid profile to start tracking points. Use
              quick-add buttons for common wins like reading, chores, or
              kindness.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {kids.map(kid => (
              <KidCard
                key={kid.id}
                kid={kid}
                onAdd={d => updatePoints(kid.id, d)}
                onSetGoal={g => setGoal(kid.id, g)}
                onReset={() => resetKid(kid.id)}
              />
            ))}
          </div>
        )}

        {/* Leaderboard */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5" /> Leaderboard
            </h2>
            <span className="text-sm text-muted-foreground">
              Total points: {totalPoints}
            </span>
          </div>
          <Card className="card-elevated">
            <CardContent className="pt-6">
              {leaderboard.length === 0 ? (
                <p className="text-muted-foreground">
                  No points yet. Time to earn some stars!
                </p>
              ) : (
                <ul className="divide-y">
                  {leaderboard.map((k, i) => (
                    <li
                      key={k.id}
                      className="py-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-full flex items-center justify-center border"
                          style={{ backgroundColor: `hsl(${k.color} / 0.1)` }}
                        >
                          <UserRound className="h-5 w-5" />
                        </div>
                        <span className="font-medium">
                          {i + 1}. {k.name}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {k.points} pts{" "}
                        {k.goal ? (
                          <span className="ml-2">/ Goal {k.goal}</span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

function KidCard({
  kid,
  onAdd,
  onSetGoal,
  onReset,
}: {
  kid: Kid;
  onAdd: (delta: number) => void;
  onSetGoal: (goal: number) => void;
  onReset: () => void;
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(
    null
  );
  const pct = Math.min(
    100,
    kid.goal > 0 ? Math.round((kid.points / kid.goal) * 100) : 0
  );

  const handleReportClick = (report: DailyReport) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  // Count pending redemptions for notification
  const pendingRedemptions =
    kid.prizeRedemptions?.filter(r => r.status === "pending").length || 0;

  // Count pending reports for notification
  const pendingReports =
    kid.reports?.filter(r => r.status === "pending").length || 0;

  return (
    <Card className="card-elevated overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span
              className="inline-flex h-8 w-8 rounded-full border items-center justify-center"
              style={{ backgroundColor: `hsl(${kid.color} / 0.1)` }}
            >
              <UserRound className="h-4 w-4" />
            </span>
            {kid.name}
          </span>
          <span className="text-sm text-muted-foreground">
            {kid.points} pts
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" /> Goal: {kid.goal}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditModal(true)}
              className="h-6 w-6 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">{pct}%</div>
        </div>
        <Progress value={pct} />

        <Separator className="my-4" />

        <div className="flex justify-center">
          <Button
            variant="secondary"
            asChild
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Link
              to={`/kid/${kid.id}`}
              aria-label={`Open ${kid.name} dashboard`}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              View Dashboard
            </Link>
          </Button>
        </div>

        {(() => {
          const recent = [...(kid.reports ?? [])]
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .slice(0, 3); // Show last 3 days instead of 7
          if (recent.length === 0) return null;
          const totalFor = (r: DailyReport) =>
            r.entries.reduce((s, e) => s + (e.value || 0), 0);
          return (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                Recent reports (last 3 days)
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {recent.map(r => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors"
                    onClick={() => handleReportClick(r)}
                  >
                    <span className="font-medium">{r.date}</span>
                    <span className="text-primary font-semibold">
                      Total: {totalFor(r)} pts
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

        {/* Prize Redemption Notification */}
        {pendingRedemptions > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-semibold">Parent Review Needed</p>
                <p className="text-orange-600">
                  {pendingRedemptions} prize redemption
                  {pendingRedemptions > 1 ? "s" : ""} awaiting approval
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Report Review Notification */}
        {pendingReports > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-semibold">Report Review Needed</p>
                <p className="text-blue-600">
                  {pendingReports} daily report{pendingReports > 1 ? "s" : ""}{" "}
                  awaiting approval
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <EditKidModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        kidName={kid.name}
        currentPoints={kid.points}
        currentGoal={kid.goal}
        onAddPoints={onAdd}
        onSetGoal={onSetGoal}
        onReset={onReset}
      />

      <ReportViewModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        report={selectedReport}
        kidName={kid.name}
        metrics={kid.metrics || []}
      />
    </Card>
  );
}

function AddKidDialog({
  onAdd,
}: {
  onAdd: (name: string, goal: number) => void;
}) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<number>(50);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Kid</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="grid gap-2">
          <Label htmlFor="kid-name">Name</Label>
          <Input
            id="kid-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Alex"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="kid-goal">Goal (points)</Label>
          <Input
            id="kid-goal"
            type="number"
            value={goal}
            onChange={e => setGoal(Number(e.target.value))}
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={() => {
            if (!name.trim()) {
              toast({ title: "Please enter a name" });
              return;
            }
            onAdd(name.trim(), Math.max(0, goal));
            setName("");
            setGoal(50);
          }}
        >
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export default Index;
