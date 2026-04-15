const caseContent = "On October 15, 2023, there was a major operational bottleneck in the deployment process leading to a 15% drop in performance due to manual ledger entries.";

fetch('http://localhost:4000/api/ai/concepts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseContent })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
