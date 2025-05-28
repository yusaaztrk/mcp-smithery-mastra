import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const dictionaryTool = createTool({
  id: 'get-definition',
  description: 'Get definitions, meanings, and examples for a word using deployed MCP server',
  inputSchema: z.object({
    word: z.string().describe('The word to look up'),
  }),
  outputSchema: z.object({
    definitions: z.string(),
  }),
  execute: async ({ context }) => {
    return await getDefinitionsFromMCP(context.word);
  },
});

const getDefinitionsFromMCP = async (word: string) => {
  try {
    // MCP server endpoint
    const mcpUrl = 'https://server.smithery.ai/@yusaaztrk/dictionary-mcp-main-for-mobile-app/mcp';
    const apiKey = 'ee8c38d9-188d-4f19-9f21-9c9589fcbaa0';

    // Call the MCP server's get_definitions tool
    const response = await fetch(`${mcpUrl}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        method: 'tools/call',
        params: {
          name: 'get_definitions',
          arguments: {
            word: word
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`MCP server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`MCP error: ${data.error.message || 'Unknown error'}`);
    }

    return {
      definitions: data.result?.content?.[0]?.text || data.result || `No definitions found for '${word}'`
    };
  } catch (error) {
    console.error('MCP call failed:', error);
    // Fallback to direct API call if MCP fails
    return await fallbackGetDefinitions(word);
  }
};

const fallbackGetDefinitions = async (word: string) => {
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Word '${word}' not found in dictionary`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error(`No definitions found for '${word}'`);
    }

    const entry = data[0];
    let definitions = '';

    // Extract definitions from all meanings
    for (const meaning of entry.meanings) {
      definitions += `\n**${meaning.partOfSpeech}:**\n`;
      for (const def of meaning.definitions) {
        definitions += `- ${def.definition}\n`;
        if (def.example) {
          definitions += `  Example: "${def.example}"\n`;
        }
      }
    }

    return {
      definitions: `**${entry.word}** ${entry.phonetic ? `(${entry.phonetic})` : ''}\n${definitions}`
    };
  } catch (error) {
    throw new Error(`Failed to get definitions for '${word}': ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
