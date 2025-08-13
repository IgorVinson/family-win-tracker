import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Plus, Edit, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";
import { EnhancedKid, Prize, PrizeRedemption } from "@/types/scoreSystem";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PrizeManagementProps {
  kid: EnhancedKid;
  onAddPrize: (prize: Omit<Prize, "id" | "createdAt">) => void;
  onUpdatePrize: (prizeId: string, updates: Partial<Prize>) => void;
  onDeletePrize: (prizeId: string) => void;
  onUpdateRedemption: (redemptionId: string, status: PrizeRedemption["status"], notes?: string) => void;
}

export function PrizeManagement({ 
  kid, 
  onAddPrize, 
  onUpdatePrize, 
  onDeletePrize, 
  onUpdateRedemption 
}: PrizeManagementProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [newPrize, setNewPrize] = useState({
    name: "",
    description: "",
    pointsCost: 0,
    category: "treat" as Prize["category"],
    isActive: true,
  });
  const { toast } = useToast();

  const pendingRedemptions = kid.prizeRedemptions.filter(r => r.status === "pending");
  const recentRedemptions = kid.prizeRedemptions
    .filter(r => r.status !== "pending")
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
    .slice(0, 10);

  const handleAddPrize = () => {
    if (!newPrize.name || !newPrize.description || newPrize.pointsCost <= 0) {
      toast({
        title: "Invalid prize data",
        description: "Please fill in all fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    onAddPrize(newPrize);
    setNewPrize({
      name: "",
      description: "",
      pointsCost: 0,
      category: "treat",
      isActive: true,
    });
    setShowAddDialog(false);
    toast({
      title: "Prize added",
      description: `"${newPrize.name}" has been added to the prize shop.`,
    });
  };

  const handleUpdateRedemption = (redemptionId: string, status: PrizeRedemption["status"]) => {
    onUpdateRedemption(redemptionId, status);
    toast({
      title: "Redemption updated",
      description: `Redemption has been ${status}.`,
    });
  };

  const getStatusIcon = (status: PrizeRedemption["status"]) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "approved": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected": return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Prize Management for {kid.name}
              </CardTitle>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Prize
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="prizes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prizes">Manage Prizes</TabsTrigger>
            <TabsTrigger value="redemptions">
              Redemptions {pendingRedemptions.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingRedemptions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prizes" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kid.availablePrizes.map((prize) => (
                <Card key={prize.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{prize.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{prize.category}</Badge>
                          <Badge variant={prize.isActive ? "default" : "secondary"}>
                            {prize.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingPrize(prize)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDeletePrize(prize.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-2">{prize.description}</p>
                    <p className="font-semibold">{prize.pointsCost} points</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="redemptions" className="space-y-4">
            {pendingRedemptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-yellow-600">Pending Approvals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingRedemptions.map((redemption) => (
                      <div key={redemption.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                        <div>
                          <p className="font-medium">{redemption.prizeName}</p>
                          <p className="text-sm text-muted-foreground">
                            {redemption.pointsCost} points • Requested {format(new Date(redemption.requestedAt), "PPP")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateRedemption(redemption.id, "rejected")}
                          >
                            Reject
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleUpdateRedemption(redemption.id, "approved")}
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Recent Redemptions</CardTitle>
              </CardHeader>
              <CardContent>
                {recentRedemptions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No recent redemptions
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentRedemptions.map((redemption) => (
                      <div key={redemption.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(redemption.status)}
                          <div>
                            <p className="font-medium">{redemption.prizeName}</p>
                            <p className="text-sm text-muted-foreground">
                              {redemption.pointsCost} points • {format(new Date(redemption.requestedAt), "PPP")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            redemption.status === "completed" ? "default" : 
                            redemption.status === "rejected" ? "destructive" : "secondary"
                          }>
                            {redemption.status}
                          </Badge>
                          {redemption.status === "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateRedemption(redemption.id, "completed")}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Prize Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Prize</DialogTitle>
            <DialogDescription>
              Create a new prize that {kid.name} can redeem with points.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Prize Name</Label>
              <Input
                id="name"
                value={newPrize.name}
                onChange={(e) => setNewPrize({ ...newPrize, name: e.target.value })}
                placeholder="e.g., Extra bedtime story"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newPrize.description}
                onChange={(e) => setNewPrize({ ...newPrize, description: e.target.value })}
                placeholder="Describe what this prize includes..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="points">Points Cost</Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={newPrize.pointsCost}
                onChange={(e) => setNewPrize({ ...newPrize, pointsCost: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newPrize.category}
                onValueChange={(value) => setNewPrize({ ...newPrize, category: value as Prize["category"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="privilege">Privilege</SelectItem>
                  <SelectItem value="treat">Treat</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="item">Item</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={newPrize.isActive}
                onCheckedChange={(checked) => setNewPrize({ ...newPrize, isActive: checked })}
              />
              <Label htmlFor="active">Active (available in shop)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPrize}>Add Prize</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}