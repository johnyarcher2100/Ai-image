// 表情貼圖風格數據
export const stickerStyles = [
  {
    id: 'practical',
    name: '實用型',
    description: '適合日常對話使用的實用型貼圖',
    subStyles: [
      {
        id: 'daily-conversation',
        name: '萬用對話型',
        description: '日常用語搭配誇張表情，適用於各種聊天情境',
        examples: ['謝謝', 'OK', '笑死', '氣氣氣'],
        promptHint: '設計成萬用對話型貼圖，適合日常聊天使用，表情誇張生動，加上常用對話文字'
      },
      {
        id: 'emotional-release',
        name: '情緒發洩型',
        description: '適合現代人抒發心情的表情貼圖',
        examples: ['崩潰', '厭世', '我沒錢了'],
        promptHint: '設計成情緒發洩型貼圖，表情要誇張，能表達強烈情緒，適合抒發心情'
      }
    ]
  },
  {
    id: 'character',
    name: '角色 IP',
    description: '以角色為主的表情貼圖，有助於建立品牌形象',
    subStyles: [
      {
        id: 'original-character',
        name: '原創角色',
        description: '設計一個有記憶點的角色，並延伸不同表情與動作',
        examples: ['動物角色', 'Q版人物', '吉祥物風格'],
        promptHint: '將照片轉換為可愛的原創角色風格，保留主要特徵但卡通化，增加記憶點'
      },
      {
        id: 'series-theme',
        name: '系列化主題',
        description: '以特定主題為基礎的系列貼圖',
        examples: ['上班族系列', '情侶吵架系列', '寵物搗蛋系列'],
        promptHint: '設計成系列化主題貼圖，風格一致，適合收藏整套'
      }
    ]
  },
  {
    id: 'seasonal',
    name: '節慶與時事',
    description: '結合節慶或時事的表情貼圖',
    subStyles: [
      {
        id: 'festival',
        name: '節慶限定',
        description: '配合節日推出的應景貼圖',
        examples: ['新年', '聖誕節', '中秋節'],
        promptHint: '設計成節慶限定風格，添加節日元素和氛圍，應景且喜慶'
      },
      {
        id: 'trending',
        name: '時事梗圖',
        description: '結合流行語或網路迷因的貼圖',
        examples: ['AI生成梗圖', '流行語', '網路熱門話題'],
        promptHint: '設計成時下流行的梗圖風格，融入網路流行元素，年輕化且有趣'
      }
    ]
  },
  {
    id: 'special-effects',
    name: '特效貼圖',
    description: '具有特殊效果的表情貼圖',
    subStyles: [
      {
        id: 'animated',
        name: '動態貼圖',
        description: '會動的表情貼圖，更吸引人',
        examples: ['簡單動畫', '循環動作', '表情變化'],
        promptHint: '設計成動態貼圖風格，雖然不能真正動起來，但要有動態感，像是正在進行某個動作'
      },
      {
        id: 'full-screen',
        name: '全螢幕特效',
        description: '佔據整個螢幕的特效貼圖',
        examples: ['爆炸效果', '滿屏愛心', '螢幕搖晃'],
        promptHint: '設計成全螢幕特效風格，表情要大且誇張，有視覺衝擊力，像是要跳出螢幕'
      }
    ]
  }
];

// 獲取所有子風格的平面列表
export const getAllSubStyles = () => {
  const allSubStyles = [];
  stickerStyles.forEach(mainStyle => {
    mainStyle.subStyles.forEach(subStyle => {
      allSubStyles.push({
        ...subStyle,
        mainStyleId: mainStyle.id,
        mainStyleName: mainStyle.name
      });
    });
  });
  return allSubStyles;
};

// 根據ID獲取子風格
export const getSubStyleById = (id) => {
  const allSubStyles = getAllSubStyles();
  return allSubStyles.find(style => style.id === id);
};
