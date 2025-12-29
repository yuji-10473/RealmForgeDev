"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { generateStoryElements, type GenerateStoryElementsInput } from "@/ai/flows/generate-story-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function StoryElementsForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<GenerateStoryElementsInput>();

  const onSubmit: SubmitHandler<GenerateStoryElementsInput> = async (data) => {
    setLoading(true);
    setResult(null);
    try {
      const response = await generateStoryElements(data);
      setResult(response.storyElements);
    } catch (error) {
      console.error(error);
      setResult("An error occurred while generating story elements.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="prompt" className="font-bold">Story Prompt</Label>
          <Textarea
            id="prompt"
            {...register("prompt", { required: true })}
            placeholder="e.g., A kingdom shrouded in magical fog, a lost artifact that can control time, and a prophecy about a hero from another world."
            rows={4}
            className="mt-2"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Elements
        </Button>
      </form>

      {result && (
        <Card className="bg-secondary">
          <CardHeader>
            <CardTitle>Generated Story Elements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{result}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
