import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, TrendingUp, Calendar, Award } from "lucide-react";
import { EnhancedKid } from "@/types/scoreSystem";
import { format, subDays } from "date-fns";

interface ScoreDashboardProps {
  kid: EnhancedKid;
}

export function ScoreDashboard({ kid }: ScoreDashboardProps) {
  const recentEntries = kid.scoreHistory
    .filter(entry => new Date(entry.createdAt) >= subDays(new Date(), 7))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const topStreaks = Object.entries(kid.streaks)
    .map(([metricId, days]) => ({
      metric: kid.metrics?.find(m => m.id === metricId),
      days
    }))
    .filter(s => s.metric && s.days > 0)
    .sort((a, b) => b.days - a.days)
    .slice(0, 3);

  const recentAchievements = kid.achievements
    .sort((a, b) => new Date(b.unlockedAt || 0).getTime() - new Date(a.unlockedAt || 0).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Points</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kid.points}</div>
            <Progress value={(kid.points / kid.goal) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {kid.goal - kid.points} points to goal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kid.totalPointsEarned}</div>
            <p className="text-xs text-muted-foreground">Lifetime points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kid.achievements.length}</div>
            <p className="text-xs text-muted-foreground">Unlocked badges</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent">Recent Points</TabsTrigger>
          <TabsTrigger value="streaks">Streaks</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Last 7 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentEntries.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No points earned in the last 7 days
                </p>
              ) : (
                <div className="space-y-3">
                  {recentEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{entry.metricName}</p>
                        <p className="text-sm text-muted-foreground">{entry.reason}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(entry.date), "PPP")}</p>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        +{entry.points}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streaks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Current Streaks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topStreaks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No active streaks. Start completing daily goals to build streaks!
                </p>
              ) : (
                <div className="space-y-3">
                  {topStreaks.map(({ metric, days }) => (
                    <div key={metric!.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{metric!.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {days} consecutive days
                        </p>
                      </div>
                      <Badge variant={days >= 7 ? "default" : "secondary"}>
                        {days} 🔥
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentAchievements.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No achievements yet. Keep working on your goals!
                </p>
              ) : (
                <div className="space-y-3">
                  {recentAchievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">🏆</div>
                        <div>
                          <p className="font-medium">{achievement.name}</p>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          {achievement.unlockedAt && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(achievement.unlockedAt), "PPP")}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="default">
                        +{achievement.pointsReward}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}