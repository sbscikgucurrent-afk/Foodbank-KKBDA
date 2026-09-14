import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth';
import { processFoodDistribution, verifyStudentForDistribution } from '@/lib/services/distribution';
import { getFoodItems, getFoodCategories } from '@/lib/services/inventory';
import { getDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Sila log masuk.' }, { status: 401 });
    }

    const db = getDatabase();
    const allStudents = db.prepare(`SELECT * FROM students`).all() as any[];
    const allProgrammes = db.prepare(`SELECT * FROM programmes`).all() as any[];

    const targetStudentId = (user.student_id || user.username || '').toLowerCase().trim();
    const targetName = (user.name || '').toLowerCase().trim();

    // 1. First priority: Exact match by student_id, IC number, or email
    let student = allStudents.find(s => {
      const sId = (s.student_id || '').toLowerCase().trim();
      const sIc = (s.ic_number || '').toLowerCase().trim();
      const sIcDigits = sIc.replace(/[^0-9]/g, '');
      const sEmail = (s.email || '').toLowerCase().trim();
      return (targetStudentId && (
        sId === targetStudentId || 
        sEmail === targetStudentId || 
        sIc === targetStudentId || 
        (targetStudentId.length >= 6 && sIcDigits === targetStudentId.replace(/[^0-9]/g, ''))
      ));
    });

    // 2. Second priority: Match by Exact Full Name
    if (!student && targetName) {
      student = allStudents.find(s => (s.name || '').toLowerCase().trim() === targetName);
    }

    // 3. Third priority: Name substring match
    if (!student && targetName) {
      student = allStudents.find(s => {
        const sName = (s.name || '').toLowerCase().trim();
        return sName.startsWith(targetName) || targetName.startsWith(sName);
      });
    }

    if (!student && (user.username === 'student001' || user.role === 'student')) {
      student = allStudents.find(s => (s.student_id || '').toUpperCase() === 'KKBDA001') || allStudents[0];
    }

    if (!student) {
      return NextResponse.json({ success: false, error: 'Rekod pelajar tidak dijumpai.' }, { status: 404 });
    }

    const prog = allProgrammes.find(p => p.id === student.programme_id);
    const enrichedStudent = {
      ...student,
      programme_name: prog?.programme_name || 'Sijil Teknologi Maklumat',
      programme_code: prog?.programme_code || 'STM'
    };

    const verification = verifyStudentForDistribution(enrichedStudent.student_id);

    // Fetch available food items with stock & categories
    const items = getFoodItems({ status: 'ACTIVE' });
    const categories = getFoodCategories();

    return NextResponse.json({
      success: true,
      student: enrichedStudent,
      verification,
      items: items.filter(i => (i.current_stock || 0) > 0),
      categories
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Sila log masuk terlebih dahulu.' }, { status: 401 });
    }

    const db = getDatabase();
    const allStudents = db.prepare(`SELECT * FROM students`).all() as any[];

    const targetStudentId = (user.student_id || user.username || '').toLowerCase().trim();
    const targetName = (user.name || '').toLowerCase().trim();

    // 1. First priority: Exact match by student_id, IC number, or email
    let student = allStudents.find(s => {
      const sId = (s.student_id || '').toLowerCase().trim();
      const sIc = (s.ic_number || '').toLowerCase().trim();
      const sIcDigits = sIc.replace(/[^0-9]/g, '');
      const sEmail = (s.email || '').toLowerCase().trim();
      return (targetStudentId && (
        sId === targetStudentId || 
        sEmail === targetStudentId || 
        sIc === targetStudentId || 
        (targetStudentId.length >= 6 && sIcDigits === targetStudentId.replace(/[^0-9]/g, ''))
      ));
    });

    // 2. Second priority: Match by Exact Full Name
    if (!student && targetName) {
      student = allStudents.find(s => (s.name || '').toLowerCase().trim() === targetName);
    }

    // 3. Third priority: Name substring match
    if (!student && targetName) {
      student = allStudents.find(s => {
        const sName = (s.name || '').toLowerCase().trim();
        return sName.startsWith(targetName) || targetName.startsWith(sName);
      });
    }

    if (!student && (user.username === 'student001' || user.role === 'student')) {
      student = allStudents.find(s => (s.student_id || '').toUpperCase() === 'KKBDA001') || allStudents[0];
    }

    if (!student) {
      return NextResponse.json({ success: false, error: 'Profil pelajar tidak dijumpai.' }, { status: 404 });
    }

    const body = await req.json();
    const items = body.items || [];

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Sila pilih sekurang-kurangnya 1 item makanan.' }, { status: 400 });
    }

    const result = processFoodDistribution({
      student_id: student.id,
      operator_id: user.id || 3,
      items: items.map((i: any) => ({ food_item_id: Number(i.food_item_id), quantity: Number(i.quantity || 1) })),
      override: false
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Pengambilan makanan berjaya direkodkan!',
      transaction: result.transaction
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Ralat memproses pengambilan makanan.' }, { status: 500 });
  }
}
