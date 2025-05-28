import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const carPriceTool = createTool({
  id: 'search-car-price',
  description: 'Search for Brazilian car prices using FIPE API via MCP server',
  inputSchema: z.object({
    query: z.string().describe('Car brand name to search for or "brands" to list all brands'),
    type: z.string().optional().describe('Vehicle type: "carros", "motos", or "caminhoes"'),
  }),
  outputSchema: z.object({
    result: z.string(),
    type: z.string(),
  }),
  execute: async ({ context }) => {
    return await getCarPriceFromMCP(context.query, context.type);
  },
});

const getCarPriceFromMCP = async (query: string, type?: string) => {
  try {
    // MCP server endpoint - Updated Smithery deployment
    const mcpUrl = 'https://server.smithery.ai/@yusaaztrk/car-price-mcp-main/mcp';
    const apiKey = 'ee8c38d9-188d-4f19-9f21-9c9589fcbaa0';

    let toolName = 'search_car_price';
    let toolArgs: any = { brand_name: query };

    // Determine which tool to use based on query
    if (query.toLowerCase() === 'brands' || query.toLowerCase().includes('brands')) {
      toolName = 'get_car_brands';
      toolArgs = {};
    } else if (type) {
      toolName = 'get_vehicles_by_type';
      toolArgs = { vehicle_type: type };
    }

    // Call the MCP server
    const response = await fetch(`${mcpUrl}?api_key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: toolArgs
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

    // Parse the car info from MCP response
    const carInfo = data.result?.content?.[0]?.text || data.result || '';
    return {
      result: carInfo,
      type: type || 'search',
    };
  } catch (error) {
    console.error('MCP call failed:', error);
    // Fallback to direct API call if MCP fails
    return await fallbackGetCarPrice(query, type);
  }
};

const fallbackGetCarPrice = async (query: string, type?: string) => {
  try {
    // Determine API call based on query
    if (query.toLowerCase() === 'brands' || query.toLowerCase().includes('brands')) {
      return await getCarBrands();
    } else if (type) {
      return await getVehiclesByType(type);
    } else {
      return await searchCarByBrand(query);
    }
  } catch (error) {
    throw new Error(`Failed to get car price: ${error}`);
  }
};

const getCarBrands = async () => {
  const url = "https://parallelum.com.br/fipe/api/v1/carros/marcas";

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FIPE API error: ${response.status} ${response.statusText}`);
  }

  const brands = await response.json();

  if (!brands || brands.length === 0) {
    throw new Error('No car brands found');
  }

  // Format brands information
  let brandsInfo = "🚗 **Car Brands Available** 🚗\n\n";

  // Show first 20 brands
  brands.slice(0, 20).forEach((brand: any, index: number) => {
    brandsInfo += `**${index + 1}. ${brand.nome}** (Code: ${brand.codigo})\n`;
  });

  if (brands.length > 20) {
    brandsInfo += `\n*...and ${brands.length - 20} more brands*\n`;
  }

  brandsInfo += `\n**Total Brands:** ${brands.length}\n`;
  brandsInfo += "*Use brand name to search for specific models and prices*";

  return {
    result: brandsInfo,
    type: 'brands',
  };
};

const searchCarByBrand = async (brandName: string) => {
  // First get all brands
  const brandsUrl = "https://parallelum.com.br/fipe/api/v1/carros/marcas";
  const brandsResponse = await fetch(brandsUrl);

  if (!brandsResponse.ok) {
    throw new Error(`FIPE API error: ${brandsResponse.status} ${brandsResponse.statusText}`);
  }

  const brands = await brandsResponse.json();

  // Search for brand by name (case insensitive)
  const queryLower = brandName.toLowerCase();
  const foundBrand = brands.find((brand: any) =>
    brand.nome.toLowerCase().includes(queryLower)
  );

  if (!foundBrand) {
    const brandNames = brands.slice(0, 10).map((brand: any) => brand.nome);
    return {
      result: `Brand '${brandName}' not found. Available brands include: ${brandNames.join(', ')}...`,
      type: 'error',
    };
  }

  // Get models for the found brand
  const modelsUrl = `https://parallelum.com.br/fipe/api/v1/carros/marcas/${foundBrand.codigo}/modelos`;
  const modelsResponse = await fetch(modelsUrl);

  if (!modelsResponse.ok) {
    throw new Error(`FIPE API error: ${modelsResponse.status} ${modelsResponse.statusText}`);
  }

  const modelsData = await modelsResponse.json();
  const models = modelsData.modelos || [];

  if (models.length === 0) {
    return {
      result: `No models found for ${foundBrand.nome}`,
      type: 'error',
    };
  }

  // Get price for first 3 models
  let carInfo = `🚗 **${foundBrand.nome} Models & Prices** 🚗\n\n`;

  for (let i = 0; i < Math.min(3, models.length); i++) {
    const model = models[i];
    try {
      // Get years for this model
      const yearsUrl = `https://parallelum.com.br/fipe/api/v1/carros/marcas/${foundBrand.codigo}/modelos/${model.codigo}/anos`;
      const yearsResponse = await fetch(yearsUrl);

      if (yearsResponse.ok) {
        const years = await yearsResponse.json();
        if (years.length > 0) {
          // Get price for most recent year
          const latestYear = years[0];
          const priceUrl = `https://parallelum.com.br/fipe/api/v1/carros/marcas/${foundBrand.codigo}/modelos/${model.codigo}/anos/${latestYear.codigo}`;
          const priceResponse = await fetch(priceUrl);

          if (priceResponse.ok) {
            const priceData = await priceResponse.json();

            carInfo += `**${i + 1}. ${model.nome}**\n`;
            carInfo += `📅 **Year:** ${priceData.AnoModelo || 'N/A'}\n`;
            carInfo += `⛽ **Fuel:** ${priceData.Combustivel || 'N/A'}\n`;
            carInfo += `💰 **Price:** ${priceData.Valor || 'N/A'}\n`;
            carInfo += `📊 **Reference:** ${priceData.MesReferencia || 'N/A'}\n`;
            carInfo += `🔢 **FIPE Code:** ${priceData.CodigoFipe || 'N/A'}\n\n`;
          } else {
            carInfo += `**${i + 1}. ${model.nome}** - Price not available\n\n`;
          }
        } else {
          carInfo += `**${i + 1}. ${model.nome}** - No years available\n\n`;
        }
      } else {
        carInfo += `**${i + 1}. ${model.nome}** - Years not available\n\n`;
      }
    } catch (modelError) {
      carInfo += `**${i + 1}. ${model.nome}** - Error: ${modelError}\n\n`;
    }
  }

  if (models.length > 3) {
    carInfo += `*...and ${models.length - 3} more models available*\n`;
  }

  carInfo += `\n**Total Models:** ${models.length}\n`;
  carInfo += "*Prices are from FIPE (Brazilian vehicle price reference)*";

  return {
    result: carInfo,
    type: 'search',
  };
};

const getVehiclesByType = async (vehicleType: string) => {
  // Map vehicle types
  const typeMapping: { [key: string]: string } = {
    'car': 'carros',
    'cars': 'carros',
    'carro': 'carros',
    'carros': 'carros',
    'motorcycle': 'motos',
    'motorcycles': 'motos',
    'moto': 'motos',
    'motos': 'motos',
    'truck': 'caminhoes',
    'trucks': 'caminhoes',
    'caminhao': 'caminhoes',
    'caminhoes': 'caminhoes'
  };

  const apiType = typeMapping[vehicleType.toLowerCase()] || 'carros';

  const url = `https://parallelum.com.br/fipe/api/v1/${apiType}/marcas`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`FIPE API error: ${response.status} ${response.statusText}`);
  }

  const brands = await response.json();

  if (!brands || brands.length === 0) {
    return {
      result: `No ${vehicleType} brands found`,
      type: 'error',
    };
  }

  // Format vehicle type info
  const typeEmoji = apiType === "carros" ? "🚗" : apiType === "motos" ? "🏍️" : "🚛";
  let vehiclesInfo = `${typeEmoji} **${vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)} Brands** ${typeEmoji}\n\n`;

  // Show first 15 brands
  brands.slice(0, 15).forEach((brand: any, index: number) => {
    vehiclesInfo += `**${index + 1}. ${brand.nome}** (Code: ${brand.codigo})\n`;
  });

  if (brands.length > 15) {
    vehiclesInfo += `\n*...and ${brands.length - 15} more brands*\n`;
  }

  vehiclesInfo += `\n**Total Brands:** ${brands.length}\n`;
  vehiclesInfo += "*Use brand name to search for specific models and prices*";

  return {
    result: vehiclesInfo,
    type: 'type',
  };
};
