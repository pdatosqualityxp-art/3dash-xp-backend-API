# Corporate RAG API (Node.js & Express on Vercel)

This repository contains the serverless backend API developed for the TFM (Trabajo de Fin de Máster). It integrates **Google Gemini (`gemini-3.1-flash-lite`)**, **Supabase** (for business data retrieval and audit logging), and is designed for deployment on **Vercel**.

## Prerequisites

Before setting up the project on a new machine, ensure you have the following installed:

* [Node.js](https://nodejs.org/) (LTS version recommended)
* [Git](https://git-scm.com/)
* [Visual Studio Code](https://code.visualstudio.com/)

## Setup Instructions via Visual Studio Code

### 1. Clone the Repository Manually in VS Code

1. Open **Visual Studio Code**.
2. Press `Ctrl + Shift + P` (or `Cmd + Shift + P` on Mac) to open the Command Palette.
3. Type **>Git: Clone** and select it.
4. Paste your GitHub repository URL:
   ```text
   https://github.com/pdatosqualityxp-art/3dash-xp-backend-API.git
   ```
5. Select or create a local folder on your computer where the project will be saved.
6. Once cloned, click **Open** when VS Code prompts you to open the repository.

### 2. Install Dependencies

Since the `node_modules` folder is excluded from version control, you need to install all required project dependencies.

1. Open the integrated terminal in VS Code (`Ctrl + ~` or go to **Terminal > New Terminal**).
2. Run the following command:
   ```bash
   npm install
   ```

### 3. Configure Environment Variables

Create a `.env` file in the root directory of the project for local testing. Add the following keys (replace with your actual credentials):

```env
GEMINI_API_KEY=tu_clave_de_google_ai_studio
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_clave_publishable_de_supabase
```

*(Note: If you are deploying to Vercel, make sure these variables are also configured in your Vercel Project Settings under Environment Variables).*

### 4. Run the Project Locally (Optional)

If your project is set up to run locally with Express, start the server using:

```bash
npm start
```

## API Endpoints

* **`POST /api/chat`**
  * **Description:** Receives a user message, queries the Supabase `clientes` table for context, queries Google Gemini with RAG guardrails, logs the interaction in the `chat_logs` table, and returns the response along with token usage metrics.
  * **Body (JSON):**
    ```json
    {
      "message": "¿Qué clientes tenemos en Madrid?"
    }
    ```

## Author
XP