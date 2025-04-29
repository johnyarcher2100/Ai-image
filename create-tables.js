// 创建 Supabase 表的脚本
import { createClient } from '@supabase/supabase-js';

// 从环境变量中获取 Supabase 配置
const supabaseUrl = 'https://qzdiyunmopvjktzqywkx.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6ZGl5dW5tb3B2amt0enF5d2t4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTg0MTEzMywiZXhwIjoyMDYxNDE3MTMzfQ.xon3E62GjzgRsS8m9728qPoiM9HrKB1-ECnkWj9tLvY';

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// 创建 case_studies 表
async function createCaseStudiesTable() {
  console.log('开始创建 case_studies 表...');
  
  // 使用 SQL 创建表
  const { data, error } = await supabase.rpc('create_case_studies_table');
  
  if (error) {
    console.error('创建 case_studies 表失败:', error);
  } else {
    console.log('case_studies 表创建成功:', data);
  }
}

// 创建 prompt_templates 表
async function createPromptTemplatesTable() {
  console.log('开始创建 prompt_templates 表...');
  
  // 使用 SQL 创建表
  const { data, error } = await supabase.rpc('create_prompt_templates_table');
  
  if (error) {
    console.error('创建 prompt_templates 表失败:', error);
  } else {
    console.log('prompt_templates 表创建成功:', data);
  }
}

// 主函数
async function main() {
  try {
    // 检查连接
    console.log('检查 Supabase 连接...');
    const { data, error } = await supabase.from('_schema').select('*').limit(1);
    
    if (error) {
      console.error('Supabase 连接错误:', error);
      return;
    }
    
    console.log('Supabase 连接成功');
    
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
