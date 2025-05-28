import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface GeocodingResponse {
  results: {
    latitude: number;
    longitude: number;
    name: string;
  }[];
}

interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    weather_code: number;
  };
}

export const weatherTool = createTool({
  id: 'get-weather',
  description: 'Get current weather for a location using deployed MCP server',
  inputSchema: z.object({
    location: z.string().describe('City name'),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    feelsLike: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windGust: z.number(),
    conditions: z.string(),
    location: z.string(),
  }),
  execute: async ({ context }) => {
    return await getWeatherFromMCP(context.location);
  },
});

const getWeatherFromMCP = async (location: string) => {
  try {
    // MCP server endpoint - Bu URL'yi Smithery'ye deploy ettikten sonra güncelleyeceğiz
    const mcpUrl = 'https://server.smithery.ai/@yusaaztrk/weather-mcp-main-for-mobile-app/mcp';
    const apiKey = 'ee8c38d9-188d-4f19-9f21-9c9589fcbaa0'; // Aynı API key'i kullanıyoruz

    // Call the MCP server's get_weather tool
    const response = await fetch(`${mcpUrl}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        method: 'tools/call',
        params: {
          name: 'get_weather',
          arguments: {
            location: location
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

    // Parse the weather info from MCP response
    const weatherInfo = data.result?.content?.[0]?.text || data.result || '';
    return parseWeatherInfo(weatherInfo, location);
  } catch (error) {
    console.error('MCP call failed:', error);
    // Fallback to direct API call if MCP fails
    return await fallbackGetWeather(location);
  }
};

const parseWeatherInfo = (weatherInfo: string, location: string) => {
  // Parse the formatted weather string from MCP
  const lines = weatherInfo.split('\n');

  // Extract values using regex
  const tempMatch = weatherInfo.match(/Temperature: ([\d.-]+)°C/);
  const feelsLikeMatch = weatherInfo.match(/Feels like: ([\d.-]+)°C/);
  const humidityMatch = weatherInfo.match(/Humidity: ([\d.-]+)%/);
  const windSpeedMatch = weatherInfo.match(/Wind speed: ([\d.-]+) km\/h/);
  const windGustMatch = weatherInfo.match(/Wind gusts: ([\d.-]+) km\/h/);
  const conditionsMatch = weatherInfo.match(/Conditions: (.+)/);
  const locationMatch = weatherInfo.match(/Weather for (.+):/);

  return {
    temperature: tempMatch ? parseFloat(tempMatch[1]) : 0,
    feelsLike: feelsLikeMatch ? parseFloat(feelsLikeMatch[1]) : 0,
    humidity: humidityMatch ? parseFloat(humidityMatch[1]) : 0,
    windSpeed: windSpeedMatch ? parseFloat(windSpeedMatch[1]) : 0,
    windGust: windGustMatch ? parseFloat(windGustMatch[1]) : 0,
    conditions: conditionsMatch ? conditionsMatch[1].trim() : 'Unknown',
    location: locationMatch ? locationMatch[1].trim() : location,
  };
};

const fallbackGetWeather = async (location: string) => {
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const geocodingResponse = await fetch(geocodingUrl);
  const geocodingData = (await geocodingResponse.json()) as GeocodingResponse;

  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }

  const { latitude, longitude, name } = geocodingData.results[0];

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;

  const response = await fetch(weatherUrl);
  const data = (await response.json()) as WeatherResponse;

  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition(data.current.weather_code),
    location: name,
  };
};

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return conditions[code] || 'Unknown';
}
