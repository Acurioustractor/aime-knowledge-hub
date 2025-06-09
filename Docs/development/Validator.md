# AIME Knowledge Commons - Implementation Plan

## Project Overview
A relational knowledge validation system that transforms how AIME manages, validates, and shares information snippets across teams and communities.

## Technical Stack
- **Frontend**: React/Next.js (matching your existing app)
- **Backend**: Node.js/Express or Next.js API routes
- **Database**: PostgreSQL or MongoDB
- **Authentication**: Existing AIME auth system
- **Search**: Elasticsearch or Algolia
- **Real-time**: Socket.io or Pusher

## Project Structure
```
aime-knowledge-commons/
├── components/
│   ├── snippets/
│   │   ├── SnippetCard.tsx
│   │   ├── SnippetForm.tsx
│   │   ├── SnippetList.tsx
│   │   └── ValidationCircle.tsx
│   ├── bookmarks/
│   │   ├── BookmarkButton.tsx
│   │   ├── BookmarkList.tsx
│   │   └── SmartQuery.tsx
│   └── validation/
│       ├── VotingInterface.tsx
│       ├── ValidationStatus.tsx
│       └── ConsensusTracker.tsx
├── pages/
│   ├── api/
│   │   ├── snippets/
│   │   ├── bookmarks/
│   │   └── validation/
│   └── knowledge-commons/
│       ├── index.tsx
│       ├── snippet/[id].tsx
│       └── collections/[id].tsx
├── lib/
│   ├── db/
│   ├── validation/
│   └── search/
└── types/
```

## Phase 1: Database Schema & Core Models

### 1.1 Create Database Schema

```sql
-- snippets table
CREATE TABLE snippets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  source_document VARCHAR(255),
  source_page INTEGER,
  source_context TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'draft', -- draft, in_review, validated, contested
  validation_level INTEGER DEFAULT 0,
  tags TEXT[],
  query_triggers TEXT[],
  relationship_maps JSONB,
  metadata JSONB
);

-- bookmarks table
CREATE TABLE smart_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  query TEXT NOT NULL,
  filters JSONB,
  description TEXT,
  created_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- validations table
CREATE TABLE validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snippet_id UUID REFERENCES snippets(id),
  user_id UUID REFERENCES users(id),
  validation_type VARCHAR(50), -- staff, community, elder, expert
  vote INTEGER CHECK (vote IN (-1, 0, 1)), -- disagree, neutral, agree
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(snippet_id, user_id)
);

-- collections table
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- snippet_collections join table
CREATE TABLE snippet_collections (
  snippet_id UUID REFERENCES snippets(id),
  collection_id UUID REFERENCES collections(id),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (snippet_id, collection_id)
);
```

### 1.2 TypeScript Types

```typescript
// types/knowledge-commons.ts

export interface Snippet {
  id: string;
  content: string;
  source: {
    document: string;
    page?: number;
    date?: string;
    context?: string;
  };
  tags: string[];
  queryTriggers: string[];
  validations: {
    staff: number;
    community: number;
    elders: number;
    experts?: number;
  };
  relationshipMap: string[];
  status: 'draft' | 'in_review' | 'validated' | 'contested';
  createdBy: string;
  createdAt: Date;
  lastVerified?: Date;
  metadata?: Record<string, any>;
}

export interface SmartBookmark {
  id: string;
  name: string;
  query: string;
  filters?: {
    documentType?: string[];
    dateRange?: string;
    tags?: string[];
  };
  description?: string;
  isPublic: boolean;
  usageCount: number;
  lastUsed?: Date;
  createdBy: string;
}

export interface Validation {
  id: string;
  snippetId: string;
  userId: string;
  validationType: 'staff' | 'community' | 'elder' | 'expert';
  vote: -1 | 0 | 1;
  comment?: string;
  createdAt: Date;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  snippets: Snippet[];
  createdBy: string;
  isPublic: boolean;
}
```

## Phase 2: API Implementation

### 2.1 Snippet API Endpoints

```typescript
// pages/api/snippets/index.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      // Get snippets with filters
      const { status, tags, search } = req.query;
      const snippets = await prisma.snippet.findMany({
        where: {
          ...(status && { status }),
          ...(tags && { tags: { hasSome: tags as string[] } }),
          ...(search && {
            OR: [
              { content: { contains: search as string } },
              { tags: { hasSome: [search as string] } }
            ]
          })
        },
        include: {
          validations: true,
          creator: {
            select: { id: true, name: true, image: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return res.json(snippets);

    case 'POST':
      // Create new snippet
      const { content, source, tags, queryTriggers } = req.body;
      
      const snippet = await prisma.snippet.create({
        data: {
          content,
          sourceDocument: source.document,
          sourcePage: source.page,
          sourceContext: source.context,
          tags,
          queryTriggers,
          createdBy: session.user.id,
          status: 'draft'
        }
      });
      
      // Trigger validation workflow
      await triggerValidationWorkflow(snippet.id);
      
      return res.status(201).json(snippet);

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Validation workflow helper
async function triggerValidationWorkflow(snippetId: string) {
  // Send notifications to relevant validators
  // Create initial validation requests
  // Set up review timeline
}
```

### 2.2 Validation API

```typescript
// pages/api/snippets/[id]/validate.ts

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const { vote, comment, validationType } = req.body;
    
    // Check user's validation permissions
    const userRole = await getUserValidationRole(session.user.id);
    
    if (!canValidate(userRole, validationType)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Create or update validation
    const validation = await prisma.validation.upsert({
      where: {
        snippetId_userId: {
          snippetId: id as string,
          userId: session.user.id
        }
      },
      update: { vote, comment },
      create: {
        snippetId: id as string,
        userId: session.user.id,
        validationType,
        vote,
        comment
      }
    });
    
    // Check if snippet has reached validation threshold
    await checkValidationConsensus(id as string);
    
    return res.json(validation);
  }
}

async function checkValidationConsensus(snippetId: string) {
  const validations = await prisma.validation.findMany({
    where: { snippetId }
  });
  
  // Calculate validation scores by type
  const scores = {
    staff: 0,
    community: 0,
    elders: 0
  };
  
  validations.forEach(v => {
    if (v.vote === 1) {
      scores[v.validationType]++;
    }
  });
  
  // Update snippet status based on thresholds
  if (scores.staff >= 3 && scores.community >= 5) {
    await prisma.snippet.update({
      where: { id: snippetId },
      data: { 
        status: 'validated',
        lastVerified: new Date()
      }
    });
  }
}
```

### 2.3 Smart Bookmarks API

```typescript
// pages/api/bookmarks/index.ts

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  
  switch (req.method) {
    case 'GET':
      // Get user's bookmarks + public bookmarks
      const bookmarks = await prisma.smartBookmark.findMany({
        where: {
          OR: [
            { createdBy: session?.user.id },
            { isPublic: true }
          ]
        },
        orderBy: [
          { usageCount: 'desc' },
          { createdAt: 'desc' }
        ]
      });
      
      return res.json(bookmarks);

    case 'POST':
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const bookmark = await prisma.smartBookmark.create({
        data: {
          ...req.body,
          createdBy: session.user.id
        }
      });
      
      return res.status(201).json(bookmark);
  }
}

// pages/api/bookmarks/[id]/execute.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  
  if (req.method === 'POST') {
    const bookmark = await prisma.smartBookmark.findUnique({
      where: { id: id as string }
    });
    
    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    
    // Execute the search query
    const results = await executeSmartQuery(
      bookmark.query,
      bookmark.filters
    );
    
    // Update usage stats
    await prisma.smartBookmark.update({
      where: { id: id as string },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date()
      }
    });
    
    return res.json(results);
  }
}
```

## Phase 3: Frontend Components

### 3.1 Main Knowledge Commons Page

```tsx
// pages/knowledge-commons/index.tsx

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import SnippetList from '@/components/snippets/SnippetList';
import BookmarkList from '@/components/bookmarks/BookmarkList';
import ValidationQueue from '@/components/validation/ValidationQueue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function KnowledgeCommons() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('featured');
  const [snippets, setSnippets] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    fetchSnippets();
    fetchBookmarks();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        AIME Knowledge Commons - Living Truth System
      </h1>
      
      {/* Quick Access Bookmarks */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          🔍 Quick Access Bookmarks
        </h2>
        <BookmarkList 
          bookmarks={bookmarks}
          onExecute={handleBookmarkExecute}
        />
      </section>

      {/* Featured Truth of the Day */}
      <section className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">
          📌 Today's Featured Truth
        </h2>
        <FeaturedSnippet />
      </section>

      {/* Knowledge Streams */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="validation">Needs Validation</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>
        
        <TabsContent value="featured">
          <SnippetList 
            snippets={snippets.filter(s => s.status === 'validated')}
            showValidation={true}
          />
        </TabsContent>
        
        <TabsContent value="recent">
          <SnippetList 
            snippets={snippets}
            showValidation={true}
          />
        </TabsContent>
        
        <TabsContent value="validation">
          <ValidationQueue userId={session?.user.id} />
        </TabsContent>
        
        <TabsContent value="collections">
          <CollectionsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 3.2 Snippet Card Component

```tsx
// components/snippets/SnippetCard.tsx

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ValidationCircle from '../validation/ValidationCircle';
import { Snippet } from '@/types/knowledge-commons';

interface SnippetCardProps {
  snippet: Snippet;
  onValidate?: (vote: number) => void;
  showActions?: boolean;
}

export default function SnippetCard({ 
  snippet, 
  onValidate, 
  showActions = true 
}: SnippetCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100',
      in_review: 'bg-yellow-100',
      validated: 'bg-green-100',
      contested: 'bg-red-100'
    };
    return colors[status] || 'bg-gray-100';
  };
  
  const getValidationIcon = (level: number) => {
    if (level < 3) return '🌱'; // Seedling
    if (level < 10) return '🌿'; // Growing
    if (level < 20) return '🌳'; // Strong
    return '🌲'; // Ancient
  };

  return (
    <Card className={`mb-4 ${getStatusColor(snippet.status)}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-lg font-medium">{snippet.content}</p>
          </div>
          <div className="text-2xl ml-2">
            {getValidationIcon(
              snippet.validations.staff + 
              snippet.validations.community + 
              snippet.validations.elders
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="text-sm text-gray-600 mb-3">
          Source: {snippet.source.document} 
          {snippet.source.page && ` | Page ${snippet.source.page}`}
          {snippet.source.date && ` | ${snippet.source.date}`}
        </div>
        
        <ValidationCircle validations={snippet.validations} />
        
        {isExpanded && (
          <div className="mt-4">
            <div className="mb-2">
              <strong>Context:</strong> {snippet.source.context}
            </div>
            <div className="mb-2">
              <strong>Related to:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {snippet.relationshipMap.map((rel, i) => (
                  <Badge key={i} variant="outline">{rel}</Badge>
                ))}
              </div>
            </div>
            <div>
              <strong>Tags:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {snippet.tags.map((tag, i) => (
                  <Badge key={i}>{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      {showActions && (
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </Button>
            <Button size="sm" variant="outline">
              Use in Presentation
            </Button>
            <Button size="sm" variant="outline">
              Add to Business Case
            </Button>
          </div>
          
          {onValidate && snippet.status === 'in_review' && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => onValidate(-1)}
              >
                👎
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => onValidate(1)}
              >
                👍
              </Button>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
```

### 3.3 Validation Circle Component

```tsx
// components/validation/ValidationCircle.tsx

interface ValidationCircleProps {
  validations: {
    staff: number;
    community: number;
    elders: number;
    experts?: number;
  };
}

export default function ValidationCircle({ validations }: ValidationCircleProps) {
  const total = Object.values(validations).reduce((sum, val) => sum + val, 0);
  
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="w-20 h-20 relative">
          {/* Inner circle - Staff */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
              {validations.staff}
            </div>
          </div>
          
          {/* Middle circle - Community */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-green-500 opacity-60"></div>
          </div>
          
          {/* Outer circle - Elders */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border-4 border-purple-500 opacity-40"></div>
          </div>
        </div>
      </div>
      
      <div className="text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
          Staff: {validations.staff}
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
          Community: {validations.community}
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
          Elders: {validations.elders}
        </div>
      </div>
    </div>
  );
}
```

### 3.4 Smart Bookmark Component

```tsx
// components/bookmarks/SmartQuery.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Save, Share } from 'lucide-react';

export default function SmartQuery() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const executeQuery = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, filters })
      });
      const data = await response.json();
      setResults(data.results);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAsBookmark = async () => {
    const name = prompt('Name this bookmark:');
    if (!name) return;

    await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        query,
        filters,
        description: `Smart query for: ${query}`
      })
    });
    
    alert('Bookmark saved!');
  };

  return (
    <Card className="p-6">
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Enter your smart query (e.g., 'impact metrics from last 3 months')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && executeQuery()}
          className="flex-1"
        />
        <Button onClick={executeQuery} disabled={isLoading}>
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
        <Button onClick={saveAsBookmark} variant="outline">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>

      {/* Filter options */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select 
          className="border rounded px-3 py-1"
          onChange={(e) => setFilters({...filters, type: e.target.value})}
        >
          <option value="">All Types</option>
          <option value="metric">Metrics</option>
          <option value="case-study">Case Studies</option>
          <option value="methodology">Methodologies</option>
        </select>
        
        <select 
          className="border rounded px-3 py-1"
          onChange={(e) => setFilters({...filters, timeframe: e.target.value})}
        >
          <option value="">All Time</option>
          <option value="week">Past Week</option>
          <option value="month">Past Month</option>
          <option value="quarter">Past Quarter</option>
        </select>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Results ({results.length})</h3>
          {results.map((result, i) => (
            <SnippetCard key={i} snippet={result} showActions={false} />
          ))}
        </div>
      )}
    </Card>
  );
}
```

## Phase 4: Integration & Advanced Features

### 4.1 AI Assistant Integration

```typescript
// lib/ai-integration.ts

export async function extractSnippetsFromAI(aiResponse: string, context: any) {
  // Use AI to identify key facts and claims
  const snippets = await identifyKeyInformation(aiResponse);
  
  // Auto-populate source information
  return snippets.map(snippet => ({
    content: snippet.text,
    source: {
      document: context.document,
      page: context.page,
      date: new Date().toISOString(),
      context: context.query
    },
    tags: snippet.suggestedTags,
    queryTriggers: generateQueryTriggers(snippet.text),
    status: 'draft'
  }));
}

// Add to AI Assistant response handler
export async function handleAIResponse(response: string, context: any) {
  const snippets = await extractSnippetsFromAI(response, context);
  
  // Show UI to save snippets
  return {
    response,
    extractedSnippets: snippets,
    actions: [
      { label: 'Save All Snippets', action: 'save-all' },
      { label: 'Select Snippets', action: 'select' }
    ]
  };
}
```

### 4.2 Real-time Validation Updates

```typescript
// lib/websocket.ts

import { Server } from 'socket.io';

export function setupWebSocket(server: any) {
  const io = new Server(server);
  
  io.on('connection', (socket) => {
    // Join validation rooms
    socket.on('join-validation', (snippetId) => {
      socket.join(`validation:${snippetId}`);
    });
    
    // Broadcast validation updates
    socket.on('vote', async (data) => {
      const { snippetId, vote, userId } = data;
      
      // Update in database
      await updateValidation(snippetId, userId, vote);
      
      // Broadcast to all watching
      io.to(`validation:${snippetId}`).emit('validation-update', {
        snippetId,
        newValidations: await getValidationCounts(snippetId)
      });
    });
  });
}
```

### 4.3 Export Integration

```typescript
// lib/export.ts

export async function exportToPresentation(snippetIds: string[]) {
  const snippets = await getSnippetsByIds(snippetIds);
  
  // Generate PowerPoint or Google Slides
  const presentation = {
    title: 'AIME Impact Evidence',
    slides: snippets.map((snippet, i) => ({
      title: `Key Insight ${i + 1}`,
      content: snippet.content,
      notes: `Source: ${snippet.source.document}`,
      validation: `Verified by ${snippet.validations.staff + snippet.validations.community} people`
    }))
  };
  
  return generatePPTX(presentation);
}

export async function exportToBusinessCase(collectionId: string) {
  const collection = await getCollection(collectionId);
  
  // Generate structured business case sections
  const sections = groupSnippetsByTheme(collection.snippets);
  
  return {
    executiveSummary: sections.impact,
    marketAnalysis: sections.market,
    socialReturn: sections.sroi,
    // ... etc
  };
}
```

## Phase 5: Deployment & Testing

### 5.1 Environment Variables

```bash
# .env.local

DATABASE_URL=postgresql://user:password@localhost:5432/aime_knowledge
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
ELASTICSEARCH_URL=http://localhost:9200
PUSHER_APP_ID=your-pusher-id
PUSHER_KEY=your-pusher-key
PUSHER_SECRET=your-pusher-secret
```

### 5.2 Migration Script

```bash
# scripts/migrate.sh

#!/bin/bash
echo "Running Knowledge Commons migrations..."

# Create database tables
npx prisma migrate dev --name init_knowledge_commons

# Seed initial bookmarks
npx ts-node scripts/seed-bookmarks.ts

# Import existing snippets from documents
npx ts-node scripts/import-snippets.ts

echo "Migration complete!"
```

### 5.3 Testing Strategy

```typescript
// __tests__/knowledge-commons.test.ts

describe('Knowledge Commons', () => {
  describe('Snippet Creation', () => {
    it('should extract snippets from AI responses', async () => {
      const aiResponse = "IMAGI-NATION aims to impact 50 million people";
      const snippets = await extractSnippetsFromAI(aiResponse, {
        document: 'Test Doc'
      });
      
      expect(snippets).toHaveLength(1);
      expect(snippets[0].content).toContain('50 million');
    });
  });
  
  describe('Validation Process', () => {
    it('should update status when consensus reached', async () => {
      const snippetId = 'test-123';
      
      // Add staff validations
      await addValidation(snippetId, 'user1', 'staff', 1);
      await addValidation(snippetId, 'user2', 'staff', 1);
      await addValidation(snippetId, 'user3', 'staff', 1);
      
      // Add community validations
      await addValidation(snippetId, 'user4', 'community', 1);
      await addValidation(snippetId, 'user5', 'community', 1);
      
      const snippet = await getSnippet(snippetId);
      expect(snippet.status).toBe('validated');
    });
  });
});
```

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Set up database schema
- [ ] Create basic API endpoints
- [ ] Build core UI components

### Week 3-4: Validation System
- [ ] Implement validation workflow
- [ ] Add real-time updates
- [ ] Create validation UI

### Week 5-6: Smart Bookmarks
- [ ] Build bookmark system
- [ ] Create search integration
- [ ] Add usage analytics

### Week 7-8: Integration & Polish
- [ ] AI Assistant integration
- [ ] Export functionality
- [ ] Testing and refinement

### Week 9-10: Launch Preparation
- [ ] User documentation
- [ ] Training materials
- [ ] Pilot with small group

## Success Metrics

```typescript
// lib/analytics.ts

export const trackMetrics = {
  snippetsCreated: async () => await prisma.snippet.count(),
  validationParticipation: async () => await prisma.validation.groupBy({
    by: ['userId'],
    _count: true
  }),
  bookmarkUsage: async () => await prisma.smartBookmark.aggregate({
    _sum: { usageCount: true }
  }),
  consensusRate: async () => {
    const validated = await prisma.snippet.count({
      where: { status: 'validated' }
    });
    const total = await prisma.snippet.count();
    return (validated / total) * 100;
  }
};
```

## Next Steps

1. **Review & Refine**: Share this plan with your development team for feedback
2. **Prioritize Features**: Decide which features are MVP vs. nice-to-have
3. **Set Up Infrastructure**: Ensure database and hosting are ready
4. **Begin Development**: Start with Phase 1 database and API setup
5. **Iterate Based on Feedback**: Use pilot group to refine features

This implementation plan provides a complete roadmap for building your Knowledge Commons system. The modular approach allows you to build incrementally while maintaining a clear vision of the end goal.