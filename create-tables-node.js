// 创建 Supabase 表的 Node.js 脚本
const { createClient } = require('@supabase/supabase-js');

// Supabase 配置
const supabaseUrl = 'https://qzdiyunmopvjktzqywkx.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6ZGl5dW5tb3B2amt0enF5d2t4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTg0MTEzMywiZXhwIjoyMDYxNDE3MTMzfQ.xon3E62GjzgRsS8m9728qPoiM9HrKB1-ECnkWj9tLvY';

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// 创建 case_studies 表
async function createCaseStudiesTable() {
  console.log('开始创建 case_studies 表...');
  
  try {
    // 使用 SQL 创建表
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
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
    
    if (error) {
      console.error('创建 case_studies 表失败:', error);
    } else {
      console.log('case_studies 表创建成功');
    }
  } catch (error) {
    console.error('创建 case_studies 表时出错:', error);
  }
}

// 创建 prompt_templates 表
async function createPromptTemplatesTable() {
  console.log('开始创建 prompt_templates 表...');
  
  try {
    // 使用 SQL 创建表
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
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
    
    if (error) {
      console.error('创建 prompt_templates 表失败:', error);
    } else {
      console.log('prompt_templates 表创建成功');
    }
  } catch (error) {
    console.error('创建 prompt_templates 表时出错:', error);
  }
}

// 主函数
async function main() {
  try {
    // 创建表
    await createCaseStudiesTable();
    await createPromptTemplatesTable();
    
    console.log('表创建完成');
  } catch (error) {
    console.error('发生错误:', error);
  }
}

// 执行主函数
main();
