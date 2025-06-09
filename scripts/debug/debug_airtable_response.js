const { default: fetch } = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function debugAirtableResponse() {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  
  console.log('🔍 Debugging Airtable response...');
  
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Documents?filterByFormula=OR({Status}='Processed',{Status}='Indexed')`,
    {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      },
    }
  );
  
  const data = await response.json();
  
  console.log('📊 Response metadata:');
  console.log(`  - Status: ${response.status}`);
  console.log(`  - Records: ${data.records?.length || 0}`);
  console.log(`  - Has offset: ${!!data.offset}`);
  console.log(`  - Offset value: ${data.offset || 'none'}`);
  
  console.log('\n📄 All documents:');
  data.records?.forEach((record, index) => {
    console.log(`  ${index + 1}. ${record.fields.Title} (${record.id})`);
    console.log(`     Status: ${record.fields.Status}`);
    console.log(`     Chunk IDs: ${record.fields['Chunk IDs'] ? 'Yes' : 'No'}`);
  });
  
  const hoodieIndex = data.records?.findIndex(r => r.fields.Title?.includes('Hoodie'));
  console.log(`\n🔍 Hoodie Economics position: ${hoodieIndex >= 0 ? hoodieIndex + 1 : 'Not found'}`);
}

debugAirtableResponse().catch(console.error); 