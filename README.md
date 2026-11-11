# Daven Demo — AI Engineering Lab

Daven 的互動式 AI Engineering 作品展示，將工具與技術整理為六個工程能力模組：

1. **AI Runtime Lab** — Ollama、Hugging Face、Groq；本機與雲端推論環境配置概念。
2. **Agent Studio** — AI Agent、Multi-Agent System、n8n、OpenClaw；任務拆解、角色分工與交接追蹤。
3. **Prompt & RAG Lab** — Prompt、Negative Prompt、Reverse Prompt、Grill-me 與本機知識檢索。
4. **GenAI Workflow Studio** — ComfyUI、FLUX、Stable Diffusion、LoRA；節點式生成流程配置。
5. **Developer Toolchain** — Kilo Code、Cline、Codex、Runtime、Skills、CLI、Git、GitHub、Diff、PowerShell、CMD、Ubuntu。
6. **Product Studio** — UI/UX、AI4BI、WordPress / Elementor、Android 發布流程。

## Live Demo

https://jlyay45684.github.io/Daven_Demo/

## Run locally

直接以瀏覽器開啟根目錄的 `index.html`，不需要安裝套件或啟動建置流程。

## Demo boundary

本專案是純前端互動展示，不會實際連線 Ollama、Hugging Face、Groq、ComfyUI、n8n、OpenClaw、Android Studio 或 WordPress。所有模擬操作均有明確標示；CSV 分析與輸入內容只在瀏覽器本機處理。頁面不要求、不儲存 API Key。

如要接入真實服務，應另建可信任的本機 Runtime 或後端 API，並將憑證留在伺服器端，禁止將 API Key 寫入公開 HTML / JavaScript。

## Enable GitHub Pages

1. 開啟 Repo 的 **Settings → Pages**。
2. 在 **Build and deployment** 選擇 **Deploy from a branch**。
3. Branch 選擇 **main**，Folder 選擇 **/(root)**，按 Save。
4. 等待 GitHub Pages 部署完成後，HR 即可透過 Live Demo 網址直接瀏覽。
