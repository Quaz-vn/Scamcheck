import { analyzeMessage } from "./js/gemini.js";

const button = document.getElementById("checkBtn"); // Dùng id checkBtn từ HTML của bạn
const result = document.getElementById("result");
const messageInput = document.getElementById("messageInput");

// Hàm điền tin mẫu
window.fillSample = (type) => {
    const samples = {
        nganhang: "Tài khoản bạn đã bị khóa, truy cập http://vietcornbank.com để xác thực ngay.",
        congan: "Công an đang điều tra liên quan CCCD, yêu cầu chuyển 10 triệu để xác minh.",
        trungthuong: "Chúc mừng! Bạn trúng thưởng 500 triệu. Nhận tại: http://quatang.xyz"
    };
    messageInput.value = samples[type];
};

// Sự kiện chính khi bấm kiểm tra
button.addEventListener("click", async () => {
    const message = messageInput.value;

    if (!message.trim()) {
        result.innerHTML = "⚠️ Vui lòng nhập nội dung tin nhắn.";
        return;
    }

    result.innerHTML = "⏳ Đang phân tích...";

    try {
        const analysis = await analyzeMessage(message);

        let riskClass = "risk-danger";
        let riskIcon = "🟥";

        if (analysis.risk === "Nghi ngờ") {
            riskClass = "risk-warning";
            riskIcon = "🟨";
        } else if (analysis.risk === "An toàn") {
            riskClass = "risk-safe";
            riskIcon = "🟩";
        }

        const signsHtml = analysis.signs.map(sign => 
            `<li><b>${sign.quote}</b><br>${sign.reason}</li>`
        ).join("");

        const actionsHtml = analysis.actions.map(action => 
            `<li>${action}</li>`
        ).join("");

        result.innerHTML = `
            <div class="risk-card ${riskClass}">
                <div class="risk-title">${riskIcon} ${analysis.risk}</div>
                <h3>Dấu hiệu phát hiện</h3>
                <ul>${signsHtml}</ul>
                <h3>Khuyến nghị</h3>
                <ul>${actionsHtml}</ul>
            </div>
        `;
    } catch (error) {
        console.error(error);
        result.innerHTML = `❌ Lỗi: ${error.message}`;
    }
});
