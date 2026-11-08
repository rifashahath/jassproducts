import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://duxjhmhgiacmuuqzfjxs.supabase.co";
const DEFAULT_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eGpobWhnaWFjbXV1cXpmanhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODU5NTA4NywiZXhwIjoyMTA0MTcxMDg3fQ._X4hT06eNEhvFWA7y7TmFH23dZX1Tw-1QSW3znsPBeo";

function getClient(env: any) {
  const url = env?.VITE_SUPABASE_URL || env?.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = env?.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_KEY;
  return createClient(url, key, { auth: { persistSession: false } });
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: any) {
  const supabase = getClient(context.env);

  try {
    const body = await context.request.json();
    if (!body || !body.name) {
      return new Response(JSON.stringify({ error: "Product payload requires at least a name." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const id = String(body.id || `jp-${Date.now().toString(36)}`);
    const name = String(body.name).trim();
    const slug = body.slug || name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-");
    const price = Number(body.price) || 0;
    const salePrice = body.salePrice !== undefined ? Number(body.salePrice) : (body.sale_price !== undefined ? Number(body.sale_price) : undefined);
    const stock = body.stockQuantity !== undefined ? Number(body.stockQuantity) : (body.stock !== undefined ? Number(body.stock) : 50);

    const dbRow = {
      id,
      name,
      slug,
      category: (body.category || "HEALTH CARE").toUpperCase(),
      description: body.description || "",
      note: body.note || "",
      price,
      sale_price: salePrice ?? null,
      stock,
      in_stock: body.inStock ?? (stock > 0),
      badge: body.badge || "",
      image: body.image || "/products/amla-powder/main.webp",
      hover_image: body.hoverImage || body.hover_image || body.image || "/products/amla-powder/main.webp",
      gallery: Array.isArray(body.gallery) && body.gallery.length > 0 ? body.gallery : [body.image || "/products/amla-powder/main.webp"],
      rating: body.rating ? Number(body.rating) : 5.0,
      reviews_count: body.reviewsCount || body.reviews_count || 0,
      is_active: body.status !== "ARCHIVED" && body.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("products").upsert(dbRow).select();
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, product: data?.[0] || dbRow }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Failed to parse JSON" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
}

export async function onRequestDelete(context: any) {
  const supabase = getClient(context.env);
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing product id" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const { error } = await supabase.from("products").delete().eq("id", String(id));
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, deletedId: id }), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
