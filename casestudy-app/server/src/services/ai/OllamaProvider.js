const AiProvider = require('./AiProvider');

class OllamaProvider extends AiProvider {
    constructor() {
        super();
        this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        this.model = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';
    }

    async _generateResponse(systemPrompt, userPrompt, jsonFormat = false) {
        const payload = {
            model: this.model,
            system: systemPrompt,
            prompt: userPrompt,
            stream: false,
        };

        if (jsonFormat) {
            payload.format = "json";
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Ollama API error (${response.status}): ${err}`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Ollama Provider Error:', error.message);
            throw error;
        }
    }

    async generateDraft({ caseContent, keywords, logicalMapString }) {
        const systemPrompt = "You are a professional assistant helping a student write a compliance review summary.\nYour output MUST be entirely valid HTML inside <p> and <ul>/<li> tags as it will be injected into a rich text editor. Do NOT use markdown code blocks (```) or include any wrapper text outside the HTML.";

        let userPrompt = `Based on the following Case Study text, and the structural logical points the student has identified, write a cohesive, professional 2-3 paragraph summary.\n\n`;
        userPrompt += `--- CASE STUDY CONTEXT ---\n${caseContent}\n\n`;
        userPrompt += `--- STUDENT'S EXTRACTED KEYWORDS ---\n${keywords.join(', ')}\n\n`;
        userPrompt += `--- STUDENT'S LOGICAL CONCEPT MAP (Use this to structure the narrative) ---\n${logicalMapString}`;

        const responseText = await this._generateResponse(systemPrompt, userPrompt);

        // Clean any unexpected markdown blocks from local models
        const cleanedHtml = responseText.replace(/```html|```/g, '').trim();
        return cleanedHtml;
    }

    async extractConcepts(caseContent) {
        const systemPrompt = "You are an expert business analyst helping a student extract key concepts from a case study.\nReturn the result STRICTLY as a JSON array of objects. Example format: [{\"text\": \"operational bottlenecks\", \"category\": \"yellow\"}, {\"text\": \"15% behind schedule\", \"category\": \"blue\"}]\nRules: Extract exactly 3 to 5 key phrases. Assign 'yellow' for general notes/problems, and 'blue' for specific evidence/dates/facts.";

        const userPrompt = `Extract concepts from the following case study text:\n\n--- CASE STUDY CONTEXT ---\n${caseContent}`;

        const responseText = await this._generateResponse(systemPrompt, userPrompt, true);

        try {
            // Clean Markdown JSON block
            let cleanText = responseText.replace(/```json|```/gi, '').trim();
            
            // Attempt to extract purely the JSON array if surrounded by other conversational text
            const firstBracket = cleanText.indexOf('[');
            const lastBracket = cleanText.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                cleanText = cleanText.substring(firstBracket, lastBracket + 1);
            }

            let extracted = JSON.parse(cleanText);
            
            // Qwen2 and some other models might return a single object instead of an array
            if (extracted && typeof extracted === 'object' && !Array.isArray(extracted)) {
                // If they wrapped the array in {"concepts": [...]}
                if (extracted.concepts && Array.isArray(extracted.concepts)) {
                    extracted = extracted.concepts;
                } else if (extracted.text && extracted.category) {
                    // It returned just a single item
                    extracted = [extracted];
                } else {
                    // Try to dig through the object to find an array
                    const possibleArrays = Object.values(extracted).filter(val => Array.isArray(val));
                    if (possibleArrays.length > 0) {
                        extracted = possibleArrays[0];
                    } else {
                        // Unrecognizable object, return as is (which will get filtered out)
                        extracted = [extracted];
                    }
                }
            }

            return Array.isArray(extracted) ? extracted : [];
        } catch {
            console.error('Failed to parse Ollama JSON response:', responseText);
            throw new Error('Invalid JSON format returned from LLM. Response was: ' + responseText);
        }
    }

    async extractEvidence(caseContent) {
        const systemPrompt = "You help students identify evidence in a case study.\nReturn STRICTLY a JSON array of 3 to 6 short evidence strings. Evidence should be direct facts, metrics, events, constraints, or quotes from the case. Do not include analysis or recommendations.";
        const userPrompt = `Extract the strongest evidence from this case study:\n\n--- CASE STUDY CONTEXT ---\n${caseContent}`;
        const responseText = await this._generateResponse(systemPrompt, userPrompt, true);

        try {
            let cleanText = responseText.replace(/```json|```/gi, '').trim();
            const firstBracket = cleanText.indexOf('[');
            const lastBracket = cleanText.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                cleanText = cleanText.substring(firstBracket, lastBracket + 1);
            }

            const extracted = JSON.parse(cleanText);
            return Array.isArray(extracted)
                ? extracted.map(item => typeof item === 'string' ? item : item.text).filter(Boolean)
                : [];
        } catch {
            console.error('Failed to parse Ollama evidence response:', responseText);
            throw new Error('Invalid JSON format returned from LLM. Response was: ' + responseText);
        }
    }

    async draftFinalSubmission({ caseContent, guidedDraft, mapSummary }) {
        const systemPrompt = "You are a case-solving writing assistant.\nCreate a concise final submission using the learner's guided answers. Do not invent facts. Use clear paragraphs. Return plain text only, no markdown fences.";
        const userPrompt = [
            `--- CASE STUDY CONTEXT ---`,
            caseContent,
            ``,
            `--- GUIDED ANSWERS ---`,
            `Main Problem: ${guidedDraft.main_problem || ''}`,
            `Evidence: ${(guidedDraft.evidence || []).join('; ')}`,
            `Root Causes: ${(guidedDraft.root_causes || []).join('; ')}`,
            `Possible Solutions: ${(guidedDraft.possible_solutions || []).join('; ')}`,
            `Recommendation: ${guidedDraft.recommendation || ''}`,
            `Justification: ${guidedDraft.justification || ''}`,
            ``,
            `--- CONCEPT MAP SUMMARY ---`,
            mapSummary || '',
            ``,
            `Write the learner's final submission in 2 to 4 focused paragraphs.`
        ].join('\n');

        return this._generateResponse(systemPrompt, userPrompt);
    }

    async generateStepHelp({ caseContent, stepKey, stepType, stepTitle, stepHelper, currentDraft }) {
        let isList = stepType === 'list';
        
        let systemPrompt = `You are an expert case-solving assistant helping a student with the "${stepTitle}" step.`;
        if (isList) {
            systemPrompt += `\nReturn STRICTLY a JSON array of 1 to 3 short strings. Do not include introductory text.`;
        } else {
            systemPrompt += `\nReturn a plain text paragraph providing a suggestion or insight. Do not include markdown fences.`;
        }
        
        let userPrompt = `--- CASE STUDY CONTEXT ---\n${caseContent}\n\n`;
        userPrompt += `--- CURRENT STEP: ${stepTitle} ---\n`;
        userPrompt += `Goal: ${stepHelper}\n\n`;
        
        if (currentDraft && ((Array.isArray(currentDraft) && currentDraft.length > 0) || (!Array.isArray(currentDraft) && currentDraft.trim().length > 0))) {
            userPrompt += `Student's current progress for this step:\n${JSON.stringify(currentDraft)}\n\n`;
            userPrompt += `Provide *additional* helpful insights, evidence, or suggestions without simply repeating what the student has already written.`;
        } else {
            userPrompt += `The student hasn't started this step yet. Provide a helpful suggestion or key points to consider based on the case study context.`;
        }

        const responseText = await this._generateResponse(systemPrompt, userPrompt, isList);

        if (isList) {
            try {
                let cleanText = responseText.replace(/```json|```/gi, '').trim();
                const firstBracket = cleanText.indexOf('[');
                const lastBracket = cleanText.lastIndexOf(']');
                if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                    cleanText = cleanText.substring(firstBracket, lastBracket + 1);
                }

                let extracted = JSON.parse(cleanText);
                
                // If it's an object wrapping an array, try to find the array
                if (extracted && typeof extracted === 'object' && !Array.isArray(extracted)) {
                    const possibleArrays = Object.values(extracted).filter(val => Array.isArray(val));
                    if (possibleArrays.length > 0) {
                        extracted = possibleArrays[0];
                    }
                }

                if (Array.isArray(extracted)) {
                    return extracted.map(item => {
                        if (typeof item === 'string') return item;
                        if (typeof item === 'object' && item !== null) {
                            // Extract just the values if it's an object
                            const values = Object.values(item).filter(v => typeof v === 'string');
                            return values.length > 0 ? values[0] : JSON.stringify(item);
                        }
                        return String(item);
                    }).filter(Boolean);
                }
                
                // If we got here and couldn't resolve an array, force fallback
                throw new Error("No array found in JSON");
            } catch {
                console.error('Failed to parse Ollama step help JSON response:', responseText);
                // Try to loosely extract lines that look like a list if JSON fails
                const lines = responseText.split('\n')
                    // remove brackets, braces, bullet points, leading numbers, and quotes:
                    .map(line => line.replace(/^[\*\-\d\.\s"\[\{\(]+|[\]\}\)",]+$/g, '').trim())
                    .filter(line => line.length > 5);
                
                if (lines.length > 0) return lines;
                
                return [responseText.replace(/```json|```/gi, '').trim()];
            }
        } else {
            return responseText.replace(/```html|```/g, '').trim();
        }
    }
}

module.exports = OllamaProvider;
