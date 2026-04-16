/**
 * Base AI Provider Interface
 * All AI providers (e.g., Ollama, OpenAI) should implement these methods.
 */
class AiProvider {
    /**
     * Generates a draft summary based on the provided inputs.
     * @param {Object} params
     * @param {string} params.caseContent
     * @param {Array<string>} params.keywords
     * @param {string} params.logicalMapString
     * @returns {Promise<string>} The generated draft HTML
     */
    async generateDraft() {
        throw new Error('Method "generateDraft" must be implemented.');
    }

    /**
     * Extracts concept keywords from a case study text.
     * @param {string} caseContent The full text of the case study
     * @returns {Promise<Array<{text: string, category: string}>>} Array of extracted concepts
     */
    async extractConcepts() {
        throw new Error('Method "extractConcepts" must be implemented.');
    }

    /**
     * Extracts evidence statements from a case study text.
     * @param {string} caseContent The full text of the case study
     * @returns {Promise<Array<string>>} Array of evidence statements
     */
    async extractEvidence() {
        throw new Error('Method "extractEvidence" must be implemented.');
    }

    /**
     * Drafts a final submission based on guided step answers.
     * @param {Object} params
     * @returns {Promise<string>} The generated final submission text
     */
    async draftFinalSubmission() {
        throw new Error('Method "draftFinalSubmission" must be implemented.');
    }
}

module.exports = AiProvider;
