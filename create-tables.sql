-- 创建 case_studies 表的函数
CREATE OR REPLACE FUNCTION create_case_studies_table()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 检查表是否已存在
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'case_studies'
  ) THEN
    -- 创建表
    CREATE TABLE public.case_studies (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      prompt TEXT NOT NULL,
      image_url TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- 添加 RLS 策略
    ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
    
    -- 创建允许匿名访问的策略
    CREATE POLICY "Allow anonymous access" ON public.case_studies
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
      
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- 创建 prompt_templates 表的函数
CREATE OR REPLACE FUNCTION create_prompt_templates_table()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 检查表是否已存在
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'prompt_templates'
  ) THEN
    -- 创建表
    CREATE TABLE public.prompt_templates (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- 添加 RLS 策略
    ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
    
    -- 创建允许匿名访问的策略
    CREATE POLICY "Allow anonymous access" ON public.prompt_templates
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
      
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;
