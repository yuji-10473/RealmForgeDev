import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Move, PlayCircle } from "lucide-react";

export default function EventEditorPage() {
  const events = [
    { id: "evt_start", name: "Game Start" },
    { id: "evt_talk_npc1", name: "Talk to Old Man" },
    { id: "evt_enter_castle", name: "Enter Shadow Castle" },
  ];

  const actions = [
    { icon: MessageSquare, title: "Show Dialogue", description: "'Welcome, traveler! The journey ahead is perilous.'" },
    { icon: Move, title: "Move Character", description: "Player moves to coordinates (12, 34)." },
    { icon: PlayCircle, title: "Play Cutscene", description: "cutscene_intro.mp4" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">Event Editor</h1>
        <p className="text-muted-foreground">Craft the story and interactions of your world.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 h-[calc(100vh-12rem)]">
        <Card className="md:col-span-1 lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>Select an event to edit its actions.</CardDescription>
          </CardHeader>
          <ScrollArea className="flex-grow">
            <CardContent className="p-2">
              <div className="flex flex-col gap-2">
                {events.map((event, index) => (
                  <Button
                    key={event.id}
                    variant={index === 1 ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    {event.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </ScrollArea>
          <CardFooter className="p-2 border-t">
             <Button variant="outline" className="w-full">New Event</Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle>Actions for: Talk to Old Man</CardTitle>
            <CardDescription>These actions will run when the event is triggered.</CardDescription>
          </CardHeader>
          <ScrollArea className="flex-grow">
            <CardContent className="space-y-4">
              {actions.map((action, index) => (
                <Card key={index} className="shadow-sm">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                    <action.icon className="w-6 h-6 text-accent" />
                    <div className="flex-grow">
                      <CardTitle className="text-base">{action.title}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </CardHeader>
                </Card>
              ))}
            </CardContent>
          </ScrollArea>
           <CardFooter className="p-2 border-t">
             <Button variant="outline" className="w-full">Add Action</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
