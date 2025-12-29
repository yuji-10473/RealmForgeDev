'use server';

/**
 * @fileOverview A story element generation AI agent.
 *
 * - generateStoryElements - A function that handles the story element generation process.
 * - GenerateStoryElementsInput - The input type for the generateStoryElements function.
 * - GenerateStoryElementsOutput - The return type for the generateStoryElements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStoryElementsInputSchema = z.object({
  prompt: z.string().describe('A high-level prompt describing the desired story elements.'),
});
export type GenerateStoryElementsInput = z.infer<typeof GenerateStoryElementsInputSchema>;

const GenerateStoryElementsOutputSchema = z.object({
  storyElements: z.string().describe('The generated story elements based on the provided prompt.'),
});
export type GenerateStoryElementsOutput = z.infer<typeof GenerateStoryElementsOutputSchema>;

export async function generateStoryElements(input: GenerateStoryElementsInput): Promise<GenerateStoryElementsOutput> {
  return generateStoryElementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStoryElementsPrompt',
  input: {schema: GenerateStoryElementsInputSchema},
  output: {schema: GenerateStoryElementsOutputSchema},
  prompt: `You are a creative story writer for RPG games. Generate compelling story elements based on the following prompt:\n\nPrompt: {{{prompt}}}`,
});

const generateStoryElementsFlow = ai.defineFlow(
  {
    name: 'generateStoryElementsFlow',
    inputSchema: GenerateStoryElementsInputSchema,
    outputSchema: GenerateStoryElementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
