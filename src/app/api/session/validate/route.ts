import { NextResponse } from 'next/server';
import { getSession } from '../../../../common/withSession';

export async function GET() {
  try {
    const session = await getSession();

    if (!session.user) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      user: {
        _id: session.user._id,
        email: session.user.email,
        name: session.user.name,
      },
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Session validation failed' },
      { status: 500 }
    );
  }
}
