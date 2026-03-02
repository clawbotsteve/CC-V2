import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';
import { INTERNAL_DASHBOARD_TOKEN } from '@/constants/constants';
import pLimit from 'p-limit';

interface ToolUpdateItem {
  id: string;
  creditCost: number;
}

interface RequestBody {
  toolUpdate: ToolUpdateItem[];
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    if (!token || token !== INTERNAL_DASHBOARD_TOKEN) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    const body: RequestBody = await req.json();

    if (!Array.isArray(body.toolUpdate) || body.toolUpdate.length === 0) {
      return NextResponse.json({ error: 'toolUpdate array is required and cannot be empty' }, { status: 400 });
    }

    // Validate all items
    for (const item of body.toolUpdate) {
      if (!item.id || typeof item.creditCost !== 'number') {
        return NextResponse.json({ error: 'Missing or invalid fields in one or more items' }, { status: 400 });
      }
      if (item.creditCost < 0 || !Number.isFinite(item.creditCost)) {
        return NextResponse.json({ error: 'creditCost must be a non-negative finite number' }, { status: 400 });
      }
    }

    const limit = pLimit(1); // concurrency 1 for serial processing

    const updateResults = [];

    for (const item of body.toolUpdate) {
      const result = await limit(async () => {
        await delay(500);
        const existing = await prismadb.toolCreditCost.findUnique({ where: { id: item.id } });
        if (!existing) {
          return { id: item.id, success: false, error: 'Not found' };
        }
        try {
          const updated = await prismadb.toolCreditCost.update({
            where: { id: item.id },
            data: { creditCost: item.creditCost },
          });
          return { id: item.id, success: true, updated };
        } catch (err) {
          return { id: item.id, success: false, error: String(err) };
        }
      });
      updateResults.push(result);
    }

    return NextResponse.json({ message: 'Bulk update complete', results: updateResults });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
