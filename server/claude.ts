import Anthropic from '@anthropic-ai/sdk';
import { query } from './db.js';
import type { Response } from 'express';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the Principal Engineer for StelarBIM. Your role is to create detailed implementation plans for BIM software tasks. Given a goal and project context, produce:
1) A numbered implementation plan
2) A file map of what will be touched
3) Edge cases to watch
4) A test plan
5) Rollback notes
Be concrete and BIM-domain aware.`;

export async function runClaudePlanningLane(
  taskId: string,
  goal: string,
  projectContext: string,
  res: Response
) {
  // Create task_run record
  const runResult = await query(
    `INSERT INTO task_runs (task_id, model_name, provider, status) VALUES ($1, $2, $3, $4) RETURNING id`,
    [taskId, 'claude-sonnet-4-5', 'anthropic', 'running']
  );
  const runId = runResult.rows[0].id;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const startTime = Date.now();
  let fullText = '';
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Project context: ${projectContext}\n\nGoal: ${goal}`
        }
      ]
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const text = chunk.delta.text;
        fullText += text;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: text })}\n\n`);
      }
      if (chunk.type === 'message_delta' && chunk.usage) {
        outputTokens = chunk.usage.output_tokens;
      }
      if (chunk.type === 'message_start' && chunk.message.usage) {
        inputTokens = chunk.message.usage.input_tokens;
      }
    }

    const latencyMs = Date.now() - startTime;
    // Rough cost: claude-sonnet input $3/1M, output $15/1M
    const costUsd = (inputTokens * 3 + outputTokens * 15) / 1_000_000;

    await query(
      `UPDATE task_runs SET status=$1, latency_ms=$2, token_input=$3, token_output=$4, cost_usd=$5, output_summary=$6 WHERE id=$7`,
      ['completed', latencyMs, inputTokens, outputTokens, costUsd, fullText.slice(0, 500), runId]
    );

    res.write(`data: ${JSON.stringify({ type: 'done', runId, latency_ms: latencyMs, token_input: inputTokens, token_output: outputTokens, cost_usd: costUsd })}\n\n`);
    res.end();
  } catch (err: any) {
    await query(`UPDATE task_runs SET status='failed' WHERE id=$1`, [runId]);
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  }

  return runId;
}
