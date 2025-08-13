import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, Minus, Trophy, Edit3 } from "lucide-react";

interface EditKidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kidName: string;
  currentPoints: number;
  currentGoal: number;
  onAddPoints: (delta: number) => void;
  onSetGoal: (goal: number) => void;
  onReset: () => void;
}

export function EditKidModal({
  open,
  onOpenChange,
  kidName,
  currentPoints,
  currentGoal,
  onAddPoints,
  onSetGoal,
  onReset,
}: EditKidModalProps) {
  const [goal, setGoal] = useState(currentGoal);
  const [customPoints, setCustomPoints] = useState("");
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  const handleSave = () => {
    onSetGoal(Math.max(0, goal));
    setIsEditingGoal(false);
    onOpenChange(false);
  };

  const handleAddPoints = (delta: number) => {
    onAddPoints(delta);
    setCustomPoints("");
  };

  const handleCustomPoints = () => {
    const value = Number(customPoints);
    if (!Number.isNaN(value) && value !== 0) {
      handleAddPoints(value);
    }
  };

  const progressPercentage = goal > 0 ? Math.min(100, (currentPoints / goal) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {kidName}'s Progress
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Progress Overview Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Current Status</span>
                <Badge variant="secondary" className="text-sm">
                  {Math.round(progressPercentage)}% Complete
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">{currentPoints} points</span>
                <div className="flex items-center gap-2">
                  {isEditingGoal ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={goal}
                        onChange={(e) => setGoal(Number(e.target.value))}
                        className="w-20 h-8"
                        min={0}
                      />
                      <Button size="sm" onClick={() => {
                        onSetGoal(Math.max(0, goal));
                        setIsEditingGoal(false);
                      }}>
                        ✓
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Goal: {goal}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingGoal(true)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Adjust Points</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Quick Add/Remove Buttons */}
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPoints(1)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPoints(5)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  5
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPoints(10)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  10
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPoints(-1)}
                  className="flex items-center gap-1"
                >
                  <Minus className="h-3 w-3" />
                  1
                </Button>
              </div>

              {/* Custom Amount */}
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Custom amount (+/-)"
                  value={customPoints}
                  onChange={(e) => setCustomPoints(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleCustomPoints} disabled={!customPoints}>
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={() => {
              onReset();
              onOpenChange(false);
            }}
          >
            Reset to 0
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}