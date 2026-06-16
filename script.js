import { analyzeMessage } from "./js/gemini.js";

const button = document.getElementById("checkBtn");
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

// Sự kiện nhấn nút duy nhất
button.addEventListener("click", async () => {
    const message = messageInput.value.trim();

    // 1. Kiểm tra tin nhắn trống
    if (!message) {
        result.innerHTML = '<div class="risk-card risk-warning">⚠️ Vui lòng nhập nội dung tin nhắn để kiểm tra.</div>';
        return;
    }

    // 2. Kiểm tra độ dài (>5000 ký tự)
    if (message.length > 5000) {
        result.innerHTML = '<div class="risk-card risk-danger">⚠️ Tin nhắn quá dài (trên 5000 ký tự). Vui lòng rút gọn!</div>';
        return;
    }

    result.innerHTML = "⏳ Đang phân tích, vui lòng chờ trong giây lát...";

    try {
        const analysis = await analyzeMessage(message);

        // 3. Kiểm tra cấu trúc dữ liệu
        if (!analysis || !analysis.risk || !analysis.signs) {
            throw new Error("Dữ liệu phản hồi không hợp lệ từ máy chủ.");
        }

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
        console.error("Lỗi hệ thống:", error);
        result.innerHTML = `
            <div class="risk-card risk-danger">
                ❌ <b>Không thể phân tích:</b> ${error.message || "Đã xảy ra lỗi kết nối. Vui lòng thử lại sau."}
            </div>
        `;
    }
});
