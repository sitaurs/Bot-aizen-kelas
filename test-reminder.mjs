import { readFileSync } from 'fs';
import { updateData, getData } from '../src/storage/files.js';

async function testReminders() {
  console.log('Testing reminder system...');
  
  // Test if we can read current reminders
  const reminders = getData('reminders');
  console.log('Current reminders:', reminders);
  
  // Test adding a reminder
  try {
    await updateData('reminders', (currentReminders) => {
      const testReminder = {
        id: 'test_' + Date.now(),
        type: 'task',
        title: 'Test reminder',
        dueISO: '2025-09-04T15:00:00',
        completed: false
      };
      currentReminders.push(testReminder);
      return currentReminders;
    });
    
    console.log('✅ Test reminder added successfully');
    
    // Read the updated reminders
    const updatedReminders = getData('reminders');
    console.log('Updated reminders:', updatedReminders);
    
  } catch (error) {
    console.error('❌ Error adding test reminder:', error);
  }
}

testReminders().catch(console.error);
