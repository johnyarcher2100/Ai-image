-- 创建必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建 case_studies 表
CREATE TABLE IF NOT EXISTS public.case_studies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 添加 RLS 策略
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;

-- 创建允许匿名访问的策略
DROP POLICY IF EXISTS "Allow anonymous access" ON public.case_studies;
CREATE POLICY "Allow anonymous access" ON public.case_studies
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 创建 prompt_templates 表
CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 添加 RLS 策略
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

-- 创建允许匿名访问的策略
DROP POLICY IF EXISTS "Allow anonymous access" ON public.prompt_templates;
CREATE POLICY "Allow anonymous access" ON public.prompt_templates
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
