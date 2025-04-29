import { useState, useEffect } from 'react';
import '../styles/PromptTemplates.css';

const PromptTemplates = ({ templates, onSelectTemplate }) => {
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 獲取所有唯一的類別
  const categories = ['all', ...new Set(templates.map(template => template.category || 'general'))];
  
  // 當模板或篩選條件變化時，更新顯示的模板
  useEffect(() => {
    let filtered = templates;
    
    // 根據類別篩選
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => (template.category || 'general') === selectedCategory);
    }
    
    // 根據搜尋詞篩選
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(template => 
        (template.title || template.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.content || template.prompt || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedCategory]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  if (templates.length === 0) {
    return (
      <div className="prompt-templates empty-state">
        <h2>Prompt 模板</h2>
        <p>目前還沒有儲存的 Prompt 模板。您可以將常用的 Prompt 儲存為模板，方便下次使用。</p>
      </div>
    );
  }

  return (
    <div className="prompt-templates">
      <h2>Prompt 模板</h2>
      
      <div className="filter-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="搜尋模板..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        
        <div className="category-filter">
          <select value={selectedCategory} onChange={handleCategoryChange}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? '全部類別' : category}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="templates-list">
        {filteredTemplates.map((template, index) => (
          <div 
            key={template.id || index} 
            className="template-card"
            onClick={() => onSelectTemplate(template)}
          >
            <h3>{template.title || template.name}</h3>
            <p className="template-preview">{(template.content || template.prompt || '').slice(0, 100)}...</p>
            <div className="template-meta">
              <span className="template-category">{template.category || 'general'}</span>
              <span className="template-date">
                {new Date(template.date || template.created_at || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {filteredTemplates.length === 0 && (
        <div className="no-results">
          <p>沒有符合搜尋條件的模板</p>
        </div>
      )}
    </div>
  );
};

export default PromptTemplates;
