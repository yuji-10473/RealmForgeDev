"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { generateCharacterBackstories, type GenerateCharacterBackstoriesInput } from "@/ai/flows/generate-character-backstories";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function CharacterBackstoryForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<GenerateCharacterBackstoriesInput>();

  const onSubmit: SubmitHandler<GenerateCharacterBackstoriesInput> = async (data) => {
    setLoading(true);
    setResult(null);
    try {
      const response = await generateCharacterBackstories(data);
      setResult(response.backstory);
    } catch (error) {
      console.error(error);
      setResult("An error occurred while generating the backstory.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="characterDescription" className="font-bold">Character Description</Label>
          <Textarea
            id="characterDescription"
            {...register("characterDescription", { required: true })}
            placeholder="e.g., A stoic elven ranger named Lyra, exiled from her forest home for practicing forbidden magic. She carries an old, gnarled bow."
            rows={4}
            className="mt-2"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Backstory
        </Button>
      </form>

      {result && (
        <Card className="bg-secondary">
          <CardHeader>
            <CardTitle>Generated Backstory</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{result}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
