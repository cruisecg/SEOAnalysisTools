import { NextResponse } from 'next/server';
import { initDB } from '../../../src/main/typescript/models/database';

export async function GET() {
  try {
    // Check database connection (read access test)
    const db = await initDB();
    const tasksCount = db.data.tasks.length;
    
    // Get basic stats
    const stats = {
      database: true,
      tasksCount,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      status: 'healthy'
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
      status: 'unhealthy'
    }, { status: 500 });
  }
}