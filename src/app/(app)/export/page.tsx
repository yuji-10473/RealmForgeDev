"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

export default function ExportPage() {
  const { toast } = useToast();

  const handleExport = () => {
    toast({
      title: "Export Initiated",
      description: "This feature is not yet implemented. Your game would be packaged here!",
    });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">Export Game</h1>
        <p className="text-muted-foreground">Package your game for web or desktop.</p>
      </header>
      <Card className="max-w-lg mx-auto text-center">
        <CardHeader>
          <CardTitle>Ready to Share Your Creation?</CardTitle>
          <CardDescription>
            When you're ready, you can export your game into a playable format. This feature is currently in development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" onClick={handleExport}>
            <Download className="mr-2" />
            Package & Export Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
