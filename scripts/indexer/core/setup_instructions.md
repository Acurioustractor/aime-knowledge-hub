# Enhanced Indexer Setup Instructions

## Step 1: Add Fields to Airtable Documents Table

You need to add these fields to your **Documents** table in Airtable:

### Required Fields:
1. **Author** 
   - Type: Single line text
   - Description: Document author name (auto-extracted)

2. **Summary**
   - Type: Long text
   - Description: AI-generated document summary

3. **Word Count**
   - Type: Number
   - Description: Accurate word count
   - Format: Integer (no decimals)

4. **Language**
   - Type: Single line text
   - Description: Document language (auto-detected)

5. **Date**
   - Type: Date
   - Description: Document date (extracted or processing date)

6. **Themes** (MOST IMPORTANT)
   - Type: Link to another record
   - Link to: Themes table
   - ✅ Allow linking to multiple records
   - Description: Relevant themes for this document

### Optional: Remove Topics Field
- Consider removing the "Topics" multi-select field to avoid confusion
- Use only the Themes table for categorization

## Step 2: Test Theme Linking

Once you've added the Themes field, test the theme linking:

```bash
cd indexer
source venv/bin/activate
python theme_linker.py
```

This will:
- Link your AIME Business Cases document to relevant themes
- Update theme counts automatically
- Show which themes were matched

## Step 3: Run Full Enhanced Indexer

After adding all fields, run the full enhanced indexer:

```bash
source venv/bin/activate
python full_enhanced_indexer.py
```

This will automatically populate:
- Author information
- Comprehensive AI summary
- Word count
- Language detection
- Date extraction
- Theme linking

## Step 4: Verify Results

Check your Airtable to see:
- All new fields populated
- Themes properly linked with counts
- Status changed to "Enhanced"

## Ongoing Usage

For new documents:
1. Upload to Airtable
2. Run the full enhanced indexer
3. All metadata will be automatically extracted and populated

## Troubleshooting

If you get field errors:
- Ensure all field names match exactly (case-sensitive)
- Check that Themes field is properly linked to Themes table
- Verify field types are correct

The enhanced indexer will skip documents that are already processed (Status = "Enhanced"). 