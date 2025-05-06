-- 創建必要的擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 創建 stories 表
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  overview TEXT,
  character_count INTEGER DEFAULT 0,
  scene_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 添加 RLS 策略
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- 創建允許匿名訪問的策略
DROP POLICY IF EXISTS "Allow anonymous access" ON public.stories;
CREATE POLICY "Allow anonymous access" ON public.stories
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 創建 story_characters 表
CREATE TABLE IF NOT EXISTS public.story_characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 添加 RLS 策略
ALTER TABLE public.story_characters ENABLE ROW LEVEL SECURITY;

-- 創建允許匿名訪問的策略
DROP POLICY IF EXISTS "Allow anonymous access" ON public.story_characters;
CREATE POLICY "Allow anonymous access" ON public.story_characters
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 創建 story_scenes 表
CREATE TABLE IF NOT EXISTS public.story_scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  description TEXT,
  dialogue TEXT,
  image_url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  generation_time INTEGER, -- 存儲生成時間（毫秒）
  prompt TEXT, -- 存儲生成圖像使用的提示詞
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 添加 RLS 策略
ALTER TABLE public.story_scenes ENABLE ROW LEVEL SECURITY;

-- 創建允許匿名訪問的策略
DROP POLICY IF EXISTS "Allow anonymous access" ON public.story_scenes;
CREATE POLICY "Allow anonymous access" ON public.story_scenes
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 創建索引以提高查詢性能
CREATE INDEX IF NOT EXISTS idx_story_characters_story_id ON public.story_characters(story_id);
CREATE INDEX IF NOT EXISTS idx_story_scenes_story_id ON public.story_scenes(story_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at);

-- 創建觸發器函數來自動更新 updated_at 欄位
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為每個表添加觸發器
DROP TRIGGER IF EXISTS update_stories_updated_at ON public.stories;
CREATE TRIGGER update_stories_updated_at
BEFORE UPDATE ON public.stories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_story_characters_updated_at ON public.story_characters;
CREATE TRIGGER update_story_characters_updated_at
BEFORE UPDATE ON public.story_characters
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_story_scenes_updated_at ON public.story_scenes;
CREATE TRIGGER update_story_scenes_updated_at
BEFORE UPDATE ON public.story_scenes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
