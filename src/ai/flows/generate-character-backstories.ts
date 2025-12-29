'use server';
/**
 * @fileOverview Character backstory generation AI agent.
 *
 * - generateCharacterBackstories - A function that handles the character backstory generation process.
 * - GenerateCharacterBackstoriesInput - The input type for the generateCharacterBackstories function.
 * - GenerateCharacterBackstoriesOutput - The return type for the generateCharacterBackstories function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCharacterBackstoriesInputSchema = z.object({
  characterDescription: z
    .string()
    .describe('A description of the character, including their name, race, class, and any other relevant information.'),
});
export type GenerateCharacterBackstoriesInput = z.infer<
  typeof GenerateCharacterBackstoriesInputSchema
>;

const GenerateCharacterBackstoriesOutputSchema = z.object({
  backstory: z
    .string()
    .describe('A detailed backstory for the character, including their origins, motivations, and relationships.'),
});
export type GenerateCharacterBackstoriesOutput = z.infer<
  typeof GenerateCharacterBackstoriesOutputSchema
>;

export async function generateCharacterBackstories(
  input: GenerateCharacterBackstoriesInput
): Promise<GenerateCharacterBackstoriesOutput> {
  return generateCharacterBackstoriesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCharacterBackstoriesPrompt',
  input: {schema: GenerateCharacterBackstoriesInputSchema},
  output: {schema: GenerateCharacterBackstoriesOutputSchema},
  prompt: `You are a fantasy writer specializing in creating compelling character backstories.

  Given the following character description, generate a detailed and engaging backstory.

  Character Description: {{{characterDescription}}}`,
});

const generateCharacterBackstoriesFlow = ai.defineFlow(
  {
    name: 'generateCharacterBackstoriesFlow',
    inputSchema: GenerateCharacterBackstoriesInputSchema,
    outputSchema: GenerateCharacterBackstoriesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
