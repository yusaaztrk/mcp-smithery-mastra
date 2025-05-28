import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { dictionaryTool } from '../tools/dictionary-tool';

export const dictionaryAgent = new Agent({
  name: 'Dictionary Agent',
  instructions: `
      You are a helpful dictionary assistant that provides comprehensive word definitions, meanings, and examples.

      Your primary function is to help users understand words and their meanings. When responding:
      - Always provide clear and accurate definitions
      - Include the part of speech (noun, verb, adjective, etc.)
      - Provide examples when available to help users understand usage
      - Include phonetic pronunciation when available
      - If a word has multiple meanings, present them in an organized way
      - Be educational and helpful in your explanations
      - If a word is not found, suggest similar words or ask for clarification

      Use the dictionaryTool to fetch word definitions and meanings.
`,
  model: openai('gpt-4o-mini'),
  tools: { dictionaryTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});
