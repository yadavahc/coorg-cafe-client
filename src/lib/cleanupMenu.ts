// Script to clean up extra menu items from database
// Only keep the original 17 items from the landing page

import { supabase } from "@/lib/supabase";
import { BASE_MENU_IDS } from "@/lib/menuItems";

export async function cleanupExtraMenuItems() {
  try {
    // Fetch all items
    const { data: allItems, error: fetchError } = await supabase
      .from("menu_items")
      .select("id, name");

    if (fetchError) throw fetchError;

    // Find items to delete (those NOT in base menu)
    const itemsToDelete = allItems.filter(item => !BASE_MENU_IDS.has(item.id));

    if (itemsToDelete.length === 0) {
      console.log("✅ No extra items to delete - database is clean!");
      return { success: true, deleted: 0 };
    }

    console.log(`Found ${itemsToDelete.length} extra items to delete:`);
    itemsToDelete.forEach(item => console.log(`  - ${item.name}`));

    // Delete the extra items
    const idsToDelete = itemsToDelete.map(item => item.id);
    const { error: deleteError } = await supabase
      .from("menu_items")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) throw deleteError;

    console.log(`✅ Successfully deleted ${itemsToDelete.length} extra items!`);
    return { success: true, deleted: itemsToDelete.length, items: itemsToDelete };
  } catch (error) {
    console.error("❌ Error cleaning up menu items:", error);
    return { success: false, error };
  }
}
