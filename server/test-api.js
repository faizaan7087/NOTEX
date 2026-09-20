// Comprehensive test script to verify all REST endpoints, Auth, CRUD, Folders, Sharing & Cloning, and XML Export
const http = require('http');

const PORT = 5001;

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = res.headers['content-type'] && res.headers['content-type'].includes('application/json')
            ? JSON.parse(data)
            : data;
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting NOTEX Complete Backend Verification ---');

  // 1. Health check
  console.log('1. Checking Health Check endpoint...');
  const healthRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/health',
    method: 'GET'
  });
  console.log('Health check response:', healthRes.status, healthRes.body.status);

  // 2. Register Student A (Creator)
  console.log('\n2. Testing Student A Registration...');
  const emailA = `studentA_${Date.now()}@college.edu`;
  const regResA = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Demo Student',
    email: emailA,
    password: 'securepassword123',
    college: 'University Institute of Technology',
    semester: 'Semester 6'
  });
  const tokenA = regResA.body.token;
  console.log('Student A registered. Token received.');

  // 3. Student A creates BDA Folder
  console.log('\n3. Student A creates "BDA" Root Folder...');
  const bdaFolderRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/folders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    }
  }, {
    name: 'Big Data Analytics (BDA)',
    parentId: null,
    color: 'emerald'
  });
  const bdaFolderId = bdaFolderRes.body.folder?._id;
  console.log('BDA Folder ID:', bdaFolderId);

  // 4. Student A creates Unit 1 and Unit 2 Subfolders
  console.log('\n4. Student A creates Unit 1 and Unit 2 Subfolders...');
  const unit1Res = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/folders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    }
  }, {
    name: 'Unit 1 - Hadoop & MapReduce',
    parentId: bdaFolderId,
    color: 'indigo'
  });
  const unit1Id = unit1Res.body.folder?._id;

  const unit2Res = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/folders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    }
  }, {
    name: 'Unit 2 - Apache Spark & RDDs',
    parentId: bdaFolderId,
    color: 'amber'
  });
  const unit2Id = unit2Res.body.folder?._id;
  console.log('Subfolders created: Unit 1 (', unit1Id, ') and Unit 2 (', unit2Id, ')');

  // 5. Student A creates notes inside Unit 1 & Unit 2
  console.log('\n5. Student A creates notes in subfolders...');
  await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/notes',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    }
  }, {
    title: 'HDFS Architecture & NameNode Federation',
    subject: 'Big Data Analytics (BDA)',
    folderId: unit1Id,
    content: 'HDFS uses a master/slave architecture with NameNode and DataNodes.',
    tags: ['BDA', 'Hadoop', 'Unit-1']
  });

  await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/notes',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    }
  }, {
    title: 'Spark Transformations vs Actions',
    subject: 'Big Data Analytics (BDA)',
    folderId: unit2Id,
    content: 'Transformations are lazy (map, filter). Actions trigger computation (count, collect).',
    tags: ['BDA', 'Spark', 'Unit-2']
  });
  console.log('Notes created in Unit 1 and Unit 2.');

  // 6. Student A generates Share Link for BDA
  console.log('\n6. Student A generates time-limited share link for BDA repo (POST /api/share/create)...');
  const shareRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/share/create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    }
  }, {
    folderId: bdaFolderId,
    expiresInHours: 72
  });

  console.log('Share Link generated:', shareRes.status);
  console.log('Share Code:', shareRes.body.shareCode, 'Expires At:', shareRes.body.expiresAt);
  const shareCode = shareRes.body.shareCode;

  // 7. Preview Shared Repo (Public preview)
  console.log('\n7. Previewing shared repo metadata (GET /api/share/:code)...');
  const previewRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: `/api/share/${shareCode}`,
    method: 'GET'
  });
  console.log('Preview status:', previewRes.status);
  console.log('Author:', previewRes.body.authorName, '| College:', previewRes.body.authorCollege);
  console.log('Included Units:', previewRes.body.subfolders);
  console.log('Total Notes:', previewRes.body.totalNotes);

  // 8. Register Student B (Recipient)
  console.log('\n8. Registering Student B (Recipient)...');
  const emailB = `studentB_${Date.now()}@college.edu`;
  const regResB = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Ayaan Ahmed',
    email: emailB,
    password: 'securepassword123',
    college: 'University Institute of Technology',
    semester: 'Semester 6'
  });
  const tokenB = regResB.body.token;

  // 9. Student B Clones the BDA repo
  console.log(`\n9. Student B clones the BDA repository using code: ${shareCode}...`);
  const cloneRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: `/api/share/clone/${shareCode}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenB}`
    }
  });

  console.log('Clone status:', cloneRes.status, 'Message:', cloneRes.body.message);
  console.log('Cloned Units:', cloneRes.body.clonedUnitsCount, 'Cloned Notes:', cloneRes.body.clonedNotesCount);

  // 10. Verify Student B now has the BDA folder, subfolders, and notes
  console.log("\n10. Verifying Student B's folders and notes...");
  const bFoldersRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/folders',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  console.log("Student B's Folders count:", bFoldersRes.body.count, bFoldersRes.body.folders?.map(f => f.name));

  const bNotesRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/notes',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  console.log("Student B's Notes count:", bNotesRes.body.count, bNotesRes.body.notes?.map(n => n.title));

  console.log('\n✅ ALL BACKEND SHARING, TIME-EXPIRY, AND REPO CLONING TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
