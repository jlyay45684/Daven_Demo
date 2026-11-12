# Daven Demo — AI Engineering Lab

Daven 的互動式 AI Engineering 作品集入口（Portfolio Hub），將既有能力拆分整合為 4 個獨立 HTML Demo。純 HTML / CSS / JavaScript，GitHub Pages 可直接部署。

## Live Demo

- Portfolio Hub: https://jlyay45684.github.io/Daven_Demo/
- AI Runtime Lab: https://jlyay45684.github.io/Daven_Demo/runtime.html
- Agent Studio: https://jlyay45684.github.io/Daven_Demo/agents.html
- Prompt & RAG Lab: https://jlyay45684.github.io/Daven_Demo/prompt-rag.html
- GenAI Workflow & Product Delivery Studio: https://jlyay45684.github.io/Daven_Demo/genai-workflow.html

## 獨立視覺作品

### NEXUS — 穿越星際的邊界

- Live Demo: https://jlyay45684.github.io/Daven_Demo/NEXUS/nexus.html
- 原始碼：[`NEXUS/`](./NEXUS/)
- 技術：原生 HTML / CSS / JavaScript、Three.js 0.160.0、GLSL Shader、EffectComposer、UnrealBloomPass。
- 特色：130,000 粒子螺旋星系、遠景星體、星塵、曲速航道、黑洞吸積盤、重力透鏡、時空漣漪、滾動相機路徑與游標引力互動。
- 此作品為獨立視覺展示，不計入上方四個功能型 HTML Demo。

## 四個 Demo 與展示技術

### 1. runtime.html — AI Runtime Lab
- 核心：本機與雲端 LLM Runtime 配置（Ollama / Hugging Face / Groq）、Endpoint/Model、Temperature/Max Tokens、Runtime Configuration、模擬請求與輸出、LOCAL/HOSTED 狀態。
- 開發工具鏈：PowerShell / CMD / Ubuntu 指令範例、Node.js/npm/Git 環境檢查、Runtime 啟動與檢查指令。
- 重點：模型 Runtime、部署環境與推論架構。**所有模型呼叫為 SIMULATION**。

### 2. agents.html — Agent Studio
- 核心：Agent Role Selection、Objective、Multi-Agent Workflow、Role Handoff Trace、Execution Status、Workflow Completion Report。
- 工具觀念：n8n、OpenClaw、Kilo Code、Cline、Codex。
- 開發工具鏈：Agent 任務交接、Git/GitHub 操作概念、Diff Reviewer、Before/After 程式碼差異檢視。
- 重點：任務拆解、角色分工、工具調用與交付驗證。**所有 Agent 執行為 SIMULATED**。

### 3. prompt-rag.html — Prompt & RAG Lab
- 核心：System/User/Negative/Reverse/Grill-me Prompt、Prompt Assembly、Copy Prompt、Knowledge Fragment 管理（Add/Clear）、Keyword Retrieval、Retrieval Results。
- 流程：Prompt → Knowledge Retrieval → Context Assembly → AI Input。
- 重點：本機關鍵字檢索示範（**非 Embedding / 非 Vector Database**），資料僅在瀏覽器處理。

### 4. genai-workflow.html — GenAI Workflow & Product Delivery Studio
- GenAI：ComfyUI-style Workflow Graph、Model/Checkpoint、LoRA、Positive/Negative Prompt、Steps/CFG、Workflow Execution Animation、JSON Export（ComfyUI / FLUX / Stable Diffusion / LoRA）。
- Product Delivery：UI/UX Live Prototype、AI4BI CSV Explorer、Elementor / Page Builder Concept、Android Release Checklist。
- 重點：工作流配置到產品交付。**生成流程為 SIMULATED**；CSV 僅在瀏覽器本機處理、不上傳。

## Simulation Boundary

本專案是純前端互動展示，不會實際連線 Ollama、Hugging Face、Groq、ComfyUI、n8n、OpenClaw、Android Studio 或 WordPress。所有模擬操作均有明確標示（SIMULATED/SIMULATION/LOCAL）；CSV 分析與輸入內容只在瀏覽器本機處理。頁面不要求、不儲存 API Key。

如要接入真實服務，應另建可信任的本機 Runtime 或後端 API，並將憑證留在伺服器端，禁止將 API Key 寫入公開 HTML / JavaScript。

## Local Run

四個功能型 Demo 可直接以瀏覽器開啟根目錄的 `index.html`（或任一 Demo HTML）。NEXUS 使用 ES Modules 與 Three.js Import Map，請透過 HTTP Server 執行，不要以 `file://` 直接開啟；詳細指令見 `NEXUS/README.md`。

## GitHub Pages 部署方式

1. 開啟 Repo 的 **Settings → Pages**。
2. 在 **Build and deployment** 選擇 **Deploy from a branch**。
3. Branch 選擇 **main**，Folder 選擇 **/(root)**，按 Save。
4. 等待 GitHub Pages 部署完成後，即可透過 Live Demo 網址瀏覽。

## 專案結構

```text
Daven_Demo/
├── NEXUS/
│   ├── nexus.html
│   ├── nexus.css
│   ├── nexus-ui.js
│   ├── nexus-scene.js
│   └── README.md
├── index.html
├── runtime.html
├── agents.html
├── prompt-rag.html
├── genai-workflow.html
├── README.md
├── .nojekyll
└── assets/
    ├── demo.css
    ├── common.js
    ├── runtime.js
    ├── agents.js
    ├── prompt-rag.js
    └── genai-workflow.js
```
