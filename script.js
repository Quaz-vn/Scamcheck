import { analyzeMessage } from "./js/gemini.js";

const button = document.getElementById("checkBtn");
const result = document.getElementById("result");

button.addEventListener("click", async () => {

    const message =
        document.getElementById("messageInput").value;

    if (!message.trim()) {

        result.innerHTML =
            "⚠️ Vui lòng nhập nội dung tin nhắn.";

        return;
    }

    result.innerHTML =
        "⏳ Đang phân tích...";

    try {

        const analysis =
            await analyzeMessage(message);

        let riskClass = "risk-danger";
        let riskIcon = "🟥";

        if (analysis.risk === "Nghi ngờ") {
            riskClass = "risk-warning";
            riskIcon = "🟨";
        }

        if (analysis.risk === "An toàn") {
            riskClass = "risk-safe";
            riskIcon = "🟩";
        }

        const signsHtml =
            analysis.signs
                .map(sign =>
                    `<li>
                        <b>${sign.quote}</b><br>
                        ${sign.reason}
                    </li>`
                )
                .join("");

        const actionsHtml =
            analysis.actions
                .map(action =>
                    `<li>${action}</li>`
                )
                .join("");

        result.innerHTML = `
            <div class="risk-card ${riskClass}">

                <div class="risk-title">
                    ${riskIcon} ${analysis.risk}
                </div>

                <h3>Dấu hiệu phát hiện</h3>

                <ul>
                    ${signsHtml}
                </ul>

                <h3>Khuyến nghị</h3>

                <ul>
                    ${actionsHtml}
                </ul>

            </div>
        `;

    } catch (error) {

        console.error(error);

        result.innerHTML =
            `❌ ${error.message}`;
    }

});
const samples = {
    nganhang: "Tài khoản bạn đã bị khóa, truy cập http://vietcornbank.com để xác thực ngay.",
    congan: "Công an đang điều tra liên quan CCCD, yêu cầu chuyển 10 triệu để xác minh.",
    trungthuong: "Chúc mừng! Bạn trúng thưởng 500 triệu. Nhận tại: http://quatang.xyz"
};

function fillSample(type) {
    document.getElementById("messageInput").value = samples[type];
}

document.getElementById('checkButton').addEventListener('click', async () => {
    const input = document.getElementById("messageInput").value;
    const resultDiv = document.getElementById("result");
    const loading = document.getElementById("loading");

    loading.style.display = "block";
    resultDiv.innerText = "";

    try {
        const response = await fetch('/check-scam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageInput: input })
        });
        const data = await response.json();
        resultDiv.innerText = data.result;
    } catch (e) {
        resultDiv.innerText = "Lỗi hệ thống!";
    } finally {
        loading.style.display = "none";
    }
});
