async function runTests() {
  const urlBase = 'https://renner-qc-academy.onrender.com';
  
  console.log('--- TEST 1: Barcode 0 Prefix ---');
  try {
    const res1 = await fetch(`${urlBase}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'PO code 0200101315908, price label 200101315908, what to do?' })
    });
    const data1 = await res1.json();
    console.log(data1.text);
  } catch (err) {
    console.error('Test 1 error:', err);
  }

  console.log('\n--- TEST 2: Color Mismatch ---');
  try {
    const res2 = await fetch(`${urlBase}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'PO says Marrom, hangtag Marrom Coffee, sealed sample matches garment' })
    });
    const data2 = await res2.json();
    console.log(data2.text);
  } catch (err) {
    console.error('Test 2 error:', err);
  }

  console.log('\n--- TEST 3: Report Organizer No Count ---');
  try {
    const res3 = await fetch(`${urlBase}/api/organize-finding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Found needle holes on several pieces' })
    });
    const data3 = await res3.json();
    console.log(data3.text);
  } catch (err) {
    console.error('Test 3 error:', err);
  }
}

runTests();
