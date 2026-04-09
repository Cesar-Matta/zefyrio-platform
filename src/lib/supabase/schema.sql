-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla Perfiles de Piloto (Extendiendo auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  license_number TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Tabla Perfiles de Vuelo Vehiculares (Límites personalizados)
CREATE TABLE public.flight_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('dron', 'plane', 'helicopter', 'paraglider', 'parachute')),
  max_wind_speed_kts INTEGER NOT NULL,
  max_gust_speed_kts INTEGER NOT NULL,
  min_temperature_c INTEGER DEFAULT 0,
  max_temperature_c INTEGER DEFAULT 45,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, vehicle_type)
);

-- 3. Tabla Lugares Favoritos (Waypoints guardados)
CREATE TABLE public.favorite_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Row Level Security (RLS) - Seguridad Obligatoria y Crítica en Supabase
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_locations ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: Nadie puede ver ni modificar datos de otro piloto
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own flight profiles" ON public.flight_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flight profiles" ON public.flight_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flight profiles" ON public.flight_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flight profiles" ON public.flight_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own favorite locations" ON public.favorite_locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorite locations" ON public.favorite_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorite locations" ON public.favorite_locations FOR DELETE USING (auth.uid() = user_id);

-- Inteligencia Backend: Trigger Automático 
-- Cuando un piloto nuevo entra por primera vez, se le crea su perfil y un vehículo (Dron) por defecto.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  
  -- Vehículo por defecto con límites estándar (15 nudos de viento continuo, 20 nudos ráfaga)
  INSERT INTO public.flight_profiles (user_id, vehicle_type, max_wind_speed_kts, max_gust_speed_kts)
  VALUES (new.id, 'dron', 15, 20);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
