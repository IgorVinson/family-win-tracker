import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import type { Activity, Group } from "@/pages/KidDashboard";
import { useEnhancedKidDB } from "@/hooks/useEnhancedKidDB";
import type { ScoringRule } from "@/types/scoreSystem";

interface EditActivityModalProps {
  activity: Activity | null;
  groups: Group[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedActivity: Activity, scoringRule?: ScoringRule) => void;
  kidId: string;
}

const EditActivityModal = ({ activity, groups, isOpen, onClose, onSave, kidId }: EditActivityModalProps) => {
  const { kid, updateActivityScoringRule } = useEnhancedKidDB(kidId);
  
  const [name, setName] = useState(activity?.name || "");
  const [unit, setUnit] = useState(activity?.unit || "");
  const [planType, setPlanType] = useState<"" | "daily" | "weekly">(activity?.planType || "");
  const [planValue, setPlanValue] = useState(activity?.planValue?.toString() || "");
  const [groupId, setGroupId] = useState(activity?.groupId || "");
  
  // Get current scoring rule for this activity
  const currentScoringRule = kid?.activities?.find(m => m.id === activity?.id)?.scoringRule || {
    basePointsPerUnit: 1,
    goalBonusPoints: 5,
    streakBonusPoints: 2,
    maxDailyPoints: 50
  };
  
  // Scoring rule states
  const [basePointsPerUnit, setBasePointsPerUnit] = useState(currentScoringRule.basePointsPerUnit.toString());
  const [goalBonusPoints, setGoalBonusPoints] = useState(currentScoringRule.goalBonusPoints.toString());
  const [streakBonusPoints, setStreakBonusPoints] = useState(currentScoringRule.streakBonusPoints.toString());
  const [maxDailyPoints, setMaxDailyPoints] = useState(currentScoringRule.maxDailyPoints.toString());

  // Reset form when activity changes
  useEffect(() => {
    if (activity) {
      setName(activity.name);
      setUnit(activity.unit || "");
      setPlanType(activity.planType || "");
      setPlanValue(activity.planValue?.toString() || "");
      setGroupId(activity.groupId || "");
      
      // Reset scoring rule values
      const scoringRule = kid?.activities?.find(m => m.id === activity.id)?.scoringRule || {
        basePointsPerUnit: 1,
        goalBonusPoints: 5,
        streakBonusPoints: 2,
        maxDailyPoints: 50
      };
      setBasePointsPerUnit(scoringRule.basePointsPerUnit.toString());
      setGoalBonusPoints(scoringRule.goalBonusPoints.toString());
      setStreakBonusPoints(scoringRule.streakBonusPoints.toString());
      setMaxDailyPoints(scoringRule.maxDailyPoints.toString());
    }
  }, [activity, kid]);

  const handleSave = () => {
    if (!activity || !name.trim()) return;

    const planValNum = Number(planValue);
    const updatedActivity: Activity = {
      ...activity,
      name: name.trim(),
      unit: unit.trim() || undefined,
      planType: planType || undefined,
      planValue: Number.isFinite(planValNum) && planValNum > 0 ? planValNum : undefined,
      groupId: groupId || undefined,
    };

    const updatedScoringRule: ScoringRule = {
      activityId: activity.id,
      basePointsPerUnit: Math.max(0, Number(basePointsPerUnit) || 1),
      goalBonusPoints: Math.max(0, Number(goalBonusPoints) || 0),
      streakBonusPoints: Math.max(0, Number(streakBonusPoints) || 0),
      maxDailyPoints: Math.max(1, Number(maxDailyPoints) || 50),
    };

    // Update scoring rule in the enhanced kid data
    if (updateActivityScoringRule) {
      updateActivityScoringRule(activity.id, updatedScoringRule);
    }

    onSave(updatedActivity, updatedScoringRule);
    onClose();
  };

  if (!activity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Activity name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Reading minutes"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="edit-unit">Unit (optional)</Label>
            <Input
              id="edit-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g., min, pages"
            />
          </div>

          <div className="grid gap-2">
            <Label>Plan type</Label>
            <Select value={planType || "none"} onValueChange={(v) => setPlanType(v === "none" ? "" : (v as any))}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-plan">Plan value</Label>
            <Input
              id="edit-plan"
              type="number"
              min={0}
              value={planValue}
              onChange={(e) => setPlanValue(e.target.value)}
              placeholder="e.g., 30"
            />
          </div>

          <div className="grid gap-2">
            <Label>Group</Label>
            <Select value={groupId || "none"} onValueChange={(v) => setGroupId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm">Scoring Rules</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <Label htmlFor="base-points" className="text-xs text-muted-foreground">Base Points per {unit || 'unit'}</Label>
                <Input
                  id="base-points"
                  type="number"
                  min="0"
                  value={basePointsPerUnit}
                  onChange={(e) => setBasePointsPerUnit(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="goal-bonus" className="text-xs text-muted-foreground">Goal Bonus Points</Label>
                <Input
                  id="goal-bonus"
                  type="number"
                  min="0"
                  value={goalBonusPoints}
                  onChange={(e) => setGoalBonusPoints(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="streak-bonus" className="text-xs text-muted-foreground">Streak Bonus Points</Label>
                <Input
                  id="streak-bonus"
                  type="number"
                  min="0"
                  value={streakBonusPoints}
                  onChange={(e) => setStreakBonusPoints(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="max-daily" className="text-xs text-muted-foreground">Max Daily Points</Label>
                <Input
                  id="max-daily"
                  type="number"
                  min="1"
                  value={maxDailyPoints}
                  onChange={(e) => setMaxDailyPoints(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Complete your {planType} goal of {planValue} {unit || 'units'} to earn the goal bonus. 
              Maintain streaks for additional points!
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditActivityModal;