/**
 * Test Suite: Cron T-15 Inklusif + Idempotency
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cronFireGuard } from '../src/scheduler/fireGuard.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import isBetween from 'dayjs/plugin/isBetween.js';

// Configure dayjs properly
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

describe('Cron T-15 Functionality', () => {
  beforeEach(async () => {
    await cronFireGuard.reset();
  });

  describe('Fire Guard Idempotency', () => {
    it('should generate consistent T-15 signatures', () => {
      const dateISO = '2025-08-27';
      const groupJid = '120363123456789@g.us';
      const course = 'Matematika Diskrit';
      const startHHMM = '08:00';

      const sig1 = cronFireGuard.generateT15Signature(dateISO, groupJid, course, startHHMM);
      const sig2 = cronFireGuard.generateT15Signature(dateISO, groupJid, course, startHHMM);

      expect(sig1).toBe(sig2);
      expect(sig1).toContain('T15');
      expect(sig1).toContain(dateISO);
      expect(sig1).toContain(groupJid);
      expect(sig1).toContain(course);
      expect(sig1).toContain(startHHMM);
    });

    it('should track fired state correctly', async () => {
      const signature = cronFireGuard.generateT15Signature(
        '2025-08-27',
        '120363123456789@g.us',
        'Test Course',
        '08:00'
      );

      // Initially not fired
      expect(await cronFireGuard.alreadyFired(signature)).toBe(false);

      // Mark as fired
      await cronFireGuard.markFired(signature);

      // Should now be fired
      expect(await cronFireGuard.alreadyFired(signature)).toBe(true);
    });

    it('should handle different signatures separately', async () => {
      const sig1 = cronFireGuard.generateT15Signature('2025-08-27', 'group1@g.us', 'Course A', '08:00');
      const sig2 = cronFireGuard.generateT15Signature('2025-08-27', 'group1@g.us', 'Course B', '09:00');

      await cronFireGuard.markFired(sig1);

      expect(await cronFireGuard.alreadyFired(sig1)).toBe(true);
      expect(await cronFireGuard.alreadyFired(sig2)).toBe(false);
    });

    it('should reset daily (simulated)', async () => {
      const signature = cronFireGuard.generateT15Signature(
        '2025-08-27',
        '120363123456789@g.us',
        'Test Course',
        '08:00'
      );

      await cronFireGuard.markFired(signature);
      expect(await cronFireGuard.alreadyFired(signature)).toBe(true);

      // Simulate daily reset
      await cronFireGuard.reset();
      expect(await cronFireGuard.alreadyFired(signature)).toBe(false);
    });
  });

  describe('Time Window Inclusivity', () => {
    it('should check isSame minute correctly', () => {
      const classStart = dayjs.tz('2025-08-27 08:15', 'Asia/Jakarta');
      const fifteenMinutesBefore = classStart.subtract(15, 'minute'); // 08:00

      const testTimes = [
        { time: '08:00:00', shouldTrigger: true },
        { time: '08:00:30', shouldTrigger: true },
        { time: '08:00:59', shouldTrigger: true },
        { time: '07:59:59', shouldTrigger: false },
        { time: '08:01:00', shouldTrigger: false }
      ];

      testTimes.forEach(({ time, shouldTrigger }) => {
        const currentTime = dayjs.tz(`2025-08-27 ${time}`, 'Asia/Jakarta');
        const isTimeToSend = currentTime.isSame(fifteenMinutesBefore, 'minute');
        
        expect(isTimeToSend).toBe(shouldTrigger);
      });
    });

    it('should be inclusive at exact minute boundaries', () => {
      const classStart = dayjs.tz('2025-08-27 14:30', 'Asia/Jakarta');
      const targetTime = classStart.subtract(15, 'minute'); // 14:15

      // Test at exact start of minute
      const atStart = dayjs.tz('2025-08-27 14:15:00', 'Asia/Jakarta');
      expect(atStart.isSame(targetTime, 'minute')).toBe(true);

      // Test at end of minute
      const atEnd = dayjs.tz('2025-08-27 14:15:59', 'Asia/Jakarta');
      expect(atEnd.isSame(targetTime, 'minute')).toBe(true);
    });
  });
});
