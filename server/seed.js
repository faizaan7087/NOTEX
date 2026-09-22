const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Note = require('./models/Note');
const { connectDB } = require('./config/db');

const sampleNotes = [
  {
    title: 'Database Normalization (1NF, 2NF, 3NF, BCNF)',
    subject: 'DBMS',
    content: `Normalization is the systematic approach of decomposing tables to eliminate data redundancy and undesirable anomalies (Insertion, Update, Deletion).

1. First Normal Form (1NF): Each column must contain atomic (indivisible) values. No repeating groups.
2. Second Normal Form (2NF): Must be in 1NF and all non-key attributes must be fully functionally dependent on the primary key (No partial dependency).
3. Third Normal Form (3NF): Must be in 2NF and have no transitive dependencies (X -> Y and Y -> Z).
4. Boyce-Codd Normal Form (BCNF): Stricter version of 3NF. For every functional dependency X -> Y, X must be a super key.`,
    tags: ['DBMS', 'Exam', 'Unit-2', 'Normalization'],
    isFavorite: true
  },
  {
    title: 'CPU Scheduling Algorithms & Formulas',
    subject: 'Operating Systems',
    content: `CPU Scheduling deals with deciding which process in the ready queue is allocated CPU time:

1. FCFS (First Come First Serve): Non-preemptive, simple, suffers from Convoy Effect.
2. SJF (Shortest Job First): Optimal average turnaround time. Can be preemptive (SRTF) or non-preemptive.
3. Round Robin (RR): Preemptive with a fixed time quantum (q). Ideal for time-sharing systems.
4. Priority Scheduling: Processes scheduled based on priority numbers. Suffers from starvation (mitigated by aging).

Key Formulas:
• Turnaround Time (TAT) = Completion Time - Arrival Time
• Waiting Time (WT) = Turnaround Time - Burst Time`,
    tags: ['OS', 'CPU-Scheduling', 'Viva', 'Algorithms'],
    isFavorite: true
  },
  {
    title: 'OSI 7-Layer Model vs TCP/IP Suite',
    subject: 'Computer Networks',
    content: `The OSI Model provides a theoretical 7-layer architectural framework for computer networking:

Layer 7: Application (HTTP, FTP, DNS, SMTP)
Layer 6: Presentation (Encryption, SSL/TLS, Serialization)
Layer 5: Session (Session establishment, RPC)
Layer 4: Transport (TCP, UDP, port numbers, flow control)
Layer 3: Network (IP, Routers, logical addressing, ICMP)
Layer 2: Data Link (MAC addressing, Ethernet, Switches, framing)
Layer 1: Physical (Cables, bits, signaling, hubs)

TCP/IP Model simplifies this into 4 layers: Application, Transport, Internet, and Network Access.`,
    tags: ['CN', 'OSI-Model', 'Networking', 'Unit-1'],
    isFavorite: false
  },
  {
    title: 'Gradient Descent & Loss Functions in Neural Networks',
    subject: 'Machine Learning',
    content: `Gradient Descent is an optimization algorithm used to minimize the cost function by iteratively moving in the direction of steepest descent.

Variants:
1. Batch Gradient Descent: Calculates gradient using whole dataset. Slow for large data.
2. Stochastic Gradient Descent (SGD): Updates weights per individual training example. Fast with high variance.
3. Mini-batch Gradient Descent: Uses small batches (e.g. 32, 64). Best balance of speed and stability.
4. Adam Optimizer: Adaptive Moment Estimation combining momentum and RMSProp.

Common Loss Functions:
• Mean Squared Error (MSE): Regression
• Binary Cross-Entropy (BCE): Binary classification
• Categorical Cross-Entropy: Multi-class classification`,
    tags: ['ML', 'DeepLearning', 'Optimization', 'Unit-3'],
    isFavorite: true
  },
  {
    title: 'Binary Search Trees (BST) & AVL Self-Balancing',
    subject: 'Data Structures & Algorithms',
    content: `A Binary Search Tree (BST) maintains the property: Left subtree keys < Node key < Right subtree keys.

Time Complexities:
• Search / Insert / Delete: Average O(log N), Worst-case O(N) (skewed tree).

AVL Tree (Adelson-Velsky and Landis):
A self-balancing BST where the height difference (Balance Factor = Height(Left) - Height(Right)) between left and right subtrees is at most {-1, 0, +1}.

Rotations on violation:
- LL Rotation (Right rotation)
- RR Rotation (Left rotation)
- LR Rotation (Left-Right rotation)
- RL Rotation (Right-Left rotation)
Guarantees O(log N) lookup in the worst case.`,
    tags: ['DSA', 'Trees', 'AVL', 'Algorithms'],
    isFavorite: false
  }
];

async function seed() {
  await connectDB();

  console.log('[Seed] Seeding demo student user and initial notes...');
  let demoUser = await User.findOne({ email: 'student@notex.edu' });
  if (!demoUser) {
    demoUser = await User.create({
      name: 'Demo Student',
      email: 'student@notex.edu',
      password: 'password123',
      college: 'University Institute of Technology',
      semester: 'Semester 6 - CSE'
    });
    console.log('[Seed] Created default demo user: student@notex.edu / password123');
  }

  const userId = demoUser._id || demoUser.id;

  // Check if notes already exist for this user
  const existingCount = await Note.countDocuments({ userId });
  if (existingCount === 0) {
    for (const noteData of sampleNotes) {
      await Note.create({
        ...noteData,
        userId: userId
      });
    }
    console.log(`[Seed] Successfully seeded ${sampleNotes.length} academic notes!`);
  } else {
    console.log(`[Seed] User already has ${existingCount} notes. Skipping duplicate insertion.`);
  }

  console.log('[Seed] Database initialization complete.');
}

seed().catch(err => {
  console.error('[Seed Error]:', err);
});
