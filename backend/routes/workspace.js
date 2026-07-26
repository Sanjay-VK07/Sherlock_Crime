import express from 'express';
import { getDb } from '../database/db.js';
import { authenticateJWT } from '../middlewares/auth.js';

const router = express.Router();

// Get Case Workspace overview (Timeline, Tasks, Notes)
router.get('/:firId', authenticateJWT, async (req, res) => {
  const { firId } = req.params;

  try {
    const db = await getDb();
    
    // Get target case
    const targetCase = await db.get('SELECT * FROM firs WHERE id = ?', [firId]);
    if (!targetCase) {
      return res.status(404).json({ error: 'Case file not found' });
    }

    // Get tasks
    const tasks = await db.all('SELECT * FROM case_tasks WHERE fir_id = ? ORDER BY id ASC', [firId]);

    // Get notes
    const notes = await db.all('SELECT * FROM case_notes WHERE fir_id = ? ORDER BY created_at DESC', [firId]);

    // Generate timeline (Complaint -> FIR -> Witness -> CCTV -> Tower -> Bank -> Forensics -> Chargesheet)
    const timeline = [];
    timeline.push({ title: 'Complaint Registered', date: new Date(targetCase.incident_date).toLocaleDateString(), status: 'completed', description: 'Oral complaint recorded in Station House Diary.' });
    timeline.push({ title: 'FIR Filed', date: new Date(targetCase.filed_date).toLocaleDateString(), status: 'completed', description: `FIR No. ${targetCase.fir_number} generated and sent to court.` });
    
    if (parseInt(firId) === 456) {
      timeline.push({ title: 'Witness 1 Statement', date: '2024-01-17', status: 'completed', description: 'Statement of neighbor Suresh recorded.' });
      timeline.push({ title: 'CCTV Verified', date: '2024-01-19', status: 'completed', description: 'Vehicle KA-01-AB-1234 identified on camera.' });
      timeline.push({ title: 'SIM Tower Checked', date: '2024-01-22', status: 'completed', description: 'Suspect tower locations mapped near Koramangala.' });
      timeline.push({ title: 'Primary Arrest', date: '2024-01-25', status: 'completed', description: 'Ramesh Kumar arrested. Auto-rickshaw seized.' });
      timeline.push({ title: 'Bank Records Seized', date: '2024-02-03', status: 'completed', description: 'Suspect account transactions frozen.' });
      timeline.push({ title: 'Forensic Report', date: 'Pending', status: 'pending', description: 'Awaiting weapon fingerprint analysis report.' });
      timeline.push({ title: 'Chargesheet Filed', date: 'Pending', status: 'pending', description: 'Final prosecution report under compilation.' });
    } else {
      timeline.push({ title: 'Witness statements', date: new Date(targetCase.filed_date).toLocaleDateString(), status: 'completed', description: 'Statements recorded.' });
      timeline.push({ title: 'Evidence Collection', date: 'Pending', status: 'pending', description: 'CCTV and other items audit.' });
      timeline.push({ title: 'Chargesheet Filed', date: 'Pending', status: 'pending', description: 'Prosecution report.' });
    }

    res.json({
      caseDetails: targetCase,
      timeline,
      tasks,
      notes
    });
  } catch (error) {
    console.error('Error fetching case workspace details:', error);
    res.status(500).json({ error: 'Failed to fetch case workspace details' });
  }
});

// Create task
router.post('/:firId/tasks', authenticateJWT, async (req, res) => {
  const { firId } = req.params;
  const { task_title, due_date } = req.body;

  if (!task_title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  try {
    const db = await getDb();
    await db.run(
      'INSERT INTO case_tasks (fir_id, task_title, status, due_date) VALUES (?, ?, ?, ?)',
      [firId, task_title, 'Pending', due_date || null]
    );

    const tasks = await db.all('SELECT * FROM case_tasks WHERE fir_id = ? ORDER BY id ASC', [firId]);
    res.json(tasks);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create case task' });
  }
});

// Update task status
router.put('/tasks/:taskId', authenticateJWT, async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Task status is required' });
  }

  try {
    const db = await getDb();
    await db.run('UPDATE case_tasks SET status = ? WHERE id = ?', [status, taskId]);
    const updatedTask = await db.get('SELECT * FROM case_tasks WHERE id = ?', [taskId]);
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update case task' });
  }
});

// Add Case Note
router.post('/:firId/notes', authenticateJWT, async (req, res) => {
  const { firId } = req.params;
  const { note_text } = req.body;

  if (!note_text) {
    return res.status(400).json({ error: 'Note text is required' });
  }

  try {
    const db = await getDb();
    await db.run(
      'INSERT INTO case_notes (fir_id, author_name, note_text) VALUES (?, ?, ?)',
      [firId, req.user.name || 'Investigator', note_text]
    );

    const notes = await db.all('SELECT * FROM case_notes WHERE fir_id = ? ORDER BY created_at DESC', [firId]);
    res.json(notes);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Ask AI helper in Workspace
router.post('/:firId/ai-help', authenticateJWT, async (req, res) => {
  const { firId } = req.params;
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required for AI support' });
  }

  try {
    // Return custom helper feedback based on case and prompt
    let response = '';
    
    if (parseInt(firId) === 456) {
      if (prompt.toLowerCase().includes('cctv') || prompt.toLowerCase().includes('lead')) {
        response = `
**[Sherlock Copilot Recommendation]**:
1. Check the timeline discrepancy: CCTV captures show the suspect auto rickshaw (KA-01-AB-1234) passing by the 4th Block main road at 11:39 PM. This matches the tower location ping of Ramesh Kumar's phone at 11:42 PM.
2. Search registration records of the motorcycle details. Vehicle number KA-01-AB-1234 is registered under Ramesh Kumar's name.
3. Check CCTV footage of adjacent crossroads to identify A2 (the rider of the motorcycle). Compare faces with known associates: Suresh Patil and Manjunath R.
        `.trim();
      } else {
        response = `
**[Sherlock Copilot Guidance]**:
Based on the current evidence dossier for FIR 2024/456 (Armed Robbery):
- Primary accused: Ramesh Kumar (high risk, 12 previous cases).
- Current status: Ramesh is under custody, but stolen gold chain is unrecovered.
- Next steps: Interrogate Accused No 2 (Manjunath R) regarding the disposal of gold jewelry at local pawn shops. Request account statement of Ramesh's SBI bank account to trace transactions matching the date of incident.
        `.trim();
      }
    } else {
      response = `
**[Sherlock Copilot Guidance]**:
Analyzed FIR details. Recommend collecting call detail records (CDRs) of the suspect within a 500m radius of the crime location during the incident timeframe. Map any matching tower location pings to identify possible co-conspirators.
      `.trim();
    }

    res.json({ response });
  } catch (error) {
    console.error('Error calling AI helper:', error);
    res.status(500).json({ error: 'Failed to process AI help request' });
  }
});

export default router;
