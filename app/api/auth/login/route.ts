import { NextResponse, type NextRequest } from "next/server";
import { findUserByEmail, setSessionCookie, verifyPassword } from "@/lib/auth/session";
import { errorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  try {
    rateLimit(request, "login");
    const body = loginSchema.parse(await request.json());
    const user = await findUserByEmail(body.email);

    if (!user || !(await verifyPassword(body.password, user.password_hash))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
    await setSessionCookie(response, user);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
