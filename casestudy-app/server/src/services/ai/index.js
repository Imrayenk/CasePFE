const OllamaProvider = require('./OllamaProvider');

// Future proofing: If you add more providers (e.g., LmStudioProvider), 
// you can switch them based on process.env.AI_PROVIDER.
let activeProvider = null;

function getAiProvider() {
    if (!activeProvider) {
        // Automatically default to Ollama for the local backend
        activeProvider = new OllamaProvider();
    }
    return activeProvider;
}

module.exports = {
    getAiProvider
};
