const { default: fetch } = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testAPI() {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  
  console.log('🔍 Testing Airtable API directly...');
  
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Documents?filterByFormula=OR({Status}='Processed',{Status}='Indexed')`,
    {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      },
    }
  );
  
  const data = await response.json();
  
  console.log(`📊 Total records: ${data.records.length}`);
  console.log('📄 Document titles:');
  data.records.forEach(record => {
    console.log(`  - ${record.fields.Title} (Status: ${record.fields.Status})`);
  });
  
  const hoodieRecord = data.records.find(r => r.fields.Title && r.fields.Title.includes('Hoodie'));
  console.log(`🔍 Hoodie Economics found: ${!!hoodieRecord}`);
  
  if (hoodieRecord) {
    console.log('📋 Hoodie Economics details:', {
      id: hoodieRecord.id,
      title: hoodieRecord.fields.Title,
      status: hoodieRecord.fields.Status,
      hasChunkIds: !!hoodieRecord.fields['Chunk IDs'],
      chunkIdsLength: hoodieRecord.fields['Chunk IDs']?.length,
      themes: hoodieRecord.fields.Themes
    });
  }
}

testAPI().catch(console.error); 