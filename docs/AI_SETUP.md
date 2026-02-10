# AI Setup (Multi-Provider)

This app can use multiple AI providers to:
- Estimate nutrition for unknown foods.
- Generate a weekly meal plan.

Supported providers:
- OpenAI
- Gemini (Google)
- Claude (Anthropic)
- Grok (xAI)

## Option A: Use the in-app setup (recommended)
- Open the app and go to `Integrations` → `AI Integration`.
- Pick a provider, paste your API key, choose a model, and enable AI.
- The key is stored server-side for your account.

## Option B: Environment variables
Set the API key for the provider you want to use:

```bash
# OpenAI
export OPENAI_API_KEY="your_openai_key_here"

# Gemini (Google)
export GEMINI_API_KEY="your_gemini_key_here"

# Claude (Anthropic)
export ANTHROPIC_API_KEY="your_anthropic_key_here"

# Grok (xAI)
export XAI_API_KEY="your_xai_key_here"

# Global switch
export AI_ENABLED="true"
```

Optional model overrides:
```bash
export OPENAI_MODEL="gpt-4o-mini"
export GEMINI_MODEL="gemini-2.5-flash"
export ANTHROPIC_MODEL="claude-sonnet-4-20250514"
export XAI_MODEL="grok-4-1-fast-reasoning"
```

Notes:
- If a provider key is missing, AI features are disabled for that provider.
- Set `AI_ENABLED=false` to disable AI features globally.

## Restart the server
After setting environment variables, restart the app:

```bash
npm run dev
```

AI features will be available in Food Log (for missing foods) and Meal Plan.
