/**
 * Quiz Parser Utility
 * Parses AI-generated quiz text into structured question objects
 */

export interface ParsedQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
}

/**
 * Parses various AI-generated quiz formats into structured questions
 * 
 * Supported formats:
 * 1. Numbered format:
 *    1. What is...?
 *    A) Option A
 *    B) Option B
 *    C) Option C
 *    D) Option D
 *    Correct: B
 *    Explanation: Because...
 * 
 * 2. JSON format:
 *    [{ "question": "...", "options": {...}, "correct": "B", "explanation": "..." }]
 */
export function parseAIQuiz(text: string): ParsedQuestion[] {
  // Try JSON first
  try {
    const jsonData = JSON.parse(text.trim());
    if (Array.isArray(jsonData)) {
      return jsonData.map(parseJsonQuestion).filter(q => q !== null) as ParsedQuestion[];
    }
  } catch {
    // Not JSON, continue with text parsing
  }

  // Try text format parsing
  return parseTextFormat(text);
}

function parseJsonQuestion(q: any): ParsedQuestion | null {
  try {
    const question = q.question || q.question_text || q.text || '';
    if (!question) return null;

    // Handle various option formats
    let optionA = '', optionB = '', optionC = '', optionD = '';
    
    if (q.options) {
      if (Array.isArray(q.options)) {
        optionA = q.options[0] || '';
        optionB = q.options[1] || '';
        optionC = q.options[2] || '';
        optionD = q.options[3] || '';
      } else {
        optionA = q.options.A || q.options.a || q.options['0'] || '';
        optionB = q.options.B || q.options.b || q.options['1'] || '';
        optionC = q.options.C || q.options.c || q.options['2'] || '';
        optionD = q.options.D || q.options.d || q.options['3'] || '';
      }
    } else {
      optionA = q.option_a || q.optionA || q.a || '';
      optionB = q.option_b || q.optionB || q.b || '';
      optionC = q.option_c || q.optionC || q.c || '';
      optionD = q.option_d || q.optionD || q.d || '';
    }

    const correct = (q.correct || q.correct_answer || q.answer || 'A').toString().toUpperCase().charAt(0);
    const explanation = q.explanation || q.reason || '';

    return {
      question_text: question,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_answer: ['A', 'B', 'C', 'D'].includes(correct) ? correct : 'A',
      explanation,
    };
  } catch {
    return null;
  }
}

function parseTextFormat(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  
  // Split by question numbers (1., 2., etc.) or "Question X"
  const questionBlocks = text.split(/(?=(?:^|\n)(?:\d+[\.\)]\s|Question\s+\d+))/i).filter(Boolean);

  for (const block of questionBlocks) {
    const parsed = parseQuestionBlock(block);
    if (parsed) {
      questions.push(parsed);
    }
  }

  return questions;
}

function parseQuestionBlock(block: string): ParsedQuestion | null {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 5) return null;

  // Extract question text (first line, remove number prefix)
  const questionLine = lines[0].replace(/^(?:\d+[\.\)]\s*|Question\s+\d+[:\.\)]*\s*)/i, '').trim();
  if (!questionLine) return null;

  let optionA = '', optionB = '', optionC = '', optionD = '';
  let correctAnswer = 'A';
  let explanation = '';

  for (const line of lines.slice(1)) {
    // Match options: A), A., (A), A:
    const optionMatch = line.match(/^(?:\(?([ABCD])\)|\s*([ABCD])[\.\):])\s*(.+)/i);
    if (optionMatch) {
      const letter = (optionMatch[1] || optionMatch[2]).toUpperCase();
      const text = optionMatch[3].trim();
      switch (letter) {
        case 'A': optionA = text; break;
        case 'B': optionB = text; break;
        case 'C': optionC = text; break;
        case 'D': optionD = text; break;
      }
      continue;
    }

    // Match correct answer: "Correct: B", "Answer: B", "Correct Answer: B"
    const correctMatch = line.match(/^(?:Correct(?:\s+Answer)?|Answer)\s*[:=]\s*([ABCD])/i);
    if (correctMatch) {
      correctAnswer = correctMatch[1].toUpperCase();
      continue;
    }

    // Match explanation
    const explMatch = line.match(/^(?:Explanation|Reason)\s*[:=]\s*(.+)/i);
    if (explMatch) {
      explanation = explMatch[1].trim();
      continue;
    }
  }

  // Validate we have at least 2 options
  const optionCount = [optionA, optionB, optionC, optionD].filter(Boolean).length;
  if (optionCount < 2) return null;

  return {
    question_text: questionLine,
    option_a: optionA,
    option_b: optionB,
    option_c: optionC,
    option_d: optionD,
    correct_answer: correctAnswer,
    explanation,
  };
}

/**
 * Validates parsed questions
 */
export function validateParsedQuestions(questions: ParsedQuestion[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (questions.length === 0) {
    errors.push("No questions could be parsed from the input");
    return { valid: false, errors };
  }

  questions.forEach((q, i) => {
    if (!q.question_text) {
      errors.push(`Question ${i + 1}: Missing question text`);
    }
    if (!q.option_a || !q.option_b) {
      errors.push(`Question ${i + 1}: Must have at least 2 options (A and B)`);
    }
  });

  return { valid: errors.length === 0, errors };
}
