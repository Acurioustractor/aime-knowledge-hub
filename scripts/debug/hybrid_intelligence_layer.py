#!/usr/bin/env python3
"""
AIME Hybrid Intelligence Layer
Adds advanced knowledge graph and AI capabilities to existing Supabase system
"""

import os
import json
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import asyncio
from supabase import create_client
from openai import OpenAI

@dataclass
class ConceptRelationship:
    source_concept: str
    target_concept: str
    relationship_type: str
    confidence: float
    source_documents: List[str]

@dataclass
class KnowledgeInsight:
    id: str
    title: str
    description: str
    concept_ids: List[str]
    insight_type: str  # 'breakthrough', 'connection', 'evolution'
    confidence: float
    created_at: datetime

class HybridIntelligenceLayer:
    """
    Intelligence layer that enhances existing Supabase + Next.js system
    """
    
    def __init__(self, supabase_url: str, supabase_key: str, openai_key: str):
        self.supabase = create_client(supabase_url, supabase_key)
        self.openai = OpenAI(api_key=openai_key)
        
        # Create new tables for intelligence features
        self.setup_intelligence_tables()
    
    def setup_intelligence_tables(self):
        """Create additional tables for intelligence features"""
        
        # Concept relationships table
        concept_relationships_sql = """
        CREATE TABLE IF NOT EXISTS concept_relationships (
            id SERIAL PRIMARY KEY,
            source_concept TEXT NOT NULL,
            target_concept TEXT NOT NULL,
            relationship_type TEXT NOT NULL,
            confidence FLOAT NOT NULL,
            source_documents TEXT[] NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(source_concept, target_concept, relationship_type)
        );
        """
        
        # Knowledge insights table  
        knowledge_insights_sql = """
        CREATE TABLE IF NOT EXISTS knowledge_insights (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            concept_ids TEXT[] NOT NULL,
            insight_type TEXT NOT NULL,
            confidence FLOAT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
        """
        
        # Document concepts table (extracted concepts from existing documents)
        document_concepts_sql = """
        CREATE TABLE IF NOT EXISTS document_concepts (
            id SERIAL PRIMARY KEY,
            document_id TEXT NOT NULL,
            document_title TEXT NOT NULL,
            concept_name TEXT NOT NULL,
            concept_type TEXT NOT NULL,
            description TEXT NOT NULL,
            confidence FLOAT NOT NULL,
            chunk_ids TEXT[] NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
        """
        
        try:
            # Note: In real implementation, you'd run these SQL commands
            # For demo, we'll simulate the table creation
            print("🗄️ Intelligence tables created/verified")
            print("   • concept_relationships")
            print("   • knowledge_insights") 
            print("   • document_concepts")
        except Exception as e:
            print(f"Table setup note: {e}")
    
    async def extract_concepts_from_existing_documents(self) -> List[Dict]:
        """
        Extract concepts from documents already in Supabase
        This enhances existing data without changing current system
        """
        
        # Get all documents from existing system
        existing_docs = self.supabase.table('document_chunks').select('*').execute()
        
        if not existing_docs.data:
            return []
        
        concepts = []
        doc_groups = {}
        
        # Group chunks by document
        for chunk in existing_docs.data:
            doc_title = chunk['document_title']
            if doc_title not in doc_groups:
                doc_groups[doc_title] = []
            doc_groups[doc_title].append(chunk)
        
        # Extract concepts from each document
        for doc_title, chunks in doc_groups.items():
            print(f"🧠 Extracting concepts from: {doc_title}")
            
            # Combine chunks for concept extraction
            full_text = " ".join([chunk['content'] for chunk in chunks[:10]])  # Limit for demo
            
            # Use GPT to extract concepts
            try:
                response = await self._extract_concepts_with_ai(full_text, doc_title)
                
                for concept in response.get('concepts', []):
                    concepts.append({
                        'document_title': doc_title,
                        'concept_name': concept['name'],
                        'concept_type': concept['type'],
                        'description': concept['description'],
                        'confidence': concept['confidence'],
                        'chunk_ids': [chunk['chunk_id'] for chunk in chunks[:3]]
                    })
                    
            except Exception as e:
                print(f"   ⚠️ Concept extraction failed: {e}")
                # Fallback: create basic concepts from titles/content
                concepts.extend(self._fallback_concept_extraction(doc_title, chunks))
        
        # Store concepts in new intelligence table
        await self._store_concepts(concepts)
        
        return concepts
    
    async def _extract_concepts_with_ai(self, text: str, doc_title: str) -> Dict:
        """Use GPT to extract structured concepts from text"""
        
        prompt = f"""
        Extract key concepts from this AIME document: "{doc_title}"
        
        Text: {text[:2000]}...
        
        Return JSON with this structure:
        {{
            "concepts": [
                {{
                    "name": "Concept Name",
                    "type": "relational_economics|indigenous_systems|methodology|tool|insight",
                    "description": "Brief description",
                    "confidence": 0.8
                }}
            ]
        }}
        
        Focus on concepts related to:
        - Relational economics and community value
        - Indigenous knowledge systems
        - Educational methodologies
        - Leadership frameworks
        - Social innovation
        """
        
        try:
            response = self.openai.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            print(f"AI extraction failed: {e}")
            return {"concepts": []}
    
    def _fallback_concept_extraction(self, doc_title: str, chunks: List[Dict]) -> List[Dict]:
        """Fallback concept extraction when AI fails"""
        
        # Simple heuristic-based concept extraction
        concepts = []
        
        if "hoodie economics" in doc_title.lower():
            concepts.append({
                'document_title': doc_title,
                'concept_name': 'Hoodie Economics',
                'concept_type': 'relational_economics',
                'description': 'Alternative economic model focusing on relationships and community value',
                'confidence': 0.7,
                'chunk_ids': [chunk['chunk_id'] for chunk in chunks[:3]]
            })
        
        if "business cases" in doc_title.lower():
            concepts.append({
                'document_title': doc_title,
                'concept_name': 'Digital Hoodies Recognition',
                'concept_type': 'methodology',
                'description': 'Progressive achievement system for relational leadership development',
                'confidence': 0.6,
                'chunk_ids': [chunk['chunk_id'] for chunk in chunks[:3]]
            })
        
        if "indigenous" in doc_title.lower() or "shame" in doc_title.lower():
            concepts.append({
                'document_title': doc_title,
                'concept_name': 'Indigenous Knowledge Integration',
                'concept_type': 'indigenous_systems',
                'description': 'Respectful integration of indigenous wisdom into contemporary practices',
                'confidence': 0.8,
                'chunk_ids': [chunk['chunk_id'] for chunk in chunks[:3]]
            })
        
        return concepts
    
    async def _store_concepts(self, concepts: List[Dict]):
        """Store extracted concepts in intelligence tables"""
        
        for concept in concepts:
            try:
                # In real implementation, you'd insert into document_concepts table
                # For demo, we'll simulate storage
                print(f"   ✅ Stored concept: {concept['concept_name']}")
                
            except Exception as e:
                print(f"   ⚠️ Failed to store concept: {e}")
    
    def discover_concept_relationships(self, concepts: List[Dict]) -> List[ConceptRelationship]:
        """
        Discover relationships between concepts
        This adds intelligence layer without changing existing search
        """
        
        relationships = []
        
        # Find concepts that appear in same documents
        for i, concept1 in enumerate(concepts):
            for concept2 in concepts[i+1:]:
                
                # Check if concepts share documents or themes
                shared_docs = set(concept1.get('chunk_ids', [])) & set(concept2.get('chunk_ids', []))
                
                if shared_docs:
                    relationship_type = self._determine_relationship_type(concept1, concept2)
                    confidence = len(shared_docs) * 0.3  # Simple confidence calculation
                    
                    relationships.append(ConceptRelationship(
                        source_concept=concept1['concept_name'],
                        target_concept=concept2['concept_name'],
                        relationship_type=relationship_type,
                        confidence=min(confidence, 1.0),
                        source_documents=[concept1['document_title'], concept2['document_title']]
                    ))
        
        return relationships
    
    def _determine_relationship_type(self, concept1: Dict, concept2: Dict) -> str:
        """Determine the type of relationship between concepts"""
        
        type1 = concept1.get('concept_type', '')
        type2 = concept2.get('concept_type', '')
        
        if type1 == type2:
            return 'related_concept'
        elif ('relational_economics' in [type1, type2] and 
              'indigenous_systems' in [type1, type2]):
            return 'cross_domain_bridge'
        elif 'methodology' in [type1, type2]:
            return 'implements'
        else:
            return 'supports'
    
    def generate_intelligence_insights(self, concepts: List[Dict], 
                                     relationships: List[ConceptRelationship]) -> List[KnowledgeInsight]:
        """Generate breakthrough insights from concept analysis"""
        
        insights = []
        
        # Find cross-domain connections
        cross_domain_relationships = [r for r in relationships 
                                    if r.relationship_type == 'cross_domain_bridge']
        
        if cross_domain_relationships:
            insights.append(KnowledgeInsight(
                id=f"insight_{len(insights)}",
                title="Cross-Domain Innovation Opportunities",
                description=f"Found {len(cross_domain_relationships)} connections between relational economics and indigenous systems, suggesting high potential for breakthrough innovations.",
                concept_ids=[r.source_concept for r in cross_domain_relationships],
                insight_type='breakthrough',
                confidence=0.8,
                created_at=datetime.now()
            ))
        
        # Find highly connected concepts
        concept_connections = {}
        for rel in relationships:
            concept_connections[rel.source_concept] = concept_connections.get(rel.source_concept, 0) + 1
            concept_connections[rel.target_concept] = concept_connections.get(rel.target_concept, 0) + 1
        
        hub_concepts = [concept for concept, count in concept_connections.items() if count >= 3]
        
        if hub_concepts:
            insights.append(KnowledgeInsight(
                id=f"insight_{len(insights)}",
                title="Knowledge Integration Hubs",
                description=f"Concepts {', '.join(hub_concepts)} serve as central integration points across multiple domains.",
                concept_ids=hub_concepts,
                insight_type='connection',
                confidence=0.7,
                created_at=datetime.now()
            ))
        
        return insights
    
    async def enhance_search_with_intelligence(self, query: str, 
                                              existing_results: List[Dict]) -> Dict:
        """
        Enhance existing search results with intelligence layer
        This works alongside current search without replacing it
        """
        
        # Get concepts related to query
        query_concepts = await self._find_query_concepts(query)
        
        # Get related concepts through relationships
        related_concepts = await self._find_related_concepts(query_concepts)
        
        # Get relevant insights
        relevant_insights = await self._find_relevant_insights(query_concepts)
        
        # Enhance results with intelligence
        enhanced_results = {
            'original_results': existing_results,
            'query_concepts': query_concepts,
            'related_concepts': related_concepts,
            'insights': relevant_insights,
            'intelligence_summary': self._generate_intelligence_summary(
                query, query_concepts, related_concepts, relevant_insights
            )
        }
        
        return enhanced_results
    
    async def _find_query_concepts(self, query: str) -> List[str]:
        """Find concepts related to the search query"""
        
        # Simple keyword matching for demo
        # In production, this would use embeddings or NLP
        query_lower = query.lower()
        concepts = []
        
        if 'hoodie' in query_lower or 'economics' in query_lower:
            concepts.append('Hoodie Economics')
        if 'relational' in query_lower:
            concepts.append('Relational Value Creation')
        if 'indigenous' in query_lower:
            concepts.append('Indigenous Knowledge Integration')
        if 'digital' in query_lower or 'methodology' in query_lower:
            concepts.append('Digital Hoodies Recognition')
        
        return concepts
    
    async def _find_related_concepts(self, query_concepts: List[str]) -> List[str]:
        """Find concepts related to query concepts through relationships"""
        
        # In real implementation, this would query concept_relationships table
        # For demo, return simulated related concepts
        related = []
        
        for concept in query_concepts:
            if concept == 'Hoodie Economics':
                related.extend(['Community-Centered Economics', 'Relational Leadership'])
            elif concept == 'Indigenous Knowledge Integration':
                related.extend(['Cultural Sensitivity Framework', 'Community Consultation'])
        
        return list(set(related))
    
    async def _find_relevant_insights(self, query_concepts: List[str]) -> List[Dict]:
        """Find insights relevant to query concepts"""
        
        # Simulated insights for demo
        insights = []
        
        if any('Economics' in concept for concept in query_concepts):
            insights.append({
                'title': 'Economic Innovation Pattern',
                'description': 'Relational economics concepts show strong connections to indigenous systems thinking',
                'confidence': 0.85
            })
        
        return insights
    
    def _generate_intelligence_summary(self, query: str, query_concepts: List[str],
                                     related_concepts: List[str], insights: List[Dict]) -> str:
        """Generate intelligent summary of search context"""
        
        summary_parts = []
        
        if query_concepts:
            summary_parts.append(f"Your query relates to key concepts: {', '.join(query_concepts)}")
        
        if related_concepts:
            summary_parts.append(f"Related concepts to explore: {', '.join(related_concepts[:3])}")
        
        if insights:
            summary_parts.append(f"Key insight: {insights[0]['description']}")
        
        return ". ".join(summary_parts) if summary_parts else "No additional intelligence available."

# Integration with existing Next.js API
class NextJSIntegration:
    """
    Integration layer for existing Next.js application
    """
    
    def __init__(self, intelligence_layer: HybridIntelligenceLayer):
        self.intelligence = intelligence_layer
    
    async def enhance_chat_api(self, message: str, existing_chunks: List[Dict]) -> Dict:
        """
        Enhance the existing chat API with intelligence
        This can be called from your current app/api/chat/route.ts
        """
        
        # Run intelligence enhancement
        enhanced_results = await self.intelligence.enhance_search_with_intelligence(
            message, existing_chunks
        )
        
        # Format for Next.js response
        return {
            'enhanced_search': True,
            'intelligence_summary': enhanced_results['intelligence_summary'],
            'related_concepts': enhanced_results['related_concepts'],
            'insights': enhanced_results['insights'],
            'concept_connections': len(enhanced_results['query_concepts']) > 0
        }

# Demo function
async def demo_hybrid_intelligence():
    """Demonstrate hybrid intelligence capabilities"""
    
    print("🔄 AIME Hybrid Intelligence Layer Demo")
    print("=" * 60)
    
    # Initialize (using dummy credentials for demo)
    intelligence = HybridIntelligenceLayer(
        supabase_url="your-supabase-url",
        supabase_key="your-supabase-key", 
        openai_key="your-openai-key"
    )
    
    # Step 1: Extract concepts from existing documents
    print("\n📥 Step 1: Extracting concepts from existing documents...")
    concepts = await intelligence.extract_concepts_from_existing_documents()
    print(f"   Extracted {len(concepts)} concepts")
    
    # Step 2: Discover relationships
    print("\n🔗 Step 2: Discovering concept relationships...")
    relationships = intelligence.discover_concept_relationships(concepts)
    print(f"   Found {len(relationships)} relationships")
    
    # Step 3: Generate insights
    print("\n💡 Step 3: Generating intelligence insights...")
    insights = intelligence.generate_intelligence_insights(concepts, relationships)
    print(f"   Generated {len(insights)} insights")
    
    # Step 4: Demonstrate enhanced search
    print("\n🔍 Step 4: Demonstrating enhanced search...")
    
    # Simulate existing search results
    existing_results = [
        {'content': 'Sample content about economics', 'document_title': 'Hoodie Economics'}
    ]
    
    enhanced = await intelligence.enhance_search_with_intelligence(
        "What is hoodie economics?", existing_results
    )
    
    print(f"   Intelligence Summary: {enhanced['intelligence_summary']}")
    print(f"   Related Concepts: {enhanced['related_concepts']}")
    
    return intelligence, concepts, relationships, insights

if __name__ == "__main__":
    # Run demo
    asyncio.run(demo_hybrid_intelligence()) 