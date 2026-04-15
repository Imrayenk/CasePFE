(async () => {
    const caseContent = "On October 15, 2023, there was a major operational bottleneck in the deployment process leading to a 15% drop in performance due to manual ledger entries.";
    const systemPrompt = "You are an expert business analyst helping a student extract key concepts from a case study.\nReturn the result STRICTLY as a JSON array of objects. Example format: [{\"text\": \"operational bottlenecks\", \"category\": \"yellow\"}, {\"text\": \"15% behind schedule\", \"category\": \"blue\"}]\nRules: Extract exactly 3 to 5 key phrases. Assign 'yellow' for general notes/problems, and 'blue' for specific evidence/dates/facts.";

    const userPrompt = `Extract concepts from the following case study text:\n\n--- CASE STUDY CONTEXT ---\n${caseContent}`;

    const payload = {
        model: 'qwen2.5-coder:7b',
        system: systemPrompt,
        prompt: userPrompt,
        stream: false,
        format: "json"
    };

    const response = await fetch(`http://localhost:11434/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log("RAW LLM OUTPUT:", data.response);
})();
