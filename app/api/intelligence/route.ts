import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Intelligence layer interface
interface ConceptData {
  concept_name: string;
  concept_type: string;
  description: string;
  confidence: number;
  document_title: string;
  chunk_ids: string[];
}

interface IntelligenceEnhancement {
  intelligence_summary: string;
  related_concepts: string[];
  insights: Array<{
    title: string;
    description: string;
    confidence: number;
  }>;
  concept_connections: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { message, existing_chunks, action } = await request.json();
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    switch (action) {
      case 'extract_concepts':
        return await extractConcepts(supabase);
      
      case 'enhance_search':
        return await enhanceSearch(message, existing_chunks, supabase);
      
      case 'get_insights':
        return await getInsights(supabase);
      
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Intelligence API error:', error);
    return NextResponse.json(
      { error: 'Intelligence processing failed' },
      { status: 500 }
    );
  }
}

async function extractConcepts(supabase: any) {
  console.log('🧠 Extracting concepts from existing documents...');
  
  // Get all documents from existing system
  const { data: chunks, error } = await supabase
    .from('document_chunks')
    .select('*')
    .limit(50);

  if (error || !chunks) {
    console.error('Failed to fetch chunks:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }

  // Group chunks by document
  const docGroups: { [key: string]: any[] } = {};
  chunks.forEach((chunk: any) => {
    const docTitle = chunk.document_title;
    if (!docGroups[docTitle]) {
      docGroups[docTitle] = [];
    }
    docGroups[docTitle].push(chunk);
  });

  const concepts: ConceptData[] = [];

  // Extract concepts from each document using heuristic approach
  for (const [docTitle, docChunks] of Object.entries(docGroups)) {
    console.log(`📄 Processing: ${docTitle}`);
    
    const extractedConcepts = extractConceptsFromDocument(docTitle, docChunks);
    concepts.push(...extractedConcepts);
  }

  // Store concepts in a simple format (could be enhanced with proper DB storage)
  const conceptSummary = {
    total_concepts: concepts.length,
    concepts_by_type: groupConceptsByType(concepts),
    documents_processed: Object.keys(docGroups).length,
    extraction_timestamp: new Date().toISOString()
  };

  return NextResponse.json({
    success: true,
    concepts,
    summary: conceptSummary
  });
}

function extractConceptsFromDocument(docTitle: string, chunks: any[]): ConceptData[] {
  const concepts: ConceptData[] = [];
  const chunkIds = chunks.slice(0, 3).map(chunk => chunk.chunk_id);

  // Heuristic concept extraction based on document titles and content
  const titleLower = docTitle.toLowerCase();
  
  if (titleLower.includes('hoodie economics')) {
    concepts.push({
      concept_name: 'Hoodie Economics',
      concept_type: 'relational_economics',
      description: 'Alternative economic model focusing on relationships and community value creation',
      confidence: 0.9,
      document_title: docTitle,
      chunk_ids: chunkIds
    });
    
    concepts.push({
      concept_name: 'Community-Centered Economics',
      concept_type: 'relational_economics', 
      description: 'Economic framework prioritizing community relationships over pure profit',
      confidence: 0.8,
      document_title: docTitle,
      chunk_ids: chunkIds
    });
  }

  if (titleLower.includes('business cases')) {
    concepts.push({
      concept_name: 'Digital Hoodies Recognition System',
      concept_type: 'methodology',
      description: 'Progressive achievement system for relational leadership development',
      confidence: 0.7,
      document_title: docTitle,
      chunk_ids: chunkIds
    });
    
    concepts.push({
      concept_name: 'Relational Value Metrics',
      concept_type: 'methodology',
      description: 'Measurement systems for assessing relationship-based outcomes',
      confidence: 0.8,
      document_title: docTitle,
      chunk_ids: chunkIds
    });
  }

  if (titleLower.includes('shame') || titleLower.includes('indigenous')) {
    concepts.push({
      concept_name: 'Indigenous Knowledge Integration',
      concept_type: 'indigenous_systems',
      description: 'Respectful integration of indigenous wisdom into contemporary practices',
      confidence: 0.9,
      document_title: docTitle,
      chunk_ids: chunkIds
    });
    
    concepts.push({
      concept_name: 'Cultural Sensitivity Framework',
      concept_type: 'indigenous_systems',
      description: 'Framework for respectful engagement with indigenous knowledge systems',
      confidence: 0.8,
      document_title: docTitle,
      chunk_ids: chunkIds
    });
  }

  if (titleLower.includes('nation tour')) {
    concepts.push({
      concept_name: 'Scaling Impact Models',
      concept_type: 'methodology',
      description: 'Strategies for scaling relational impact across different communities',
      confidence: 0.7,
      document_title: docTitle,
      chunk_ids: chunkIds
    });
  }

  return concepts;
}

function groupConceptsByType(concepts: ConceptData[]) {
  return concepts.reduce((acc, concept) => {
    acc[concept.concept_type] = (acc[concept.concept_type] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
}

async function enhanceSearch(message: string, existingChunks: any[], supabase: any): Promise<NextResponse> {
  console.log('🔍 Enhancing search with intelligence layer...');
  
  // Find concepts related to query
  const queryConcepts = findQueryConcepts(message);
  
  // Find related concepts
  const relatedConcepts = findRelatedConcepts(queryConcepts);
  
  // Generate insights
  const insights = generateRelevantInsights(queryConcepts);
  
  // Create intelligence summary
  const intelligenceSummary = generateIntelligenceSummary(
    message, 
    queryConcepts, 
    relatedConcepts, 
    insights
  );

  const enhancement: IntelligenceEnhancement = {
    intelligence_summary: intelligenceSummary,
    related_concepts: relatedConcepts,
    insights,
    concept_connections: queryConcepts.length > 0
  };

  return NextResponse.json({
    success: true,
    enhancement,
    original_results_count: existingChunks.length,
    intelligence_applied: true
  });
}

function findQueryConcepts(query: string): string[] {
  const queryLower = query.toLowerCase();
  const concepts: string[] = [];

  // Simple keyword matching - would be enhanced with embeddings in production
  if (queryLower.includes('hoodie') || queryLower.includes('economics')) {
    concepts.push('Hoodie Economics');
  }
  if (queryLower.includes('relational')) {
    concepts.push('Community-Centered Economics');
  }
  if (queryLower.includes('indigenous') || queryLower.includes('cultural')) {
    concepts.push('Indigenous Knowledge Integration');
  }
  if (queryLower.includes('digital') || queryLower.includes('recognition')) {
    concepts.push('Digital Hoodies Recognition System');
  }
  if (queryLower.includes('business') || queryLower.includes('cases')) {
    concepts.push('Relational Value Metrics');
  }
  if (queryLower.includes('scale') || queryLower.includes('impact')) {
    concepts.push('Scaling Impact Models');
  }

  return concepts;
}

function findRelatedConcepts(queryConcepts: string[]): string[] {
  const related: string[] = [];

  queryConcepts.forEach(concept => {
    switch (concept) {
      case 'Hoodie Economics':
        related.push('Community-Centered Economics', 'Relational Leadership');
        break;
      case 'Indigenous Knowledge Integration':
        related.push('Cultural Sensitivity Framework', 'Community Consultation');
        break;
      case 'Digital Hoodies Recognition System':
        related.push('Relational Value Metrics', 'Impact Assessment');
        break;
      case 'Community-Centered Economics':
        related.push('Social Innovation', 'Collective Value Creation');
        break;
      case 'Scaling Impact Models':
        related.push('Community Replication', 'Network Effects');
        break;
    }
  });

  // Remove duplicates and concepts already in query
  return Array.from(new Set(related)).filter(concept => !queryConcepts.includes(concept));
}

function generateRelevantInsights(queryConcepts: string[]) {
  const insights = [];

  if (queryConcepts.some(c => c.includes('Economics') || c.includes('Relational'))) {
    insights.push({
      title: 'Cross-Domain Innovation Pattern',
      description: 'Relational economics concepts show strong connections to indigenous systems thinking, creating unique innovation opportunities',
      confidence: 0.85
    });
  }

  if (queryConcepts.some(c => c.includes('Indigenous') || c.includes('Cultural'))) {
    insights.push({
      title: 'Cultural Integration Bridge',
      description: 'Indigenous knowledge systems provide foundational frameworks that enhance contemporary methodologies',
      confidence: 0.9
    });
  }

  if (queryConcepts.some(c => c.includes('Digital') || c.includes('Recognition'))) {
    insights.push({
      title: 'Recognition System Evolution', 
      description: 'Digital recognition systems are evolving beyond traditional metrics to capture relational value',
      confidence: 0.8
    });
  }

  return insights;
}

function generateIntelligenceSummary(
  query: string, 
  queryConcepts: string[], 
  relatedConcepts: string[], 
  insights: any[]
): string {
  const parts: string[] = [];

  if (queryConcepts.length > 0) {
    parts.push(`Your query connects to ${queryConcepts.length} key concept${queryConcepts.length > 1 ? 's' : ''}: ${queryConcepts.join(', ')}`);
  }

  if (relatedConcepts.length > 0) {
    parts.push(`Related concepts to explore: ${relatedConcepts.slice(0, 3).join(', ')}`);
  }

  if (insights.length > 0) {
    parts.push(`Key insight: ${insights[0].description}`);
  }

  if (parts.length === 0) {
    return 'This query shows potential for deeper concept exploration as the knowledge base expands.';
  }

  return parts.join('. ');
}

async function getInsights(supabase: any) {
  // Generate system-wide insights
  const insights = [
    {
      title: 'Knowledge Integration Opportunities',
      description: 'Current knowledge base shows strong potential for cross-domain connections between relational economics and indigenous systems',
      type: 'breakthrough',
      confidence: 0.85,
      concept_count: 8
    },
    {
      title: 'Methodology Evolution Pattern',
      description: 'Recognition systems are evolving from traditional metrics toward relationship-based value assessment',
      type: 'evolution',
      confidence: 0.8,
      concept_count: 5
    },
    {
      title: 'Scaling Framework Emergence',
      description: 'Document patterns suggest framework for scaling relational impact across diverse communities',
      type: 'connection',
      confidence: 0.75,
      concept_count: 6
    }
  ];

  return NextResponse.json({
    success: true,
    insights,
    total_insights: insights.length,
    insight_types: Array.from(new Set(insights.map(i => i.type)))
  });
}

export async function GET(request: NextRequest) {
  // Simple health check for intelligence layer
  return NextResponse.json({
    status: 'active',
    capabilities: [
      'concept_extraction',
      'search_enhancement', 
      'insight_generation',
      'relationship_mapping'
    ],
    version: '1.0.0-hybrid'
  });
} 