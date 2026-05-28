import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('slug, label_ar')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching categories:', error);
      return Response.json({ error: 'Failed to fetch categories', details: error.message }, { status: 500 });
    }

    console.log('Fetched categories:', categories?.length || 0, 'items');
    
    return Response.json(categories || []);
  } catch (error) {
    console.error('Server error:', error);
    return Response.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
