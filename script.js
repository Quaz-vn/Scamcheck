const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});
document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');

function fillSample(type) {
    const samples = {
        nganhang: "Tài khoản của bạn đã bị khóa, hãy đăng nhập tại http://vietcombank.update-account.com để xác thực.",
        congan: "Công an gọi: Bạn có liên quan đến vụ án ma túy, yêu cầu chuyển 50 triệu vào tài khoản tạm giữ.",
        trungthuong: "Chúc mừng! Bạn đã trúng thưởng 1 chiếc iPhone 15, hãy nhấn vào link bit.ly/trungthuong để nhận quà."
    };
    document.getElementById('messageInput').value = samples[type];
}

document.getElementById('checkBtn').addEventListener('click', () => {
    const input = document.getElementById('messageInput').value;
    const resultArea = document.getElementById('resultArea');
    const badge = document.getElementById('riskBadge');
    
    resultArea.classList.remove('hidden');
    badge.className = 'risk-badge dangerous';
    badge.innerText = "NGUY HIỂM";
    document.getElementById('analysisContent').innerText = "Đây là tin nhắn lừa đảo. Không bấm vào đường dẫn!";
});
