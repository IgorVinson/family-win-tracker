import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Target, Plus, Minus } from "lucide-react";

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

  const handleSave = () => {
    onSetGoal(Math.max(0, goal));
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {kidName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Goal Setting */}
          <div className="space-y-2">
            <Label htmlFor="goal" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Goal (points)
            </Label>
            <Input
              id="goal"
              type="number"
              min={0}
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <Separator />

          {/* Points Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Current Points</Label>
              <span className="text-lg font-semibold">{currentPoints}</span>
            </div>

            {/* Custom Points */}
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Custom amount"
                value={customPoints}
                onChange={(e) => setCustomPoints(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleCustomPoints}>
                Add
              </Button>
            </div>

            {/* Reset */}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onReset();
                onOpenChange(false);
              }}
              className="w-full"
            >
              Reset Points to 0
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}