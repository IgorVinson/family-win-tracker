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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  EnhancedKid,
  GiftRedemption,
  Gift as GiftType,
} from "@/types/scoreSystem";
import { format } from "date-fns";
import { CheckCircle, Clock, Gift, Star, XCircle } from "lucide-react";
import { useState } from "react";

interface GiftShopProps {
  kid: EnhancedKid;
  onRedeemGift: (giftId: string) => void;
}

export function GiftShop({ kid, onRedeemGift }: GiftShopProps) {
  const [selectedGift, setSelectedGift] = useState<GiftType | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

  // Show ALL gifts (including inactive) so shop isn't empty; mark inactive ones
  const categorizedGifts = {
    privilege: kid.availableGifts.filter(g => g.category === "privilege"),
    treat: kid.availableGifts.filter(g => g.category === "treat"),
    activity: kid.availableGifts.filter(g => g.category === "activity"),
    item: kid.availableGifts.filter(g => g.category === "item"),
  };

  const pendingRedemptions = kid.giftRedemptions.filter(
    r => r.status === "pending"
  );
  const recentRedemptions = kid.giftRedemptions
    .filter(r => r.status !== "pending")
    .sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    )
    .slice(0, 5);

  const handleRedeemClick = (gift: GiftType) => {
    if (kid.points < gift.pointsCost) {
      toast({
        title: "Not enough points",
        description: `You need ${
          gift.pointsCost - kid.points
        } more points to redeem this gift.`,
        variant: "destructive",
      });
      return;
    }
    setSelectedGift(gift);
    setShowConfirmDialog(true);
  };

  const confirmRedemption = () => {
    if (selectedGift) {
      onRedeemGift(selectedGift.id);
      toast({
        title: "Gift requested!",
        description: `Your request for "${selectedGift.name}" has been sent for approval.`,
      });
    }
    setShowConfirmDialog(false);
    setSelectedGift(null);
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

  const giftGridCls = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";

  const renderGiftGrid = (gifts: GiftType[], category: string) => (
    <div className={giftGridCls}>
      {gifts.length === 0 ? (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          No {category} gifts available right now
        </div>
      ) : (
        gifts.map(gift => {
          const canRedeem = kid.points >= gift.pointsCost && gift.isActive;
          return (
            <Card key={gift.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex flex-col gap-1">
                    <span>{gift.name}</span>
                    {!gift.isActive && (
                      <span className="text-xs font-normal text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={
                        kid.points >= gift.pointsCost ? "default" : "secondary"
                      }
                      className="flex items-center"
                    >
                      {gift.pointsCost} <Star className="h-3 w-3 ml-1" />
                    </Badge>
                    {!gift.isActive && (
                      <Badge variant="outline" className="text-xs">
                        Hidden
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 line-clamp-4">
                  {gift.description}
                </p>
                <Button
                  onClick={() => handleRedeemClick(gift)}
                  disabled={!canRedeem}
                  className="w-full"
                  variant={canRedeem ? "default" : "outline"}
                >
                  {gift.isActive
                    ? kid.points >= gift.pointsCost
                      ? "Redeem"
                      : "Not enough points"
                    : "Not available"}
                </Button>
                {!gift.isActive && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    This gift is currently inactive. Ask a parent to activate
                    it.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Current Points */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                <span className="text-2xl font-semibold">Gift Shop</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold flex items-center gap-2">
                    {kid.points} <Star className="h-6 w-6" />
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Available points
                  </p>
                </div>
                {pendingRedemptions.length > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {pendingRedemptions.length} pending
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <Tabs defaultValue="privileges" className="w-full bg-card ">
            <TabsList className="grid w-full grid-cols-4 bg-transparent border mb-6">
              <TabsTrigger
                value="privileges"
                className="flex items-center gap-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors data-[state=active]:bg-orange-100 data-[state=active]:text-orange-600 data-[state=active]:border-orange-300"
              >
                <Gift className="h-4 w-4" />
                Privileges
              </TabsTrigger>
              <TabsTrigger
                value="treats"
                className="flex items-center gap-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors data-[state=active]:bg-orange-100 data-[state=active]:text-orange-600 data-[state=active]:border-orange-300"
              >
                <Star className="h-4 w-4" />
                Treats
              </TabsTrigger>
              <TabsTrigger
                value="activities"
                className="flex items-center gap-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors data-[state=active]:bg-orange-100 data-[state=active]:text-orange-600 data-[state=active]:border-orange-300"
              >
                <Clock className="h-4 w-4" />
                Activities
              </TabsTrigger>
              <TabsTrigger
                value="items"
                className="flex items-center gap-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors data-[state=active]:bg-orange-100 data-[state=active]:text-orange-600 data-[state=active]:border-orange-300"
              >
                <CheckCircle className="h-4 w-4" />
                Items
              </TabsTrigger>
            </TabsList>

            <TabsContent value="privileges">
              {renderGiftGrid(categorizedGifts.privilege, "privilege")}
            </TabsContent>

            <TabsContent value="treats">
              {renderGiftGrid(categorizedGifts.treat, "treat")}
            </TabsContent>

            <TabsContent value="activities">
              {renderGiftGrid(categorizedGifts.activity, "activity")}
            </TabsContent>

            <TabsContent value="items">
              {renderGiftGrid(categorizedGifts.item, "item")}
            </TabsContent>
          </Tabs>
        </Card>

        {/* Redemption History */}
        {(pendingRedemptions.length > 0 || recentRedemptions.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Redemption History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingRedemptions.map(redemption => (
                  <div
                    key={redemption.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(redemption.status)}
                      <div>
                        <p className="font-medium">{redemption.giftName}</p>
                        <p className="text-sm text-muted-foreground">
                          Requested{" "}
                          {format(new Date(redemption.requestedAt), "PPP")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                ))}

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
                          {format(new Date(redemption.requestedAt), "PPP")}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        redemption.status === "completed"
                          ? "default"
                          : redemption.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {redemption.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Gift</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem "{selectedGift?.name}" for{" "}
              {selectedGift?.pointsCost} points?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmRedemption}>Yes, Redeem Gift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
