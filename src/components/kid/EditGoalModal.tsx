import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, Minus, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Metric {
  id: string;
  name: string;
  value: number;
  unit?: string;
  planType?: "daily" | "weekly";
  planValue?: number;
}

interface EditGoalModalProps {
  metric: Metric | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (metricId: string, updates: {
    planValue?: number;
    planType?: "daily" | "weekly";
    value?: number;
  }) => void;
}

export function EditGoalModal({ metric, isOpen, onClose, onSave }: EditGoalModalProps) {
  const [planValue, setPlanValue] = useState("");
  const [planType, setPlanType] = useState<"daily" | "weekly">("daily");
  const [pointAdjustment, setPointAdjustment] = useState("");
  const [activeTab, setActiveTab] = useState("goal");

  useEffect(() => {
    if (metric) {
      setPlanValue(metric.planValue?.toString() || "");
      setPlanType(metric.planType || "daily");
      setPointAdjustment("");
    }
  }, [metric]);

  const handleSaveGoal = () => {
    if (!metric) return;

    const planVal = Number(planValue);
    const updates = {
      planValue: Number.isFinite(planVal) && planVal > 0 ? planVal : undefined,
      planType: planValue ? planType : undefined,
    };

    onSave(metric.id, updates);
    toast({
      title: "Goal updated",
      description: `Goal for ${metric.name} has been updated.`,
    });
    onClose();
  };

  const handleAdjustPoints = (operation: "add" | "reset") => {
    if (!metric) return;

    let newValue = metric.value;
    
    if (operation === "add") {
      const adjustment = Number(pointAdjustment);
      if (!Number.isFinite(adjustment)) {
        toast({
          title: "Invalid input",
          description: "Please enter a valid number.",
          variant: "destructive",
        });
        return;
      }
      newValue = Math.max(0, metric.value + adjustment);
    } else if (operation === "reset") {
      newValue = 0;
    }

    onSave(metric.id, { value: newValue });
    toast({
      title: "Points updated",
      description: `${metric.name} ${operation === "reset" ? "reset to 0" : `adjusted by ${pointAdjustment}`}.`,
    });
    onClose();
  };

  if (!metric) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Edit {metric.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Value</span>
              <span className="text-lg font-bold">
                {metric.value} {metric.unit || ""}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Goal</span>
              {metric.planValue ? (
                <Badge variant="outline">
                  {metric.planValue} {metric.unit || ""} {metric.planType}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">No goal set</span>
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="goal">Edit Goal</TabsTrigger>
              <TabsTrigger value="points">Adjust Points</TabsTrigger>
            </TabsList>

            <TabsContent value="goal" className="space-y-4">
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="goal-value">Goal Value</Label>
                  <Input
                    id="goal-value"
                    type="number"
                    min={0}
                    value={planValue}
                    onChange={(e) => setPlanValue(e.target.value)}
                    placeholder="Enter goal value"
                  />
                </div>
                
                {planValue && (
                  <div className="grid gap-2">
                    <Label>Goal Type</Label>
                    <Select value={planType} onValueChange={(v) => setPlanType(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveGoal} className="flex-1">
                  <Target className="h-4 w-4 mr-2" />
                  Save Goal
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPlanValue("");
                    handleSaveGoal();
                  }}
                >
                  Clear Goal
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="points" className="space-y-4">
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="point-adjustment">Adjustment Value</Label>
                  <Input
                    id="point-adjustment"
                    type="number"
                    value={pointAdjustment}
                    onChange={(e) => setPointAdjustment(e.target.value)}
                    placeholder="Enter positive or negative number"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleAdjustPoints("add")}
                  disabled={!pointAdjustment}
                  className="flex-1"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Apply
                </Button>
                <Button
                  onClick={() => handleAdjustPoints("reset")}
                  variant="destructive"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to 0
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}