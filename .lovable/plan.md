

## Fix AI Job Parsing Failures

### Problem Analysis

The `parse-job-post` edge function is failing because the AI returns malformed JSON. From the logs:

```
"requirements": [
  "A data-driven approach combined with the \"people-first\" empathy"
 Shalal",  ← Stray text "Shalal" corrupted the JSON array
```

The AI included random text from the original job post inside the JSON structure, making it unparseable.

---

### Root Cause

1. **No JSON repair logic**: When `JSON.parse()` fails, the function immediately returns an error
2. **No retry mechanism**: A single AI call failure = complete failure
3. **Generic error message**: User sees "Parse failed" with no actionable next steps

---

### Solution

Implement a robust JSON recovery and retry system in the edge function:

**File: `supabase/functions/parse-job-post/index.ts`**

#### 1. Add JSON Repair Function

```typescript
function repairJSON(malformedJSON: string): string | null {
  let cleaned = malformedJSON;
  
  // Remove any text outside the main JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  
  // Fix common array issues - remove stray text between array elements
  // Pattern: text that's not a proper string/comma between array brackets
  cleaned = cleaned.replace(/"\s*\n\s*[^"\[\],{}\n]+\s*"/g, '", "');
  
  // Fix unclosed strings in arrays
  cleaned = cleaned.replace(/"\s*\n\s*\]/g, '"]');
  
  // Fix trailing commas before closing brackets
  cleaned = cleaned.replace(/,\s*\]/g, ']');
  cleaned = cleaned.replace(/,\s*\}/g, '}');
  
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    return null;
  }
}
```

#### 2. Update Parse Logic with Retry

```typescript
let parsedData;
let parseAttempts = 0;
const maxAttempts = 2;

while (parseAttempts < maxAttempts) {
  try {
    parsedData = JSON.parse(parsedContent);
    break; // Success!
  } catch (parseError) {
    parseAttempts++;
    console.error(`Parse attempt ${parseAttempts} failed:`, parseError);
    
    // Try to repair the JSON
    const repaired = repairJSON(parsedContent);
    if (repaired) {
      parsedContent = repaired;
      console.log("JSON repaired successfully");
      continue;
    }
    
    // If repair failed and we have retries left, call AI again
    if (parseAttempts < maxAttempts) {
      console.log("Retrying AI call with stricter prompt...");
      // Make another AI call with stricter prompt
      const retryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt + "\n\nCRITICAL: Return ONLY valid JSON. No extra text." },
            { role: "user", content: userPrompt },
          ],
        }),
      });
      
      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        parsedContent = retryData.choices?.[0]?.message?.content?.trim() || "";
        // Clean markdown again
        if (parsedContent.startsWith("```json")) parsedContent = parsedContent.slice(7);
        if (parsedContent.startsWith("```")) parsedContent = parsedContent.slice(3);
        if (parsedContent.endsWith("```")) parsedContent = parsedContent.slice(0, -3);
        parsedContent = parsedContent.trim();
      }
    }
  }
}

if (!parsedData) {
  console.error("All parse attempts failed, raw content:", parsedContent);
  return new Response(
    JSON.stringify({ 
      error: "AI returned malformed data. Please try again or enter job details manually.",
      rawContent: parsedContent.substring(0, 500) // For debugging
    }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

#### 3. Add Tool Call for Structured Output (Most Robust)

Use tool/function calling to force structured JSON output:

```typescript
body: JSON.stringify({
  model: "google/gemini-2.5-flash",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ],
  tools: [{
    type: "function",
    function: {
      name: "extract_job_data",
      description: "Extract structured job posting data",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          company_name: { type: "string" },
          // ... all other fields
        },
        required: ["title", "company_name", "description"]
      }
    }
  }],
  tool_choice: { type: "function", function: { name: "extract_job_data" } }
})
```

---

### Client-Side Improvement

**File: `src/components/dashboard/JobsManager.tsx`**

Improve error handling with more specific messaging:

```typescript
} catch (error: any) {
  const message = error?.message || "Parse failed";
  if (message.includes("malformed")) {
    toast.error("AI couldn't parse this format. Please try a cleaner job post or enter manually.");
  } else if (message.includes("quota") || message.includes("402")) {
    toast.error("AI service temporarily unavailable. Please enter job details manually.");
  } else {
    toast.error("Parse failed. Please try again or enter manually.");
  }
}
```

---

### Implementation Summary

| Priority | Change | File | Description |
|----------|--------|------|-------------|
| CRITICAL | Add JSON repair function | `parse-job-post/index.ts` | Attempt to fix malformed JSON before failing |
| CRITICAL | Add retry with stricter prompt | `parse-job-post/index.ts` | Retry AI call if JSON parse fails |
| HIGH | Use tool calling | `parse-job-post/index.ts` | Force structured output from AI |
| MEDIUM | Better error messages | `JobsManager.tsx` | Guide user to manual entry on failure |

---

### Expected Outcomes

1. **Fewer failures**: JSON repair catches common AI output errors
2. **Auto-recovery**: Retry mechanism handles transient AI issues
3. **Better UX**: Clear error messages guide users to manual fallback
4. **Debugging**: Raw content logged for troubleshooting

