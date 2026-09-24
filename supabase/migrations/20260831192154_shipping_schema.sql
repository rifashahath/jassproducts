-- Shipping Zones, Couriers, and Shipments Schema

CREATE TABLE IF NOT EXISTS public.shipping_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name VARCHAR(100) NOT NULL,
    base_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    free_delivery_threshold DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    estimated_days VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.couriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'INACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    service_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    api_connected BOOLEAN NOT NULL DEFAULT false,
    active_shipments_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    courier_name VARCHAR(100) NOT NULL,
    awb_number VARCHAR(100) NOT NULL,
    weight_kg DECIMAL(10, 2) NOT NULL,
    dimensions_cm VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'MANIFESTED' CHECK (status IN ('MANIFESTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RTO_RETURNED')),
    dispatched_date TIMESTAMP WITH TIME ZONE,
    estimated_delivery_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Allow public read access to shipping zones for checkout calculations
CREATE POLICY "Allow public read access on shipping_zones" ON public.shipping_zones FOR SELECT USING (true);

-- Allow admin full access
CREATE POLICY "Allow admin access on shipping_zones" ON public.shipping_zones FOR ALL USING (public.is_admin());
CREATE POLICY "Allow admin access on couriers" ON public.couriers FOR ALL USING (public.is_admin());
CREATE POLICY "Allow admin access on shipments" ON public.shipments FOR ALL USING (public.is_admin());
