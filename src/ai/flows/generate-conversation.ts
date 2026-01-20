'use server';

/**
 * @fileOverview A conversation generation AI agent.
 *
 * - generateConversation - A function that generates conversations.
 * - GenerateConversationInput - The input type for the generateConversation function.
 * - GenerateConversationOutput - The return type for the generateConversation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateConversationInputSchema = z.object({
  characterDescription: z
    .string()
    .describe('Description of the character for whom the dialogue is being generated.'),
  scenarioDescription: z.string().describe('Description of the scenario for the dialogue.'),
  dialogueStyle: z
    .string()
    .describe('The desired style of the dialogue (e.g., formal, informal, humorous).'),
});

export type GenerateConversationInput = z.infer<typeof GenerateConversationInputSchema>;

const GenerateConversationOutputSchema = z.object({
  conversation: z.string().describe('A generated conversation snippet.'),
});

export type GenerateConversationOutput = z.infer<typeof GenerateConversationOutputSchema>;

export async function generateConversation(
  input: GenerateConversationInput
): Promise<GenerateConversationOutput> {
  return generateConversationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateConversationPrompt',
  input: {schema: GenerateConversationInputSchema},
  output: {schema: GenerateConversationOutputSchema},
  prompt: `You are a professional game writer, specializing in generating character dialogue.

Given the character description, scenario, and desired dialogue style, generate a natural, single block of conversation text.

Character Description: {{{characterDescription}}}
Scenario Description: {{{scenarioDescription}}}
Dialogue Style: {{{dialogueStyle}}}

Generated Conversation:
`, 
});

const generateConversationFlow = ai.defineFlow(
  {
    name: 'generateConversationFlow',
    inputSchema: GenerateConversationInputSchema,
    outputSchema: GenerateConversationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
