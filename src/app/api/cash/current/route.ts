import { NextResponse } from 'next/server';
import { cashService } from '@/services/cash.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const queryBranchId = searchParams.get('branchId');

    if (!queryBranchId) {
      return NextResponse.json({ error: 'Branch ID requerido' }, { status: 400 });
    }

    const session = await cashService.getCurrentSession(queryBranchId);
    return NextResponse.json({ session });
  } catch (error: unknown) {
    // Manejo tipado seguro
    const message = error instanceof Error ? error.message : 'Error interno desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}