# AI-Agents-Hackathon
AI Agents Hackathon

## Setup Instructions

This guide will help you set up and run the Azure AI Agent app using Codespaces.

---

## 🚀 Setup Instructions

### 1. Create Codespace
- Create a **Codespace** on the `main` branch of this repository.

---

### 2. Configure Environment Variables
- Rename the file `copy.env` to `.env`.
- Open the `.env` file and replace the variables with your own values:
  ```env
  AZURE_AGENT_IA=your_agent_id
  AZURE_ENDPOINT=your_endpoint_url
  
### Install Azure CLI
Run the following command on the terminal:

```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Azure Login
On the terminal:
```bash
az login --use-device-code
```

Select your azure subscription. Just type 1

### Run the Application

```bash
python run_agent.py
```

```bash
python app.py
```

Click on Running on http://127.0.0.1:5000

### Test the Application

Ask this question:

**What's the maximum I can claim for meals?**
