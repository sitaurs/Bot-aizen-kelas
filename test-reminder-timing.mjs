// Quick test untuk memastikan format endISO benar
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Jakarta');

const now = dayjs();
const endTime = now.hour(16).minute(0).second(0).millisecond(0);

console.log('Current time:', now.format('YYYY-MM-DD HH:mm:ss'));
console.log('End time (4 PM):', endTime.format('YYYY-MM-DD HH:mm:ss'));
console.log('End time ISO:', endTime.toISOString());
console.log('Is end time after now?', endTime.isAfter(now));

// Test interval calculation
const intervalMs = 1 * 60 * 60 * 1000; // 1 hour
let current = now;
let count = 0;

console.log('\nInterval reminders timeline:');
while (current.isBefore(endTime) && count < 10) {
  current = current.add(intervalMs, 'millisecond');
  if (current.isBefore(endTime)) {
    console.log(`- ${current.format('HH:mm')} → Reminder ${count + 1}`);
    count++;
  }
}

console.log(`\nTotal interval reminders: ${count}`);
console.log(`Final reminder at: ${endTime.format('HH:mm')}`);
console.log(`T-minus at: ${endTime.subtract(15, 'minute').format('HH:mm')}`);
