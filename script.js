// ===============================================================
// ** 核心設定：請將下方的連結替換成您 Google Sheets 發布的 CSV 連結 **
// 步驟：Google Sheets -> 檔案 -> 分享 -> 發布到網路 -> 連結 -> 選擇「逗號分隔值 (.csv)」
// ===============================================================
const SHEET_URL = https://docs.google.com/spreadsheets/d/e/2PACX-1vTdrMc1Yj5dp1ic_J7xBZxh9ypKhkO450u4973XnAlZ-JMvvDz2gKH4SQCrStQUOQbnB_s87fBUAU5T/pub?output=csv 
// ===============================================================
// Google Sheets 欄位名稱 (第一列的英文名稱)
const COLUMN_MAPPING = ['songName', 'artist', 'language', 'notes'];
// ===============================================================

let songData = [];
let sortColumn = 'songName';
let sortDirection = 1; // 1 = 升序 (A-Z, 0-9), -1 = 降序 (Z-A, 9-0)

/**
 * 從 URL 載入 CSV 資料並解析
 */
async function loadSongList() {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = '正在載入歌單資料...';
    
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error(`HTTP 錯誤! 狀態碼: ${response.status}`);
        
        const csvText = await response.text();
        songData = parseCSV(csvText);
        
        if (songData.length > 0) {
            statusElement.remove(); // 載入成功，移除狀態訊息
            renderTable(songData);
        } else {
            statusElement.textContent = '歌單為空或解析失敗。請檢查您的 Google Sheets 連結和內容。';
        }
        
    } catch (error) {
        console.error('無法載入或解析歌單:', error);
        statusElement.textContent = `載入失敗: ${error.message}。請確認連結是否正確且已公開發布。`;
    }
}

/**
 * 簡易 CSV 解析器
 */
function parseCSV(csvText) {
    // 簡單地分割行和逗號，並清理前後空白和引號
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 1) return [];

    const data = [];
    
    for (let i = 0; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));

        if (values.length !== COLUMN_MAPPING.length) {
             continue; // 忽略欄位數量不符的行
        }

        const song = {};
        COLUMN_MAPPING.forEach((key, index) => {
            song[key] = values[index];
        });
        
        // 略過可能讀取到的 CSV 原始標題行
        if (i === 0 && song.songName.toLowerCase() === 'songname') {
            continue; 
        }
        
        data.push(song);
    }
    return data;
}


/**
 * 渲染或更新表格內容
 */
function renderTable(songs) {
    const tableBody = document.getElementById('songTableBody');
    tableBody.innerHTML = '';
    
    if (songs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="notes">找不到符合條件的歌曲。</td></tr>';
        return;
    }

    // 應用排序邏輯
    songs.sort((a, b) => {
        const valA = String(a[sortColumn]).toLowerCase();
        const valB = String(b[sortColumn]).toLowerCase();
        
        if (valA < valB) return -1 * sortDirection;
        if (valA > valB) return 1 * sortDirection;
        return 0;
    });

    // 繪製表格行
    songs.forEach(song => {
        const row = tableBody.insertRow();
        
        COLUMN_MAPPING.forEach(key => {
            const cell = row.insertCell();
            cell.textContent = song[key];
            if (key === 'notes') {
                cell.classList.add('notes');
            }
        });
    });
    
    updateSortIndicators();
}

/**
 * 處理即時搜尋/篩選
 */
function handleSearch() {
    const query = document.getElementById('searchBar').value.toLowerCase();
    
    const filteredSongs = songData.filter(song => {
        // 搜尋所有可見的欄位
        return COLUMN_MAPPING.some(key => 
            String(song[key]).toLowerCase().includes(query)
        );
    });
    
    // 篩選後重新渲染，保持當前的排序狀態
    renderTable(filteredSongs);
}

/**
 * 處理點擊表頭進行排序
 */
function handleSort(event) {
    const clickedColumn = event.currentTarget.getAttribute('data-col');
    
    if (clickedColumn === sortColumn) {
        // 如果點擊的是同一欄，切換排序方向
        sortDirection *= -1;
    } else {
        // 如果點擊的是不同欄，切換到該欄並預設為升序
        sortColumn = clickedColumn;
        sortDirection = 1; 
    }
    
    // 重新渲染，並套用當前的搜尋過濾 (如果有)
    handleSearch(); 
}

/**
 * 更新表頭的排序指示箭頭
 */
function updateSortIndicators() {
    document.querySelectorAll('th').forEach(th => {
        const indicator = th.querySelector('.sort-indicator');
        indicator.textContent = ''; 

        if (th.getAttribute('data-col') === sortColumn) {
            indicator.textContent = sortDirection === 1 ? '▲' : '▼';
        }
    });
}

// ===============================================================
// 網頁載入後，執行初始化
// ===============================================================
document.addEventListener('DOMContentLoaded', () => {
    // 綁定搜尋事件
    document.getElementById('searchBar').addEventListener('keyup', handleSearch);
    
    // 綁定排序事件
    document.querySelectorAll('th[data-col]').forEach(header => {
        header.addEventListener('click', handleSort);
    });
    
    // 載入資料
    loadSongList();
});