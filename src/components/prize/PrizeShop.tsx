import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Gift, Star, Clock, CheckCircle, XCircle } from "lucide-react";
import { EnhancedKid, Prize, PrizeRedemption } from "@/types/scoreSystem";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PrizeShopProps {
  kid: EnhancedKid;
  onRedeemPrize: (prizeId: string) => void;
}

export function PrizeShop({ kid, onRedeemPrize }: PrizeShopProps) {
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

  const activePrizes = kid.availablePrizes.filter(p => p.isActive);
  const categorizedPrizes = {
    privilege: activePrizes.filter(p => p.category === "privilege"),
    treat: activePrizes.filter(p => p.category === "treat"),
    activity: activePrizes.filter(p => p.category === "activity"),
    item: activePrizes.filter(p => p.category === "item"),
  };

  const pendingRedemptions = kid.prizeRedemptions.filter(r => r.status === "pending");
  const recentRedemptions = kid.prizeRedemptions
    .filter(r => r.status !== "pending")
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
    .slice(0, 5);

  const handleRedeemClick = (prize: Prize) => {
    if (kid.points < prize.pointsCost) {
      toast({
        title: "Not enough points",
        description: `You need ${prize.pointsCost - kid.points} more points to redeem this prize.`,
        variant: "destructive",
      });
      return;
    }
    setSelectedPrize(prize);
    setShowConfirmDialog(true);
  };

  const confirmRedemption = () => {
    if (selectedPrize) {
      onRedeemPrize(selectedPrize.id);
      toast({
        title: "Prize requested!",
        description: `Your request for "${selectedPrize.name}" has been sent for approval.`,
      });
    }
    setShowConfirmDialog(false);
    setSelectedPrize(null);
  };

  const getStatusIcon = (status: PrizeRedemption["status"]) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "approved": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected": return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const renderPrizeGrid = (prizes: Prize[], category: string) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {prizes.length === 0 ? (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          No {category} prizes available right now
        </div>
      ) : (
        prizes.map((prize) => (
          <Card key={prize.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{prize.name}</CardTitle>
                <Badge variant={kid.points >= prize.pointsCost ? "default" : "secondary"}>
                  {prize.pointsCost} <Star className="h-3 w-3 ml-1" />
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{prize.description}</p>
              <Button 
                onClick={() => handleRedeemClick(prize)}
                disabled={kid.points < prize.pointsCost}
                className="w-full"
                variant={kid.points >= prize.pointsCost ? "default" : "outline"}
              >
                {kid.points >= prize.pointsCost ? "Redeem" : "Not enough points"}
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Current Points */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Prize Shop
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold flex items-center gap-2">
                  {kid.points} <Star className="h-6 w-6" />
                </p>
                <p className="text-muted-foreground">Available points</p>
              </div>
              {pendingRedemptions.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {pendingRedemptions.length} pending
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="privileges" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="privileges">Privileges</TabsTrigger>
            <TabsTrigger value="treats">Treats</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
          </TabsList>

          <TabsContent value="privileges">
            {renderPrizeGrid(categorizedPrizes.privilege, "privilege")}
          </TabsContent>

          <TabsContent value="treats">
            {renderPrizeGrid(categorizedPrizes.treat, "treat")}
          </TabsContent>

          <TabsContent value="activities">
            {renderPrizeGrid(categorizedPrizes.activity, "activity")}
          </TabsContent>

          <TabsContent value="items">
            {renderPrizeGrid(categorizedPrizes.item, "item")}
          </TabsContent>
        </Tabs>

        {/* Redemption History */}
        {(pendingRedemptions.length > 0 || recentRedemptions.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Redemption History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingRedemptions.map((redemption) => (
                  <div key={redemption.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(redemption.status)}
                      <div>
                        <p className="font-medium">{redemption.prizeName}</p>
                        <p className="text-sm text-muted-foreground">
                          Requested {format(new Date(redemption.requestedAt), "PPP")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                ))}
                
                {recentRedemptions.map((redemption) => (
                  <div key={redemption.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(redemption.status)}
                      <div>
                        <p className="font-medium">{redemption.prizeName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(redemption.requestedAt), "PPP")}
                        </p>
                      </div>
                    </div>
                    <Badge variant={redemption.status === "completed" ? "default" : redemption.status === "rejected" ? "destructive" : "secondary"}>
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
            <DialogTitle>Redeem Prize</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem "{selectedPrize?.name}" for {selectedPrize?.pointsCost} points?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRedemption}>
              Yes, Redeem Prize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}