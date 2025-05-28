import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface TMDBSearchResponse {
  results: {
    id: number;
    title?: string;
    name?: string;
    release_date?: string;
    first_air_date?: string;
    overview: string;
    vote_average: number;
    vote_count: number;
    media_type: string;
    poster_path?: string;
  }[];
}

interface TMDBMovieDetails {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  vote_average: number;
  vote_count: number;
  runtime: number;
  genres: { name: string }[];
  poster_path?: string;
  credits: {
    cast: { name: string }[];
    crew: { name: string; job: string }[];
  };
}

interface TMDBTVDetails {
  id: number;
  name: string;
  first_air_date: string;
  overview: string;
  vote_average: number;
  vote_count: number;
  number_of_seasons: number;
  number_of_episodes: number;
  genres: { name: string }[];
  poster_path?: string;
  created_by: { name: string }[];
  credits: {
    cast: { name: string }[];
  };
}

export const movieTool = createTool({
  id: 'search-movie',
  description: 'Search for movies and TV shows using deployed MCP server',
  inputSchema: z.object({
    query: z.string().describe('Movie or TV show name to search for'),
  }),
  outputSchema: z.object({
    title: z.string(),
    year: z.string(),
    rating: z.number(),
    overview: z.string(),
    cast: z.string(),
    poster: z.string(),
    type: z.string(),
  }),
  execute: async ({ context }) => {
    return await getMovieFromMCP(context.query);
  },
});

const getMovieFromMCP = async (query: string) => {
  try {
    // MCP server endpoint - Smithery'ye deploy edilmiş yeni MCP
    const mcpUrl = 'https://server.smithery.ai/@yusaaztrk/movie-mcp-main/mcp';
    const apiKey = 'ee8c38d9-188d-4f19-9f21-9c9589fcbaa0';

    // Call the MCP server's search_movie tool
    const response = await fetch(`${mcpUrl}?api_key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'tools/call',
        params: {
          name: 'search_movie',
          arguments: {
            query: query
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

    // Parse the movie info from MCP response
    const movieInfo = data.result?.content?.[0]?.text || data.result || '';
    return parseMovieInfo(movieInfo, query);
  } catch (error) {
    console.error('MCP call failed:', error);
    // Fallback to direct API call if MCP fails
    return await fallbackGetMovie(query);
  }
};

const parseMovieInfo = (movieInfo: string, query: string) => {
  // Parse the formatted movie string from MCP
  const titleMatch = movieInfo.match(/\*\*(.+?)\*\* \((\d{4}|\w+)\)/);
  const ratingMatch = movieInfo.match(/Rating:\*\* ([\d.]+)\/10/);
  const overviewMatch = movieInfo.match(/Overview:\*\*\s*(.+?)(?:\n\n|\*\*|$)/s);
  const castMatch = movieInfo.match(/Cast:\*\* (.+?)(?:\n\n|\*\*|$)/);
  const posterMatch = movieInfo.match(/Poster:\*\* (.+?)(?:\n|$)/);
  const typeMatch = movieInfo.match(/^(🎬|📺)/);

  return {
    title: titleMatch ? titleMatch[1] : query,
    year: titleMatch ? titleMatch[2] : 'Unknown',
    rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0,
    overview: overviewMatch ? overviewMatch[1].trim() : 'No overview available',
    cast: castMatch ? castMatch[1].trim() : 'Cast information not available',
    poster: posterMatch ? posterMatch[1].trim() : 'No poster available',
    type: typeMatch ? (typeMatch[1] === '🎬' ? 'Movie' : 'TV Show') : 'Unknown',
  };
};

const fallbackGetMovie = async (query: string) => {
  try {
    const apiKey = '8265bd1679663a7ea12ac168da84d2e8'; // TMDB public demo key

    // Search for movies and TV shows
    const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = (await searchResponse.json()) as TMDBSearchResponse;

    if (!searchData.results?.[0]) {
      throw new Error(`No results found for '${query}'`);
    }

    const result = searchData.results[0];
    const mediaType = result.media_type;

    if (mediaType === 'movie') {
      return await getMovieDetails(result.id, apiKey);
    } else if (mediaType === 'tv') {
      return await getTVDetails(result.id, apiKey);
    } else {
      // Basic info for other types
      return {
        title: result.title || result.name || 'Unknown Title',
        year: (result.release_date || result.first_air_date || '').substring(0, 4) || 'Unknown',
        rating: result.vote_average || 0,
        overview: result.overview || 'No overview available',
        cast: 'Cast information not available',
        poster: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : 'No poster available',
        type: 'Unknown',
      };
    }
  } catch (error) {
    throw new Error(`Failed to search for movie: ${error}`);
  }
};

const getMovieDetails = async (movieId: number, apiKey: string) => {
  const detailsUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=credits`;
  const response = await fetch(detailsUrl);
  const movie = (await response.json()) as TMDBMovieDetails;

  const cast = movie.credits?.cast?.slice(0, 5).map(actor => actor.name).join(', ') || 'Cast information not available';

  return {
    title: movie.title,
    year: movie.release_date?.substring(0, 4) || 'Unknown',
    rating: movie.vote_average || 0,
    overview: movie.overview || 'No overview available',
    cast: cast,
    poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'No poster available',
    type: 'Movie',
  };
};

const getTVDetails = async (tvId: number, apiKey: string) => {
  const detailsUrl = `https://api.themoviedb.org/3/tv/${tvId}?api_key=${apiKey}&append_to_response=credits`;
  const response = await fetch(detailsUrl);
  const tvShow = (await response.json()) as TMDBTVDetails;

  const cast = tvShow.credits?.cast?.slice(0, 5).map(actor => actor.name).join(', ') || 'Cast information not available';

  return {
    title: tvShow.name,
    year: tvShow.first_air_date?.substring(0, 4) || 'Unknown',
    rating: tvShow.vote_average || 0,
    overview: tvShow.overview || 'No overview available',
    cast: cast,
    poster: tvShow.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : 'No poster available',
    type: 'TV Show',
  };
};
