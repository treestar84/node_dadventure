# MyTamaLife - Character Nurturing Game

A Vue 3 + TypeScript + Tailwind CSS + Supabase-based character nurturing web game.

## Features

- Character creation and management
- Food system with offline accumulation
- Quest system with time-based completion
- Achievement system
- Social features
- Knowledge sharing system

## Quest System

The quest system includes:
- 20 predefined quests across 4 categories (Daily, Adventure, Social, Crafting)
- Time-based completion (8-16 hours)
- Food rewards (3-7 items, 5% chance for 10 items)
- Daily limit of 10 completed quests
- Maximum 4 active quests at once

### Database Setup for Quests

1. **Quick Setup**: Run the simple table creation script in your Supabase SQL Editor:
```sql
-- Execute the contents of database/create_quest_tables.sql
```

2. **Full Setup**: For all 20 quests, run the complete script:
```sql
-- Execute the contents of database/quest_definitions.sql
```

3. The scripts will create:
   - `quest_definitions` table with quest templates
   - `quests` table for individual character quests
   - Proper indexes for performance

4. **Troubleshooting**: If you see "404 Not Found" errors:
   - Check that tables exist in Supabase Table Editor
   - Verify RLS policies if enabled
   - Check browser console for detailed error messages

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env.local` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
