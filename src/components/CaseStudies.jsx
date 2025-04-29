import { useState, useEffect } from 'react';
import '../styles/CaseStudies.css';

const CaseStudies = ({ cases, onSelectCase }) => {
  const [filteredCases, setFilteredCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setFilteredCases(cases);
  }, [cases]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCases(cases);
    } else {
      const filtered = cases.filter(
        (caseItem) => 
          (caseItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) || caseItem.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          caseItem.prompt?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCases(filtered);
    }
  }, [searchTerm, cases]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  if (cases.length === 0) {
    return (
      <div className="case-studies empty-state">
        <h2>案例頁面</h2>
        <p>目前還沒有儲存的案例。生成圖像後，可以選擇儲存為案例，供其他用戶參考。</p>
      </div>
    );
  }

  return (
    <div className="case-studies">
      <h2>案例頁面</h2>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="搜尋案例..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      
      <div className="cases-grid">
        {filteredCases.map((caseItem, index) => (
          <div 
            key={caseItem.id || index} 
            className="case-card"
            onClick={() => onSelectCase(caseItem)}
          >
            <div className="case-image">
              <img src={caseItem.imageUrl || caseItem.image_url} alt={caseItem.title || caseItem.name} />
            </div>
            <div className="case-info">
              <h3>{caseItem.title || caseItem.name}</h3>
              <p className="case-date">
                {new Date(caseItem.date || caseItem.created_at || caseItem.timestamp || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {filteredCases.length === 0 && (
        <div className="no-results">
          <p>沒有符合搜尋條件的案例</p>
        </div>
      )}
    </div>
  );
};

export default CaseStudies;
