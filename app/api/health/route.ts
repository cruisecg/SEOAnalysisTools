import { NextResponse } from 'next/server';
import { db } from '../../../src/main/typescript/models/database';

export async function GET() {
  try {
    // Check database connection
    const result = db.prepare('SELECT 1 as ok').get();
    
    // Get basic stats
    const stats = {
      database: !!result,
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