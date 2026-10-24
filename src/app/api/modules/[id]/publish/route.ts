import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { publishModuleVersion } from "@/lib/services/module-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { versionId, lessonId } = body;

    if (!versionId) {
      return NextResponse.json(
        { success: false, error: "versionId wajib diisi." },
        { status: 400 }
      );
    }

    await publishModuleVersion({
      moduleId: id,
      versionId,
      lessonId,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, message: "Modul berhasil di-publish." });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
