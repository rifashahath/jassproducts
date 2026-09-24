-- ============================================================
-- Supabase Table Migration: product_reviews
-- Stores customer ratings, reviews, and verified buyer feedback.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    author TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL,
    comment TEXT NOT NULL,
    verified BOOLEAN DEFAULT TRUE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries by product_id
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);

-- Enable RLS (Row Level Security) with public read and insert policies
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to product reviews"
    ON public.product_reviews FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert access to product reviews"
    ON public.product_reviews FOR INSERT
    WITH CHECK (true);

-- Insert initial sample seed reviews for products p1 through p19
INSERT INTO public.product_reviews (product_id, author, rating, title, comment, verified, helpful_count) VALUES
('p1', 'Ananya Sharma', 5, 'Absolutely lifelike quality!', 'I was hesitant about artificial botanicals, but this exceeded all expectations. The stem detailing looks stunning in our living room.', true, 14),
('p1', 'Vikramaditya R.', 5, 'Perfect statement piece', 'Zero maintenance and looks brand new every day. The pot quality is heavy premium stone ceramic.', true, 9),
('p2', 'Priya Nair', 5, 'Vibrant blossoms!', 'The purple petals catch the afternoon light beautifully. Everyone asks if it is real.', true, 11),
('p3', 'Karan Patel', 5, 'Worth every rupee', 'Fast delivery and extremely sturdy protective packaging. Highly recommended!', true, 8),
('p4', 'Sneha Kapoor', 4, 'Elegant office greenery', 'Fits on my desk seamlessly. Clean finish and zero watering needed.', true, 6);
