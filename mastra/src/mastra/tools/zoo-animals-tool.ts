import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface ZooAnimal {
  name: string;
  latin_name: string;
  animal_type: string;
  active_time: string;
  length_min: string;
  length_max: string;
  weight_min: string;
  weight_max: string;
  lifespan: string;
  habitat: string;
  diet: string;
  geo_range: string;
  image_link: string;
}

// Mock zoo animals data for fallback
const MOCK_ANIMALS: ZooAnimal[] = [
  {
    name: "African Lion",
    latin_name: "Panthera leo",
    animal_type: "Mammal",
    active_time: "Crepuscular",
    length_min: "140",
    length_max: "250",
    weight_min: "120",
    weight_max: "250",
    lifespan: "12",
    habitat: "Savanna",
    diet: "Carnivore",
    geo_range: "Africa",
    image_link: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=500"
  },
  {
    name: "African Elephant",
    latin_name: "Loxodonta africana",
    animal_type: "Mammal",
    active_time: "Diurnal",
    length_min: "600",
    length_max: "750",
    weight_min: "4000",
    weight_max: "7000",
    lifespan: "60",
    habitat: "Savanna",
    diet: "Herbivore",
    geo_range: "Africa",
    image_link: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=500"
  },
  {
    name: "Giraffe",
    latin_name: "Giraffa camelopardalis",
    animal_type: "Mammal",
    active_time: "Diurnal",
    length_min: "400",
    length_max: "600",
    weight_min: "800",
    weight_max: "1200",
    lifespan: "25",
    habitat: "Savanna",
    diet: "Herbivore",
    geo_range: "Africa",
    image_link: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=500"
  },
  {
    name: "Bengal Tiger",
    latin_name: "Panthera tigris tigris",
    animal_type: "Mammal",
    active_time: "Crepuscular",
    length_min: "180",
    length_max: "310",
    weight_min: "140",
    weight_max: "260",
    lifespan: "15",
    habitat: "Forest",
    diet: "Carnivore",
    geo_range: "Asia",
    image_link: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=500"
  },
  {
    name: "Giant Panda",
    latin_name: "Ailuropoda melanoleuca",
    animal_type: "Mammal",
    active_time: "Diurnal",
    length_min: "120",
    length_max: "150",
    weight_min: "70",
    weight_max: "125",
    lifespan: "20",
    habitat: "Forest",
    diet: "Herbivore",
    geo_range: "China",
    image_link: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=500"
  },
  {
    name: "Emperor Penguin",
    latin_name: "Aptenodytes forsteri",
    animal_type: "Bird",
    active_time: "Diurnal",
    length_min: "100",
    length_max: "130",
    weight_min: "22",
    weight_max: "45",
    lifespan: "20",
    habitat: "Antarctic",
    diet: "Carnivore",
    geo_range: "Antarctica",
    image_link: "https://images.unsplash.com/photo-1551986782-d0169b3f8fa7?w=500"
  },
  {
    name: "Red Panda",
    latin_name: "Ailurus fulgens",
    animal_type: "Mammal",
    active_time: "Crepuscular",
    length_min: "50",
    length_max: "65",
    weight_min: "3",
    weight_max: "6",
    lifespan: "12",
    habitat: "Forest",
    diet: "Herbivore",
    geo_range: "Asia",
    image_link: "https://images.unsplash.com/photo-1459262838948-3e2de6c1ec80?w=500"
  },
  {
    name: "Polar Bear",
    latin_name: "Ursus maritimus",
    animal_type: "Mammal",
    active_time: "Diurnal",
    length_min: "200",
    length_max: "250",
    weight_min: "350",
    weight_max: "680",
    lifespan: "25",
    habitat: "Arctic",
    diet: "Carnivore",
    geo_range: "Arctic",
    image_link: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=500"
  }
];

export const zooAnimalsTool = createTool({
  id: 'search-zoo-animals',
  description: 'Search for zoo animals using deployed MCP server or RapidAPI',
  inputSchema: z.object({
    query: z.string().describe('Animal name to search for or "random" for random animals'),
    type: z.string().optional().describe('Animal type filter (mammal, bird, reptile, etc.)'),
    count: z.number().optional().describe('Number of random animals (1-10, default: 5)'),
  }),
  outputSchema: z.object({
    animals: z.string(),
    count: z.number(),
    type: z.string(),
  }),
  execute: async ({ context }) => {
    return await getZooAnimalsFromMCP(context.query, context.type, context.count);
  },
});

const getZooAnimalsFromMCP = async (query: string, type?: string, count?: number) => {
  try {
    // MCP server endpoint - Smithery'ye deploy edildikten sonra güncellenecek
    const mcpUrl = 'https://server.smithery.ai/@yusaaztrk/zoo-animals-mcp-main/mcp';
    const apiKey = 'ee8c38d9-188d-4f19-9f21-9c9589fcbaa0';

    let toolName = 'search_animal';
    let toolArgs: any = { name: query };

    // Determine which tool to use based on query
    if (query.toLowerCase() === 'random' || query.toLowerCase().includes('random')) {
      toolName = 'get_random_animals';
      toolArgs = { count: count || 5 };
    } else if (type) {
      toolName = 'get_animals_by_type';
      toolArgs = { animal_type: type };
    }

    // Call the MCP server
    const response = await fetch(`${mcpUrl}?api_key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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

    // Parse the animals info from MCP response
    const animalsInfo = data.result?.content?.[0]?.text || data.result || '';
    return {
      animals: animalsInfo,
      count: count || 1,
      type: type || 'mixed',
    };
  } catch (error) {
    console.error('MCP call failed:', error);
    // Fallback to direct API call if MCP fails
    return await fallbackGetZooAnimals(query, type, count);
  }
};

const fallbackGetZooAnimals = async (query: string, type?: string, count?: number) => {
  try {
    // Use mock data since RapidAPI is not working
    if (query.toLowerCase() === 'random' || query.toLowerCase().includes('random')) {
      return await getMockRandomAnimals(count || 5);
    } else if (type) {
      return await getMockAnimalsByType(type);
    } else {
      return await searchMockAnimalByName(query);
    }
  } catch (error) {
    throw new Error(`Failed to get zoo animals: ${error}`);
  }
};

const getRandomAnimals = async (count: number, apiKey: string) => {
  const url = `https://zoo-animals-api.p.rapidapi.com/animals/rand/${Math.min(count, 10)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-host': 'zoo-animals-api.p.rapidapi.com',
      'x-rapidapi-key': apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`RapidAPI error: ${response.status} ${response.statusText}`);
  }

  const animals = (await response.json()) as ZooAnimal[];

  if (!animals || animals.length === 0) {
    throw new Error('No animals found');
  }

  // Format the animals information
  let animalsInfo = "🦁 **Random Zoo Animals** 🦁\n\n";

  animals.forEach((animal, index) => {
    const sizeInfo = animal.length_min && animal.length_max
      ? `${animal.length_min}-${animal.length_max} cm`
      : 'Unknown';
    const weightInfo = animal.weight_min && animal.weight_max
      ? `${animal.weight_min}-${animal.weight_max} kg`
      : 'Unknown';

    animalsInfo += `**${index + 1}. ${animal.name}** 🐾
📝 **Latin Name:** ${animal.latin_name || 'Unknown'}
🏷️ **Type:** ${animal.animal_type || 'Unknown'}
⏰ **Active Time:** ${animal.active_time || 'Unknown'}
📏 **Size:** ${sizeInfo}
⚖️ **Weight:** ${weightInfo}
🕐 **Lifespan:** ${animal.lifespan || 'Unknown'} years
🏠 **Habitat:** ${animal.habitat || 'Unknown'}
🍽️ **Diet:** ${animal.diet || 'Unknown'}
🌍 **Geographic Range:** ${animal.geo_range || 'Unknown'}
📸 **Image:** ${animal.image_link || 'No image available'}

`;
  });

  return {
    animals: animalsInfo,
    count: animals.length,
    type: 'random',
  };
};

const searchAnimalByName = async (name: string, apiKey: string) => {
  // Get a larger set to search through
  const url = 'https://zoo-animals-api.p.rapidapi.com/animals/rand/50';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-host': 'zoo-animals-api.p.rapidapi.com',
      'x-rapidapi-key': apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`RapidAPI error: ${response.status} ${response.statusText}`);
  }

  const animals = (await response.json()) as ZooAnimal[];

  if (!animals || animals.length === 0) {
    throw new Error('No animals found');
  }

  // Search for the animal by name (case insensitive)
  const searchName = name.toLowerCase();
  const foundAnimals = animals.filter(animal =>
    animal.name?.toLowerCase().includes(searchName) ||
    searchName.includes(animal.name?.toLowerCase() || '')
  );

  if (foundAnimals.length === 0) {
    return {
      animals: `No animals found matching '${name}'. Try searching for: lion, elephant, giraffe, tiger, bear, etc.`,
      count: 0,
      type: 'search',
    };
  }

  // Return the first match with detailed info
  const animal = foundAnimals[0];
  const sizeInfo = animal.length_min && animal.length_max
    ? `${animal.length_min}-${animal.length_max} cm`
    : 'Unknown';
  const weightInfo = animal.weight_min && animal.weight_max
    ? `${animal.weight_min}-${animal.weight_max} kg`
    : 'Unknown';

  const animalInfo = `🦁 **${animal.name}** 🦁

📝 **Latin Name:** ${animal.latin_name || 'Unknown'}
🏷️ **Type:** ${animal.animal_type || 'Unknown'}
⏰ **Active Time:** ${animal.active_time || 'Unknown'}
📏 **Size:** ${sizeInfo}
⚖️ **Weight:** ${weightInfo}
🕐 **Lifespan:** ${animal.lifespan || 'Unknown'} years
🏠 **Habitat:** ${animal.habitat || 'Unknown'}
🍽️ **Diet:** ${animal.diet || 'Unknown'}
🌍 **Geographic Range:** ${animal.geo_range || 'Unknown'}
📸 **Image:** ${animal.image_link || 'No image available'}

${foundAnimals.length > 1 ? `**Other matches found:** ${foundAnimals.length - 1} more animals` : ''}`;

  return {
    animals: animalInfo,
    count: 1,
    type: 'search',
  };
};

// Mock data functions
const getMockRandomAnimals = async (count: number) => {
  const selectedAnimals = MOCK_ANIMALS.sort(() => 0.5 - Math.random()).slice(0, Math.min(count, MOCK_ANIMALS.length));

  let animalsInfo = "🦁 **Random Zoo Animals** 🦁\n\n";

  selectedAnimals.forEach((animal, index) => {
    const sizeInfo = animal.length_min && animal.length_max
      ? `${animal.length_min}-${animal.length_max} cm`
      : 'Unknown';
    const weightInfo = animal.weight_min && animal.weight_max
      ? `${animal.weight_min}-${animal.weight_max} kg`
      : 'Unknown';

    animalsInfo += `**${index + 1}. ${animal.name}** 🐾
📝 **Latin Name:** ${animal.latin_name || 'Unknown'}
🏷️ **Type:** ${animal.animal_type || 'Unknown'}
⏰ **Active Time:** ${animal.active_time || 'Unknown'}
📏 **Size:** ${sizeInfo}
⚖️ **Weight:** ${weightInfo}
🕐 **Lifespan:** ${animal.lifespan || 'Unknown'} years
🏠 **Habitat:** ${animal.habitat || 'Unknown'}
🍽️ **Diet:** ${animal.diet || 'Unknown'}
🌍 **Geographic Range:** ${animal.geo_range || 'Unknown'}
📸 **Image:** ${animal.image_link || 'No image available'}

`;
  });

  return {
    animals: animalsInfo,
    count: selectedAnimals.length,
    type: 'random',
  };
};

const searchMockAnimalByName = async (name: string) => {
  const searchName = name.toLowerCase();
  const foundAnimals = MOCK_ANIMALS.filter(animal =>
    animal.name?.toLowerCase().includes(searchName) ||
    searchName.includes(animal.name?.toLowerCase() || '')
  );

  if (foundAnimals.length === 0) {
    return {
      animals: `No animals found matching '${name}'. Try searching for: lion, elephant, giraffe, tiger, panda, penguin, etc.`,
      count: 0,
      type: 'search',
    };
  }

  const animal = foundAnimals[0];
  const sizeInfo = animal.length_min && animal.length_max
    ? `${animal.length_min}-${animal.length_max} cm`
    : 'Unknown';
  const weightInfo = animal.weight_min && animal.weight_max
    ? `${animal.weight_min}-${animal.weight_max} kg`
    : 'Unknown';

  const animalInfo = `🦁 **${animal.name}** 🦁

📝 **Latin Name:** ${animal.latin_name || 'Unknown'}
🏷️ **Type:** ${animal.animal_type || 'Unknown'}
⏰ **Active Time:** ${animal.active_time || 'Unknown'}
📏 **Size:** ${sizeInfo}
⚖️ **Weight:** ${weightInfo}
🕐 **Lifespan:** ${animal.lifespan || 'Unknown'} years
🏠 **Habitat:** ${animal.habitat || 'Unknown'}
🍽️ **Diet:** ${animal.diet || 'Unknown'}
🌍 **Geographic Range:** ${animal.geo_range || 'Unknown'}
📸 **Image:** ${animal.image_link || 'No image available'}

${foundAnimals.length > 1 ? `**Other matches found:** ${foundAnimals.length - 1} more animals` : ''}`;

  return {
    animals: animalInfo,
    count: 1,
    type: 'search',
  };
};

const getMockAnimalsByType = async (animalType: string) => {
  const searchType = animalType.toLowerCase();
  const filteredAnimals = MOCK_ANIMALS.filter(animal =>
    animal.animal_type?.toLowerCase().includes(searchType)
  );

  if (filteredAnimals.length === 0) {
    return {
      animals: `No ${animalType} animals found. Try: mammal, bird, reptile, fish, amphibian`,
      count: 0,
      type: 'type',
    };
  }

  let animalsInfo = `🦁 **${animalType.charAt(0).toUpperCase() + animalType.slice(1)} Animals** 🦁\n\n`;

  filteredAnimals.slice(0, 5).forEach((animal, index) => {
    animalsInfo += `**${index + 1}. ${animal.name}**
📝 Latin: ${animal.latin_name || 'Unknown'}
🏠 Habitat: ${animal.habitat || 'Unknown'}
🍽️ Diet: ${animal.diet || 'Unknown'}

`;
  });

  if (filteredAnimals.length > 5) {
    animalsInfo += `*...and ${filteredAnimals.length - 5} more ${animalType} animals*`;
  }

  return {
    animals: animalsInfo,
    count: filteredAnimals.length,
    type: 'type',
  };
};
