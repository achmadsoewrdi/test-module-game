import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { listModules, createModule } from "@/lib/services/module-service";

export async function GET() {
  try {
    const modules = await listModules();
    return NextResponse.json({ success: true, data: modules });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, slug, description } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { success: false, error: "Title dan Slug wajib diisi." },
        { status: 400 }
      );
    }

    const created = await createModule({
      title,
      slug,
      description,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
