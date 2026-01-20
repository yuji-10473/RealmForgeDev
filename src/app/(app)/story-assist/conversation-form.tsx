"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { generateConversation, type GenerateConversationInput } from "@/ai/flows/generate-conversation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export function ConversationForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<GenerateConversationInput>();

  const onSubmit: SubmitHandler<GenerateConversationInput> = async (data) => {
    setLoading(true);
    setResult(null);
    try {
      const response = await generateConversation(data);
      setResult(response.conversation);
    } catch (error) {
      console.error(error);
      setResult("会話の生成中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="characterDescription" className="font-bold">キャラクターの説明</Label>
            <Textarea
              id="characterDescription"
              {...register("characterDescription", { required: true })}
              placeholder="例：不機嫌なドワーフの鍛冶屋"
              rows={4}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="scenarioDescription" className="font-bold">シナリオの説明</Label>
            <Textarea
              id="scenarioDescription"
              {...register("scenarioDescription", { required: true })}
              placeholder="例：客が伝説の起源を持つ壊れた剣を持ってきた。"
              rows={4}
              className="mt-2"
            />
          </div>
        </div>
        <div>
           <Label htmlFor="dialogueStyle" className="font-bold">会話のスタイル</Label>
           <Input id="dialogueStyle" {...register("dialogueStyle")} placeholder="例：無愛想、ユーモラス、フォーマル" className="mt-2" />
        </div>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          会話を生成
        </Button>
      </form>

      {result && (
        <Card className="bg-secondary">
          <CardHeader>
            <CardTitle>生成された会話</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{result}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
