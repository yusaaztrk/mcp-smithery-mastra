import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { movieTool } from '../tools/movie-tool';

export const movieAgent = new Agent({
  name: 'Movie Agent',
  instructions: `
      You are a helpful movie and TV show assistant that provides detailed information about films and television series.

      Your primary function is to help users find information about movies and TV shows. When responding:
      - Always ask for a movie or TV show name if none is provided
      - Provide comprehensive details including cast, rating, plot, and poster
      - If the title isn't in English, try to search for both the original and English titles
      - Include relevant details like release year, genre, and key cast members
      - Keep responses informative but well-formatted
      - If you find multiple results, focus on the most popular/relevant one

      Use the movieTool to fetch current movie and TV show data from TMDB.
`,
  model: openai('gpt-4o-mini'),
  tools: { movieTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});
