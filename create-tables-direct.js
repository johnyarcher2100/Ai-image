// 直接在 Supabase 中创建表的脚本
import { createClient } from '@supabase/supabase-js';

// 从环境变量中获取 Supabase 配置
const supabaseUrl = 'https://qzdiyunmopvjktzqywkx.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6ZGl5dW5tb3B2amt0enF5d2t4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTg0MTEzMywiZXhwIjoyMDYxNDE3MTMzfQ.xon3E62GjzgRsS8m9728qPoiM9HrKB1-ECnkWj9tLvY';

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// 直接执行 SQL 创建表
async function createTables() {
  console.log('开始直接创建表...');
  
  try {
    // 创建 case_studies 表
    console.log('创建 case_studies 表...');
    const { error: caseStudiesError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.case_studies (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          prompt TEXT NOT NULL,
          image_url TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Allow anonymous access" ON public.case_studies;
        CREATE POLICY "Allow anonymous access" ON public.case_studies
          FOR ALL
          TO anon
          USING (true)
          WITH CHECK (true);
      `
    });
    
    if (caseStudiesError) {
      console.error('创建 case_studies 表失败:', caseStudiesError);
      
      // 尝试使用另一种方式
      console.log('尝试使用另一种方式创建 case_studies 表...');
      const { error: directError } = await supabase.from('_sql').select('*').execute(`
        CREATE TABLE IF NOT EXISTS public.case_studies (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          prompt TEXT NOT NULL,
          image_url TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Allow anonymous access" ON public.case_studies;
        CREATE POLICY "Allow anonymous access" ON public.case_studies
          FOR ALL
          TO anon
          USING (true)
          WITH CHECK (true);
      `);
      
      if (directError) {
        console.error('直接创建 case_studies 表也失败:', directError);
      } else {
        console.log('直接创建 case_studies 表成功');
      }
    } else {
      console.log('创建 case_studies 表成功');
    }
    
    // 创建 prompt_templates 表
    console.log('创建 prompt_templates 表...');
    const { error: promptTemplatesError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.prompt_templates (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          category TEXT DEFAULT 'general',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Allow anonymous access" ON public.prompt_templates;
        CREATE POLICY "Allow anonymous access" ON public.prompt_templates
          FOR ALL
          TO anon
          USING (true)
          WITH CHECK (true);
      `
    });
    
    if (promptTemplatesError) {
      console.error('创建 prompt_templates 表失败:', promptTemplatesError);
      
      // 尝试使用另一种方式
      console.log('尝试使用另一种方式创建 prompt_templates 表...');
      const { error: directError } = await supabase.from('_sql').select('*').execute(`
        CREATE TABLE IF NOT EXISTS public.prompt_templates (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          category TEXT DEFAULT 'general',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Allow anonymous access" ON public.prompt_templates;
        CREATE POLICY "Allow anonymous access" ON public.prompt_templates
          FOR ALL
          TO anon
          USING (true)
          WITH CHECK (true);
      `);
      
      if (directError) {
        console.error('直接创建 prompt_templates 表也失败:', directError);
      } else {
        console.log('直接创建 prompt_templates 表成功');
      }
    } else {
      console.log('创建 prompt_templates 表成功');
    }
    
    console.log('表创建完成');
  } catch (error) {
    console.error('创建表时发生错误:', error);
  }
}

// 执行创建表
createTables();
