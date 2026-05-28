import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('slug, label_ar, label_en, icon_emoji')
      .order('label_ar');

    if (error) {
      console.error('Error fetching categories:', error);
      return Response.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    return Response.json(categories || []);
  } catch (error) {
    console.error('Server error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
