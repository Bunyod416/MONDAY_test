import fs from 'fs';
import path from 'path';
import { questions } from '../src/utils/data/questions';

function escapeCSV(val: unknown): string {
  if (val === undefined || val === null) return '';
  let str = '';
  if (typeof val === 'object') {
    str = JSON.stringify(val);
  } else {
    str = String(val);
  }
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const headers = [
  'id',
  'type',
  'category',
  'topic',
  'question',
  'options',
  'answer',
  'hint',
  'points',
  'placeholder',
  'accepted',
  'tokens',
  'correct_order',
  'broken_code'
];

const rows = questions.map((q: Record<string, unknown>) => {
  return [
    q.id,
    q.type,
    q.category,
    q.topic,
    q.question,
    q.options ? q.options : null,
    q.answer !== undefined ? q.answer : '',
    q.hint || '',
    q.points || 1,
    q.placeholder || '',
    q.accepted ? q.accepted : null,
    q.tokens ? q.tokens : null,
    q.correctOrder ? q.correctOrder : null,
    q.brokenCode || ''
  ];
});

const csvContent = [
  headers.join(','),
  ...rows.map(row => row.map(escapeCSV).join(','))
].join('\n');

fs.writeFileSync(path.resolve(process.cwd(), 'questions.csv'), csvContent, 'utf-8');
console.log('Successfully generated questions.csv');

fs.writeFileSync(
  path.resolve(process.cwd(), 'questions.json'),
  JSON.stringify(questions, null, 2),
  'utf-8'
);
console.log('Successfully generated questions.json');
