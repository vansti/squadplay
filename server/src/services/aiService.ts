import OpenAI from 'openai';

export interface AIWordPair {
  wordA: string;
  wordB: string;
  category: string;
}

const wordPairJsonSchema = {
  type: 'object',
  properties: {
    wordA: {
      type: 'string',
      description: 'A fun or interesting word related to the topic.',
    },
    wordB: {
      type: 'string',
      description:
        "A different word closely related to wordA and the topic, making them a good 'Odd One Out' pair.",
    },
    category: {
      type: 'string',
      description: 'The topic or category that connects these two words.',
    },
  },
  required: ['wordA', 'wordB', 'category'],
  additionalProperties: false,
} as const;

export async function generateWordPair(topic: string): Promise<AIWordPair> {
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in the environment variables.');
  }

  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const prompt = `Generate a creative and closely related pair of words for the topic: "${topic}". They should be distinct enough to be used in a hidden identity party game where one person is the 'Odd One Out' with a different word. The category should represent their shared theme.`;

  const response = await openai.chat.completions.create({
    model,
    temperature: 0.8,
    messages: [{ role: 'user', content: prompt }],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'word_pair',
        strict: true,
        schema: wordPairJsonSchema,
      },
    },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error('OpenAI returned an empty response');
  }

  try {
    return JSON.parse(text) as AIWordPair;
  } catch (err) {
    console.error('Failed to parse AI response:', text, err);
    throw new Error('Invalid AI response format');
  }
}
