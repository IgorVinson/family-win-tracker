import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { EnhancedKid, Gift, GiftRedemption } from "@/types/scoreSystem";
import { format } from "date-fns";
import {
  CheckCircle,
  Clock,
  Edit,
  Plus,
  Settings,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface GiftManagementProps {
  kid: EnhancedKid;
  onAddGift: (gift: Omit<Gift, "id" | "createdAt">) => void;
  onUpdateGift: (giftId: string, updates: Partial<Gift>) => void;
  onDeleteGift: (giftId: string) => void;
  onUpdateRedemption: (
    redemptionId: string,
    status: GiftRedemption["status"],
    notes?: string
  ) => void;
}

export function GiftManagement({
  kid,
  onAddGift,
  onUpdateGift,
  onDeleteGift,
  onUpdateRedemption,
}: GiftManagementProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  // New local form state for editing
  const [editingGiftForm, setEditingGiftForm] = useState({
    name: "",
    description: "",
    pointsCost: 0,
    category: "treat" as Gift["category"],
    isActive: true,
  });
  const [newGift, setNewGift] = useState({
    name: "",
    description: "",
    pointsCost: 0,
    category: "treat" as Gift["category"],
    isActive: true,
  });
  const { toast } = useToast();

  // Sync selected editing gift into form values
  useEffect(() => {
    if (editingGift) {
      setEditingGiftForm({
        name: editingGift.name,
        description: editingGift.description,
        pointsCost: editingGift.pointsCost,
        category: editingGift.category,
        isActive: editingGift.isActive,
      });
    } else {
      setEditingGiftForm({
        name: "",
        description: "",
        pointsCost: 0,
        category: "treat",
        isActive: true,
      });
    }
  }, [editingGift]);

  const pendingRedemptions = kid.giftRedemptions.filter(
    r => r.status === "pending"
  );
  const recentRedemptions = kid.giftRedemptions
    .filter(r => r.status !== "pending")
    .sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    )
    .slice(0, 10);

  const handleAddGift = () => {
    if (!newGift.name || !newGift.description || newGift.pointsCost <= 0) {
      toast({
        title: "Invalid gift data",
        description: "Please fill in all fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    onAddGift(newGift);
    setNewGift({
      name: "",
      description: "",
      pointsCost: 0,
      category: "treat",
      isActive: true,
    });
    setShowAddDialog(false);
    toast({
      title: "Gift added",
      description: `"${newGift.name}" has been added to the gift shop.`,
    });
  };

  // Save edits to existing gift
  const handleSaveEditedGift = () => {
    if (!editingGift) return;
    if (
      !editingGiftForm.name ||
      !editingGiftForm.description ||
      editingGiftForm.pointsCost <= 0
    ) {
      toast({
        title: "Invalid gift data",
        description: "Please fill in all fields with valid values.",
        variant: "destructive",
      });
      return;
    }
    onUpdateGift(editingGift.id, {
      name: editingGiftForm.name,
      description: editingGiftForm.description,
      pointsCost: editingGiftForm.pointsCost,
      category: editingGiftForm.category,
      isActive: editingGiftForm.isActive,
    });
    toast({
      title: "Gift updated",
      description: `"${editingGiftForm.name}" has been updated.`,
    });
    setEditingGift(null);
    setEditingGiftForm({
      name: "",
      description: "",
      pointsCost: 0,
      category: "treat",
      isActive: true,
    });
  };

  const handleUpdateRedemption = (
    redemptionId: string,
    status: GiftRedemption["status"]
  ) => {
    onUpdateRedemption(redemptionId, status);
    toast({
      title: "Redemption updated",
      description: `Redemption has been ${status}.`,
    });
  };

  const getStatusIcon = (status: GiftRedemption["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Gift Management
              </CardTitle>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Gift
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="gifts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gifts">Manage Gifts</TabsTrigger>
            <TabsTrigger value="redemptions">
              Redemptions{" "}
              {pendingRedemptions.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingRedemptions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gifts" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kid.availableGifts.map(gift => (
                <Card key={gift.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{gift.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{gift.category}</Badge>
                          <Badge
                            variant={gift.isActive ? "default" : "secondary"}
                          >
                            {gift.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingGift(gift)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDeleteGift(gift.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-2">
                      {gift.description}
                    </p>
                    <p className="font-semibold">{gift.pointsCost} points</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="redemptions" className="space-y-4">
            {pendingRedemptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-yellow-600">
                    Pending Approvals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingRedemptions.map(redemption => (
                      <div
                        key={redemption.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50"
                      >
                        <div>
                          <p className="font-medium">{redemption.giftName}</p>
                          <p className="text-sm text-muted-foreground">
                            {redemption.pointsCost} points • Requested{" "}
                            {format(new Date(redemption.requestedAt), "PPP")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateRedemption(redemption.id, "rejected")
                            }
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleUpdateRedemption(redemption.id, "approved")
                            }
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
                    {recentRedemptions.map(redemption => (
                      <div
                        key={redemption.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(redemption.status)}
                          <div>
                            <p className="font-medium">{redemption.giftName}</p>
                            <p className="text-sm text-muted-foreground">
                              {redemption.pointsCost} points •{" "}
                              {format(new Date(redemption.requestedAt), "PPP")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              redemption.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                            className={
                              redemption.status === "completed"
                                ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                                : ""
                            }
                          >
                            {redemption.status}
                          </Badge>
                          {redemption.status === "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleUpdateRedemption(
                                  redemption.id,
                                  "completed"
                                )
                              }
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

      {/* Add Gift Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Gift</DialogTitle>
            <DialogDescription>
              Create a new gift that {kid.name} can redeem with points.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Gift Name</Label>
              <Input
                id="name"
                value={newGift.name}
                onChange={e => setNewGift({ ...newGift, name: e.target.value })}
                placeholder="e.g., Extra bedtime story"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newGift.description}
                onChange={e =>
                  setNewGift({ ...newGift, description: e.target.value })
                }
                placeholder="Describe what this gift includes..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="points">Points Cost</Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={newGift.pointsCost}
                onChange={e =>
                  setNewGift({
                    ...newGift,
                    pointsCost: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newGift.category}
                onValueChange={value =>
                  setNewGift({
                    ...newGift,
                    category: value as Gift["category"],
                  })
                }
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
                checked={newGift.isActive}
                onCheckedChange={checked =>
                  setNewGift({ ...newGift, isActive: checked })
                }
              />
              <Label htmlFor="active">Active (available in shop)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGift}>Add Gift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Gift Dialog */}
      <Dialog
        open={!!editingGift}
        onOpenChange={open => {
          if (!open) {
            setEditingGift(null);
            setEditingGiftForm({
              name: "",
              description: "",
              pointsCost: 0,
              category: "treat",
              isActive: true,
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Gift</DialogTitle>
            <DialogDescription>Update the gift details.</DialogDescription>
          </DialogHeader>
          {editingGift && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Gift Name</Label>
                <Input
                  id="edit-name"
                  value={editingGiftForm.name}
                  onChange={e =>
                    setEditingGiftForm({
                      ...editingGiftForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g., Extra bedtime story"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingGiftForm.description}
                  onChange={e =>
                    setEditingGiftForm({
                      ...editingGiftForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe what this gift includes..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-points">Points Cost</Label>
                <Input
                  id="edit-points"
                  type="number"
                  min="1"
                  value={editingGiftForm.pointsCost}
                  onChange={e =>
                    setEditingGiftForm({
                      ...editingGiftForm,
                      pointsCost: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editingGiftForm.category}
                  onValueChange={value =>
                    setEditingGiftForm({
                      ...editingGiftForm,
                      category: value as Gift["category"],
                    })
                  }
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
                  id="edit-active"
                  checked={editingGiftForm.isActive}
                  onCheckedChange={checked =>
                    setEditingGiftForm({
                      ...editingGiftForm,
                      isActive: checked,
                    })
                  }
                />
                <Label htmlFor="edit-active">Active (available in shop)</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingGift(null);
                setEditingGiftForm({
                  name: "",
                  description: "",
                  pointsCost: 0,
                  category: "treat",
                  isActive: true,
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEditedGift}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
