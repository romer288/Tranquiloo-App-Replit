import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Curated high-quality research papers (manually selected top papers)
const SEED_PAPERS = [
  {
    topic: 'anxiety_disorders',
    title: 'Cognitive behavioral therapy for anxiety disorders: an update on the empirical evidence',
    authors: 'Hofmann SG, Smits JA',
    year: 2008,
    journal: 'Dialogues in Clinical Neuroscience',
    citationCount: 1847,
    abstract: 'Cognitive behavioral therapy (CBT) refers to a class of interventions that share the basic premise that mental disorders and psychological distress are maintained by cognitive factors. The core premise of this treatment approach is that maladaptive cognitions contribute to the maintenance of emotional distress and behavioral problems. This review provides a summary of the latest evidence for the efficacy of CBT for anxiety disorders, including panic disorder, agoraphobia, social anxiety disorder, generalized anxiety disorder, obsessive-compulsive disorder, and posttraumatic stress disorder.',
    source_url: 'https://pubmed.ncbi.nlm.nih.gov/18640499/'
  },
  {
    topic: 'depression_treatment',
    title: 'Cognitive therapy vs medications in the treatment of moderate to severe depression',
    authors: 'DeRubeis RJ, Hollon SD, Amsterdam JD',
    year: 2005,
    journal: 'Archives of General Psychiatry',
    citationCount: 892,
    abstract: 'Cognitive therapy and antidepressant medications are both efficacious treatments for depression. This study compared their efficacy in moderate to severe depression. Results showed cognitive therapy was as efficacious as medications and superior to placebo.',
    source_url: 'https://pubmed.ncbi.nlm.nih.gov/15809407/'
  },
  {
    topic: 'mindfulness_interventions',
    title: 'Mindfulness-based stress reduction and health benefits: A meta-analysis',
    authors: 'Grossman P, Niemann L, Schmidt S, Walach H',
    year: 2004,
    journal: 'Journal of Psychosomatic Research',
    citationCount: 4521,
    abstract: 'Meta-analysis of studies examining mindfulness-based stress reduction (MBSR) found consistent health benefits across diverse patient populations and healthy individuals, with effect sizes suggesting clinically meaningful improvements in psychological and physical health.',
    source_url: 'https://pubmed.ncbi.nlm.nih.gov/15256293/'
  },
  {
    topic: 'cbt_techniques',
    title: 'The efficacy of cognitive behavioral therapy: A review of meta-analyses',
    authors: 'Hofmann SG, Asnaani A, Vonk IJ, Sawyer AT, Fang A',
    year: 2012,
    journal: 'Cognitive Therapy and Research',
    citationCount: 3124,
    abstract: 'CBT is an effective treatment for various psychiatric disorders including depression, anxiety disorders, and PTSD. Meta-analyses show large effect sizes for CBT across multiple conditions, with effects maintained at follow-up.',
    source_url: 'https://pubmed.ncbi.nlm.nih.gov/23459093/'
  },
  {
    topic: 'stress_management',
    title: 'Stress management and resilience training among Department of Medicine faculty',
    authors: 'Sood A, Prasad K, Schroeder D, Varkey P',
    year: 2011,
    journal: 'Journal of General Internal Medicine',
    citationCount: 287,
    abstract: 'A brief mindfulness-based stress management and resiliency training program significantly improved quality of life, anxiety, and resilience among healthcare professionals.',
    source_url: 'https://pubmed.ncbi.nlm.nih.gov/21858602/'
  },
  {
    topic: 'sleep_mental_health',
    title: 'Cognitive behavioral therapy for insomnia: A meta-analysis',
    authors: 'Trauer JM, Qian MY, Doyle JS, Rajaratnam SM, Cunnington D',
    year: 2015,
    journal: 'Annals of Internal Medicine',
    citationCount: 634,
    abstract: 'CBT for insomnia is an effective treatment with durable effects. Meta-analysis of 20 studies showed significant improvements in sleep onset latency, wake after sleep onset, and sleep quality.',
    source_url: 'https://pubmed.ncbi.nlm.nih.gov/26054060/'
  },
  {
    topic: 'panic_disorder',
    title: 'Cognitive-behavioral therapy, imipramine, or their combination for panic disorder',
    authors: 'Barlow DH, Gorman JM, Shear MK, Woods SW',
    year: 2000,
    journal: 'JAMA',
    citationCount: 1245,
    abstract: 'CBT alone or combined with imipramine was effective for panic disorder. Six-month follow-up showed CBT produced more durable gains than medication alone.',
    source_url: 'https://pubmed.ncbi.nlm.nih.gov/10815122/'
  },
  {
    topic: 'social_anxiety',
    title: 'Cognitive-behavioral group therapy versus phenelzine therapy for social phobia',
    authors: 'Heimberg RG, Liebowitz MR, Hope DA',
    year: 1998,
    journal: 'Archives of General Psychiatry',
    citationCount: 987,
    abstract: 'Cognitive-behavioral group therapy was as effective as phenelzine for social phobia, with both treatments superior to placebo. CBT gains were better maintained at follow-up.',
    source_url: 'https://pubmed.ncbi.nlm.nih.gov/9750321/'
  },
  {
    topic: 'ptsd_trauma',
    title: 'Prolonged exposure, cognitive processing therapy, and relaxation for PTSD',
    authors: 'Resick PA, Nishith P, Weaver TL, Astin MC, Feuer CA',
    year: 2002,
    journal: 'Journal of Consulting and Clinical Psychology',
    citationCount: 1534,
    abstract: 'Both prolonged exposure and cognitive processing therapy were effective for PTSD in assault survivors, with gains maintained at 9-month follow-up.',
    source_url: 'https://pubmed.ncbi.nlm.nih.gov/12206292/'
  }
];

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

async function seedResearchPapers() {
  console.log('🌱 Seeding research papers database...\n');

  let successCount = 0;

  for (const paper of SEED_PAPERS) {
    try {
      console.log(`📄 Processing: ${paper.title.substring(0, 60)}...`);

      // Create contextual content for embedding
      const contextualContent = `
Title: ${paper.title}
Authors: ${paper.authors}
Year: ${paper.year}
Journal: ${paper.journal}
Citations: ${paper.citationCount}
Topic: ${paper.topic}

Abstract: ${paper.abstract}

Key findings: This ${paper.topic.replace('_', ' ')} research demonstrates evidence-based interventions with ${paper.citationCount} citations.
      `.trim();

      // Generate embedding
      console.log('  Generating embedding...');
      const embedding = await generateEmbedding(contextualContent);

      // Store in database
      const { error } = await supabase.from('research_papers').insert({
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        topic: paper.topic,
        content: contextualContent,
        summary: `${paper.journal} (${paper.year}). Cited ${paper.citationCount} times. ${paper.abstract.substring(0, 200)}...`,
        embedding: embedding,
        source_url: paper.source_url,
      });

      if (error) {
        console.error(`  ❌ Error storing paper: ${error.message}`);
      } else {
        successCount++;
        console.log(`  ✅ Stored successfully\n`);
      }

      // Rate limit: wait 100ms between API calls
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error: any) {
      console.error(`  ❌ Error processing paper: ${error.message}\n`);
    }
  }

  console.log(`\n🎉 Successfully seeded ${successCount}/${SEED_PAPERS.length} research papers!`);
  console.log(`\n📊 These papers have an average of ${Math.round(SEED_PAPERS.reduce((sum, p) => sum + p.citationCount, 0) / SEED_PAPERS.length)} citations each.`);
}

seedResearchPapers().catch(console.error);
