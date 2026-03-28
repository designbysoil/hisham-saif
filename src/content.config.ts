import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    shortTitle: z.string(),
    category: z.enum(['QMC', 'Freelance', 'Education']),
    color: z.enum(['red', 'blue', 'yellow', 'black']),
    org: z.string(),
    role: z.string(),
    dates: z.string(),
    order: z.number(),
    description: z.string(),
    bullets: z.array(z.string()),
    tags: z.array(z.string()).optional(),
    stats: z.array(z.object({
      value: z.string(),
      label: z.string(),
    })).optional(),
    image: z.string().optional(),
    illoSize: z.number().optional(),
  }),
});

export const collections = { projects };
