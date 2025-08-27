#!/usr/bin/env node

import 'dotenv/config';
import { GeminiAI } from '../src/ai/gemini.ts';
import { loadAllData, getData } from '../src/storage/files.ts';
import { logger } from '../src/utils/logger.ts';

async function testConnection() {
  try {
    console.log('🧪 Testing WhatsApp Class Manager Bot...\n');

    // Test 1: Load data
    console.log('1. Testing data loading...');
    await loadAllData();
    console.log('✅ Data loaded successfully\n');

    // Test 2: Check data structure
    console.log('2. Testing data structure...');
    const schedule = getData('schedule');
    const lecturers = getData('lecturers');
    const items = getData('items');
    
    console.log(`✅ Schedule: ${Object.keys(schedule.days).length} days configured`);
    console.log(`✅ Lecturers: ${lecturers.length} lecturers found`);
    console.log(`✅ Items: ${Object.keys(items).length} courses with items\n`);

    // Test 3: Test AI connection
    console.log('3. Testing AI connection...');
    const ai = new GeminiAI();
    const response = await ai.generateResponse('Hello, test message');
    console.log(`✅ AI Response: ${response.substring(0, 100)}...\n`);

    // Test 4: Test environment variables
    console.log('4. Testing environment variables...');
    const requiredEnvVars = [
      'GEMINI_API_KEY',
      'TZ',
      'BOT_NAME',
      'BOT_TRIGGERS'
    ];

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar}: ${process.env[envVar].substring(0, 20)}...`);
      } else {
        console.log(`❌ ${envVar}: Not set`);
      }
    }
    console.log();

    // Test 5: Test timezone
    console.log('5. Testing timezone...');
    const { now, getToday } = await import('../src/utils/time.js');
    const currentTime = now();
    const today = getToday();
    console.log(`✅ Current time: ${currentTime.format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`✅ Today: ${today}\n`);

    console.log('🎉 All tests passed! Bot is ready to run.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testConnection();
