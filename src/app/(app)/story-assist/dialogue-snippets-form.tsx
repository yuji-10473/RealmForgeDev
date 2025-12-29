"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { generateDialogueSnippets, type GenerateDialogueSnippetsInput } from "@/ai/flows/generate-dialogue-snippets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type FormValues = Omit<GenerateDialogueSnippetsInput, "numberOfSnippets"> & { numberOfSnippets: string };

export function DialogueSnippetsForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string[] | null>(null);
  const { register, handleSubmit, setValue } = useForm<FormValues>();

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setLoading(true);
    setResult(null);
    try {
      const input = {
        ...data,
        numberOfSnippets: parseInt(data.numberOfSnippets, 10) || 3,
      };
      const response = await generateDialogueSnippets(input);
      setResult(response.dialogueSnippets);
    } catch (error) {
      console.error(error);
      setResult(["An error occurred while generating dialogue."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="characterDescription" className="font-bold">Character Description</Label>
            <Textarea
              id="characterDescription"
              {...register("characterDescription", { required: true })}
              placeholder="e.g., Grumpy dwarf blacksmith"
              rows={3}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="scenarioDescription" className="font-bold">Scenario Description</Label>
            <Textarea
              id="scenarioDescription"
              {...register("scenarioDescription", { required: true })}
              placeholder="e.g., A customer brings in a broken sword of legendary origin."
              rows={3}
              className="mt-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
             <Label htmlFor="dialogueStyle" className="font-bold">Dialogue Style</Label>
             <Input id="dialogueStyle" {...register("dialogueStyle")} placeholder="e.g., Gruff, humorous, formal" className="mt-2" />
          </div>
          <div>
            <Label htmlFor="numberOfSnippets" className="font-bold">Number of Snippets</Label>
            <Input id="numberOfSnippets" type="number" {...register("numberOfSnippets")} defaultValue="3" className="mt-2" />
          </div>
        </div>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Dialogue
        </Button>
      </form>

      {result && (
        <Card className="bg-secondary">
          <CardHeader>
            <CardTitle>Generated Dialogue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.map((snippet, index) => (
              <p key={index} className="border-l-4 border-accent pl-4 italic">"{snippet}"</p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
