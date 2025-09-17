import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { employeeId } = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Obtener credenciales usando la función de la base de datos
    const { data, error } = await supabase.rpc('get_employee_credentials', {
      employee_id_param: employeeId
    });

    if (error) {
      console.error('Error getting credentials:', error);
      return NextResponse.json(
        { error: 'Error getting credentials' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No credentials found for this employee' },
        { status: 404 }
      );
    }

    const credentials = data[0];

    return NextResponse.json({
      success: true,
      credentials: {
        username: credentials.username,
        password: credentials.password
      }
    });

  } catch (error) {
    console.error('Error in get-credentials API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
