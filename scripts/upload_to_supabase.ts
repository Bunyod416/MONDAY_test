import { createClient } from '@supabase/supabase-js';
import { questions } from '../src/utils/data/questions';

const supabaseUrl = 'https://hykqlcvrmfieaosnlrlj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a3FsY3ZybWZpZWFvc25scmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzgwMjMsImV4cCI6MjEwMzE1NDAyM30.v8cD7ChpyB66ubr3V0p9XFRrHL3AOujrRPPYy75L2GA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function upload() {
  console.log(`Uploading ${questions.length} questions to Supabase...`);

  const records = questions.map((q: any) => ({
    id: q.id,
    type: q.type,
    category: q.category,
    topic: q.topic,
    question: q.question,
    options: q.options || null,
    answer: q.answer !== undefined ? String(q.answer) : null,
    hint: q.hint || null,
    points: q.points || 1,
    placeholder: q.placeholder || null,
    accepted: q.accepted || null,
    tokens: q.tokens || null,
    correct_order: q.correctOrder || null,
    broken_code: q.brokenCode || null
  }));

  const { data, error } = await supabase.from('questions').upsert(records, { onConflict: 'id' });

  if (error) {
    console.error('Upload failed:', error);
  } else {
    console.log('Successfully uploaded all 120 questions to Supabase!');
  }
}

upload();
