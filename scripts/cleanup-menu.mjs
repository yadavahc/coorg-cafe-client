#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read .env
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Parse env file
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE_MENU_IDS = new Set(['c1', 'c2', 'c3', 't1', 't2', 't3', 't4', 't5', 't6', 'h1', 'h2', 'm1', 'm2', 'm3', 'o1', 'o2']);

async function cleanupMenu() {
  console.log('🔍 Fetching all menu items...\n');

  try {
    // Fetch all items
    const { data: allItems, error: fetchError } = await supabase
      .from('menu_items')
      .select('id, name, category, price');

    if (fetchError) throw fetchError;

    // Find items to delete
    const itemsToDelete = allItems.filter(item => !BASE_MENU_IDS.has(item.id));

    if (itemsToDelete.length === 0) {
      console.log('✅ Database is clean! Only the original 17 items exist.\n');
      console.log('📋 Remaining items:');
      console.log('   ☕ Coffee: Black Coffee, S.P. Filter Coffee, Jaggery Filter Coffee');
      console.log('   🍵 Tea: Butter Tea, Green Tea, Lemon Tea, Masala Tea, Jaggery Tea, Sukku Mani Tea');
      console.log('   💪 Health Drinks: Boost, Horlicks');
      console.log('   🥛 Milk Specials: Rose Milk, Jaggery Milk, Ragi Malt Milk');
      console.log('   🛍️  Others: Citron Fruit Masala, Parcel Extra\n');
      process.exit(0);
    }

    console.log(`⚠️  Found ${itemsToDelete.length} extra items to delete:\n`);
    itemsToDelete.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.name} (${item.category}) - ₹${item.price}`);
    });

    console.log('\n🗑️  Deleting extra items...\n');

    // Delete extra items
    const idsToDelete = itemsToDelete.map(item => item.id);
    const { error: deleteError } = await supabase
      .from('menu_items')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) throw deleteError;

    console.log(`✅ Successfully deleted ${itemsToDelete.length} items!\n`);
    console.log('📋 Database now contains only the original 17 items:');
    console.log('   ☕ Coffee: Black Coffee, S.P. Filter Coffee, Jaggery Filter Coffee');
    console.log('   🍵 Tea: Butter Tea, Green Tea, Lemon Tea, Masala Tea, Jaggery Tea, Sukku Mani Tea');
    console.log('   💪 Health Drinks: Boost, Horlicks');
    console.log('   🥛 Milk Specials: Rose Milk, Jaggery Milk, Ragi Malt Milk');
    console.log('   🛍️  Others: Citron Fruit Masala, Parcel Extra\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupMenu();
