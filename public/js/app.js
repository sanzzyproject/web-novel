const API_URL = '/api';

// Utility untuk mengambil parameter URL
const getQueryParam = (param) => new URLSearchParams(window.location.search).get(param);

// Render Card Novel
const createCard = (novel) => `
    <a href="/detail.html?url=${encodeURIComponent(novel.url)}" class="card">
        <img src="${novel.cover}" alt="${novel.title}" loading="lazy">
        <div class="card-info">
            <div class="card-title">${novel.title}</div>
            <div class="card-meta">
                <span>⭐ ${novel.status || 'N/A'}</span>
                <span>${novel.type || 'Novel'}</span>
            </div>
        </div>
    </a>
`;

// Halaman Home
if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    const loadHome = async () => {
        try {
            document.getElementById('content').innerHTML = '<div class="loader">Memuat Data Terbaru...</div>';
            const res = await fetch(`${API_URL}/home`);
            const data = await res.json();
            
            let html = `
                <h2 class="section-title">🔥 Trending Hari Ini</h2>
                <div class="grid">${data.trending.map(createCard).join('')}</div>
                <h2 class="section-title" style="margin-top: 3rem;">✨ Rilis Terbaru</h2>
                <div class="grid">${data.newRelease.map(createCard).join('')}</div>
            `;
            document.getElementById('content').innerHTML = html;
        } catch (e) {
            document.getElementById('content').innerHTML = '<div class="loader">Gagal memuat data.</div>';
        }
    };
    loadHome();
}

// Halaman Detail
if (window.location.pathname.includes('/detail.html')) {
    const loadDetail = async () => {
        const url = getQueryParam('url');
        if (!url) return;
        
        try {
            document.getElementById('detail-content').innerHTML = '<div class="loader">Menyiapkan Informasi Novel...</div>';
            const res = await fetch(`${API_URL}/detail?url=${encodeURIComponent(url)}`);
            const novel = await res.json();
            
            document.getElementById('detail-content').innerHTML = `
                <div class="detail-header">
                    <img src="${novel.cover}" class="detail-cover" alt="Cover">
                    <div class="detail-info">
                        <h1>${novel.title}</h1>
                        <div class="tags">${novel.genres.map(g => `<span class="tag">${g}</span>`).join('')}</div>
                        <p style="color: var(--text-muted); margin-bottom: 1rem;">Author: ${novel.author} | Rating: ⭐ ${novel.rating}</p>
                        <p>${novel.synopsis}</p>
                    </div>
                </div>
                <h2 class="section-title">Daftar Chapter</h2>
                <div class="chapter-list">
                    ${novel.chapters.reverse().map(ch => `
                        <a href="/read.html?url=${encodeURIComponent(ch.url)}" class="chapter-item">
                            <span>${ch.title}</span>
                            <span style="color: var(--text-muted)">${ch.date}</span>
                        </a>
                    `).join('')}
                </div>
            `;
        } catch (e) {
            document.getElementById('detail-content').innerHTML = '<div class="loader">Gagal memuat detail novel.</div>';
        }
    };
    loadDetail();
}

// Halaman Baca
if (window.location.pathname.includes('/read.html')) {
    const loadChapter = async () => {
        const url = getQueryParam('url');
        if (!url) return;

        try {
            document.getElementById('reader').innerHTML = '<div class="loader">Menyeduh Kopi & Menyiapkan Chapter...</div>';
            const res = await fetch(`${API_URL}/chapter?url=${encodeURIComponent(url)}`);
            const chapter = await res.json();
            
            const prevBtn = chapter.navigation.prev ? `<button class="btn" onclick="window.location.href='/read.html?url=${encodeURIComponent(chapter.navigation.prev)}'">Chapter Sebelumnya</button>` : `<button class="btn" disabled>Mentok Kiri</button>`;
            const nextBtn = chapter.navigation.next ? `<button class="btn" onclick="window.location.href='/read.html?url=${encodeURIComponent(chapter.navigation.next)}'">Chapter Selanjutnya</button>` : `<button class="btn" disabled>Mentok Kanan</button>`;

            document.getElementById('reader').innerHTML = `
                <h1 style="text-align: center; margin-bottom: 1rem; color: var(--accent);">${chapter.title}</h1>
                <div class="reader-nav" style="border: none; margin-bottom: 2rem;">
                    ${prevBtn}
                    ${nextBtn}
                </div>
                <div class="reader-content">${chapter.content}</div>
                <div class="reader-nav">
                    ${prevBtn}
                    ${nextBtn}
                </div>
            `;
        } catch (e) {
            document.getElementById('reader').innerHTML = '<div class="loader">Gagal memuat chapter.</div>';
        }
    };
    loadChapter();
}
