# AIME Knowledge Hub - Database Schema Recommendations

## Current Issue: Redundant Topic Systems

### What we have now:
- **Topics** field: Multi-select field on Documents table (empty)
- **Themes** table: Separate table with AI-extracted themes (not linked)

### Problems:
- Confusing dual system
- Themes aren't connected to documents
- No clear purpose for each system
- Manual vs automated content conflict

## Recommended Solution: Single Unified System

### Use Themes Table as Single Source of Truth

**Benefits:**
1. **Rich Metadata**: Each theme has Name, Description, Count
2. **AI-Generated**: Automatically extracted from document content
3. **Scalable**: Easy to add new themes as documents grow
4. **Trackable**: Count field shows theme usage
5. **Searchable**: Better filtering and discovery

### Recommended Fields Structure

#### Documents Table
```
- Title (Text)
- Author (Text, auto-populated from content or "Unknown")
- Date (Date, auto-populated from file metadata or content)
- File (Attachment)
- Full Text (Long text, full document content)
- Summary (Long text, AI-generated summary)
- Themes (Link to Themes table - MANY TO MANY)
- Chunk IDs (Long text, vector storage tracking)
- Status (Select: Processing, Indexed, Error)
- Processed At (Date)
- Word Count (Number, auto-calculated)
- Language (Text, auto-detected)
```

#### Themes Table  
```
- Name (Text, primary field)
- Description (Long text, AI-generated contextual description)
- Count (Number, auto-calculated from linked documents)
- Documents (Link to Documents table - MANY TO MANY)
- Created At (Date)
- Color (Select, for UI visualization)
- Category (Select: Technology, Business, Social Impact, etc.)
```

### Implementation Plan

1. **Remove Topics field** from Documents table
2. **Create proper link** between Documents and Themes tables
3. **Update indexer** to use linked Themes instead of Topics
4. **Add new automated fields** (Author, Summary, Word Count, Language)
5. **Categorize themes** for better organization

## Additional Field Automation

### Author Field
- Extract from document metadata
- Use AI to identify author from content
- Default to "Unknown" if not found

### Summary Field  
- AI-generated executive summary (2-3 sentences)
- Extracted key points and conclusions
- Updated when document is reprocessed

### Word Count
- Automatically calculated from Full Text
- Useful for document analysis and processing estimates

### Language Detection
- Auto-detect document language
- Support for multilingual content
- Filter documents by language

### Date Field Enhancement
- Extract from document metadata
- Parse dates mentioned in content
- Use file creation date as fallback
- Default to processing date if nothing found

## Benefits of This Approach

1. **Consistency**: Single theme system across the platform
2. **Rich Context**: Detailed theme descriptions improve searchability  
3. **Automation**: All fields populated automatically during indexing
4. **Scalability**: Easy to add new documents and themes
5. **Analytics**: Count tracking shows popular themes and content gaps
6. **User Experience**: Better filtering, search, and discovery 