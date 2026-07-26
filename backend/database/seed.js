import bcryptjs from 'bcryptjs';
import { getDb } from './db.js';

async function seed() {
  const db = await getDb();
  console.log('Initializing database tables...');

  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON;');

  // Create tables
  await db.exec(`
    DROP TABLE IF EXISTS audit_logs;
    DROP TABLE IF EXISTS case_notes;
    DROP TABLE IF EXISTS case_tasks;
    DROP TABLE IF EXISTS financial_transactions;
    DROP TABLE IF EXISTS evidence;
    DROP TABLE IF EXISTS fir_victims;
    DROP TABLE IF EXISTS fir_accused;
    DROP TABLE IF EXISTS victims;
    DROP TABLE IF EXISTS accused;
    DROP TABLE IF EXISTS firs;
    DROP TABLE IF EXISTS users;

    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT CHECK(role IN ('SHO', 'IO', 'Analyst', 'SP')) NOT NULL,
      badge_number TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE firs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fir_number TEXT UNIQUE NOT NULL,
      police_station TEXT NOT NULL,
      district TEXT NOT NULL,
      crime_type TEXT NOT NULL,
      ipc_sections TEXT NOT NULL,
      incident_date TIMESTAMP NOT NULL,
      filed_date TIMESTAMP NOT NULL,
      description TEXT NOT NULL,
      status TEXT CHECK(status IN ('Under Investigation', 'Charge Sheet Filed', 'Closed', 'Under Trial')) NOT NULL,
      io_name TEXT NOT NULL,
      io_badge TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE accused (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      address TEXT NOT NULL,
      occupation TEXT NOT NULL,
      aadhaar_masked TEXT,
      photo_url TEXT,
      modus_operandi TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE victims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE fir_accused (
      fir_id INTEGER REFERENCES firs(id) ON DELETE CASCADE,
      accused_id INTEGER REFERENCES accused(id) ON DELETE CASCADE,
      role_in_crime TEXT,
      PRIMARY KEY (fir_id, accused_id)
    );

    CREATE TABLE fir_victims (
      fir_id INTEGER REFERENCES firs(id) ON DELETE CASCADE,
      victim_id INTEGER REFERENCES victims(id) ON DELETE CASCADE,
      PRIMARY KEY (fir_id, victim_id)
    );

    CREATE TABLE evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fir_id INTEGER REFERENCES firs(id) ON DELETE CASCADE,
      evidence_type TEXT CHECK(evidence_type IN ('Phone', 'SIM', 'TowerLocation', 'Vehicle', 'UPI ID', 'Bank Account', 'CCTV', 'Weapon', 'Other')) NOT NULL,
      value TEXT NOT NULL,
      description TEXT,
      collected_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE financial_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fir_id INTEGER REFERENCES firs(id) ON DELETE SET NULL,
      from_account TEXT NOT NULL,
      to_account TEXT NOT NULL,
      amount REAL NOT NULL,
      transaction_date TIMESTAMP NOT NULL,
      status TEXT NOT NULL,
      flagged_suspicious INTEGER DEFAULT 0
    );

    CREATE TABLE case_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fir_id INTEGER REFERENCES firs(id) ON DELETE CASCADE,
      task_title TEXT NOT NULL,
      status TEXT CHECK(status IN ('Pending', 'In Progress', 'Completed')) NOT NULL DEFAULT 'Pending',
      due_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE case_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fir_id INTEGER REFERENCES firs(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      note_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Tables created. Seeding users...');

  // Create users
  const salt = bcryptjs.genSaltSync(10);
  const passwordHash = bcryptjs.hashSync('password123', salt);

  await db.run(
    'INSERT INTO users (email, password_hash, name, role, badge_number) VALUES (?, ?, ?, ?, ?)',
    ['sho@ksp.gov.in', passwordHash, 'Inspector Shivaraj', 'SHO', 'KSP-88392']
  );
  await db.run(
    'INSERT INTO users (email, password_hash, name, role, badge_number) VALUES (?, ?, ?, ?, ?)',
    ['io@ksp.gov.in', passwordHash, 'Sub-Inspector Pradeep', 'IO', 'KSP-77402']
  );
  await db.run(
    'INSERT INTO users (email, password_hash, name, role, badge_number) VALUES (?, ?, ?, ?, ?)',
    ['analyst@ksp.gov.in', passwordHash, 'Dr. Anil Kumar', 'Analyst', 'KSP-A0041']
  );
  await db.run(
    'INSERT INTO users (email, password_hash, name, role, badge_number) VALUES (?, ?, ?, ?, ?)',
    ['sp@ksp.gov.in', passwordHash, 'SP Roopa D.', 'SP', 'KSP-S0003']
  );

  console.log('Users seeded. Procedurally generating 5000+ crime records...');

  // Data helpers
  const districts = [
    'Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Mandya', 'Dakshina Kannada',
    'Udupi', 'Hubli-Dharwad', 'Belagavi', 'Kalaburagi', 'Tumakuru',
    'Kolar', 'Chikkaballapur', 'Ramanagara', 'Hassan', 'Kodagu',
    'Chamarajanagar', 'Davanagere', 'Shivamogga', 'Chitradurga', 'Ballari',
    'Koppal', 'Raichur', 'Bidar', 'Yadgir', 'Vijayapura',
    'Bagalkote', 'Dharwad', 'Uttara Kannada', 'Haveri', 'Gadag', 'Chikkamagaluru'
  ];

  const stations = {
    'Bengaluru Urban': ['Koramangala PS', 'HSR Layout PS', 'Jayanagar PS', 'Whitefield PS', 'Indiranagar PS', 'Majestic PS'],
    'Mysuru': ['Mysuru Palace PS', 'Lashkar PS', 'Kuempunagar PS', 'Mysuru Rural PS'],
    'Dakshina Kannada': ['Mangaluru North PS', 'Kalladka PS', 'Ullal PS'],
    'Hubli-Dharwad': ['Hubli Town PS', 'Vidyanagar PS', 'Dharwad Suburban PS'],
    'Belagavi': ['Belagavi City PS', 'Khade Bazar PS', 'Udyambag PS'],
    'Kalaburagi': ['Kalaburagi Town PS', 'Brahmpur PS', 'Chowk PS'],
    default: ['Town PS', 'Rural PS', 'Traffic PS']
  };

  const crimeTypes = [
    { type: 'Theft', ipc: 'Sec 379 IPC (BNS 303)', desc: 'House breaking and theft of valuables' },
    { type: 'Robbery', ipc: 'Sec 392 IPC (BNS 309)', desc: 'Armed robbery at convenience store' },
    { type: 'Burglary', ipc: 'Sec 380 IPC (BNS 305)', desc: 'Night burglary in residential apartment' },
    { type: 'Chain Snatching', ipc: 'Sec 379A IPC (BNS 304)', desc: 'Snatching of gold chain from pedestrian' },
    { type: 'Cybercrime', ipc: 'Sec 66D IT Act', desc: 'Phishing scam and unauthorized transfer' },
    { type: 'Financial Fraud', ipc: 'Sec 420 IPC (BNS 318)', desc: 'Investment scam promising high returns' },
    { type: 'Vehicle Theft', ipc: 'Sec 379 IPC (BNS 303)', desc: 'Theft of two-wheeler from parking lot' },
    { type: 'Drug Trafficking', ipc: 'Sec 20 NDPS Act', desc: 'Possession and distribution of banned narcotics' },
    { type: 'Murder', ipc: 'Sec 302 IPC (BNS 103)', desc: 'Homicide arising from personal enmity' }
  ];

  const maleNames = ['Ramesh', 'Suresh', 'Manjunath', 'Ganesh', 'Anand', 'Raghu', 'Harish', 'Vijay', 'Prakash', 'Sanjay', 'Karthik', 'Prashanth', 'Naveen', 'Santosh', 'Sunil', 'Satish', 'Mahesh', 'Pradeep', 'Darshan', 'Chethan'];
  const femaleNames = ['Lakshmi', 'Saraswathi', 'Radha', 'Shantha', 'Girija', 'Sumithra', 'Roopa', 'Kavitha', 'Shalini', 'Priyanka', 'Divya', 'Deepa', 'Asha', 'Meena', 'Geetha', 'Anupama', 'Sneha', 'Jyothi', 'Latha', 'Shobha'];
  const lastNames = ['Kumar', 'Gowda', 'Nayak', 'Patil', 'Hegde', 'Rao', 'Bhat', 'Shetty', 'Reddy', 'Joshi', 'Desai', 'Kulkarni', 'Naidu', 'Chavan', 'Acharya', 'Murdia', 'Siddiqui', 'Shastry', 'Swamy', 'Aradhya'];
  const parentNames = ['Venkatesh', 'Ramappa', 'Ningappa', 'Basavaraj', 'Gopalakrishna', 'Chandrashekhar', 'Govindappa', 'Anantharamu', 'Krishnappa', 'Siddaiah'];
  const occupations = ['Auto Driver', 'Delivery Partner', 'Painter', 'Mechanic', 'Unemployed', 'Software Engineer', 'Shopkeeper', 'Contractor', 'Security Guard', 'Tailor'];
  const places = ['Jayanagar', 'Koramangala', 'HSR Layout', 'Hebbal', 'Yelahanka', 'Malleshwaram', 'Rajajinagar', 'Whitefield', 'Indiranagar', 'Banashankari'];
  
  const ios = [
    { name: 'SI Pradeep Kumar', badge: 'KSP-77402' },
    { name: 'Inspector Shivaraj', badge: 'KSP-88392' },
    { name: 'SI Raghavendra', badge: 'KSP-66381' },
    { name: 'SI Asha Devi', badge: 'KSP-55429' },
    { name: 'Inspector Anand R.', badge: 'KSP-99212' }
  ];

  const statuses = ['Under Investigation', 'Charge Sheet Filed', 'Closed', 'Under Trial'];

  // Start Transaction for speed
  await db.run('BEGIN TRANSACTION;');

  // First, generate specific "Repeat Offenders" and "Missing Links" that we will tie to multiple cases
  // Ramesh Kumar is our flagship repeat offender
  const repeatOffenders = [
    {
      id: 10001,
      name: 'Ramesh Kumar',
      parent_name: 'Venkatesh',
      age: 34,
      gender: 'Male',
      address: '14th Cross, Jayanagar, Bengaluru',
      occupation: 'Auto Driver',
      aadhaar_masked: 'XXXX-XXXX-4532',
      photo_url: null,
      modus_operandi: 'Night-time house breaking, targets ground floor apartments, uses auto-rickshaw to transport stolen goods, active between 1 AM and 4 AM.'
    },
    {
      id: 10002,
      name: 'Suresh Patil',
      parent_name: 'Ramappa',
      age: 28,
      gender: 'Male',
      address: 'Near Water Tank, Whitefield, Bengaluru',
      occupation: 'Delivery Partner',
      aadhaar_masked: 'XXXX-XXXX-9912',
      photo_url: null,
      modus_operandi: 'Two-wheeler snatching, targets elderly women walking in suburban layouts in early mornings.'
    },
    {
      id: 10003,
      name: 'Manjunath R',
      parent_name: 'Ningappa',
      age: 31,
      gender: 'Male',
      address: '4th Block, HSR Layout, Bengaluru',
      occupation: 'Mechanic',
      aadhaar_masked: 'XXXX-XXXX-7721',
      photo_url: null,
      modus_operandi: 'Co-accused specialist, acts as look-out, sells stolen cellphones and gold to local receivers.'
    }
  ];

  for (const offender of repeatOffenders) {
    await db.run(
      'INSERT INTO accused (id, name, parent_name, age, gender, address, occupation, aadhaar_masked, photo_url, modus_operandi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [offender.id, offender.name, offender.parent_name, offender.age, offender.gender, offender.address, offender.occupation, offender.aadhaar_masked, offender.photo_url, offender.modus_operandi]
    );
  }

  // Pre-generate some shared evidence items for missing links
  const sharedUpi = 'ramesh.k@oksbi';
  const sharedVehicle = 'KA-01-AB-1234';
  const sharedPhone = '+91-9876543210';

  console.log('Seeding 5000+ entries...');

  const totalRecords = 5120;
  const createdFirs = [];

  // Generate FIR records
  for (let i = 1; i <= totalRecords; i++) {
    const district = districts[i % districts.length];
    const stationList = stations[district] || stations.default;
    const policeStation = stationList[i % stationList.length];
    const crime = crimeTypes[i % crimeTypes.length];
    const io = ios[i % ios.length];
    const status = statuses[i % statuses.length];

    // Dates spread over last 3 years
    const daysAgo = Math.floor(Math.random() * 1000);
    const incidentDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const filedDate = new Date(incidentDate.getTime() + Math.random() * 48 * 60 * 60 * 1000); // 0-48h later

    const year = filedDate.getFullYear();
    const firNumber = `FIR/${district.substring(0, 3).toUpperCase()}/${policeStation.split(' ')[0].toUpperCase()}/${year}/${String(i).padStart(4, '0')}`;

    // Procedural description
    const desc = `${crime.desc} reported at ${policeStation} area. Complainant reported loss/incident on ${incidentDate.toLocaleDateString()}. Initial spot inspection conducted by ${io.name}. Status of investigation: ${status}.`;

    await db.run(
      'INSERT INTO firs (id, fir_number, police_station, district, crime_type, ipc_sections, incident_date, filed_date, description, status, io_name, io_badge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [i, firNumber, policeStation, district, crime.type, crime.ipc, incidentDate.toISOString(), filedDate.toISOString(), desc, status, io.name, io.badge]
    );

    createdFirs.push({ id: i, firNumber, district, policeStation, crimeType: crime.type, status, incidentDate });
  }

  console.log('FIRs inserted. Seeding victim and accused relationships...');

  // Seeding relationship logic:
  // We want to link our repeat offenders to multiple FIRs:
  // Ramesh Kumar (10001) linked to cases: 12, 108, 456, 1200, 3100
  const rameshCases = [12, 108, 456, 1200, 3100];
  for (const cid of rameshCases) {
    if (cid <= totalRecords) {
      await db.run('INSERT OR IGNORE INTO fir_accused (fir_id, accused_id, role_in_crime) VALUES (?, ?, ?)', [cid, 10001, 'Primary Accused']);
      // Add shared evidence for Ramesh's cases
      await db.run('INSERT INTO evidence (fir_id, evidence_type, value, description) VALUES (?, ?, ?, ?)', [cid, 'UPI ID', sharedUpi, 'UPI handle used for receiving illegal funds']);
      await db.run('INSERT INTO evidence (fir_id, evidence_type, value, description) VALUES (?, ?, ?, ?)', [cid, 'Vehicle', sharedVehicle, 'Black motorcycle seen near spot']);
    }
  }

  // Suresh Patil (10002) linked to cases: 45, 234, 1500, 2800
  const sureshCases = [45, 234, 1500, 2800];
  for (const cid of sureshCases) {
    if (cid <= totalRecords) {
      await db.run('INSERT OR IGNORE INTO fir_accused (fir_id, accused_id, role_in_crime) VALUES (?, ?, ?)', [cid, 10002, 'Primary Accused']);
      await db.run('INSERT INTO evidence (fir_id, evidence_type, value, description) VALUES (?, ?, ?, ?)', [cid, 'Phone', sharedPhone, 'Active cell phone registered in suspect name']);
    }
  }

  // Manjunath R (10003) linked to cases: 12, 456, 1500
  const manjunathCases = [12, 456, 1500];
  for (const cid of manjunathCases) {
    if (cid <= totalRecords) {
      await db.run('INSERT OR IGNORE INTO fir_accused (fir_id, accused_id, role_in_crime) VALUES (?, ?, ?)', [cid, 10003, 'Co-Accused / Look-out']);
    }
  }

  // Generate generic victims and other accused dynamically
  let victimIdCounter = 1;
  let accusedIdCounter = 10004;

  for (let j = 1; j <= totalRecords; j++) {
    // Every FIR gets at least one victim
    const isMaleVictim = Math.random() > 0.5;
    const vName = `${isMaleVictim ? maleNames[j % maleNames.length] : femaleNames[j % femaleNames.length]} ${lastNames[(j + 2) % lastNames.length]}`;
    const vAge = 18 + (j % 65);
    const vGender = isMaleVictim ? 'Male' : 'Female';
    const vPhone = `+91-9${String(j * 9381923).substring(0, 9)}`;
    const vAddress = `${j % 100}th Main, ${places[j % places.length]}, Bengaluru`;

    await db.run(
      'INSERT INTO victims (id, name, age, gender, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [victimIdCounter, vName, vAge, vGender, vPhone, vAddress]
    );
    await db.run('INSERT INTO fir_victims (fir_id, victim_id) VALUES (?, ?)', [j, victimIdCounter]);

    // Add victim details to special mock cases
    if (j === 456) {
      // Set victim of case 456 to Lakshmi Devi (matches our UI mockup exactly)
      await db.run('UPDATE victims SET name = "Lakshmi Devi", age = 42, gender = "Female" WHERE id = ?', [victimIdCounter]);
    }

    // Most cases (e.g. 70%) have an accused identified/arrested
    if (Math.random() < 0.7 && !rameshCases.includes(j) && !sureshCases.includes(j) && !manjunathCases.includes(j)) {
      const isMaleAccused = Math.random() > 0.1; // Mostly male offenders in database
      const aName = `${isMaleAccused ? maleNames[j % maleNames.length] : femaleNames[j % femaleNames.length]} ${lastNames[(j + 5) % lastNames.length]}`;
      const aParent = parentNames[j % parentNames.length];
      const aAge = 18 + (j % 50);
      const aGender = isMaleAccused ? 'Male' : 'Female';
      const aAddress = `${j % 200}th Cross, ${places[(j + 3) % places.length]}, ${districts[j % districts.length]}`;
      const aOcc = occupations[j % occupations.length];
      const aAadhaar = `XXXX-XXXX-${String(j * 1111).substring(0, 4)}`;
      const aMo = `Operates during ${j % 2 === 0 ? 'night' : 'day'} hours. Targets ${j % 3 === 0 ? 'apartments' : 'shops'}.`;

      await db.run(
        'INSERT INTO accused (id, name, parent_name, age, gender, address, occupation, aadhaar_masked, photo_url, modus_operandi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [accusedIdCounter, aName, aParent, aAge, aGender, aAddress, aOcc, aAadhaar, null, aMo]
      );
      await db.run('INSERT INTO fir_accused (fir_id, accused_id, role_in_crime) VALUES (?, ?, ?)', [j, accusedIdCounter, 'Primary Accused']);
      
      // Let's seed random evidence for this accused
      if (j % 3 === 0) {
        await db.run('INSERT INTO evidence (fir_id, evidence_type, value, description) VALUES (?, ?, ?, ?)', [j, 'Phone', `+91-9845${j}123`, 'Mobile phone recovered from suspect']);
      }
      if (j % 4 === 0) {
        await db.run('INSERT INTO evidence (fir_id, evidence_type, value, description) VALUES (?, ?, ?, ?)', [j, 'Bank Account', `A/c XXXX${2000 + j}`, 'Suspect bank account containing suspicious transfers']);
      }
      accusedIdCounter++;
    }

    victimIdCounter++;
  }

  console.log('Seeding financial transactions...');
  // Financial transactions
  // Let's seed transactions specifically for Ramesh's SBI account and UPI
  const rameshTransactions = [
    { from: 'ramesh.k@oksbi', to: 'recipient.a@okaxis', amount: 150000, date: '2025-01-20T12:00:00Z', flagged: 1 },
    { from: 'ramesh.k@oksbi', to: 'recipient.b@okicici', amount: 320000, date: '2025-01-24T15:30:00Z', flagged: 1 },
    { from: 'complainant.victim@oksbi', to: 'ramesh.k@oksbi', amount: 50000, date: '2024-04-15T23:45:00Z', flagged: 0 } // case 456 rob amount
  ];

  for (const tx of rameshTransactions) {
    await db.run(
      'INSERT INTO financial_transactions (fir_id, from_account, to_account, amount, transaction_date, status, flagged_suspicious) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [456, tx.from, tx.to, tx.amount, tx.date, 'COMPLETED', tx.flagged]
    );
  }

  // Generics
  for (let t = 1; t <= 200; t++) {
    await db.run(
      'INSERT INTO financial_transactions (fir_id, from_account, to_account, amount, transaction_date, status, flagged_suspicious) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        t % totalRecords,
        `account.${t % 100}@oksbi`,
        `recipient.${t % 50}@okhdfc`,
        Math.random() * 50000 + 1000,
        new Date(Date.now() - (t * 2) * 24 * 60 * 60 * 1000).toISOString(),
        'COMPLETED',
        t % 15 === 0 ? 1 : 0
      ]
    );
  }

  console.log('Seeding case workspace data (tasks & notes)...');
  // Seed workspace specific details for our demo case: FIR 456
  // (Case 456 is Jayanagar/Koramangala Armed Robbery - the flagship demo)
  const case456Tasks = [
    { title: 'Collect CCTV footage from Koramangala 4th Block main road junction', status: 'Completed', due: '2025-01-18' },
    { title: 'Record statement of Witness Suresh Patil (Co-accused status to check)', status: 'In Progress', due: '2025-02-15' },
    { title: 'Trace mobile call location (CDR) for Ramesh Kumar at incident time', status: 'Completed', due: '2025-01-22' },
    { title: 'Recover stolen gold chain / weapon (Knife)', status: 'Pending', due: '2025-03-01' },
    { title: 'File final chargesheet report draft', status: 'Pending', due: '2025-03-15' }
  ];

  for (const task of case456Tasks) {
    await db.run(
      'INSERT INTO case_tasks (fir_id, task_title, status, due_date) VALUES (?, ?, ?, ?)',
      [456, task.title, task.status, task.due]
    );
  }

  const case456Notes = [
    { author: 'SI Pradeep Kumar', note: 'Visited spot at 11:55 PM on 15-Jan-2024. Complainant Lakshmi Devi was in shock. Stated two guys on a black motorcycle snatched her 50g gold chain at knife-point.' },
    { author: 'SI Pradeep Kumar', note: 'CCTV footage of neighborhood shops analyzed. Found partial registration number starting with KA-01-AB. Suspect matching vehicle details.' },
    { author: 'Inspector Shivaraj', note: 'Checked database. The modus operandi (night chain-snatching with knife threats) matches Ramesh Kumar, habitual offender from Jayanagar area. Need immediate arrest warrant.' }
  ];

  for (const note of case456Notes) {
    await db.run(
      'INSERT INTO case_notes (fir_id, author_name, note_text) VALUES (?, ?, ?)',
      [456, note.author, note.note]
    );
  }

  // End transaction
  await db.run('COMMIT;');
  console.log('Database successfully seeded with 5000+ records!');
}

seed().catch(err => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
