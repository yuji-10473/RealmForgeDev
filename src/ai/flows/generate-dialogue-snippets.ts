'use server';

/**
 * @fileOverview A dialogue snippet generation AI agent.
 *
 * - generateDialogueSnippets - A function that generates dialogue snippets.
 * - GenerateDialogueSnippetsInput - The input type for the generateDialogueSnippets function.
 * - GenerateDialogueSnippetsOutput - The return type for the generateDialogueSnippets function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDialogueSnippetsInputSchema = z.object({
  characterDescription: z
    .string()
    .describe('Description of the character for whom the dialogue is being generated.'),
  scenarioDescription: z.string().describe('Description of the scenario for the dialogue.'),
  dialogueStyle: z
    .string()
    .describe('The desired style of the dialogue (e.g., formal, informal, humorous).'),
  numberOfSnippets: z
    .number()
    .describe('The number of dialogue snippets to generate.')
    .default(3),
});

export type GenerateDialogueSnippetsInput = z.infer<typeof GenerateDialogueSnippetsInputSchema>;

const GenerateDialogueSnippetsOutputSchema = z.object({
  dialogueSnippets: z.array(z.string()).describe('An array of generated dialogue snippets.'),
});

export type GenerateDialogueSnippetsOutput = z.infer<typeof GenerateDialogueSnippetsOutputSchema>;

export async function generateDialogueSnippets(
  input: GenerateDialogueSnippetsInput
): Promise<GenerateDialogueSnippetsOutput> {
  return generateDialogueSnippetsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDialogueSnippetsPrompt',
  input: {schema: GenerateDialogueSnippetsInputSchema},
  output: {schema: GenerateDialogueSnippetsOutputSchema},
  prompt: `You are a professional game writer, specializing in generating character dialogue.

Given the character description, scenario, and desired dialogue style, generate a list of dialogue snippets.

Character Description: {{{characterDescription}}}
Scenario Description: {{{scenarioDescription}}}
Dialogue Style: {{{dialogueStyle}}}
Number of Snippets: {{{numberOfSnippets}}}

Dialogue Snippets (in JSON array format):
`, // Ensure output is in JSON array format
});

const generateDialogueSnippetsFlow = ai.defineFlow(
  {
    name: 'generateDialogueSnippetsFlow',
    inputSchema: GenerateDialogueSnippetsInputSchema,
    outputSchema: GenerateDialogueSnippetsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
